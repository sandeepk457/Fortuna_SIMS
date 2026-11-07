const pool = require("../config/db");

// GET: Purchase Order List
exports.getPurchaseOrders = async (
  _req,
  res
) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM purchase_orders
      ORDER BY created_at DESC NULLS LAST
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Get PO List Error:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch Purchase Orders",
    });
  }
};

// GET: Purchase Order Details
exports.getPurchaseOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const poResult = await pool.query(
      `SELECT * FROM purchase_orders WHERE po_id = $1`,
      [id]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const itemsResult = await pool.query(
      `SELECT * FROM purchase_order_items WHERE po_id = $1`,
      [id]
    );

    const approvalsResult = await pool.query(
      `SELECT * FROM po_approvals
       WHERE po_id = $1
       ORDER BY level, approval_date`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...poResult.rows[0],
        items: itemsResult.rows,
        approvals: approvalsResult.rows,
      },
    });
  } catch (error) {
    console.error(
      "Get PO Details Error:",
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch Purchase Order details",
    });
  }
};

// POST: Create Purchase Order
exports.createPurchaseOrder = async (req, res) => {
  const client = await pool.connect();

  try {
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
      status,
      delivery_warehouse,
      approval_required,
      current_approval_level,
      created_by,
      items = [],
    } = req.body;

    if (!vendor_id || !vendor_name) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID and Vendor Name are required",
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Items must be an array",
      });
    }

    for (const item of items) {
      if (
        !item.item_id ||
        !Number.isFinite(Number(item.qty)) ||
        Number(item.qty) <= 0 ||
        !Number.isFinite(Number(item.unit_price)) ||
        Number(item.unit_price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each item requires item_id, positive qty and valid unit_price",
        });
      }
    }

    const totalItems = items.length;

    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.unit_price),
      0
    );

    const generatedPoNumber =
      po_number || `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await client.query("BEGIN");

    const poResult = await client.query(
      `INSERT INTO purchase_orders (
        po_number, po_date, rfq_id, pr_id, vendor_id, vendor_name,
        buyer, department, currency, total_items, total_value, priority,
        status, delivery_warehouse, approval_required,
        current_approval_level, created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )
      RETURNING *`,
      [
        generatedPoNumber,
        po_date || null,
        rfq_id || null,
        pr_id || null,
        vendor_id,
        vendor_name,
        buyer || null,
        department || null,
        currency || "INR",
        totalItems,
        totalValue,
        priority || "Normal",
        status || "Draft",
        delivery_warehouse || null,
        approval_required ?? false,
        current_approval_level ?? 0,
        created_by || null,
      ]
    );

    const po = poResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_order_items (
          po_id, item_id, description, uom, qty, unit_price, delivery_date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          po.po_id,
          item.item_id,
          item.description || null,
          item.uom || null,
          Number(item.qty),
          Number(item.unit_price),
          item.delivery_date || null,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Purchase Order created successfully",
      data: po,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Create PO rollback error:",
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
      );
    }

    console.error(
      "Create PO Error:",
      error instanceof Error ? error.message : String(error)
    );

    res.status(500).json({
      success: false,
      message: "Failed to create Purchase Order",
    });
  } finally {
    client.release();
  }
};

// PUT: Update Purchase Order
exports.updatePurchaseOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      po_date,
      vendor_id,
      vendor_name,
      buyer,
      department,
      currency,
      priority,
      status,
      delivery_warehouse,
      approval_required,
      current_approval_level,
      items,
    } = req.body;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE purchase_orders SET
        po_date = COALESCE($1, po_date),
        vendor_id = COALESCE($2, vendor_id),
        vendor_name = COALESCE($3, vendor_name),
        buyer = COALESCE($4, buyer),
        department = COALESCE($5, department),
        currency = COALESCE($6, currency),
        priority = COALESCE($7, priority),
        status = COALESCE($8, status),
        delivery_warehouse = COALESCE($9, delivery_warehouse),
        approval_required = COALESCE($10, approval_required),
        current_approval_level = COALESCE($11, current_approval_level)
      WHERE po_id = $12
      RETURNING *`,
      [
        po_date ?? null,
        vendor_id ?? null,
        vendor_name ?? null,
        buyer ?? null,
        department ?? null,
        currency ?? null,
        priority ?? null,
        status ?? null,
        delivery_warehouse ?? null,
        approval_required ?? null,
        current_approval_level ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    if (items !== undefined) {
      if (!Array.isArray(items)) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Items must be an array",
        });
      }

      for (const item of items) {
        if (
          !item.item_id ||
          !Number.isFinite(Number(item.qty)) ||
          Number(item.qty) <= 0 ||
          !Number.isFinite(Number(item.unit_price)) ||
          Number(item.unit_price) < 0
        ) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            success: false,
            message: "Invalid PO item data",
          });
        }
      }

      await client.query(
        `DELETE FROM purchase_order_items WHERE po_id = $1`,
        [id]
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_order_items (
            po_id, item_id, description, uom, qty, unit_price, delivery_date
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            id,
            item.item_id,
            item.description || null,
            item.uom || null,
            Number(item.qty),
            Number(item.unit_price),
            item.delivery_date || null,
          ]
        );
      }

      const totalValue = items.reduce(
        (sum, item) => sum + Number(item.qty) * Number(item.unit_price),
        0
      );

      await client.query(
        `UPDATE purchase_orders
         SET total_items = $1, total_value = $2
         WHERE po_id = $3`,
        [items.length, totalValue, id]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Purchase Order updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Update PO rollback error:",
        rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
      );
    }

    console.error(
      "Update PO Error:",
      error instanceof Error ? error.message : String(error)
    );

    res.status(500).json({
      success: false,
      message: "Failed to update Purchase Order",
    });
  } finally {
    client.release();
  }
};

