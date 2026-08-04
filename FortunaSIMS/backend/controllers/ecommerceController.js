const db = require("../config/db");

/**
 * ======================================================
 * GET EXECUTIVE DASHBOARD METRICS
 * ======================================================
 */
const getEcommerceMetrics = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        (
          SELECT COUNT(*)
          FROM customers
          WHERE status = 'Active'
        ) AS total_customers,

        (
          SELECT COUNT(*)
          FROM vendors
        ) AS total_vendors,

        (
          SELECT COUNT(*)
          FROM items
        ) AS total_items,

        (
          SELECT COUNT(*)
          FROM warehouses
        ) AS total_warehouses,

        (
          SELECT COUNT(*)
          FROM pr_header
        ) AS total_pr,

        (
          SELECT COUNT(*)
          FROM rfq
        ) AS total_rfq,

        (
          SELECT COUNT(*)
          FROM purchase_orders
        ) AS total_po,

        (
          SELECT COUNT(*)
          FROM grn_execution_hdr
        ) AS total_grn
    `);

    const metrics = result.rows[0];

    res.json({
      totalCustomers: Number(metrics.total_customers || 0),
      totalVendors: Number(metrics.total_vendors || 0),
      totalItems: Number(metrics.total_items || 0),
      totalWarehouses: Number(metrics.total_warehouses || 0),

      totalPR: Number(metrics.total_pr || 0),
      totalRFQ: Number(metrics.total_rfq || 0),

      totalPO: Number(metrics.total_po || 0),
      totalGRN: Number(metrics.total_grn || 0),

      // Reserved for future Sales Dashboard
      totalOrders: 0,
      totalRevenue: 0,
    });

  } catch (err) {

    console.error("Executive Dashboard Metrics Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

module.exports = {
  getEcommerceMetrics,
};