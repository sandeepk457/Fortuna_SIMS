const express = require("express");
const router = express.Router();

const { saveForecast } = require("../controllers/demand.controller");

router.post("/forecast", saveForecast);

module.exports = router;