const db = require("../config/db");

/**
 * ✅ GET ECOMMERCE DASHBOARD METRICS
 * (Customers only for now — future ready)
 */
const getEcommerceMetrics = async (req, res) => {
  try {
    const customerResult = await db.query(`
      SELECT COUNT(*) AS total_customers
      FROM customers
      WHERE status = 'Active'
    `);

    res.json({
      totalCustomers: Number(customerResult.rows[0].total_customers || 0),

      // future ready 👇
      totalOrders: 0,
      totalRevenue: 0,
    });

  } catch (err) {
    console.error("Ecommerce Metrics Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getEcommerceMetrics,
};