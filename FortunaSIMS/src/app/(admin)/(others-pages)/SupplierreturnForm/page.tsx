"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Tabs */
type TabKey = "basic" | "items" | "pickup" | "attachments" | "status";

/** Supplier Return (SR) Enums */
type SRStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Handover Confirmed"
  | "Closed";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type ReturnReason = "Damage" | "Wrong Supply" | "Excess Supply" | "Expiry" | "Quality Issue" | "Other";
type PickupMode = "Vendor Pickup" | "Courier" | "Company Vehicle" | "3PL";
type AttachmentType = "DC" | "Invoice" | "Photo" | "Other";

type ApprovalDecision = "Approved" | "Rejected";

const DEPARTMENTS = ["Stores", "Maintenance", "Production", "IT", "Finance", "Admin", "Procurement"] as const;

const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH", address: "Vizag, Andhra Pradesh, India" },
  { id: "WH-002", name: "Hyderabad WH", address: "Hyderabad, Telangana, India" },
  { id: "WH-003", name: "Chennai WH", address: "Chennai, Tamil Nadu, India" },
];

const VENDORS = [
  { id: "V-001", name: "Sri Lakshmi Suppliers", email: "srilakshmi@example.com", gstin: "37ABCDE1234F1Z5" },
  { id: "V-002", name: "Aparna Packaging", email: "aparna@example.com", gstin: "36PQRSX9876K1Z2" },
  { id: "V-003", name: "Prime 3PL", email: "prime3pl@example.com", gstin: "29LMNOP1111A1Z9" },
];

type SRItemLine = {
  sr_item_id: string; // system
  item_id: string; // read-only/optional (SKU)
  item_description: string; // required
  uom: string; // required
  return_qty: string; // required > 0
  unit_value: string; // optional >=0
  line_total: number; // system qty * value
  reason: ReturnReason; // required
};

type SRAttachment = {
  attachment_id: string; // system
  attachment_type: AttachmentType;
  attachment_file: File | null;
};

type SRFormState = {
  /** Basic */
  sr_id: string; // system
  sr_number: string; // system SR-YYYY-SEQ
  sr_date: string; // system auto
  created_by: string; // system
  department: (typeof DEPARTMENTS)[number] | ""; // required
  priority: Priority; // required default Medium
  sr_status: SRStatus; // system-driven

  /** Vendor */
  vendor_id: string; // required
  vendor_name: string; // system
  vendor_email: string; // system
  vendor_gstin: string; // system

  /** Items */
  items: SRItemLine[];

  /** Pickup & Logistics */
  pickup_mode: PickupMode; // required
  pickup_date: string; // required
  pickup_reference: string; // optional (LR/DC/Ack No)
  warehouse_id: string; // required
  warehouse_address: string; // system
  notes_for_vendor: string; // optional

  /** Attachments & Notes */
  attachments: SRAttachment[];
  internal_notes: string; // optional

  /** Audit (Inbound words removed -> Handover fields) */
  approval_required: boolean; // system/demo
  approved_by: string; // system
  approved_on: string; // system
  handover_confirmed_by: string; // system
  handover_confirmed_on: string; // system
  last_remarks: string; // approval/handover remarks

  /** Totals */
  subtotal: number; // system
  tax: string; // optional >=0
  grand_total: number; // system
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "items", label: "Items & Qty" },
  { key: "pickup", label: "Pickup & Logistics" },
  { key: "attachments", label: "Attachments & Notes" },
  { key: "status", label: "Status & Audit" },
];

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