// Helper: find active single-level PO workflow configuration.
async function getPOApprovalConfig(
  client,
  po
) {
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

// POST: Submit Draft PO for Approval
exports.submitPurchaseOrderForApproval = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

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
        message: `Only Draft POs can be submitted. Current status: ${po.status}`,
      });
    }

    const config = await getPOApprovalConfig(client, po);

    if (!config) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "No active PO approval workflow found for this PO. Configure Procurement Manager approval first.",
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

    return res.json({
      success: true,
      message: "Purchase Order submitted for approval",
      data: updated.rows[0],
      approval: {
        level: 1,
        approver_role: config.approver_role,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Submit PO rollback error:",
        rollbackError instanceof Error ? rollbackError.message : rollbackError
      );
    }

    console.error(
      "Submit PO for Approval Error:",
      error instanceof Error ? error.message : error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit Purchase Order for approval",
    });
  } finally {
    client.release();
  }
};

// POST: Procurement Manager Approve / Reject PO
exports.approveOrRejectPurchaseOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { decision, remarks, approver_id } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be Approved or Rejected",
      });
    }

    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE po_id = $1 FOR UPDATE`,
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

    if (po.status !== "Pending Approval" || !po.approval_required) {
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
        message: "Active PO approval workflow configuration was not found",
      });
    }

    const approverId = String(
      approver_id || req.user?.user_id || config.approver_role || ""
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
        po_id, level, approver_id, decision, remarks, approval_date
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

    res.json({
      success: true,
      message: `Purchase Order ${decision.toLowerCase()} successfully`,
      data: updatedResult.rows[0],
      approval: approvalResult.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "PO Approval rollback error:",
        rollbackError instanceof Error ? rollbackError.message : rollbackError
      );
    }

    console.error(
      "Approve/Reject PO Error:",
      error instanceof Error ? error.message : error
    );

    res.status(500).json({
      success: false,
      message: "Failed to save Purchase Order approval",
    });
  } finally {
    client.release();
  }
};

// =====================================================
// POST: Issue Approved PO to Vendor
// =====================================================

exports.issuePurchaseOrderToVendor = async (req, res) => {
  let client;

  try {
    const { id } = req.params;
    const { remarks } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Purchase Order ID is required",
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");

    // Lock PO row to prevent duplicate issue operations
    const poResult = await client.query(
      `SELECT *
       FROM purchase_orders
       WHERE po_id = $1
       FOR UPDATE`,
      [id]
    );

    if (poResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    const po = poResult.rows[0];

    // Only approved POs can be issued
    if (po.status !== "Approved") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          `Only Approved POs can be issued. Current status: ${po.status}`,
      });
    }

    // Update PO status in PostgreSQL
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
        console.error("PO Issue rollback error:", rollbackError.message);
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
    if (client) {
      client.release();
    }
  }
};