"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Tabs */
type TabKey = "basic" | "items" | "receipt" | "attachments" | "status";

/** Enums */
type ReturnStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Received" | "Closed";
type Priority = "Low" | "Medium" | "High" | "Urgent" | "";
type ReturnType = "Damage Return" | "Wrong Item" | "Short Supply" | "Warranty Return" | "Other" | "";
type Department = "Stores" | "Operations" | "Maintenance" | "Finance" | "IT" | "Admin" | "Procurement" | "Sales";
type ReturnSource = "Invoice" | "Delivery" | "Sales Order" | "Other" | "";
type ReceiptAction = "Return to Vendor" | "Quarantine" | "Adjust in Next Delivery" | "Accept as Free Qty";

type ItemCondition = "Sealed" | "Open" | "Damaged" | "Used" | "Expired" | "Other";
type UOM = "Nos" | "Kg" | "Ltr" | "Box" | "Set" | "Meter";

type Currency = "INR" | "USD" | "EUR";
type AttachmentType = "Invoice Copy" | "Delivery Challan" | "Photos" | "Customer Email" | "Other";

/** Masters (demo) */
const DEPARTMENTS: Department[] = ["Sales", "Stores", "Operations", "Maintenance", "Finance", "IT", "Admin", "Procurement"];

const CUSTOMERS = [
  { id: "C-001", name: "Fortuna Retail (Vizag)", email: "vizag@fortunaretail.com", phone: "+91-90000-00001" },
  { id: "C-002", name: "Prime IT Park Canteen", email: "canteen@primeitpark.com", phone: "+91-90000-00002" },
  { id: "C-003", name: "Metro Supermarket", email: "stores@metromart.in", phone: "+91-90000-00003" },
  { id: "C-004", name: "City Hospital Stores", email: "purchase@cityhospital.org", phone: "+91-90000-00004" },
];

const SOURCES = [
  { type: "Invoice" as const, sampleRefs: ["INV-2026-0198", "INV-2026-0204"] },
  { type: "Delivery" as const, sampleRefs: ["DO-2026-0440", "DO-2026-0452"] },
  { type: "Sales Order" as const, sampleRefs: ["SO-2026-0309", "SO-2026-0330"] },
  { type: "Other" as const, sampleRefs: ["REF-OTHER-001"] },
];

const LOCATIONS = [
  { id: "RET-001", name: "Returns Bay - WH Vizag" },
  { id: "QRT-001", name: "Quarantine - WH Vizag" },
  { id: "RTV-001", name: "Return-to-Vendor Dock - WH Vizag" },
];

const CURRENCIES: Currency[] = ["INR", "USD", "EUR"];

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "items", label: "Return Items" },
  { key: "receipt", label: "Receipt & Action" },
  { key: "attachments", label: "Attachments & Notes" },
  { key: "status", label: "Status & Audit" },
];

/** Types */
type ReturnItemLine = {
  line_id: string; // system
  item_code: string; // optional
  item_description: string; // required
  uom: UOM; // required
  sold_qty: string; // optional numeric
  return_qty: string; // required numeric > 0
  unit_price: string; // optional numeric >= 0
  condition: ItemCondition; // required
  reason: string; // required min
  estimated_line_value: number; // system
  batch_no: string; // optional
  serial_no: string; // optional
};

type ReturnAttachment = {
  attachment_id: string;
  attachment_type: AttachmentType;
  attachment_file: File | null;
};

type CustomerReturnFormState = {
  /** System */
  cr_id: string;
  cr_number: string;
  cr_date: string;

  /** Basic */
  department: Department | "";
  created_by: string;
  priority: Priority;
  return_type: ReturnType;

  customer_id: string; // required
  customer_name: string; // system (from master)
  customer_email: string; // system
  customer_phone: string; // system

  source_type: ReturnSource; // required
  source_ref: string; // required
  customer_claim_date: string; // optional

  /** Items */
  items: ReturnItemLine[];

  /** Receipt & Action */
  expected_receipt_date: string; // optional
  received_date: string; // system when mark received (demo)
  receipt_location_id: string; // required for received posting
  receipt_action: ReceiptAction | ""; // required when received posting
  credit_note_required: boolean;
  replacement_required: boolean;

  currency: Currency;
  total_items: number; // system
  total_qty: number; // system
  estimated_return_value: number; // system

  /** Notes */
  internal_notes: string;
  customer_notes: string;

  /** Attachments */
  attachments: ReturnAttachment[];

  /** Workflow */
  approval_required: boolean;
  status: ReturnStatus;
  approver_role: string; // demo
  audit_comments: string;
  last_action_by: string;
  last_action_at: string;
};

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

