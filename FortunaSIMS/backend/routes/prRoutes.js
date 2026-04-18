const express = require("express");
const router = express.Router();

const {
  createPR,
  getPRList,
  getPRById,
  submitPR,
  updatePR   // ✅ ensure imported
} = require("../controllers/prcontroller");

const upload = require("../config/upload");

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
// ✏️ UPDATE PR
// ===============================
router.put("/update/:id", upload.array("attachments"), updatePR);

// ===============================
// 📄 GET PR BY ID (LAST)
// ===============================
router.get("/:id", getPRById);

module.exports = router;