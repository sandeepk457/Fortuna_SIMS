const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();



const {
  createVendor,
  getAllVendors,
  getVendorById,
  deleteVendor,
  updateVendor, // ✅ Import update function
  bulkUploadVendors, // ✅ Import bulk upload function
} = require("../controllers/vendorController");

// CREATE
router.post("/", createVendor);

// BULK UPLOAD ROUTE
router.post("/bulk-upload", upload.single("file"), bulkUploadVendors);

// GET ALL
router.get("/", getAllVendors);


// DELETE
router.delete("/:id", deleteVendor);

// UPDATE
router.put("/:id", updateVendor);

// GET BY ID
router.get("/:id", getVendorById);


module.exports = router;