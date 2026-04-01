const express = require("express");
const router = express.Router();
// console.log(" Warehouse Routes Loaded");
const {
  createWarehouse,
  getWarehouses,
  createFullWarehouse   // 👈 add this
} = require("../controllers/warehouse.controller");

router.post("/", createWarehouse);
router.post("/full-create", createFullWarehouse); // 🔥 main API
router.get("/", getWarehouses);

module.exports = router;