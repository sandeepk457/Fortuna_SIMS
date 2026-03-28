const express = require("express");
const router = express.Router();
const controller = require("../controllers/itemController");


// 🔥 File Upload (Multer)
const multer = require("multer");

// Storage config (optional customization)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


// ===============================
// 📥 BULK UPLOAD (EXCEL)
// ===============================
router.post("/bulk-upload", upload.single("file"), controller.bulkUploadItems);

router.get("/:id", controller.getItemById);
router.put("/:id", controller.updateItem);

// ===============================
// ✅ CREATE ITEM
// ===============================
router.post("/", controller.createItem);


// ===============================
// 📥 GET ALL ITEMS
// ===============================
router.get("/", controller.getItems);


// ===============================
// 🔍 GET SINGLE ITEM
// ===============================
router.get("/:id", controller.getItemById);


// ===============================
// ✏️ UPDATE ITEM
// ===============================
router.put("/:id", controller.updateItem);


// ===============================
// ❌ DELETE ITEM (SOFT)
// ===============================
router.delete("/:id", controller.deleteItem);



module.exports = router;