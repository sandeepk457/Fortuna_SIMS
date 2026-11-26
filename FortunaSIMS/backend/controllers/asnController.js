const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const ASN_STATUSES = [
  "Draft",
  "Submitted",
  "In Transit",
  "Arrived",
  "Partially Received",
  "Fully Received",
  "Closed",
];

const ALLOWED_HEADER_FIELDS = [
  "asn_date",
  "po_id",
  "po_number",
  "po_date",
  "vendor_id",
  "vendor_name",
  "vendor_address",
  "vendor_gstin",
  "vendor_contact",
  "vendor_email",
  "warehouse_id",
  "warehouse_name",
  "warehouse_address",
  "shipment_date",
  "expected_arrival",
  "delivery_schedule",
  "transporter",
  "vehicle_number",
  "lr_awb_number",
  "shipping_reference",
  "package_count",
  "pallet_count",
  "total_weight",
  "weight_uom",
  "invoice_number",
  "invoice_date",
  "eway_bill_number",
  "packing_list_number",
  "packing_instructions",
  "remarks",
];

const isBlank = (value) =>
  value === undefined || value === null || value === "";

const getErrorMessage = (error) =>
  error.message || "Something went wrong.";

const sendError = (res, error, fallback = "Server error") => {
  console.error("ASN Error:", error);
  return res.status(500).json({
    success: false,
    message: fallback,
    error: getErrorMessage(error),
  });
};

const getHeaderPayload = (body = {}) => {
  const payload = {};

  for (const field of ALLOWED_HEADER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = isBlank(body[field]) ? null : body[field];
    }
  }

  return payload;
};

const validateHeader = (data, isCreate = false) => {
  if (isCreate && isBlank(data.po_id)) {
    return "Purchase Order is required.";
  }

  if (isCreate && isBlank(data.po_number)) {
    return "PO Number is required.";
  }

  if (isCreate && isBlank(data.vendor_name)) {
    return "Vendor Name is required.";
  }

  if (
    data.delivery_schedule &&
    !["Single", "Partial"].includes(data.delivery_schedule)
  ) {
    return "Invalid delivery schedule.";
  }

  if (
    data.weight_uom &&
    !["KG", "TON", "LB"].includes(data.weight_uom)
  ) {
    return "Invalid weight UOM.";
  }

  if (
    data.shipment_date &&
    data.expected_arrival &&
    data.expected_arrival < data.shipment_date
  ) {
    return "Expected Arrival Date cannot be before Shipment Date.";
  }

  if (
    data.total_weight !== null &&
    data.total_weight !== undefined &&
    Number(data.total_weight) < 0
  ) {
    return "Total weight cannot be negative.";
  }

  if (
    !isBlank(data.total_weight) &&
    isBlank(data.weight_uom)
  ) {
    return "Weight UOM is required when total weight is entered.";
  }

  for (const field of ["package_count", "pallet_count"]) {
    if (
      !isBlank(data[field]) &&
      Number(data[field]) < 0
    ) {
      return `${field} cannot be negative.`;
    }
  }

  return null;
};

const getPO = async (client, poId, lock = false) => {
  const result = await client.query(
    `SELECT *
     FROM purchase_orders
     WHERE po_id = $1
     ${lock ? "FOR UPDATE" : ""}`,
    [poId]
  );

  return result.rows[0] || null;
};

const getPOItemRows = async (client, poId) => {
  const result = await client.query(
    `SELECT *
     FROM purchase_order_items
     WHERE po_id = $1`,
    [poId]
  );

  return result.rows;
};

const getPOStatus = (po) => po.status || po.po_status || null;

const getOrderedQty = (item) =>
  Number(item.qty ?? item.ordered_qty ?? item.quantity ?? 0);

const getItemDescription = (item) =>
  item.item_description ||
  item.description ||
  item.item_name ||
  item.product_name ||
  "";

