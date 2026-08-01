const db = require("../config/db");
const crypto = require("crypto");

// ======================================================
// GET APPROVED PRs
// ======================================================

const getApprovedPRs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        pr.pr_id,
        pr.pr_number,
        pr.department,
        pr.requested_by,
        pr.currency,
        pr.priority,
        pr.estimated_pr_value
      FROM pr_header pr
      WHERE pr.status = 'Approved'
      AND pr.pr_number NOT IN
      (
        SELECT pr_number
        FROM rfq
        WHERE status IN
        (
          'Draft',
          'Submitted',
          'Pending Approval',
          'Approved'
        )
      )
      ORDER BY pr.created_at DESC
    `);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET APPROVED PR ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET PR ITEMS
// ======================================================

const getPRItems = async (req, res) => {
  try {
    const { prId } = req.params;

    const result = await db.query(
      `
      SELECT
        pr_item_id,
        pr_id,
        item_type,
        item_id,
        item_description,
        uom,
        requested_qty,
        estimated_unit_price,
        estimated_total_cost,
        required_by_date,
        preferred_vendor
      FROM pr_items
      WHERE pr_id = $1
      ORDER BY created_at ASC
      `,
      [prId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET PR ITEMS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET VENDORS
// ======================================================

const getVendors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        v.id,
        v.vendor_code,
        v.vendor_name,
        v.contact_email,
        v.status,
        vc.compliance_status
      FROM vendors v
      LEFT JOIN vendor_compliance vc
        ON vc.vendor_id = v.id
      WHERE v.status = 'Active'
      ORDER BY v.vendor_name
    `);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET VENDORS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CREATE RFQ
// ======================================================

