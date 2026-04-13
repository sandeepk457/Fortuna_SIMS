const pool = require("../config/db");

// 🔥 GENERATE VENDOR CODE
const generateVendorCode = async (client) => {
  const res = await client.query(`
    SELECT 'VND-' || LPAD(CAST(COUNT(*) + 1 AS TEXT), 3, '0') AS code
    FROM vendors
  `);
  return res.rows[0].code;
};

// CREATE
const createVendor = async (req, res) => {
  const client = await pool.connect();

  try {
    const data = req.body;

    await client.query("BEGIN");

    // ✅ Generate Vendor Code
    const vendorCode = await generateVendorCode(client);

    console.log("Vendor Code:", vendorCode);

    const vendorRes = await client.query(
  `INSERT INTO vendors (
    vendor_code, vendor_name, vendor_type, vendor_category, vendor_tier,
    contact_person_name, contact_phone, contact_email, alternate_phone,
    registered_address, city, state, country, postal_code, status
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
  RETURNING id, vendor_code`,
  [
    vendorCode,
    data.vendor_name,
    data.vendor_type,
    data.vendor_category,
    data.vendor_tier,
    data.contact_person_name,
    data.contact_phone,
    data.contact_email,
    data.alternate_phone,
    data.registered_address,
    data.city,
    data.state,
    data.country,
    data.postal_code,
    data.status,
  ]
);

    const vendorId = vendorRes.rows[0].id;

    await client.query(
  `INSERT INTO vendor_commercials (
    vendor_id, currency, payment_terms,
    credit_limit, lead_time_days, incoterms,
    gst_percentage, minimum_order_qty,
    discount_percentage, freight_terms, penalty_clause
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
  [
    vendorId,
    data.currency,
    data.payment_terms,
    data.credit_limit || null,
    data.lead_time_days || null,
    data.incoterms || null,
    data.gst_percentage || null,
    data.minimum_order_qty || null,
    data.discount_percentage || null,
    data.freight_terms || null,
    data.penalty_clause || false,
  ]
);

    await client.query(
  `INSERT INTO vendor_compliance (
    vendor_id, gstin, pan, bank_account_name,
    bank_account_number, bank_name, ifsc_code, compliance_status
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  ON CONFLICT (vendor_id)
  DO UPDATE SET
    gstin=EXCLUDED.gstin,
    pan=EXCLUDED.pan,
    bank_account_name=EXCLUDED.bank_account_name,
    bank_account_number=EXCLUDED.bank_account_number,
    bank_name=EXCLUDED.bank_name,
    ifsc_code=EXCLUDED.ifsc_code,
    compliance_status=EXCLUDED.compliance_status`,
  [
    vendorId,
    data.gstin,
    data.pan,
    data.bank_account_name,
    data.bank_account_number,
    data.bank_name,
    data.ifsc_code,
    data.compliance_status,
  ]
);

    await client.query("COMMIT");

    res.json({
  message: "Vendor Created Successfully",
  vendor_id: vendorId,
  vendor_code: vendorCode,
});

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET ALL (🔥 FIXED FORMAT)
const getAllVendors = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        vendor_code AS code,
        vendor_name AS name,
        vendor_category AS category,
        vendor_tier AS tier,
        contact_phone AS phone,
        city,
        status
      FROM vendors
      WHERE is_deleted = false
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET BY ID (FOR EDIT)
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        v.*,
        vc.currency,
        vc.payment_terms,
        vc.credit_limit,
        vc.lead_time_days,
        vc.incoterms,
        vc.minimum_order_qty,
        vc.gst_percentage,
        vc.discount_percentage,
        vc.freight_terms,
        comp.gstin,
        comp.pan,
        comp.bank_account_name,
        comp.bank_account_number,
        comp.bank_name,
        comp.ifsc_code,
        comp.compliance_status
      FROM vendors v
      LEFT JOIN vendor_commercials vc ON v.id = vc.vendor_id
      LEFT JOIN vendor_compliance comp ON v.id = comp.vendor_id
      WHERE v.id = $1 AND v.is_deleted = false
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE
const deleteVendor = async (req, res) => {
  const { id } = req.params;

  await pool.query(
    `UPDATE vendors SET is_deleted = true WHERE id = $1`,
    [id]
  );

  res.json({ message: "Deleted Successfully" });
};

// UPDATE VENDOR
const updateVendor = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const data = req.body;

    await client.query("BEGIN");

    // 🔥 DUPLICATE CHECK (CRITICAL FIX)
    const duplicateCheck = await client.query(
      `SELECT * FROM vendor_compliance
       WHERE (gstin = $1 OR pan = $2)
       AND vendor_id != $3`,
      [data.gstin, data.pan, id]
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Duplicate GSTIN or PAN already exists",
      });
    }

    // 🔹 UPDATE vendors
    await client.query(
      `UPDATE vendors SET
        vendor_name=$1,
        vendor_type=$2,
        vendor_category=$3,
        vendor_tier=$4,
        contact_person_name=$5,
        contact_phone=$6,
        contact_email=$7,
        alternate_phone=$8,
        registered_address=$9,
        city=$10,
        state=$11,
        country=$12,
        postal_code=$13,
        status=$14
      WHERE id=$15`,
      [
        data.vendor_name,
        data.vendor_type,
        data.vendor_category,
        data.vendor_tier,
        data.contact_person_name,
        data.contact_phone,
        data.contact_email,
        data.alternate_phone,
        data.registered_address,
        data.city,
        data.state,
        data.country,
        data.postal_code,
        data.status,
        id,
      ]
    );

    // 🔹 UPDATE commercial
    await client.query(
  `INSERT INTO vendor_commercials (
    vendor_id, currency, payment_terms,
    credit_limit, lead_time_days, incoterms,
    gst_percentage, minimum_order_qty,
    discount_percentage, freight_terms, penalty_clause
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  ON CONFLICT (vendor_id)
  DO UPDATE SET
    currency=EXCLUDED.currency,
    payment_terms=EXCLUDED.payment_terms,
    credit_limit=EXCLUDED.credit_limit,
    lead_time_days=EXCLUDED.lead_time_days,
    incoterms=EXCLUDED.incoterms,
    gst_percentage=EXCLUDED.gst_percentage,
    minimum_order_qty=EXCLUDED.minimum_order_qty,
    discount_percentage=EXCLUDED.discount_percentage,
    freight_terms=EXCLUDED.freight_terms,
    penalty_clause=EXCLUDED.penalty_clause`,
  [
    id,
    data.currency,
    data.payment_terms,
    data.credit_limit || null,
    data.lead_time_days || null,
    data.incoterms || null,
    data.gst_percentage || null,
    data.minimum_order_qty || null,
    data.discount_percentage || null,
    data.freight_terms || null,
    data.penalty_clause || false,
  ]
);

    // 🔹 UPDATE compliance
    await client.query(
      `UPDATE vendor_compliance SET
        gstin=$1,
        pan=$2,
        bank_account_name=$3,
        bank_account_number=$4,
        bank_name=$5,
        ifsc_code=$6,
        compliance_status=$7
      WHERE vendor_id=$8
  RETURNING *`,
      [
        data.gstin,
        data.pan,
        data.bank_account_name,
        data.bank_account_number,
        data.bank_name,
        data.ifsc_code,
        data.compliance_status,
        id,
      ]
    );

    await client.query("COMMIT");

    res.json({ message: "Vendor Updated Successfully" });

  } catch (err) {
    await client.query("ROLLBACK");

    // 🔥 HANDLE UNIQUE ERROR (EXTRA SAFETY)
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Duplicate GSTIN or PAN not allowed",
      });
    }

    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });

  } finally {
    client.release();
  }
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  deleteVendor,
  updateVendor, // ✅ Export update function
};

