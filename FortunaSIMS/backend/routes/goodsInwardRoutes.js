const express = require("express");
const router = express.Router();

const goodsInwardController = require("../controllers/goodsInwardController");

// GOODS INWARD LIST
router.get("/", goodsInwardController.getGoodsInwards);

// ELIGIBLE SUBMITTED ASNs
router.get("/asn/eligible", goodsInwardController.getEligibleASNs);

// ACTIVE USERS
router.get("/users", goodsInwardController.getAssignableUsers);

// CREATE GOODS INWARD
router.post("/", goodsInwardController.createGoodsInward);

// GOODS INWARD DETAILS
router.get("/:id", goodsInwardController.getGoodsInwardById);

module.exports = router;