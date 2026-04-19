const db = require("../config/db");

/**
 * ✅ GET ALL CUSTOMERS
 */
const getCustomers = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM get_customers()`);

    const formatted = result.rows.map((c) => ({
      customer_id: c.customer_id,
      code: c.customer_code,
      name: c.customer_name,
      tier: c.customer_type,
      phone: c.contact_phone,
      city: c.city,
      paymentTerms: c.payment_terms,
      creditLimit: Number(c.credit_limit || 0),
      status: c.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get customer count (for dashboard)//

const getCustomerCount = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT COUNT(*) AS total_customers 
      FROM customers 
      WHERE status = 'Active'
    `);

    res.json({
      totalCustomers: Number(result.rows[0].total_customers || 0),
    });

  } catch (err) {
    console.error("Error fetching customer count:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ SAVE CUSTOMER
 */
const saveCustomer = async (req, res) => {
  try {
    const data = req.body;

    await db.query(
  `SELECT upsert_customer(
    $1::INT,
    $2::TEXT,
    $3::TEXT,
    $4::TEXT,
    $5::TEXT,
    $6::TEXT,
    $7::TEXT,
    $8::TEXT,
    $9::TEXT,
    $10::TEXT,
    $11::TEXT,
    $12::TEXT,
    $13::TEXT,
    $14::TEXT,
    $15::TEXT,
    $16::TEXT,
    $17::TEXT,
    $18::NUMERIC,
    $19::INT,
    $20::TEXT,
    $21::BOOLEAN,
    $22::NUMERIC,
    $23::NUMERIC,
    $24::TEXT,
    $25::TEXT,
    $26::BOOLEAN,
    $27::TEXT,
    $28::TEXT,
    $29::TEXT,
    $30::TEXT,
    $31::TEXT,
    $32::TEXT,
    $33::TEXT
  )`,
      [
        data.customer_id || null,
        data.customer_code,
        data.customer_name,
        data.customer_type,
        data.customer_tier,
        data.contact_person_name,
        data.contact_phone,
        data.contact_email,
        data.alternate_phone,
        data.billing_address,
        data.shipping_address,
        data.city,
        data.state,
        data.country,
        data.postal_code,
        data.currency,
        data.payment_terms,
        data.credit_limit,
        data.credit_days,
        data.price_list_ref,
        data.tax_applicable,
        data.gst_percentage,
        data.discount_percentage,
        data.gstin,
        data.pan,
        data.msme_registered,
        data.msme_number,
        data.bank_account_name,
        data.bank_account_number,
        data.bank_name,
        data.ifsc_code,
        data.compliance_status,
        data.status,
      ]
    );

    res.json({
      success: true,
      message: "Customer saved successfully",
    });
  } catch (err) {
    console.error("Error saving customer:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ DELETE CUSTOMER (SOFT DELETE)
 */
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE customers 
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP 
       WHERE customer_id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: "Customer deleted (soft)",
    });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ GET NEXT CUSTOMER CODE (TEMP API)
 */
const getNextCustomerCode = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT customer_code 
      FROM customers 
      ORDER BY customer_id DESC 
      LIMIT 1
    `);

    let nextCode = "CUST-0001";

    if (result.rows.length > 0) {
      const lastCode = result.rows[0].customer_code;
      const num = parseInt(lastCode.split("-")[1]);
      const nextNum = num + 1;

      nextCode = `CUST-${String(nextNum).padStart(4, "0")}`;
    }

    res.json({ success: true, code: nextCode });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

//bulk upload customers
const XLSX = require("xlsx");
const fs = require("fs");

const bulkUploadCustomers = async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (const r of rows) {
      try {
        // 🔴 VALIDATIONS
        if (!r.customer_name) throw new Error("Customer Name missing");
        if (!r.customer_type) throw new Error("Customer Type missing");
        if (!r.customer_tier) throw new Error("Customer Tier missing");
        if (!r.contact_person_name) throw new Error("Contact Person Name missing");
        if (!r.billing_address) throw new Error("Billing Address missing");
        if (!r.contact_phone) throw new Error("Phone missing");
        if (!r.contact_email) throw new Error("Email missing");
        if (!r.city) throw new Error("City missing");
        if (!r.state) throw new Error("State missing");
        if (!r.country) throw new Error("Country missing");
        if (!r.payment_terms) throw new Error("Payment Terms missing");
        if (!r.tax_applicable === undefined) throw new Error("Tax Applicable missing");
        if (!r.tax_applicable && !r.gst_percentage) throw new Error("GST Percentage missing");
        if (!r.gstin) throw new Error("GSTIN missing");
        if (!r.pan) throw new Error("PAN missing");
        if (!r.credit_limit) throw new Error("Credit Limit missing");
        if (!r.status) throw new Error("Status missing");
        

        await db.query(
          `SELECT upsert_customer(
            NULL,$1,$2,$3,$4,$5,$6,$7,$8,
            $9,$10,$11,$12,$13,$14,
            $15,$16,$17,$18,$19,
            $20,$21,$22,
            $23,$24,$25,$26,
            $27,$28,$29,$30,
            $31,$32,$33
          )`,
          [
            r.customer_code,
            r.customer_name,
            r.customer_type,
            r.customer_tier,
            r.contact_person_name,
            r.contact_phone,
            r.contact_email,
            r.alternate_phone,
            r.billing_address,
            r.shipping_address,
            r.city,
            r.state,
            r.country,
            r.postal_code,
            r.currency,
            r.payment_terms,
            r.credit_limit,
            r.credit_days,
            null,
            r.tax_applicable,
            r.gst_percentage,
            r.discount_percentage,
            r.gstin,
            r.pan,
            r.msme_registered,
            r.msme_number,
            r.bank_account_name,
            r.bank_account_number,
            r.bank_name,
            r.ifsc_code,
            r.compliance_status,
            r.status,
          ]
        );

        inserted++;

      } catch (err) {
        skipped++;

        // 🔥 store error row
        errors.push({
          ...r,
          error_message: err.message,
        });
      }
    }

    // 🔥 GENERATE ERROR FILE
    let errorFile = null;

    if (errors.length > 0) {
      const ws = XLSX.utils.json_to_sheet(errors);
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "Errors");

      errorFile = `uploads/customer-errors-${Date.now()}.xlsx`;

      XLSX.writeFile(wb, errorFile);
    }

    res.json({
      inserted,
      skipped,
      errorFile, // 🔥 send path
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//upsert customer (used for both create and update)
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
            `SELECT * FROM customers WHERE customer_id = $1`,
      [id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//update customer//

const updateCustomer = async (req, res) => {
  try {
    const data = req.body;
    const id = req.params.id;

    await db.query(
      `SELECT upsert_customer(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20,
        $21,$22,$23,
        $24,$25,$26,$27,
        $28,$29,$30,$31,
        $32,$33
      )`,
      [
        id,
        data.customer_code,
        data.customer_name,
        data.customer_type,
        data.customer_tier,
        data.contact_person_name,
        data.contact_phone,
        data.contact_email,
        data.alternate_phone,
        data.billing_address,
        data.shipping_address,
        data.city,
        data.state,
        data.country,
        data.postal_code,
        data.currency,
        data.payment_terms,
        data.credit_limit,
        data.credit_days,
        data.price_list_ref,
        data.tax_applicable,
        data.gst_percentage,
        data.discount_percentage,
        data.gstin,
        data.pan,
        data.msme_registered,
        data.msme_number,
        data.bank_account_name,
        data.bank_account_number,
        data.bank_name,
        data.ifsc_code,
        data.compliance_status,
        data.status,
      ]
    );

    res.json({ success: true, message: "Customer updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


  module.exports = {
  getCustomers,
  getCustomerCount,
  saveCustomer,
  deleteCustomer,
  getNextCustomerCode,
  bulkUploadCustomers,
  getCustomerById,
  updateCustomer,   // 🔥 ADD THIS
};
