const express = require("express");
const router = express.Router();

const rfqController = require("../controllers/rfqController");

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
  rfqController.createRFQ
);


router.get(
  "/list",
  rfqController.getRFQList
);




module.exports = router;