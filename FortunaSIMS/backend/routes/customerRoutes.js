const express = require("express");
const router = express.Router();

const controller = require("../controllers/customerController");

// ✅ IMPORTANT: Specific route FIRST
router.get("/next-code", controller.getNextCustomerCode);

// Other routes
router.post("/", controller.saveCustomer);
router.get("/", controller.getCustomers);
router.delete("/:id", controller.deleteCustomer);

module.exports = router;