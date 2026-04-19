const express = require("express");
const router = express.Router();

const controller = require("../controllers/ecommerceController");

// ✅ Single KPI API
router.get("/metrics", controller.getEcommerceMetrics);

module.exports = router;