const express = require("express");
const router = express.Router();

const controller = require("../controllers/customerController");
const multer = require("multer");

// 🔥 multer config
const upload = multer({ dest: "uploads/" });

// ✅ Specific routes first
router.get("/next-code", controller.getNextCustomerCode);

// 🔥 ONLY ONCE
router.post("/bulk-upload", upload.single("file"), controller.bulkUploadCustomers);

// Other routes
router.post("/", controller.saveCustomer);
router.get("/", controller.getCustomers);
router.delete("/:id", controller.deleteCustomer);

module.exports = router;