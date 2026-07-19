const db = require("../config/db");
const crypto = require("crypto");
// console.log("RFQ Controller File Loaded");

// ============================
// Get Approved PRs
// ============================
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
ORDER BY pr.created_at DESC;
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("GET APPROVED PR ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================
// Get PR Items
// ============================
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

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("GET PR ITEMS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================
// Get Vendors
// ============================
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

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    console.error("GET VENDORS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================
// Create RFQ
// ============================



const createRFQ = async (req, res) => {
console.log("FILES =", req.files);
console.log("BODY =", req.body);

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
  terms = {}
} = data;

console.log(
  "ITEMS FROM FRONTEND =",
  JSON.stringify(items, null, 2)
);

console.log(
  "RFQ ATTACHMENTS RECEIVED =",
    req.files

);

// =====================================
// Check Duplicate RFQ for same PR
// =====================================
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
    rfqNumber: existingRFQ.rows[0].rfq_number
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

    // RFQ Header

console.log("HEADER INSERT START");

console.log("REMARKS =", remarks);
console.log("INTERNAL NOTES =", internal_notes);




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
  rfqId,                                 // $1
  rfqNumber,                             // $2
  pr_id,                                 // $3
  pr_number,                             // $4
  department,                            // $5
  requestor,                             // $6
  quotation_due_date,                    // $7
  rfq_type,                              // $8
  currency,                              // $9
  priority,                              // $10
  status || "Draft",                     // $11
  remarks,                               // $12
  items.length,                          // $13
  Number(estimated_value || 0),          // $14
  created_by || requestor || "System",   // $15
  internal_notes || ""                   // $16
]
);

console.log("HEADER INSERT DONE");

const checkRFQ = await client.query(
`
SELECT
  remarks,
  internal_notes
FROM rfq
WHERE rfq_id = $1
`,
[rfqId]
);

console.log(
  "AFTER INSERT RFQ =",
  checkRFQ.rows[0]
);

   // RFQ Items + Quotes
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
      item.requested_qty
    ]
  );

  const rfqItemId =
    itemResult.rows[0].rfq_item_id;

    console.log(
  "RFQ ITEM ID =",
  rfqItemId
);

  // Save Vendor Quotes
  if (item.quotes_by_vendor) {

    for (const vendorId of Object.keys(item.quotes_by_vendor)) {

      console.log(
  "VENDOR IDS =",
  Object.keys(item.quotes_by_vendor || {})
);

      const quote = item.quotes_by_vendor[vendorId];

      const quoteResult = await client.query(
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
RETURNING *
`,
[
  rfqId,
  rfqItemId,
  vendorId,
  Number(quote.quoted_unit_price || 0),
  Number(quote.delivery_days || 0),
  Number(quote.tax_percentage || 0),
  quote.warranty_terms || ""
]
);

console.log(
  "QUOTE INSERT RESULT =",
  quoteResult.rows
);

} 

   } 

} 

    // Vendors
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
          vendor.vendor_email
        ]
      );
    }

    // Terms
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
        terms.special_conditions || ""
      ]
    );

    // ============================
// RFQ Attachments
// ============================

// RFQ Attachments
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
        file.originalname
      ]
    );
  }
}

    console.log(
      "ATTACHMENTS INSERT COUNT =",
      req.files?.length || 0
);

    await client.query("COMMIT");

    res.json({
      success: true,
      rfqId,
      rfqNumber,
      message: "RFQ Saved Successfully"
    });

    } catch (error) {

    console.error("CREATE RFQ ERROR FULL =", error);

    await client.query("ROLLBACK");

    res.status(500).json({
      success: false,
      message: error.message
    });

  } finally {

    client.release();

  }
  
};

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

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    console.error("GET RFQ LIST ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getRFQById = async (req, res) => {
  try {

    const { rfqId } = req.params;

    const header = await db.query(
      `
      SELECT
  rfq_id,
  rfq_number,

  TO_CHAR(rfq_date,'YYYY-MM-DD') AS rfq_date,

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

console.log(
  "HEADER DATA =",
  header.rows[0]
);

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


    res.json({
      success: true,
      header: header.rows[0],
      items: items.rows,
      vendors: vendors.rows,
      terms: terms.rows[0] || {},
      attachments: attachments.rows,
      quotes: quotes.rows
    });

    

  } catch (error) {

    console.error("GET RFQ BY ID ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// update rfq header, items, quotes, vendors, terms, attachments//

const updateRFQ = async (req, res) => {
   console.log("UPDATE RFQ HIT");

   const client = await db.connect();
  try {

    await client.query("BEGIN");

    const { rfqId } = req.params;

    const rfqData = JSON.parse(
      req.body.rfqData
    );

    const checkRFQ = await db.query(
      `
      SELECT status
      FROM rfq
      WHERE rfq_id = $1
      `,
      [rfqId]
    );

    

    if (
      checkRFQ.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found"
      });
    }

    if (
      checkRFQ.rows[0].status !== "Draft"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only Draft RFQ can be edited"
      });
    }

   console.log("RFQ DATA =", rfqData);

   const {
quotation_due_date,
rfq_type,
currency,
priority,
remarks,
estimated_value,
internal_notes
} = rfqData;

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
  internal_notes = $7
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
rfqId
]
);

console.log("HEADER UPDATED");

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


console.log("OLD ITEMS DELETED");

   console.log(
  "VENDORS COUNT =",
  rfqData.vendors?.length
);

//update rfq header, items, quotes, vendors, terms, attachments// 
  
for (const item of rfqData.items || []) {



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

      item.requested_qty

    ]

  );



  const rfqItemId =

    itemResult.rows[0].rfq_item_id;



  if (item.quotes_by_vendor) {



    for (const vendorId of Object.keys(item.quotes_by_vendor)) {



      const quote = item.quotes_by_vendor[vendorId];



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

        Number(quote.quoted_unit_price || 0),

        Number(quote.delivery_days || 0),

        Number(quote.tax_percentage || 0),

        quote.warranty_terms || ""

      ]

      );



    }

  }

}

console.log("ITEMS + QUOTES INSERTED");

await client.query("COMMIT");

console.log("COMMIT SUCCESS");

return res.json({
  success: true,
  message: "RFQ Updated Successfully"
});

console.log(
  "ITEMS COUNT =",
  rfqData.items?.length
);

console.log(
  "ATTACHMENTS COUNT =",
  rfqData.attachments?.length
);

console.log(
  "TERMS =",
  rfqData.terms
);

    // continue update...

  } catch (err) {

  await client.query("ROLLBACK");

  console.error("UPDATE RFQ ERROR =", err);

  return res.status(500).json({
    success: false,
    message: err.message
  });

} finally {

  client.release();

}
};

// console.log("EXPORTING RFQ CONTROLLER");

module.exports = {
  getApprovedPRs,
  getPRItems,
  getVendors,
  createRFQ,
  getRFQList,
  getRFQById,
  updateRFQ
};