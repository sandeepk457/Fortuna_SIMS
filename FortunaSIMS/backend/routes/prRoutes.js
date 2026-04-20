const express = require("express");
const router = express.Router();

const {
  createPR,
  getPRList,
  getPRById,
  getPRApprovals,
  submitPR,
  updatePR,
  approvePR,
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
// 📄 GET PR APPROVALS
// ===============================
router.get("/:id/approvals", getPRApprovals);

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


// ===============================
// PR Approval Workflow
// ===============================
router.post("/approve", approvePR);




module.exports = router;