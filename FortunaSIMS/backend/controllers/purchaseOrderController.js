
const pool = require("../config/db");

// =====================================================
// GET: PURCHASE ORDER LIST
// =====================================================
exports.getPurchaseOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM purchase_orders
      ORDER BY created_at DESC NULLS LAST
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get PO List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Purchase Orders",
    });
  }
};

// =====================================================
// GET: PURCHASE ORDER DETAILS
// Header + Items + Approvals + Delivery + Taxes + Terms
// =====================================================
exports.getPurchaseOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const poResult = await pool.query(
      `SELECT * FROM purchase_orders WHERE po_id = $1`,
      [id]
    );

    if (!poResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const [
      itemsResult,
      approvalsResult,
      deliveryResult,
      taxesResult,
      termsResult,
    ] = await Promise.all([
      pool.query(
        `SELECT * FROM purchase_order_items
         WHERE po_id = $1
         ORDER BY po_item_id`,
        [id]
      ),
      pool.query(
        `SELECT * FROM po_approvals
         WHERE po_id = $1
         ORDER BY level, approval_date`,
        [id]
      ),
      pool.query(
        `SELECT * FROM po_delivery
         WHERE po_id = $1
         ORDER BY delivery_id
         LIMIT 1`,
        [id]
      ),
      pool.query(
        `SELECT * FROM po_taxes
         WHERE po_id = $1
         ORDER BY tax_id
         LIMIT 1`,
        [id]
      ),
      pool.query(
        `SELECT * FROM po_terms
         WHERE po_id = $1
         ORDER BY term_id
         LIMIT 1`,
        [id]
      ),
    ]);

    const po = poResult.rows[0];
    const delivery = deliveryResult.rows[0] || null;
    const taxes = taxesResult.rows[0] || null;
    const terms = termsResult.rows[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        ...po,
        items: itemsResult.rows,
        approvals: approvalsResult.rows,

        delivery,
        taxes,
        terms,

        // Fields used by PO form
        delivery_location:
          delivery?.warehouse_id ?? po.delivery_warehouse ?? "",
        delivery_address: delivery?.delivery_address ?? "",
        incoterms: delivery?.incoterms ?? "",
        freight_responsibility:
          delivery?.freight_responsibility ?? "",
        delivery_schedule: delivery?.delivery_schedule ?? "",
        packing_instructions:
          delivery?.packing_instructions ?? "",

        gst_percentage: taxes?.gst_percentage ?? "",
        cgst_amount: taxes?.cgst_amount ?? 0,
        sgst_amount: taxes?.sgst_amount ?? 0,
        igst_amount: taxes?.igst_amount ?? 0,
        freight_charges: taxes?.freight_charges ?? 0,
        other_charges: taxes?.other_charges ?? 0,

        warranty_terms: terms?.warranty_terms ?? "",
        penalty_clause: terms?.penalty_clause ?? false,
        liquidated_damages:
          terms?.liquidated_damages ?? "",
        cancellation_terms:
          terms?.cancellation_terms ?? "",
        governing_law: terms?.governing_law ?? "",
        dispute_resolution:
          terms?.dispute_resolution ?? "",
      },
    });
  } catch (error) {
    console.error("Get PO Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Purchase Order details",
    });
  }
};

