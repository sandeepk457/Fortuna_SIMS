const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes"); // ✅ Add vendor routes
const itemRoutes = require("./routes/itemRoutes");  // ✅ Add Items routes
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
// NEW (Vendor APIs)
app.use("/api/vendors", vendorRoutes); // 👈 this is  vendor api
// NEW (Item Master APIs)
app.use("/api/items", itemRoutes); // 👈 this is  Item Master api
app.listen(5000, () => {
  console.log("SIMS backend running on port 5000");
});



