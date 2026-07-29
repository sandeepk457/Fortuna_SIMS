const express = require("express");
const router = express.Router();

const rfqController = require("../controllers/rfqController");
const upload = require("../config/upload");

console.log("RFQ ROUTES FILE LOADED");

// ======================================================
// TEST ROUTE
// ======================================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "RFQ Test Working",
  });
});

// ======================================================
// APPROVED PRs
// ======================================================

router.get(
  "/approved-prs",
  rfqController.getApprovedPRs
);

// ======================================================
// PR ITEMS
// ======================================================

router.get(
  "/pr/:prId/items",
  rfqController.getPRItems
);

// ======================================================
// VENDORS
// ======================================================

router.get(
  "/vendors",
  rfqController.getVendors
);

// ======================================================
// CREATE RFQ
// ======================================================

router.post(
  "/create",
  upload.array("attachments"),
  rfqController.createRFQ
);

// ======================================================
// RFQ LIST
// ======================================================

router.get(
  "/list",
  rfqController.getRFQList
);

// ======================================================
// DELETE SINGLE RFQ ATTACHMENT
// ======================================================

router.delete(
  "/:rfqId/attachments/:attachmentId",
  rfqController.deleteRFQAttachment
);

// ======================================================
// UPDATE RFQ
// ======================================================

router.put(
  "/:rfqId",
  upload.array("attachments"),
  rfqController.updateRFQ
);

// ======================================================
// GET RFQ BY ID
// Keep this parameter route after specific GET routes
// ======================================================

router.get(
  "/:rfqId",
  rfqController.getRFQById
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;