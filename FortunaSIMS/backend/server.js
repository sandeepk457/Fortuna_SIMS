const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes"); // ✅ Add vendor routes
const itemRoutes = require("./routes/itemRoutes");  // ✅ Add Items routes
const uomRoutes = require("./routes/uom.routes.js"); // ✅ Add UOM routes
const demandRoutes = require("./routes/demand.routes.js"); // ✅ Add demand forecast routes
const warehouseRoutes = require("./routes/warehouse.routes.js"); // ✅ Add  warehouse routes
const customerRoutes = require("./routes/customerRoutes"); // ✅ Add  customer routes
const prRoutes = require("./routes/prRoutes"); // ✅ Add PR routes
const ecommerceRoutes = require("./routes/ecommerceRoutes"); // ✅ Add ecommerce routes

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
// NEW (Vendor APIs)
app.use("/api/vendors", vendorRoutes); // 👈 this is  vendor api
// NEW (Item Master APIs)
app.use("/api/items", itemRoutes); // 👈 this is  Item Master api

//  Warehouse APIs
app.use("/api/warehouses", warehouseRoutes); // 👈 this is  warehouse api 

// UOM APIs
app.use("/api/uoms", uomRoutes); // 👈 this is  UOM api

// Demand Forecast APIs
app.use("/api/demand", demandRoutes); // 👈 this is  demand forecast api

// Customer APIs
app.use("/api/customers", customerRoutes); // 👈 this is  customer api

// PR APIs
app.use("/api/pr", prRoutes); // 👈 this is  PR api

// Ecommerce APIs
app.use("/api/ecommerce", ecommerceRoutes); // 👈 this is  ecommerce api


app.listen(5000, () => {
  console.log("SIMS backend running on port 5000");
});








