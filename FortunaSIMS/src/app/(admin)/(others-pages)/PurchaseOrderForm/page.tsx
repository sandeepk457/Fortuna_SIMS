"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Tabs */
type TabKey = "basic" | "vendor" | "items" | "delivery" | "taxes" | "terms";

/** Enums */
type Currency = "INR" | "USD" | "EUR";
type PaymentTerms = "Net 15" | "Net 30" | "Advance";
type Incoterms = "EXW" | "FOB" | "CIF";
type FreightResponsibility = "Vendor" | "Buyer";
type DeliverySchedule = "Single" | "Partial";

type POStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Issued to Vendor"
  | "Partially Received"
  | "Fully Received"
  | "Closed"
  | "Cancelled";

type ApprovalDecision = "Approved" | "Rejected";

type Warehouse = {
  id: string;
  code: string;
  name: string;
  address: string;
  state: string;
};
type Vendor = {
  vendor_id: string;
  vendor_name: string;
  vendor_address: string;
  gstin: string;
  contact_person: string;
  vendor_email: string;
  state: string;
  default_payment_terms: PaymentTerms;
  default_credit_days: number;
};

type PRLine = {
  pr_item_id: string;
  item_id: string;
  item_description: string;
  uom: string;
  ordered_qty: number;
  unit_price: number;
  delivery_date: string;
};

type ApprovedPR = {
  pr_id: string;
  pr_number: string;
  department?: string;
  requested_by?: string;
  priority?: string;
  status: string;
  estimated_pr_value?: number | string;
  currency?: Currency | string;
  preferred_vendor?: string;
  items?: PRLine[];
};

/** PO Form types */
type POFormState = {
  /** Basic Info */
  po_id: string; // system
  po_number: string; // system
  po_date: string; // system auto
  pr_id: string; // UUID of approved PR (required)
  pr_number: string; // display number from PR (read-only)
  po_status: POStatus; // system-driven
  created_by: string; // logged-in user
  approval_required: boolean; // system/config
  currency: Currency; // from PR (required)

  /** Vendor Details (auto-filled from PR preferred vendor / vendor master) */
  vendor_id: string;
  vendor_name: string;
  vendor_address: string;
  gstin: string;
  contact_person: string;
  vendor_email: string;
  payment_terms: PaymentTerms;
  credit_period_days: number;

  /** Items & Pricing */
  items: PRLine[];

  /** Delivery & Logistics */
  delivery_location: string; // warehouse id (required)
  delivery_address: string; // system from warehouse
  incoterms: Incoterms | "";
  freight_responsibility: FreightResponsibility | "";
  delivery_schedule: DeliverySchedule | "";
  packing_instructions: string;

  /** Taxes & Charges */
  tax_applicable: boolean;
  gst_percentage: string; // decimal string (conditional)
  is_igst: boolean; // computed/determined (demo toggle)
  cgst_amount: number; // system
  sgst_amount: number; // system
  igst_amount: number; // system
  freight_charges: string; // optional
  other_charges: string; // optional
  total_po_value: number; // system grand total

  /** Terms & Conditions */
  warranty_terms: string;
  penalty_clause: boolean;
  liquidated_damages: string; // conditional (if penalty)
  cancellation_terms: string;
  governing_law: string; // system default India
  dispute_resolution: string; // system default

  /** Approval workflow (demo) */
  approver_id: string;
  approval_status: "Pending" | "Approved" | "Rejected";
  approval_date: string;
  approval_remarks: string;
};

/** Master API response mapping helpers */
function normalizeVendorTerms(value: unknown): PaymentTerms {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("advance")) return "Advance";
  if (text.includes("15")) return "Net 15";
  return "Net 30";
}

function normalizeVendor(raw: any): Vendor {
  const addressParts = [
    raw.registered_address,
    raw.address_line1,
    raw.address_line2,
    raw.city,
    raw.state,
    raw.postal_code || raw.pincode,
  ].filter(Boolean);

  const address = String(
    raw.registered_address || raw.vendor_address || raw.address || addressParts.join(", ")
  );

  return {
    vendor_id: String(raw.id || raw.vendor_id || ""),
    vendor_name: String(raw.vendor_name || raw.name || ""),
    vendor_address: address,
    gstin: String(raw.gstin || raw.GSTIN || ""),
    contact_person: String(raw.contact_person_name || raw.contact_person || ""),
    vendor_email: String(raw.contact_email || raw.vendor_email || raw.email || ""),
    state: String(raw.state || ""),
    default_payment_terms: normalizeVendorTerms(raw.payment_terms || raw.default_payment_terms),
    default_credit_days: Number(raw.credit_period_days || raw.credit_days || raw.default_credit_days || 30),
  };
}

function normalizeWarehouse(raw: any): Warehouse {
  const addressParts = [
    raw.address_line1,
    raw.address_line2,
    raw.city,
    raw.state,
    raw.pincode || raw.postal_code,
  ].filter(Boolean);

  return {
    id: String(raw.warehouse_id || raw.id || raw.warehouse_code || ""),
    code: String(raw.warehouse_code || raw.code || ""),
    name: String(raw.warehouse_name || raw.name || ""),
    address: String(raw.address || addressParts.join(", ")),
    state: String(raw.state || ""),
  };
}