// =====================================================
// HELPER: SAVE PO DELIVERY
// Does not assume UNIQUE(po_id) constraint.
// =====================================================
async function savePODelivery(client, poId, data) {
  if (!data) return;

  const existing = await client.query(
    `SELECT delivery_id
     FROM po_delivery
     WHERE po_id = $1
     ORDER BY delivery_id
     LIMIT 1`,
    [poId]
  );

  const values = [
    data.warehouse_id ?? data.delivery_location ?? null,
    data.delivery_address ?? null,
    data.incoterms ?? null,
    data.freight_responsibility ?? null,
    data.delivery_schedule ?? null,
    data.packing_instructions ?? null,
  ];

  if (existing.rows.length) {
    await client.query(
      `UPDATE po_delivery
       SET warehouse_id = $1,
           delivery_address = $2,
           incoterms = $3,
           freight_responsibility = $4,
           delivery_schedule = $5,
           packing_instructions = $6
       WHERE delivery_id = $7`,
      [...values, existing.rows[0].delivery_id]
    );
  } else {
    await client.query(
      `INSERT INTO po_delivery (
        po_id,
        warehouse_id,
        delivery_address,
        incoterms,
        freight_responsibility,
        delivery_schedule,
        packing_instructions
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [poId, ...values]
    );
  }
}

// =====================================================
// HELPER: SAVE PO TAXES
// =====================================================
async function savePOTaxes(client, poId, data) {
  if (!data) return;

  const existing = await client.query(
    `SELECT tax_id
     FROM po_taxes
     WHERE po_id = $1
     ORDER BY tax_id
     LIMIT 1`,
    [poId]
  );

  const values = [
    data.gst_percentage === ""
      ? null
      : data.gst_percentage ?? null,
    Number(data.cgst_amount || 0),
    Number(data.sgst_amount || 0),
    Number(data.igst_amount || 0),
    Number(data.freight_charges || 0),
    Number(data.other_charges || 0),
  ];

  if (existing.rows.length) {
    await client.query(
      `UPDATE po_taxes
       SET gst_percentage = $1,
           cgst_amount = $2,
           sgst_amount = $3,
           igst_amount = $4,
           freight_charges = $5,
           other_charges = $6
       WHERE tax_id = $7`,
      [...values, existing.rows[0].tax_id]
    );
  } else {
    await client.query(
      `INSERT INTO po_taxes (
        po_id,
        gst_percentage,
        cgst_amount,
        sgst_amount,
        igst_amount,
        freight_charges,
        other_charges
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [poId, ...values]
    );
  }
}

// =====================================================
// HELPER: SAVE PO TERMS
// =====================================================
async function savePOTerms(client, poId, data) {
  if (!data) return;

  const existing = await client.query(
    `SELECT term_id
     FROM po_terms
     WHERE po_id = $1
     ORDER BY term_id
     LIMIT 1`,
    [poId]
  );

  const values = [
    data.warranty_terms ?? null,
    Boolean(data.penalty_clause),
    data.liquidated_damages === ""
      ? null
      : data.liquidated_damages ?? null,
    data.cancellation_terms ?? null,
    data.governing_law ?? null,
    data.dispute_resolution ?? null,
  ];

  if (existing.rows.length) {
    await client.query(
      `UPDATE po_terms
       SET warranty_terms = $1,
           penalty_clause = $2,
           liquidated_damages = $3,
           cancellation_terms = $4,
           governing_law = $5,
           dispute_resolution = $6
       WHERE term_id = $7`,
      [...values, existing.rows[0].term_id]
    );
  } else {
    await client.query(
      `INSERT INTO po_terms (
        po_id,
        warranty_terms,
        penalty_clause,
        liquidated_damages,
        cancellation_terms,
        governing_law,
        dispute_resolution
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [poId, ...values]
    );
  }
}

// =====================================================
// POST: CREATE PURCHASE ORDER
// Saves Header + Items + Delivery + Taxes + Terms
// =====================================================
exports.createPurchaseOrder = async (req, res) => {
  let client;

  try {
    const body = req.body || {};

    const {
      po_number,
      po_date,
      rfq_id,
      pr_id,
      vendor_id,
      vendor_name,
      buyer,
      department,
      currency,
      priority,
      delivery_warehouse,
      approval_required,
      current_approval_level,
      created_by,
      items = [],
    } = body;

    if (!vendor_id || !vendor_name) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID and Vendor Name are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one PO item is required",
      });
    }

    for (const item of items) {
      const qty = Number(item.qty ?? item.ordered_qty);
      const price = Number(item.unit_price);

      if (
        !item.item_id ||
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each item requires item_id, positive quantity and valid unit price",
        });
      }
    }

    const totalItems = items.length;

    const lineTotal = items.reduce((sum, item) => {
      return (
        sum +
        Number(item.qty ?? item.ordered_qty) *
          Number(item.unit_price)
      );
    }, 0);

    const totalValue =
      body.total_value != null
        ? Number(body.total_value)
        : body.total_po_value != null
        ? Number(body.total_po_value)
        : lineTotal;

    if (!Number.isFinite(totalValue) || totalValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Purchase Order total value",
      });
    }

    const generatedPoNumber =
      po_number ||
      `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    client = await pool.connect();
    await client.query("BEGIN");

    const poResult = await client.query(
      `INSERT INTO purchase_orders (
        po_number,
        po_date,
        rfq_id,
        pr_id,
        vendor_id,
        vendor_name,
        buyer,
        department,
        currency,
        total_items,
        total_value,
        priority,
        status,
        delivery_warehouse,
        approval_required,
        current_approval_level,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17
      )
      RETURNING *`,
      [
        generatedPoNumber,
        po_date || null,
        rfq_id || null,
        pr_id || null,
        String(vendor_id),
        vendor_name,
        buyer || null,
        department || null,
        currency || "INR",
        totalItems,
        totalValue,
        priority || "Normal",
        "Draft",
        delivery_warehouse || body.delivery_location || null,
        approval_required ?? false,
        current_approval_level ?? 0,
        created_by || null,
      ]
    );

    const po = poResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_order_items (
          po_id,
          item_id,
          description,
          uom,
          qty,
          unit_price,
          delivery_date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          po.po_id,
          item.item_id,
          item.description || item.item_description || null,
          item.uom || null,
          Number(item.qty ?? item.ordered_qty),
          Number(item.unit_price),
          item.delivery_date || null,
        ]
      );
    }

    const deliveryData = body.delivery || body;
    const taxesData = body.taxes || body;
    const termsData = body.terms || body;

    if (
      body.delivery ||
      body.delivery_location !== undefined ||
      body.delivery_address !== undefined ||
      body.incoterms !== undefined ||
      body.delivery_schedule !== undefined ||
      body.packing_instructions !== undefined
    ) {
      await savePODelivery(client, po.po_id, deliveryData);
    }

    if (
      body.taxes ||
      body.gst_percentage !== undefined ||
      body.cgst_amount !== undefined ||
      body.sgst_amount !== undefined ||
      body.igst_amount !== undefined ||
      body.freight_charges !== undefined ||
      body.other_charges !== undefined
    ) {
      await savePOTaxes(client, po.po_id, taxesData);
    }

    if (
      body.terms ||
      body.warranty_terms !== undefined ||
      body.penalty_clause !== undefined ||
      body.liquidated_damages !== undefined ||
      body.cancellation_terms !== undefined ||
      body.governing_law !== undefined ||
      body.dispute_resolution !== undefined
    ) {
      await savePOTerms(client, po.po_id, termsData);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Purchase Order created successfully",
      data: po,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Create PO rollback error:", rollbackError);
      }
    }

    console.error("Create PO Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Purchase Order",
      error:
        process.env.NODE_ENV !== "production"
          ? error.message
          : undefined,
    });
  } finally {
    if (client) client.release();
  }
};