const getItemCode = (item) =>
  item.item_id || item.item_code || item.sku || null;

const getItemUOM = (item) =>
  item.uom || item.uom_code || item.unit || null;

const validateEligiblePO = (po) => {
  if (!po) {
    return "Purchase Order not found.";
  }

  if (getPOStatus(po) !== "Issued to Vendor") {
    return "ASN can only be created against a PO with status Issued to Vendor.";
  }

  return null;
};

const getPreviousASNQty = async (
  client,
  poItemId,
  excludeAsnId = null
) => {
  const result = await client.query(
    `SELECT COALESCE(SUM(ai.shipping_qty), 0) AS shipped_qty
     FROM asn_items ai
     INNER JOIN asns a ON a.id = ai.asn_id
     WHERE ai.po_item_id = $1
       AND a.status = 'Submitted'
       AND ($2::BIGINT IS NULL OR a.id <> $2)`,
    [poItemId, excludeAsnId]
  );

  return Number(result.rows[0].shipped_qty || 0);
};

const validateAndReplaceItems = async (
  client,
  asnDbId,
  poId,
  items,
  excludeAsnId = null,
  requirePositiveQty = false
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one PO item is required.");
  }

  const poItems = await getPOItemRows(client, poId);

  const poItemMap = new Map(
    poItems.map((item) => [
      String(item.po_item_id),
      item,
    ])
  );

  const seen = new Set();

  for (const item of items) {
    const poItemId = String(item.po_item_id || "");

    if (!poItemId || !poItemMap.has(poItemId)) {
      throw new Error(
        "One or more selected items do not belong to this Purchase Order."
      );
    }

    if (seen.has(poItemId)) {
      throw new Error(
        "Duplicate PO items are not allowed in the same ASN."
      );
    }

    seen.add(poItemId);

    const shippingQty = Number(item.shipping_qty);
    const poItem = poItemMap.get(poItemId);
    const orderedQty = getOrderedQty(poItem);

    if (!Number.isFinite(shippingQty) || shippingQty < 0) {
      throw new Error("Shipping quantity must be zero or greater.");
    }

    if (requirePositiveQty && shippingQty <= 0) {
      throw new Error("Shipping quantity must be greater than zero.");
    }

    if (orderedQty <= 0) {
      throw new Error("Invalid ordered quantity found in Purchase Order.");
    }

    const previousQty = await getPreviousASNQty(
      client,
      poItemId,
      excludeAsnId
    );

    if (previousQty + shippingQty > orderedQty) {
      throw new Error(
        `Over-shipment detected for PO item ${poItemId}. Ordered: ${orderedQty}, Already shipped: ${previousQty}, Current ASN: ${shippingQty}.`
      );
    }

    item._ordered_qty = orderedQty;
    item._previously_asn_qty = previousQty;
    item._po_item = poItem;
  }

  await client.query(
    `DELETE FROM asn_items WHERE asn_id = $1`,
    [asnDbId]
  );

  for (const item of items) {
    const poItem = item._po_item;

    await client.query(
      `INSERT INTO asn_items (
        asn_id,
        po_item_id,
        item_id,
        item_description,
        uom,
        ordered_qty,
        previously_asn_qty,
        shipping_qty,
        delivery_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        asnDbId,
        item.po_item_id,
        getItemCode(poItem),
        getItemDescription(poItem),
        getItemUOM(poItem),
        item._ordered_qty,
        item._previously_asn_qty,
        Number(item.shipping_qty),
        item.delivery_date || null,
      ]
    );
  }
};

const insertHistory = async (
  client,
  asnId,
  previousStatus,
  newStatus,
  action,
  remarks,
  user = {}
) => {
  await client.query(
    `INSERT INTO asn_history (
      asn_id,
      previous_status,
      new_status,
      action,
      remarks,
      action_by,
      action_by_name
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      asnId,
      previousStatus,
      newStatus,
      action,
      remarks || null,
      user.user_id || user.id || null,
      user.user_name || user.name || null,
    ]
  );
};