function money(n: number, ccy: Currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${ccy} ${Math.round(n)}`;
  }
}

function isFutureOrToday(dateStr: string) {
  if (!dateStr) return false;
  const t = new Date(todayISO());
  const d = new Date(dateStr);
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() >= t.getTime();
}

const initialState: CustomerReturnFormState = {
  cr_id: "Auto-generated",
  cr_number: "Auto (CR-YYYY-SEQ)",
  cr_date: todayISO(),

  department: "Sales",
  created_by: "Logged-in user",
  priority: "Medium",
  return_type: "",

  customer_id: "",
  customer_name: "",
  customer_email: "",
  customer_phone: "",

  source_type: "",
  source_ref: "",
  customer_claim_date: "",

  items: [],

  expected_receipt_date: "",
  received_date: "",
  receipt_location_id: "",
  receipt_action: "",
  credit_note_required: true,
  replacement_required: false,

  currency: "INR",
  total_items: 0,
  total_qty: 0,
  estimated_return_value: 0,

  internal_notes: "",
  customer_notes: "",

  attachments: [],

  approval_required: true,
  status: "Draft",
  approver_role: "Sales Head",
  audit_comments: "System",
  last_action_by: "System",
  last_action_at: "System",
};

export default function CustomerReturnCreatePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<CustomerReturnFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** Lock editing after leaving Draft */
  const isLocked = form.status !== "Draft";

  /** Derived totals */
  const totals = useMemo(() => {
    const totalQty = form.items.reduce((s, l) => s + (Number(toNum(l.return_qty)) || 0), 0);
    const totalItems = form.items.length;
    const value = form.items.reduce((s, l) => s + (l.estimated_line_value || 0), 0);
    return { totalQty, totalItems, value };
  }, [form.items]);

  useEffect(() => {
    setForm((p) => ({
      ...p,
      total_items: totals.totalItems,
      total_qty: totals.totalQty,
      estimated_return_value: totals.value,
    }));
  }, [totals.totalItems, totals.totalQty, totals.value]);

  /** Validations */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // BASIC
    if (!form.department) e.department = "Department is required";
    if (!form.priority) e.priority = "Priority is required";
    if (!form.return_type) e.return_type = "Return Type is required";

    if (!form.customer_id) e.customer_id = "Customer is required";
    if (!form.source_type) e.source_type = "Source Type is required";
    if (!form.source_ref.trim()) e.source_ref = "Source Reference is required";

    if (form.customer_claim_date && !isFutureOrToday(form.customer_claim_date)) {
      // claim date can be past in real life; but for demo keeping future/today not necessary
      // so do not add error; leaving optional.
    }

    // ITEMS
    form.items.forEach((line, idx) => {
      const pfx = `item_${idx}_`;

      if (!line.item_description.trim()) e[pfx + "item_description"] = "Description is required";
      if (!line.uom) e[pfx + "uom"] = "UOM is required";

      if (!line.return_qty.trim()) e[pfx + "return_qty"] = "Return Qty is required";
      else {
        const q = toNum(line.return_qty);
        if (!Number.isFinite(q) || q <= 0) e[pfx + "return_qty"] = "Return Qty must be > 0";
      }

      if (line.sold_qty.trim()) {
        const sQty = toNum(line.sold_qty);
        if (!Number.isFinite(sQty) || sQty < 0) e[pfx + "sold_qty"] = "Sold Qty must be >= 0";
      }

      if (line.unit_price.trim()) {
        const p = toNum(line.unit_price);
        if (!Number.isFinite(p) || p < 0) e[pfx + "unit_price"] = "Unit Price must be >= 0";
      }

      if (!line.condition) e[pfx + "condition"] = "Condition is required";

      if (!line.reason.trim()) e[pfx + "reason"] = "Reason is required";
      else if (line.reason.trim().length < 5) e[pfx + "reason"] = "Min 5 characters";
    });

    // RECEIPT (only required for posting as Received)
    if (form.status === "Received") {
      if (!form.receipt_location_id) e.receipt_location_id = "Receipt Location is required";
      if (!form.receipt_action) e.receipt_action = "Receipt Action is required";
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof CustomerReturnFormState>(key: K, value: CustomerReturnFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const markTouched = (key: string) => {
    setTouched((p) => ({ ...p, [key]: true }));
  };

  const showError = (key: string) => Boolean(touched[key] && errors[key]);

  const firstErrorTab = () => {
    const order: TabKey[] = ["basic", "items", "receipt", "attachments", "status"];
    const basicKeys = ["department", "priority", "return_type", "customer_id", "source_type", "source_ref"];
    const itemErr = Object.keys(errors).some((k) => k.startsWith("item_"));
    const receiptKeys = ["receipt_location_id", "receipt_action"];

    for (const t of order) {
      if (t === "basic" && basicKeys.some((k) => errors[k])) return "basic";
      if (t === "items" && itemErr) return "items";
      if (t === "receipt" && receiptKeys.some((k) => errors[k])) return "receipt";
    }
    return "basic";
  };

  /** Customer auto-fill */
  const onSelectCustomer = (customerId: string) => {
    if (isLocked) return;
    const c = CUSTOMERS.find((x) => x.id === customerId);
    setForm((p) => ({
      ...p,
      customer_id: customerId,
      customer_name: c?.name ?? "",
      customer_email: c?.email ?? "",
      customer_phone: c?.phone ?? "",
    }));
  };

  /** Source helper */
  const refOptions = useMemo(() => {
    const s = SOURCES.find((x) => x.type === form.source_type);
    return s?.sampleRefs ?? [];
  }, [form.source_type]);

  /** Items helpers */
  const recalcLineValue = (line: ReturnItemLine) => {
    const q = toNum(line.return_qty);
    const p = line.unit_price.trim() ? toNum(line.unit_price) : 0;
    const qty = Number.isFinite(q) && q > 0 ? q : 0;
    const price = Number.isFinite(p) && p >= 0 ? p : 0;
    return qty * price;
  };

  const addItem = () => {
    if (isLocked) return;
    const newLine: ReturnItemLine = {
      line_id: uuidLike("CRITEM"),
      item_code: "",
      item_description: "",
      uom: "Nos",
      sold_qty: "",
      return_qty: "",
      unit_price: "",
      condition: "Sealed",
      reason: "",
      estimated_line_value: 0,
      batch_no: "",
      serial_no: "",
    };
    setForm((p) => ({ ...p, items: [...p.items, newLine] }));
    setActiveTab("items");
  };

  const updateItem = (idx: number, patch: Partial<ReturnItemLine>) => {
    if (isLocked) return;
    setForm((p) => {
      const next = [...p.items];
      const merged = { ...next[idx], ...patch };
      merged.estimated_line_value = recalcLineValue(merged);
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
      attachments: [
        ...p.attachments,
        { attachment_id: uuidLike("ATT"), attachment_type: "Invoice Copy", attachment_file: null },
      ],
    }));
  };

  const updateAttachment = (idx: number, patch: Partial<ReturnAttachment>) => {
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

  /** Touch all */
  const touchAll = () => {
    const next: Record<string, boolean> = { ...touched };

    ["department", "priority", "return_type", "customer_id", "source_type", "source_ref"].forEach((k) => (next[k] = true));

    form.items.forEach((_, idx) => {
      next[`item_${idx}_item_description`] = true;
      next[`item_${idx}_uom`] = true;
      next[`item_${idx}_sold_qty`] = true;
      next[`item_${idx}_return_qty`] = true;
      next[`item_${idx}_unit_price`] = true;
      next[`item_${idx}_condition`] = true;
      next[`item_${idx}_reason`] = true;
    });

    ["receipt_location_id", "receipt_action"].forEach((k) => (next[k] = true));

    setTouched(next);
  };

  /** Actions */
  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  const onSaveDraft = () => {
    console.log("Save Customer Return Draft:", form);
    alert("Saved Draft (demo). Next: connect API.");
  };

  const onSendForApproval = () => {
    if (isLocked) return;

    touchAll();

    if (form.items.length === 0) {
      setActiveTab("items");
      alert("Customer Return cannot be sent for approval without at least one item.");
      return;
    }

    if (hasErrors) {
      setActiveTab(firstErrorTab());
      alert("Please fix validation errors before sending for approval.");
      return;
    }

    setForm((p) => ({
      ...p,
      status: "Pending Approval",
      approval_required: true,
      last_action_by: p.created_by,
      last_action_at: todayISO(),
    }));
    setActiveTab("status");
    alert("Sent for approval (demo). Return is now locked.");
  };

  const onMarkApproved = () => {
    if (form.status !== "Pending Approval") return;
    setForm((p) => ({
      ...p,
      status: "Approved",
      last_action_by: "Approver (demo)",
      last_action_at: todayISO(),
    }));
    alert("Approved (demo). Now you can Receive & Post.");
  };

  const onMarkRejected = () => {
    if (form.status !== "Pending Approval") return;
    setForm((p) => ({
      ...p,
      status: "Rejected",
      last_action_by: "Approver (demo)",
      last_action_at: todayISO(),
    }));
    alert("Rejected (demo).");
  };

  const onPostReceived = () => {
    // allow posting only after Approved (or if approval not required)
    const canPost = form.status === "Approved" || (form.status === "Draft" && !form.approval_required);

    if (!canPost) {
      alert("To post receipt, status must be Approved (demo).");
      setActiveTab("status");
      return;
    }

    // Receipt validations
    setTouched((p) => ({ ...p, receipt_location_id: true, receipt_action: true }));

    const eLoc = !form.receipt_location_id;
    const eAct = !form.receipt_action;

    if (eLoc || eAct) {
      setActiveTab("receipt");
      alert("Please select Receipt Location and Receipt Action before posting.");
      return;
    }

    setForm((p) => ({
      ...p,
      status: "Received",
      received_date: todayISO(),
      last_action_by: p.created_by,
      last_action_at: todayISO(),
    }));
    setActiveTab("status");
    alert("Posted as Received (demo). Next: Close after settlement.");
  };

  const onCloseReturn = () => {
    if (form.status !== "Received") {
      alert("Close allowed only after Received (demo).");
      setActiveTab("status");
      return;
    }
    setForm((p) => ({
      ...p,
      status: "Closed",
      last_action_by: p.created_by,
      last_action_at: todayISO(),
    }));
    alert("Closed (demo).");
  };

  /** Header status pill */
  const statusPill = (s: ReturnStatus) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      s === "Pending Approval" && "bg-amber-100 text-amber-800",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600",
      s === "Received" && "bg-blue-100 text-blue-700",
      s === "Closed" && "bg-purple-100 text-purple-700"
    );

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Customer Returns" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Return (CR) Creation</h3>
          <p className={helperBase}>
            Flow: Draft → Send for Approval → Approved → Receive & Action → Close.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={statusPill(form.status)}>{form.status}</span>
            <span className="text-xs text-gray-500 dark:text-gray-300">
              Currency: <span className="font-semibold">{form.currency}</span>
            </span>
            {isLocked && (
              <span className="text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
                Locked: cannot edit after sending for approval.
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
                    CR ID <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.cr_id} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      CR Number <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.cr_number} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>
                      CR Date <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.cr_date} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
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
                      onChange={(e) => setField("priority", e.target.value as any)}
                      onBlur={() => markTouched("priority")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("priority") && "border-brand-500"
                      )}
                    >
                      <option value="">Select</option>
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
                    Return Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.return_type}
                    disabled={isLocked}
                    onChange={(e) => setField("return_type", e.target.value as any)}
                    onBlur={() => markTouched("return_type")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("return_type") && "border-brand-500"
                    )}
                  >
                    <option value="">Select</option>
                    <option value="Damage Return">Damage Return</option>
                    <option value="Wrong Item">Wrong Item</option>
                    <option value="Short Supply">Short Supply</option>
                    <option value="Warranty Return">Warranty Return</option>
                    <option value="Other">Other</option>
                  </select>
                  {showError("return_type") && <p className="mt-1 text-xs text-brand-500">{errors.return_type}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> Return source should match customer transaction (Invoice / Delivery / SO).
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Customer <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.customer_id}
                    disabled={isLocked}
                    onChange={(e) => onSelectCustomer(e.target.value)}
                    onBlur={() => markTouched("customer_id")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("customer_id") && "border-brand-500"
                    )}
                  >
                    <option value="">Select</option>
                    {CUSTOMERS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                  {showError("customer_id") && <p className="mt-1 text-xs text-brand-500">{errors.customer_id}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>Customer Email</label>
                    <input readOnly value={form.customer_email} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>Customer Phone</label>
                    <input readOnly value={form.customer_phone} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Source Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.source_type}
                    disabled={isLocked}
                    onChange={(e) => {
                      setField("source_type", e.target.value as any);
                      setField("source_ref", "");
                    }}
                    onBlur={() => markTouched("source_type")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("source_type") && "border-brand-500"
                    )}
                  >
                    <option value="">Select</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Sales Order">Sales Order</option>
                    <option value="Other">Other</option>
                  </select>
                  {showError("source_type") && <p className="mt-1 text-xs text-brand-500">{errors.source_type}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      Source Reference <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>

                    {refOptions.length > 0 ? (
                      <select
                        value={form.source_ref}
                        disabled={isLocked}
                        onChange={(e) => setField("source_ref", e.target.value)}
                        onBlur={() => markTouched("source_ref")}
                        className={classNames(
                          inputBase,
                          isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("source_ref") && "border-brand-500"
                        )}
                      >
                        <option value="">Select</option>
                        {refOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={form.source_ref}
                        disabled={isLocked}
                        onChange={(e) => setField("source_ref", e.target.value)}
                        onBlur={() => markTouched("source_ref")}
                        placeholder="Example: INV-2026-0198"
                        className={classNames(
                          inputBase,
                          isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("source_ref") && "border-brand-500"
                        )}
                      />
                    )}

                    {showError("source_ref") && <p className="mt-1 text-xs text-brand-500">{errors.source_ref}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      Customer Claim Date <span className={helperBase}>(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={form.customer_claim_date}
                      disabled={isLocked}
                      onChange={(e) => setField("customer_claim_date", e.target.value)}
                      className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                    <p className={classNames(helperBase, "mt-1")}>Date when customer raised return request.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={classNames(primaryBtn, "active:scale-95")}
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                    onClick={addItem}
                    disabled={isLocked}
                  >
                    + Add Return Item
                  </button>

                  <button type="button" className={classNames(outlineBtn, "active:scale-95")} onClick={() => setActiveTab("items")}>
                    Go to Return Items →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS */}
          {activeTab === "items" && (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Return Items Grid</h4>
                  <p className={helperBase}>Add multiple lines. Inline edit supported. Line value = Return Qty × Unit Price.</p>
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
                <table className="min-w-[1700px] w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Item Code</th>
                      <th className="px-4 py-3 text-left">Description *</th>
                      <th className="px-4 py-3 text-left">UOM *</th>
                      <th className="px-4 py-3 text-left">Sold Qty</th>
                      <th className="px-4 py-3 text-left">Return Qty *</th>
                      <th className="px-4 py-3 text-left">Unit Price</th>
                      <th className="px-4 py-3 text-left">Line Value</th>
                      <th className="px-4 py-3 text-left">Condition *</th>
                      <th className="px-4 py-3 text-left">Reason *</th>
                      <th className="px-4 py-3 text-left">Batch No</th>
                      <th className="px-4 py-3 text-left">Serial No</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {form.items.map((line, idx) => {
                      const k = (name: string) => `item_${idx}_${name}`;
                      return (
                        <tr key={line.line_id} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                          <td className="px-4 py-3">
                            <input
                              value={line.item_code}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { item_code: e.target.value })}
                              placeholder="SKU"
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
                                "min-w-[260px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("item_description")) && "border-brand-500"
                              )}
                            />
                            {showError(k("item_description")) && <p className="mt-1 text-xs text-brand-500">{errors[k("item_description")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={line.uom}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { uom: e.target.value as any })}
                              onBlur={() => markTouched(k("uom"))}
                              className={classNames(
                                inputBase,
                                "min-w-[120px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("uom")) && "border-brand-500"
                              )}
                            >
                              <option value="Nos">Nos</option>
                              <option value="Kg">Kg</option>
                              <option value="Ltr">Ltr</option>
                              <option value="Box">Box</option>
                              <option value="Set">Set</option>
                              <option value="Meter">Meter</option>
                            </select>
                            {showError(k("uom")) && <p className="mt-1 text-xs text-brand-500">{errors[k("uom")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.sold_qty}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { sold_qty: e.target.value.replace(/[^\d.]/g, "") })}
                              onBlur={() => markTouched(k("sold_qty"))}
                              placeholder="Optional"
                              className={classNames(
                                inputBase,
                                "min-w-[110px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("sold_qty")) && "border-brand-500"
                              )}
                            />
                            {showError(k("sold_qty")) && <p className="mt-1 text-xs text-brand-500">{errors[k("sold_qty")]}</p>}
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
                                "min-w-[110px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("return_qty")) && "border-brand-500"
                              )}
                            />
                            {showError(k("return_qty")) && <p className="mt-1 text-xs text-brand-500">{errors[k("return_qty")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.unit_price}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { unit_price: e.target.value.replace(/[^\d.]/g, "") })}
                              onBlur={() => markTouched(k("unit_price"))}
                              placeholder=">= 0"
                              className={classNames(
                                inputBase,
                                "min-w-[120px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("unit_price")) && "border-brand-500"
                              )}
                            />
                            {showError(k("unit_price")) && <p className="mt-1 text-xs text-brand-500">{errors[k("unit_price")]}</p>}
                          </td>

                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {money(line.estimated_line_value || 0, form.currency)}
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={line.condition}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { condition: e.target.value as any })}
                              onBlur={() => markTouched(k("condition"))}
                              className={classNames(
                                inputBase,
                                "min-w-[160px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("condition")) && "border-brand-500"
                              )}
                            >
                              <option value="Sealed">Sealed</option>
                              <option value="Open">Open</option>
                              <option value="Damaged">Damaged</option>
                              <option value="Used">Used</option>
                              <option value="Expired">Expired</option>
                              <option value="Other">Other</option>
                            </select>
                            {showError(k("condition")) && <p className="mt-1 text-xs text-brand-500">{errors[k("condition")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.reason}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { reason: e.target.value })}
                              onBlur={() => markTouched(k("reason"))}
                              placeholder="Reason (min 5 chars)"
                              className={classNames(
                                inputBase,
                                "min-w-[220px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("reason")) && "border-brand-500"
                              )}
                            />
                            {showError(k("reason")) && <p className="mt-1 text-xs text-brand-500">{errors[k("reason")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.batch_no}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { batch_no: e.target.value })}
                              placeholder="Optional"
                              className={classNames(inputBase, "min-w-[140px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.serial_no}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { serial_no: e.target.value })}
                              placeholder="Optional"
                              className={classNames(inputBase, "min-w-[140px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                            />
                          </td>

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
                        <td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No return items added. Click “+ Add Item” to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total Qty: <span className="font-semibold">{form.total_qty}</span> • Estimated Value:{" "}
                  <span className="font-semibold">{money(form.estimated_return_value, form.currency)}</span>
                </div>
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("receipt")}>
                  Next: Receipt & Action →
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Rule:</span> At least one item is required before sending for approval.
              </div>
            </div>
          )}

          {/* RECEIPT */}
          {activeTab === "receipt" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Receipt Plan</h4>
                  <p className={helperBase}>
                    When customer goods physically arrive, post as <span className="font-semibold">Received</span> with location + action.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        Expected Receipt Date <span className={helperBase}>(Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={form.expected_receipt_date}
                        disabled={isLocked}
                        onChange={(e) => setField("expected_receipt_date", e.target.value)}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>

                    <div>
                      <label className={labelBase}>Currency</label>
                      <select
                        value={form.currency}
                        disabled={isLocked}
                        onChange={(e) => setField("currency", e.target.value as any)}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-white/5">
                      <span className="text-sm text-gray-700 dark:text-gray-200">Credit Note Required</span>
                      <input
                        type="checkbox"
                        checked={form.credit_note_required}
                        disabled={isLocked}
                        onChange={(e) => setField("credit_note_required", e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-white/5">
                      <span className="text-sm text-gray-700 dark:text-gray-200">Replacement Required</span>
                      <input
                        type="checkbox"
                        checked={form.replacement_required}
                        disabled={isLocked}
                        onChange={(e) => setField("replacement_required", e.target.checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Tip:</span> If goods are damaged, choose <span className="font-semibold">Quarantine</span> and later decide disposal/RTV.
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Post Receipt (Demo)</h4>
                  <p className={helperBase}>
                    Enabled after <span className="font-semibold">Approved</span>. Will set status to <span className="font-semibold">Received</span>.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelBase}>
                        Receipt Location <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <select
                        value={form.receipt_location_id}
                        disabled={isLocked && form.status !== "Approved"}
                        onChange={(e) => setField("receipt_location_id", e.target.value)}
                        onBlur={() => markTouched("receipt_location_id")}
                        className={classNames(
                          inputBase,
                          (isLocked && form.status !== "Approved") && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("receipt_location_id") && "border-brand-500"
                        )}
                      >
                        <option value="">Select</option>
                        {LOCATIONS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.id})
                          </option>
                        ))}
                      </select>
                      {showError("receipt_location_id") && <p className="mt-1 text-xs text-brand-500">{errors.receipt_location_id}</p>}
                    </div>

                    <div>
                      <label className={labelBase}>
                        Receipt Action <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <select
                        value={form.receipt_action}
                        disabled={isLocked && form.status !== "Approved"}
                        onChange={(e) => setField("receipt_action", e.target.value as any)}
                        onBlur={() => markTouched("receipt_action")}
                        className={classNames(
                          inputBase,
                          (isLocked && form.status !== "Approved") && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("receipt_action") && "border-brand-500"
                        )}
                      >
                        <option value="">Select</option>
                        <option value="Quarantine">Quarantine</option>
                        <option value="Return to Vendor">Return to Vendor</option>
                        <option value="Adjust in Next Delivery">Adjust in Next Delivery</option>
                        <option value="Accept as Free Qty">Accept as Free Qty</option>
                      </select>
                      {showError("receipt_action") && <p className="mt-1 text-xs text-brand-500">{errors.receipt_action}</p>}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                      <span className="font-semibold">Receipt Action meanings:</span>
                      <ul className="mt-2 list-disc pl-4 space-y-1">
                        <li>
                          <span className="font-semibold">Quarantine:</span> hold stock separately until decision.
                        </li>
                        <li>
                          <span className="font-semibold">Return to Vendor:</span> if supplier pickup/credit process is required.
                        </li>
                        <li>
                          <span className="font-semibold">Adjust in Next Delivery:</span> agree to adjust in next dispatch.
                        </li>
                        <li>
                          <span className="font-semibold">Accept as Free Qty:</span> accept without charging (mutual agreement).
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={classNames(primaryBtn, "active:scale-95")}
                        style={{
                          backgroundColor: FORTUNA_SECONDARY_BLUE,
                          opacity: !(form.status === "Approved" || (form.status === "Draft" && !form.approval_required)) ? 0.6 : 1,
                        }}
                        onClick={onPostReceived}
                      >
                        Post as Received
                      </button>

                      <button type="button" className={outlineBtn} onClick={() => setActiveTab("attachments")}>
                        Next: Attachments & Notes →
                      </button>
                    </div>

                    {form.received_date && (
                      <div className="text-xs text-gray-500 dark:text-gray-300">
                        Received Date (system): <span className="font-semibold">{form.received_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Value Summary</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Items</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{form.total_items}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Qty</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{form.total_qty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Estimated Value</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{money(form.estimated_return_value, form.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Attachments & Notes</h4>
                  <p className={helperBase}>Upload supporting documents (invoice, DC, photos, customer email).</p>
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
                        onChange={(e) => updateAttachment(idx, { attachment_type: e.target.value as any })}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      >
                        <option value="Invoice Copy">Invoice Copy</option>
                        <option value="Delivery Challan">Delivery Challan</option>
                        <option value="Photos">Photos</option>
                        <option value="Customer Email">Customer Email</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-7 min-w-0">
                      <label className={labelBase}>
                        Attachment File <span className={helperBase}>(Optional PDF/JPG/PNG/DOC/XLS)</span>
                      </label>
                      <input
                        type="file"
                        disabled={isLocked}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf"
                        onChange={(e) => updateAttachment(idx, { attachment_file: e.target.files?.[0] ?? null })}
                        className={classNames(inputBase, "px-2 py-2", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                      {a.attachment_file && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                          Selected: <span className="font-semibold">{a.attachment_file.name}</span>
                        </p>
                      )}
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

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 min-w-0">
                <div>
                  <label className={labelBase}>
                    Customer Notes <span className={helperBase}>(Optional)</span>
                  </label>
                  <textarea
                    value={form.customer_notes}
                    disabled={isLocked}
                    onChange={(e) => setField("customer_notes", e.target.value)}
                    className={classNames(inputBase, "min-h-[120px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="What customer said / email summary"
                  />
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
                    placeholder="Notes for approvers / warehouse"
                  />
                </div>
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
              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Workflow Status</h4>
                  <p className={helperBase}>Draft / Pending Approval / Approved / Rejected / Received / Closed</p>

                  <div className="mt-4">
                    <label className={labelBase}>Status</label>
                    <input readOnly value={form.status} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Approval Required</label>
                      <select
                        value={form.approval_required ? "Yes" : "No"}
                        disabled={isLocked}
                        onChange={(e) => setField("approval_required", e.target.value === "Yes")}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                      <p className={classNames(helperBase, "mt-1")}>If No, you can post receipt directly from Draft (demo).</p>
                    </div>

                    <div>
                      <label className={labelBase}>Approver Role (demo)</label>
                      <input
                        value={form.approver_role}
                        disabled={isLocked}
                        onChange={(e) => setField("approver_role", e.target.value)}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                        placeholder="Sales Head / Finance"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: form.status === "Pending Approval" ? 1 : 0.6 }}
                      onClick={onMarkApproved}
                      disabled={form.status !== "Pending Approval"}
                    >
                      Approve (demo)
                    </button>

                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: form.status === "Pending Approval" ? 1 : 0.6 }}
                      onClick={onMarkRejected}
                      disabled={form.status !== "Pending Approval"}
                    >
                      Reject (demo)
                    </button>

                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: form.status === "Received" ? 1 : 0.6 }}
                      onClick={onCloseReturn}
                      disabled={form.status !== "Received"}
                    >
                      Close Return
                    </button>

                    <button type="button" className={outlineBtn} onClick={() => setActiveTab("receipt")}>
                      Go to Receipt & Action →
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> In future integration, approvals can sync from external ERP.
                  </div>
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Audit Details</h4>
                  <p className={helperBase}>System generated fields (read-only).</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        CR Date <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input readOnly value={form.cr_date} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Created By <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input readOnly value={form.created_by} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>

                    <div>
                      <label className={labelBase}>Last Action By</label>
                      <input readOnly value={form.last_action_by} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>

                    <div>
                      <label className={labelBase}>Last Action At</label>
                      <input readOnly value={form.last_action_at} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelBase}>Audit Comments</label>
                    <textarea
                      readOnly
                      value={form.audit_comments}
                      className={classNames(inputBase, "min-h-[110px] cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Tip:</span> Keep attachments + notes to make return audit-ready.
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