// =====================================================
// PUT: UPDATE DRAFT PURCHASE ORDER
// Updates Header + Items + Delivery + Taxes + Terms
// Only Draft POs can be updated.
// =====================================================
exports.updatePurchaseOrder = async (req, res) => {
  let client;

  try {
    const { id } = req.params;
    const body = req.body || {};

    const {
      po_date,
      rfq_id,
      pr_id,
      vendor_id,
      vendor_name,
      buyer,
      department,
      currency,
      priority,
      delivery_warehouse,
      items,
    } = body;

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one PO item is required",
        });
      }

      for (const item of items) {
        const qty = Number(item.qty ?? item.ordered_qty);
        const price = Number(item.unit_price);

        if (
          !item.item_id ||
          !Number.isFinite(qty) ||
          qty <= 0 ||
          !Number.isFinite(price) ||
          price < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid PO item. Check item, quantity and unit price.",
          });
        }
      }
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const existingResult = await client.query(
      `SELECT *
       FROM purchase_orders
       WHERE po_id = $1
       FOR UPDATE`,
      [id]
    );

    if (!existingResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const existingPO = existingResult.rows[0];

    if (existingPO.status !== "Draft") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          `Only Draft POs can be updated. Current status: ${existingPO.status}`,
      });
    }

    // Update only fields explicitly supplied by the client. This preserves
    // omitted values while allowing an explicit null to clear a nullable field.
    const headerFields = [
      ["po_date", po_date],
      ["rfq_id", rfq_id],
      ["pr_id", pr_id],
      ["vendor_id", vendor_id],
      ["vendor_name", vendor_name],
      ["buyer", buyer],
      ["department", department],
      ["currency", currency],
      ["priority", priority],
      ["delivery_warehouse", delivery_warehouse !== undefined ? delivery_warehouse : body.delivery_location],
    ];
    const suppliedHeaderFields = headerFields.filter(([key, value]) =>
      key === "delivery_warehouse"
        ? delivery_warehouse !== undefined || body.delivery_location !== undefined
        : Object.prototype.hasOwnProperty.call(body, key)
    );
    if (suppliedHeaderFields.length) {
      const setClauses = suppliedHeaderFields.map(([key], index) => `${key} = $${index + 1}`);
      const values = suppliedHeaderFields.map(([, value]) => value === "" ? null : value);
      values.push(id);
      await client.query(
        `UPDATE purchase_orders SET ${setClauses.join(", ")} WHERE po_id = $${values.length}`,
        values
      );
    }

    // Replace items only when the request includes items.
    if (items !== undefined) {
      await client.query(
        `DELETE FROM purchase_order_items WHERE po_id = $1`,
        [id]
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_order_items (
            po_id,
            item_id,
            description,
            uom,
            qty,
            unit_price,
            delivery_date
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            id,
            item.item_id,
            item.description || item.item_description || null,
            item.uom || null,
            Number(item.qty ?? item.ordered_qty),
            Number(item.unit_price),
            item.delivery_date || null,
          ]
        );
      }
    }

    // Recalculate totals from persisted items when items were supplied.
    const totalsResult = await client.query(
      `SELECT
         COUNT(*)::integer AS total_items,
         COALESCE(SUM(qty * unit_price), 0) AS line_total
       FROM purchase_order_items
       WHERE po_id = $1`,
      [id]
    );

    const totalValue =
      body.total_value != null
        ? Number(body.total_value)
        : body.total_po_value != null
        ? Number(body.total_po_value)
        : Number(totalsResult.rows[0].line_total || 0);

    await client.query(
      `UPDATE purchase_orders
       SET total_items = $1,
           total_value = $2
       WHERE po_id = $3`,
      [
        Number(totalsResult.rows[0].total_items || 0),
        totalValue,
        id,
      ]
    );

    // Update child records only when the corresponding section is sent.
    const deliveryData = body.delivery || body;
    const taxesData = body.taxes || body;
    const termsData = body.terms || body;

    if (
      body.delivery ||
      body.delivery_location !== undefined ||
      body.delivery_address !== undefined ||
      body.incoterms !== undefined ||
      body.freight_responsibility !== undefined ||
      body.delivery_schedule !== undefined ||
      body.packing_instructions !== undefined
    ) {
      await savePODelivery(client, id, deliveryData);
    }

    if (
      body.taxes ||
      body.gst_percentage !== undefined ||
      body.cgst_amount !== undefined ||
      body.sgst_amount !== undefined ||
      body.igst_amount !== undefined ||
      body.freight_charges !== undefined ||
      body.other_charges !== undefined
    ) {
      await savePOTaxes(client, id, taxesData);
    }

    if (
      body.terms ||
      body.warranty_terms !== undefined ||
      body.penalty_clause !== undefined ||
      body.liquidated_damages !== undefined ||
      body.cancellation_terms !== undefined ||
      body.governing_law !== undefined ||
      body.dispute_resolution !== undefined
    ) {
      await savePOTerms(client, id, termsData);
    }

    const updatedPO = await client.query(
      `SELECT * FROM purchase_orders WHERE po_id = $1`,
      [id]
    );

    const [
      updatedItems,
      updatedApprovals,
      updatedDelivery,
      updatedTaxes,
      updatedTerms,
    ] = await Promise.all([
      client.query(
        `SELECT * FROM purchase_order_items
         WHERE po_id = $1
         ORDER BY po_item_id`,
        [id]
      ),
      client.query(
        `SELECT * FROM po_approvals
         WHERE po_id = $1
         ORDER BY level, approval_date`,
        [id]
      ),
      client.query(
        `SELECT * FROM po_delivery
         WHERE po_id = $1
         ORDER BY delivery_id
         LIMIT 1`,
        [id]
      ),
      client.query(
        `SELECT * FROM po_taxes
         WHERE po_id = $1
         ORDER BY tax_id
         LIMIT 1`,
        [id]
      ),
      client.query(
        `SELECT * FROM po_terms
         WHERE po_id = $1
         ORDER BY term_id
         LIMIT 1`,
        [id]
      ),
    ]);

    await client.query("COMMIT");

    const po = updatedPO.rows[0];
    const delivery = updatedDelivery.rows[0] || null;
    const taxes = updatedTaxes.rows[0] || null;
    const terms = updatedTerms.rows[0] || null;

    return res.status(200).json({
      success: true,
      message: "Draft Purchase Order updated successfully",
      data: {
        ...po,
        items: updatedItems.rows,
        approvals: updatedApprovals.rows,
        delivery,
        taxes,
        terms,

        delivery_location:
          delivery?.warehouse_id ?? po.delivery_warehouse ?? "",
        delivery_address: delivery?.delivery_address ?? "",
        incoterms: delivery?.incoterms ?? "",
        freight_responsibility:
          delivery?.freight_responsibility ?? "",
        delivery_schedule: delivery?.delivery_schedule ?? "",
        packing_instructions:
          delivery?.packing_instructions ?? "",

        gst_percentage: taxes?.gst_percentage ?? "",
        cgst_amount: taxes?.cgst_amount ?? 0,
        sgst_amount: taxes?.sgst_amount ?? 0,
        igst_amount: taxes?.igst_amount ?? 0,
        freight_charges: taxes?.freight_charges ?? 0,
        other_charges: taxes?.other_charges ?? 0,

        warranty_terms: terms?.warranty_terms ?? "",
        penalty_clause: terms?.penalty_clause ?? false,
        liquidated_damages:
          terms?.liquidated_damages ?? "",
        cancellation_terms:
          terms?.cancellation_terms ?? "",
        governing_law: terms?.governing_law ?? "",
        dispute_resolution:
          terms?.dispute_resolution ?? "",
      },
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Update PO rollback error:", rollbackError);
      }
    }

    console.error("Update PO Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Purchase Order",
      error:
        process.env.NODE_ENV !== "production"
          ? error.message
          : undefined,
    });
  } finally {
    if (client) client.release();
  }
};