// ======================================================
// GET ASN LIST
// GET /api/asn
// ======================================================

exports.getASNs = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );
    const offset = (pageNumber - 1) * pageSize;

    const values = [];
    const conditions = [];

    if (status) {
      values.push(status);
      conditions.push(`a.status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(
        a.asn_number ILIKE $${values.length}
        OR a.asn_id ILIKE $${values.length}
        OR a.po_number ILIKE $${values.length}
        OR a.vendor_name ILIKE $${values.length}
      )`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const countResult = await pool.query(
      `SELECT COUNT(*)::INT AS total
       FROM asns a
       ${whereClause}`,
      values
    );

    const listValues = [...values, pageSize, offset];

    const result = await pool.query(
      `SELECT
          a.*,
          COUNT(ai.id)::INT AS item_count,
          COALESCE(SUM(ai.shipping_qty), 0) AS total_shipping_qty
       FROM asns a
       LEFT JOIN asn_items ai ON ai.asn_id = a.id
       ${whereClause}
       GROUP BY a.id
       ORDER BY a.created_at DESC
       LIMIT $${listValues.length - 1}
       OFFSET $${listValues.length}`,
      listValues
    );

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(
          countResult.rows[0].total / pageSize
        ),
      },
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch ASNs.");
  }
};


// ======================================================
// GET SINGLE ASN
// GET /api/asn/:id
// ======================================================

exports.getASNById = async (req, res) => {
  try {
    const identifier = req.params.id;

    const isNumeric = /^\d+$/.test(identifier);

    const headerResult = await pool.query(
      isNumeric
        ? `SELECT * FROM asns WHERE id = $1`
        : `SELECT * FROM asns WHERE asn_id = $1 OR asn_number = $1`,
      [identifier]
    );

    if (!headerResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "ASN not found.",
      });
    }

    const asn = headerResult.rows[0];

    const [items, attachments, history] = await Promise.all([
      pool.query(
        `SELECT * FROM asn_items
         WHERE asn_id = $1
         ORDER BY id`,
        [asn.id]
      ),
      pool.query(
        `SELECT * FROM asn_attachments
         WHERE asn_id = $1
         ORDER BY uploaded_at DESC`,
        [asn.id]
      ),
      pool.query(
        `SELECT * FROM asn_history
         WHERE asn_id = $1
         ORDER BY action_at DESC`,
        [asn.id]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        ...asn,
        items: items.rows,
        attachments: attachments.rows.map((file) => ({
  ...file,
  id: file.attachment_id,
  attachment_id: file.attachment_id,
  file_size: file.file_size_bytes,
})),
        history: history.rows,
      },
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch ASN details.");
  }
};


// ======================================================
// GET ELIGIBLE PURCHASE ORDERS
// GET /api/asn/purchase-orders/eligible
// ======================================================

