const express = require("express");
const router = express.Router();

const rfqController = require("../controllers/rfqController");

const upload = require("../config/upload");

console.log("RFQ ROUTES FILE LOADED");
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "RFQ Test Working"
  });
});


// RFQ APIs
router.get("/approved-prs", rfqController.getApprovedPRs);

router.get(
  "/pr/:prId/items",
  rfqController.getPRItems
);

router.get(
  "/vendors",
  rfqController.getVendors
);



router.post(
  "/create",
  upload.array("attachments"),
  rfqController.createRFQ
);


router.get(
  "/list",
  rfqController.getRFQList
);


router.get(
    "/:rfqId", rfqController.getRFQById
);

module.exports = router;