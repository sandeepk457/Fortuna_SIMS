const db = require("../config/db");


// ===============================
// 📄 GET PR LIST
// ===============================
const getPRList = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        pr_id,
        pr_number,
        department,
        requested_by,
        created_at,
        priority,
        status,
        estimated_pr_value
      FROM pr_header
      ORDER BY created_at DESC
    `);

    res.json({ success: true, data: result.rows });

  } catch (error) {
    console.error("GET PR LIST ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ===============================
// 📄 GET PR BY ID (DETAIL VIEW)
// ===============================
const getPRById = async (req, res) => {
  const { id } = req.params;

  try {
    const header = await db.query(
      `SELECT * FROM pr_header WHERE pr_id = $1`,
      [id]
    );

    const items = await db.query(
      `SELECT * FROM pr_items WHERE pr_id = $1`,
      [id]
    );

        // 🔥 Attachments
const attachments = await db.query(
  `SELECT * FROM pr_attachments WHERE pr_id = $1`,
  [id]
);


    res.json({
      success: true,
      data: {
        header: header.rows[0],
        items: items.rows,
        attachments: attachments.rows
      },
    });




  } catch (error) {
    console.error("GET PR BY ID ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ===============================
// 🆕 CREATE PR
// ===============================
const createPR = async (req, res) => {
  const client = await db.connect();

try {
  await client.query("BEGIN");
   console.log("RAW BODY:", req.body);
  const body = req.body || {};

  // 🔥 SAFE PARSE FUNCTION
  const safeParse = (val) => {
    try {
      return val ? JSON.parse(val) : null;
    } catch {
      return val; // already string
    }
  };

const department = body.department || null;
const cost_center = body.cost_center || null;
const project_code = body.project_code || null;
const priority = body.priority || null;
const pr_type = body.pr_type || null;
const justification = body.justification || null;
const internal_notes = body.internal_notes || null;

const delivery_location = body.delivery_location || null;
const delivery_address = body.delivery_address || null;
const currency = body.currency || null;
const tax_estimate = body.tax_estimate || null;

const items = body.items ? JSON.parse(body.items) : [];

console.log("PARSED VALUES:", {
  department,
  cost_center,
  priority,
  pr_type,
  items
});

    // ===============================
    // 🔴 VALIDATIONS
    // ===============================
    if (!department?.trim() || !cost_center?.trim() || !priority?.trim() || !pr_type?.trim()) {
    throw new Error("Required fields missing");
    }

    if (!items || items.length === 0) {
      throw new Error("At least one item is required");
    }

    // ===============================
    // 🧾 INSERT PR HEADER
    // ===============================
    const prHeaderResult = await client.query(
      `INSERT INTO pr_header (
        pr_number,
        department,
        cost_center,
        project_code,
        priority,
        pr_type,
        justification,
        internal_notes,
        delivery_location,
        delivery_address,
        currency,
        tax_estimate,
        status,
        requested_by
      )
      VALUES (
        CONCAT('PR-', TO_CHAR(NOW(),'YYYY'), '-', EXTRACT(EPOCH FROM NOW())::BIGINT),
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Draft',$11
      )
      RETURNING pr_id`,
      [
        department,
        cost_center,
        project_code || null,
        priority,
        pr_type,
        justification,
        internal_notes || null,
        delivery_location || null,
        delivery_address || null,
        currency || "INR",
        tax_estimate || 0,
        req.user?.name || "System"
      ]
    );

    const pr_id = prHeaderResult.rows[0].pr_id;

    // ===============================
    // 📦 INSERT ITEMS
    // ===============================
    await Promise.all(
      items.map((item) => {
        const qty = Number(item.requested_qty) || 0;
        const price = Number(item.estimated_unit_price) || 0;
        const total = qty * price;

        return client.query(
          `INSERT INTO pr_items (
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
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            pr_id,
            item.item_type,
            item.item_id || null,
            item.item_description,
            item.uom,
            qty,
            price,
            total,
            item.required_by_date,
            item.preferred_vendor || null
          ]
        );
      })
    );

    // ===============================
    // 💰 CALCULATE TOTALS
    // ===============================
    const totalResult = await client.query(
      `SELECT SUM(estimated_total_cost) AS total 
       FROM pr_items 
       WHERE pr_id = $1`,
      [pr_id]
    );

    const estimatedValue = Number(totalResult.rows[0].total) || 0;
    const tax = Number(tax_estimate) || 0;

    await client.query(
      `UPDATE pr_header
       SET estimated_pr_value = $1,
           total_estimated_cost = $2
       WHERE pr_id = $3`,
      [estimatedValue, estimatedValue + tax, pr_id]
    );

    // ===============================
