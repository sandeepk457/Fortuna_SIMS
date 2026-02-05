"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Tabs */
type TabKey = "basic" | "po" | "items" | "qc" | "batch" | "attachments" | "posting";

/** Enums */
type ReceiptType = "Full" | "Partial" | "";
type GRNStatus = "Draft" | "QC Pending" | "Posted" | "Rejected";
type QCStatus = "Pending" | "Passed" | "Failed";
type AttachmentType = "DC" | "Invoice" | "Photo" | "Other";

type ExcessDisposition = "" | "Quarantine" | "Return to Vendor" | "Adjust in Next PO" | "Accept as Free Qty";

type Currency = "INR" | "USD" | "EUR";

/** Demo masters */
const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH", address: "Vizag, Andhra Pradesh, India" },
  { id: "WH-002", name: "Hyderabad WH", address: "Hyderabad, Telangana, India" },
  { id: "WH-003", name: "Chennai WH", address: "Chennai, Tamil Nadu, India" },
];

const QUARANTINE_LOCATION = {
  warehouse_id: "WH-002",
  bin: "QUARANTINE",
};

const DEMO_POS = [
  {
    po_id: "PO-UID-001",
    po_number: "PO-2026-00021",
    po_date: "2026-02-03",
    po_status: "Issued",
    vendor_id: "V-001",
    vendor_name: "Sri Lakshmi Suppliers",
    items: [
      {
        po_item_id: "POITEM-1001",
        item_id: "SKU-BOX-5PLY",
        item_description: "Corrugated Box (5-ply)",
        uom: "Nos",
        ordered_qty: 200,
        previously_received_qty: 150,
      },
      {
        po_item_id: "POITEM-1002",
        item_id: "SKU-BUBBLE-L",
        item_description: "Bubble Wrap Roll (Large)",
        uom: "Box",
        ordered_qty: 20,
        previously_received_qty: 0,
      },
    ],
    currency: "INR" as Currency,
    delivery_location: "WH-002",
  },
  {
    po_id: "PO-UID-002",
    po_number: "PO-2026-00022",
    po_date: "2026-02-04",
    po_status: "Issued",
    vendor_id: "V-002",
    vendor_name: "Aparna Packaging",
    items: [
      {
        po_item_id: "POITEM-2001",
        item_id: "SKU-TAPE-2IN",
        item_description: "Packaging Tape 2 inch",
        uom: "Roll",
        ordered_qty: 100,
        previously_received_qty: 0,
      },
    ],
    currency: "INR" as Currency,
    delivery_location: "WH-001",
  },
];

/** Types */
type GRNItemLine = {
  grn_item_id: string; // system
  po_item_id: string; // read-only ref
  item_id: string; // read-only
  item_description: string; // read-only
  uom: string; // read-only

  ordered_qty: number; // read-only
  previously_received_qty: number; // system
  received_qty: string; // user input >= 0

  // ✅ NEW: computed split (system)
  accepted_qty: number; // min(received, remaining)
  excess_qty: number; // max(received - accepted, 0)
  balance_qty: number; // remaining after accepted

  // ✅ NEW: disposition required if excess_qty > 0 (before posting)
  excess_disposition: ExcessDisposition;

  // optional
  rejected_qty: string; // optional; if provided must be <= accepted (simple demo)
};

type QCBlock = {
  qc_required: boolean; // system (from item master) - demo toggle
  qc_status: QCStatus; // Pending/Passed/Failed
  qc_checked_by: string; // conditional
  qc_date: string; // conditional
  qc_remarks: string; // optional
};

type BatchRow = {
  id: string;
  po_item_id: string;
  item_id: string;
  batch_number: string; // conditional
  serial_number: string; // conditional
  manufacturing_date: string;
  expiry_date: string;
  lot_quantity: string; // conditional decimal
};

type GRNAttachment = {
  attachment_id: string;
  attachment_type: AttachmentType;
  attachment_file: File | null;
};

type GRNFormState = {
  /** Basic */
  grn_id: string; // system
  grn_number: string; // system
  grn_date: string; // system
  received_by: string; // logged-in user
  receipt_type: ReceiptType; // required
  grn_status: GRNStatus; // system-driven
  posting_date: string; // system on post

  /** PO & Vendor reference */
  po_id: string; // required
  po_number: string; // system
  po_date: string; // system
  vendor_id: string; // system
  vendor_name: string; // system
  delivery_challan_no: string; // optional
  invoice_reference: string; // optional

  /** Items */
  items: GRNItemLine[];

  /** QC */
  qc: QCBlock;

  /** Batch/Serial/Expiry */
  batch_control_enabled: boolean; // demo
  batches: BatchRow[];

  /** Attachments */
  attachments: GRNAttachment[];
  internal_remarks: string; // optional
  rejection_reason: string; // conditional if Reject

  /** Posting summary (computed) */
  inventory_update_ready: boolean; // system
  currency: Currency; // from PO
  delivery_location: string; // from PO
  delivery_address: string; // from WH
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "GRN Basic Info" },
  { key: "po", label: "PO & Vendor Reference" },
  { key: "items", label: "Item Receipt Details" },
  { key: "qc", label: "Quality Check (QC)" },
  { key: "batch", label: "Batch / Serial / Expiry" },
  { key: "attachments", label: "Attachments & Remarks" },
  { key: "posting", label: "Posting & Inventory Update" },
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
    return `₹${n.toFixed(2)}`;
  }
}