const createRFQ = async (req, res) => {
  console.log("CREATE RFQ FILES =", req.files);
  console.log("CREATE RFQ BODY =", req.body);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const data = JSON.parse(req.body.rfqData);

    const {
      pr_id,
      pr_number,
      department,
      requestor,
      created_by,
      estimated_value,
      quotation_due_date,
      rfq_type,
      currency,
      priority,
      remarks,
      internal_notes,
      status,
      vendors = [],
      items = [],
      terms = {},
    } = data;

    console.log(
      "ITEMS FROM FRONTEND =",
      JSON.stringify(items, null, 2)
    );

    console.log(
      "RFQ ATTACHMENTS RECEIVED =",
      req.files
    );

    // --------------------------------------------------
    // CHECK DUPLICATE RFQ FOR SAME PR
    // --------------------------------------------------

    const existingRFQ = await client.query(
      `
      SELECT
        rfq_number,
        status
      FROM rfq
      WHERE pr_id = $1
      AND status IN
      (
        'Draft',
        'Submitted',
        'Pending Approval',
        'Approved'
      )
      LIMIT 1
      `,
      [pr_id]
    );

    if (existingRFQ.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `RFQ already exists for PR Number ${pr_number}`,
        rfqNumber: existingRFQ.rows[0].rfq_number,
      });
    }

    const rfqId = crypto.randomUUID();

    const seqResult = await client.query(`
      SELECT COUNT(*)::int + 1 AS seq
      FROM rfq
    `);

    const seq = seqResult.rows[0].seq;

    const rfqNumber =
      `RFQ-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;

    // --------------------------------------------------
    // RFQ HEADER
    // --------------------------------------------------

    await client.query(
      `
      INSERT INTO rfq
      (
        rfq_id,
        rfq_number,
        rfq_date,
        pr_id,
        pr_number,
        department,
        requestor,
        quotation_due_date,
        rfq_type,
        currency,
        priority,
        status,
        remarks,
        total_items,
        estimated_value,
        created_by,
        created_at,
        internal_notes
      )
      VALUES
      (
        $1,
        $2,
        CURRENT_DATE,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        NOW(),
        $16
      )
      `,
      [
        rfqId,
        rfqNumber,
        pr_id,
        pr_number,
        department,
        requestor,
        quotation_due_date,
        rfq_type,
        currency,
        priority,
        status || "Draft",
        remarks,
        items.length,
        Number(estimated_value || 0),
        created_by || requestor || "System",
        internal_notes || "",
      ]
    );

    console.log("RFQ HEADER INSERT DONE");

    // --------------------------------------------------
    // RFQ ITEMS + QUOTES
    // --------------------------------------------------

    for (const item of items) {
      const itemResult = await client.query(
        `
        INSERT INTO rfq_items
        (
          rfq_item_id,
          rfq_id,
          pr_item_id,
          item_id,
          item_description,
          uom,
          requested_qty
        )
        VALUES
        (
          gen_random_uuid(),
          $1,$2,$3,$4,$5,$6
        )
        RETURNING rfq_item_id
        `,
        [
          rfqId,
          item.pr_item_id,
          item.item_id,
          item.item_description,
          item.uom,
          item.requested_qty,
        ]
      );

      const rfqItemId =
        itemResult.rows[0].rfq_item_id;

      if (item.quotes_by_vendor) {
        for (
          const vendorId of Object.keys(
            item.quotes_by_vendor
          )
        ) {
          const quote =
            item.quotes_by_vendor[vendorId];

          await client.query(
            `
            INSERT INTO rfq_quotes
            (
              quote_id,
              rfq_id,
              rfq_item_id,
              vendor_id,
              quoted_unit_price,
              delivery_days,
              tax_percentage,
              warranty_terms
            )
            VALUES
            (
              gen_random_uuid(),
              $1,$2,$3,$4,$5,$6,$7
            )
            `,
            [
              rfqId,
              rfqItemId,
              vendorId,
              Number(
                quote.quoted_unit_price || 0
              ),
              Number(
                quote.delivery_days || 0
              ),
              Number(
                quote.tax_percentage || 0
              ),
              quote.warranty_terms || "",
            ]
          );
        }
      }
    }

    // --------------------------------------------------
    // RFQ VENDORS
    // --------------------------------------------------

    for (const vendor of vendors) {
      await client.query(
        `
        INSERT INTO rfq_vendors
        (
          rfq_vendor_id,
          rfq_id,
          vendor_id,
          vendor_name,
          vendor_email,
          invitation_status,
          response_received
        )
        VALUES
        (
          gen_random_uuid(),
          $1,$2,$3,$4,
          'Not Sent',
          false
        )
        `,
        [
          rfqId,
          vendor.vendor_id,
          vendor.vendor_name,
          vendor.vendor_email,
        ]
      );
    }

    // --------------------------------------------------
    // RFQ TERMS
    // --------------------------------------------------

    await client.query(
      `
      INSERT INTO rfq_terms
      (
        term_id,
        rfq_id,
        payment_terms,
        incoterms,
        freight_charges,
        validity_days,
        penalty_clause,
        special_conditions
      )
      VALUES
      (
        gen_random_uuid(),
        $1,$2,$3,$4,$5,$6,$7
      )
      `,
      [
        rfqId,
        terms.payment_terms || "",
        terms.incoterms || "",
        terms.freight_charges || 0,
        terms.validity_days || 0,
        terms.penalty_clause || false,
        terms.special_conditions || "",
      ]
    );

    // --------------------------------------------------
    // RFQ ATTACHMENTS
    // --------------------------------------------------

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await client.query(
          `
          INSERT INTO rfq_attachments
          (
            attachment_id,
            rfq_id,
            attachment_type,
            file_path,
            file_name,
            uploaded_at
          )
          VALUES
          (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            NOW()
          )
          `,
          [
            rfqId,
            "RFQ Document",
            file.path,
            file.originalname,
          ]
        );
      }
    }

    console.log(
      "ATTACHMENTS INSERT COUNT =",
      req.files?.length || 0
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      rfqId,
      rfqNumber,
      message: "RFQ Saved Successfully",
    });
  } catch (error) {
    console.error(
      "CREATE RFQ ERROR FULL =",
      error
    );

    await client.query("ROLLBACK");

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// ======================================================
// GET RFQ LIST
// ======================================================

const getRFQList = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        r.*,
        (
          SELECT COUNT(*)
          FROM rfq_vendors rv
          WHERE rv.rfq_id = r.rfq_id
        ) AS vendor_count
      FROM rfq r
      ORDER BY r.created_at DESC
    `);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "GET RFQ LIST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET RFQ BY ID