exports.getEligiblePurchaseOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          po.*,
          (
            SELECT COUNT(*)
            FROM purchase_order_items poi
            WHERE poi.po_id = po.po_id
              AND COALESCE(poi.qty, 0) > 0
          )::INT AS item_count
       FROM purchase_orders po
       WHERE po.status = 'Issued to Vendor'
         AND EXISTS (
           SELECT 1
           FROM purchase_order_items poi
           WHERE poi.po_id = po.po_id
             AND COALESCE(poi.qty, 0) >
                 COALESCE(
                   (
                     SELECT SUM(ai.shipping_qty)
                     FROM asn_items ai
                     INNER JOIN asns a ON a.id = ai.asn_id
                     WHERE ai.po_item_id = poi.po_item_id
                       AND a.status = 'Submitted'
                   ),
                   0
                 )
         )
       ORDER BY po.created_at DESC`
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Eligible PO Error:", error);

    return sendError(
      res,
      error,
      "Failed to fetch eligible Purchase Orders."
    );
  }
};


// ======================================================
// GET PURCHASE ORDER DETAILS FOR ASN
// GET /api/asn/purchase-orders/:poId
// ======================================================

exports.getPurchaseOrderForASN = async (req, res) => {
  const client = await pool.connect();

  try {
    const { poId } = req.params;

    const poResult = await client.query(
      `SELECT
         po.*,

         -- Vendor Master
         v.id AS master_vendor_id,
         v.vendor_code AS master_vendor_code,
         v.vendor_name AS master_vendor_name,
         v.contact_person_name AS master_contact_person_name,
         v.contact_phone AS master_contact_phone,
         v.contact_email AS master_contact_email,
         v.registered_address AS master_registered_address,
         v.city AS master_vendor_city,
         v.state AS master_vendor_state,
         v.country AS master_vendor_country,
         v.postal_code AS master_vendor_postal_code,

         -- GSTIN: Vendor Master first, Compliance as fallback
         COALESCE(
           NULLIF(BTRIM(v.gstin), ''),
           (
             SELECT NULLIF(BTRIM(vc.gstin), '')
             FROM vendor_compliance vc
             WHERE vc.vendor_id = v.id
               AND NULLIF(BTRIM(vc.gstin), '') IS NOT NULL
             LIMIT 1
           )
         ) AS master_vendor_gstin,

         -- Warehouse Master
         w.warehouse_id AS master_warehouse_id,
         w.warehouse_code AS master_warehouse_code,
         w.warehouse_name AS master_warehouse_name,
         w.address_line1 AS master_warehouse_address,
         w.city AS master_warehouse_city,
         w.state AS master_warehouse_state,
         w.pincode AS master_warehouse_pincode

       FROM purchase_orders po

       LEFT JOIN LATERAL (
         SELECT vendor.*
         FROM vendors vendor
         WHERE vendor.is_deleted IS NOT TRUE
           AND (
             vendor.id::text = NULLIF(BTRIM(po.vendor_id), '')
             OR vendor.vendor_code = NULLIF(BTRIM(po.vendor_id), '')
             OR LOWER(BTRIM(vendor.vendor_name)) =
                LOWER(BTRIM(COALESCE(po.vendor_name, '')))
           )
         ORDER BY CASE
           WHEN vendor.id::text = NULLIF(BTRIM(po.vendor_id), '') THEN 1
           WHEN vendor.vendor_code = NULLIF(BTRIM(po.vendor_id), '') THEN 2
           ELSE 3
         END
         LIMIT 1
       ) v ON TRUE

       LEFT JOIN LATERAL (
         SELECT compliance.gstin
         FROM vendor_compliance compliance
         WHERE compliance.vendor_id = v.id
           AND NULLIF(BTRIM(compliance.gstin), '') IS NOT NULL
         LIMIT 1
       ) vc ON TRUE

       LEFT JOIN LATERAL (
         SELECT warehouse.*
         FROM warehouses warehouse
         WHERE
           warehouse.warehouse_id::text =
             NULLIF(BTRIM(po.delivery_warehouse), '')
           OR warehouse.warehouse_code =
             NULLIF(BTRIM(po.delivery_warehouse), '')
           OR LOWER(BTRIM(warehouse.warehouse_name)) =
             LOWER(BTRIM(COALESCE(po.delivery_warehouse, '')))
         ORDER BY CASE
           WHEN warehouse.warehouse_id::text =
                NULLIF(BTRIM(po.delivery_warehouse), '') THEN 1
           WHEN warehouse.warehouse_code =
                NULLIF(BTRIM(po.delivery_warehouse), '') THEN 2
           ELSE 3
         END
         LIMIT 1
       ) w ON TRUE

       WHERE po.po_id = $1
       LIMIT 1`,
      [poId]
    );

    const poRow = poResult.rows[0] || null;
    const poError = validateEligiblePO(poRow);

    if (poError) {
      return res.status(poRow ? 400 : 404).json({
        success: false,
        message: poError,
      });
    }

    // Fetch PO items
    const poItems = await getPOItemRows(client, poId);
    const items = [];

    for (const item of poItems) {
      const orderedQty = getOrderedQty(item);

      if (orderedQty <= 0) continue;

      const previouslyAsnQty = await getPreviousASNQty(
        client,
        item.po_item_id
      );

      items.push({
        po_item_id: item.po_item_id,
        item_id: getItemCode(item),
        item_description: getItemDescription(item),
        uom: getItemUOM(item),
        ordered_qty: orderedQty,
        previously_asn_qty: previouslyAsnQty,
        balance_qty: Math.max(
          orderedQty - previouslyAsnQty,
          0
        ),
        delivery_date: item.delivery_date || null,
      });
    }

    // Vendor address
    const vendorAddress = [
      poRow.master_registered_address,
      poRow.master_vendor_city,
      poRow.master_vendor_state,
      poRow.master_vendor_country,
      poRow.master_vendor_postal_code,
    ].filter(Boolean).join(", ");

    // Warehouse address
    const warehouseAddress = [
      poRow.master_warehouse_address,
      poRow.master_warehouse_city,
      poRow.master_warehouse_state,
      poRow.master_warehouse_pincode,
    ].filter(Boolean).join(", ");

    // Preserve existing flattened response fields
    const purchaseOrder = {
      ...poRow,

      vendor_id: poRow.master_vendor_id || poRow.vendor_id || null,
      vendor_name:
        poRow.master_vendor_name || poRow.vendor_name || null,
      vendor_code: poRow.master_vendor_code || null,
      vendor_gstin: poRow.master_vendor_gstin || null,

      vendor_contact: [
        poRow.master_contact_person_name,
        poRow.master_contact_phone,
      ].filter(Boolean).join(" / ") || null,

      vendor_contact_person:
        poRow.master_contact_person_name || null,

      vendor_phone: poRow.master_contact_phone || null,
      vendor_email: poRow.master_contact_email || null,
      vendor_address: vendorAddress || null,

      vendor_city: poRow.master_vendor_city || null,
      vendor_state: poRow.master_vendor_state || null,
      vendor_pincode: poRow.master_vendor_postal_code || null,

      warehouse_id:
        poRow.master_warehouse_id ||
        poRow.delivery_warehouse ||
        null,

      warehouse_name:
        poRow.master_warehouse_name ||
        poRow.delivery_warehouse ||
        null,

      warehouse_code: poRow.master_warehouse_code || null,
      warehouse_address: warehouseAddress || null,
      warehouse_city: poRow.master_warehouse_city || null,
      warehouse_state: poRow.master_warehouse_state || null,
      warehouse_pincode: poRow.master_warehouse_pincode || null,

      // Structured objects for frontend mapping
      vendor: {
        id: poRow.master_vendor_id || poRow.vendor_id || null,
        vendor_code: poRow.master_vendor_code || null,
        vendor_name: poRow.master_vendor_name || poRow.vendor_name || null,
        gstin: poRow.master_vendor_gstin || null,
        contact_person_name:
          poRow.master_contact_person_name || null,
        contact_phone: poRow.master_contact_phone || null,
        contact_email: poRow.master_contact_email || null,
        registered_address: poRow.master_registered_address || null,
        city: poRow.master_vendor_city || null,
        state: poRow.master_vendor_state || null,
        postal_code: poRow.master_vendor_postal_code || null,
      },

      warehouse: {
        warehouse_id:
          poRow.master_warehouse_id ||
          poRow.delivery_warehouse ||
          null,
        warehouse_code: poRow.master_warehouse_code || null,
        warehouse_name: poRow.master_warehouse_name || null,
        address_line1: poRow.master_warehouse_address || null,
        city: poRow.master_warehouse_city || null,
        state: poRow.master_warehouse_state || null,
        pincode: poRow.master_warehouse_pincode || null,
      },
    };

    return res.json({
      success: true,
      data: {
        purchase_order: purchaseOrder,
        vendor: purchaseOrder.vendor,
        warehouse: purchaseOrder.warehouse,
        items,
      },
    });

  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch Purchase Order details."
    );
  } finally {
    client.release();
  }
};

// ======================================================
// CREATE ASN - DRAFT
// POST /api/asn
// ======================================================

exports.createASN = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const header = getHeaderPayload(req.body);
    const items = req.body.items || [];

    const validationError = validateHeader(header, true);

    if (validationError) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const po = await getPO(client, header.po_id, true);
    const poError = validateEligiblePO(po);

    if (poError) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: poError,
      });
    }

    // Prevent accidental duplicate Draft ASN creation for the same PO.
    // Submitted partial ASNs remain allowed; this only prevents duplicate draft retries.
    const existingDraftResult = await client.query(
      `SELECT id, asn_id, asn_number, status
       FROM asns
       WHERE po_id = $1 AND status = 'Draft'
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [header.po_id]
    );

    if (existingDraftResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        code: "ASN_DRAFT_ALREADY_EXISTS",
        message:
          "A Draft ASN already exists for this Purchase Order. Please open and update the existing ASN instead of creating another one.",
        data: existingDraftResult.rows[0],
      });
    }

    const columns = [
      ...Object.keys(header),
      "status",
      "created_by",
      "created_by_name",
    ];

    const values = [
      ...Object.values(header),
      "Draft",
      req.user?.user_id || req.user?.id || null,
      req.user?.user_name || req.user?.name || null,
    ];

    const placeholders = values.map(
      (_, index) => `$${index + 1}`
    );

    const insertResult = await client.query(
      `INSERT INTO asns (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING *`,
      values
    );

    const asn = insertResult.rows[0];

    await validateAndReplaceItems(
      client,
      asn.id,
      header.po_id,
      items
    );

    await insertHistory(
      client,
      asn.id,
      null,
      "Draft",
      "Created",
      "ASN draft created.",
      req.user || {}
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "ASN draft created successfully.",
      data: asn,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(res, error, "Failed to create ASN.");
  } finally {
    client.release();
  }
};