// =====================================================
// HELPER: GET PO APPROVAL CONFIGURATION
// =====================================================
async function getPOApprovalConfig(client, po) {
  const result = await client.query(
    `SELECT *
     FROM approval_workflow_config
     WHERE document_type = 'PO'
       AND is_active = TRUE
       AND level = 1
       AND min_amount <= $1
       AND (max_amount IS NULL OR max_amount >= $1)
       AND (department IS NULL OR department = $2)
     ORDER BY level ASC
     LIMIT 1`,
    [Number(po.total_value || 0), po.department || null]
  );

  return result.rows[0] || null;
}

// =====================================================
// POST: SUBMIT DRAFT PO FOR APPROVAL
// =====================================================
exports.submitPurchaseOrderForApproval = async (req, res) => {
  let client;

  try {
    const { id } = req.params;

    client = await pool.connect();
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT *
       FROM purchase_orders
       WHERE po_id = $1
       FOR UPDATE`,
      [id]
    );

    if (!poResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const po = poResult.rows[0];

    if (po.status !== "Draft") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          `Only Draft POs can be submitted. Current status: ${po.status}`,
      });
    }

    const config = await getPOApprovalConfig(client, po);

    if (!config) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "No active PO approval workflow found. Configure Procurement Manager approval first.",
      });
    }

    const updated = await client.query(
      `UPDATE purchase_orders
       SET status = 'Pending Approval',
           approval_required = TRUE,
           current_approval_level = 1
       WHERE po_id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Purchase Order submitted for approval",
      data: updated.rows[0],
      approval: {
        level: 1,
        approver_role: config.approver_role,
      },
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Submit PO rollback error:", rollbackError);
      }
    }

    console.error("Submit PO for Approval Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit Purchase Order for approval",
    });
  } finally {
    if (client) client.release();
  }
};

