"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/* =========================================================
   TYPES
========================================================= */

type QuotationStatus =
  | "Draft"
  | "Submitted"
  | "Under Approval"
  | "Approved"
  | "Rejected"
  | "Sent to Customer"
  | "Accepted"
  | "Expired"
  | "Converted to SO";

type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "INR"
  | "AED"
  | "SAR"
  | "SGD";

type ApprovalAction = "Submitted" | "Approved" | "Rejected";

type ApprovalHistoryEntry = {
  id: number;
  level: number;
  approver: string;
  action: ApprovalAction;
  date: string;
  remark?: string;
};

type QuotationItem = {
  id: number;
  productCode: string;
  description: string;
  category: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

type Quotation = {
  id: number;

  quotationNo: string;
  quotationDate: string;
  validUntil: string;

  customerCode: string;
  customerName: string;
  contactPerson: string;
  country: string;

  billingAddress: string;
  shippingAddress: string;

  company: string;
  businessUnit: string;
  warehouse: string;

  currency: Currency;
  exchangeRate: number;

  salesperson: string;

  paymentTerms: string;
  deliveryTerms: string;
  incoterm: string;

  customerReference: string;

  status: QuotationStatus;

  items: QuotationItem[];

  remarks: string;
  terms: string;

  createdBy: string;
  createdDate: string;

  submittedBy?: string;
  submittedDate?: string;

  approvalLevel?: number;
  currentApprover?: string;
  approvalHistory?: ApprovalHistoryEntry[];
  rejectionReason?: string;

  approvedBy?: string;
  approvedDate?: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

const LOGO_PATH = "/images/sims-logo.png";

const STATUS_OPTIONS: QuotationStatus[] = [
  "Draft",
  "Submitted",
  "Under Approval",
  "Approved",
  "Rejected",
  "Sent to Customer",
  "Accepted",
  "Expired",
  "Converted to SO",
];

const CURRENCIES: Currency[] = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AED",
  "SAR",
  "SGD",
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const APPROVAL_ROUTE = [
  { level: 1, role: "Sales Manager" },
  { level: 2, role: "Department Head" },
  { level: 3, role: "Finance Manager" },
] as const;

/* =========================================================
   DEMO DATA
========================================================= */

const DEMO_QUOTATIONS: Quotation[] = [
  {
    id: 1,

    quotationNo: "QT-2026-00001",
    quotationDate: "2026-10-01",
    validUntil: "2026-10-31",

    customerCode: "CUS-10001",
    customerName: "Global Auto Manufacturing",
    contactPerson: "Michael Anderson",
    country: "United States",

    billingAddress:
      "1200 Industrial Avenue, Dallas, TX, USA",

    shippingAddress:
      "Warehouse 04, Dallas Distribution Center, USA",

    company:
      "Fortuna Global Supply Chain Systems Private Limited",

    businessUnit: "Industrial Solutions",

    warehouse: "Dallas Distribution Center",

    currency: "USD",
    exchangeRate: 1,

    salesperson: "John Smith",

    paymentTerms: "Net 30",
    deliveryTerms: "30 Days",
    incoterm: "DAP",

    customerReference: "RFQ-GAM-2026-0198",

    status: "Approved",

    items: [
      {
        id: 1,
        productCode: "FG-WMS-001",
        description:
          "Warehouse Management System License",
        category: "Software",
        quantity: 10,
        uom: "License",
        unitPrice: 2500,
        discount: 5,
        taxRate: 8,
      },
      {
        id: 2,
        productCode: "FG-SCN-001",
        description:
          "Industrial Barcode Scanner",
        category: "Equipment",
        quantity: 25,
        uom: "EA",
        unitPrice: 480,
        discount: 2,
        taxRate: 8,
      },
    ],

    remarks:
      "Commercial quotation for warehouse modernization program.",

    terms:
      "Prices are valid until the quotation expiry date. Final delivery is subject to agreed implementation schedule.",

    createdBy: "Sandeep Kondapalli",
    createdDate: "2026-10-01",

    submittedBy: "Sandeep Kondapalli",
    submittedDate: "2026-10-01",

    approvedBy: "Finance Manager",
    approvedDate: "2026-10-02",
  },

  {
    id: 2,

    quotationNo: "QT-2026-00002",
    quotationDate: "2026-10-02",
    validUntil: "2026-10-25",

    customerCode: "CUS-10002",
    customerName: "Euro Logistics Group",
    contactPerson: "Thomas Weber",
    country: "Germany",

    billingAddress:
      "Frankfurt Business Park, Frankfurt, Germany",

    shippingAddress:
      "Frankfurt Logistics Hub, Germany",

    company:
      "Fortuna Global Supply Chain Systems Private Limited",

    businessUnit: "Supply Chain Solutions",

    warehouse: "Frankfurt Hub",

    currency: "EUR",
    exchangeRate: 0.92,

    salesperson: "Priya Sharma",

    paymentTerms: "Net 45",
    deliveryTerms: "45 Days",
    incoterm: "CIP",

    customerReference: "ELG-RFQ-8812",

    status: "Sent to Customer",

    items: [
      {
        id: 1,
        productCode: "FG-TMS-001",
        description:
          "Transport Management System",
        category: "Software",
        quantity: 5,
        uom: "License",
        unitPrice: 5200,
        discount: 7,
        taxRate: 19,
      },
    ],

    remarks:
      "Enterprise transportation management proposal.",

    terms:
      "Implementation schedule subject to final commercial agreement.",

    createdBy: "Priya Sharma",
    createdDate: "2026-10-02",

    submittedBy: "Priya Sharma",
    submittedDate: "2026-10-02",

    approvedBy: "Sales Director",
    approvedDate: "2026-10-03",
  },

  {
    id: 3,

    quotationNo: "QT-2026-00003",
    quotationDate: "2026-10-03",
    validUntil: "2026-10-20",

    customerCode: "CUS-10003",
    customerName: "Gulf Industrial Trading LLC",
    contactPerson: "Ahmed Rahman",
    country: "United Arab Emirates",

    billingAddress:
      "Dubai Industrial City, Dubai, UAE",

    shippingAddress:
      "Dubai Logistics Hub, Dubai, UAE",

    company:
      "Fortuna Global Supply Chain Systems Private Limited",

    businessUnit: "Middle East Operations",

    warehouse: "Dubai Logistics Hub",

    currency: "AED",
    exchangeRate: 3.67,

    salesperson: "Rahul Kumar",

    paymentTerms: "Net 30",
    deliveryTerms: "21 Days",
    incoterm: "DDP",

    customerReference: "GIT-2026-455",

    status: "Under Approval",

    items: [
      {
        id: 1,
        productCode: "FG-SIMS-001",
        description:
          "Fortuna SIMS Enterprise",
        category: "Software",
        quantity: 3,
        uom: "License",
        unitPrice: 18000,
        discount: 10,
        taxRate: 5,
      },
    ],

    remarks:
      "Enterprise supply chain management implementation.",

    terms:
      "Implementation and support included as per proposal.",

    createdBy: "Rahul Kumar",
    createdDate: "2026-10-03",

    submittedBy: "Rahul Kumar",
    submittedDate: "2026-10-03",
    approvalLevel: 1,
    currentApprover: "Sales Manager",
  },

  {
    id: 4,

    quotationNo: "QT-2026-00004",
    quotationDate: "2026-10-04",
    validUntil: "2026-11-04",

    customerCode: "CUS-10004",
    customerName: "Pacific Distribution Pte Ltd",
    contactPerson: "Daniel Tan",
    country: "Singapore",

    billingAddress:
      "Singapore Business District, Singapore",

    shippingAddress:
      "Singapore Distribution Center, Singapore",

    company:
      "Fortuna Global Supply Chain Systems Private Limited",

    businessUnit: "APAC Operations",

    warehouse: "Singapore Distribution Center",

    currency: "SGD",
    exchangeRate: 1.34,

    salesperson: "Arjun Rao",

    paymentTerms: "Net 30",
    deliveryTerms: "30 Days",
    incoterm: "FOB",

    customerReference: "PD-APAC-1026",

    status: "Draft",

    items: [
      {
        id: 1,
        productCode: "FG-INV-001",
        description:
          "Inventory Management Solution",
        category: "Software",
        quantity: 8,
        uom: "License",
        unitPrice: 3200,
        discount: 5,
        taxRate: 9,
      },
    ],

    remarks: "",

    terms: "",

    createdBy: "Arjun Rao",
    createdDate: "2026-10-04",
  },

  {
    id: 5,

    quotationNo: "QT-2026-00005",
    quotationDate: "2026-10-05",
    validUntil: "2026-10-19",

    customerCode: "CUS-10005",
    customerName: "Bharat Engineering Industries",
    contactPerson: "Ramesh Kumar",
    country: "India",

    billingAddress:
      "Industrial Estate, Visakhapatnam, India",

    shippingAddress:
      "Warehouse 01, Visakhapatnam, India",

    company:
      "Fortuna Global Supply Chain Systems Private Limited",

    businessUnit: "Industrial Solutions",

    warehouse: "Visakhapatnam Warehouse",

    currency: "INR",
    exchangeRate: 1,

    salesperson: "Venu Gopal",

    paymentTerms: "Net 30",
    deliveryTerms: "15 Days",
    incoterm: "DAP",

    customerReference: "BEI-RFQ-5566",

    status: "Submitted",

    items: [
      {
        id: 1,
        productCode: "FG-WMS-002",
        description:
          "Warehouse Implementation Services",
        category: "Services",
        quantity: 1,
        uom: "Project",
        unitPrice: 1250000,
        discount: 5,
        taxRate: 18,
      },
    ],

    remarks:
      "Warehouse implementation and integration services.",

    terms:
      "Payment milestone based.",

    createdBy: "Venu Gopal",
    createdDate: "2026-10-05",

    submittedBy: "Venu Gopal",
    submittedDate: "2026-10-05",
  },

  {
    id: 6,

    quotationNo: "QT-2026-00006",
    quotationDate: "2026-10-06",
    validUntil: "2026-10-18",

    customerCode: "CUS-10006",
    customerName: "Africa Supply Chain Ltd",
    contactPerson: "James Otieno",
    country: "Kenya",

    billingAddress:
      "Nairobi Business Park, Nairobi, Kenya",

    shippingAddress:
      "Nairobi Distribution Center, Kenya",

    company:
      "Fortuna Global Supply Chain Systems Private Limited",

    businessUnit: "Africa Operations",

    warehouse: "Nairobi Distribution Center",

    currency: "USD",
    exchangeRate: 1,

    salesperson: "Charan Kumar",

    paymentTerms: "Net 30",
    deliveryTerms: "30 Days",
    incoterm: "CIF",

    customerReference: "ASCL-2026-77",

    status: "Accepted",

    items: [
      {
        id: 1,
        productCode: "FG-TMS-002",
        description:
          "Transport Planning Module",
        category: "Software",
        quantity: 12,
        uom: "License",
        unitPrice: 2100,
        discount: 5,
        taxRate: 0,
      },
    ],

    remarks:
      "Accepted by customer pending PO issuance.",

    terms:
      "Customer PO required for Sales Order conversion.",

    createdBy: "Charan Kumar",
    createdDate: "2026-10-06",

    submittedBy: "Charan Kumar",
    submittedDate: "2026-10-06",

    approvedBy: "Sales Director",
    approvedDate: "2026-10-07",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (
  amount: number,
  currency: Currency
) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const calculateItemSubtotal = (
  item: QuotationItem
) => {
  const gross =
    item.quantity * item.unitPrice;

  const discount =
    gross * (item.discount / 100);

  return gross - discount;
};

const calculateQuotationTotals = (
  quotation: Quotation
) => {
  const subtotal =
    quotation.items.reduce(
      (sum, item) =>
        sum +
        calculateItemSubtotal(item),
      0
    );

  const tax =
    quotation.items.reduce(
      (sum, item) =>
        sum +
        calculateItemSubtotal(item) *
          (item.taxRate / 100),
      0
    );

  return {
    subtotal,
    tax,
    grandTotal: subtotal + tax,
  };
};

const statusClass = (
  status: QuotationStatus
) => {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-700 border-slate-200";

    case "Submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Under Approval":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";

    case "Sent to Customer":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "Accepted":
      return "bg-green-50 text-green-700 border-green-200";

    case "Expired":
      return "bg-gray-100 text-gray-600 border-gray-200";

    case "Converted to SO":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getApprovalRole = (level: number) =>
  APPROVAL_ROUTE.find(
    (step) => step.level === level
  )?.role || "Sales Manager";

const getCurrentApprovalLevel = (quotation: Quotation) => {
  if (quotation.status === "Approved") return 3;
  if (quotation.status === "Rejected") {
    return Math.min(
      Math.max(Number(quotation.approvalLevel || 1), 1),
      3
    );
  }

  // The currentApprover is the source of truth for the active level.
  const approverLevel = APPROVAL_ROUTE.find(
    (step) => step.role === quotation.currentApprover
  )?.level;

  if (approverLevel) return approverLevel;

  // If history exists, the next level is one after the last approved level.
  const approvedLevels = (quotation.approvalHistory || [])
    .filter((entry) => entry.action === "Approved")
    .map((entry) => entry.level);

  if (approvedLevels.length > 0) {
    const lastApproved = Math.max(...approvedLevels);
    return Math.min(lastApproved + 1, 3);
  }

  // Submitted quotations always start with Sales Manager.
  return 1;
};

/* =========================================================
   PRINT QUOTATION
   Uses a hidden same-origin iframe instead of window.open().
   This avoids popup-blocker issues and opens the browser
   print dialog directly from the quotation action.
========================================================= */

const printQuotation = (
  quotation: Quotation
) => {
  const printFrame =
    document.createElement("iframe");

  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  printFrame.style.visibility = "hidden";
  printFrame.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.appendChild(
    printFrame
  );

  const frameDocument =
    printFrame.contentDocument ||
    printFrame.contentWindow?.document;

  if (!frameDocument) {
    if (printFrame.parentNode) {
      printFrame.parentNode.removeChild(
        printFrame
      );
    }

    alert(
      "Unable to prepare the quotation for printing."
    );

    return;
  }

  const totals =
    calculateQuotationTotals(
      quotation
    );

  const currency = quotation.currency;

  const watermark =
    quotation.status === "Approved" ||
    quotation.status === "Sent to Customer" ||
    quotation.status === "Accepted"
      ? ""
      : quotation.status.toUpperCase();

  const itemsHtml =
    quotation.items
      .map((item, index) => {
        const lineSubtotal =
          calculateItemSubtotal(item);

        const lineTax =
          lineSubtotal *
          (item.taxRate / 100);

        const lineTotal =
          lineSubtotal + lineTax;

        return `
          <tr>
            <td class="center">${index + 1}</td>

            <td>
              <strong>${escapeHtml(
                item.productCode || "-"
              )}</strong>
            </td>

            <td>
              ${escapeHtml(
                item.description || "-"
              )}
            </td>

            <td class="center">
              ${escapeHtml(
                item.category || "-"
              )}
            </td>

            <td class="right">
              ${item.quantity}
            </td>

            <td class="center">
              ${escapeHtml(item.uom)}
            </td>

            <td class="right">
              ${formatCurrency(
                item.unitPrice,
                currency
              )}
            </td>

            <td class="right">
              ${item.discount.toFixed(2)}%
            </td>

            <td class="right">
              ${item.taxRate.toFixed(2)}%
            </td>

            <td class="right strong">
              ${formatCurrency(
                lineTotal,
                currency
              )}
            </td>
          </tr>
        `;
      })
      .join("");

  const printHtml = `
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8" />

<title>
  ${escapeHtml(
    quotation.quotationNo
  )} - Sales Quotation
</title>

<style>

@page {
  size: A4;
  margin: 14mm 12mm 16mm 12mm;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #1f2937;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  font-size: 10px;
}

body {
  position: relative;
}

.print-container {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  position: relative;
}

.watermark {
  position: fixed;
  top: 45%;
  left: 50%;
  transform:
    translate(-50%, -50%)
    rotate(-32deg);

  font-size: 70px;
  font-weight: 900;

  color: rgba(200, 16, 46, 0.07);

  letter-spacing: 5px;

  z-index: 0;

  white-space: nowrap;

  pointer-events: none;
}

.document-content {
  position: relative;
  z-index: 1;
}

/* HEADER */

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  border-bottom:
    3px solid #c8102e;

  padding-bottom: 10px;

  margin-bottom: 14px;
}

.logo-section {
  width: 52%;
}

.logo {
  width: 270px;
  height: 70px;
  object-fit: contain;
  object-position: left center;
  transform: scale(1.4);
  transform-origin: left center;
}

.company-details {
  margin-top: 5px;
  font-size: 8.5px;
  color: #4b5563;
  line-height: 1.5;
}

.document-title {
  width: 42%;
  text-align: right;
}

.document-title h1 {
  margin: 0;
  color: #005f99;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.4px;
}

.document-title .quotation-number {
  margin-top: 7px;
  color: #c8102e;
  font-size: 13px;
  font-weight: 800;
}

.status {
  display: inline-block;

  margin-top: 7px;

  padding:
    4px 9px;

  border:
    1px solid #d1d5db;

  border-radius: 5px;

  font-size: 8px;

  font-weight: 800;

  text-transform: uppercase;
}

/* INFORMATION */

.info-grid {
  display: grid;

  grid-template-columns:
    1fr
    1fr;

  gap: 10px;

  margin-bottom: 12px;
}

.info-box {
  border:
    1px solid #d9dee5;

  border-radius: 5px;

  overflow: hidden;
}

.info-title {
  background:
    linear-gradient(
      90deg,
      #c8102e,
      #005f99
    );

  color: white;

  padding:
    6px 8px;

  font-size: 8.5px;

  font-weight: 800;

  text-transform: uppercase;
}

.info-body {
  padding: 8px;
}

.info-row {
  display: flex;

  justify-content:
    space-between;

  gap: 12px;

  padding:
    3px 0;

  border-bottom:
    1px dotted #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #6b7280;
  font-weight: 600;
}

.info-value {
  text-align: right;
  font-weight: 700;
  color: #1f2937;
}

/* ITEMS */

.section-title {
  margin-top: 12px;
  margin-bottom: 6px;

  color: #005f99;

  font-size: 10px;

  font-weight: 800;

  text-transform: uppercase;

  border-left:
    3px solid #c8102e;

  padding-left: 6px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  background:
    linear-gradient(
      90deg,
      #c8102e,
      #005f99
    );

  color: white;

  padding:
    6px 5px;

  font-size: 7.5px;

  text-transform: uppercase;

  border:
    1px solid #ffffff;

  vertical-align: middle;
}

.items-table td {
  padding:
    6px 5px;

  border:
    1px solid #d9dee5;

  font-size: 8px;

  vertical-align: top;
}

.items-table tr {
  page-break-inside: avoid;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.strong {
  font-weight: 800;
}

/* TOTALS */

.summary-area {
  display: flex;

  justify-content:
    flex-end;

  margin-top: 10px;
}

.summary {
  width: 75mm;

  border:
    1px solid #d9dee5;

  border-radius: 5px;

  overflow: hidden;
}

.summary-row {
  display: flex;

  justify-content:
    space-between;

  padding:
    5px 8px;

  border-bottom:
    1px solid #edf0f3;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  color: #6b7280;
}

.summary-value {
  font-weight: 700;
}

.grand-total {
  background:
    linear-gradient(
      90deg,
      #fff5f6,
      #f0f8fc
    );

  color: #c8102e;

  font-size: 11px;

  font-weight: 900;
}

/* COMMERCIAL */

.commercial-grid {
  display: grid;

  grid-template-columns:
    1fr
    1fr
    1fr
    1fr;

  gap: 7px;

  margin-top: 12px;
}

.commercial-box {
  border:
    1px solid #d9dee5;

  border-radius: 5px;

  padding: 7px;
}

.commercial-label {
  color: #6b7280;

  font-size: 7px;

  text-transform: uppercase;

  font-weight: 700;
}

.commercial-value {
  margin-top: 3px;

  font-size: 8.5px;

  font-weight: 800;
}

/* NOTES */

.notes-grid {
  display: grid;

  grid-template-columns:
    1fr
    1fr;

  gap: 10px;

  margin-top: 12px;
}

.notes-box {
  border:
    1px solid #d9dee5;

  border-radius: 5px;

  padding: 8px;

  min-height: 45px;
}

.notes-title {
  color: #005f99;

  font-weight: 800;

  font-size: 8px;

  text-transform: uppercase;

  margin-bottom: 4px;
}

.notes-text {
  font-size: 8px;

  color: #4b5563;

  line-height: 1.5;

  white-space: pre-wrap;
}

/* AUTHORIZATION */

.authorization {
  margin-top: 18px;

  border-top:
    1px solid #d9dee5;

  padding-top: 12px;
}

.authorization-title {
  color: #005f99;

  font-size: 9px;

  font-weight: 800;

  text-transform: uppercase;

  margin-bottom: 10px;
}

.signature-grid {
  display: grid;

  grid-template-columns:
    1fr
    1fr
    1fr;

  gap: 20px;
}

.signature-box {
  min-height: 55px;

  border-bottom:
    1px solid #374151;

  position: relative;
}

.signature-label {
  position: absolute;

  bottom: -15px;

  left: 0;

  font-size: 7.5px;

  color: #6b7280;

  font-weight: 700;
}

.authorization-note {
  margin-top: 25px;

  text-align: center;

  font-size: 7px;

  color: #6b7280;
}

/* FOOTER */

.footer {
  margin-top: 18px;

  padding-top: 7px;

  border-top:
    1px solid #d9dee5;

  display: flex;

  justify-content:
    space-between;

  font-size: 7px;

  color: #6b7280;
}

.footer-center {
  text-align: center;
}

/* PRINT */

@media print {

  body {
    -webkit-print-color-adjust:
      exact !important;

    print-color-adjust:
      exact !important;
  }

  .print-container {
    width: 100%;
  }

  .no-print {
    display: none !important;
  }

}

</style>

</head>

<body>

<div class="print-container">

  ${
    watermark
      ? `<div class="watermark">
          ${escapeHtml(watermark)}
         </div>`
      : ""
  }

  <div class="document-content">

    <!-- HEADER -->

    <div class="header">

      <div class="logo-section">

        <img
          src="/images/logo/sims-logo.png";
          class="logo"
        />

        <div class="company-details">

          <strong>
            Fortuna Global Supply Chain Systems Private Limited
          </strong>

          <br />

          Supply & Inventory Management System

          <br />

          Enterprise Supply Chain & Inventory Solutions

        </div>

      </div>

      <div class="document-title">

        <h1>
          SALES QUOTATION
        </h1>

        <div class="quotation-number">
          ${escapeHtml(
            quotation.quotationNo
          )}
        </div>

        <div class="status">
          ${escapeHtml(
            quotation.status
          )}
        </div>

      </div>

    </div>

    <!-- CUSTOMER + QUOTATION -->

    <div class="info-grid">

      <div class="info-box">

        <div class="info-title">
          Customer Information
        </div>

        <div class="info-body">

          <div class="info-row">
            <span class="info-label">
              Customer
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.customerName
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Customer Code
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.customerCode
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Contact
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.contactPerson ||
                  "-"
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Country
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.country
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Billing Address
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.billingAddress ||
                  "-"
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Shipping Address
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.shippingAddress ||
                  "-"
              )}
            </span>
          </div>

        </div>

      </div>

      <div class="info-box">

        <div class="info-title">
          Quotation Information
        </div>

        <div class="info-body">

          <div class="info-row">
            <span class="info-label">
              Quotation Date
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.quotationDate
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Valid Until
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.validUntil
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Currency
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.currency
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Exchange Rate
            </span>

            <span class="info-value">
              ${quotation.exchangeRate}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Salesperson
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.salesperson
              )}
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">
              Customer Reference
            </span>

            <span class="info-value">
              ${escapeHtml(
                quotation.customerReference ||
                  "-"
              )}
            </span>
          </div>

        </div>

      </div>

    </div>

    <!-- ITEMS -->

    <div class="section-title">
      Quotation Items
    </div>

    <table class="items-table">

      <thead>

        <tr>

          <th style="width: 4%">
            #
          </th>

          <th style="width: 12%">
            Product / Code
          </th>

          <th style="width: 20%">
            Description
          </th>

          <th style="width: 9%">
            Category
          </th>

          <th style="width: 6%">
            Qty
          </th>

          <th style="width: 7%">
            UOM
          </th>

          <th style="width: 12%">
            Unit Price
          </th>

          <th style="width: 8%">
            Disc.
          </th>

          <th style="width: 7%">
            Tax
          </th>

          <th style="width: 15%">
            Line Total
          </th>

        </tr>

      </thead>

      <tbody>

        ${itemsHtml}

      </tbody>

    </table>

    <!-- TOTALS -->

    <div class="summary-area">

      <div class="summary">

        <div class="summary-row">

          <span class="summary-label">
            Subtotal
          </span>

          <span class="summary-value">
            ${formatCurrency(
              totals.subtotal,
              currency
            )}
          </span>

        </div>

        <div class="summary-row">

          <span class="summary-label">
            Tax
          </span>

          <span class="summary-value">
            ${formatCurrency(
              totals.tax,
              currency
            )}
          </span>

        </div>

        <div class="summary-row grand-total">

          <span>
            GRAND TOTAL
          </span>

          <span>
            ${formatCurrency(
              totals.grandTotal,
              currency
            )}
          </span>

        </div>

      </div>

    </div>

    <!-- COMMERCIAL TERMS -->

    <div class="section-title">
      Commercial Terms
    </div>

    <div class="commercial-grid">

      <div class="commercial-box">

        <div class="commercial-label">
          Payment Terms
        </div>

        <div class="commercial-value">
          ${escapeHtml(
            quotation.paymentTerms
          )}
        </div>

      </div>

      <div class="commercial-box">

        <div class="commercial-label">
          Delivery Terms
        </div>

        <div class="commercial-value">
          ${escapeHtml(
            quotation.deliveryTerms
          )}
        </div>

      </div>

      <div class="commercial-box">

        <div class="commercial-label">
          Incoterm
        </div>

        <div class="commercial-value">
          ${escapeHtml(
            quotation.incoterm
          )}
        </div>

      </div>

      <div class="commercial-box">

        <div class="commercial-label">
          Warehouse / Location
        </div>

        <div class="commercial-value">
          ${escapeHtml(
            quotation.warehouse
          )}
        </div>

      </div>

    </div>

    <!-- NOTES -->

    <div class="notes-grid">

      <div class="notes-box">

        <div class="notes-title">
          Remarks
        </div>

        <div class="notes-text">
          ${escapeHtml(
            quotation.remarks ||
              "No remarks provided."
          )}
        </div>

      </div>

      <div class="notes-box">

        <div class="notes-title">
          Terms & Conditions
        </div>

        <div class="notes-text">
          ${escapeHtml(
            quotation.terms ||
              "Standard quotation terms and conditions apply."
          )}
        </div>

      </div>

    </div>

    <!-- AUTHORIZATION -->

    <div class="authorization">

      <div class="authorization-title">
        Authorization
      </div>

      <div class="signature-grid">

        <div class="signature-box">

          <div class="signature-label">
            Prepared By:
            ${escapeHtml(
              quotation.createdBy
            )}
          </div>

        </div>

        <div class="signature-box">

          <div class="signature-label">
            Submitted By:
            ${escapeHtml(
              quotation.submittedBy ||
                "-"
            )}
          </div>

        </div>

        <div class="signature-box">

          <div class="signature-label">
            Approved By:
            ${escapeHtml(
              quotation.approvedBy ||
                "-"
            )}
          </div>

        </div>

      </div>

      <div class="authorization-note">

        ${
          quotation.status ===
          "Approved"
            ? `
              This quotation has been approved
              through the Fortuna SIMS workflow.
              <br />
              Approval Date:
              ${escapeHtml(
                quotation.approvedDate ||
                  "-"
              )}
            `
            : `
              This document is system-generated.
              Authorization is subject to the
              quotation workflow status.
            `
        }

      </div>

    </div>

    <!-- FOOTER -->

    <div class="footer">

      <div>
        Fortuna SIMS
      </div>

      <div class="footer-center">
        Supply & Inventory Management System
      </div>

      <div>
        ${escapeHtml(
          quotation.quotationNo
        )}
      </div>

    </div>

  </div>

</div>

</body>
</html>
`;

  /* -------------------------------------------------------
     WRITE QUOTATION INTO HIDDEN IFRAME
  ------------------------------------------------------- */

  frameDocument.open();

  frameDocument.write(
    printHtml
  );

  frameDocument.close();

  /* -------------------------------------------------------
     CLEANUP
  ------------------------------------------------------- */

  let cleanedUp = false;

  const cleanupPrintFrame = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;

    if (printFrame.parentNode) {
      printFrame.parentNode.removeChild(
        printFrame
      );
    }
  };

  /* -------------------------------------------------------
     PRINT AFTER ALL IMAGES ARE READY
  ------------------------------------------------------- */

  const startPrint = () => {
    const printWindow =
      printFrame.contentWindow;

    if (!printWindow) {
      cleanupPrintFrame();

      alert(
        "Unable to open the print dialog."
      );

      return;
    }

    try {
      printWindow.onafterprint =
        cleanupPrintFrame;
    } catch {
      // Ignore browser-specific onafterprint issues.
    }

    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (error) {
        console.error(
          "Quotation print error:",
          error
        );

        cleanupPrintFrame();

        alert(
          "Unable to print the quotation."
        );
      }
    }, 300);

    /* Fallback cleanup for browsers that do not fire onafterprint. */
    setTimeout(
      cleanupPrintFrame,
      60000
    );
  };

  const images = Array.from(
    frameDocument.images
  );

  if (images.length === 0) {
    startPrint();

    return;
  }

  let loadedImages = 0;

  const imageLoaded = () => {
    loadedImages += 1;

    if (loadedImages >= images.length) {
      startPrint();
    }
  };

  images.forEach((image) => {
    if (image.complete) {
      imageLoaded();
      return;
    }

    image.addEventListener(
      "load",
      imageLoaded,
      { once: true }
    );

    image.addEventListener(
      "error",
      imageLoaded,
      { once: true }
    );
  });
};

/* =========================================================
   HTML ESCAPE
========================================================= */

const escapeHtml = (
  value: string
) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/* =========================================================
   QUICK STATS ROW
========================================================= */

type StatRowProps = {
  label: string;
  value: string | number;
  badge?: "gray" | "blue" | "amber" | "green" | "red";
  money?: boolean;
};

function StatRow({
  label,
  value,
  badge,
  money = false,
}: StatRowProps) {
  const badgeClass = {
    gray: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  } as const;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-b-0 last:pb-0 dark:border-gray-800">
      <span className="min-w-0 truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </span>

      {badge ? (
        <span
          className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${badgeClass[badge]}`}
        >
          {value}
        </span>
      ) : (
        <span
          className={`shrink-0 text-right text-[12px] font-extrabold ${
            money
              ? "text-[#005F99] dark:text-blue-300"
              : "text-gray-800 dark:text-white"
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function SalesQuotationPage() {
  const [quotations, setQuotations] =
    useState<Quotation[]>(
      DEMO_QUOTATIONS
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "All" | QuotationStatus
    >("All");

  const [currencyFilter, setCurrencyFilter] =
    useState<"All" | Currency>("All");

  const [countryFilter, setCountryFilter] =
    useState("All");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [pageSize, setPageSize] =
    useState(10);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    selectedQuotation,
    setSelectedQuotation,
  ] = useState<Quotation | null>(null);

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  const [
    approvalDecision,
    setApprovalDecision,
  ] = useState<"approve" | "reject" | null>(null);

  const [
    approvalDecisionLevel,
    setApprovalDecisionLevel,
  ] = useState<number | null>(null);

  const [
    approvalRemark,
    setApprovalRemark,
  ] = useState("");

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredQuotations =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return quotations.filter(
        (quotation) => {
          const matchesSearch =
            !query ||
            quotation.quotationNo
              .toLowerCase()
              .includes(query) ||
            quotation.customerName
              .toLowerCase()
              .includes(query) ||
            quotation.customerCode
              .toLowerCase()
              .includes(query) ||
            quotation.salesperson
              .toLowerCase()
              .includes(query) ||
            quotation.customerReference
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "All" ||
            quotation.status ===
              statusFilter;

          const matchesCurrency =
            currencyFilter === "All" ||
            quotation.currency ===
              currencyFilter;

          const matchesCountry =
            countryFilter === "All" ||
            quotation.country ===
              countryFilter;

          const matchesFrom =
            !dateFrom ||
            quotation.quotationDate >=
              dateFrom;

          const matchesTo =
            !dateTo ||
            quotation.quotationDate <=
              dateTo;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCurrency &&
            matchesCountry &&
            matchesFrom &&
            matchesTo
          );
        }
      );
    }, [
      quotations,
      search,
      statusFilter,
      currencyFilter,
      countryFilter,
      dateFrom,
      dateTo,
    ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredQuotations.length /
        pageSize
    )
  );

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );

  const paginatedQuotations =
    filteredQuotations.slice(
      (safeCurrentPage - 1) *
        pageSize,
      safeCurrentPage * pageSize
    );

  const startRecord =
    filteredQuotations.length === 0
      ? 0
      : (safeCurrentPage - 1) *
          pageSize +
        1;

  const endRecord = Math.min(
    safeCurrentPage * pageSize,
    filteredQuotations.length
  );

  /* =======================================================
     KPI
  ======================================================= */

  const kpis = useMemo(() => {
    let totalValue = 0;
    let approvedValue = 0;
    let pendingApproval = 0;
    let converted = 0;

    quotations.forEach(
      (quotation) => {
        const totals =
          calculateQuotationTotals(
            quotation
          );

        totalValue +=
          totals.grandTotal;

        if (
          quotation.status ===
          "Approved"
        ) {
          approvedValue +=
            totals.grandTotal;
        }

        if (
          quotation.status ===
            "Submitted" ||
          quotation.status ===
            "Under Approval"
        ) {
          pendingApproval++;
        }

        if (
          quotation.status ===
          "Converted to SO"
        ) {
          converted++;
        }
      }
    );

    return {
      total: quotations.length,
      totalValue,
      approvedValue,
      pendingApproval,
      converted,
    };
  }, [quotations]);

  /* =======================================================
     QUICK STATS
  ======================================================= */

  const quickStats = useMemo(() => {
    const total = filteredQuotations.length;
    const draft = filteredQuotations.filter((q) => q.status === "Draft").length;
    const submitted = filteredQuotations.filter((q) => q.status === "Submitted").length;
    const pending = filteredQuotations.filter((q) => q.status === "Under Approval").length;
    const approved = filteredQuotations.filter((q) => q.status === "Approved").length;
    const rejected = filteredQuotations.filter((q) => q.status === "Rejected").length;
    const converted = filteredQuotations.filter((q) => q.status === "Converted to SO").length;
    const totalValue = filteredQuotations.reduce(
      (sum, quotation) => sum + calculateQuotationTotals(quotation).grandTotal,
      0
    );
    const avgValue = total ? Math.round(totalValue / total) : 0;

    return { total, draft, submitted, pending, approved, rejected, converted, totalValue, avgValue };
  }, [filteredQuotations]);

  /* =======================================================
     EXPORT
  ======================================================= */

  const exportToExcel = () => {
    const rows =
      filteredQuotations.map(
        (quotation) => {
          const totals =
            calculateQuotationTotals(
              quotation
            );

          return {
            "Quotation No":
              quotation.quotationNo,

            "Quotation Date":
              quotation.quotationDate,

            "Valid Until":
              quotation.validUntil,

            "Customer Code":
              quotation.customerCode,

            Customer:
              quotation.customerName,

            Country:
              quotation.country,

            Contact:
              quotation.contactPerson,

            Company:
              quotation.company,

            "Business Unit":
              quotation.businessUnit,

            Warehouse:
              quotation.warehouse,

            Currency:
              quotation.currency,

            "Exchange Rate":
              quotation.exchangeRate,

            Salesperson:
              quotation.salesperson,

            "Payment Terms":
              quotation.paymentTerms,

            "Delivery Terms":
              quotation.deliveryTerms,

            Incoterm:
              quotation.incoterm,

            "Customer Reference":
              quotation.customerReference,

            Subtotal:
              totals.subtotal,

            Tax:
              totals.tax,

            "Grand Total":
              totals.grandTotal,

            Status:
              quotation.status,

            "Created By":
              quotation.createdBy,

            "Created Date":
              quotation.createdDate,

            "Submitted By":
              quotation.submittedBy ||
              "",

            "Approved By":
              quotation.approvedBy ||
              "",

            "Approved Date":
              quotation.approvedDate ||
              "",
          };
        }
      );

    const headers = rows.length
      ? Object.keys(rows[0])
      : [];
    const escapeCsvValue = (value: string | number) => {
      const text = String(value);
      return /[",\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
    };
    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            escapeCsvValue(row[header as keyof typeof row])
          )
          .join(",")
      ),
    ].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Fortuna_Sales_Quotations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  /* =======================================================
     CREATE
  ======================================================= */

  const createQuotation = () => {
    const nextNumber =
      quotations.length + 1;

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const newQuotation: Quotation = {
      id: Date.now(),

      quotationNo:
        `QT-2026-${String(
          nextNumber
        ).padStart(5, "0")}`,

      quotationDate: today,

      validUntil: new Date(
        Date.now() +
          30 *
            24 *
            60 *
            60 *
            1000
      )
        .toISOString()
        .split("T")[0],

      customerCode: "CUS-NEW",

      customerName:
        "New Customer",

      contactPerson: "",

      country: "India",

      billingAddress: "",

      shippingAddress: "",

      company:
        "Fortuna Global Supply Chain Systems Private Limited",

      businessUnit:
        "Global Operations",

      warehouse:
        "Main Distribution Center",

      currency: "USD",

      exchangeRate: 1,

      salesperson:
        "Unassigned",

      paymentTerms:
        "Net 30",

      deliveryTerms:
        "30 Days",

      incoterm: "DAP",

      customerReference: "",

      status: "Draft",

      items: [
        {
          id: 1,

          productCode: "",

          description: "",

          category: "Product",

          quantity: 1,

          uom: "EA",

          unitPrice: 0,

          discount: 0,

          taxRate: 0,
        },
      ],

      remarks: "",

      terms: "",

      createdBy:
        "Current User",

      createdDate: today,
    };

    setQuotations((prev) => [
      newQuotation,
      ...prev,
    ]);

    setSelectedQuotation(
      newQuotation
    );

    setShowCreateForm(true);
  };

  /* =======================================================
     CONVERT SO
  ======================================================= */

  const convertToSalesOrder = (
    quotation: Quotation
  ) => {
    const updated = {
      ...quotation,
      status: "Converted to SO" as QuotationStatus,
    };

    setQuotations((prev) =>
      prev.map((item) =>
        item.id === quotation.id
          ? updated
          : item
      )
    );

    setSelectedQuotation(
      updated
    );
  };

  /* =======================================================
     APPROVAL WORKFLOW
  ======================================================= */

  const today = () =>
    new Date().toISOString().split("T")[0];

  const updateQuotation = (updated: Quotation) => {
    setQuotations((prev) =>
      prev.map((item) =>
        item.id === updated.id ? updated : item
      )
    );
    setSelectedQuotation(updated);
  };

  const approveQuotationLevel = (
    quotation: Quotation,
    level: number,
    remark: string
  ) => {
    const trimmedRemark = remark.trim();

    if (!trimmedRemark) {
      alert("Approval remark is required.");
      return false;
    }

    if (
      quotation.status !== "Submitted" &&
      quotation.status !== "Under Approval"
    ) {
      return false;
    }

    const currentLevel = getCurrentApprovalLevel(quotation);

    // Strict sequential control: only the active level can act.
    if (level !== currentLevel) {
      alert(
        `Only ${getApprovalRole(currentLevel)} can approve this quotation.`
      );
      return false;
    }

    const step = APPROVAL_ROUTE.find(
      (item) => item.level === level
    );

    if (!step) return false;

    const date = today();
    const nextLevel = level + 1;
    const isFinalApproval = level === APPROVAL_ROUTE.length;
    const nextStep = APPROVAL_ROUTE.find(
      (item) => item.level === nextLevel
    );

    const approvalEntry: ApprovalHistoryEntry = {
      id: Date.now(),
      level: step.level,
      approver: step.role,
      action: "Approved",
      date,
      remark: trimmedRemark,
    };

    updateQuotation({
      ...quotation,
      status: isFinalApproval
        ? "Approved"
        : "Under Approval",
      // approvalLevel always represents the CURRENT level.
      // After approving level 1, current level becomes 2.
      approvalLevel: isFinalApproval
        ? 3
        : nextLevel,
      currentApprover: isFinalApproval
        ? undefined
        : nextStep?.role,
      approvedBy: isFinalApproval
        ? step.role
        : undefined,
      approvedDate: isFinalApproval
        ? date
        : undefined,
      rejectionReason: undefined,
      approvalHistory: [
        ...(quotation.approvalHistory || []),
        approvalEntry,
      ],
    });

    return true;
  };

  const rejectQuotation = (
    quotation: Quotation,
    level: number,
    remark: string
  ) => {
    const trimmedRemark = remark.trim();

    if (!trimmedRemark) {
      alert("Rejection remark is required.");
      return false;
    }

    if (
      quotation.status !== "Submitted" &&
      quotation.status !== "Under Approval"
    ) {
      return false;
    }

    const currentLevel = getCurrentApprovalLevel(quotation);

    // Strict sequential control: only the active level can reject.
    if (level !== currentLevel) {
      alert(
        `Only ${getApprovalRole(currentLevel)} can reject this quotation.`
      );
      return false;
    }

    const step = APPROVAL_ROUTE.find(
      (item) => item.level === level
    );

    if (!step) return false;

    const date = today();

    const rejectionEntry: ApprovalHistoryEntry = {
      id: Date.now(),
      level: step.level,
      approver: step.role,
      action: "Rejected",
      date,
      remark: trimmedRemark,
    };

    updateQuotation({
      ...quotation,
      status: "Rejected",
      approvalLevel: level,
      currentApprover: undefined,
      rejectionReason: trimmedRemark,
      approvedBy: undefined,
      approvedDate: undefined,
      approvalHistory: [
        ...(quotation.approvalHistory || []),
        rejectionEntry,
      ],
    });

    return true;
  };

  const openApprovalDecision = (
    level: number,
    decision: "approve" | "reject"
  ) => {
    if (!selectedQuotation) return;

    const currentLevel = getCurrentApprovalLevel(
      selectedQuotation
    );

    if (
      selectedQuotation.status !== "Submitted" &&
      selectedQuotation.status !== "Under Approval"
    ) {
      return;
    }

    if (level !== currentLevel) {
      alert(
        `This level is not active. Current approver: ${getApprovalRole(currentLevel)}.`
      );
      return;
    }

    setApprovalDecisionLevel(level);
    setApprovalDecision(decision);
    setApprovalRemark("");
  };

  const confirmApprovalDecision = () => {
    if (!selectedQuotation || !approvalDecisionLevel || !approvalDecision) {
      return;
    }

    const level = approvalDecisionLevel;
    const remark = approvalRemark;

    const success =
      approvalDecision === "approve"
        ? approveQuotationLevel(
            selectedQuotation,
            level,
            remark
          )
        : rejectQuotation(
            selectedQuotation,
            level,
            remark
          );

    if (success) {
      setApprovalDecision(null);
      setApprovalDecisionLevel(null);
      setApprovalRemark("");
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCurrencyFilter("All");
    setCountryFilter("All");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Sales Quotation"
      />

      {/* HEADER */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md"
                style={{
                  background:
                    `linear-gradient(135deg, ${FORTUNA_RED}, ${FORTUNA_BLUE})`,
                }}
              >
                QT
              </div>

              <div>

                <h1
                  className="text-xl font-bold"
                  style={{
                    color:
                      FORTUNA_RED,
                  }}
                >
                  Sales Quotation
                </h1>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Global quotation management
                  across customers, countries,
                  currencies and business units
                </p>

              </div>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={
                exportToExcel
              }
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              ↓ Export CSV
            </button>

            <button
              onClick={
                createQuotation
              }
              className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{
                background:
                  `linear-gradient(135deg, ${FORTUNA_RED}, ${FORTUNA_BLUE})`,
              }}
            >
              + New Quotation
            </button>

          </div>

        </div>

      </div>

      {/* KPI */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <KpiCard
          title="Total Quotations"
          value={String(kpis.total)}
          icon="QT"
          gradient="red"
        />

        <KpiCard
          title="Quotation Value"
          value={formatCurrency(
            kpis.totalValue,
            "USD"
          )}
          icon="$"
          gradient="blue"
        />

        <KpiCard
          title="Approved Value"
          value={formatCurrency(
            kpis.approvedValue,
            "USD"
          )}
          icon="✓"
          gradient="green"
        />

        <KpiCard
          title="Pending Approval"
          value={String(
            kpis.pendingApproval
          )}
          icon="!"
          gradient="amber"
        />

        <KpiCard
          title="Converted to SO"
          value={String(
            kpis.converted
          )}
          icon="SO"
          gradient="purple"
        />

      </div>

      {/* FILTERS */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="mb-4 flex items-center justify-between">

          <div>

            <h2 className="text-sm font-bold text-gray-800 dark:text-white">
              Quotation Search & Filters
            </h2>

            <p className="text-[11px] text-gray-500">
              Search quotations across
              customer, reference and
              salesperson.
            </p>

          </div>

          <button
            onClick={
              resetFilters
            }
            className="text-xs font-bold"
            style={{
              color:
                FORTUNA_RED,
            }}
          >
            Reset Filters
          </button>

        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          <FilterInput
            label="Search"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
            placeholder="Quotation / Customer / Ref..."
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(
                value as
                  | "All"
                  | QuotationStatus
              );

              setCurrentPage(1);
            }}
            options={[
              "All",
              ...STATUS_OPTIONS,
            ]}
          />

          <FilterSelect
            label="Currency"
            value={currencyFilter}
            onChange={(value) => {
              setCurrencyFilter(
                value as
                  | "All"
                  | Currency
              );

              setCurrentPage(1);
            }}
            options={[
              "All",
              ...CURRENCIES,
            ]}
          />

          <FilterSelect
            label="Country"
            value={countryFilter}
            onChange={(value) => {
              setCountryFilter(
                value
              );

              setCurrentPage(1);
            }}
            options={[
              "All",
              ...Array.from(
                new Set<string>(
                  quotations.map(
                    (item: Quotation) =>
                      item.country
                  )
                )
              ),
            ]}
          />

          <div>

            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Date From
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(
                  e.target.value
                );

                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-red-400 dark:border-gray-700 dark:bg-gray-800"
            />

          </div>

          <div>

            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Date To
            </label>

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(
                  e.target.value
                );

                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-red-400 dark:border-gray-700 dark:bg-gray-800"
            />

          </div>

        </div>

      </div>

      {/* TABLE + QUICK STATS */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-9">

      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 dark:border-gray-800 md:flex-row md:items-center md:justify-between">

          <div>

            <h2 className="text-sm font-bold text-gray-800 dark:text-white">
              Sales Quotations
            </h2>

            <p className="text-[11px] text-gray-500">
              Showing {startRecord}–
              {endRecord} of{" "}
              {
                filteredQuotations.length
              } quotations
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span className="text-[11px] text-gray-500">
              Rows
            </span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(
                  Number(
                    e.target.value
                  )
                );

                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
            >

              {PAGE_SIZE_OPTIONS.map(
                (size) => (
                  <option
                    key={size}
                    value={size}
                  >
                    {size}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">

          <table className="min-w-[1180px] w-full table-fixed text-left">

            <thead>

              <tr
                style={{
                background: FORTUNA_RED,
                }}
                className="text-[11px] font-bold uppercase tracking-wide text-white"
              >

                <th className="px-4 py-3">
                  Quotation
                </th>

                <th className="px-4 py-3">
                  Customer
                </th>

                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-4 py-3">
                  Valid Until
                </th>

                <th className="px-4 py-3">
                  Country
                </th>

                <th className="px-4 py-3">
                  Currency
                </th>

                <th className="px-4 py-3">
                  Salesperson
                </th>

                <th className="px-4 py-3">
                  Total
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {paginatedQuotations.length ===
              0 ? (
                <tr>

                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    No quotations found.
                  </td>

                </tr>
              ) : (
                paginatedQuotations.map(
                  (quotation) => {
                    const totals =
                      calculateQuotationTotals(
                        quotation
                      );

                    return (
                      <tr
                        key={
                          quotation.id
                        }
                        className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                      >

                        <td className="px-4 py-4">

                          <p
                            className="text-xs font-bold"
                            style={{
                              color:
                                FORTUNA_RED,
                            }}
                          >
                            {
                              quotation.quotationNo
                            }
                          </p>

                          <p className="mt-1 text-[10px] text-gray-500">
                            {
                              quotation.customerReference ||
                              "No customer reference"
                            }
                          </p>

                        </td>

                        <td className="px-4 py-4">

                          <p className="text-xs font-semibold text-gray-800 dark:text-white">
                            {
                              quotation.customerName
                            }
                          </p>

                          <p className="mt-1 text-[10px] text-gray-500">
                            {
                              quotation.customerCode
                            }
                          </p>

                        </td>

                        <td className="px-4 py-4 text-xs">
                          {
                            quotation.quotationDate
                          }
                        </td>

                        <td className="px-4 py-4 text-xs">
                          {
                            quotation.validUntil
                          }
                        </td>

                        <td className="px-4 py-4 text-xs">
                          {
                            quotation.country
                          }
                        </td>

                        <td className="px-4 py-4">

                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold dark:bg-gray-800">
                            {
                              quotation.currency
                            }
                          </span>

                        </td>

                        <td className="px-4 py-4 text-xs">
                          {
                            quotation.salesperson
                          }
                        </td>

                        <td className="px-4 py-4">

                          <p className="text-xs font-bold">
                            {formatCurrency(
                              totals.grandTotal,
                              quotation.currency
                            )}
                          </p>

                        </td>

                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                              quotation.status
                            )}`}
                          >
                            {
                              quotation.status
                            }
                          </span>

                        </td>

                        <td className="w-[260px] px-3 py-4">

                          <div className="flex flex-wrap items-center justify-center gap-1.5">

                            <button
                              onClick={() =>
                                setSelectedQuotation(
                                  quotation
                                )
                              }
                              className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] font-bold dark:border-gray-700"
                            >
                              View
                            </button>

                            <button
                              onClick={() =>
                                printQuotation(
                                  quotation
                                )
                              }
                              className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                            >
                              🖨 Print
                            </button>

                            {(quotation.status === "Submitted" ||
                              quotation.status === "Under Approval") && (
                              <button
                                onClick={() =>
                                  setSelectedQuotation(quotation)
                                }
                                className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-extrabold text-amber-700 hover:bg-amber-100"
                              >
                                Approval
                              </button>
                            )}

                            {quotation.status ===
                              "Draft" && (
                              <button
                                onClick={() => {
                                  setSelectedQuotation(
                                    quotation
                                  );

                                  setShowCreateForm(
                                    true
                                  );
                                }}
                                className="rounded-md px-2.5 py-1.5 text-[10px] font-bold text-white"
                                style={{
                                  background:
                                    FORTUNA_RED,
                                }}
                              >
                                Edit
                              </button>
                            )}

                            {quotation.status ===
                              "Accepted" && (
                              <button
                                onClick={() =>
                                  convertToSalesOrder(
                                    quotation
                                  )
                                }
                                className="rounded-md px-2.5 py-1.5 text-[10px] font-bold text-white"
                                style={{
                                  background:
                                    FORTUNA_BLUE,
                                }}
                              >
                                Convert SO
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-3 border-t border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-[11px] text-gray-500">
            Page {safeCurrentPage} of{" "}
            {totalPages}
          </p>

          <div className="flex items-center gap-1">

            <button
              disabled={
                safeCurrentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
            >
              Previous
            </button>

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) =>
                index + 1
            )
              .slice(
                Math.max(
                  0,
                  safeCurrentPage - 3
                ),
                Math.min(
                  totalPages,
                  safeCurrentPage + 2
                )
              )
              .map((page) => (
                <button
                  key={page}
                  onClick={() =>
                    setCurrentPage(
                      page
                    )
                  }
                  className="h-8 min-w-8 rounded-lg px-2 text-xs font-bold"
                  style={
                    safeCurrentPage ===
                    page
                      ? {
                          background:
                            FORTUNA_RED,
                          color:
                            "white",
                        }
                      : {
                          border:
                            "1px solid #E5E7EB",
                          color:
                            "#374151",
                        }
                  }
                >
                  {page}
                </button>
              ))}

            <button
              disabled={
                safeCurrentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
            >
              Next
            </button>

          </div>

        </div>

      </div>

        </div>

        {/* QUICK STATS */}
        <div className="min-w-0 xl:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Quick Stats</h3>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">Current filtered quotation summary</p>
              </div>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_RED }} />
            </div>

            <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
              <StatRow label="Total Quotations" value={quickStats.total} />
              <StatRow label="Draft" value={quickStats.draft} badge="gray" />
              <StatRow label="Submitted" value={quickStats.submitted} badge="blue" />
              <StatRow label="Pending Approval" value={quickStats.pending} badge="amber" />
              <StatRow label="Approved" value={quickStats.approved} badge="green" />
              <StatRow label="Rejected" value={quickStats.rejected} badge="red" />
              <StatRow label="Converted to SO" value={quickStats.converted} badge="blue" />
              <div className="my-3 border-t dark:border-gray-800" />
              <StatRow label="Total Quotation Value" value={quickStats.totalValue} money />
              <StatRow label="Avg Value / Quotation" value={quickStats.avgValue} money />
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
              <span className="font-semibold">Approval:</span> Each management level must approve separately — Sales Manager → Department Head → Finance Manager.
            </div>

            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
              <span className="font-semibold">Filters:</span> Quick Stats follows the same filters applied to the quotation list.
            </div>
          </div>
        </div>
      </div>

      {/* VIEW */}

      {selectedQuotation &&
        !showCreateForm && (
          <QuotationViewModal
            quotation={
              selectedQuotation
            }
            onClose={() => {
              setSelectedQuotation(null);
              setApprovalDecision(null);
              setApprovalDecisionLevel(null);
              setApprovalRemark("");
            }}
            onPrint={() =>
              printQuotation(
                selectedQuotation
              )
            }
            onConvert={() =>
              convertToSalesOrder(
                selectedQuotation
              )
            }
            onApproveLevel={(level) =>
              openApprovalDecision(level, "approve")
            }
            onRejectLevel={(level) =>
              openApprovalDecision(level, "reject")
            }
          />
        )}

      {selectedQuotation &&
        approvalDecision && (
          <ApprovalDecisionModal
            quotation={selectedQuotation}
            level={
              approvalDecisionLevel ||
              getCurrentApprovalLevel(selectedQuotation)
            }
            decision={approvalDecision}
            remark={approvalRemark}
            onRemarkChange={setApprovalRemark}
            onClose={() => {
              setApprovalDecision(null);
              setApprovalDecisionLevel(null);
              setApprovalRemark("");
            }}
            onConfirm={confirmApprovalDecision}
          />
        )}

      {/* CREATE / EDIT */}

      {selectedQuotation &&
        showCreateForm && (
          <QuotationFormModal
            quotation={
              selectedQuotation
            }
            onClose={() => {
              setShowCreateForm(
                false
              );

              setSelectedQuotation(
                null
              );
            }}
            onSave={(updated) => {
              if (updated.status === "Submitted") {
                const date = today();
                const approvalReady: Quotation = {
                  ...updated,
                  submittedBy:
                    updated.submittedBy ||
                    updated.salesperson ||
                    updated.createdBy ||
                    "Current User",
                  submittedDate:
                    updated.submittedDate || date,
                  approvalLevel: 1,
                  currentApprover: "Sales Manager",
                  rejectionReason: undefined,
                  approvalHistory: [
                    ...(updated.approvalHistory || []),
                    {
                      id: Date.now(),
                      level: 1,
                      approver: "Sales Manager",
                      action: "Submitted",
                      date,
                      remark: "Quotation submitted for sequential approval: Sales Manager → Department Head → Finance Manager.",
                    },
                  ],
                };

                updateQuotation(approvalReady);
              } else {
                updateQuotation(updated);
              }

              setShowCreateForm(false);
            }}
          />
        )}

    </div>
  );
}

/* =========================================================
   KPI
========================================================= */

function KpiCard({
  title,
  value,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  icon: string;
  gradient:
    | "red"
    | "blue"
    | "green"
    | "amber"
    | "purple";
}) {
  const gradients = {
    red: `linear-gradient(135deg, ${FORTUNA_RED}, #EF4444)`,

    blue: `linear-gradient(135deg, ${FORTUNA_BLUE}, #0284C7)`,

    green:
      "linear-gradient(135deg, #059669, #10B981)",

    amber:
      "linear-gradient(135deg, #D97706, #F59E0B)",

    purple:
      "linear-gradient(135deg, #6D28D9, #8B5CF6)",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">

      <div
        className="absolute right-0 top-0 h-20 w-20 rounded-full opacity-10 blur-2xl"
        style={{
          background:
            gradients[gradient],
        }}
      />

      <div className="relative flex items-center justify-between">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-lg font-extrabold text-gray-900 dark:text-white">
            {value}
          </p>

        </div>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-extrabold text-white"
          style={{
            background:
              gradients[gradient],
          }}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FILTER INPUT
========================================================= */

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
}) {
  return (
    <div>

      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-red-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />

    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: string[];
}) {
  return (
    <div>

      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-red-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/* =========================================================
   APPROVAL STEP
========================================================= */

function ApprovalStep({
  level,
  title,
  status,
  actionable,
  onApprove,
  onReject,
}: {
  level: string;
  title: string;
  status: "Pending" | "Approved" | "Rejected";
  actionable: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isApproved = status === "Approved";
  const isRejected = status === "Rejected";

  const wrapperClass = isApproved
    ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20"
    : isRejected
      ? "border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/20"
      : actionable
        ? "border-amber-300 bg-amber-50/80 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20"
        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900";

  const badgeClass = isApproved
    ? "bg-emerald-600 text-white"
    : isRejected
      ? "bg-red-600 text-white"
      : actionable
        ? "bg-amber-500 text-white"
        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300";

  const statusClass = isApproved
    ? "text-emerald-700 dark:text-emerald-300"
    : isRejected
      ? "text-red-700 dark:text-red-300"
      : actionable
        ? "text-amber-700 dark:text-amber-300"
        : "text-gray-500 dark:text-gray-400";

  return (
    <div className={`rounded-xl border p-3 transition-all duration-200 ${wrapperClass}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${badgeClass}`}>
          {isApproved ? "✓" : isRejected ? "!" : level}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-extrabold text-gray-800 dark:text-white">{title}</p>
            <span className={`text-[9px] font-extrabold uppercase ${statusClass}`}>
              {isApproved ? "APPROVED" : isRejected ? "REJECTED" : actionable ? "PENDING" : "WAITING"}
            </span>
          </div>

          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            Level {level} · {title}
          </p>
        </div>
      </div>

      {actionable && (
        <div className="mt-3 flex gap-2 border-t border-amber-200 pt-3 dark:border-amber-900/40">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-extrabold text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-950/20"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: "#16A34A" }}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   APPROVAL DECISION MODAL
========================================================= */

function ApprovalDecisionModal({
  quotation,
  level,
  decision,
  remark,
  onRemarkChange,
  onClose,
  onConfirm,
}: {
  quotation: Quotation;
  level: number;
  decision: "approve" | "reject";
  remark: string;
  onRemarkChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isApprove = decision === "approve";
  const role = getApprovalRole(level);

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div
          className="px-5 py-4 text-white"
          style={{
            background: `linear-gradient(90deg, ${FORTUNA_RED}, ${FORTUNA_BLUE})`,
          }}
        >
          <p className="text-[10px] font-bold uppercase opacity-80">
            Approval Decision · Level {level}
          </p>
          <h3 className="mt-1 text-base font-extrabold">
            {isApprove ? "Approve" : "Reject"} {quotation.quotationNo}
          </h3>
          <p className="mt-1 text-[10px] font-semibold opacity-90">
            {role}
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div
            className={
              isApprove
                ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20"
            }
          >
            <p
              className={
                isApprove
                  ? "text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                  : "text-[10px] font-extrabold uppercase tracking-wide text-red-700 dark:text-red-300"
              }
            >
              {isApprove ? "Approval Remark Required" : "Rejection Reason Required"}
            </p>
            <p
              className={
                isApprove
                  ? "mt-1 text-xs text-emerald-700 dark:text-emerald-200"
                  : "mt-1 text-xs text-red-700 dark:text-red-200"
              }
            >
              This action will be recorded against Level {level} — {role}.
              {isApprove
                ? " The next approval level will become active after confirmation."
                : " Rejection will stop the quotation approval workflow."}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {isApprove ? "Approval Remarks" : "Rejection Remarks"}
              <span className="ml-1 text-red-600">*</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => onRemarkChange(e.target.value)}
              rows={5}
              autoFocus
              placeholder={
                isApprove
                  ? "Enter approval remarks..."
                  : "Enter rejection reason..."
              }
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-red-950"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!remark.trim()}
              className="rounded-lg px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: isApprove ? "#16A34A" : FORTUNA_RED,
              }}
            >
              {isApprove ? "Confirm Approval" : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VIEW MODAL
========================================================= */

function QuotationViewModal({
  quotation,
  onClose,
  onPrint,
  onConvert,
  onApproveLevel,
  onRejectLevel,
}: {
  quotation: Quotation;
  onClose: () => void;
  onPrint: () => void;
  onConvert: () => void;
  onApproveLevel: (level: number) => void;
  onRejectLevel: (level: number) => void;
}) {
  const totals =
    calculateQuotationTotals(
      quotation
    );

  const effectiveApprovalLevel =
    getCurrentApprovalLevel(quotation);

  const currentApprover =
    quotation.currentApprover ||
    getApprovalRole(effectiveApprovalLevel);

  const approvalStatus = (level: number): "Pending" | "Approved" | "Rejected" => {
    const history = quotation.approvalHistory || [];

    if (history.some((item) => item.level === level && item.action === "Rejected")) {
      return "Rejected";
    }

    if (history.some((item) => item.level === level && item.action === "Approved")) {
      return "Approved";
    }

    if (quotation.status === "Approved") return "Approved";
    return "Pending";
  };

  const canApproveLevel =
    quotation.status === "Submitted" || quotation.status === "Under Approval";

  const isCurrentApprovalLevel = (level: number) =>
    canApproveLevel && level === effectiveApprovalLevel;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60">

      <div className="flex h-full w-full items-start justify-center px-3 pb-3 pt-[96px] sm:px-4 sm:pb-4 sm:pt-[96px]">

        <div className="flex h-[calc(100vh-108px)] max-h-[calc(100vh-108px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

        <div
          className="flex shrink-0 items-center justify-between px-6 py-4 text-white"
          style={{
            background:
              `linear-gradient(90deg, ${FORTUNA_RED}, ${FORTUNA_BLUE})`,
          }}
        >

          <div>

            <p className="text-[10px] font-bold uppercase opacity-80">
              Sales Quotation
            </p>

            <h2 className="text-lg font-extrabold">
              {
                quotation.quotationNo
              }
            </h2>

          </div>

          <button
            onClick={
              onClose
            }
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-bold hover:bg-white/25"
          >
            ✕
          </button>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">

          <div className="space-y-5">

          {/* CUSTOMER */}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <InfoCard title="Customer Information">

              <InfoRow
                label="Customer"
                value={
                  quotation.customerName
                }
              />

              <InfoRow
                label="Customer Code"
                value={
                  quotation.customerCode
                }
              />

              <InfoRow
                label="Contact"
                value={
                  quotation.contactPerson ||
                  "-"
                }
              />

              <InfoRow
                label="Country"
                value={
                  quotation.country
                }
              />

              <InfoRow
                label="Billing Address"
                value={
                  quotation.billingAddress ||
                  "-"
                }
              />

              <InfoRow
                label="Shipping Address"
                value={
                  quotation.shippingAddress ||
                  "-"
                }
              />

            </InfoCard>

            <InfoCard title="Quotation Information">

              <InfoRow
                label="Quotation Date"
                value={
                  quotation.quotationDate
                }
              />

              <InfoRow
                label="Valid Until"
                value={
                  quotation.validUntil
                }
              />

              <InfoRow
                label="Currency"
                value={
                  quotation.currency
                }
              />

              <InfoRow
                label="Salesperson"
                value={
                  quotation.salesperson
                }
              />

              <InfoRow
                label="Payment Terms"
                value={
                  quotation.paymentTerms
                }
              />

              <InfoRow
                label="Incoterm"
                value={
                  quotation.incoterm
                }
              />

            </InfoCard>

          </div>

          {/* ITEMS */}

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">

            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">

              <h3 className="text-xs font-bold text-gray-800 dark:text-white">
                Quotation Items
              </h3>

            </div>

            <div className="overflow-x-auto">

              <table className="min-w-[950px] w-full">

                <thead>

                  <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-500 dark:border-gray-700">

                    <th className="px-4 py-3 text-left">
                      Product
                    </th>

                    <th className="px-4 py-3 text-left">
                      Description
                    </th>

                    <th className="px-4 py-3 text-right">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-right">
                      Unit Price
                    </th>

                    <th className="px-4 py-3 text-right">
                      Discount
                    </th>

                    <th className="px-4 py-3 text-right">
                      Tax
                    </th>

                    <th className="px-4 py-3 text-right">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {quotation.items.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                        className="border-b border-gray-100 dark:border-gray-800"
                      >

                        <td className="px-4 py-3 text-xs font-bold">
                          {
                            item.productCode ||
                            "-"
                          }
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {
                            item.description ||
                            "-"
                          }
                        </td>

                        <td className="px-4 py-3 text-right text-xs">
                          {
                            item.quantity
                          }{" "}
                          {
                            item.uom
                          }
                        </td>

                        <td className="px-4 py-3 text-right text-xs">
                          {formatCurrency(
                            item.unitPrice,
                            quotation.currency
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-xs">
                          {
                            item.discount
                          }%
                        </td>

                        <td className="px-4 py-3 text-right text-xs">
                          {
                            item.taxRate
                          }%
                        </td>

                        <td className="px-4 py-3 text-right text-xs font-bold">

                          {formatCurrency(
                            calculateItemSubtotal(
                              item
                            ) *
                              (1 +
                                item.taxRate /
                                  100),
                            quotation.currency
                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* TOTALS */}

          <div className="flex justify-end">

            <div className="w-full max-w-sm rounded-xl border border-gray-200 p-4 dark:border-gray-700">

              <TotalRow
                label="Subtotal"
                value={formatCurrency(
                  totals.subtotal,
                  quotation.currency
                )}
              />

              <TotalRow
                label="Tax"
                value={formatCurrency(
                  totals.tax,
                  quotation.currency
                )}
              />

              <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

              <div className="flex justify-between">

                <span className="text-sm font-extrabold">
                  Grand Total
                </span>

                <span
                  className="text-sm font-extrabold"
                  style={{
                    color:
                      FORTUNA_RED,
                  }}
                >
                  {formatCurrency(
                    totals.grandTotal,
                    quotation.currency
                  )}
                </span>

              </div>

            </div>

          </div>

          {/* STATUS */}

          <div className="flex flex-wrap items-center gap-3">

            <span className="text-xs font-bold text-gray-500">
              Status
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold ${statusClass(
                quotation.status
              )}`}
            >
              {
                quotation.status
              }
            </span>

          </div>

          {/* AUTH */}

          <InfoCard title="Authorization">

            <InfoRow
              label="Prepared By"
              value={
                quotation.createdBy
              }
            />

            <InfoRow
              label="Submitted By"
              value={
                quotation.submittedBy ||
                "-"
              }
            />

            <InfoRow
              label="Approved By"
              value={
                quotation.approvedBy ||
                "-"
              }
            />

            <InfoRow
              label="Approved Date"
              value={
                quotation.approvedDate ||
                "-"
              }
            />

          </InfoCard>

          {/* APPROVAL WORKFLOW */}

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-gray-800 dark:text-white">Approval Workflow</h3>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">Each approval level is completed separately, in sequence.</p>
              </div>

              {canApproveLevel && (
                <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">
                  Current Approval: {currentApprover}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {APPROVAL_ROUTE.map((step) => (
                <ApprovalStep
                  key={step.level}
                  level={String(step.level)}
                  title={step.role}
                  status={approvalStatus(step.level)}
                  actionable={isCurrentApprovalLevel(step.level)}
                  onApprove={() => onApproveLevel(step.level)}
                  onReject={() => onRejectLevel(step.level)}
                />
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: FORTUNA_BLUE }}>i</div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-800 dark:text-blue-300">Sequential Approval</p>
                  <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-200">
                    Sales Manager must approve first. After that, Department Head can approve. Finance Manager provides the final approval. Each level has its own action.
                  </p>
                </div>
              </div>
            </div>

            {quotation.rejectionReason && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-red-700 dark:text-red-300">Rejection Reason</p>
                <p className="mt-1 text-xs text-red-700 dark:text-red-200">{quotation.rejectionReason}</p>
              </div>
            )}

            {quotation.approvalHistory && quotation.approvalHistory.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <table className="min-w-[680px] w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-[9px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                      <th className="px-3 py-2">Level</th><th className="px-3 py-2">Approver</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.approvalHistory.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                        <td className="px-3 py-2 text-xs font-bold">Level {entry.level}</td>
                        <td className="px-3 py-2 text-xs">{entry.approver}</td>
                        <td className="px-3 py-2">
                          <span className={"inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold " + (entry.action === "Rejected" ? "border-red-200 bg-red-50 text-red-700" : entry.action === "Approved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700")}>{entry.action}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs">{entry.date}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{entry.remark || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* NOTES */}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <InfoCard title="Remarks">

              <p className="text-xs leading-6 text-gray-600 dark:text-gray-300">
                {
                  quotation.remarks ||
                  "No remarks"
                }
              </p>

            </InfoCard>

            <InfoCard title="Terms & Conditions">

              <p className="text-xs leading-6 text-gray-600 dark:text-gray-300">
                {
                  quotation.terms ||
                  "No terms defined"
                }
              </p>

            </InfoCard>

          </div>

          {/* ACTIONS */}

          <div className="sticky bottom-0 z-20 -mx-6 flex flex-col gap-3 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">

            {(quotation.status === "Submitted" || quotation.status === "Under Approval") && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900/40 dark:bg-blue-950/20">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                  Current Approval: {currentApprover}
                </p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                  Approval must proceed sequentially. Once a level is approved, its action buttons are removed and the next level becomes active.
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold dark:border-gray-700"
              >
                Close
              </button>
              <button
                onClick={onPrint}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
              >
                🖨 Print / PDF
              </button>
              {quotation.status === "Accepted" && (
                <button
                  onClick={onConvert}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-white"
                  style={{ background: FORTUNA_BLUE }}
                >
                  Convert to Sales Order
                </button>
              )}
            </div>

          </div>

          </div>

        </div>

      </div>

      </div>

    </div>
  );
}

/* =========================================================
   FORM MODAL
========================================================= */

function QuotationFormModal({
  quotation,
  onClose,
  onSave,
}: {
  quotation: Quotation;
  onClose: () => void;
  onSave: (
    quotation: Quotation
  ) => void;
}) {
  const [form, setForm] =
    useState<Quotation>(
      quotation
    );

  const totals =
    calculateQuotationTotals(
      form
    );

  const updateField = <
    K extends keyof Quotation
  >(
    field: K,
    value: Quotation[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateItem = (
    itemId: number,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,

      items: prev.items.map(
        (item) =>
          item.id === itemId
            ? {
                ...item,
                [field]:
                  value,
              }
            : item
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,

      items: [
        ...prev.items,

        {
          id: Date.now(),

          productCode: "",

          description: "",

          category: "Product",

          quantity: 1,

          uom: "EA",

          unitPrice: 0,

          discount: 0,

          taxRate: 0,
        },
      ],
    }));
  };

  const removeItem = (
    itemId: number
  ) => {
    if (
      form.items.length ===
      1
    ) {
      return;
    }

    setForm((prev) => ({
      ...prev,

      items:
        prev.items.filter(
          (item) =>
            item.id !==
            itemId
        ),
    }));
  };

  const saveDraft = () => {
    onSave({
      ...form,

      status: "Draft",
    });
  };

  const submitForApproval =
    () => {
      const today = new Date()
        .toISOString()
        .split("T")[0];

      onSave({
        ...form,

        status:
          "Submitted",

        submittedBy:
          form.createdBy,

        submittedDate:
          today,
      });
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">

      <div className="max-h-[95vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

        {/* HEADER */}

        <div
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 text-white"
          style={{
            background:
              `linear-gradient(90deg, ${FORTUNA_RED}, ${FORTUNA_BLUE})`,
          }}
        >

          <div>

            <p className="text-[10px] font-bold uppercase opacity-80">
              Create / Edit
            </p>

            <h2 className="text-lg font-extrabold">
              {
                form.quotationNo
              }
            </h2>

          </div>

          <button
            onClick={
              onClose
            }
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-bold"
          >
            ✕
          </button>

        </div>

        <div className="space-y-5 p-6">

          {/* BASIC */}

          <SectionCard
            title="Quotation Information"
            subtitle="Global commercial document information"
          >

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              <FormInput
                label="Quotation No"
                value={
                  form.quotationNo
                }
                disabled
              />

              <FormInput
                label="Quotation Date"
                type="date"
                value={
                  form.quotationDate
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "quotationDate",
                    value
                  )
                }
              />

              <FormInput
                label="Valid Until"
                type="date"
                value={
                  form.validUntil
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "validUntil",
                    value
                  )
                }
              />

              <FormInput
                label="Customer Reference"
                value={
                  form.customerReference
                }
                placeholder="Customer RFQ / Reference"
                onChange={(
                  value
                ) =>
                  updateField(
                    "customerReference",
                    value
                  )
                }
              />

            </div>

          </SectionCard>

          {/* CUSTOMER */}

          <SectionCard
            title="Customer & Organization"
            subtitle="Customer, business unit and fulfillment context"
          >

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

              <FormInput
                label="Customer Code"
                value={
                  form.customerCode
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "customerCode",
                    value
                  )
                }
              />

              <FormInput
                label="Customer Name"
                value={
                  form.customerName
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "customerName",
                    value
                  )
                }
              />

              <FormInput
                label="Contact Person"
                value={
                  form.contactPerson
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "contactPerson",
                    value
                  )
                }
              />

              <FormInput
                label="Country"
                value={
                  form.country
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "country",
                    value
                  )
                }
              />

              <FormTextarea
                label="Billing Address"
                value={
                  form.billingAddress
                }
                rows={3}
                onChange={(
                  value
                ) =>
                  updateField(
                    "billingAddress",
                    value
                  )
                }
              />

              <FormTextarea
                label="Shipping Address"
                value={
                  form.shippingAddress
                }
                rows={3}
                onChange={(
                  value
                ) =>
                  updateField(
                    "shippingAddress",
                    value
                  )
                }
              />

              <FormInput
                label="Company"
                value={
                  form.company
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "company",
                    value
                  )
                }
              />

              <FormInput
                label="Business Unit"
                value={
                  form.businessUnit
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "businessUnit",
                    value
                  )
                }
              />

              <FormInput
                label="Warehouse / Location"
                value={
                  form.warehouse
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "warehouse",
                    value
                  )
                }
              />

              <FormInput
                label="Salesperson"
                value={
                  form.salesperson
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "salesperson",
                    value
                  )
                }
              />

            </div>

          </SectionCard>

          {/* COMMERCIAL */}

          <SectionCard
            title="Commercial Terms"
            subtitle="Currency, payment, delivery and international trade information"
          >

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

              <FormSelect
                label="Currency"
                value={
                  form.currency
                }
                options={
                  CURRENCIES
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "currency",
                    value as Currency
                  )
                }
              />

              <FormInput
                label="Exchange Rate"
                type="number"
                value={String(
                  form.exchangeRate
                )}
                onChange={(
                  value
                ) =>
                  updateField(
                    "exchangeRate",
                    Number(value)
                  )
                }
              />

              <FormInput
                label="Payment Terms"
                value={
                  form.paymentTerms
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "paymentTerms",
                    value
                  )
                }
              />

              <FormInput
                label="Delivery Terms"
                value={
                  form.deliveryTerms
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "deliveryTerms",
                    value
                  )
                }
              />

              <FormInput
                label="Incoterm"
                value={
                  form.incoterm
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "incoterm",
                    value
                  )
                }
              />

            </div>

          </SectionCard>

          {/* ITEMS */}

          <SectionCard
            title="Quotation Items"
            subtitle="Products, services, quantities, pricing and tax"
          >

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">

              <table className="min-w-[1250px] w-full">

                <thead>

                  <tr
                    className="text-[10px] font-bold uppercase text-white"
                    style={{
                      background:
                        `linear-gradient(90deg, ${FORTUNA_RED}, ${FORTUNA_BLUE})`,
                    }}
                  >

                    <th className="px-3 py-3 text-left">
                      Product / Service
                    </th>

                    <th className="px-3 py-3 text-left">
                      Description
                    </th>

                    <th className="px-3 py-3">
                      Category
                    </th>

                    <th className="px-3 py-3">
                      Qty
                    </th>

                    <th className="px-3 py-3">
                      UOM
                    </th>

                    <th className="px-3 py-3">
                      Unit Price
                    </th>

                    <th className="px-3 py-3">
                      Discount %
                    </th>

                    <th className="px-3 py-3">
                      Tax %
                    </th>

                    <th className="px-3 py-3 text-right">
                      Line Total
                    </th>

                    <th className="px-3 py-3 text-center">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {form.items.map(
                    (item) => {

                      const lineTotal =
                        calculateItemSubtotal(
                          item
                        ) *
                        (1 +
                          item.taxRate /
                            100);

                      return (
                        <tr
                          key={
                            item.id
                          }
                          className="border-b border-gray-100 dark:border-gray-800"
                        >

                          <td className="px-2 py-2">

                            <input
                              value={
                                item.productCode
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "productCode",
                                  e
                                    .target
                                    .value
                                )
                              }
                              placeholder="Product code"
                              className="w-32 rounded-md border border-gray-200 px-2 py-2 text-xs outline-none dark:border-gray-700 dark:bg-gray-800"
                            />

                          </td>

                          <td className="px-2 py-2">

                            <input
                              value={
                                item.description
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "description",
                                  e
                                    .target
                                    .value
                                )
                              }
                              placeholder="Description"
                              className="w-56 rounded-md border border-gray-200 px-2 py-2 text-xs outline-none dark:border-gray-700 dark:bg-gray-800"
                            />

                          </td>

                          <td className="px-2 py-2">

                            <select
                              value={
                                item.category
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "category",
                                  e
                                    .target
                                    .value
                                )
                              }
                              className="w-28 rounded-md border border-gray-200 px-2 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                            >

                              <option>
                                Product
                              </option>

                              <option>
                                Service
                              </option>

                              <option>
                                Software
                              </option>

                              <option>
                                Equipment
                              </option>

                              <option>
                                Spare
                              </option>

                              <option>
                                Other
                              </option>

                            </select>

                          </td>

                          <td className="px-2 py-2">

                            <input
                              type="number"
                              min={0}
                              value={
                                item.quantity
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  Number(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-20 rounded-md border border-gray-200 px-2 py-2 text-right text-xs dark:border-gray-700 dark:bg-gray-800"
                            />

                          </td>

                          <td className="px-2 py-2">

                            <input
                              value={
                                item.uom
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "uom",
                                  e
                                    .target
                                    .value
                                )
                              }
                              className="w-20 rounded-md border border-gray-200 px-2 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                            />

                          </td>

                          <td className="px-2 py-2">

                            <input
                              type="number"
                              min={0}
                              value={
                                item.unitPrice
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "unitPrice",
                                  Number(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-28 rounded-md border border-gray-200 px-2 py-2 text-right text-xs dark:border-gray-700 dark:bg-gray-800"
                            />

                          </td>

                          <td className="px-2 py-2">

                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={
                                item.discount
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "discount",
                                  Number(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-20 rounded-md border border-gray-200 px-2 py-2 text-right text-xs dark:border-gray-700 dark:bg-gray-800"
                            />

                          </td>

                          <td className="px-2 py-2">

                            <input
                              type="number"
                              min={0}
                              value={
                                item.taxRate
                              }
                              onChange={(
                                e
                              ) =>
                                updateItem(
                                  item.id,
                                  "taxRate",
                                  Number(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-20 rounded-md border border-gray-200 px-2 py-2 text-right text-xs dark:border-gray-700 dark:bg-gray-800"
                            />

                          </td>

                          <td className="px-3 py-2 text-right text-xs font-bold">

                            {formatCurrency(
                              lineTotal,
                              form.currency
                            )}

                          </td>

                          <td className="px-2 py-2 text-center">

                            <button
                              onClick={() =>
                                removeItem(
                                  item.id
                                )
                              }
                              className="rounded-md px-2 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            <div className="mt-3">

              <button
                onClick={
                  addItem
                }
                className="rounded-lg border px-3 py-2 text-xs font-bold"
                style={{
                  borderColor:
                    FORTUNA_RED,

                  color:
                    FORTUNA_RED,
                }}
              >
                + Add Item
              </button>

            </div>

          </SectionCard>

          {/* TOTALS */}

          <div className="flex justify-end">

            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">

              <TotalRow
                label="Subtotal"
                value={formatCurrency(
                  totals.subtotal,
                  form.currency
                )}
              />

              <TotalRow
                label="Tax"
                value={formatCurrency(
                  totals.tax,
                  form.currency
                )}
              />

              <div className="my-3 border-t border-gray-200 dark:border-gray-700" />

              <div className="flex items-center justify-between">

                <span className="text-sm font-extrabold">
                  Grand Total
                </span>

                <span
                  className="text-xl font-extrabold"
                  style={{
                    color:
                      FORTUNA_RED,
                  }}
                >
                  {formatCurrency(
                    totals.grandTotal,
                    form.currency
                  )}
                </span>

              </div>

            </div>

          </div>

          {/* NOTES */}

          <SectionCard
            title="Remarks & Terms"
            subtitle="Commercial notes and customer-facing terms"
          >

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

              <FormTextarea
                label="Remarks"
                value={
                  form.remarks
                }
                placeholder="Enter commercial remarks..."
                onChange={(
                  value
                ) =>
                  updateField(
                    "remarks",
                    value
                  )
                }
              />

              <FormTextarea
                label="Terms & Conditions"
                value={
                  form.terms
                }
                placeholder="Enter quotation terms..."
                onChange={(
                  value
                ) =>
                  updateField(
                    "terms",
                    value
                  )
                }
              />

            </div>

          </SectionCard>

          {/* BUSINESS RULE */}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">

            <div className="flex gap-3">

              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{
                  background:
                    FORTUNA_BLUE,
                }}
              >
                i
              </div>

              <div>

                <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                  Inventory Reservation Rule
                </p>

                <p className="mt-1 text-[11px] leading-5 text-blue-700 dark:text-blue-400">
                  Sales Quotation does not
                  reserve inventory. Stock
                  allocation / reservation
                  begins according to the
                  Sales Order workflow.
                </p>

              </div>

            </div>

          </div>

          {/* ACTIONS */}

          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white pt-4 dark:border-gray-700 dark:bg-gray-900">

            <button
              onClick={
                onClose
              }
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold dark:border-gray-700"
            >
              Cancel
            </button>

            <button
              onClick={
                saveDraft
              }
              className="rounded-lg border px-4 py-2 text-xs font-bold"
              style={{
                borderColor:
                  FORTUNA_RED,

                color:
                  FORTUNA_RED,
              }}
            >
              Save Draft
            </button>

            <button
              onClick={
                submitForApproval
              }
              className="rounded-lg px-5 py-2 text-xs font-bold text-white shadow-sm"
              style={{
                background:
                  `linear-gradient(135deg, ${FORTUNA_RED}, ${FORTUNA_BLUE})`,
              }}
            >
              Submit for Approval
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">

      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">

        <h3 className="text-sm font-bold text-gray-800 dark:text-white">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 text-[10px] text-gray-500">
            {subtitle}
          </p>
        )}

      </div>

      <div className="p-5">
        {children}
      </div>

    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">

      <h3 className="mb-3 text-xs font-bold text-gray-800 dark:text-white">
        {title}
      </h3>

      <div className="space-y-2">
        {children}
      </div>

    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">

      <span className="text-[10px] font-semibold text-gray-500">
        {label}
      </span>

      <span className="text-right text-[11px] font-bold text-gray-800 dark:text-gray-200">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   TOTAL ROW
========================================================= */

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-2 flex justify-between">

      <span className="text-xs text-gray-500">
        {label}
      </span>

      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   FORM INPUT
========================================================= */

function FormInput({
  label,
  value,
  type = "text",
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        disabled={disabled}
        onChange={(e) =>
          onChange?.(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-red-400 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800"
      />

    </div>
  );
}

/* =========================================================
   FORM SELECT
========================================================= */

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-red-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      >

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/* =========================================================
   FORM TEXTAREA
========================================================= */

function FormTextarea({
  label,
  value,
  placeholder,
  rows = 5,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <textarea
        value={value}
        placeholder={
          placeholder
        }
        rows={rows}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-red-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />

    </div>
  );
}