// ======================================================
// UPDATE ASN - DRAFT ONLY
// PUT /api/asn/:id
// ======================================================

exports.updateASN = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    const currentResult = await client.query(
      `SELECT * FROM asns
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (!currentResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "ASN not found.",
      });
    }

    const currentASN = currentResult.rows[0];

    if (currentASN.status !== "Draft") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Only Draft ASN can be updated.",
      });
    }

    const header = getHeaderPayload(req.body);

    const validationError = validateHeader(header, false);

    if (validationError) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const poId = header.po_id || currentASN.po_id;

    if (header.po_id && header.po_id !== currentASN.po_id) {
      const po = await getPO(client, poId, true);
      const poError = validateEligiblePO(po);

      if (poError) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: poError,
        });
      }
    }

    if (Object.keys(header).length > 0) {
      const fields = Object.keys(header);

      const setClause = fields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");

      await client.query(
        `UPDATE asns
         SET ${setClause}
         WHERE id = $${fields.length + 1}`,
        [...Object.values(header), id]
      );
    }

    if (Array.isArray(req.body.items)) {
      await validateAndReplaceItems(
        client,
        id,
        poId,
        req.body.items,
        id
      );
    }

    await insertHistory(
      client,
      id,
      "Draft",
      "Draft",
      "Updated",
      req.body.history_remarks || "ASN draft updated.",
      req.user || {}
    );

    const updatedResult = await client.query(
      `SELECT * FROM asns WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "ASN draft updated successfully.",
      data: updatedResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(res, error, "Failed to update ASN.");
  } finally {
    client.release();
  }
};


