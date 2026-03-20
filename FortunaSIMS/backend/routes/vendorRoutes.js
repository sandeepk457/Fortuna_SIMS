const express = require("express");
const router = express.Router();

const {
  createVendor,
  getAllVendors,
  deleteVendor,
} = require("../controllers/vendorController");

// CREATE
router.post("/", createVendor);

// GET ALL
router.get("/", getAllVendors);

// DELETE
router.delete("/:id", deleteVendor);

module.exports = router;