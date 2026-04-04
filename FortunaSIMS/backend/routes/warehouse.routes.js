const express = require("express");
const router = express.Router();

const controller = require("../controllers/warehouse.controller");

// CREATE
router.post("/", controller.createWarehouse);

// FULL CREATE
router.post("/full-create", controller.createFullWarehouse);

// ✅ ONLY THIS
router.get("/full/:code", controller.getFullWarehouseByCode);

// LIST
router.get("/", controller.getWarehouses);

// UPDATE
router.put("/full-update/:code", controller.updateFullWarehouse);

module.exports = router;