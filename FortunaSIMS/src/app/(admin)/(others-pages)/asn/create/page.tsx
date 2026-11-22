"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/* =========================================================
   ASN GLOBAL BUSINESS RULES
========================================================= */

const ASN_RULES = {
  allowPartialDelivery: true,
  requirePurchaseOrder: true,
  requireShipmentDate: true,
  requireExpectedArrival: true,
  requireDeliverySchedule: true,
  requireAtLeastOneItem: true,
  preventOverShipment: true,
  preventNegativeQuantity: true,
  preventZeroShippingQuantity: true,
  vendorFromPOOnly: true,
  warehouseFromPOOnly: true,
  requireWeightUOMWhenWeightEntered: true,
  lockAfterSubmit: true,
  approvalRequired: false,
  acceptRejectRequired: false,
};

/* =========================================================
   TYPES
========================================================= */

type ASNStatus =
  | "Draft"
  | "Submitted"
  | "In Transit"
  | "Arrived"
  | "Partially Received"
  | "Fully Received"
  | "Closed";

type DeliverySchedule = "Single" | "Partial" | "";

type WeightUOM = "KG" | "TON" | "LB" | "";

type Warehouse = {
  id: string;
  name: string;
  address: string;
};

type Vendor = {
  id: string;
  name: string;
  address: string;
  gstin: string;
  contact_person: string;
  email: string;
};

type POItem = {
  po_item_id: string;
  item_id: string;
  description: string;
  uom: string;
  ordered_qty: number;
  previously_asn_qty: number;
  delivery_date: string;
};

type PurchaseOrder = {
  id: string;
  number: string;
  date: string;
  status: string;
  vendor_id: string;
  warehouse_id: string;
  items: POItem[];
};

type ASNItem = POItem & {
  shipping_qty: number;
};

type ASNFormState = {
  asn_id: string;
  asn_number: string;
  asn_date: string;
  status: ASNStatus;

  po_id: string;
  po_number: string;
  po_date: string;

  vendor_id: string;
  vendor_name: string;
  vendor_address: string;
  vendor_gstin: string;
  vendor_contact: string;
  vendor_email: string;

  warehouse_id: string;
  warehouse_name: string;
  warehouse_address: string;

  shipment_date: string;
  expected_arrival: string;
  delivery_schedule: DeliverySchedule;

  transporter: string;
  vehicle_number: string;
  lr_awb_number: string;
  shipping_reference: string;

  package_count: string;
  pallet_count: string;
  total_weight: string;
  weight_uom: WeightUOM;

  invoice_number: string;
  invoice_date: string;
  eway_bill_number: string;
  packing_list_number: string;

  packing_instructions: string;
  remarks: string;

  items: ASNItem[];
};

type ValidationErrors = Record<string, string>;

type ASNAttachment = {
  id: string | number;
  attachment_id?: string | number;
  file_name: string;
  file_url?: string;
  mime_type?: string;
  file_size?: number;
  document_type?: string;
  uploaded_at?: string;
};

/* =========================================================
   DEMO MASTER DATA
========================================================= */

const WAREHOUSES: Warehouse[] = [
  {
    id: "WH-001",
    name: "Vizag Central WH",
    address: "Vizag, Andhra Pradesh, India",
  },
  {
    id: "WH-002",
    name: "Hyderabad WH",
    address: "Hyderabad, Telangana, India",
  },
  {
    id: "WH-003",
    name: "Chennai WH",
    address: "Chennai, Tamil Nadu, India",
  },
];

const VENDORS: Vendor[] = [
  {
    id: "V-001",
    name: "Sri Lakshmi Suppliers",
    address: "Dwaraka Nagar, Vizag, Andhra Pradesh, India",
    gstin: "37ABCDE1234F1Z1",
    contact_person: "Ramesh",
    email: "sales@srilakshmi.com",
  },
  {
    id: "V-002",
    name: "Aparna Packaging",
    address: "Kukatpally, Hyderabad, Telangana, India",
    gstin: "36PQRSX5678K1Z9",
    contact_person: "Aparna",
    email: "quotes@aparnapack.com",
  },
];

/*
  Only Approved / Issued / Open POs are exposed for ASN creation.

  In production:
  - Cancelled PO => not eligible
  - Closed PO => not eligible
  - Fully ASN'ed PO => not eligible
  - Vendor mismatch => backend must reject
  - Warehouse mismatch => backend must reject
*/

const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-ID-001",
    number: "PO-2026-00121",
    date: "2026-10-01",
    status: "Approved",
    vendor_id: "V-001",
    warehouse_id: "WH-001",
    items: [
      {
        po_item_id: "POITEM-1001",
        item_id: "SKU-BOX-5PLY",
        description: "Corrugated Box (5-ply)",
        uom: "Nos",
        ordered_qty: 200,
        previously_asn_qty: 0,
        delivery_date: "2026-10-07",
      },
      {
        po_item_id: "POITEM-1002",
        item_id: "SKU-BUBBLE-L",
        description: "Bubble Wrap Roll (Large)",
        uom: "Box",
        ordered_qty: 20,
        previously_asn_qty: 0,
        delivery_date: "2026-10-07",
      },
    ],
  },
  {
    id: "PO-ID-002",
    number: "PO-2026-00118",
    date: "2026-09-29",
    status: "Issued",
    vendor_id: "V-002",
    warehouse_id: "WH-002",
    items: [
      {
        po_item_id: "POITEM-2001",
        item_id: "SKU-STRAP",
        description: "PP Strapping Roll",
        uom: "Nos",
        ordered_qty: 50,
        previously_asn_qty: 0,
        delivery_date: "2026-10-06",
      },
    ],
  },
  {
    id: "PO-ID-003",
    number: "PO-2026-00110",
    date: "2026-09-25",
    status: "Open",
    vendor_id: "V-001",
    warehouse_id: "WH-001",
    items: [
      {
        po_item_id: "POITEM-3001",
        item_id: "SKU-TAPE",
        description: "Industrial Packing Tape",
        uom: "Roll",
        ordered_qty: 100,
        previously_asn_qty: 40,
        delivery_date: "2026-10-05",
      },
      {
        po_item_id: "POITEM-3002",
        item_id: "SKU-LABEL",
        description: "Shipping Labels",
        uom: "Pack",
        ordered_qty: 250,
        previously_asn_qty: 100,
        delivery_date: "2026-10-05",
      },
    ],
  },
];

/* =========================================================
   STYLES
========================================================= */

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm transition-all focus:outline-none " +
  "focus:ring-2 focus:ring-[#005F99]/10 focus:border-[#005F99] " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase =
  "text-sm font-medium text-gray-700 dark:text-gray-200";

const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none";

/* =========================================================
   HELPERS
========================================================= */

function classNames(
  ...values: Array<string | false | undefined | null>
) {
  return values.filter(Boolean).join(" ");
}

function todayISO() {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(days: number) {
  const date = new Date();

  date.setDate(date.getDate() + days);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusPill(status: ASNStatus) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap";

  switch (status) {
    case "Draft":
      return classNames(
        base,
        "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
      );

    case "Submitted":
      return classNames(
        base,
        "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
      );

    case "In Transit":
      return classNames(
        base,
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
      );

    case "Arrived":
      return classNames(
        base,
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
      );

    case "Partially Received":
      return classNames(
        base,
        "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
      );

    case "Fully Received":
      return classNames(
        base,
        "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
      );

    case "Closed":
      return classNames(
        base,
        "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"
      );

    default:
      return base;
  }
}

/* =========================================================
   INITIAL STATE
========================================================= */

const initialState: ASNFormState = {
  asn_id: "Auto-generated",
  asn_number: "Auto (ASN-YYYY-SEQ)",
  asn_date: todayISO(),
  status: "Draft",

  po_id: "",
  po_number: "",
  po_date: "",

  vendor_id: "",
  vendor_name: "",
  vendor_address: "",
  vendor_gstin: "",
  vendor_contact: "",
  vendor_email: "",

  warehouse_id: "",
  warehouse_name: "",
  warehouse_address: "",

  shipment_date: todayISO(),
  expected_arrival: addDaysISO(3),
  delivery_schedule: "",

  transporter: "",
  vehicle_number: "",
  lr_awb_number: "",
  shipping_reference: "",

  package_count: "",
  pallet_count: "",
  total_weight: "",
  weight_uom: "",

  invoice_number: "",
  invoice_date: "",
  eway_bill_number: "",
  packing_list_number: "",

  packing_instructions: "",
  remarks: "",

  items: [],
};

/* =========================================================
   PAGE
========================================================= */

// NEXT_PUBLIC_API_URL must point to the backend API root, e.g. http://localhost:5000/api
const RAW_API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
const ASN_API_BASE = RAW_API_BASE
  ? (RAW_API_BASE.endsWith("/api") ? RAW_API_BASE : `${RAW_API_BASE}/api`)
  : "";

async function asnApi(path: string, init?: RequestInit) {
  if (!ASN_API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is missing. Set it to your backend URL ending in /api, then restart the frontend.");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${ASN_API_BASE}/asn${normalizedPath}`;
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers || {});
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
  throw new Error(
    body.error
      ? `${body.message || "ASN API failed"}: ${body.error}`
      : body.message || `ASN API request failed (${response.status})`
  );
}
  return body;
}