function uuidLike(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Math.random().toString(16).slice(2, 8)}`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function moneyINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
  } catch {
    return `₹${Math.round(n * 100) / 100}`;
  }
}

const initialState: SRFormState = {
  sr_id: "Auto-generated",
  sr_number: "Auto (SR-YYYY-SEQ)",
  sr_date: todayISO(),
  created_by: "Logged-in user",
  department: "",
  priority: "Medium",
  sr_status: "Draft",

  vendor_id: "",
  vendor_name: "",
  vendor_email: "",
  vendor_gstin: "",

  items: [],

  pickup_mode: "Vendor Pickup",
  pickup_date: todayISO(),
  pickup_reference: "",
  warehouse_id: "",
  warehouse_address: "",
  notes_for_vendor: "",

  attachments: [],
  internal_notes: "",

  approval_required: true,
  approved_by: "System",
  approved_on: "System",
  handover_confirmed_by: "System",
  handover_confirmed_on: "System",
  last_remarks: "",

  subtotal: 0,
  tax: "",
  grand_total: 0,
};

export default function SupplierReturnCreatePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<SRFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** ✅ Lock editing after leaving Draft */
  const isLocked = form.sr_status !== "Draft";

  /** Totals */
  const totals = useMemo(() => {
    const sub = form.items.reduce((sum, line) => sum + (line.line_total || 0), 0);
    const tax = form.tax.trim() ? toNum(form.tax) : 0;
    const taxOk = Number.isFinite(tax) && tax >= 0 ? tax : 0;
    return { subtotal: sub, grand_total: sub + taxOk };
  }, [form.items, form.tax]);

  useEffect(() => {
    setForm((p) => ({ ...p, subtotal: totals.subtotal, grand_total: totals.grand_total }));
  }, [totals.subtotal, totals.grand_total]);

  /** Validations */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // Basic
    if (!form.department) e.department = "Department is required";
    if (!form.priority) e.priority = "Priority is required";

    // Vendor
    if (!form.vendor_id) e.vendor_id = "Vendor is required";

    // Items
    if (form.items.length === 0) e.items = "At least one item is required";
    form.items.forEach((line, idx) => {
      const p = `item_${idx}_`;
      if (!line.item_description.trim()) e[p + "item_description"] = "Description is required";
      if (!line.uom.trim()) e[p + "uom"] = "UOM is required";
      if (!line.reason) e[p + "reason"] = "Reason is required";

      if (!line.return_qty.trim()) e[p + "return_qty"] = "Return Qty is required";
      else {
        const q = toNum(line.return_qty);
        if (!Number.isFinite(q) || q <= 0) e[p + "return_qty"] = "Return Qty must be > 0";
      }

      if (line.unit_value.trim()) {
        const v = toNum(line.unit_value);
        if (!Number.isFinite(v) || v < 0) e[p + "unit_value"] = "Unit value must be >= 0";
      }
    });

    // Pickup & Logistics
    if (!form.pickup_mode) e.pickup_mode = "Pickup mode is required";
    if (!form.pickup_date) e.pickup_date = "Pickup date is required";
    if (!form.warehouse_id) e.warehouse_id = "Warehouse is required";

    // Tax
    if (form.tax.trim()) {
      const t = toNum(form.tax);
      if (!Number.isFinite(t) || t < 0) e.tax = "Tax must be >= 0";
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof SRFormState>(key: K, value: SRFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const markTouched = (key: string) => setTouched((p) => ({ ...p, [key]: true }));
  const showError = (key: string) => Boolean(touched[key] && errors[key]);

  const firstErrorTab = () => {
    const order: TabKey[] = ["basic", "items", "pickup", "attachments", "status"];
    const basicKeys = ["department", "priority", "vendor_id"];
    const pickupKeys = ["pickup_mode", "pickup_date", "warehouse_id"];
    const itemErr = Object.keys(errors).some((k) => k.startsWith("item_")) || Boolean(errors.items);

    for (const t of order) {
      if (t === "basic" && basicKeys.some((k) => errors[k])) return "basic";
      if (t === "items" && itemErr) return "items";
      if (t === "pickup" && pickupKeys.some((k) => errors[k])) return "pickup";
    }
    return "basic";
  };

  /** Vendor selection */
  const onSelectVendor = (vendorId: string) => {
    if (isLocked) return;
    const v = VENDORS.find((x) => x.id === vendorId);
    setForm((p) => ({
      ...p,
      vendor_id: vendorId,
      vendor_name: v?.name ?? "",
      vendor_email: v?.email ?? "",
      vendor_gstin: v?.gstin ?? "",
    }));
  };

  /** Warehouse selection */
  const onSelectWarehouse = (warehouseId: string) => {
    if (isLocked) return;
    const wh = WAREHOUSES.find((w) => w.id === warehouseId);
    setForm((p) => ({
      ...p,
      warehouse_id: warehouseId,
      warehouse_address: wh?.address ?? "",
    }));
  };

  /** Item helpers */
  const recalcLineTotal = (line: SRItemLine) => {
    const q = toNum(line.return_qty);
    const v = line.unit_value.trim() ? toNum(line.unit_value) : 0;
    const qty = Number.isFinite(q) && q > 0 ? q : 0;
    const val = Number.isFinite(v) && v >= 0 ? v : 0;
    return qty * val;
  };

  const addItem = () => {
    if (isLocked) return;
    const newLine: SRItemLine = {
      sr_item_id: uuidLike("SRITEM"),
      item_id: "",
      item_description: "",
      uom: "",
      return_qty: "",
      unit_value: "",
      line_total: 0,
      reason: "Damage",
    };
    setForm((p) => ({ ...p, items: [...p.items, newLine] }));
    setActiveTab("items");
  };

  const updateItem = (idx: number, patch: Partial<SRItemLine>) => {
    if (isLocked) return;
    setForm((p) => {
      const next = [...p.items];
      const merged = { ...next[idx], ...patch };
      merged.line_total = recalcLineTotal(merged);
      next[idx] = merged;
      return { ...p, items: next };
    });
  };

  const removeItem = (idx: number) => {
    if (isLocked) return;
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  };

  /** Attachments */
  const addAttachment = () => {
    if (isLocked) return;
    setForm((p) => ({
      ...p,
      attachments: [...p.attachments, { attachment_id: uuidLike("ATT"), attachment_type: "DC", attachment_file: null }],
    }));
  };

  const updateAttachment = (idx: number, patch: Partial<SRAttachment>) => {
    if (isLocked) return;
    setForm((p) => {
      const next = [...p.attachments];
      next[idx] = { ...next[idx], ...patch };
      return { ...p, attachments: next };
    });
  };

  const removeAttachment = (idx: number) => {
    if (isLocked) return;
    setForm((p) => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }));
  };

  /** Save actions */
  const touchAll = () => {
    const next: Record<string, boolean> = { ...touched };

    ["department", "priority", "vendor_id", "pickup_mode", "pickup_date", "warehouse_id", "tax"].forEach((k) => (next[k] = true));

    form.items.forEach((_, idx) => {
      next[`item_${idx}_item_description`] = true;
      next[`item_${idx}_uom`] = true;
      next[`item_${idx}_return_qty`] = true;
      next[`item_${idx}_unit_value`] = true;
      next[`item_${idx}_reason`] = true;
    });

    setTouched(next);
  };

  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  const onSaveDraft = () => {
    console.log("Save Draft:", form);
    alert("Saved Draft (demo). Next: connect API.");
  };

  /** ✅ Send for Approval */
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
      sr_status: "Pending Approval",
      last_remarks: p.last_remarks?.trim() ? p.last_remarks : "Sent for approval",
    }));
    setActiveTab("status");
    alert("Sent for approval (demo). SR is now locked.");
  };

  /** ✅ Demo approval actions */
  const onApprove = () => {
    if (form.sr_status !== "Pending Approval") return;
    setForm((p) => ({
      ...p,
      sr_status: "Approved",
      approved_by: "Approver (Demo)",
      approved_on: todayISO(),
      last_remarks: p.last_remarks?.trim() ? p.last_remarks : "Approved",
    }));
  };

  const onReject = () => {
    if (form.sr_status !== "Pending Approval") return;
    if (!form.last_remarks.trim()) {
      alert("Please add remarks before rejecting.");
      return;
    }
    setForm((p) => ({
      ...p,
      sr_status: "Rejected",
      approved_by: "Approver (Demo)",
      approved_on: todayISO(),
    }));
  };

  /**
   * ✅ KEY CHANGE (as per your note):
   * SR is OUTBOUND (warehouse -> supplier).
   * So NOT "Mark Received". It should be "Confirm Handover / Pickup Confirmed".
   */
  const onConfirmHandover = () => {
    if (form.sr_status !== "Approved") return;
    setForm((p) => ({
      ...p,
      sr_status: "Handover Confirmed",
      handover_confirmed_by: "Stores (Demo)",
      handover_confirmed_on: todayISO(),
      last_remarks: p.last_remarks?.trim() ? p.last_remarks : "Goods handed over to supplier/transporter",
    }));
  };

  const onClose = () => {
    if (form.sr_status !== "Handover Confirmed") return;
    setForm((p) => ({
      ...p,
      sr_status: "Closed",
      last_remarks: p.last_remarks?.trim() ? p.last_remarks : "Closed",
    }));
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Supplier Return (SR)" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supplier Return Creation</h3>
          <p className={helperBase}>Draft → Send for Approval → Approved → Handover Confirmed → Close.</p>

          {isLocked && (
            <p className="mt-1 text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
              Locked: SR cannot be edited after sending for approval.
            </p>
          )}
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

          <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSendForApproval}
            disabled={isLocked}
          >
            Send for Approval
          </button>
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
                  isActive ? "text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
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

        {/* Content */}
        <div className="p-4 sm:p-6 min-w-0">
          {/* BASIC */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    SR ID <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.sr_id} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      SR Number <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.sr_number} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>
                      SR Date <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.sr_date} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Created By <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.created_by} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      Department <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.department}
                      disabled={isLocked}
                      onChange={(e) => setField("department", e.target.value as any)}
                      onBlur={() => markTouched("department")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("department") && "border-brand-500"
                      )}
                    >
                      <option value="">Select</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {showError("department") && <p className="mt-1 text-xs text-brand-500">{errors.department}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      Priority <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.priority}
                      disabled={isLocked}
                      onChange={(e) => setField("priority", e.target.value as Priority)}
                      onBlur={() => markTouched("priority")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("priority") && "border-brand-500"
                      )}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                    {showError("priority") && <p className="mt-1 text-xs text-brand-500">{errors.priority}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Vendor <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.vendor_id}
                    disabled={isLocked}
                    onChange={(e) => onSelectVendor(e.target.value)}
                    onBlur={() => markTouched("vendor_id")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("vendor_id") && "border-brand-500"
                    )}
                  >
                    <option value="">Select Vendor</option>
                    {VENDORS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id})
                      </option>
                    ))}
                  </select>
                  {showError("vendor_id") && <p className="mt-1 text-xs text-brand-500">{errors.vendor_id}</p>}
                  {!!form.vendor_id && (
                    <p className={classNames(helperBase, "mt-2")}>
                      Email: <span className="font-semibold">{form.vendor_email || "—"}</span> • GSTIN:{" "}
                      <span className="font-semibold">{form.vendor_gstin || "—"}</span>
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> Supplier Return is outbound: Warehouse → Supplier.
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Status</h4>
                  <p className={helperBase}>Draft / Pending Approval / Approved / Rejected / Handover Confirmed / Closed</p>

                  <div className="mt-4">
                    <label className={labelBase}>SR Status</label>
                    <input readOnly value={form.sr_status} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Workflow:</span> Draft → Send for Approval → Approved → Handover Confirmed → Close
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: form.sr_status === "Draft" ? 1 : 0.6 }}
                      onClick={addItem}
                      disabled={isLocked}
                    >
                      + Add Item
                    </button>

                    <button type="button" className={outlineBtn} onClick={() => setActiveTab("items")}>
                      Go to Items →
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Totals</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{moneyINR(form.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Grand Total</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{moneyINR(form.grand_total)}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={labelBase}>
                      Tax <span className={helperBase}>(Optional)</span>
                    </label>
                    <input
                      value={form.tax}
                      disabled={isLocked}
                      onChange={(e) => setField("tax", e.target.value.replace(/[^\d.]/g, ""))}
                      onBlur={() => markTouched("tax")}
                      placeholder=">= 0"
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("tax") && "border-brand-500"
                      )}
                    />
                    {showError("tax") && <p className="mt-1 text-xs text-brand-500">{errors.tax}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS */}
          {activeTab === "items" && (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Return Items</h4>
                  <p className={helperBase}>Add lines to return back to supplier.</p>
                  {errors.items && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      {errors.items}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className={classNames(primaryBtn, "active:scale-95")}
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                    onClick={addItem}
                    disabled={isLocked}
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[1400px] w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">Description *</th>
                      <th className="px-4 py-3 text-left">UOM *</th>
                      <th className="px-4 py-3 text-left">Return Qty *</th>
                      <th className="px-4 py-3 text-left">Unit Value</th>
                      <th className="px-4 py-3 text-left">Reason *</th>
                      <th className="px-4 py-3 text-left">Line Total</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {form.items.map((line, idx) => {
                      const k = (name: string) => `item_${idx}_${name}`;
                      return (
                        <tr key={line.sr_item_id} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                          <td className="px-4 py-3">
                            <input
                              value={line.item_id}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { item_id: e.target.value })}
                              placeholder="SKU (optional)"
                              className={classNames(inputBase, "min-w-[140px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.item_description}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { item_description: e.target.value })}
                              onBlur={() => markTouched(k("item_description"))}
                              placeholder="Item description"
                              className={classNames(
                                inputBase,
                                "min-w-[280px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("item_description")) && "border-brand-500"
                              )}
                            />
                            {showError(k("item_description")) && <p className="mt-1 text-xs text-brand-500">{errors[k("item_description")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.uom}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { uom: e.target.value })}
                              onBlur={() => markTouched(k("uom"))}
                              placeholder="Nos/Box"
                              className={classNames(
                                inputBase,
                                "min-w-[120px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("uom")) && "border-brand-500"
                              )}
                            />
                            {showError(k("uom")) && <p className="mt-1 text-xs text-brand-500">{errors[k("uom")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.return_qty}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { return_qty: e.target.value.replace(/[^\d.]/g, "") })}
                              onBlur={() => markTouched(k("return_qty"))}
                              placeholder="> 0"
                              className={classNames(
                                inputBase,
                                "min-w-[120px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("return_qty")) && "border-brand-500"
                              )}
                            />
                            {showError(k("return_qty")) && <p className="mt-1 text-xs text-brand-500">{errors[k("return_qty")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.unit_value}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { unit_value: e.target.value.replace(/[^\d.]/g, "") })}
                              onBlur={() => markTouched(k("unit_value"))}
                              placeholder=">= 0"
                              className={classNames(
                                inputBase,
                                "min-w-[140px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("unit_value")) && "border-brand-500"
                              )}
                            />
                            {showError(k("unit_value")) && <p className="mt-1 text-xs text-brand-500">{errors[k("unit_value")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={line.reason}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { reason: e.target.value as ReturnReason })}
                              onBlur={() => markTouched(k("reason"))}
                              className={classNames(
                                inputBase,
                                "min-w-[200px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("reason")) && "border-brand-500"
                              )}
                            >
                              <option value="Damage">Damage</option>
                              <option value="Wrong Supply">Wrong Supply</option>
                              <option value="Excess Supply">Excess Supply</option>
                              <option value="Expiry">Expiry</option>
                              <option value="Quality Issue">Quality Issue</option>
                              <option value="Other">Other</option>
                            </select>
                            {showError(k("reason")) && <p className="mt-1 text-xs text-brand-500">{errors[k("reason")]}</p>}
                          </td>

                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{moneyINR(line.line_total || 0)}</td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className={classNames("text-sm font-semibold text-rose-600 hover:underline", isLocked && "opacity-50 cursor-not-allowed")}
                              onClick={() => removeItem(idx)}
                              disabled={isLocked}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {form.items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No items added. Click “+ Add Item” to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("pickup")}>
                  Next: Pickup & Logistics →
                </button>
              </div>
            </div>
          )}

          {/* PICKUP */}
          {activeTab === "pickup" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Pickup Mode <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.pickup_mode}
                    disabled={isLocked}
                    onChange={(e) => setField("pickup_mode", e.target.value as PickupMode)}
                    onBlur={() => markTouched("pickup_mode")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("pickup_mode") && "border-brand-500"
                    )}
                  >
                    <option value="Vendor Pickup">Vendor Pickup</option>
                    <option value="Courier">Courier</option>
                    <option value="Company Vehicle">Company Vehicle</option>
                    <option value="3PL">3PL</option>
                  </select>
                  {showError("pickup_mode") && <p className="mt-1 text-xs text-brand-500">{errors.pickup_mode}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    Pickup Date <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.pickup_date}
                    disabled={isLocked}
                    onChange={(e) => setField("pickup_date", e.target.value)}
                    onBlur={() => markTouched("pickup_date")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("pickup_date") && "border-brand-500"
                    )}
                  />
                  {showError("pickup_date") && <p className="mt-1 text-xs text-brand-500">{errors.pickup_date}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    Pickup Reference <span className={helperBase}>(Optional)</span>
                  </label>
                  <input
                    value={form.pickup_reference}
                    disabled={isLocked}
                    onChange={(e) => setField("pickup_reference", e.target.value)}
                    placeholder="LR / DC / Ack No"
                    className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div>
                  <label className={labelBase}>
                    Warehouse <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.warehouse_id}
                    disabled={isLocked}
                    onChange={(e) => onSelectWarehouse(e.target.value)}
                    onBlur={() => markTouched("warehouse_id")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("warehouse_id") && "border-brand-500"
                    )}
                  >
                    <option value="">Select</option>
                    {WAREHOUSES.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.id})
                      </option>
                    ))}
                  </select>
                  {showError("warehouse_id") && <p className="mt-1 text-xs text-brand-500">{errors.warehouse_id}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    Warehouse Address <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <textarea
                    readOnly
                    value={form.warehouse_address}
                    className={classNames(inputBase, "min-h-[100px] cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Notes for Vendor <span className={helperBase}>(Optional)</span>
                  </label>
                  <textarea
                    value={form.notes_for_vendor}
                    disabled={isLocked}
                    onChange={(e) => setField("notes_for_vendor", e.target.value)}
                    className={classNames(inputBase, "min-h-[140px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Pickup instructions / packaging / contact details..."
                  />
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("attachments")}>
                    Next: Attachments & Notes →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Attachments & Notes</h4>
                  <p className={helperBase}>Upload DC/Invoice/Photo as evidence.</p>
                </div>

                <button
                  type="button"
                  className={classNames(primaryBtn, "active:scale-95")}
                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                  onClick={addAttachment}
                  disabled={isLocked}
                >
                  + Add Attachment
                </button>
              </div>

              <div className="space-y-3">
                {form.attachments.map((a, idx) => (
                  <div
                    key={a.attachment_id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:grid-cols-12 min-w-0"
                  >
                    <div className="sm:col-span-3 min-w-0">
                      <label className={labelBase}>Attachment Type</label>
                      <select
                        value={a.attachment_type}
                        disabled={isLocked}
                        onChange={(e) => updateAttachment(idx, { attachment_type: e.target.value as AttachmentType })}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      >
                        <option value="DC">DC</option>
                        <option value="Invoice">Invoice</option>
                        <option value="Photo">Photo</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-7 min-w-0">
                      <label className={labelBase}>
                        Attachment File <span className={helperBase}>(Optional PDF/JPG)</span>
                      </label>
                      <input
                        type="file"
                        disabled={isLocked}
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                        onChange={(e) => updateAttachment(idx, { attachment_file: e.target.files?.[0] ?? null })}
                        className={classNames(inputBase, "px-2 py-2", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        className={classNames("text-sm font-semibold text-rose-600 hover:underline", isLocked && "opacity-50")}
                        onClick={() => removeAttachment(idx)}
                        disabled={isLocked}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {form.attachments.length === 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    No attachments added.
                  </div>
                )}
              </div>

              <div>
                <label className={labelBase}>
                  Internal Notes <span className={helperBase}>(Optional)</span>
                </label>
                <textarea
                  value={form.internal_notes}
                  disabled={isLocked}
                  onChange={(e) => setField("internal_notes", e.target.value)}
                  className={classNames(inputBase, "min-h-[120px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  placeholder="Internal notes for audit/approver"
                />
              </div>

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("status")}>
                  Next: Status & Audit →
                </button>
              </div>
            </div>
          )}

          {/* STATUS */}
          {activeTab === "status" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">SR Status</h4>
                  <p className={helperBase}>Draft / Pending Approval / Approved / Rejected / Handover Confirmed / Closed</p>

                  <div className="mt-4">
                    <label className={labelBase}>Status</label>
                    <input readOnly value={form.sr_status} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Workflow:</span> Draft → Send for Approval → Approved → Confirm Handover → Close
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: form.sr_status === "Pending Approval" ? 1 : 0.6 }}
                      onClick={onApprove}
                      disabled={form.sr_status !== "Pending Approval"}
                    >
                      Approve (Demo)
                    </button>

                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: "#E11D48", opacity: form.sr_status === "Pending Approval" ? 1 : 0.6 }}
                      onClick={onReject}
                      disabled={form.sr_status !== "Pending Approval"}
                    >
                      Reject (Demo)
                    </button>

                    <button
                      type="button"
                      className={outlineBtn}
                      onClick={onConfirmHandover}
                      disabled={form.sr_status !== "Approved"}
                    >
                      Confirm Handover (Demo)
                    </button>

                    <button
                      type="button"
                      className={outlineBtn}
                      onClick={onClose}
                      disabled={form.sr_status !== "Handover Confirmed"}
                    >
                      Close (Demo)
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className={labelBase}>
                      Last Remarks <span className={helperBase}>(Required for reject)</span>
                    </label>
                    <textarea
                      value={form.last_remarks}
                      onChange={(e) => setField("last_remarks", e.target.value)}
                      disabled={form.sr_status === "Closed"}
                      className={classNames(
                        inputBase,
                        "min-h-[110px] resize-y",
                        form.sr_status === "Closed" && "cursor-not-allowed bg-gray-50 dark:bg-white/5"
                      )}
                      placeholder="Approval / rejection / handover remarks..."
                    />
                  </div>

                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    After sending for approval, editing is locked (demo).
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Audit Details</h4>
                  <p className={helperBase}>System generated fields (read-only).</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        Approved By <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input readOnly value={form.approved_by} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Approved On <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input readOnly value={form.approved_on} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Handover Confirmed By <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.handover_confirmed_by}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Handover Confirmed On <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.handover_confirmed_on}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Totals:</span> {moneyINR(form.subtotal)} (Sub) • {moneyINR(form.tax.trim() ? Math.max(0, toNum(form.tax) || 0) : 0)} (Tax) •{" "}
                    {moneyINR(form.grand_total)} (Grand)
                  </div>

                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Next Enhancements:</span> Vendor email on handover, SR print, inventory linkage (blocked/quarantine).
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
          Save Draft
        </button>

        <button
          type="button"
          className={classNames(primaryBtn, "active:scale-95")}
          style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSendForApproval}
          disabled={isLocked}
        >
          Send for Approval
        </button>
      </div>
    </div>
  );
}
