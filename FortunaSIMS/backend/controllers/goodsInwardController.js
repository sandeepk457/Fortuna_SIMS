const pool = require("../config/db");
const { randomUUID } = require("crypto");

/* =========================================================
   GOODS INWARD CONTROLLER
   - Preserves GET APIs
   - Create GI from Submitted ASN
   - Allows multiple GI sessions while preventing ASN allocation
     from exceeding submitted ASN shipping quantities
   ========================================================= */

const ALLOWED_RECEIVER_ROLES = ["Receiver", "QC Inspector", "Supervisor"];

const ALLOWED_ID_TABLES = [
  "goods_inward",
  "goods_inward_items",
  "goods_inward_receivers",
  "goods_inward_shipments",
];

async function getNextNumericId(client, tableName) {
  if (!ALLOWED_ID_TABLES.includes(tableName)) {
    throw new Error("Invalid table name for ID generation.");
  }

  const result = await client.query(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${tableName}`
  );

  return result.rows[0].next_id;
}

function generateGIId() {
  return `GI-${randomUUID()}`;
}

function generateGINumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `GI-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function generateShipmentNumber() {
  return `SHIP-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function isValidUUID(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function asPositiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function asNonNegativeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/* =========================================================
   GET /api/goods-inward
   ========================================================= */

exports.getGoodsInwards = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT gi.*,
              COUNT(DISTINCT gii.id)::int AS total_items,
              COALESCE(SUM(gii.expected_qty), 0) AS expected_total_qty,
              COALESCE(SUM(gii.received_qty), 0) AS received_total_qty
       FROM goods_inward gi
       LEFT JOIN goods_inward_items gii ON gii.gi_id = gi.gi_id
       GROUP BY gi.id
       ORDER BY gi.created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Goods Inward List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Goods Inward records.",
    });
  }
};

/* =========================================================
   GET /api/goods-inward/users
   ========================================================= */

exports.getAssignableUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_id, name, email, phone, department, role, status
       FROM user_master
       WHERE LOWER(COALESCE(status, '')) = 'active'
       ORDER BY name`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Goods Inward Assignable Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active users.",
    });
  }
};

/* =========================================================
   GET /api/goods-inward/:id
   ========================================================= */

exports.getGoodsInwardById = async (req, res) => {
  const key = req.params.id;

  try {
    const headerResult = await pool.query(
      `SELECT *
       FROM goods_inward
       WHERE gi_id = $1 OR gi_no = $1
       LIMIT 1`,
      [key]
    );

    if (!headerResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Goods Inward record not found.",
      });
    }

    const header = headerResult.rows[0];

    const [itemsResult, receiversResult, shipmentsResult] = await Promise.all([
      pool.query(
        `SELECT *
         FROM goods_inward_items
         WHERE gi_id = $1
         ORDER BY id`,
        [header.gi_id]
      ),

      pool.query(
        `SELECT gir.*,
                um.email,
                um.phone,
                um.department,
                um.role AS user_role,
                um.status AS user_status
         FROM goods_inward_receivers gir
         LEFT JOIN user_master um ON um.id = gir.user_id
         WHERE gir.gi_id = $1
         ORDER BY gir.id`,
        [header.gi_id]
      ),

      pool.query(
        `SELECT *
         FROM goods_inward_shipments
         WHERE gi_id = $1
         ORDER BY id`,
        [header.gi_id]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        header,
        items: itemsResult.rows,
        receivers: receiversResult.rows,
        shipments: shipmentsResult.rows,
      },
    });
  } catch (error) {
    console.error("Goods Inward Detail Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Goods Inward details.",
    });
  }
};

/* =========================================================
   POST /api/goods-inward
   CREATE GOODS INWARD FROM SUBMITTED ASN
   ========================================================= */

    // GET GOODS INWARD LIST
exports.getGoodsInwards = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT gi.*,
              COUNT(DISTINCT gii.id)::int AS total_items,
              COALESCE(SUM(gii.expected_qty), 0) AS expected_total_qty,
              COALESCE(SUM(gii.received_qty), 0) AS received_total_qty
       FROM goods_inward gi
       LEFT JOIN goods_inward_items gii ON gii.gi_id = gi.gi_id
       GROUP BY gi.id
       ORDER BY gi.created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Goods Inward List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Goods Inward records.",
    });
  }
};