const getAttachmentUrl = (fileUrl?: string) => {
  if (!fileUrl) return "";

  // Already a complete URL
  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  // Remove /api from backend base URL for static uploads
  const backendOrigin = RAW_API_BASE.replace(/\/api\/?$/, "");

  const normalizedFileUrl = fileUrl.startsWith("/")
    ? fileUrl
    : `/${fileUrl}`;

  return `${backendOrigin}${normalizedFileUrl}`;
};


const pick = (obj: any, ...keys: string[]) => { for (const key of keys) if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key]; return ""; };

function buildPayload(form: ASNFormState) {
  return {
    asn_date: form.asn_date || null, po_id: form.po_id, po_number: form.po_number, po_date: form.po_date || null,
    vendor_id: form.vendor_id || null, vendor_name: form.vendor_name, vendor_address: form.vendor_address || null, vendor_gstin: form.vendor_gstin || null, vendor_contact: form.vendor_contact || null, vendor_email: form.vendor_email || null,
    warehouse_id: form.warehouse_id || null, warehouse_name: form.warehouse_name || null, warehouse_address: form.warehouse_address || null,
    shipment_date: form.shipment_date || null, expected_arrival: form.expected_arrival || null, delivery_schedule: form.delivery_schedule || null,
    transporter: form.transporter || null, vehicle_number: form.vehicle_number || null, lr_awb_number: form.lr_awb_number || null, shipping_reference: form.shipping_reference || null,
    package_count: form.package_count === "" ? null : Number(form.package_count), pallet_count: form.pallet_count === "" ? null : Number(form.pallet_count), total_weight: form.total_weight === "" ? null : Number(form.total_weight), weight_uom: form.weight_uom || null,
    invoice_number: form.invoice_number || null, invoice_date: form.invoice_date || null, eway_bill_number: form.eway_bill_number || null, packing_list_number: form.packing_list_number || null, packing_instructions: form.packing_instructions || null, remarks: form.remarks || null,
    items: form.items.map((item) => ({ po_item_id: item.po_item_id, shipping_qty: Number(item.shipping_qty || 0), delivery_date: item.delivery_date || null }))
  };
}