// =====================================================
// POST: APPROVE / REJECT PURCHASE ORDER
// =====================================================
exports.approveOrRejectPurchaseOrder = async (req, res) => {
  let client;

  try {
    const { id } = req.params;
    const { decision, remarks, approver_id } = req.body || {};

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be Approved or Rejected",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT *
       FROM purchase_orders
       WHERE po_id = $1
       FOR UPDATE`,
      [id]
    );

    if (!poResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const po = poResult.rows[0];

    if (
      po.status !== "Pending Approval" ||
      !po.approval_required
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "This PO is not currently pending approval",
      });
    }

    const config = await getPOApprovalConfig(client, po);

    if (!config) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Active PO approval workflow configuration was not found",
      });
    }

    const approverId = String(
      approver_id ||
      req.user?.user_id ||
      config.approver_role ||
      ""
    ).trim();

    if (!approverId) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Approver ID is required",
      });
    }

    const approvalResult = await client.query(
      `INSERT INTO po_approvals (
        po_id,
        level,
        approver_id,
        decision,
        remarks,
        approval_date
      )
      VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        po.po_id,
        config.level,
        approverId,
        decision,
        remarks?.trim() || null,
      ]
    );

    const updatedResult = await client.query(
      `UPDATE purchase_orders
       SET status = $1,
           approval_required = TRUE,
           current_approval_level = $2
       WHERE po_id = $3
       RETURNING *`,
      [decision, config.level, po.po_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        `Purchase Order ${decision.toLowerCase()} successfully`,
      data: updatedResult.rows[0],
      approval: approvalResult.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("PO Approval rollback error:", rollbackError);
      }
    }

    console.error("Approve/Reject PO Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save Purchase Order approval",
    });
  } finally {
    if (client) client.release();
  }
};

