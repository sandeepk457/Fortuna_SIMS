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

/**
 * ✅ SAVE CUSTOMER
 */
const saveCustomer = async (req, res) => {
  try {
    const data = req.body;

    await db.query(
      `SELECT upsert_customer(
        NULL,$1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,
        $20,$21,$22,
        $23,$24,$25,$26,
        $27,$28,$29,$30,
        $31,$32
      )`,
      [
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

module.exports = {
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getNextCustomerCode,
};