export default function CreateASNPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("asn_id");
  const viewMode = searchParams.get("view") === "1";
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Synchronous guard prevents rapid double-clicks before React re-renders.
  const savingRef = useRef(false);
  const [apiError, setApiError] = useState("");
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [savedAttachments, setSavedAttachments] = useState<ASNAttachment[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);

  const [form, setForm] =
    useState<ASNFormState>(initialState);

  const [touched, setTouched] =
    useState<Record<string, boolean>>({});

  const [submitAttempted, setSubmitAttempted] =
    useState(false);

  const isLocked =
    viewMode ||
    (ASN_RULES.lockAfterSubmit && form.status !== "Draft");

  /* =======================================================
     PO ELIGIBILITY
  ======================================================== */

  const eligiblePurchaseOrders = useMemo(() => purchaseOrders, [purchaseOrders]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setApiError("");
      try {
        const poBody = await asnApi("/purchase-orders/eligible");
        const poRows = Array.isArray(poBody.data) ? poBody.data
          : Array.isArray(poBody.data?.rows) ? poBody.data.rows
          : Array.isArray(poBody.rows) ? poBody.rows
          : Array.isArray(poBody.purchaseOrders) ? poBody.purchaseOrders
          : Array.isArray(poBody.data?.purchaseOrders) ? poBody.data.purchaseOrders
          : [];
        const normalized: PurchaseOrder[] = poRows.map((po: any) => ({
          id: String(pick(po, "po_id", "id")), number: pick(po, "po_number", "number"), date: pick(po, "po_date", "date"),
          status: "Issued", vendor_id: String(pick(po, "vendor_id")), warehouse_id: String(pick(po, "warehouse_id")), items: [],
        }));
        if (active) setPurchaseOrders(normalized);
        if (editId) {
          const body = await asnApi(`/${encodeURIComponent(editId)}`);
          const a = body.data || body.asn || body;
          const itemRows = Array.isArray(a.items) ? a.items : [];
          const loaded: ASNFormState = {
            ...initialState,
            asn_id: String(a.asn_id || a.id || ""), asn_number: a.asn_number || "", asn_date: String(a.asn_date || "").slice(0,10), status: a.status || "Draft",
            po_id: String(a.po_id || ""), po_number: a.po_number || "", po_date: String(a.po_date || "").slice(0,10),
            vendor_id: String(a.vendor_id || ""), vendor_name: a.vendor_name || "", vendor_address: a.vendor_address || "", vendor_gstin: a.vendor_gstin || "", vendor_contact: a.vendor_contact || "", vendor_email: a.vendor_email || "",
            warehouse_id: String(a.warehouse_id || ""), warehouse_name: a.warehouse_name || "", warehouse_address: a.warehouse_address || "",
            shipment_date: String(a.shipment_date || "").slice(0,10), expected_arrival: String(a.expected_arrival || "").slice(0,10), delivery_schedule: a.delivery_schedule || "",
            transporter: a.transporter || "", vehicle_number: a.vehicle_number || "", lr_awb_number: a.lr_awb_number || "", shipping_reference: a.shipping_reference || "",
            package_count: a.package_count == null ? "" : String(a.package_count), pallet_count: a.pallet_count == null ? "" : String(a.pallet_count), total_weight: a.total_weight == null ? "" : String(a.total_weight), weight_uom: a.weight_uom || "",
            invoice_number: a.invoice_number || "", invoice_date: String(a.invoice_date || "").slice(0,10), eway_bill_number: a.eway_bill_number || "", packing_list_number: a.packing_list_number || "", packing_instructions: a.packing_instructions || "", remarks: a.remarks || "",
            items: itemRows.map((it: any) => ({ po_item_id: String(it.po_item_id || ""), item_id: it.item_id || "", description: it.item_description || it.description || "", uom: it.uom || "", ordered_qty: Number(it.ordered_qty || 0), previously_asn_qty: Number(it.previously_asn_qty || 0), delivery_date: String(it.delivery_date || "").slice(0,10), shipping_qty: Number(it.shipping_qty || 0) }))
          };
          if (active) {
            setForm(loaded);
            const attachmentRows = Array.isArray(a.attachments) ? a.attachments : [];
            setSavedAttachments(attachmentRows.map((item: any) => ({
              id: item.attachment_id ?? item.id,
              file_name: item.file_name || item.original_name || "Attachment",
              file_url: item.file_url || item.file_path || item.url || "",
              mime_type: item.mime_type || "",
              file_size: Number(item.file_size || item.size_bytes || 0),
              document_type: item.document_type || item.attachment_type || "Other",
              uploaded_at: item.uploaded_at || item.created_at || "",
            })));
            if (loaded.po_id && !normalized.some((p) => String(p.id).trim() === String(loaded.po_id).trim())) {
              setPurchaseOrders((prev) => [...prev, {
                id: loaded.po_id,
                number: loaded.po_number,
                date: loaded.po_date,
                status: "Issued",
                vendor_id: loaded.vendor_id,
                warehouse_id: loaded.warehouse_id,
                items: loaded.items,
              }]);
            }
          }
        }
      } catch (error: any) { if (active) setApiError(error.message || "Unable to load ASN data."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [editId]);

  /* =======================================================
     TOTALS
  ======================================================== */

  const totals = useMemo(() => {
    const ordered = form.items.reduce(
      (sum, item) =>
        sum + Number(item.ordered_qty || 0),
      0
    );

    const previous = form.items.reduce(
      (sum, item) =>
        sum +
        Number(item.previously_asn_qty || 0),
      0
    );

    const shipping = form.items.reduce(
      (sum, item) =>
        sum + Number(item.shipping_qty || 0),
      0
    );

    const remainingAfterASN =
      form.items.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            Number(item.ordered_qty || 0) -
              Number(item.previously_asn_qty || 0) -
              Number(item.shipping_qty || 0)
          ),
        0
      );

    const linesWithQty =
      form.items.filter(
        (item) =>
          Number(item.shipping_qty) > 0
      ).length;

    return {
      ordered,
      previous,
      shipping,
      remainingAfterASN,
      linesWithQty,
    };
  }, [form.items]);

  /* =======================================================
     FULL VALIDATION
  ======================================================== */

  const validateForm = (
    currentForm: ASNFormState
  ): ValidationErrors => {
    const result: ValidationErrors = {};

    /* -------------------------------------------------------
       ASN DATE
    ------------------------------------------------------- */

    if (!currentForm.asn_date) {
      result.asn_date =
        "ASN Date is required.";
    }

    /* -------------------------------------------------------
       PO
    ------------------------------------------------------- */

    if (
      ASN_RULES.requirePurchaseOrder &&
      !currentForm.po_id
    ) {
      result.po_id =
        "Purchase Order is required.";
    }

    if (currentForm.po_id) {
      const selectedPO =
        eligiblePurchaseOrders.find(
          (po) => String(po.id).trim() === String(currentForm.po_id).trim()
        );

      if (!selectedPO) {
        result.po_id =
          "Selected Purchase Order is invalid.";
      } else {
        if (
          selectedPO.status !== "Approved" &&
          selectedPO.status !== "Issued" &&
          selectedPO.status !== "Open"
        ) {
          result.po_id =
            "ASN can only be created against an eligible Purchase Order.";
        }

        const hasBalance =
          currentForm.items.some((item) =>
            Number(item.ordered_qty || 0) -
              Number(item.previously_asn_qty || 0) > 0
          );

        if (!hasBalance) {
          result.po_id =
            "Selected Purchase Order has no remaining quantity for ASN.";
        }
      }
    }

    /* -------------------------------------------------------
       SHIPMENT DATES
    ------------------------------------------------------- */

    if (
      ASN_RULES.requireShipmentDate &&
      !currentForm.shipment_date
    ) {
      result.shipment_date =
        "Shipment Date is required.";
    }

    if (
      ASN_RULES.requireExpectedArrival &&
      !currentForm.expected_arrival
    ) {
      result.expected_arrival =
        "Expected Arrival Date is required.";
    }

    if (
      currentForm.shipment_date &&
      currentForm.expected_arrival &&
      currentForm.expected_arrival <
        currentForm.shipment_date
    ) {
      result.expected_arrival =
        "Expected Arrival Date cannot be before Shipment Date.";
    }

    /* -------------------------------------------------------
       DELIVERY SCHEDULE
    ------------------------------------------------------- */

    if (
      ASN_RULES.requireDeliverySchedule &&
      !currentForm.delivery_schedule
    ) {
      result.delivery_schedule =
        "Delivery Schedule is required.";
    }

    /* -------------------------------------------------------
       VENDOR / WAREHOUSE
    ------------------------------------------------------- */

    if (
      currentForm.po_id &&
      ASN_RULES.vendorFromPOOnly
    ) {
      const selectedPO =
        eligiblePurchaseOrders.find(
          (po) => String(po.id).trim() === String(currentForm.po_id).trim()
        );

      if (
        selectedPO &&
        String(currentForm.vendor_id || "").trim() !==
          String(selectedPO.vendor_id || "").trim()
      ) {
        result.vendor_id =
          "Vendor must match the Purchase Order.";
      }
    }

    // if (
    //   currentForm.po_id &&
    //   ASN_RULES.warehouseFromPOOnly
    // ) {
    //   const selectedPO =
    //     eligiblePurchaseOrders.find(
    //       (po) => String(po.id).trim() === String(currentForm.po_id).trim()
    //     );

    //   if (
    //     selectedPO &&
    //     String(currentForm.warehouse_id || "").trim() !==
    //       String(selectedPO.warehouse_id || "").trim()
    //   ) {
    //     result.warehouse_id =
    //       "Warehouse must match the Purchase Order.";
    //   }
    // }

    /* -------------------------------------------------------
       ITEMS
    ------------------------------------------------------- */

    if (
      ASN_RULES.requireAtLeastOneItem &&
      currentForm.items.length === 0
    ) {
      result.items =
        "At least one PO item must be available for ASN.";
    }

    let validShippingLines = 0;

    currentForm.items.forEach(
      (item, index) => {
        const orderedQty =
          Number(item.ordered_qty) || 0;

        const previousASNQty =
          Number(item.previously_asn_qty) || 0;

        const shippingQty =
          Number(item.shipping_qty) || 0;

        const remainingQty =
          orderedQty - previousASNQty;

        const key =
          `item_${index}_shipping_qty`;

        /* Previous ASN cannot exceed PO */

        if (
          previousASNQty < 0
        ) {
          result[key] =
            "Previous ASN quantity cannot be negative.";
          return;
        }

        if (
          previousASNQty >
          orderedQty
        ) {
          result[key] =
            "Previous ASN quantity cannot exceed PO quantity.";
          return;
        }

        /* Ordered quantity */

        if (orderedQty <= 0) {
          result[key] =
            "PO quantity must be greater than zero.";
          return;
        }

        /* Shipping quantity */

        if (
          ASN_RULES.preventNegativeQuantity &&
          shippingQty < 0
        ) {
          result[key] =
            "Shipping quantity cannot be negative.";
          return;
        }

        if (
          ASN_RULES.preventZeroShippingQuantity &&
          shippingQty === 0
        ) {
          result[key] =
            "Shipping quantity must be greater than zero.";
          return;
        }

        /* Over shipment */

        if (
          ASN_RULES.preventOverShipment &&
          shippingQty > remainingQty
        ) {
          result[key] =
            `Shipping quantity cannot exceed remaining PO quantity of ${remainingQty}.`;
          return;
        }

        if (shippingQty > 0) {
          validShippingLines += 1;
        }
      }
    );

    if (
      currentForm.items.length > 0 &&
      validShippingLines === 0
    ) {
      result.items =
        "At least one item must have a valid Shipping Quantity.";
    }

    /* -------------------------------------------------------
       DELIVERY SCHEDULE RULE
    ------------------------------------------------------- */

    if (
      currentForm.delivery_schedule ===
        "Single" &&
      currentForm.items.length > 0
    ) {
      const hasUnshippedBalance =
        currentForm.items.some((item) => {
          const remaining =
            Number(item.ordered_qty) -
            Number(item.previously_asn_qty);

          const shipping =
            Number(item.shipping_qty);

          return shipping < remaining;
        });

      if (hasUnshippedBalance) {
        result.delivery_schedule =
          "Single delivery requires all remaining PO quantities to be included in this ASN. Use Partial for partial shipment.";
      }
    }

    if (
      currentForm.delivery_schedule ===
        "Partial" &&
      !ASN_RULES.allowPartialDelivery
    ) {
      result.delivery_schedule =
        "Partial delivery is not allowed by the current ASN business rules.";
    }

    /* -------------------------------------------------------
       PACKAGE COUNT
    ------------------------------------------------------- */

    if (
      currentForm.package_count.trim()
    ) {
      const packageCount =
        Number(currentForm.package_count);

      if (
        !Number.isInteger(packageCount) ||
        packageCount < 0
      ) {
        result.package_count =
          "Package Count must be a valid non-negative whole number.";
      }
    }

    /* -------------------------------------------------------
       PALLET COUNT
    ------------------------------------------------------- */

    if (
      currentForm.pallet_count.trim()
    ) {
      const palletCount =
        Number(currentForm.pallet_count);

      if (
        !Number.isInteger(palletCount) ||
        palletCount < 0
      ) {
        result.pallet_count =
          "Pallet Count must be a valid non-negative whole number.";
      }
    }

    /* -------------------------------------------------------
       WEIGHT
    ------------------------------------------------------- */

    if (
      currentForm.total_weight.trim()
    ) {
      const weight =
        Number(currentForm.total_weight);

      if (
        !Number.isFinite(weight) ||
        weight <= 0
      ) {
        result.total_weight =
          "Total Weight must be greater than zero.";
      }

      if (
        ASN_RULES.requireWeightUOMWhenWeightEntered &&
        !currentForm.weight_uom
      ) {
        result.weight_uom =
          "Weight UOM is required when Total Weight is entered.";
      }
    }

    /* -------------------------------------------------------
       INVOICE
    ------------------------------------------------------- */

    if (
      currentForm.invoice_date &&
      currentForm.invoice_date >
        todayISO()
    ) {
      result.invoice_date =
        "Invoice Date cannot be in the future.";
    }

    if (
      currentForm.invoice_date &&
      !currentForm.invoice_number.trim()
    ) {
      result.invoice_number =
        "Invoice Number is required when Invoice Date is entered.";
    }

    /* -------------------------------------------------------
       E-WAY BILL
    ------------------------------------------------------- */

    if (
      currentForm.eway_bill_number.trim() &&
      currentForm.eway_bill_number.trim()
        .length < 8
    ) {
      result.eway_bill_number =
        "Please enter a valid E-Way Bill reference.";
    }

    return result;
  };

  const errors = useMemo(
    () => validateForm(form),
    [form]
  );

  const hasErrors =
    Object.keys(errors).length > 0;

  /* =======================================================
     ERROR VISIBILITY
  ======================================================== */

  const shouldShowError = (
    key: string
  ) => {
    return Boolean(
      (touched[key] || submitAttempted) &&
        errors[key]
    );
  };

  /* =======================================================
     FIELD SETTER
  ======================================================== */

  const setField = <
    K extends keyof ASNFormState
  >(
    key: K,
    value: ASNFormState[K]
  ) => {
    if (isLocked || saving) return;

    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* =======================================================
     TOUCH FIELD
  ======================================================== */

  const touchField = (
    key: string
  ) => {
    setTouched((previous) => ({
      ...previous,
      [key]: true,
    }));
  };

  /* =======================================================
     TOUCH ALL FIELDS
  ======================================================== */

  const touchAllFields = () => {
    const nextTouched: Record<
      string,
      boolean
    > = {
      asn_date: true,
      po_id: true,
      shipment_date: true,
      expected_arrival: true,
      delivery_schedule: true,
      package_count: true,
      pallet_count: true,
      total_weight: true,
      weight_uom: true,
      invoice_number: true,
      invoice_date: true,
      eway_bill_number: true,
    };

    form.items.forEach((_, index) => {
      nextTouched[
        `item_${index}_shipping_qty`
      ] = true;
    });

    setTouched(nextTouched);
  };

  /* =======================================================
     SELECT PURCHASE ORDER
  ======================================================== */

  const selectPO = async (poId: string) => {
    if (isLocked || saving) return;
    if (!poId) {
      setForm((previous) => ({
        ...previous,
        po_id: "", po_number: "", po_date: "",
        vendor_id: "", vendor_name: "", vendor_address: "",
        vendor_gstin: "", vendor_contact: "", vendor_email: "",
        warehouse_id: "", warehouse_name: "", warehouse_address: "",
        items: [],
      }));
      return;
    }

    setApiError("");
    try {
      const detailBody = await asnApi(`/purchase-orders/${encodeURIComponent(poId)}`);
      const detailRoot = detailBody?.data ?? detailBody;
      const rawPO = detailRoot?.purchase_order ?? detailRoot?.po ?? detailRoot;
      const vendor = detailRoot?.vendor ?? rawPO?.vendor ?? {};
      const warehouse = detailRoot?.warehouse ?? rawPO?.warehouse ?? {};
      const rawItems = Array.isArray(detailRoot?.items)
        ? detailRoot.items
        : Array.isArray(rawPO?.items) ? rawPO.items : [];
      const basePO = eligiblePurchaseOrders.find((item) => String(item.id).trim() === String(poId).trim());

      const vendorAddress = [
        pick(rawPO, "vendor_address", "supplier_address", "master_registered_address"),
        pick(rawPO, "master_vendor_city", "vendor_city"),
        pick(rawPO, "master_vendor_state", "vendor_state"),
        pick(rawPO, "master_vendor_country", "vendor_country"),
        pick(rawPO, "master_vendor_postal_code", "vendor_postal_code"),
      ].filter(Boolean).join(", ");
      const warehouseAddress = [
        pick(rawPO, "warehouse_address", "delivery_address", "master_warehouse_address"),
        pick(rawPO, "master_warehouse_city", "warehouse_city"),
        pick(rawPO, "master_warehouse_state", "warehouse_state"),
        pick(rawPO, "master_warehouse_pincode", "warehouse_pincode", "pincode"),
      ].filter(Boolean).join(", ");

      const mappedItems: ASNItem[] = rawItems.map((it: any) => {
        const ordered = Number(pick(it, "ordered_qty", "qty", "quantity") || 0);
        const previous = Number(pick(it, "previously_asn_qty", "previous_asn_qty") || 0);
        return {
          po_item_id: String(pick(it, "po_item_id", "id") || ""),
          item_id: String(pick(it, "item_id", "item_code", "sku") || ""),
          description: String(pick(it, "item_description", "description", "item_name", "product_name") || ""),
          uom: String(pick(it, "uom", "uom_code", "unit") || ""),
          ordered_qty: ordered,
          previously_asn_qty: previous,
          delivery_date: String(pick(it, "delivery_date", "expected_delivery_date") || "").slice(0, 10),
          shipping_qty: 0,
        };
      }).filter((item: ASNItem) => item.po_item_id && item.ordered_qty > item.previously_asn_qty);

      const vendorId = String(pick(rawPO, "vendor_id", "master_vendor_id") || pick(vendor, "id", "vendor_id") || basePO?.vendor_id || "");
      const warehouseId = String(pick(rawPO, "warehouse_id", "master_warehouse_id") || pick(warehouse, "warehouse_id", "id") || basePO?.warehouse_id || "");
      const vendorName = String(pick(rawPO, "vendor_name", "master_vendor_name", "supplier_name") || pick(vendor, "vendor_name", "name") || "");
      const vendorContact = String(pick(rawPO, "vendor_contact", "vendor_contact_person") || [pick(rawPO, "master_contact_person_name"), pick(rawPO, "master_contact_phone")].filter(Boolean).join(" / ") || pick(vendor, "contact_person_name", "contact_person", "contact_phone") || "");
      const vendorEmail = String(pick(rawPO, "vendor_email", "master_contact_email") || pick(vendor, "contact_email", "email", "email_id") || "");
      const vendorGSTIN = String(pick(rawPO, "vendor_gstin", "gstin", "master_vendor_gstin") || pick(vendor, "gstin", "gst_number") || "");
      const warehouseName = String(pick(rawPO, "warehouse_name", "master_warehouse_name") || pick(warehouse, "warehouse_name", "name") || pick(rawPO, "delivery_warehouse") || "");

      setForm((previous) => ({
        ...previous,
        po_id: String(pick(rawPO, "po_id", "id") || poId),
        po_number: String(pick(rawPO, "po_number", "number") || basePO?.number || ""),
        po_date: String(pick(rawPO, "po_date", "date") || basePO?.date || "").slice(0, 10),
        vendor_id: vendorId,
        vendor_name: vendorName,
        vendor_address: vendorAddress || String(pick(vendor, "registered_address", "address") || ""),
        vendor_gstin: vendorGSTIN,
        vendor_contact: vendorContact,
        vendor_email: vendorEmail,
        warehouse_id: warehouseId,
        warehouse_name: warehouseName,
        warehouse_address: warehouseAddress || String(pick(warehouse, "address_line1", "address") || ""),
        items: mappedItems,
      }));
      if (!mappedItems.length) setApiError("Selected Purchase Order has no remaining eligible item quantity for ASN.");
    } catch (error: any) {
      setApiError(error.message || "Unable to load complete Purchase Order details.");
    }
  };

  const addAttachmentFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted = Array.from(fileList);
    const invalid = accepted.find((file) => file.size > 10 * 1024 * 1024);
    if (invalid) {
      setApiError(`File ${invalid.name} exceeds the 10 MB limit.`);
      return;
    }
    setPendingAttachments((current) => [...current, ...accepted]);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((current) => current.filter((_, i) => i !== index));
  };

  