// GET SUBMITTED ASNs ONLY WITH ASN ITEMS
exports.getEligibleASNs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          a.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ai.id,
                'asnItemId', ai.asn_item_id,
                'itemId', ai.item_id,
                'sku', ai.item_id,
                'description', ai.item_description,
                'uom', ai.uom,
                'orderedQty', ai.ordered_qty,
                'previouslyAsnQty', ai.previously_asn_qty,
                'shippingQty', ai.shipping_qty,
                'deliveryDate', ai.delivery_date
              )
              ORDER BY ai.id
            ) FILTER (WHERE ai.id IS NOT NULL),
            '[]'::json
          ) AS items
       FROM asns a
       LEFT JOIN asn_items ai
         ON ai.asn_id = a.id
       WHERE a.status = 'Submitted'
       GROUP BY a.id
       ORDER BY a.created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Eligible ASN List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch eligible ASNs.",
      error: error.message,
    });
  }
};

// GET ACTIVE USERS
exports.getAssignableUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_id, name, email, phone, department, role, status
       FROM user_master
       WHERE LOWER(COALESCE(status, '')) = 'active'
       ORDER BY name`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Goods Inward Assignable Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active users.",
    });
  }
};

// GET GOODS INWARD DETAILS BY ID OR NUMBER
exports.getGoodsInwardById = async (req, res) => {
  const key = req.params.id;

  try {
    const headerResult = await pool.query(
      `SELECT *
       FROM goods_inward
       WHERE gi_id = $1 OR gi_no = $1
       LIMIT 1`,
      [key]
    );

    if (!headerResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Goods Inward record not found.",
      });
    }

    const header = headerResult.rows[0];

    const [itemsResult, receiversResult, shipmentsResult] = await Promise.all([
      pool.query(
        `SELECT *
         FROM goods_inward_items
         WHERE gi_id = $1
         ORDER BY id`,
        [header.gi_id]
      ),

      pool.query(
        `SELECT gir.*,
                um.email,
                um.phone,
                um.department,
                um.role AS user_role,
                um.status AS user_status
         FROM goods_inward_receivers gir
         LEFT JOIN user_master um ON um.id = gir.user_id
         WHERE gir.gi_id = $1
         ORDER BY gir.id`,
        [header.gi_id]
      ),

      pool.query(
        `SELECT *
         FROM goods_inward_shipments
         WHERE gi_id = $1
         ORDER BY id`,
        [header.gi_id]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        header,
        items: itemsResult.rows,
        receivers: receiversResult.rows,
        shipments: shipmentsResult.rows,
      },
    });
  } catch (error) {
    console.error("Goods Inward Detail Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Goods Inward details.",
    });
  }
};


exports.createGoodsInward = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const body = req.body || {};

    const asn_id = body.asn_id;
    const receipt_type = body.receipt_type || "Full";
    const receivers = body.receivers === undefined ? [] : body.receivers;
    const shipment =
      body.shipment && typeof body.shipment === "object"
        ? body.shipment
        : {};
    const item_qc = body.item_qc === undefined ? [] : body.item_qc;
    const requestedItems = body.items === undefined ? null : body.items;

    // -----------------------------------------------------
    // REQUEST VALIDATION
    // -----------------------------------------------------

    if (
      asn_id === undefined ||
      asn_id === null ||
      String(asn_id).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "ASN ID is required.",
      });
    }

    if (!["Full", "Partial"].includes(receipt_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receipt type. Use Full or Partial.",
      });
    }

    if (!Array.isArray(receivers)) {
      return res.status(400).json({
        success: false,
        message: "Receivers must be an array.",
      });
    }

    if (!Array.isArray(item_qc)) {
      return res.status(400).json({
        success: false,
        message: "Item QC configuration must be an array.",
      });
    }

    if (requestedItems !== null && !Array.isArray(requestedItems)) {
      return res.status(400).json({
        success: false,
        message: "GI items must be an array when supplied.",
      });
    }

    // Reject duplicate receiver assignments.
    const receiverIdsInRequest = receivers.map((r) =>
      Number(r?.user_id)
    );

    if (
      receiverIdsInRequest.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver user ID.",
      });
    }

    if (
      new Set(receiverIdsInRequest).size !==
      receiverIdsInRequest.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Duplicate receiver assignments are not allowed.",
      });
    }

    for (const receiver of receivers) {
      if (!ALLOWED_RECEIVER_ROLES.includes(receiver?.role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid receiver role: ${
            receiver?.role || "(missing)"
          }`,
        });
      }
    }

    // -----------------------------------------------------
    // BEGIN TRANSACTION
    // -----------------------------------------------------

    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // Serialize Goods Inward ID generation.
    await client.query(
      "SELECT pg_advisory_xact_lock(927401)"
    );

    // -----------------------------------------------------
    // LOAD & LOCK ASN
    // -----------------------------------------------------

    const asnResult = await client.query(
      `SELECT *
       FROM asns
       WHERE id = $1
       FOR UPDATE`,
      [asn_id]
    );

    if (!asnResult.rows.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "ASN not found.",
      });
    }

    const asn = asnResult.rows[0];

    if (asn.status !== "Submitted") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Only Submitted ASNs can be used for Goods Inward.",
      });
    }

    // -----------------------------------------------------
    // VALIDATE WAREHOUSE UUID
    // -----------------------------------------------------

    if (!isValidUUID(asn.warehouse_id)) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message:
          "ASN warehouse ID is not a valid UUID. Goods Inward cannot be created.",
      });
    }

    // -----------------------------------------------------
    // LOAD ASN ITEMS
    // -----------------------------------------------------

    const asnItemsResult = await client.query(
      `SELECT *
       FROM asn_items
       WHERE asn_id = $1
       ORDER BY id`,
      [asn.id]
    );

    if (!asnItemsResult.rows.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "No items found against this ASN.",
      });
    }

    const asnItems = asnItemsResult.rows;

    // -----------------------------------------------------
    // VALIDATE RECEIVERS
    // -----------------------------------------------------

    const validatedReceivers = [];

    for (const receiver of receivers) {
      const userResult = await client.query(
        `SELECT id, employee_id, name, department, role, status
         FROM user_master
         WHERE id = $1
           AND LOWER(COALESCE(status, '')) = 'active'`,
        [Number(receiver.user_id)]
      );

      if (!userResult.rows.length) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message: `User ${receiver.user_id} is not active or does not exist.`,
        });
      }

      validatedReceivers.push({
        ...userResult.rows[0],
        assignment_role: receiver.role,
      });
    }

    // -----------------------------------------------------
    // VALIDATE QC CONFIGURATION
    // -----------------------------------------------------

    const qcMap = new Map();

    for (const qc of item_qc) {
      const qcItemId = Number(qc?.asn_item_id);

      if (
        !Number.isInteger(qcItemId) ||
        !asnItems.some(
          (item) => Number(item.id) === qcItemId
        )
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message:
            "QC configuration contains an ASN item that does not belong to this ASN.",
        });
      }

      if (qcMap.has(qcItemId)) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message: "Duplicate QC configuration for an ASN item.",
        });
      }

      if (
        qc.qc_required !== undefined &&
        typeof qc.qc_required !== "boolean"
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message: "qc_required must be true or false.",
        });
      }

      qcMap.set(qcItemId, Boolean(qc.qc_required));
    }

    // -----------------------------------------------------
    // CALCULATE ASN ITEM ALLOCATIONS
    // -----------------------------------------------------
    // expected_qty = GI-session allocated quantity.
    // Current UI may not send item-wise quantities.
    // Legacy payload allocates remaining quantities.
    // -----------------------------------------------------

    const allocatedByAsnItem = await client.query(
      `SELECT asn_item_id,
              COALESCE(SUM(expected_qty), 0) AS allocated_qty
       FROM goods_inward_items
       WHERE asn_item_id = ANY($1::bigint[])
       GROUP BY asn_item_id`,
      [asnItems.map((item) => Number(item.id))]
    );

    const allocationMap = new Map(
      allocatedByAsnItem.rows.map((r) => [
        Number(r.asn_item_id),
        Number(r.allocated_qty || 0),
      ])
    );

    // Optional payload format:
    // items: [{ asn_item_id, expected_qty }]
    const requestedAllocationMap = new Map();

    if (requestedItems !== null) {
      for (const entry of requestedItems) {
        const requestedAsnItemId = Number(
          entry?.asn_item_id
        );

        const requestedQty = asNonNegativeNumber(
          entry?.expected_qty
        );

        if (
          !Number.isInteger(requestedAsnItemId) ||
          requestedQty === null ||
          requestedQty <= 0
        ) {
          await client.query("ROLLBACK");
          transactionStarted = false;

          return res.status(400).json({
            success: false,
            message:
              "Each GI item requires a valid asn_item_id and positive expected_qty.",
          });
        }

        if (
          !asnItems.some(
            (item) =>
              Number(item.id) === requestedAsnItemId
          )
        ) {
          await client.query("ROLLBACK");
          transactionStarted = false;

          return res.status(400).json({
            success: false,
            message: `ASN item ${requestedAsnItemId} does not belong to the selected ASN.`,
          });
        }

        if (
          requestedAllocationMap.has(
            requestedAsnItemId
          )
        ) {
          await client.query("ROLLBACK");
          transactionStarted = false;

          return res.status(400).json({
            success: false,
            message: `Duplicate GI allocation for ASN item ${requestedAsnItemId}.`,
          });
        }

        requestedAllocationMap.set(
          requestedAsnItemId,
          requestedQty
        );
      }
    }

    // -----------------------------------------------------
    // BUILD GI ALLOCATION LIST
    // -----------------------------------------------------

    const giAllocations = [];

    for (const asnItem of asnItems) {
      const itemKey = Number(asnItem.id);
      const asnQty = asNonNegativeNumber(
        asnItem.shipping_qty
      );

      if (asnQty === null) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message: `Invalid shipping quantity on ASN item ${asnItem.id}.`,
        });
      }

      const allocatedQty = allocationMap.get(itemKey) || 0;

      const remainingQty = Math.max(
        0,
        Number((asnQty - allocatedQty).toFixed(6))
      );

      if (remainingQty <= 0) continue;

      const expectedQty =
        requestedItems === null
          ? remainingQty
          : requestedAllocationMap.get(itemKey) || 0;

      // Not selected for this partial GI session.
      if (expectedQty <= 0) continue;

      if (expectedQty - remainingQty > 0.000001) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          success: false,
          message: `GI quantity (${expectedQty}) exceeds remaining ASN quantity (${remainingQty}) for item ${asnItem.id}.`,
        });
      }

      const previouslyReceivedResult = await client.query(
        `SELECT COALESCE(SUM(received_qty), 0) AS received_qty
         FROM goods_inward_items
         WHERE asn_item_id = $1`,
        [asnItem.id]
      );

      giAllocations.push({
        asnItem,
        expected_qty: expectedQty,
        previously_received_qty: Number(
          previouslyReceivedResult.rows[0].received_qty || 0
        ),
        qc_required: qcMap.has(itemKey)
          ? qcMap.get(itemKey)
          : false,
      });
    }

    if (!giAllocations.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message:
          "All ASN item quantities are already allocated to Goods Inward sessions.",
      });
    }

        // -----------------------------------------------------
    // GENERATE GI IDENTIFIERS
    // -----------------------------------------------------

    const gi_id = generateGIId();
    const gi_no = generateGINumber();
    const shipment_no = generateShipmentNumber();

    const giHeaderNumericId = await getNextNumericId(
      client,
      "goods_inward"
    );

    const giDate = new Date().toISOString().slice(0, 10);

    // -----------------------------------------------------
    // INSERT GOODS INWARD HEADER
    // -----------------------------------------------------

    const headerInsert = await client.query(
      `INSERT INTO goods_inward (
         id, gi_id, gi_no, gi_date, inward_source, receipt_type,
         warehouse_id, warehouse_name, gate_entry_no, vehicle_type,
         vehicle_no, arrival_time, dc_no, invoice_ref, eway_bill_no,
         staging_area, dock_door, gi_status, qc_status, remarks,
         created_by, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW(),NOW()
       ) RETURNING *`,
      [
        giHeaderNumericId,
        gi_id,
        gi_no,
        giDate,
        "Issued PO",
        receipt_type,
        asn.warehouse_id,
        asn.warehouse_name || null,
        shipment.gate_entry_no || null,
        shipment.vehicle_type || null,
        shipment.vehicle_no || asn.vehicle_number || null,
        shipment.arrival_time || null,
        shipment.dc_no || null,
        asn.invoice_number || null,
        asn.eway_bill_number || null,
        shipment.staging_area || null,
        shipment.dock_door || null,
        "Live",
        "NA",
        asn.remarks || null,
        asPositiveInteger(req.user?.id),
      ]
    );

    const createdHeader = headerInsert.rows[0];

    // -----------------------------------------------------
    // INSERT GOODS INWARD ITEMS
    // -----------------------------------------------------

    const createdItems = [];

    for (const allocation of giAllocations) {
      const asnItem = allocation.asnItem;

      const giItemNumericId = await getNextNumericId(
        client,
        "goods_inward_items"
      );

      const itemQCStatus = allocation.qc_required
        ? "Pending"
        : "NA";

      const itemInsert = await client.query(
        `INSERT INTO goods_inward_items (
           id, gi_id, po_item_id, asn_item_id, item_id, sku,
           item_description, uom, expected_qty, previously_received_qty,
           received_qty, over_qty, short_qty, qc_required, qc_status,
           over_action, qc_remarks, created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,0,0,$11,$12,NULL,NULL,NOW(),NOW()
         ) RETURNING *`,
        [
          giItemNumericId,
          gi_id,
          asnItem.po_item_id,
          asnItem.id,
          asnItem.item_id,
          asnItem.item_id,
          asnItem.item_description,
          asnItem.uom,
          allocation.expected_qty,
          allocation.previously_received_qty,
          allocation.qc_required,
          itemQCStatus,
        ]
      );

      createdItems.push(itemInsert.rows[0]);
    }

    // -----------------------------------------------------
    // INSERT RECEIVER ASSIGNMENTS
    // -----------------------------------------------------

    const createdReceivers = [];

    for (const receiver of validatedReceivers) {
      const receiverNumericId = await getNextNumericId(
        client,
        "goods_inward_receivers"
      );

      const receiverInsert = await client.query(
        `INSERT INTO goods_inward_receivers (
           id, gi_id, user_id, employee_id, user_name, role,
           assigned_at, assigned_by, is_active
         ) VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7,TRUE) RETURNING *`,
        [
          receiverNumericId,
          gi_id,
          receiver.id,
          receiver.employee_id,
          receiver.name,
          receiver.assignment_role,
          asPositiveInteger(req.user?.id),
        ]
      );

      createdReceivers.push(receiverInsert.rows[0]);
    }

    // -----------------------------------------------------
    // INSERT SHIPMENT DETAILS
    // -----------------------------------------------------

    const shipmentNumericId = await getNextNumericId(
      client,
      "goods_inward_shipments"
    );

    const shipmentInsert = await client.query(
      `INSERT INTO goods_inward_shipments (
         id, shipment_no, gi_id, asn_db_id, asn_no, appointment_no,
         gate_entry_no, shipment_mode, vehicle_type, vehicle_no,
         transporter, driver_name, driver_mobile, lr_no, seal_no,
         dock_door, staging_area, arrival_time, shipment_status,
         created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW()
       ) RETURNING *`,
      [
        shipmentNumericId,
        shipment_no,
        gi_id,
        asn.id,
        asn.asn_number,
        shipment.appointment_no || null,
        shipment.gate_entry_no || null,
        shipment.shipment_mode || null,
        shipment.vehicle_type || null,
        shipment.vehicle_no || asn.vehicle_number || null,
        asn.transporter || null,
        shipment.driver_name || null,
        shipment.driver_mobile || null,
        shipment.lr_no || asn.lr_awb_number || null,
        shipment.seal_no || null,
        shipment.dock_door || null,
        shipment.staging_area || null,
        shipment.arrival_time || null,
        "Pending",
      ]
    );

    const createdShipment = shipmentInsert.rows[0];

    // -----------------------------------------------------
    // COMMIT TRANSACTION
    // -----------------------------------------------------

    await client.query("COMMIT");
    transactionStarted = false;

    // -----------------------------------------------------
    // SUCCESS RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Goods Inward created successfully.",
      data: {
        header: createdHeader,
        items: createdItems,
        receivers: createdReceivers,
        shipment: createdShipment,
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Goods Inward rollback error:",
          rollbackError
        );
      }
    }

    console.error("Goods Inward Create Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Goods Inward.",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};