// ======================================================
// DELETE ASN - DRAFT ONLY
// DELETE /api/asn/:id
// ======================================================

exports.deleteASN = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    const result = await client.query(
      `SELECT * FROM asns
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "ASN not found.",
      });
    }

    const asn = result.rows[0];

    if (asn.status !== "Draft") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Only Draft ASN can be deleted.",
      });
    }

    // Child tables use ON DELETE RESTRICT.
    // Therefore delete child records before deleting the header.
    await client.query(
      `DELETE FROM asn_items WHERE asn_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM asn_attachments WHERE asn_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM asn_history WHERE asn_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM asns WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Draft ASN deleted successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(res, error, "Failed to delete ASN.");
  } finally {
    client.release();
  }
};


// ======================================================
// SUBMIT ASN
// POST /api/asn/:id/submit
// ======================================================

exports.submitASN = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    const result = await client.query(
      `SELECT * FROM asns
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "ASN not found.",
      });
    }

    const asn = result.rows[0];

    if (asn.status !== "Draft") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Only Draft ASN can be submitted.",
      });
    }

    const po = await getPO(client, asn.po_id, true);
    const poError = validateEligiblePO(po);

    if (poError) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: poError,
      });
    }

    const itemsResult = await client.query(
      `SELECT * FROM asn_items
       WHERE asn_id = $1`,
      [id]
    );

    if (!itemsResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "At least one ASN item is required.",
      });
    }

    const items = itemsResult.rows.map((item) => ({
      po_item_id: item.po_item_id,
      shipping_qty: item.shipping_qty,
      delivery_date: item.delivery_date,
    }));

    // Revalidate cumulative shipment quantities at submission.
    await validateAndReplaceItems(
      client,
      id,
      asn.po_id,
      items,
      id,
      true
    );

    if (!asn.shipment_date) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Shipment Date is required.",
      });
    }

    if (!asn.expected_arrival) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Expected Arrival Date is required.",
      });
    }

    if (!asn.delivery_schedule) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Delivery Schedule is required.",
      });
    }

    if (
      asn.expected_arrival < asn.shipment_date
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "Expected Arrival Date cannot be before Shipment Date.",
      });
    }

    await client.query(
      `UPDATE asns
       SET status = 'Submitted',
           submitted_at = NOW(),
           submitted_by = $1
       WHERE id = $2`,
      [
        req.user?.user_id || req.user?.id || null,
        id,
      ]
    );

    await insertHistory(
      client,
      id,
      "Draft",
      "Submitted",
      "Submitted",
      req.body.remarks || "ASN submitted.",
      req.user || {}
    );

    const updated = await client.query(
      `SELECT * FROM asns WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "ASN submitted successfully.",
      data: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(res, error, "Failed to submit ASN.");
  } finally {
    client.release();
  }
};