const deleteSavedAttachment = async (file: ASNAttachment) => {
  const attachmentId = file.attachment_id || file.id;

  if (!editId || !attachmentId || attachmentBusy || isLocked) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete "${file.file_name}"?`
  );

  if (!confirmed) return;

  setAttachmentBusy(true);
  setApiError("");

  try {
    const response = await asnApi(
      `/${encodeURIComponent(editId)}/attachments/${encodeURIComponent(String(attachmentId))}`,
      { method: "DELETE" }
    );

    if (response?.success !== true) {
      throw new Error(
        response?.message || "Attachment deletion was not confirmed by server."
      );
    }

    // Remove deleted file from frontend state
    setSavedAttachments((current) =>
      current.filter(
        (attachment) =>
          String(attachment.attachment_id || attachment.id) !==
          String(attachmentId)
      )
    );

    alert("Attachment deleted successfully.");
  } catch (error: any) {
    setApiError(error.message || "Unable to delete attachment.");
  } finally {
    setAttachmentBusy(false);
  }
};


  const uploadPendingAttachments = async (asnId: string) => {
    if (!pendingAttachments.length) return;
    setAttachmentBusy(true);
    try {
      for (const file of pendingAttachments) {
        const data = new FormData();
        data.append("file", file);
        data.append("document_type", "Shipment Document");
        await asnApi(`/${encodeURIComponent(asnId)}/attachments`, { method: "POST", body: data });
      }
      setPendingAttachments([]);
      const detail = await asnApi(`/${encodeURIComponent(asnId)}`);
      const record = detail.data ?? detail.asn ?? detail;
      setSavedAttachments(Array.isArray(record.attachments) ? record.attachments : []);
    } finally {
      setAttachmentBusy(false);
    }
  };

  /* =======================================================
     UPDATE ITEM SHIPPING QTY
  ======================================================== */

  const updateItemShippingQty = (
    index: number,
    value: string
  ) => {
    if (isLocked || saving) return;

    const parsed =
      value === ""
        ? 0
        : Number(value);

    const safeValue =
      Number.isFinite(parsed)
        ? parsed
        : 0;

    setForm((previous) => {
      const nextItems = [
        ...previous.items,
      ];

      nextItems[index] = {
        ...nextItems[index],
        shipping_qty: safeValue,
      };

      return {
        ...previous,
        items: nextItems,
      };
    });

    touchField(
      `item_${index}_shipping_qty`
    );
  };

  /* =======================================================
     RESET
  ======================================================== */

  const resetForm = () => {
    if (isLocked || saving) return;

    setForm({
      ...initialState,
      asn_date: todayISO(),
      shipment_date: todayISO(),
      expected_arrival: addDaysISO(3),
    });

    setTouched({});
    setSubmitAttempted(false);
  };

  /* =======================================================
     SAVE DRAFT
     
     Draft rule:
     - PO is mandatory
     - Draft may still contain incomplete shipment details
  ======================================================== */

  const saveDraft = async () => {
    if (isLocked || saving || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    const draftErrors: ValidationErrors =
      {};

    if (
      ASN_RULES.requirePurchaseOrder &&
      !form.po_id
    ) {
      draftErrors.po_id =
        "Purchase Order is required before saving ASN draft.";
    }

    const selectedDraftPO = eligiblePurchaseOrders.find(
      (po) => String(po.id).trim() === String(form.po_id).trim()
    );

    if (form.po_id && !selectedDraftPO) {
      draftErrors.po_id =
        "Selected Purchase Order is not available or is no longer eligible. Refresh the page and select an eligible PO.";
    }

    if (
      form.po_id &&
      (!form.items.length ||
        !form.items.some((item) =>
          Number(item.ordered_qty || 0) -
            Number(item.previously_asn_qty || 0) > 0
        ))
    ) {
      draftErrors.items =
        "Selected Purchase Order does not contain an eligible item balance.";
    }

    // Draft quantities must stay within each PO line's remaining allocation.
    form.items.forEach((item, index) => {
      const ordered = Number(item.ordered_qty || 0);
      const alreadyAllocated = Number(item.previously_asn_qty || 0);
      const newASNQty = Number(item.shipping_qty || 0);
      const remaining = Math.max(0, ordered - alreadyAllocated);
      if (newASNQty < 0 || newASNQty > remaining) {
        draftErrors[`item_${index}_shipping_qty`] =
          `ASN quantity for ${item.description || `PO line ${index + 1}`} cannot exceed remaining PO quantity (${remaining}).`;
      }
    });

    if (
      Object.keys(draftErrors).length > 0
    ) {
      setTouched({
        po_id: true,
      });

      alert(Object.values(draftErrors)[0]);
      savingRef.current = false;
      setSaving(false);
      return;
    }

    const draftPayload = buildPayload(form);
    setApiError("");
    try {
      const body = editId
        ? await asnApi(`/${encodeURIComponent(editId)}`, { method: "PUT", body: JSON.stringify(draftPayload) })
        : await asnApi("", { method: "POST", body: JSON.stringify(draftPayload) });
      const savedRecord = body.data?.asn || body.data || body.asn || body;
      const savedId = String(savedRecord.id || savedRecord.asn_id || savedRecord.asn_number || editId || "");
      if (!savedId) throw new Error("Draft saved response did not include an ASN identifier.");
      if (pendingAttachments.length) await uploadPendingAttachments(savedId);
      alert(body.message || "ASN Draft saved successfully.");
      router.push("/asn/list"); router.refresh();
    } catch (error: any) { setApiError(error.message || "Unable to save ASN draft."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  /* =======================================================
     SUBMIT ASN
  ======================================================== */

  const submitASN = async () => {
    if (isLocked || saving || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    setSubmitAttempted(true);
    touchAllFields();

    const currentErrors =
      validateForm(form);

    if (
      Object.keys(currentErrors).length >
      0
    ) {
      alert(
        "Please fix all validation errors before submitting the ASN."
      );
      savingRef.current = false;
      setSaving(false);
      return;
    }

    setApiError("");
    try {
      const payload = buildPayload(form);
      let saved: any;
      if (editId) saved = await asnApi(`/${encodeURIComponent(editId)}`, { method: "PUT", body: JSON.stringify(payload) });
      else saved = await asnApi("", { method: "POST", body: JSON.stringify(payload) });
      const savedRecord = saved.data?.asn || saved.data || saved.asn || saved;
      const savedId = savedRecord.id || savedRecord.asn_id || savedRecord.asn_number || editId;
      if (!savedId) throw new Error("ASN saved, but server did not return its database ID.");
      if (pendingAttachments.length) await uploadPendingAttachments(String(savedId));
      const submitted = await asnApi(`/${encodeURIComponent(String(savedId))}/submit`, { method: "POST", body: JSON.stringify({ remarks: form.remarks }) });
      alert(submitted.message || "ASN submitted successfully.");
      router.push("/asn/list"); router.refresh();
    } catch (error: any) { setApiError(error.message || "Unable to submit ASN."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="w-full min-w-0 max-w-[100vw] space-y-6 overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Advance Shipping Notice (ASN)"
      />
      {apiError && <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{apiError}</div>}
      {loading && <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-500">Loading ASN and Purchase Order data...</div>}

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="h-8 w-1 rounded-full"
                style={{
                  backgroundColor:
                    FORTUNA_PRIMARY_RED,
                }}
              />

              <h3
                className="text-lg font-bold"
                style={{
                  color:
                    FORTUNA_PRIMARY_RED,
                }}
              >
                {viewMode ? "View ASN" : editId ? "Edit ASN" : "Create ASN"}
              </h3>

              <span
                className={statusPill(
                  form.status
                )}
              >
                {form.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {viewMode ? "Viewing saved Advance Shipping Notice details. All fields are read-only." : "Create an Advance Shipping Notice against an eligible Purchase Order."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/asn/list"
              className={outlineBtn}
            >
              ← ASN List
            </Link>

            {!viewMode && <button
              type="button"
              onClick={resetForm}
              disabled={isLocked || saving}
              className={classNames(
                outlineBtn,
                (isLocked || saving) &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              Reset
            </button>}

            {!viewMode && <button
              type="button"
              onClick={saveDraft}
              disabled={isLocked || saving}
              className={classNames(
                primaryBtn,
                (isLocked || saving) &&
                  "cursor-not-allowed opacity-50"
              )}
              style={{
                backgroundColor:
                  FORTUNA_SECONDARY_BLUE,
              }}
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>}

            {!viewMode && <button
              type="button"
              onClick={submitASN}
              disabled={isLocked || saving}
              className={classNames(
                primaryBtn,
                (isLocked || saving) &&
                  "cursor-not-allowed opacity-50"
              )}
              style={{
                backgroundColor:
                  FORTUNA_PRIMARY_RED,
              }}
            >
              {saving ? "Processing..." : "Submit ASN"}
            </button>}
          </div>
        </div>
      </div>

      {/* =====================================================
          PROCESS FLOW
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2">
          <FlowStep
            label="Purchase Order"
            active={Boolean(form.po_id)}
          />

          <FlowArrow />

          <FlowStep
            label="ASN"
            active={
              Boolean(form.po_id) ||
              form.status !== "Draft"
            }
          />

          <FlowArrow />

          <FlowStep
            label="Goods Inward"
            active={false}
          />

          <FlowArrow />

          <FlowStep
            label="GRN"
            active={false}
          />

          <FlowArrow />

          <FlowStep
            label="Putaway"
            active={false}
          />
        </div>
      </div>

      {/* =====================================================
          ASN BASIC INFORMATION
      ====================================================== */}

      <Section
        title="ASN Basic Information"
        subtitle="System-generated ASN details and Purchase Order reference."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <ReadOnlyField
            label="ASN ID"
            value={form.asn_id}
          />

          <ReadOnlyField
            label="ASN Number"
            value={form.asn_number}
          />

          <div>
            <label className={labelBase}>
              ASN Date{" "}
              <Required />
            </label>

            <input
              type="date"
              value={form.asn_date}
              disabled={isLocked}
              onChange={(event) =>
                setField(
                  "asn_date",
                  event.target.value
                )
              }
              onBlur={() =>
                touchField("asn_date")
              }
              className={classNames(
                inputBase,
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                shouldShowError(
                  "asn_date"
                ) &&
                  "border-red-500"
              )}
            />

            {shouldShowError(
              "asn_date"
            ) && (
              <ErrorText
                message={errors.asn_date}
              />
            )}
          </div>

          <ReadOnlyField
            label="Status"
            value={form.status}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelBase}>
              Purchase Order{" "}
              <Required />
            </label>

            <select
              value={form.po_id}
              disabled={isLocked}
              onChange={(event) =>
                selectPO(
                  event.target.value
                )
              }
              onBlur={() =>
                touchField("po_id")
              }
              className={classNames(
                inputBase,
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                shouldShowError(
                  "po_id"
                ) &&
                  "border-red-500"
              )}
            >
              <option value="">
                Select Purchase Order
              </option>

              {eligiblePurchaseOrders.map(
                (po) => (
                  <option
                    key={po.id}
                    value={po.id}
                  >
                    {po.number} •{" "}
                    {po.status} •{" "}
                    {formatDate(po.date)}
                  </option>
                )
              )}
            </select>

            {shouldShowError(
              "po_id"
            ) && (
              <ErrorText
                message={errors.po_id}
              />
            )}

            <p className="mt-1 text-xs text-gray-500">
              Only eligible Purchase Orders with remaining quantity are shown.
            </p>
          </div>

          <ReadOnlyField
            label="PO Date"
            value={
              form.po_date
                ? formatDate(
                    form.po_date
                  )
                : "—"
            }
          />
        </div>
      </Section>

      {/* =====================================================
          VENDOR + WAREHOUSE
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Vendor Details"
          subtitle="Vendor information is inherited from the Purchase Order."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField
              label="Vendor ID"
              value={form.vendor_id}
            />

            <ReadOnlyField
              label="Vendor Name"
              value={form.vendor_name}
            />

            <ReadOnlyField
              label="GSTIN"
              value={form.vendor_gstin}
            />

            <ReadOnlyField
              label="Contact Person"
              value={form.vendor_contact}
            />

            <ReadOnlyField
              label="Vendor Email"
              value={form.vendor_email}
            />

            <ReadOnlyField
              label="Vendor Address"
              value={form.vendor_address}
              full
            />
          </div>

          {shouldShowError(
            "vendor_id"
          ) && (
            <ErrorText
              message={errors.vendor_id}
            />
          )}
        </Section>

        <Section
          title="Delivery Warehouse"
          subtitle="Warehouse is inherited from the Purchase Order."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField
              label="Warehouse ID"
              value={form.warehouse_id}
            />

            <ReadOnlyField
              label="Warehouse Name"
              value={form.warehouse_name}
            />

            <ReadOnlyField
              label="Delivery Address"
              value={
                form.warehouse_address
              }
              full
            />
          </div>

          {shouldShowError(
            "warehouse_id"
          ) && (
            <ErrorText
              message={errors.warehouse_id}
            />
          )}
        </Section>
      </div>

      {/* =====================================================
          SHIPMENT & LOGISTICS
      ====================================================== */}

      <Section
        title="Shipment & Logistics"
        subtitle="Supplier-confirmed shipment information."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DateField
            label="Shipment Date"
            required
            value={form.shipment_date}
            disabled={isLocked}
            error={
              shouldShowError(
                "shipment_date"
              )
                ? errors.shipment_date
                : ""
            }
            onChange={(value) =>
              setField(
                "shipment_date",
                value
              )
            }
            onBlur={() =>
              touchField(
                "shipment_date"
              )
            }
          />

          <DateField
            label="Expected Arrival Date"
            required
            value={
              form.expected_arrival
            }
            disabled={isLocked}
            error={
              shouldShowError(
                "expected_arrival"
              )
                ? errors.expected_arrival
                : ""
            }
            onChange={(value) =>
              setField(
                "expected_arrival",
                value
              )
            }
            onBlur={() =>
              touchField(
                "expected_arrival"
              )
            }
          />

          <div>
            <label className={labelBase}>
              Delivery Schedule{" "}
              <Required />
            </label>

            <select
              value={
                form.delivery_schedule
              }
              disabled={isLocked}
              onChange={(event) =>
                setField(
                  "delivery_schedule",
                  event.target.value as DeliverySchedule
                )
              }
              onBlur={() =>
                touchField(
                  "delivery_schedule"
                )
              }
              className={classNames(
                inputBase,
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                shouldShowError(
                  "delivery_schedule"
                ) &&
                  "border-red-500"
              )}
            >
              <option value="">
                Select
              </option>

              <option value="Single">
                Single
              </option>

              <option value="Partial">
                Partial
              </option>
            </select>

            {shouldShowError(
              "delivery_schedule"
            ) && (
              <ErrorText
                message={
                  errors.delivery_schedule
                }
              />
            )}
          </div>

          <EditableField
            label="Transporter"
            value={form.transporter}
            disabled={isLocked}
            placeholder="Transporter name"
            onChange={(value) =>
              setField(
                "transporter",
                value
              )
            }
          />

          <EditableField
            label="Vehicle Number"
            value={form.vehicle_number}
            disabled={isLocked}
            placeholder="Example: AP31AB1234"
            onChange={(value) =>
              setField(
                "vehicle_number",
                value.toUpperCase()
              )
            }
          />

          <EditableField
            label="LR / AWB Number"
            value={
              form.lr_awb_number
            }
            disabled={isLocked}
            placeholder="LR / Air Waybill"
            onChange={(value) =>
              setField(
                "lr_awb_number",
                value
              )
            }
          />

          <EditableField
            label="Shipping Reference"
            value={
              form.shipping_reference
            }
            disabled={isLocked}
            placeholder="Supplier shipment reference"
            onChange={(value) =>
              setField(
                "shipping_reference",
                value
              )
            }
          />
        </div>
      </Section>

      {/* =====================================================
          ASN ITEMS
      ====================================================== */}

      <Section
        title="ASN Item Details"
        subtitle="Shipping quantity must not exceed the remaining Purchase Order quantity."
      >
        {shouldShowError("items") && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-300">
            {errors.items}
          </div>
        )}

        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-[1050px] w-full text-sm">
            <thead>
              <tr
                className="text-white"
                style={{
                  backgroundColor:
                    FORTUNA_PRIMARY_RED,
                }}
              >
                <th className="px-4 py-3 text-left font-semibold">
                  Item
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  UOM
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  PO Qty
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Previous ASN
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Balance
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Shipping Qty *
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Expected Delivery
                </th>
              </tr>
            </thead>

            <tbody>
              {form.items.map(
                (item, index) => {
                  const ordered =
                    Number(
                      item.ordered_qty
                    ) || 0;

                  const previous =
                    Number(
                      item.previously_asn_qty
                    ) || 0;

                  const balance =
                    Math.max(
                      0,
                      ordered -
                        previous
                    );

                  const itemErrorKey =
                    `item_${index}_shipping_qty`;

                  const itemError =
                    shouldShowError(
                      itemErrorKey
                    );

                  return (
                    <tr
                      key={
                        item.po_item_id
                      }
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {
                            item.description
                          }
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {item.item_id}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {item.uom}
                      </td>

                      <td className="px-4 py-4 text-right font-medium">
                        {ordered.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {previous.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td
                        className="px-4 py-4 text-right font-bold"
                        style={{
                          color:
                            FORTUNA_SECONDARY_BLUE,
                        }}
                      >
                        {balance.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          max={balance}
                          step="0.001"
                          value={
                            item.shipping_qty
                          }
                          disabled={isLocked}
                          onChange={(event) =>
                            updateItemShippingQty(
                              index,
                              event.target.value
                            )
                          }
                          className={classNames(
                            inputBase,
                            "min-w-[150px] text-right",
                            isLocked &&
                              "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                            itemError &&
                              "border-red-500"
                          )}
                        />

                        <div className="mt-1 text-right text-[11px] text-gray-500">
                          Max:{" "}
                          {balance.toLocaleString(
                            "en-IN"
                          )}
                        </div>

                        {itemError && (
                          <p className="mt-1 text-xs text-red-500">
                            {
                              errors[
                                itemErrorKey
                              ]
                            }
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDate(
                          item.delivery_date
                        )}
                      </td>
                    </tr>
                  );
                }
              )}

              {form.items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Select a Purchase Order to load eligible PO items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Item summary */}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricBox
            label="PO Quantity"
            value={totals.ordered.toLocaleString(
              "en-IN"
            )}
          />

          <MetricBox
            label="Previous ASN Quantity"
            value={totals.previous.toLocaleString(
              "en-IN"
            )}
          />

          <MetricBox
            label="Current Shipping Quantity"
            value={totals.shipping.toLocaleString(
              "en-IN"
            )}
            accent={FORTUNA_PRIMARY_RED}
          />

          <MetricBox
            label="Remaining After ASN"
            value={totals.remainingAfterASN.toLocaleString(
              "en-IN"
            )}
            accent={
              FORTUNA_SECONDARY_BLUE
            }
          />
        </div>

        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-500/10 dark:text-blue-200">
          <span className="font-semibold">
            ASN Business Rule:
          </span>{" "}
          Current Shipping Quantity cannot exceed the remaining PO quantity after previous ASN quantities.
        </div>
      </Section>

      {/* =====================================================
          PACKAGING & WEIGHT
      ====================================================== */}

      <Section
        title="Packaging & Weight"
        subtitle="Shipment-level packaging and weight information."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <EditableField
              label="Package Count"
              value={
                form.package_count
              }
              disabled={isLocked}
              placeholder="Example: 25"
              onChange={(value) =>
                setField(
                  "package_count",
                  value.replace(
                    /[^\d]/g,
                    ""
                  )
                )
              }
            />

            {shouldShowError(
              "package_count"
            ) && (
              <ErrorText
                message={
                  errors.package_count
                }
              />
            )}
          </div>

          <div>
            <EditableField
              label="Pallet Count"
              value={
                form.pallet_count
              }
              disabled={isLocked}
              placeholder="Example: 4"
              onChange={(value) =>
                setField(
                  "pallet_count",
                  value.replace(
                    /[^\d]/g,
                    ""
                  )
                )
              }
            />

            {shouldShowError(
              "pallet_count"
            ) && (
              <ErrorText
                message={
                  errors.pallet_count
                }
              />
            )}
          </div>

          <div>
            <label className={labelBase}>
              Total Weight
            </label>

            <input
              value={form.total_weight}
              disabled={isLocked}
              placeholder="Example: 1250"
              onChange={(event) =>
                setField(
                  "total_weight",
                  event.target.value
                )
              }
              onBlur={() =>
                touchField(
                  "total_weight"
                )
              }
              className={classNames(
                inputBase,
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                shouldShowError(
                  "total_weight"
                ) &&
                  "border-red-500"
              )}
            />

            {shouldShowError(
              "total_weight"
            ) && (
              <ErrorText
                message={
                  errors.total_weight
                }
              />
            )}
          </div>

          <div>
            <label className={labelBase}>
              Weight UOM
            </label>

            <select
              value={form.weight_uom}
              disabled={isLocked}
              onChange={(event) =>
                setField(
                  "weight_uom",
                  event.target.value as WeightUOM
                )
              }
              onBlur={() =>
                touchField(
                  "weight_uom"
                )
              }
              className={classNames(
                inputBase,
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                shouldShowError(
                  "weight_uom"
                ) &&
                  "border-red-500"
              )}
            >
              <option value="">
                Select
              </option>

              <option value="KG">
                KG
              </option>

              <option value="TON">
                TON
              </option>

              <option value="LB">
                LB
              </option>
            </select>

            {shouldShowError(
              "weight_uom"
            ) && (
              <ErrorText
                message={
                  errors.weight_uom
                }
              />
            )}
          </div>
        </div>
      </Section>

      {/* =====================================================
          SHIPMENT DOCUMENTS
      ====================================================== */}

      <Section
        title="Shipment Documents"
        subtitle="Supplier shipment and commercial reference documents."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <EditableField
              label="Invoice Number"
              value={
                form.invoice_number
              }
              disabled={isLocked}
              placeholder="Supplier invoice number"
              onChange={(value) =>
                setField(
                  "invoice_number",
                  value
                )
              }
            />

            {shouldShowError(
              "invoice_number"
            ) && (
              <ErrorText
                message={
                  errors.invoice_number
                }
              />
            )}
          </div>

          <div>
            <label className={labelBase}>
              Invoice Date
            </label>

            <input
              type="date"
              value={
                form.invoice_date
              }
              disabled={isLocked}
              onChange={(event) =>
                setField(
                  "invoice_date",
                  event.target.value
                )
              }
              onBlur={() =>
                touchField(
                  "invoice_date"
                )
              }
              className={classNames(
                inputBase,
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                shouldShowError(
                  "invoice_date"
                ) &&
                  "border-red-500"
              )}
            />

            {shouldShowError(
              "invoice_date"
            ) && (
              <ErrorText
                message={
                  errors.invoice_date
                }
              />
            )}
          </div>

          <div>
            <EditableField
              label="E-Way Bill Number"
              value={
                form.eway_bill_number
              }
              disabled={isLocked}
              placeholder="E-Way Bill"
              onChange={(value) =>
                setField(
                  "eway_bill_number",
                  value
                )
              }
            />

            {shouldShowError(
              "eway_bill_number"
            ) && (
              <ErrorText
                message={
                  errors.eway_bill_number
                }
              />
            )}
          </div>

          <EditableField
            label="Packing List Number"
            value={
              form.packing_list_number
            }
            disabled={isLocked}
            placeholder="Packing list reference"
            onChange={(value) =>
              setField(
                "packing_list_number",
                value
              )
            }
          />
        </div>

            {/* =====================================================
    ASN ATTACHMENTS
====================================================== */}

<div className="mt-5 rounded-xl border-2 border-dashed border-gray-200 p-5 dark:border-gray-800">

  {/* Header + Add Button */}
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        ASN Attachments
      </div>

      <p className="mt-1 text-xs text-gray-500">
        Upload Invoice, Packing List, E-Way Bill and other shipment documents.
        Maximum 10 MB per file.
      </p>
    </div>

    <div>
      <input
        ref={attachmentInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx"
        disabled={isLocked || attachmentBusy}
        onChange={(event) => addAttachmentFiles(event.target.files)}
      />

      <button
        type="button"
        disabled={isLocked || attachmentBusy}
        className={classNames(
          outlineBtn,
          "whitespace-nowrap",
          (isLocked || attachmentBusy) && "cursor-not-allowed opacity-50"
        )}
        onClick={() => attachmentInputRef.current?.click()}
      >
        + Add Attachment
      </button>
    </div>
  </div>

  {/* Pending Files */}
  {!viewMode && pendingAttachments.length > 0 && (
    <div className="mt-4 space-y-2">
      <div className="text-xs font-semibold text-gray-600">
        Pending Upload ({pendingAttachments.length})
      </div>

      {pendingAttachments.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5"
        >
          <span className="min-w-0 truncate">
            {file.name}
            <span className="ml-2 text-xs text-gray-500">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </span>

          <button
            type="button"
            disabled={attachmentBusy || isLocked}
            onClick={() => removePendingAttachment(index)}
            className="text-xs font-semibold text-red-600 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Saved Files */}
  {savedAttachments.length > 0 && (
    <div className="mt-4 space-y-2">
      <div className="text-xs font-semibold text-gray-600">
        Uploaded Attachments ({savedAttachments.length})
      </div>

      {savedAttachments.map((file) => (
        <div
          key={String(file.attachment_id || file.id)}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-3 text-sm dark:border-gray-800"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-gray-800 dark:text-gray-200">
              {file.file_name}
            </div>

            {file.file_size && (
              <div className="mt-1 text-xs text-gray-500">
                {(file.file_size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {file.file_url && (
              <>
                {/* VIEW */}
                <a
                  href={getAttachmentUrl(file.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  View
                </a>

                {/* DOWNLOAD */}
                <a
                  href={getAttachmentUrl(file.file_url)}
                  download={file.file_name}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                >
                  Download
                </a>
              </>
            )}

            {/* DELETE */}
            {!isLocked && (
              <button
                type="button"
                disabled={attachmentBusy}
                onClick={() => deleteSavedAttachment(file)}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )}

  {/* Empty State */}
  {savedAttachments.length === 0 && pendingAttachments.length === 0 && (
    <div className="mt-4 rounded-lg bg-gray-50 px-4 py-5 text-center dark:bg-white/5">
      <p className="text-sm text-gray-500">
        No attachments uploaded yet.
      </p>
      {!isLocked && (
        <p className="mt-1 text-xs text-gray-400">
          Click Add Attachment to upload shipment documents.
        </p>
      )}
    </div>
  )}

  {/* Upload Status */}
  {attachmentBusy && (
    <p className="mt-3 text-xs font-medium text-blue-700">
      Uploading attachments...
    </p>
  )}

  {/* New ASN Information */}
  {!viewMode && !editId && pendingAttachments.length === 0 && (
    <p className="mt-3 text-xs text-gray-500">
      Selected files will be uploaded when you Save Draft or Submit the ASN.
    </p>
  )}

</div>

      </Section>

      {/* =====================================================
          INSTRUCTIONS
      ====================================================== */}

      <Section
        title="Packing Instructions & Remarks"
        subtitle="Additional supplier shipment information."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <label className={labelBase}>
              Packing Instructions
            </label>

            <textarea
              value={
                form.packing_instructions
              }
              disabled={isLocked}
              onChange={(event) =>
                setField(
                  "packing_instructions",
                  event.target.value
                )
              }
              placeholder="Special packing, handling or unloading instructions"
              className={classNames(
                inputBase,
                "min-h-[120px] resize-y",
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5"
              )}
            />
          </div>

          <div>
            <label className={labelBase}>
              Remarks
            </label>

            <textarea
              value={form.remarks}
              disabled={isLocked}
              onChange={(event) =>
                setField(
                  "remarks",
                  event.target.value
                )
              }
              placeholder="Additional shipment remarks"
              className={classNames(
                inputBase,
                "min-h-[120px] resize-y",
                isLocked &&
                  "cursor-not-allowed bg-gray-50 dark:bg-white/5"
              )}
            />
          </div>
        </div>
      </Section>

      {/* =====================================================
          BUSINESS RULE SUMMARY
      ====================================================== */}

      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: `${FORTUNA_SECONDARY_BLUE}30`,
          backgroundColor: `${FORTUNA_SECONDARY_BLUE}05`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{
              backgroundColor:
                FORTUNA_SECONDARY_BLUE,
            }}
          >
            i
          </div>

          <div>
            <h4
              className="font-semibold"
              style={{
                color:
                  FORTUNA_SECONDARY_BLUE,
              }}
            >
              ASN Business Rules
            </h4>

            <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
              <li>
                • ASN must always reference an eligible Purchase Order.
              </li>

              <li>
                • Vendor and Warehouse are inherited from the Purchase Order and cannot be changed.
              </li>

              <li>
                • Multiple ASNs are allowed for Partial deliveries.
              </li>

              <li>
                • Shipping Quantity cannot exceed the remaining PO quantity.
              </li>

              <li>
                • ASN does not require Approval, Accept or Reject workflow.
              </li>

              <li>
                • Submitted ASN becomes read-only.
              </li>

              <li>
                • Goods Inward will consume ASN information after shipment arrival.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY + BOTTOM ACTIONS
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4
              className="font-semibold"
              style={{
                color:
                  FORTUNA_PRIMARY_RED,
              }}
            >
              ASN Summary
            </h4>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review shipment information before submitting the ASN.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryValue
              label="PO"
              value={
                form.po_number || "—"
              }
            />

            <SummaryValue
              label="Items"
              value={String(
                form.items.length
              )}
            />

            <SummaryValue
              label="Shipping Qty"
              value={totals.shipping.toLocaleString(
                "en-IN"
              )}
            />

            <SummaryValue
              label="Remaining"
              value={totals.remainingAfterASN.toLocaleString(
                "en-IN"
              )}
            />
          </div>
        </div>

        {/* Validation status */}

        <div className="mt-5">
          {!viewMode && submitAttempted &&
          hasErrors ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-300">
              <span className="font-semibold">
                ASN cannot be submitted.
              </span>{" "}
              Please correct the highlighted validation errors above.
            </div>
          ) : viewMode ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
              View mode — saved ASN details are displayed without editing.
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-500/10 dark:text-green-300">
              ASN is ready for review. Submit only after confirming shipment details.
            </div>
          )}
        </div>

        {/* Bottom Actions */}

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-5 dark:border-gray-800">
          <Link
            href="/asn/list"
            className={outlineBtn}
          >
            {viewMode ? "← Back to ASN List" : "Cancel"}
          </Link>

          {!viewMode && <button
            type="button"
            onClick={saveDraft}
            disabled={isLocked || saving}
            className={classNames(
              primaryBtn,
              (isLocked || saving) &&
                "cursor-not-allowed opacity-50"
            )}
            style={{
              backgroundColor:
                FORTUNA_SECONDARY_BLUE,
            }}
          >
            Save Draft
          </button>}

          {!viewMode && <button
            type="button"
            onClick={submitASN}
            disabled={isLocked || saving}
            className={classNames(
              primaryBtn,
              (isLocked || saving) &&
                "cursor-not-allowed opacity-50"
            )}
            style={{
              backgroundColor:
                FORTUNA_PRIMARY_RED,
            }}
          >
            Submit ASN
          </button>}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5">
        <h4
          className="text-base font-semibold"
          style={{
            color:
              FORTUNA_PRIMARY_RED,
          }}
        >
          {title}
        </h4>

        {subtitle && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   READ ONLY FIELD
========================================================= */

function ReadOnlyField({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={
        full ? "sm:col-span-2" : ""
      }
    >
      <label className={labelBase}>
        {label}{" "}
        <span className="text-xs text-gray-400">
          (System)
        </span>
      </label>

      <input
        readOnly
        value={value || "—"}
        className={classNames(
          inputBase,
          "cursor-not-allowed bg-gray-50 dark:bg-white/5"
        )}
      />
    </div>
  );
}

/* =========================================================
   EDITABLE FIELD
========================================================= */

function EditableField({
  label,
  value,
  disabled,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelBase}>
        {label}
      </label>

      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className={classNames(
          inputBase,
          disabled &&
            "cursor-not-allowed bg-gray-50 dark:bg-white/5"
        )}
      />
    </div>
  );
}

/* =========================================================
   DATE FIELD
========================================================= */

function DateField({
  label,
  value,
  disabled,
  required,
  error,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  disabled: boolean;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      <label className={labelBase}>
        {label}{" "}
        {required && <Required />}
      </label>

      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        onBlur={onBlur}
        className={classNames(
          inputBase,
          disabled &&
            "cursor-not-allowed bg-gray-50 dark:bg-white/5",
          error &&
            "border-red-500"
        )}
      />

      {error && (
        <ErrorText
          message={error}
        />
      )}
    </div>
  );
}

/* =========================================================
   REQUIRED
========================================================= */

function Required() {
  return (
    <span
      style={{
        color:
          FORTUNA_PRIMARY_RED,
      }}
    >
      *
    </span>
  );
}

/* =========================================================
   ERROR TEXT
========================================================= */

function ErrorText({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;

  return (
    <p className="mt-1 text-xs font-medium text-red-500">
      {message}
    </p>
  );
}

/* =========================================================
   METRIC BOX
========================================================= */

function MetricBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const color =
    accent ||
    FORTUNA_SECONDARY_BLUE;

  return (
    <div
      className="rounded-xl border bg-gray-50 p-4 dark:bg-white/5"
      style={{
        borderColor: `${color}25`,
      }}
    >
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </div>

      <div
        className="mt-1 text-xl font-bold"
        style={{
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY VALUE
========================================================= */

function SummaryValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="text-right">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </div>

      <div
        className="mt-1 max-w-[150px] truncate text-sm font-semibold"
        style={{
          color:
            FORTUNA_SECONDARY_BLUE,
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   FLOW STEP
========================================================= */

function FlowStep({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={classNames(
        "rounded-full border px-3 py-1.5 text-xs font-semibold",
        active
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-500/10 dark:text-blue-300"
          : "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400"
      )}
    >
      {label}
    </div>
  );
}

/* =========================================================
   FLOW ARROW
========================================================= */

function FlowArrow() {
  return (
    <span className="text-gray-400">
      →
    </span>
  );
}