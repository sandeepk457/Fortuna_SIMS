const express = require("express");
const router = express.Router();

const purchaseOrderController = require("../controllers/purchaseOrderController");

// ==========================================
// PURCHASE ORDER CRUD ROUTES
// ==========================================

// GET: Purchase Order List
router.get(
  "/",
  purchaseOrderController.getPurchaseOrders
);

// GET: Purchase Order Details
router.get(
  "/:id",
  purchaseOrderController.getPurchaseOrderById
);

// POST: Create Purchase Order
router.post(
  "/",
  purchaseOrderController.createPurchaseOrder
);

// PUT: Update Purchase Order
router.put(
  "/:id",
  purchaseOrderController.updatePurchaseOrder
);

// ==========================================
// PURCHASE ORDER APPROVAL ROUTES
// ==========================================

// POST: Submit Draft PO for Approval
router.post(
  "/:id/submit-for-approval",
  purchaseOrderController.submitPurchaseOrderForApproval
);

// POST: Procurement Manager Approve / Reject PO
router.post(
  "/:id/approval",
  purchaseOrderController.approveOrRejectPurchaseOrder
);

// ==========================================
// PURCHASE ORDER ISSUE ROUTE
// ==========================================

// POST: Issue Approved PO to Vendor
router.post(
  "/:id/issue",
  purchaseOrderController.issuePurchaseOrderToVendor
);

module.exports = router;