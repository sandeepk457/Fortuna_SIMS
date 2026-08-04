const express = require("express");
const router = express.Router();

const controller = require("../controllers/ecommerceController");

// Executive Dashboard KPIs
router.get("/metrics", controller.getEcommerceMetrics);

// Demographic Analytics
router.get("/demographics", controller.getDemographics);

module.exports = router;