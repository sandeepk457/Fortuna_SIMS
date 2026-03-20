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
      RETURNING id`,
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
      `INSERT INTO vendor_commercials (vendor_id, currency, payment_terms)
       VALUES ($1,$2,$3)`,
      [vendorId, data.currency, data.payment_terms]
    );

    await client.query(
      `INSERT INTO vendor_compliance (
        vendor_id, gstin, pan, bank_account_name,
        bank_account_number, bank_name, ifsc_code, compliance_status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
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

    res.json({ message: "Vendor Created Successfully" });

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

// DELETE
const deleteVendor = async (req, res) => {
  const { id } = req.params;

  await pool.query(
    `UPDATE vendors SET is_deleted = true WHERE id = $1`,
    [id]
  );

  res.json({ message: "Deleted Successfully" });
};

module.exports = {
  createVendor,
  getAllVendors,
  deleteVendor,
};