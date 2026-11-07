
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");

// Existing Routes
const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const itemRoutes = require("./routes/itemRoutes");
const uomRoutes = require("./routes/uom.routes.js");
const demandRoutes = require("./routes/demand.routes.js");
const warehouseRoutes = require("./routes/warehouse.routes.js");
const customerRoutes = require("./routes/customerRoutes");
const prRoutes = require("./routes/prRoutes");
const ecommerceRoutes = require("./routes/ecommerceRoutes");
const rfqRoutes = require("./routes/rfqRoutes");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  })
);

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/uoms", uomRoutes);
app.use("/api/demand", demandRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/ecommerce", ecommerceRoutes);
app.use("/api/rfq", rfqRoutes);

// Purchase Order API
app.use("/api/purchase-orders", purchaseOrderRoutes);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Fortuna SIMS Backend API is running",
  });
});

app.get("/api/debug/test", (req, res) => {
  res.json({
    success: true,
    message: "Debug route working",
  });
});

// =====================================================
// DATABASE CONNECTION TEST
// =====================================================

app.get("/api/testdb", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      status: "Database Connected",
      time: result.rows[0],
    });
  } catch (err) {
    console.error("Database Error:", err);

    res.status(500).json({
      status: "Database Connection Failed",
      error: err?.message || String(err),
      stack:
        process.env.NODE_ENV !== "production"
          ? err?.stack
          : undefined,
    });
  }
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    serverFile: __filename,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("Backend Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
  });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Fortuna SIMS Backend running on port ${PORT}`);
});