/** Approved PRs are loaded from the existing PR backend API. */

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "PO Basic Info" },
  { key: "vendor", label: "Vendor Details" },
  { key: "items", label: "Item & Pricing Details" },
  { key: "delivery", label: "Delivery & Logistics" },
  { key: "taxes", label: "Taxes & Charges" },
  { key: "terms", label: "Terms & Conditions" },
];

/** UI helpers */
const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase = "text-sm font-medium text-gray-700 dark:text-gray-200";
const helperBase = "text-xs text-gray-500 dark:text-gray-400";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white " +
  "shadow-theme-sm focus:outline-none focus:ring-3 focus:ring-brand-500/20";

const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 " +
  "shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5";

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayISOPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function money(n: number, currency: Currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function isTodayOrFuture(dateStr: string) {
  if (!dateStr) return false;
  const t = new Date(todayISO());
  const d = new Date(dateStr);
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() >= t.getTime();
}

const initialState: POFormState = {
  po_id: "Auto-generated",
  po_number: "Auto (PO-YYYY-SEQ)",
  po_date: todayISO(),
  pr_id: "",
  pr_number: "Select an Approved PR",
  po_status: "Draft",
  created_by: "Logged-in user",
  approval_required: true,
  currency: "INR",

  vendor_id: "",
  vendor_name: "",
  vendor_address: "",
  gstin: "",
  contact_person: "",
  vendor_email: "",
  payment_terms: "Net 30",
  credit_period_days: 30,

  items: [],

  delivery_location: "",
  delivery_address: "",
  incoterms: "",
  freight_responsibility: "",
  delivery_schedule: "",
  packing_instructions: "",

  tax_applicable: true,
  gst_percentage: "",
  is_igst: false,
  cgst_amount: 0,
  sgst_amount: 0,
  igst_amount: 0,
  freight_charges: "",
  other_charges: "",
  total_po_value: 0,

  warranty_terms: "",
  penalty_clause: false,
  liquidated_damages: "",
  cancellation_terms: "",
  governing_law: "India",
  dispute_resolution: "Arbitration / Court",

  approver_id: "Auto (rule-based)",
  approval_status: "Pending",
  approval_date: "",
  approval_remarks: "",
};

export default function PurchaseOrderCreatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<POFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** Lock editing after leaving Draft (as per workflow rule: approved PO is locked; also pending approval usually locked) */
  const isLocked = form.po_status !== "Draft";

  const [approvedPRs, setApprovedPRs] = useState<ApprovedPR[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const [prLoadError, setPrLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [masterLoadError, setMasterLoadError] = useState("");
  /** Load Vendor and Warehouse Master records from the backend. */
  useEffect(() => {
    let active = true;

    const loadMasters = async () => {
      setVendorLoading(true);
      setWarehouseLoading(true);
      setMasterLoadError("");

      try {
        const [vendorResponse, warehouseResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors`, { cache: "no-store" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/warehouses`, { cache: "no-store" }),
        ]);

        const [vendorResult, warehouseResult] = await Promise.all([
          vendorResponse.json(),
          warehouseResponse.json(),
        ]);

        if (!vendorResponse.ok || vendorResult?.success === false) {
          throw new Error(vendorResult?.message || "Unable to load Vendor Master.");
        }
        if (!warehouseResponse.ok || warehouseResult?.success === false) {
          throw new Error(warehouseResult?.message || "Unable to load Warehouse Master.");
        }

        const vendorRows = Array.isArray(vendorResult?.data)
          ? vendorResult.data
          : Array.isArray(vendorResult) ? vendorResult : [];
        const warehouseRows = Array.isArray(warehouseResult?.data)
          ? warehouseResult.data
          : Array.isArray(warehouseResult) ? warehouseResult : [];

        if (active) {
          setVendors(vendorRows.map(normalizeVendor).filter((v: Vendor) => v.vendor_id && v.vendor_name));
          setWarehouses(warehouseRows.map(normalizeWarehouse).filter((w: Warehouse) => w.id && w.name));
        }
      } catch (error) {
        if (active) {
          setMasterLoadError(error instanceof Error ? error.message : "Unable to load Master data.");
        }
      } finally {
        if (active) {
          setVendorLoading(false);
          setWarehouseLoading(false);
        }
      }
    };

    void loadMasters();
    return () => { active = false; };
  }, []);

  /** Load PR list from existing backend and keep only approved PRs. */
  useEffect(() => {
    let active = true;
    const loadApprovedPRs = async () => {
      setPrLoading(true);
      setPrLoadError("");
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/list`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || result?.success === false) {
          throw new Error(result?.message || "Unable to load PR list.");
        }
        const rows: ApprovedPR[] = Array.isArray(result?.data) ? result.data : [];
        if (active) setApprovedPRs(rows.filter((pr) => String(pr.status || "").trim().toLowerCase() === "approved"));
      } catch (error) {
        if (active) setPrLoadError(error instanceof Error ? error.message : "Failed to load approved PRs.");
      } finally {
        if (active) setPrLoading(false);
      }
    };
    loadApprovedPRs();
    return () => { active = false; };
  }, []);

  const selectedPR = useMemo(() => {
    return approvedPRs.find((pr) => pr.pr_id === form.pr_id);
  }, [approvedPRs, form.pr_id]);

  /** PR item mapping: backend pr_items -> PO items. */
  const mapPRItems = (items: any[]): PRLine[] => items.map((item, index) => ({
    pr_item_id: String(item.pr_item_id || item.id || `${item.pr_id || "PRITEM"}-${index + 1}`),
    item_id: String(item.item_id || ""),
    item_description: String(item.item_description || item.description || ""),
    uom: String(item.uom || ""),
    ordered_qty: Number(item.requested_qty ?? item.qty ?? 0),
    unit_price: Number(item.estimated_unit_price ?? item.unit_price ?? 0),
    delivery_date: item.required_by_date ? String(item.required_by_date).slice(0, 10) : todayISOPlus(7),
  }));

  /** When an Approved PR is selected, fetch the full PR detail and auto-fill vendor/items. */
  const onSelectApprovedPR = async (prId: string) => {
    if (!prId) {
      setForm((p) => ({ ...p, pr_id: "", pr_number: "", vendor_id: "", vendor_name: "", vendor_address: "", gstin: "", contact_person: "", vendor_email: "", items: [] }));
      return;
    }

    const listPR = approvedPRs.find((pr) => pr.pr_id === prId);
    if (!listPR) {
      alert("Please select a valid Approved PR.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/${encodeURIComponent(prId)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || result?.success === false || !result?.data?.header) {
        throw new Error(result?.message || "Unable to load selected PR details.");
      }

      const header = result.data.header;
      const prItems = Array.isArray(result.data.items) ? result.data.items : [];
      const preferredVendors: string[] = [...new Set<string>(
        prItems
          .map((item: any) => String(item.preferred_vendor || "").trim())
          .filter((vendor: string): vendor is string => Boolean(vendor))
      )];
      const preferredVendor: string = preferredVendors[0] ?? "";
      let vendorMaster: Vendor | undefined;

      if (preferredVendor) {
        const matchedVendor = vendors.find(
          (v) => v.vendor_id === preferredVendor ||
            v.vendor_name.toLowerCase() === preferredVendor.toLowerCase()
        );

        if (matchedVendor) {
          const vendorDetailResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/${encodeURIComponent(matchedVendor.vendor_id)}`,
            { cache: "no-store" }
          );
          const vendorDetailResult = await vendorDetailResponse.json();

          if (!vendorDetailResponse.ok || vendorDetailResult?.success === false) {
            throw new Error(vendorDetailResult?.message || "Unable to load selected Vendor details.");
          }

          const rawVendor = vendorDetailResult?.data?.vendor || vendorDetailResult?.data || vendorDetailResult;
          vendorMaster = normalizeVendor(rawVendor);
          // Cache the complete vendor record (including state) for later GST calculation.
          setVendors((current) => current.map((v) =>
            v.vendor_id === vendorMaster?.vendor_id ? { ...v, ...vendorMaster! } : v
          ));
        }
      }

      const wh = warehouses.find((w) => w.id === form.delivery_location);
      const vendorState = vendorMaster?.state?.trim().toLowerCase();
      const warehouseState = wh?.state?.trim().toLowerCase();
      const isIGST = Boolean(vendorState && warehouseState && vendorState !== warehouseState);
      const currencyCandidate = String(header.currency || "INR").toUpperCase();
      const currency: Currency = currencyCandidate === "USD" || currencyCandidate === "EUR" ? currencyCandidate : "INR";

      setForm((p) => ({
        ...p,
        pr_id: String(header.pr_id || prId),
        pr_number: String(header.pr_number || listPR.pr_number || prId),
        currency,
        vendor_id: vendorMaster?.vendor_id ?? preferredVendor,
        vendor_name: vendorMaster?.vendor_name ?? preferredVendor,
        vendor_address: vendorMaster?.vendor_address || "",
        gstin: vendorMaster?.gstin || "",
        contact_person: vendorMaster?.contact_person || "",
        vendor_email: vendorMaster?.vendor_email || "",
        payment_terms: vendorMaster?.default_payment_terms || "Net 30",
        credit_period_days: vendorMaster?.default_credit_days || 30,
        items: mapPRItems(prItems),
        is_igst: isIGST,
      }));

      if (preferredVendors.length > 1) {
        alert(`Selected PR has multiple preferred vendors (${preferredVendors.join(", ")}). PO vendor auto-filled from the first preferred vendor: ${preferredVendor}. Please verify before saving.`);
      }
      setActiveTab("vendor");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to load PR details.");
    }
  };

  /** Delivery location -> warehouse address and GST determination */
  const onSelectWarehouse = async (warehouseId: string) => {
    if (isLocked) return;

    if (!warehouseId) {
      setForm((p) => ({
        ...p,
        delivery_location: "",
        delivery_address: "",
        is_igst: false,
      }));
      return;
    }

    let warehouse = warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) return;

    // Fetch the complete Warehouse Master record where the full endpoint is available.
    if (warehouse.code) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/warehouses/full/${encodeURIComponent(warehouse.code)}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (response.ok && result?.success !== false) {
          const rawWarehouse = result?.data?.warehouse || result?.data || result;
          warehouse = normalizeWarehouse(rawWarehouse);
        }
      } catch (error) {
        console.error("Unable to load full warehouse details:", error);
      }
    }

    const vendor = vendors.find((v) => v.vendor_id === form.vendor_id);
    const vendorState = vendor?.state?.trim().toLowerCase();
    const warehouseState = warehouse.state?.trim().toLowerCase();
    const isIGST = Boolean(vendorState && warehouseState && vendorState !== warehouseState);

    setForm((p) => ({
      ...p,
      delivery_location: warehouseId,
      delivery_address: warehouse.address || "",
      is_igst: isIGST,
    }));
  };

  /** Derived calculations */
  const totals = useMemo(() => {
    const lineSubTotal = form.items.reduce((sum, ln) => sum + (ln.ordered_qty || 0) * (ln.unit_price || 0), 0);

    const freight = form.freight_charges.trim() ? toNum(form.freight_charges) : 0;
    const other = form.other_charges.trim() ? toNum(form.other_charges) : 0;
    const freightOk = Number.isFinite(freight) && freight >= 0 ? freight : 0;
    const otherOk = Number.isFinite(other) && other >= 0 ? other : 0;

    const gstPct = form.tax_applicable && form.gst_percentage.trim() ? toNum(form.gst_percentage) : 0;
    const gstOk = Number.isFinite(gstPct) && gstPct >= 0 ? gstPct : 0;

    const gstAmount = form.tax_applicable ? (lineSubTotal * gstOk) / 100 : 0;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (form.tax_applicable) {
      if (form.is_igst) {
        igst = gstAmount;
      } else {
        cgst = gstAmount / 2;
        sgst = gstAmount / 2;
      }
    }

    const grandTotal = lineSubTotal + freightOk + otherOk + cgst + sgst + igst;

    return { lineSubTotal, cgst, sgst, igst, grandTotal };
  }, [
    form.items,
    form.freight_charges,
    form.other_charges,
    form.tax_applicable,
    form.gst_percentage,
    form.is_igst,
  ]);

  /** Keep system totals in state */
  useEffect(() => {
    setForm((p) => ({
      ...p,
      cgst_amount: totals.cgst,
      sgst_amount: totals.sgst,
      igst_amount: totals.igst,
      total_po_value: totals.grandTotal,
    }));
  }, [totals.cgst, totals.sgst, totals.igst, totals.grandTotal]);

  /** Validations */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.pr_id) e.pr_id = "Approved PR is required";
    if (form.pr_id && !form.vendor_name.trim()) e.vendor_name = "PR preferred vendor is required to create a PO";
    if (!form.currency) e.currency = "Currency is required";

    if (!form.delivery_location) e.delivery_location = "Delivery warehouse is required";

    // Items must exist
    if (form.items.length === 0) e.items = "PO items must be populated from Approved PR";

    // Delivery date rule
    form.items.forEach((ln, idx) => {
      const k = `item_${idx}_delivery_date`;
      if (!ln.delivery_date) e[k] = "Delivery date is required";
      else if (!isTodayOrFuture(ln.delivery_date)) e[k] = "Delivery date must be PO date or future";
    });

    // Tax validations
    if (form.tax_applicable && form.gst_percentage.trim()) {
      const n = toNum(form.gst_percentage);
      if (!Number.isFinite(n) || n < 0) e.gst_percentage = "GST% must be >= 0";
    }
    if (form.tax_applicable && !form.gst_percentage.trim()) {
      // conditional as per screenshot ("conditional")
      e.gst_percentage = "GST% required when Tax applicable";
    }

    if (form.freight_charges.trim()) {
      const n = toNum(form.freight_charges);
      if (!Number.isFinite(n) || n < 0) e.freight_charges = "Freight must be >= 0";
    }
    if (form.other_charges.trim()) {
      const n = toNum(form.other_charges);
      if (!Number.isFinite(n) || n < 0) e.other_charges = "Other charges must be >= 0";
    }

    // Terms conditional
    if (form.penalty_clause) {
      if (!form.liquidated_damages.trim()) e.liquidated_damages = "Liquidated damages required when penalty clause is ON";
      else {
        const n = toNum(form.liquidated_damages);
        if (!Number.isFinite(n) || n < 0) e.liquidated_damages = "LD% must be >= 0";
      }
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof POFormState>(key: K, value: POFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const markTouched = (key: string) => setTouched((p) => ({ ...p, [key]: true }));
  const showError = (key: string) => Boolean(touched[key] && errors[key]);

  const firstErrorTab = () => {
    const order: TabKey[] = ["basic", "vendor", "items", "delivery", "taxes", "terms"];
    const basicKeys = ["pr_id", "currency"];
    const deliveryKeys = ["delivery_location"];
    const taxKeys = ["gst_percentage", "freight_charges", "other_charges"];
    const termKeys = ["liquidated_damages"];
    const itemErr = Object.keys(errors).some((k) => k.startsWith("item_"));
    for (const t of order) {
      if (t === "basic" && basicKeys.some((k) => errors[k])) return "basic";
      if (t === "items" && (itemErr || errors.items)) return "items";
      if (t === "delivery" && deliveryKeys.some((k) => errors[k])) return "delivery";
      if (t === "taxes" && taxKeys.some((k) => errors[k])) return "taxes";
      if (t === "terms" && termKeys.some((k) => errors[k])) return "terms";
    }
    return "basic";
  };

  /** Items update (delivery date editable) */
  const updateItem = (idx: number, patch: Partial<PRLine>) => {
    if (isLocked) return;
    setForm((p) => {
      const next = [...p.items];
      next[idx] = { ...next[idx], ...patch };
      return { ...p, items: next };
    });
  };

  /** Actions */
  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  const onSaveDraft = async () => {
    if (isLocked || saving) return;
    touchAll();
    if (hasErrors) {
      setActiveTab(firstErrorTab());
      alert("Please fix validation errors before saving the PO draft.");
      return;
    }
    if (!form.pr_id || !selectedPR || String(selectedPR.status).toLowerCase() !== "approved") {
      alert("Only an Approved PR can be used to create a PO.");
      return;
    }

    const payload = {
      pr_id: form.pr_id,
      po_date: form.po_date,
      vendor_id: form.vendor_id,
      vendor_name: form.vendor_name,
      buyer: form.created_by,
      department: selectedPR.department || null,
      currency: form.currency,
      total_items: form.items.length,
      total_value: form.total_po_value,
      priority: selectedPR.priority || null,
      status: "Draft",
      delivery_warehouse: form.delivery_location,
      approval_required: form.approval_required,
      current_approval_level: 0,
      created_by: form.created_by,
      items: form.items.map((item) => ({
        item_id: item.item_id || null,
        description: item.item_description,
        uom: item.uom,
        qty: item.ordered_qty,
        unit_price: item.unit_price,
        delivery_date: item.delivery_date || null,
      })),
    };

    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to save PO draft.");
      }
      alert(
  `PO Draft saved successfully${
    result?.data?.po_number
      ? `: ${result.data.po_number}`
      : result?.po_number
      ? `: ${result.po_number}`
      : ""
  }.`
);

router.push("/PurchaseOrderList");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save PO draft.");
    } finally {
      setSaving(false);
    }
  };

  const touchAll = () => {
    const next: Record<string, boolean> = { ...touched };
    ["pr_id", "currency", "delivery_location", "gst_percentage", "freight_charges", "other_charges", "liquidated_damages"].forEach(
      (k) => (next[k] = true)
    );
    form.items.forEach((_, idx) => {
      next[`item_${idx}_delivery_date`] = true;
    });
    setTouched(next);
  };

  const onSendForApproval = () => {
    if (isLocked) return;
    touchAll();
    if (hasErrors) {
      setActiveTab(firstErrorTab());
      alert("Please fix validation errors before sending for approval.");
      return;
    }
    setForm((p) => ({
      ...p,
      po_status: "Pending Approval",
      approval_status: "Pending",
    }));
    setActiveTab("basic");
    alert("Sent for approval (demo). PO is now locked.");
  };

  const onApplyApprovalDecision = (decision: ApprovalDecision) => {
    // Demo: Procurement Head/Finance action happens here
    if (form.po_status !== "Pending Approval") return;

    if (decision === "Rejected" && !form.approval_remarks.trim()) {
      setActiveTab("basic");
      alert("Remarks are mandatory on rejection.");
      return;
    }

    setForm((p) => ({
      ...p,
      po_status: decision === "Approved" ? "Approved" : "Rejected",
      approval_status: decision,
      approval_date: todayISO(),
    }));

    alert(`PO ${decision} (demo).`);
  };

  const onIssueToVendor = () => {
    if (form.po_status !== "Approved") return;
    setForm((p) => ({ ...p, po_status: "Issued to Vendor" }));
    alert("Issued to Vendor (demo). Next: GRN/Receipts flow.");
  };

  const statusPill = (s: POStatus) =>
    classNames(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      s === "Pending Approval" && "bg-amber-100 text-amber-800",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600",
      s === "Issued to Vendor" && "bg-blue-100 text-blue-700",
      (s === "Closed" || s === "Cancelled") && "bg-purple-100 text-purple-700"
    );

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Purchase Order (PO)" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PO Creation</h3>
          <p className={helperBase}>
            Step 1: Select Approved PR → Step 2: Delivery → Step 3: Taxes → Step 4: Send for Approval → Issue to Vendor.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={statusPill(form.po_status)}>{form.po_status}</span>
            {isLocked && (
              <span className="text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
                Locked: PO cannot be edited after sending for approval.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineBtn} onClick={onReset} disabled={isLocked}>
            Reset
          </button>

          <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSaveDraft}
            disabled={isLocked}
          >
            Save Draft
          </button>

          {/* <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSendForApproval}
            disabled={isLocked}
          >
            Send for Approval
          </button> */}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2 dark:border-gray-800">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={classNames(
                  "relative rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                )}
                style={isActive ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
              >
                {t.label}
                {isActive && (
                  <span
                    className="absolute -bottom-[6px] left-3 right-3 h-[3px] rounded-full"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6 min-w-0">
          {/* BASIC */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    PO ID <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input
                    readOnly
                    value={form.po_id}
                    className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      PO Number <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input
                      readOnly
                      value={form.po_number}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>
                      PO Date <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input
                      readOnly
                      value={form.po_date}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Created By <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input
                    readOnly
                    value={form.created_by}
                    className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div>
                  <label className={labelBase}>
                    Source PR (Approved) <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.pr_id}
                    disabled={isLocked}
                    onChange={(e) => {
                      setField("pr_id", e.target.value);
                      markTouched("pr_id");
                      void onSelectApprovedPR(e.target.value);
                    }}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("pr_id") && "border-brand-500"
                    )}
                  >
                    <option value="">{prLoading ? "Loading Approved PRs…" : "Select Approved PR"}</option>
                    {approvedPRs.map((r) => (
                      <option key={r.pr_id} value={r.pr_id}>
                        {r.pr_number} • {r.department || ""}
                      </option>
                    ))}
                  </select>
                  {showError("pr_id") && <p className="mt-1 text-xs text-brand-500">{errors.pr_id}</p>}
                  <p className={classNames(helperBase, "mt-1")}>Validation: Approved PR only.</p>
                  {prLoadError && <p className="mt-1 text-xs text-red-600">{prLoadError}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      Source PR <span className="text-xs text-gray-400">(Read-only)</span>
                    </label>
                    <input
                      readOnly
                      value={form.pr_number || selectedPR?.pr_number || ""}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>
                      Currency <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.currency}
                      disabled
                      onChange={() => {}}
                      onBlur={() => markTouched("currency")}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    {showError("currency") && <p className="mt-1 text-xs text-brand-500">{errors.currency}</p>}
                    <p className={classNames(helperBase, "mt-1")}>Currency comes from PR.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Rule:</span> Vendor is auto-filled from PR preferred vendor. PR estimated unit price is auto-filled and editable in the PO.
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Approval</h4>
                  <p className={helperBase}>Workflow: Draft → Pending Approval → Approved/Rejected → Issued to Vendor.</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Approval Required</label>
                      <input
                        readOnly
                        value={form.approval_required ? "Yes" : "No"}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>
                    <div>
                      <label className={labelBase}>Approver (System)</label>
                      <input
                        readOnly
                        value={form.approver_id}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelBase}>
                      Approval Remarks {form.po_status === "Pending Approval" ? "(Used by approver)" : "(Optional)"}
                    </label>
                    <textarea
                      value={form.approval_remarks}
                      onChange={(e) => setField("approval_remarks", e.target.value)}
                      className={classNames(
                        inputBase,
                        "min-h-[100px] resize-y",
                        form.po_status !== "Pending Approval" && "opacity-90"
                      )}
                      placeholder="Remarks (mandatory on rejection)"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{
                        backgroundColor: FORTUNA_SECONDARY_BLUE,
                        opacity: form.po_status === "Pending Approval" ? 1 : 0.5,
                      }}
                      disabled={form.po_status !== "Pending Approval"}
                      onClick={() => onApplyApprovalDecision("Approved")}
                    >
                      Approve (Demo)
                    </button>

                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{
                        backgroundColor: FORTUNA_PRIMARY_RED,
                        opacity: form.po_status === "Pending Approval" ? 1 : 0.5,
                      }}
                      disabled={form.po_status !== "Pending Approval"}
                      onClick={() => onApplyApprovalDecision("Rejected")}
                    >
                      Reject (Demo)
                    </button>

                    <button
                      type="button"
                      className={classNames(outlineBtn, "active:scale-95")}
                      style={{
                        borderColor: FORTUNA_SECONDARY_BLUE,
                        opacity: form.po_status === "Approved" ? 1 : 0.5,
                      }}
                      disabled={form.po_status !== "Approved"}
                      onClick={onIssueToVendor}
                    >
                      Issue to Vendor (Demo)
                    </button>
                  </div>

                  {form.approval_date && (
                    <p className={classNames(helperBase, "mt-2")}>
                      Decision Date: <span className="font-semibold">{form.approval_date}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("vendor")}>
                    Next: Vendor Details →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VENDOR */}
          {activeTab === "vendor" && (
            <div className="space-y-5 min-w-0">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Business Rule:</span> Vendor details cannot be edited at PO stage.
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
                <div className="space-y-4">
                  <div>
                    <label className={labelBase}>Vendor Name</label>
                    <input readOnly value={form.vendor_name} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>Vendor Address</label>
                    <textarea readOnly value={form.vendor_address} className={classNames(inputBase, "min-h-[110px] cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>GSTIN</label>
                      <input readOnly value={form.gstin} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>
                    <div>
                      <label className={labelBase}>Contact Person</label>
                      <input readOnly value={form.contact_person} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Vendor Email</label>
                    <input readOnly value={form.vendor_email} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        Payment Terms <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <input readOnly value={form.payment_terms} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                      <p className={classNames(helperBase, "mt-1")}>Default vendor payment terms.</p>
                    </div>
                    <div>
                      <label className={labelBase}>
                        Credit Period (Days) <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <input
                        readOnly
                        value={String(form.credit_period_days || "")}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                      <p className={classNames(helperBase, "mt-1")}>Default vendor payment terms.</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Totals Snapshot</h4>
                    <div className="mt-4 space-y-2 text-sm">
                      <Row label="Line Subtotal" value={money(totals.lineSubTotal, form.currency)} />
                      <Row label="Freight + Other" value={money((toNum(form.freight_charges) || 0) + (toNum(form.other_charges) || 0), form.currency)} />
                      <Row label={form.is_igst ? "IGST" : "CGST + SGST"} value={money(form.is_igst ? form.igst_amount : form.cgst_amount + form.sgst_amount, form.currency)} />
                      <div className="my-2 border-t dark:border-gray-800" />
                      <Row label="Grand Total" value={money(form.total_po_value, form.currency)} bold />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" className={outlineBtn} onClick={() => setActiveTab("items")}>
                      Next: Item & Pricing →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS */}
          {activeTab === "items" && (
            <div className="space-y-4 min-w-0">
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item & Pricing Details</h4>
                <p className={helperBase}>Auto-populated from Approved PR. Quantity comes from PR. Estimated unit price is editable in PO. Delivery Date editable.</p>
                {errors.items && <p className="mt-1 text-xs text-brand-500">{errors.items}</p>}
              </div>

              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[1200px] w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-left">UOM</th>
                      <th className="px-4 py-3 text-left">Ordered Qty</th>
                      <th className="px-4 py-3 text-left">Unit Price</th>
                      <th className="px-4 py-3 text-left">Line Total</th>
                      <th className="px-4 py-3 text-left">Expected Delivery Date *</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {form.items.map((ln, idx) => {
                      const k = `item_${idx}_delivery_date`;
                      const lineTotal = (ln.ordered_qty || 0) * (ln.unit_price || 0);

                      return (
                        <tr key={ln.pr_item_id} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white">{ln.item_description}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                              {ln.item_id} • PR Item: {ln.pr_item_id}
                            </div>
                          </td>
                          <td className="px-4 py-3">{ln.uom}</td>
                          <td className="px-4 py-3">
                            <input
                              readOnly
                              value={String(ln.ordered_qty)}
                              className={classNames(inputBase, "min-w-[110px] cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                            />
                            <p className={classNames(helperBase, "mt-1")}>Requested quantity from PR</p>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={String(ln.unit_price)}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                              className={classNames(inputBase, "min-w-[120px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                            />
                            <p className={classNames(helperBase, "mt-1")}>PR estimated unit price (editable)</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {money(lineTotal, form.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={ln.delivery_date}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { delivery_date: e.target.value })}
                              onBlur={() => markTouched(k)}
                              className={classNames(
                                inputBase,
                                "min-w-[170px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k) && "border-brand-500"
                              )}
                            />
                            {showError(k) && <p className="mt-1 text-xs text-brand-500">{errors[k]}</p>}
                          </td>
                        </tr>
                      );
                    })}

                    {form.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          Select an Approved PR to populate items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Line Subtotal: <span className="font-semibold">{money(totals.lineSubTotal, form.currency)}</span>
                </div>
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("delivery")}>
                  Next: Delivery & Logistics →
                </button>
              </div>
            </div>
          )}

          {/* DELIVERY */}
          {activeTab === "delivery" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Delivery Location (Warehouse) <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.delivery_location}
                    disabled={isLocked}
                    onChange={(e) => {
                      onSelectWarehouse(e.target.value);
                      markTouched("delivery_location");
                    }}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("delivery_location") && "border-brand-500"
                    )}
                  >
                    <option value="">
                      {warehouseLoading ? "Loading Warehouses..." : "Select Warehouse"}
                    </option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code || w.id})
                      </option>
                    ))}
                  </select>
                  {masterLoadError && (
                    <p className="mt-1 text-xs text-red-600">{masterLoadError}</p>
                  )}
                  {showError("delivery_location") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.delivery_location}</p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>
                    Delivery Address <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <textarea
                    readOnly
                    value={form.delivery_address}
                    className={classNames(inputBase, "min-h-[110px] cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Incoterms</label>
                    <select
                      value={form.incoterms}
                      disabled={isLocked}
                      onChange={(e) => setField("incoterms", e.target.value as any)}
                      className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    >
                      <option value="">Select (Optional)</option>
                      <option value="EXW">EXW</option>
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelBase}>Freight Responsibility</label>
                    <select
                      value={form.freight_responsibility}
                      disabled={isLocked}
                      onChange={(e) => setField("freight_responsibility", e.target.value as any)}
                      className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    >
                      <option value="">Select (Optional)</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Buyer">Buyer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Delivery Schedule</label>
                  <select
                    value={form.delivery_schedule}
                    disabled={isLocked}
                    onChange={(e) => setField("delivery_schedule", e.target.value as any)}
                    className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  >
                    <option value="">Select (Optional)</option>
                    <option value="Single">Single</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>

                <div>
                  <label className={labelBase}>
                    Packing Instructions <span className={helperBase}>(Optional)</span>
                  </label>
                  <textarea
                    value={form.packing_instructions}
                    disabled={isLocked}
                    onChange={(e) => setField("packing_instructions", e.target.value)}
                    className={classNames(inputBase, "min-h-[100px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Special packing/handling instructions"
                  />
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">IGST rule (demo):</span> If vendor state differs from warehouse state → IGST.
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Tax Mode</h4>
                  <p className={helperBase}>Auto-determined from Vendor vs Warehouse state (demo).</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Tax Type</label>
                      <input
                        readOnly
                        value={form.is_igst ? "IGST" : "CGST + SGSGT"}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>
                    <div>
                      <label className={labelBase}>Tax Applicable</label>
                      <select
                        value={form.tax_applicable ? "Yes" : "No"}
                        disabled={isLocked}
                        onChange={(e) => setField("tax_applicable", e.target.value === "Yes")}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("taxes")}>
                    Next: Taxes & Charges →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAXES */}
          {activeTab === "taxes" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">GST & Charges</h4>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        GST % <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <input
                        value={form.gst_percentage}
                        disabled={isLocked || !form.tax_applicable}
                        onChange={(e) => setField("gst_percentage", e.target.value.replace(/[^\d.]/g, ""))}
                        onBlur={() => markTouched("gst_percentage")}
                        placeholder="Example: 18"
                        className={classNames(
                          inputBase,
                          (isLocked || !form.tax_applicable) && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("gst_percentage") && "border-brand-500"
                        )}
                      />
                      {showError("gst_percentage") && <p className="mt-1 text-xs text-brand-500">{errors.gst_percentage}</p>}
                      <p className={classNames(helperBase, "mt-1")}>Conditional: required when Tax applicable.</p>
                    </div>

                    <div>
                      <label className={labelBase}>Calculated Tax</label>
                      <input
                        readOnly
                        value={money(form.is_igst ? form.igst_amount : form.cgst_amount + form.sgst_amount, form.currency)}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                      <p className={classNames(helperBase, "mt-1")}>System auto calculated.</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Freight Charges</label>
                      <input
                        value={form.freight_charges}
                        disabled={isLocked}
                        onChange={(e) => setField("freight_charges", e.target.value.replace(/[^\d.]/g, ""))}
                        onBlur={() => markTouched("freight_charges")}
                        placeholder="Optional"
                        className={classNames(
                          inputBase,
                          isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("freight_charges") && "border-brand-500"
                        )}
                      />
                      {showError("freight_charges") && <p className="mt-1 text-xs text-brand-500">{errors.freight_charges}</p>}
                    </div>

                    <div>
                      <label className={labelBase}>Other Charges</label>
                      <input
                        value={form.other_charges}
                        disabled={isLocked}
                        onChange={(e) => setField("other_charges", e.target.value.replace(/[^\d.]/g, ""))}
                        onBlur={() => markTouched("other_charges")}
                        placeholder="Optional (Packing/Insurance)"
                        className={classNames(
                          inputBase,
                          isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("other_charges") && "border-brand-500"
                        )}
                      />
                      {showError("other_charges") && <p className="mt-1 text-xs text-brand-500">{errors.other_charges}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Totals</h4>

                  <div className="mt-4 space-y-2 text-sm">
                    <Row label="Line Subtotal" value={money(totals.lineSubTotal, form.currency)} />
                    <Row label="Freight Charges" value={money(toNum(form.freight_charges) || 0, form.currency)} />
                    <Row label="Other Charges" value={money(toNum(form.other_charges) || 0, form.currency)} />
                    <Row label={form.is_igst ? "IGST Amount" : "CGST Amount"} value={money(form.is_igst ? form.igst_amount : form.cgst_amount, form.currency)} />
                    {!form.is_igst && <Row label="SGST Amount" value={money(form.sgst_amount, form.currency)} />}
                    <div className="my-2 border-t dark:border-gray-800" />
                    <Row label="Grand Total (Total PO Value)" value={money(form.total_po_value, form.currency)} bold />
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Total PO Value = Line totals + GST + charges.
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("terms")}>
                    Next: Terms & Conditions →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TERMS */}
          {activeTab === "terms" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>Warranty Terms</label>
                  <textarea
                    value={form.warranty_terms}
                    disabled={isLocked}
                    onChange={(e) => setField("warranty_terms", e.target.value)}
                    className={classNames(inputBase, "min-h-[100px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Warranty details (Optional)"
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Penalty Clause</h4>
                      <p className={helperBase}>If enabled, liquidated damages becomes mandatory.</p>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={form.penalty_clause}
                        disabled={isLocked}
                        onChange={(e) => setField("penalty_clause", e.target.checked)}
                      />
                      Enable
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className={labelBase}>
                      Liquidated Damages (%) {form.penalty_clause && <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>}
                    </label>
                    <input
                      value={form.liquidated_damages}
                      disabled={isLocked || !form.penalty_clause}
                      onChange={(e) => setField("liquidated_damages", e.target.value.replace(/[^\d.]/g, ""))}
                      onBlur={() => markTouched("liquidated_damages")}
                      placeholder={form.penalty_clause ? "Example: 1.5" : "Disabled"}
                      className={classNames(
                        inputBase,
                        (isLocked || !form.penalty_clause) && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("liquidated_damages") && "border-brand-500"
                      )}
                    />
                    {showError("liquidated_damages") && <p className="mt-1 text-xs text-brand-500">{errors.liquidated_damages}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Cancellation Terms</label>
                  <textarea
                    value={form.cancellation_terms}
                    disabled={isLocked}
                    onChange={(e) => setField("cancellation_terms", e.target.value)}
                    className={classNames(inputBase, "min-h-[100px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Cancellation rules (Optional)"
                  />
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">System Defaults:</span> Governing Law = India; Dispute Resolution = Arbitration/Court.
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      Governing Law <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input
                      readOnly
                      value={form.governing_law}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>
                      Dispute Resolution <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input
                      readOnly
                      value={form.dispute_resolution}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Final Checks</h4>
                  <div className="mt-4 space-y-2 text-sm">
                    <Row label="Approved PR" value={form.pr_id ? "Selected" : "Not selected"} />
                    <Row label="Warehouse" value={warehouses.find((w) => w.id === form.delivery_location)?.name || (form.delivery_location ? form.delivery_location : "Not selected")} />
                    <Row label="Items" value={String(form.items.length)} />
                    <Row label="Grand Total" value={money(form.total_po_value, form.currency)} bold />
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Next:</span> Send for Approval → Approver decision → Issue to Vendor.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={outlineBtn} onClick={onReset} disabled={isLocked}>
          Reset
        </button>

        <button
          type="button"
          className={classNames(primaryBtn, "active:scale-95")}
          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSaveDraft}
          disabled={isLocked}
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>

        {/* <button
          type="button"
          className={classNames(primaryBtn, "active:scale-95")}
          style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSendForApproval}
          disabled={isLocked}
        >
          Send for Approval
        </button> */}
      </div>
    </div>
  );
}

/** small UI row component */
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className={classNames("text-gray-900 dark:text-white", bold && "font-semibold")}>{value}</span>
    </div>
  );
}
