require("dotenv").config();

const express = require("express");
const cors = require("cors");
const  pool  = require("./config/db");


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

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Static uploads
app.use("/uploads", express.static("uploads"));

// API Routes
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

// Health check - useful for Render
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Fortuna SIMS Backend API is running",
  });
});

// Render provides PORT automatically.
// Local development falls back to port 5000.
const PORT = process.env.PORT || 5000;


app.get("/api/testdb", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "Database Connected",
      time: result.rows[0],
    });
  } catch (err) {
    console.error("DB Error:", err);

    res.status(500).json({
      status: "Database Connection Failed",
      error: err?.message || String(err),
      stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined,
    });
  }
});


app.listen(PORT, () => {
  console.log(`SIMS backend running on port ${PORT}`);
});