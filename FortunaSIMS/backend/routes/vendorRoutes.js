const express = require("express");
const router = express.Router();

const {
  createVendor,
  getAllVendors,
  getVendorById,
  deleteVendor,
  updateVendor, // ✅ Import update function
} = require("../controllers/vendorController");

// CREATE
router.post("/", createVendor);

// GET ALL
router.get("/", getAllVendors);


// DELETE
router.delete("/:id", deleteVendor);

// UPDATE
router.put("/:id", updateVendor);

// GET BY ID
router.get("/:id", getVendorById);

module.exports = router;