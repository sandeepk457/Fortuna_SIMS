const express = require("express");
const router = express.Router();

const asnController = require("../controllers/asnController");
const upload = require("../config/upload");

// PO
router.get(
  "/purchase-orders/eligible",
  asnController.getEligiblePurchaseOrders
);

router.get(
  "/purchase-orders/:poId",
  asnController.getPurchaseOrderForASN
);

// CRUD
router.get("/", asnController.getASNs);
router.post("/", asnController.createASN);

router.get("/:id", asnController.getASNById);
router.put("/:id", asnController.updateASN);
router.delete("/:id", asnController.deleteASN);

// Attachments
router.post(
  "/:id/attachments",
  upload.single("file"),
  asnController.uploadASNAttachment
);

router.delete(
  "/:id/attachments/:attachmentId",
  asnController.deleteASNAttachment
);



// Workflow
router.post("/:id/submit", asnController.submitASN);
router.patch("/:id/status", asnController.updateASNStatus);

module.exports = router;