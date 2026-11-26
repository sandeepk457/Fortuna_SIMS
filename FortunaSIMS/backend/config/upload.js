
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// =====================================================
// CLOUDINARY CONFIGURATION
// =====================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =====================================================
// CLOUD STORAGE - ALL DOCUMENT ATTACHMENTS
// ASN, GRN, PO, PR, RFQ, etc.
// =====================================================
const cloudStorage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    const originalName = path.parse(file.originalname).name;

    const safeName = originalName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 100);

    return {
      folder: "fortuna-sims/attachments",
      resource_type: "auto",
      public_id: `${Date.now()}-${safeName}`,
    };
  },
});

// =====================================================
// LOCAL TEMP STORAGE - EXCEL / CSV IMPORTS ONLY
// =====================================================
const uploadDir = path.join(__dirname, "..", "uploads", "temp");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const localImportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// =====================================================
// IMPORT FILE FILTER
// =====================================================
const importFileFilter = (req, file, cb) => {
  const allowedExtensions = [".xlsx", ".xls", ".csv"];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error("Only Excel (.xlsx, .xls) and CSV files are allowed for import."));
};

// =====================================================
// CLOUDINARY UPLOAD MIDDLEWARE
// Default middleware for attachments
// =====================================================
const upload = multer({
  storage: cloudStorage,
});

// =====================================================
// LOCAL IMPORT MIDDLEWARE
// Explicitly use only for Excel / CSV import routes
// =====================================================
const localImport = multer({
  storage: localImportStorage,
  fileFilter: importFileFilter,
});

// =====================================================
// EXPORT
// =====================================================
upload.localImport = localImport;

module.exports = upload;