// 🚚 DELIVERY INSERT
// ===============================

// 🔥 STEP 1: Get warehouse name
const wh = await client.query(
  `SELECT warehouse_name FROM warehouses WHERE warehouse_id = $1`,
  [delivery_location]
);

const warehouseName = wh.rows[0]?.warehouse_name || null;

await client.query(
  `INSERT INTO pr_delivery (
    pr_id,
    warehouse_id,
    warehouse_name,
    delivery_address
  )
  VALUES ($1, $2, $3, $4)`,
  [
    pr_id,
    delivery_location, // this is warehouse_id actually
    warehouseName, 
    delivery_address || null
  ]
);

    // ===============================
// 📎 ATTACHMENTS INSERT
// ===============================
console.log("ATTACHMENTS RECEIVED:", req.body.attachments);
console.log("DELIVERY:", delivery_location, delivery_address);


if (req.files && req.files.length > 0) {
  for (let file of req.files) {
    await client.query(
      `INSERT INTO pr_attachments (
        pr_id,
        file_name,
        file_path
      )
      VALUES ($1, $2, $3)`,
      [
        pr_id,
        file.originalname,
        file.path   // 🔥 THIS IS REAL FILE PATH
      ]
    );
  }
}



    // ===============================
// 📊 STATUS HISTORY INSERT
// ===============================
await client.query(
  `INSERT INTO pr_status_history (
    pr_id,
    old_status,
    new_status,
    changed_by
  )
  VALUES ($1, $2, $3, $4)`,
  [
    pr_id,
    null,        // first time no old status
    "Draft",     // new status
    "system"
  ]
);



    // ===============================
    // ✅ COMMIT
    // ===============================
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "PR Created Successfully",
      pr_id
    });

  }  catch (error) {
  await client.query("ROLLBACK");

  console.error("CREATE PR ERROR MESSAGE:", error.message);
  console.error("FULL ERROR:", error); // 🔥 very important

  res.status(500).json({
    success: false,
    message: error.message
  });
}

   {
    client.release();
  }
};

//backend api controller for pr module//

