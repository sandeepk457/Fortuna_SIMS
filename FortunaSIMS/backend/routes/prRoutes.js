const express = require("express");
const router = express.Router();
const {
  createPR,
  getPRList,
  getPRById,
  submitPR
} = require("../controllers/prcontroller");

const upload = require("../config/upload"); // or correct path

// ===============================
// 🆕 CREATE PR
// ===============================
router.post("/create", upload.array("attachments"), createPR);

// ===============================
// 📄 GET PR LIST
// ===============================
router.get("/list", getPRList);

// ===============================
// 🚀 SUBMIT PR
// ===============================
router.post("/submit", submitPR);

// ===============================
// 📄 GET PR BY ID (⚠️ ALWAYS LAST)
// ===============================
router.get("/:id", getPRById);

// // 🔥 MULTIPLE FILES SUPPORT
 router.post("/create", upload.array("attachments"), createPR);

module.exports = router;