// =====================================================
// POST: ISSUE APPROVED PO TO VENDOR
// =====================================================
exports.issuePurchaseOrderToVendor = async (req, res) => {
  let client;

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Purchase Order ID is required",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT *
       FROM purchase_orders
       WHERE po_id = $1
       FOR UPDATE`,
      [id]
    );

    if (!poResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const po = poResult.rows[0];

    if (po.status !== "Approved") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          `Only Approved POs can be issued. Current status: ${po.status}`,
      });
    }

    const updateResult = await client.query(
      `UPDATE purchase_orders
       SET status = 'Issued to Vendor'
       WHERE po_id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Purchase Order issued to vendor successfully",
      data: updateResult.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("PO Issue rollback error:", rollbackError);
      }
    }

    console.error("Issue PO to Vendor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to issue Purchase Order to vendor",
      error:
        process.env.NODE_ENV !== "production"
          ? error.message
          : undefined,
    });
  } finally {
    if (client) client.release();
  }
};

// =====================================================
// DELETE: DELETE DRAFT PURCHASE ORDER
// =====================================================
exports.deleteDraftPurchaseOrder = async (req, res) => {
  let client;

  try {
    const { id } = req.params;

    client = await pool.connect();
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT po_id, po_number, status
       FROM purchase_orders
       WHERE po_id = $1
       FOR UPDATE`,
      [id]
    );

    if (!poResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const po = poResult.rows[0];

    if (po.status !== "Draft") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          `Only Draft POs can be deleted. Current status: ${po.status}`,
      });
    }

    const approvalCheck = await client.query(
      `SELECT 1
       FROM po_approvals
       WHERE po_id = $1
       LIMIT 1`,
      [id]
    );

    if (approvalCheck.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "This PO has approval history and cannot be deleted.",
      });
    }

    // Delete child records before deleting PO header.
    await client.query(
      `DELETE FROM purchase_order_items WHERE po_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM po_delivery WHERE po_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM po_taxes WHERE po_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM po_terms WHERE po_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM purchase_orders WHERE po_id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        `Draft PO ${po.po_number} deleted successfully`,
      data: {
        po_id: po.po_id,
        po_number: po.po_number,
      },
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Delete PO rollback error:", rollbackError);
      }
    }

    console.error("Delete PO Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete Draft Purchase Order",
      error:
        process.env.NODE_ENV !== "production"
          ? error.message
          : undefined,
    });
  } finally {
    if (client) client.release();
  }
};
