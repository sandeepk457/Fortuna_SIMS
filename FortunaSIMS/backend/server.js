
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");

const app = express();

// =====================================================
// CORS CONFIGURATION
// LOCAL + PRODUCTION
// =====================================================

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://fortuna-sims-frontend.onrender.com",
];

const allowedOrigins = (
  process.env.CORS_ORIGINS || defaultOrigins.join(",")
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  })
);

// =====================================================
// MIDDLEWARE
// =====================================================

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
// EXISTING ROUTES
// =====================================================

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

// =====================================================
// PURCHASE ORDER API
// =====================================================

app.use("/api/purchase-orders", purchaseOrderRoutes);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Fortuna SIMS Backend API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// =====================================================
// DEBUG ROUTE
// =====================================================

app.get("/api/debug/test", (req, res) => {
  res.status(200).json({
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
      error:
        process.env.NODE_ENV === "production"
          ? "Database connection failed"
          : err.message || String(err),
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
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("Backend Error:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed",
    });
  }

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
