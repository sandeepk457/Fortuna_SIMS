const express = require("express");
const router = express.Router();

const controller = require("../controllers/uom.controller");

// console.log("Controller:", controller);
// console.log("getAllUoms:", controller.getAllUoms);

router.get("/", controller.getAllUoms);
router.post("/", controller.createUom);
router.put("/:id", controller.updateUom);
router.delete("/:id", controller.deleteUom);

module.exports = router;