async function submitPR(req, res) {
  try {
    const { pr_id } = req.body;

    if (!pr_id) {
      return res.status(400).json({
        success: false,
        message: "PR ID is required"
      });
    }

    // 🔥 Call Stored Procedure
    await db.query(
      "SELECT sp_submit_pr($1)",
      [pr_id]
    );

    res.json({
      success: true,
      message: "PR sent for approval successfully"
    });

  } catch (error) {
    console.error("SUBMIT PR ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


//update PR function //

const updatePR = async (req, res) => {
    console.log("🔥 UPDATE API HIT:", req.params.id);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const body = req.body;

    // 🔥 SAFE PARSE ITEMS
    let items = [];
    try {
      items = body.items ? JSON.parse(body.items) : [];
    } catch {
      throw new Error("Invalid items format");
    }

    // ===============================
    // 🔴 VALIDATIONS
    // ===============================
    if (!body.department?.trim() ||
        !body.cost_center?.trim() ||
        !body.priority?.trim() ||
        !body.pr_type?.trim()) {
      throw new Error("Required fields missing");
    }

    if (!body.justification || body.justification.trim().length < 10) {
      throw new Error("Justification must be at least 10 characters");
    }

    if (!items.length) {
      throw new Error("At least one item is required");
    }

    // ===============================
    // 🔴 UPDATE HEADER (ONLY DRAFT)
    // ===============================
    const updateResult = await client.query(
  `UPDATE pr_header SET
    department = $1,
    cost_center = $2,
    project_code = $3,
    priority = $4,
    pr_type = $5,
    justification = $6,
    internal_notes = $7,
    delivery_location = $8,
    delivery_address = $9,
    currency = $10,
    tax_estimate = $11,
    updated_at = NOW()
  WHERE pr_id = $12 AND status = 'Draft'
  RETURNING pr_id`,
  [
    body.department,              // $1
    body.cost_center,             // $2
    body.project_code || null,    // $3
    body.priority,                // $4
    body.pr_type,                 // $5
    body.justification,           // $6
    body.internal_notes || null,  // $7 ✅
    body.delivery_location || null, // $8
    body.delivery_address || null,  // $9
    body.currency || "INR",         // $10
    body.tax_estimate || 0,         // $11
    id                              // $12 ✅
  ]
);

    if (updateResult.rowCount === 0) {
      throw new Error("Only Draft PR can be updated");
    }

    // ===============================
    // 🔥 DELETE OLD ITEMS
    // ===============================
    await client.query(`DELETE FROM pr_items WHERE pr_id = $1`, [id]);

    // ===============================
    // 📦 INSERT NEW ITEMS
    // ===============================
    for (let item of items) {
      const qty = Number(item.requested_qty) || 0;
      const price = Number(item.estimated_unit_price) || 0;

      await client.query(
        `INSERT INTO pr_items (
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
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          id,
          item.item_type,
          item.item_id || null,
          item.item_description,
          item.uom,
          qty,
          price,
          qty * price,
          item.required_by_date,
          item.preferred_vendor || null
        ]
      );
    }

    // ===============================
    // 💰 RECALCULATE TOTALS
    // ===============================
    const totalResult = await client.query(
      `SELECT SUM(estimated_total_cost) AS total 
       FROM pr_items 
       WHERE pr_id = $1`,
      [id]
    );

    const estimatedValue = Number(totalResult.rows[0].total) || 0;
    const tax = Number(body.tax_estimate) || 0;

    await client.query(
      `UPDATE pr_header
       SET estimated_pr_value = $1,
           total_estimated_cost = $2
       WHERE pr_id = $3`,
      [estimatedValue, estimatedValue + tax, id]
    );

    // ===============================
    // 🚚 UPDATE DELIVERY
    // ===============================
    const wh = await client.query(
      `SELECT warehouse_name FROM warehouses WHERE warehouse_id = $1`,
      [body.delivery_location]
    );

    const warehouseName = wh.rows[0]?.warehouse_name || null;

    await client.query(
      `UPDATE pr_delivery
       SET warehouse_id = $1,
           warehouse_name = $2,
           delivery_address = $3
       WHERE pr_id = $4`,
      [
        body.delivery_location,
        warehouseName,
        body.delivery_address || null,
        id
      ]
    );

    // ===============================
    // 📎 UPDATE ATTACHMENTS
    // ===============================
    // optional: delete old attachments
   if (req.files && req.files.length > 0) {
  // 🔥 Only when new files uploaded
  await client.query(`DELETE FROM pr_attachments WHERE pr_id = $1`, [id]);

  for (let file of req.files) {
    await client.query(
      `INSERT INTO pr_attachments (
        pr_id,
        file_name,
        file_path
      )
      VALUES ($1, $2, $3)`,
      [
        id,
        file.originalname,
        file.path
      ]
    );
  }
}

    // ===============================
    // 📊 STATUS HISTORY (OPTIONAL)
    // ===============================
    await client.query(
      `INSERT INTO pr_status_history (
        pr_id,
        old_status,
        new_status,
        changed_by
      )
      VALUES ($1, $2, $3, $4)`,
      [
        id,
        "Draft",
        "Draft",
        "system"
      ]
    );

    // ===============================
    // ✅ COMMIT
    // ===============================
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "PR Updated Successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("UPDATE PR ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  } finally {
    client.release();
  }
};

// ===============================
module.exports = {
  createPR,
  getPRList,
  getPRById, 
  submitPR,
  updatePR,
};