function safeNonNegNumberFromString(v: string) {
  if (!v?.trim()) return 0;
  const n = toNum(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/** ✅ NEW core split logic */
function computeReceiptSplit(ordered: number, prev: number, receivedNow: number) {
  const remaining = Math.max(0, ordered - prev);
  const accepted = Math.min(receivedNow, remaining);
  const excess = Math.max(0, receivedNow - accepted);
  const balance = Math.max(0, ordered - (prev + accepted));
  return { remaining, accepted, excess, balance };
}

const initialState: GRNFormState = {
  grn_id: "Auto-generated",
  grn_number: "Auto (GRN-YYYY-SEQ)",
  grn_date: todayISO(),
  received_by: "Logged-in user",
  receipt_type: "",
  grn_status: "Draft",
  posting_date: "",

  po_id: "",
  po_number: "",
  po_date: "",
  vendor_id: "",
  vendor_name: "",
  delivery_challan_no: "",
  invoice_reference: "",

  items: [],

  qc: {
    qc_required: true, // demo default ON
    qc_status: "Pending",
    qc_checked_by: "",
    qc_date: "",
    qc_remarks: "",
  },

  batch_control_enabled: false,
  batches: [],

  attachments: [],
  internal_remarks: "",
  rejection_reason: "",

  inventory_update_ready: false,
  currency: "INR",
  delivery_location: "",
  delivery_address: "",
};

export default function GRNCreatePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<GRNFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** Lock edit after Posting/Reject */
  const isLocked = form.grn_status === "Posted" || form.grn_status === "Rejected";

  const markTouched = (k: string) => setTouched((p) => ({ ...p, [k]: true }));
  const showError = (k: string) => Boolean(touched[k] && errors[k]);

  const setField = <K extends keyof GRNFormState>(key: K, value: GRNFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  /** When PO is selected -> hydrate PO/vendor/items */
  const onSelectPO = (poId: string) => {
    if (isLocked) return;

    const po = DEMO_POS.find((x) => x.po_id === poId);
    if (!po) {
      setForm((p) => ({
        ...p,
        po_id: "",
        po_number: "",
        po_date: "",
        vendor_id: "",
        vendor_name: "",
        items: [],
        currency: "INR",
        delivery_location: "",
        delivery_address: "",
      }));
      return;
    }

    const wh = WAREHOUSES.find((w) => w.id === po.delivery_location);

    const items: GRNItemLine[] = po.items.map((it) => {
      const receivedNow = 0;
      const split = computeReceiptSplit(it.ordered_qty, it.previously_received_qty, receivedNow);
      return {
        grn_item_id: uuidLike("GRNITEM"),
        po_item_id: it.po_item_id,
        item_id: it.item_id,
        item_description: it.item_description,
        uom: it.uom,

        ordered_qty: it.ordered_qty,
        previously_received_qty: it.previously_received_qty,
        received_qty: "",

        accepted_qty: split.accepted,
        excess_qty: split.excess,
        balance_qty: split.balance,

        excess_disposition: "",

        rejected_qty: "",
      };
    });

    setForm((p) => ({
      ...p,
      po_id: po.po_id,
      po_number: po.po_number,
      po_date: po.po_date,
      vendor_id: po.vendor_id,
      vendor_name: po.vendor_name,
      currency: po.currency,
      delivery_location: po.delivery_location,
      delivery_address: wh?.address ?? "",
      items,
    }));

    setActiveTab("items");
  };

  /** ✅ Update received qty and recompute accepted/excess/balance */
  const updateItem = (idx: number, patch: Partial<GRNItemLine>) => {
    if (isLocked) return;

    setForm((p) => {
      const next = [...p.items];
      const merged = { ...next[idx], ...patch };

      // sanitize received
      if (typeof patch.received_qty === "string") {
        merged.received_qty = patch.received_qty.replace(/[^\d.]/g, "");
      }
      if (typeof patch.rejected_qty === "string") {
        merged.rejected_qty = patch.rejected_qty.replace(/[^\d.]/g, "");
      }

      const receivedNowNum = safeNonNegNumberFromString(merged.received_qty);
      const receivedNow = Number.isFinite(receivedNowNum) ? receivedNowNum : 0;

      const split = computeReceiptSplit(merged.ordered_qty, merged.previously_received_qty, receivedNow);
      merged.accepted_qty = split.accepted;
      merged.excess_qty = split.excess;
      merged.balance_qty = split.balance;

      // If no excess, clear disposition (optional)
      if (merged.excess_qty === 0) merged.excess_disposition = "";

      // If rejected_qty > accepted, clamp in demo
      const rejNum = safeNonNegNumberFromString(merged.rejected_qty);
      if (Number.isFinite(rejNum)) {
        if (rejNum > merged.accepted_qty) merged.rejected_qty = String(merged.accepted_qty);
      }

      next[idx] = merged;
      return { ...p, items: next };
    });
  };

  /** Attachments */
  const addAttachment = () => {
    if (isLocked) return;
    setForm((p) => ({
      ...p,
      attachments: [
        ...p.attachments,
        { attachment_id: uuidLike("ATT"), attachment_type: "DC", attachment_file: null },
      ],
    }));
  };

  const updateAttachment = (idx: number, patch: Partial<GRNAttachment>) => {
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

  /** Batch rows (demo) */
  const addBatchRow = (po_item_id: string, item_id: string) => {
    if (isLocked) return;
    setForm((p) => ({
      ...p,
      batches: [
        ...p.batches,
        {
          id: uuidLike("BATCH"),
          po_item_id,
          item_id,
          batch_number: "",
          serial_number: "",
          manufacturing_date: "",
          expiry_date: "",
          lot_quantity: "",
        },
      ],
    }));
  };

  const updateBatchRow = (idx: number, patch: Partial<BatchRow>) => {
    if (isLocked) return;
    setForm((p) => {
      const next = [...p.batches];
      next[idx] = { ...next[idx], ...patch };
      return { ...p, batches: next };
    });
  };

  const removeBatchRow = (idx: number) => {
    if (isLocked) return;
    setForm((p) => ({ ...p, batches: p.batches.filter((_, i) => i !== idx) }));
  };

  /** Derived: totals for posting summary */
  const postingSummary = useMemo(() => {
    const acceptedTotal = form.items.reduce((s, x) => s + (Number(x.accepted_qty) || 0), 0);
    const excessTotal = form.items.reduce((s, x) => s + (Number(x.excess_qty) || 0), 0);
    const anyExcess = form.items.some((x) => (Number(x.excess_qty) || 0) > 0);

    const missingDisposition = form.items.some(
      (x) => (Number(x.excess_qty) || 0) > 0 && !x.excess_disposition
    );

    // QC gate (demo)
    const qcGate =
      form.qc.qc_required ? form.qc.qc_status === "Passed" : true;

    // Have at least one received (either accepted or excess) to post
    const anyReceivedNow = form.items.some((x) => {
      const r = safeNonNegNumberFromString(x.received_qty);
      return Number.isFinite(r) && r > 0;
    });

    return {
      acceptedTotal,
      excessTotal,
      anyExcess,
      missingDisposition,
      qcGate,
      anyReceivedNow,
    };
  }, [form.items, form.qc.qc_required, form.qc.qc_status]);

  /** Validations */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.receipt_type) e.receipt_type = "Receipt Type is required";
    if (!form.po_id) e.po_id = "PO selection is required";

    // Items validations
    form.items.forEach((line, idx) => {
      const k = (name: string) => `item_${idx}_${name}`;

      const receivedNowNum = safeNonNegNumberFromString(line.received_qty);
      if (line.received_qty.trim()) {
        if (!Number.isFinite(receivedNowNum) || receivedNowNum < 0) e[k("received_qty")] = "Received qty must be >= 0";
      } else {
        // allow blank, but for posting we check anyReceivedNow; still show optional hint only
      }

      const rejNum = safeNonNegNumberFromString(line.rejected_qty);
      if (line.rejected_qty.trim()) {
        if (!Number.isFinite(rejNum) || rejNum < 0) e[k("rejected_qty")] = "Rejected qty must be >= 0";
        else if (rejNum > line.accepted_qty) e[k("rejected_qty")] = "Rejected qty cannot exceed Accepted qty";
      }

      // ✅ NEW: if excess exists, disposition required (to post, but we can still mark field error)
      if ((Number(line.excess_qty) || 0) > 0 && !line.excess_disposition) {
        e[k("excess_disposition")] = "Select Excess Handling";
      }
    });

    // QC validations
    if (form.qc.qc_required) {
      if (form.qc.qc_status === "Passed" || form.qc.qc_status === "Failed") {
        if (!form.qc.qc_checked_by.trim()) e.qc_checked_by = "QC Checked By is required";
        if (!form.qc.qc_date.trim()) e.qc_date = "QC Date is required";
      }
    }

    // Reject requires reason
    if (form.grn_status === "Rejected" && !form.rejection_reason.trim()) {
      e.rejection_reason = "Rejection reason is mandatory";
    }

    return e;
  }, [form]);

  const touchAll = () => {
    const next: Record<string, boolean> = { ...touched };
    next.receipt_type = true;
    next.po_id = true;
    form.items.forEach((_, idx) => {
      next[`item_${idx}_received_qty`] = true;
      next[`item_${idx}_rejected_qty`] = true;
      next[`item_${idx}_excess_disposition`] = true;
    });
    next.qc_checked_by = true;
    next.qc_date = true;
    next.rejection_reason = true;
    setTouched(next);
  };

  /** Actions */
  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  const onSaveDraft = () => {
    console.log("Save Draft GRN:", form);
    alert("Saved Draft (demo). Next: connect API.");
  };

  const onSendToQC = () => {
    if (isLocked) return;
    touchAll();

    if (!form.po_id) {
      setActiveTab("po");
      alert("Select PO first.");
      return;
    }
    if (!form.receipt_type) {
      setActiveTab("basic");
      alert("Select Receipt Type.");
      return;
    }
    if (!postingSummary.anyReceivedNow) {
      setActiveTab("items");
      alert("Enter received qty for at least one item.");
      return;
    }

    // If QC required, move to QC Pending
    if (form.qc.qc_required) {
      setForm((p) => ({ ...p, grn_status: "QC Pending" }));
      setActiveTab("qc");
      alert("Moved to QC Pending (demo). Please complete QC.");
      return;
    }

    alert("QC not required. Go to Posting tab to post GRN.");
    setActiveTab("posting");
  };

  const onRejectGRN = () => {
    if (isLocked) return;
    markTouched("rejection_reason");
    if (!form.rejection_reason.trim()) {
      setActiveTab("attachments");
      alert("Enter Rejection Reason to reject GRN.");
      return;
    }
    setForm((p) => ({ ...p, grn_status: "Rejected" }));
    setActiveTab("posting");
    alert("GRN Rejected (demo).");
  };

  /** ✅ Posting (with NEW excess handling enforcement) */
  const onPostGRN = () => {
    if (isLocked) return;
    touchAll();

    if (!form.po_id) {
      setActiveTab("po");
      alert("Select PO first.");
      return;
    }
    if (!form.receipt_type) {
      setActiveTab("basic");
      alert("Select Receipt Type.");
      return;
    }
    if (!postingSummary.anyReceivedNow) {
      setActiveTab("items");
      alert("Enter received qty for at least one item.");
      return;
    }

    // QC gate
    if (form.qc.qc_required && form.qc.qc_status !== "Passed") {
      setActiveTab("qc");
      alert("QC must be Passed before posting.");
      return;
    }

    // ✅ NEW: If excess exists, disposition must be selected per line
    if (postingSummary.missingDisposition) {
      setActiveTab("items");
      alert("Select Excess Handling option for all lines having Excess qty.");
      return;
    }

    // Basic numeric sanity (optional)
    const anyInvalid = Object.keys(errors).length > 0;
    if (anyInvalid) {
      // bring to first likely tab
      setActiveTab("items");
      alert("Please fix validation errors before posting.");
      return;
    }

    // Mark posted
    setForm((p) => ({
      ...p,
      grn_status: "Posted",
      posting_date: todayISO(),
      inventory_update_ready: true,
    }));

    setActiveTab("posting");
    alert("GRN Posted (demo). Inventory update triggered.");
  };

  /** UI computed for items table */
  const statusPill = (s: GRNStatus) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      s === "QC Pending" && "bg-amber-100 text-amber-800",
      s === "Posted" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600"
    );

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Goods Receipt Note (GRN)" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GRN Creation</h3>
          <p className={helperBase}>
            Step 1: Select Issued PO → Step 2: Receive Qty → Step 3: QC (if required) → Step 4: Excess handling →
            Post & Update Inventory.
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className={statusPill(form.grn_status)}>{form.grn_status}</span>
            {form.posting_date && (
              <span className="text-xs text-gray-500 dark:text-gray-300">Posted On: {form.posting_date}</span>
            )}
          </div>

          {isLocked && (
            <p className="mt-2 text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
              Locked: GRN cannot be edited after Posted/Rejected.
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
            onClick={onSendToQC}
            disabled={isLocked}
          >
            Send to QC / Next
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
                    GRN ID <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.grn_id} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      GRN Number <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.grn_number} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>
                      GRN Date <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.grn_date} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Received By <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.received_by} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Receipt Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.receipt_type}
                    disabled={isLocked}
                    onChange={(e) => setField("receipt_type", e.target.value as ReceiptType)}
                    onBlur={() => markTouched("receipt_type")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("receipt_type") && "border-brand-500"
                    )}
                  >
                    <option value="">Select</option>
                    <option value="Full">Full</option>
                    <option value="Partial">Partial</option>
                  </select>
                  {showError("receipt_type") && <p className="mt-1 text-xs text-brand-500">{errors.receipt_type}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <div className="font-semibold">Over-Receipt Handling (Enabled)</div>
                  <div className="mt-1">
                    If received qty exceeds ordered remaining, system will create <b>Excess Qty</b> and you must choose how to handle it
                    during posting: <b>Quarantine / Return / Adjust Next PO / Free Qty</b>.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("po")}>
                    Next: Select PO →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PO */}
          {activeTab === "po" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Select Issued PO <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.po_id}
                    disabled={isLocked}
                    onChange={(e) => {
                      onSelectPO(e.target.value);
                      markTouched("po_id");
                    }}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("po_id") && "border-brand-500"
                    )}
                  >
                    <option value="">Select</option>
                    {DEMO_POS.map((p) => (
                      <option key={p.po_id} value={p.po_id}>
                        {p.po_number} • {p.vendor_name}
                      </option>
                    ))}
                  </select>
                  {showError("po_id") && <p className="mt-1 text-xs text-brand-500">{errors.po_id}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>PO Number (System)</label>
                    <input readOnly value={form.po_number} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>PO Date (System)</label>
                    <input readOnly value={form.po_date} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Vendor ID (System)</label>
                    <input readOnly value={form.vendor_id} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>Vendor Name (System)</label>
                    <input readOnly value={form.vendor_name} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      Delivery Challan No <span className={helperBase}>(Optional)</span>
                    </label>
                    <input
                      value={form.delivery_challan_no}
                      disabled={isLocked}
                      onChange={(e) => setField("delivery_challan_no", e.target.value)}
                      placeholder="Vendor DC number"
                      className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>
                      Invoice Reference <span className={helperBase}>(Optional)</span>
                    </label>
                    <input
                      value={form.invoice_reference}
                      disabled={isLocked}
                      onChange={(e) => setField("invoice_reference", e.target.value)}
                      placeholder="Vendor invoice no"
                      className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Delivery Location (System)</label>
                  <input readOnly value={form.delivery_location} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div>
                  <label className={labelBase}>Delivery Address (System)</label>
                  <textarea
                    readOnly
                    value={form.delivery_address}
                    className={classNames(inputBase, "min-h-[90px] cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("items")}>
                    Next: Items →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS */}
          {activeTab === "items" && (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">PO Items Grid</h4>
                  <p className={helperBase}>
                    Enter received qty (can exceed ordered remaining). System will split into Accepted vs Excess. If Excess exists, select handling.
                  </p>
                </div>
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("qc")}>
                  Next: QC →
                </button>
              </div>

              <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[1600px] w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-left">UOM</th>
                      <th className="px-4 py-3 text-left">Ordered</th>
                      <th className="px-4 py-3 text-left">Prev. Received</th>
                      <th className="px-4 py-3 text-left">Ordered Remaining</th>
                      <th className="px-4 py-3 text-left">Received Now</th>
                      <th className="px-4 py-3 text-left">Accepted Qty (PO)</th>
                      <th className="px-4 py-3 text-left">Excess Qty</th>
                      <th className="px-4 py-3 text-left">Excess Handling *</th>
                      <th className="px-4 py-3 text-left">Rejected Qty (opt)</th>
                      <th className="px-4 py-3 text-left">Balance Qty</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {form.items.map((line, idx) => {
                      const k = (name: string) => `item_${idx}_${name}`;
                      const receivedNowNum = safeNonNegNumberFromString(line.received_qty);
                      const receivedNowOk = !line.received_qty.trim() || Number.isFinite(receivedNowNum);

                      const remaining = Math.max(0, line.ordered_qty - line.previously_received_qty);
                      const hasExcess = (Number(line.excess_qty) || 0) > 0;

                      return (
                        <tr key={line.grn_item_id} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 align-top">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white">{line.item_description}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                              {line.item_id} • PO Item: {line.po_item_id}
                            </div>
                          </td>

                          <td className="px-4 py-3">{line.uom}</td>
                          <td className="px-4 py-3 font-semibold">{line.ordered_qty}</td>
                          <td className="px-4 py-3">{line.previously_received_qty}</td>
                          <td className="px-4 py-3">{remaining}</td>

                          <td className="px-4 py-3">
                            <input
                              value={line.received_qty}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { received_qty: e.target.value })}
                              onBlur={() => markTouched(k("received_qty"))}
                              placeholder=">= 0"
                              className={classNames(
                                inputBase,
                                "min-w-[140px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                (!receivedNowOk || showError(k("received_qty"))) && "border-brand-500"
                              )}
                            />
                            {showError(k("received_qty")) && <p className="mt-1 text-xs text-brand-500">{errors[k("received_qty")]}</p>}

                            {hasExcess && (
                              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-white/5 dark:border-gray-800 dark:text-amber-200">
                                Excess detected: <b>{line.excess_qty}</b> will be handled as per selected option.
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{line.accepted_qty}</td>

                          <td className="px-4 py-3">
                            <span className={classNames("font-semibold", hasExcess ? "text-amber-800 dark:text-amber-200" : "text-gray-700 dark:text-gray-200")}>
                              {line.excess_qty}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={line.excess_disposition}
                              disabled={isLocked || !hasExcess}
                              onChange={(e) => updateItem(idx, { excess_disposition: e.target.value as ExcessDisposition })}
                              onBlur={() => markTouched(k("excess_disposition"))}
                              className={classNames(
                                inputBase,
                                "min-w-[220px]",
                                (isLocked || !hasExcess) && "cursor-not-allowed bg-gray-50 dark:bg-white/5 opacity-70",
                                showError(k("excess_disposition")) && hasExcess && "border-brand-500"
                              )}
                            >
                              <option value="">
                                {hasExcess ? "Select option" : "Not applicable"}
                              </option>
                              <option value="Quarantine">Quarantine</option>
                              <option value="Return to Vendor">Return to Vendor</option>
                              <option value="Adjust in Next PO">Adjust in Next PO</option>
                              <option value="Accept as Free Qty">Accept as Free Qty</option>
                            </select>
                            {showError(k("excess_disposition")) && hasExcess && (
                              <p className="mt-1 text-xs text-brand-500">{errors[k("excess_disposition")]}</p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.rejected_qty}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { rejected_qty: e.target.value })}
                              onBlur={() => markTouched(k("rejected_qty"))}
                              placeholder="Optional"
                              className={classNames(
                                inputBase,
                                "min-w-[140px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("rejected_qty")) && "border-brand-500"
                              )}
                            />
                            {showError(k("rejected_qty")) && <p className="mt-1 text-xs text-brand-500">{errors[k("rejected_qty")]}</p>}
                            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                              (Demo rule) Rejected ≤ Accepted
                            </div>
                          </td>

                          <td className="px-4 py-3">{line.balance_qty}</td>
                        </tr>
                      );
                    })}

                    {form.items.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          Select a PO first to load items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300 lg:col-span-2">
                  <span className="font-semibold">Rule (Updated):</span> Over-receipt is allowed. Excess qty must be assigned a handling option before Posting.
                  <div className="mt-2">
                    <b>Accepted Qty</b> updates PO receipt progress. <b>Excess Qty</b> will not update PO (Phase-1 demo) and will follow selected handling.
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Quick Totals</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Accepted Total</span>
                      <span className="font-semibold">{postingSummary.acceptedTotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Excess Total</span>
                      <span className="font-semibold">{postingSummary.excessTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("qc")}>
                  Next: QC →
                </button>
              </div>
            </div>
          )}

          {/* QC */}
          {activeTab === "qc" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">QC Requirement</h4>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={form.qc.qc_required}
                        disabled={isLocked}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            qc: {
                              ...p.qc,
                              qc_required: e.target.checked,
                              qc_status: e.target.checked ? "Pending" : "Passed",
                            },
                          }))
                        }
                      />
                      QC Required
                    </label>
                  </div>

                  <p className={helperBase}>If QC required, Posting allowed only after QC Passed.</p>

                  <div className="mt-4">
                    <label className={labelBase}>QC Status</label>
                    <select
                      value={form.qc.qc_status}
                      disabled={isLocked || !form.qc.qc_required}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          qc: { ...p.qc, qc_status: e.target.value as QCStatus },
                        }))
                      }
                      className={classNames(
                        inputBase,
                        (!form.qc.qc_required || isLocked) && "cursor-not-allowed bg-gray-50 dark:bg-white/5 opacity-70"
                      )}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        QC Checked By {form.qc.qc_required && (form.qc.qc_status === "Passed" || form.qc.qc_status === "Failed") ? (
                          <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                        ) : null}
                      </label>
                      <input
                        value={form.qc.qc_checked_by}
                        disabled={isLocked || !form.qc.qc_required}
                        onChange={(e) => setForm((p) => ({ ...p, qc: { ...p.qc, qc_checked_by: e.target.value } }))}
                        onBlur={() => markTouched("qc_checked_by")}
                        placeholder="QC Inspector"
                        className={classNames(
                          inputBase,
                          (!form.qc.qc_required || isLocked) && "cursor-not-allowed bg-gray-50 dark:bg-white/5 opacity-70",
                          showError("qc_checked_by") && "border-brand-500"
                        )}
                      />
                      {showError("qc_checked_by") && <p className="mt-1 text-xs text-brand-500">{errors.qc_checked_by}</p>}
                    </div>

                    <div>
                      <label className={labelBase}>
                        QC Date {form.qc.qc_required && (form.qc.qc_status === "Passed" || form.qc.qc_status === "Failed") ? (
                          <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                        ) : null}
                      </label>
                      <input
                        type="date"
                        value={form.qc.qc_date}
                        disabled={isLocked || !form.qc.qc_required}
                        onChange={(e) => setForm((p) => ({ ...p, qc: { ...p.qc, qc_date: e.target.value } }))}
                        onBlur={() => markTouched("qc_date")}
                        className={classNames(
                          inputBase,
                          (!form.qc.qc_required || isLocked) && "cursor-not-allowed bg-gray-50 dark:bg-white/5 opacity-70",
                          showError("qc_date") && "border-brand-500"
                        )}
                      />
                      {showError("qc_date") && <p className="mt-1 text-xs text-brand-500">{errors.qc_date}</p>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelBase}>QC Remarks (Optional)</label>
                    <textarea
                      value={form.qc.qc_remarks}
                      disabled={isLocked || !form.qc.qc_required}
                      onChange={(e) => setForm((p) => ({ ...p, qc: { ...p.qc, qc_remarks: e.target.value } }))}
                      className={classNames(
                        inputBase,
                        "min-h-[90px] resize-y",
                        (!form.qc.qc_required || isLocked) && "cursor-not-allowed bg-gray-50 dark:bg-white/5 opacity-70"
                      )}
                      placeholder="Inspection notes..."
                    />
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Rule:</span> If QC Required → Posting only after QC Passed.
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Next Actions</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Excess Handling Completed</span>
                      <span className="font-semibold">{postingSummary.missingDisposition ? "No" : "Yes"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">QC Gate</span>
                      <span className="font-semibold">{postingSummary.qcGate ? "OK" : "Pending"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className={outlineBtn} onClick={() => setActiveTab("attachments")}>
                      Next: Attachments →
                    </button>
                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
                      onClick={onRejectGRN}
                      disabled={isLocked}
                    >
                      Reject GRN
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Tip:</span> After QC Passed, go to Posting tab to post.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BATCH */}
          {activeTab === "batch" && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Batch / Serial / Expiry (Optional)</h4>
                  <p className={helperBase}>Enable for traceable items (demo toggle).</p>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={form.batch_control_enabled}
                    disabled={isLocked}
                    onChange={(e) => setField("batch_control_enabled", e.target.checked)}
                  />
                  Batch Control Enabled
                </label>
              </div>

              {!form.batch_control_enabled ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  Batch control is OFF. Turn ON if your industry needs batch/serial/expiry traceability.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Add Batch Rows</div>
                    <p className={helperBase}>You can add multiple batch lines per item.</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.items.map((it) => (
                        <button
                          key={it.po_item_id}
                          type="button"
                          className={classNames(primaryBtn, "active:scale-95")}
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                          onClick={() => addBatchRow(it.po_item_id, it.item_id)}
                          disabled={isLocked}
                        >
                          + Add for {it.item_id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="min-w-[1300px] w-full border-collapse text-sm whitespace-nowrap">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left">Item</th>
                          <th className="px-4 py-3 text-left">Batch No</th>
                          <th className="px-4 py-3 text-left">Serial No</th>
                          <th className="px-4 py-3 text-left">MFG Date</th>
                          <th className="px-4 py-3 text-left">Expiry Date</th>
                          <th className="px-4 py-3 text-left">Lot Qty</th>
                          <th className="px-4 py-3 text-left">Action</th>
                        </tr>
                      </thead>

                      <tbody className="dark:text-gray-200">
                        {form.batches.map((b, idx) => (
                          <tr key={b.id} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                            <td className="px-4 py-3">
                              <div className="font-semibold">{b.item_id}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-300">PO Item: {b.po_item_id}</div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={b.batch_number}
                                disabled={isLocked}
                                onChange={(e) => updateBatchRow(idx, { batch_number: e.target.value })}
                                className={classNames(inputBase, "min-w-[180px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={b.serial_number}
                                disabled={isLocked}
                                onChange={(e) => updateBatchRow(idx, { serial_number: e.target.value })}
                                className={classNames(inputBase, "min-w-[180px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={b.manufacturing_date}
                                disabled={isLocked}
                                onChange={(e) => updateBatchRow(idx, { manufacturing_date: e.target.value })}
                                className={classNames(inputBase, "min-w-[170px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={b.expiry_date}
                                disabled={isLocked}
                                onChange={(e) => updateBatchRow(idx, { expiry_date: e.target.value })}
                                className={classNames(inputBase, "min-w-[170px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={b.lot_quantity}
                                disabled={isLocked}
                                onChange={(e) => updateBatchRow(idx, { lot_quantity: e.target.value.replace(/[^\d.]/g, "") })}
                                className={classNames(inputBase, "min-w-[140px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className={classNames("text-sm font-semibold text-rose-600 hover:underline", isLocked && "opacity-50 cursor-not-allowed")}
                                onClick={() => removeBatchRow(idx)}
                                disabled={isLocked}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}

                        {form.batches.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                              No batch rows added.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("attachments")}>
                  Next: Attachments →
                </button>
              </div>
            </div>
          )}

          {/* ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Attachments & Remarks</h4>
                  <p className={helperBase}>Optional support documents (DC/Invoice/Photo) + remarks.</p>
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

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className={labelBase}>
                    Internal Remarks <span className={helperBase}>(Optional)</span>
                  </label>
                  <textarea
                    value={form.internal_remarks}
                    disabled={isLocked}
                    onChange={(e) => setField("internal_remarks", e.target.value)}
                    className={classNames(inputBase, "min-h-[120px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Store notes..."
                  />
                </div>

                <div>
                  <label className={labelBase}>
                    Rejection Reason <span className={helperBase}>(Required only if rejecting)</span>
                  </label>
                  <textarea
                    value={form.rejection_reason}
                    disabled={isLocked}
                    onChange={(e) => setField("rejection_reason", e.target.value)}
                    onBlur={() => markTouched("rejection_reason")}
                    className={classNames(
                      inputBase,
                      "min-h-[120px] resize-y",
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("rejection_reason") && "border-brand-500"
                    )}
                    placeholder="Reason for rejection..."
                  />
                  {showError("rejection_reason") && <p className="mt-1 text-xs text-brand-500">{errors.rejection_reason}</p>}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("posting")}>
                  Next: Posting →
                </button>
              </div>
            </div>
          )}

          {/* POSTING */}
          {activeTab === "posting" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white">Posting Readiness</h3>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
                  </div>

                  <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                    <Row label="PO Selected" value={form.po_id ? "Yes" : "No"} />
                    <Row label="Receipt Type" value={form.receipt_type || "-"} />
                    <Row label="Any Received Qty Entered" value={postingSummary.anyReceivedNow ? "Yes" : "No"} />
                    <Row label="QC Gate" value={form.qc.qc_required ? `Required (${form.qc.qc_status})` : "Not required"} />
                    <Row label="Excess Present" value={postingSummary.anyExcess ? "Yes" : "No"} />
                    <Row label="Excess Handling Completed" value={postingSummary.missingDisposition ? "No" : "Yes"} />
                  </div>

                  <div className="my-4 border-t dark:border-gray-800" />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Accepted Total Qty</span>
                      <span className="font-semibold">{postingSummary.acceptedTotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Excess Total Qty</span>
                      <span className="font-semibold">{postingSummary.excessTotal}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Posting will update inventory for Accepted qty. Excess qty will be processed per selected handling.
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                      onClick={onPostGRN}
                      disabled={isLocked}
                    >
                      Post GRN
                    </button>

                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
                      onClick={onRejectGRN}
                      disabled={isLocked}
                    >
                      Reject GRN
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white">Inventory Posting Preview (Demo)</h3>
                  <p className={helperBase}>
                    This preview shows where stock will go after posting. (Phase-1: accepted → warehouse, excess → based on handling)
                  </p>

                  <div className="mt-4 space-y-3 text-sm">
                    {form.items.map((it) => {
                      const hasExcess = (Number(it.excess_qty) || 0) > 0;

                      const acceptedLine = `${it.accepted_qty} ${it.uom} → ${form.delivery_location || "WH"} (Normal)`;
                      const excessLine =
                        it.excess_disposition === "Quarantine"
                          ? `${it.excess_qty} ${it.uom} → ${QUARANTINE_LOCATION.warehouse_id}/${QUARANTINE_LOCATION.bin}`
                          : it.excess_disposition === "Return to Vendor"
                          ? `${it.excess_qty} ${it.uom} → Return process (no stock / reverse)`
                          : it.excess_disposition === "Adjust in Next PO"
                          ? `${it.excess_qty} ${it.uom} → Quarantine (hold) + note: adjust next PO`
                          : it.excess_disposition === "Accept as Free Qty"
                          ? `${it.excess_qty} ${it.uom} → ${form.delivery_location || "WH"} (Free Qty stock)`
                          : `${it.excess_qty} ${it.uom} → (Select handling)`;

                      return (
                        <div key={it.grn_item_id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                          <div className="font-semibold text-gray-900 dark:text-white">{it.item_id}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{it.item_description}</div>

                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Accepted</span>
                              <span className="font-semibold">{acceptedLine}</span>
                            </div>

                            {hasExcess && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Excess</span>
                                <span className="font-semibold">{excessLine}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {form.items.length === 0 && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                        No items to preview. Select PO first.
                      </div>
                    )}
                  </div>

                  {form.grn_status === "Posted" && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-gray-800 dark:bg-white/5 dark:text-green-200">
                      <span className="font-semibold">Posted:</span> Inventory updated (demo). Next: update PO receipt status + trigger invoice matching.
                    </div>
                  )}
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
          onClick={onPostGRN}
          disabled={isLocked}
        >
          Post GRN
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800 dark:bg-white/10 dark:text-gray-200">
        {value}
      </span>
    </div>
  );
}