// ======================================================

const getRFQById = async (req, res) => {
  try {
    const { rfqId } = req.params;

    const header = await db.query(
      `
      SELECT
        rfq_id,
        rfq_number,
        TO_CHAR(
          rfq_date,
          'YYYY-MM-DD'
        ) AS rfq_date,
        TO_CHAR(
          quotation_due_date,
          'YYYY-MM-DD'
        ) AS quotation_due_date,
        pr_id,
        pr_number,
        department,
        requestor,
        priority,
        estimated_value,
        created_by,
        status,
        rfq_type,
        currency,
        remarks,
        internal_notes
      FROM rfq
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    if (header.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    const attachments = await db.query(
      `
      SELECT *
      FROM rfq_attachments
      WHERE rfq_id = $1
      ORDER BY uploaded_at DESC
      `,
      [rfqId]
    );

    const items = await db.query(
      `
      SELECT *
      FROM rfq_items
      WHERE rfq_id = $1
      ORDER BY item_description
      `,
      [rfqId]
    );

    const vendors = await db.query(
      `
      SELECT *
      FROM rfq_vendors
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    const terms = await db.query(
      `
      SELECT *
      FROM rfq_terms
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    const quotes = await db.query(
      `
      SELECT *
      FROM rfq_quotes
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    console.log("ITEMS =", items.rows);
    console.log("VENDORS =", vendors.rows);
    console.log("QUOTES =", quotes.rows);

    return res.json({
      success: true,
      header: header.rows[0],
      items: items.rows,
      vendors: vendors.rows,
      terms: terms.rows[0] || {},
      attachments: attachments.rows,
      quotes: quotes.rows,
    });
  } catch (error) {
    console.error(
      "GET RFQ BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE RFQ
// ======================================================

const updateRFQ = async (req, res) => {
  console.log("UPDATE RFQ HIT");
  console.log(
    "UPDATE RFQ ID =",
    req.params.rfqId
  );
  console.log(
    "UPDATE BODY =",
    req.body
  );
  console.log(
    "UPDATE FILES =",
    req.files
  );

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { rfqId } = req.params;

    const rfqData = JSON.parse(
      req.body.rfqData
    );

    // --------------------------------------------------
    // CHECK RFQ STATUS
    // --------------------------------------------------

    const checkRFQ = await client.query(
      `
      SELECT status
      FROM rfq
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    if (checkRFQ.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    if (
      checkRFQ.rows[0].status !== "Draft"
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Only Draft RFQ can be edited",
      });
    }

    const {
      quotation_due_date,
      rfq_type,
      currency,
      priority,
      remarks,
      estimated_value,
      internal_notes,
    } = rfqData;

    // --------------------------------------------------
    // UPDATE HEADER
    // --------------------------------------------------

    await client.query(
      `
      UPDATE rfq
      SET
        quotation_due_date = $1,
        rfq_type = $2,
        currency = $3,
        priority = $4,
        remarks = $5,
        estimated_value = $6,
        internal_notes = $7,
        updated_at = NOW()
      WHERE rfq_id = $8
      `,
      [
        quotation_due_date,
        rfq_type,
        currency,
        priority,
        remarks,
        Number(estimated_value || 0),
        internal_notes || "",
        rfqId,
      ]
    );

    console.log("HEADER UPDATED");

    // --------------------------------------------------
    // UPDATE ITEMS + QUOTES
    // --------------------------------------------------
    //
    // Current RFQ implementation rebuilds these rows.
    // PR-derived item values are still supplied by the
    // frontend as read-only values.
    // --------------------------------------------------

    await client.query(
      `
      DELETE FROM rfq_quotes
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    await client.query(
      `
      DELETE FROM rfq_items
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    for (const item of rfqData.items || []) {
      const itemResult =
        await client.query(
          `
          INSERT INTO rfq_items
          (
            rfq_item_id,
            rfq_id,
            pr_item_id,
            item_id,
            item_description,
            uom,
            requested_qty
          )
          VALUES
          (
            gen_random_uuid(),
            $1,$2,$3,$4,$5,$6
          )
          RETURNING rfq_item_id
          `,
          [
            rfqId,
            item.pr_item_id,
            item.item_id,
            item.item_description,
            item.uom,
            item.requested_qty,
          ]
        );

      const rfqItemId =
        itemResult.rows[0].rfq_item_id;

      if (item.quotes_by_vendor) {
        for (
          const vendorId of Object.keys(
            item.quotes_by_vendor
          )
        ) {
          const quote =
            item.quotes_by_vendor[vendorId];

          await client.query(
            `
            INSERT INTO rfq_quotes
            (
              quote_id,
              rfq_id,
              rfq_item_id,
              vendor_id,
              quoted_unit_price,
              delivery_days,
              tax_percentage,
              warranty_terms
            )
            VALUES
            (
              gen_random_uuid(),
              $1,$2,$3,$4,$5,$6,$7
            )
            `,
            [
              rfqId,
              rfqItemId,
              vendorId,
              Number(
                quote.quoted_unit_price || 0
              ),
              Number(
                quote.delivery_days || 0
              ),
              Number(
                quote.tax_percentage || 0
              ),
              quote.warranty_terms || "",
            ]
          );
        }
      }
    }

    console.log(
      "ITEMS + QUOTES UPDATED"
    );

    // --------------------------------------------------
    // UPDATE VENDORS
    // --------------------------------------------------

    const deleteVendorsResult =
      await client.query(
        `
        DELETE FROM rfq_vendors
        WHERE rfq_id = $1
        RETURNING
          rfq_vendor_id,
          vendor_id,
          vendor_name
        `,
        [rfqId]
      );

    console.log(
      "DELETED VENDOR COUNT =",
      deleteVendorsResult.rowCount
    );

    for (
      const vendor of rfqData.vendors || []
    ) {
      await client.query(
        `
        INSERT INTO rfq_vendors
        (
          rfq_vendor_id,
          rfq_id,
          vendor_id,
          vendor_name,
          vendor_email,
          invitation_status,
          response_received,
          response_date
        )
        VALUES
        (
          gen_random_uuid(),
          $1,$2,$3,$4,$5,$6,$7
        )
        `,
        [
          rfqId,
          vendor.vendor_id,
          vendor.vendor_name,
          vendor.vendor_email,
          vendor.invitation_status ||
            "Not Sent",
          vendor.response_received ||
            false,
          vendor.response_date || null,
        ]
      );
    }

    console.log(
      "VENDORS UPDATED =",
      rfqData.vendors?.length || 0
    );

    // --------------------------------------------------
    // UPDATE TERMS
    // --------------------------------------------------

    const existingTerms =
      await client.query(
        `
        SELECT term_id
        FROM rfq_terms
        WHERE rfq_id = $1
        LIMIT 1
        `,
        [rfqId]
      );

    const terms = rfqData.terms || {};

    if (existingTerms.rows.length > 0) {
      await client.query(
        `
        UPDATE rfq_terms
        SET
          payment_terms = $1,
          incoterms = $2,
          freight_charges = $3,
          validity_days = $4,
          penalty_clause = $5,
          special_conditions = $6
        WHERE rfq_id = $7
        `,
        [
          terms.payment_terms || "",
          terms.incoterms || "",
          Number(
            terms.freight_charges || 0
          ),
          Number(
            terms.validity_days || 0
          ),
          terms.penalty_clause || false,
          terms.special_conditions || "",
          rfqId,
        ]
      );
    } else {
      await client.query(
        `
        INSERT INTO rfq_terms
        (
          term_id,
          rfq_id,
          payment_terms,
          incoterms,
          freight_charges,
          validity_days,
          penalty_clause,
          special_conditions
        )
        VALUES
        (
          gen_random_uuid(),
          $1,$2,$3,$4,$5,$6,$7
        )
        `,
        [
          rfqId,
          terms.payment_terms || "",
          terms.incoterms || "",
          Number(
            terms.freight_charges || 0
          ),
          Number(
            terms.validity_days || 0
          ),
          terms.penalty_clause || false,
          terms.special_conditions || "",
        ]
      );
    }

    console.log("TERMS UPDATED");

    // --------------------------------------------------
    // ADD NEW ATTACHMENTS DURING UPDATE
    // --------------------------------------------------

    if (
      req.files &&
      req.files.length > 0
    ) {
      for (const file of req.files) {
        await client.query(
          `
          INSERT INTO rfq_attachments
          (
            attachment_id,
            rfq_id,
            attachment_type,
            file_path,
            file_name,
            uploaded_at
          )
          VALUES
          (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            NOW()
          )
          `,
          [
            rfqId,
            "RFQ Document",
            file.path,
            file.originalname,
          ]
        );
      }
    }

    console.log(
      "NEW ATTACHMENTS ADDED =",
      req.files?.length || 0
    );

    await client.query("COMMIT");

    console.log("COMMIT SUCCESS");

    return res.json({
      success: true,
      message:
        "RFQ Updated Successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "UPDATE RFQ ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// ======================================================
// DELETE SINGLE RFQ ATTACHMENT
// ======================================================

const deleteRFQAttachment = async (
  req,
  res
) => {
  const client = await db.connect();

  try {
    const {
      rfqId,
      attachmentId,
    } = req.params;

    console.log(
      "DELETE RFQ ATTACHMENT HIT"
    );

    console.log(
      "RFQ ID =",
      rfqId
    );

    console.log(
      "ATTACHMENT ID =",
      attachmentId
    );

    // --------------------------------------------------
    // CHECK RFQ EXISTS + STATUS
    // --------------------------------------------------

    const rfqCheck =
      await client.query(
        `
        SELECT status
        FROM rfq
        WHERE rfq_id = $1
        `,
        [rfqId]
      );

    if (rfqCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    if (
      rfqCheck.rows[0].status !== "Draft"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Attachments can only be removed from Draft RFQ",
      });
    }

    // --------------------------------------------------
    // DELETE ONLY SELECTED ATTACHMENT
    // --------------------------------------------------

    const result =
      await client.query(
        `
        DELETE FROM rfq_attachments
        WHERE attachment_id = $1
          AND rfq_id = $2
        RETURNING
          attachment_id,
          file_name,
          file_path
        `,
        [
          attachmentId,
          rfqId,
        ]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Attachment not found",
      });
    }

    console.log(
      "RFQ ATTACHMENT DELETED =",
      result.rows[0]
    );

    return res.json({
      success: true,
      message:
        "Attachment removed successfully",
      attachment: result.rows[0],
    });
  } catch (error) {
    console.error(
      "DELETE RFQ ATTACHMENT ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// ======================================================
// SEND RFQ FOR APPROVAL
// ======================================================

const submitRFQForApproval = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { rfqId } = req.params;

    // 1. Get RFQ
    const rfqResult = await client.query(
      `
      SELECT
        rfq_id,
        rfq_number,
        status,
        estimated_value,
        department
      FROM rfq
      WHERE rfq_id = $1
      FOR UPDATE
      `,
      [rfqId]
    );

    if (rfqResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    const rfq = rfqResult.rows[0];

    if (rfq.status !== "Draft") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Only Draft RFQ can be sent for approval",
      });
    }

    // 2. Read dynamic approval hierarchy
    const workflowResult = await client.query(
      `
      SELECT
        level,
        approver_role
      FROM approval_workflow_config
      WHERE document_type = 'RFQ'
        AND is_active = TRUE
        AND COALESCE(min_amount, 0) <= $1
        AND (max_amount IS NULL OR max_amount >= $1)
        AND (
          department IS NULL
          OR department = ''
          OR department = $2
        )
      ORDER BY level ASC
      `,
      [
        Number(rfq.estimated_value || 0),
        rfq.department,
      ]
    );

    if (workflowResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "No RFQ approval workflow configured",
      });
    }

    // 3. Safety check - don't create duplicate approval rows
    const existingApprovals = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM rfq_approvals
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    if (existingApprovals.rows[0].count > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Approval workflow already exists for this RFQ",
      });
    }

    // 4. Generate RFQ approval transaction rows
    for (const step of workflowResult.rows) {
      await client.query(
        `
        INSERT INTO rfq_approvals
        (
          approval_id,
          rfq_id,
          level,
          approver_role,
          decision,
          remarks,
          decided_at
        )
        VALUES
        (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'Pending',
          NULL,
          NULL
        )
        `,
        [
          rfqId,
          step.level,
          step.approver_role,
        ]
      );
    }

    // 5. Lock RFQ and point to Level 1
    const firstLevel = workflowResult.rows[0].level;

    await client.query(
      `
      UPDATE rfq
      SET
        status = 'Pending Approval',
        current_approval_level = $1,
        updated_at = NOW()
      WHERE rfq_id = $2
      `,
      [firstLevel, rfqId]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "RFQ sent for approval successfully",
      currentApprovalLevel: firstLevel,
      approvalLevels: workflowResult.rows.length,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "SEND RFQ FOR APPROVAL ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};


// ======================================================
// APPROVE / REJECT RFQ
// ======================================================

const decideRFQApproval = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { rfqId } = req.params;
    const { decision, remarks, approved_by } = req.body;

    // -----------------------------------------------
    // VALIDATE DECISION
    // -----------------------------------------------

    if (!["Approved", "Rejected"].includes(decision)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Decision must be Approved or Rejected",
      });
    }

    // -----------------------------------------------
    // GET RFQ + CURRENT LEVEL
    // -----------------------------------------------

    const rfqResult = await client.query(
      `
      SELECT
        rfq_id,
        rfq_number,
        status,
        current_approval_level
      FROM rfq
      WHERE rfq_id = $1
      FOR UPDATE
      `,
      [rfqId]
    );

    if (rfqResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    const rfq = rfqResult.rows[0];

    if (rfq.status !== "Pending Approval") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "RFQ is not pending approval",
      });
    }

    const currentLevel = rfq.current_approval_level;

    // -----------------------------------------------
    // GET CURRENT APPROVAL ROW
    // -----------------------------------------------

    const approvalResult = await client.query(
      `
      SELECT
        approval_id,
        level,
        approver_role,
        decision
      FROM rfq_approvals
      WHERE rfq_id = $1
        AND level = $2
      FOR UPDATE
      `,
      [rfqId, currentLevel]
    );

    if (approvalResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Current approval level not found",
      });
    }

    const approval = approvalResult.rows[0];

    if (approval.decision !== "Pending") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This approval level is already decided",
      });
    }

    // -----------------------------------------------
    // SAVE DECISION + REMARKS
    // -----------------------------------------------

    await client.query(
      `
      UPDATE rfq_approvals
      SET
        decision = $1,
        remarks = $2,
        decided_at = NOW()
      WHERE approval_id = $3
      `,
      [
        decision,
        remarks || "",
        approval.approval_id,
      ]
    );

    // -----------------------------------------------
    // REJECTED → CLOSE RFQ IMMEDIATELY
    // -----------------------------------------------

    if (decision === "Rejected") {
      await client.query(
        `
        UPDATE rfq
        SET
          status = 'Rejected',
          updated_by = $1,
          updated_at = NOW()
        WHERE rfq_id = $2
        `,
        [approved_by || approval.approver_role, rfqId]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: `RFQ rejected at Level ${currentLevel}`,
        status: "Rejected",
        currentApprovalLevel: currentLevel,
      });
    }

    // -----------------------------------------------
    // FIND NEXT PENDING LEVEL
    // -----------------------------------------------

    const nextApprovalResult = await client.query(
      `
      SELECT
        level,
        approver_role
      FROM rfq_approvals
      WHERE rfq_id = $1
        AND decision = 'Pending'
        AND level > $2
      ORDER BY level ASC
      LIMIT 1
      `,
      [rfqId, currentLevel]
    );

    // -----------------------------------------------
    // NEXT LEVEL EXISTS
    // -----------------------------------------------

    if (nextApprovalResult.rows.length > 0) {
      const nextApproval = nextApprovalResult.rows[0];

      await client.query(
        `
        UPDATE rfq
        SET
          current_approval_level = $1,
          updated_by = $2,
          updated_at = NOW()
        WHERE rfq_id = $3
        `,
        [
          nextApproval.level,
          approved_by || approval.approver_role,
          rfqId,
        ]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message:
          `Level ${currentLevel} approved. ` +
          `Moved to Level ${nextApproval.level}`,
        status: "Pending Approval",
        currentApprovalLevel: nextApproval.level,
        nextApproverRole: nextApproval.approver_role,
      });
    }

    // -----------------------------------------------
    // NO NEXT LEVEL → FINAL APPROVAL
    // -----------------------------------------------

    await client.query(
      `
      UPDATE rfq
      SET
        status = 'Approved',
        current_approval_level = $1,
        approved_by = $2,
        approved_at = NOW(),
        updated_by = $2,
        updated_at = NOW()
      WHERE rfq_id = $3
      `,
      [
        currentLevel,
        approved_by || approval.approver_role,
        rfqId,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "RFQ fully approved",
      status: "Approved",
      currentApprovalLevel: currentLevel,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "RFQ APPROVAL DECISION ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

// ======================================================
// GET RFQ APPROVAL ROUTE / HISTORY
// ======================================================

const getRFQApprovalRoute = async (req, res) => {
  try {
    const { rfqId } = req.params;

    // Get RFQ header
    const rfqResult = await db.query(
      `
      SELECT
        rfq_id,
        rfq_number,
        status,
        current_approval_level
      FROM rfq
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    if (rfqResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    // Get approval hierarchy + history
    const approvalResult = await db.query(
      `
      SELECT
        approval_id,
        level,
        approver_role,
        decision,
        remarks,
        decided_at
      FROM rfq_approvals
      WHERE rfq_id = $1
      ORDER BY level ASC
      `,
      [rfqId]
    );

    return res.json({
      success: true,
      data: {
        rfq_id: rfqResult.rows[0].rfq_id,
        rfq_number: rfqResult.rows[0].rfq_number,
        status: rfqResult.rows[0].status,
        current_approval_level:
          rfqResult.rows[0].current_approval_level,

        approval_route: approvalResult.rows,
      },
    });

  } catch (error) {
    console.error(
      "GET RFQ APPROVAL ROUTE ERROR =",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ======================================================
// CLOSE RFQ
// ======================================================

const closeRFQ = async (req, res) => {
  const client = await db.connect();

  try {
    const { rfqId } = req.params;

    await client.query("BEGIN");

    const rfqResult = await client.query(
      `
      SELECT
        rfq_id,
        rfq_number,
        status
      FROM rfq
      WHERE rfq_id = $1
      FOR UPDATE
      `,
      [rfqId]
    );

    if (rfqResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    const rfq = rfqResult.rows[0];

    if (rfq.status === "Closed") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "RFQ is already closed",
      });
    }

    if (rfq.status !== "Approved") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Only an Approved RFQ can be closed",
      });
    }

    await client.query(
      `
      UPDATE rfq
      SET
        status = 'Closed',
        updated_at = CURRENT_TIMESTAMP
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `${rfq.rfq_number} closed successfully`,
      status: "Closed",
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("CLOSE RFQ ERROR =", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to close RFQ",
    });

  } finally {
    client.release();
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  getApprovedPRs,
  getPRItems,
  getVendors,
  createRFQ,
  getRFQList,
  getRFQById,
  updateRFQ,
  deleteRFQAttachment,
  submitRFQForApproval,
  decideRFQApproval,
  getRFQApprovalRoute,
  closeRFQ,
};