// ======================================================
// UPDATE ASN STATUS
// PATCH /api/asn/:id/status
// ======================================================

exports.updateASNStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!ASN_STATUSES.includes(status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invalid ASN status.",
      });
    }

    const result = await client.query(
      `SELECT * FROM asns
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "ASN not found.",
      });
    }

    const asn = result.rows[0];

    if (asn.status === "Draft") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Submit the ASN before changing its status.",
      });
    }

    const allowedTransitions = {
      Submitted: ["In Transit", "Arrived"],
      "In Transit": ["Arrived"],
      Arrived: ["Partially Received", "Fully Received"],
      "Partially Received": [
        "Partially Received",
        "Fully Received",
      ],
      "Fully Received": ["Closed"],
      Closed: [],
    };

    if (
      !allowedTransitions[asn.status]?.includes(status)
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Status cannot change from ${asn.status} to ${status}.`,
      });
    }

    await client.query(
      `UPDATE asns
       SET status = $1
       WHERE id = $2`,
      [status, id]
    );

    await insertHistory(
      client,
      id,
      asn.status,
      status,
      "Status Updated",
      remarks,
      req.user || {}
    );

    const updated = await client.query(
      `SELECT * FROM asns WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "ASN status updated successfully.",
      data: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(
      res,
      error,
      "Failed to update ASN status."
    );
  } finally {
    client.release();
  }
};


// ======================================================
// UPLOAD ASN ATTACHMENT
// POST /api/asn/:id/attachments
// ======================================================

const crypto = require("crypto");

exports.uploadASNAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // Values must match the PostgreSQL CHECK constraint.
    const allowedDocumentTypes = [
      "Invoice",
      "Packing List",
      "E-Way Bill",
      "Transport Document",
      "Other",
    ];

    const requestedDocumentType = String(
      req.body.document_type || ""
    ).trim();

    const documentType = allowedDocumentTypes.includes(
      requestedDocumentType
    )
      ? requestedDocumentType
      : "Other";

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ASN ID.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload.",
      });
    }

    const asnResult = await pool.query(
      `SELECT id, status FROM asns WHERE id = $1`,
      [id]
    );

    if (!asnResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "ASN not found.",
      });
    }

    if (asnResult.rows[0].status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Attachments can only be added to Draft ASN.",
      });
    }

    const fileUrl =
  req.file.path?.startsWith("http")
    ? req.file.path
    : req.file.secure_url?.startsWith("http")
    ? req.file.secure_url
    : `/uploads/${req.file.filename}`;
    const attachmentId = `ASN-ATT-${crypto.randomUUID()}`;

    const result = await pool.query(
      `INSERT INTO asn_attachments (
        attachment_id,
        asn_id,
        document_type,
        file_name,
        file_url,
        mime_type,
        file_size_bytes,
        uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        attachmentId,
        id,
        documentType,
        req.file.originalname,
        fileUrl,
        req.file.mimetype,
        req.file.size,
        req.user?.username || req.user?.email || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "ASN attachment uploaded successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ASN Attachment Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload ASN attachment.",
      error: error.message,
    });
  }
};


/* ======================================================
   DELETE ASN ATTACHMENT
   DELETE /api/asn/:id/attachments/:attachmentId
====================================================== */

exports.deleteASNAttachment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id, attachmentId } = req.params;

    await client.query("BEGIN");

    // Lock ASN + attachment while validating deletion
    const result = await client.query(
      `SELECT
          aa.*,
          a.status AS asn_status
       FROM asn_attachments aa
       INNER JOIN asns a ON a.id = aa.asn_id
       WHERE aa.asn_id = $1
         AND aa.attachment_id = $2
       FOR UPDATE OF aa, a`,
      [id, attachmentId]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "ASN attachment not found.",
      });
    }

    const attachment = result.rows[0];

    // Explicit protection for Create Inward
    if (attachment.asn_status === "Create Inward") {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "Attachments cannot be deleted after Create Inward.",
      });
    }

    // Only Draft ASN attachments may be deleted
    if (attachment.asn_status !== "Draft") {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "Attachments can only be deleted while ASN is in Draft status.",
      });
    }

    // Delete attachment record from database
    await client.query(
      `DELETE FROM asn_attachments
       WHERE asn_id = $1
         AND attachment_id = $2`,
      [id, attachmentId]
    );

    await client.query("COMMIT");

    // Remove physical file from backend/uploads safely
    if (attachment.file_url) {
      try {
        const fileName = path.basename(attachment.file_url);
        const filePath = path.join(__dirname, "..", "uploads", fileName);

        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (fileError) {
        console.error("Physical attachment delete error:", fileError);
      }
    }

    return res.json({
      success: true,
      message: "ASN attachment deleted successfully.",
      attachment_id: attachmentId,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ASN attachment rollback error:", rollbackError);
    }

    console.error("ASN Attachment Delete Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete ASN attachment.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};
