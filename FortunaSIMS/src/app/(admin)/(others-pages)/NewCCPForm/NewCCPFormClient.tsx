"use client";

import React, { useMemo, useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter, useSearchParams } from "next/navigation";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Masters (demo) */
const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH", active: true },
  { id: "WH-002", name: "Hyderabad WH", active: true },
  { id: "WH-003", name: "Chennai WH", active: false }, // demo inactive
];

const ZONES = ["Z-A", "Z-B", "Z-C"];
const RACKS_BY_ZONE = {
  "Z-A": ["R-01", "R-02", "R-03"],
  "Z-B": ["R-01", "R-02"],
  "Z-C": ["R-01"],
};
const BINS_BY_RACK = {
  "Z-A|R-01": ["01-01", "01-02", "01-03", "01-10"],
  "Z-A|R-02": ["02-01", "02-02"],
  "Z-B|R-01": ["01-01", "01-02"],
  "Z-C|R-01": ["01-01"],
};

const ITEMS = [
  { id: "SKU-001", name: "Detergent 1L" },
  { id: "SKU-002", name: "Packaging Box 5-ply" },
  { id: "SKU-003", name: "Bubble Wrap Large" },
];

const CATEGORIES = ["FAST MOVING", "SLOW MOVING", "DEAD STOCK", "QC_HOLD"];

const TABS = [
  { key: "header", label: "Header" },
  { key: "scope", label: "Scope" },
  { key: "rules", label: "Rules" },
  { key: "submit", label: "Submit" },
];

/** Helpers */
function classNames(...v: Array<string | number | boolean | null | undefined>) {
  return v.filter(Boolean).join(" ");
}
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function uuidLike() {
  // demo id
  return "UUID-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

/** Styles */
const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase = "text-sm font-medium text-gray-700 dark:text-gray-200";
const helperBase = "text-xs text-gray-500 dark:text-gray-400";

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md " +
  "focus:outline-none active:scale-95";

const outlineBtn =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm " +
  "hover:bg-gray-50 active:scale-95 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5";

function Pill({ text, tone = "gray" }: { text: string; tone?: string }) {
  const cls =
    tone === "green"
      ? "bg-green-100 text-green-700"
      : tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : tone === "blue"
      ? "bg-blue-100 text-blue-700"
      : tone === "red"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200";
  return <span className={classNames("inline-flex rounded-full px-3 py-1 text-xs font-semibold", cls)}>{text}</span>;
}

/**
 * Status (LLD: Draft/Released/In-Progress/Completed/Closed)
 * Your UI flow (list screenshot): Draft → Planned → Counting In-Progress → Awaiting Approval → Approved → Posted/Cancelled
 * Plan Create stage: we mainly do Draft/Planned/Cancelled.
 */
const STATUS_TONE = (s: string) => {
  if (s === "Draft") return "gray";
  if (s === "Planned") return "blue";
  if (s === "Counting In-Progress") return "amber";
  if (s === "Awaiting Approval") return "amber";
  if (s === "Approved") return "green";
  if (s === "Posted") return "green";
  if (s === "Cancelled") return "red";
  return "gray";
};

const initialState = {
  // Header (LLD)
  count_plan_id: "Auto",
  plan_number: "Auto (CC-YYYY-SEQ / PA-YYYY-SEQ)",
  plan_type: "Cycle", // Cycle | Physical
  warehouse_id: "",
  plan_date: todayISO(),
  frequency: "", // Daily/Weekly/Monthly (Cycle only)
  count_mode: "Blind", // Blind / Non-blind
  status: "Draft", // system

  // Scope (LLD)
  scope_type: "BIN", // BIN | ITEM | CATEGORY
  zone_code: "",
  rack_code: "",
  bin_code: "",

  item_id: "",
  category: "",

  include_blocked_stock: false, // default false
  include_expired_stock: true, // default true

  // Rules (simple, practical)
  freeze_movements: true,
  variance_tolerance_pct: "0", // string
  enable_recount: true,
  max_recount_rounds: "1", // string
  notes: "",
};

export default function CycleCountPlanCreateEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // optional edit support: /cycle-count/plan-form?mode=edit&planNo=CC-2026-0007
  const mode = searchParams?.get("mode") || "create";
  const editPlanNo = searchParams?.get("planNo") || "";

  const [activeTab, setActiveTab] = useState("header");
  const [form, setForm] = useState(() => ({
    ...initialState,
    count_plan_id: uuidLike(),
    plan_number: mode === "edit" && editPlanNo ? editPlanNo : initialState.plan_number,
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // lock editing after planned (optional rule)
  const isLocked = form.status !== "Draft";

  // dependent lists
  const racks = useMemo(() => {
    if (!form.zone_code) return [];
    const zoneKey = form.zone_code as keyof typeof RACKS_BY_ZONE;
    return RACKS_BY_ZONE[zoneKey] || [];
  }, [form.zone_code]);
  const bins = useMemo(() => {
    if (!form.zone_code || !form.rack_code) return [];
    const key = `${form.zone_code}|${form.rack_code}` as keyof typeof BINS_BY_RACK;
    return BINS_BY_RACK[key] || [];
  }, [form.zone_code, form.rack_code]);

  /** Auto plan number prefix based on plan type (demo) */
  useEffect(() => {
    // only when Draft + create
    if (mode !== "edit" && form.status === "Draft") {
      setForm((p) => ({
        ...p,
        plan_number: p.plan_type === "Cycle" ? "Auto (CC-YYYY-SEQ)" : "Auto (PA-YYYY-SEQ)",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.plan_type]);

  /** Reset conditional fields when scope changes */
  useEffect(() => {
    setForm((p) => {
      const next = { ...p };

      if (p.scope_type !== "BIN") {
        next.zone_code = "";
        next.rack_code = "";
        next.bin_code = "";
      }
      if (p.scope_type !== "ITEM") next.item_id = "";
      if (p.scope_type !== "CATEGORY") next.category = "";

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.scope_type]);

  /** If zone changes -> reset rack/bin */
  useEffect(() => {
    setForm((p) => ({ ...p, rack_code: "", bin_code: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.zone_code]);

  /** If rack changes -> reset bin */
  useEffect(() => {
    setForm((p) => ({ ...p, bin_code: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.rack_code]);

  /** Validation */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // Header
    if (!form.plan_type) e.plan_type = "Plan Type is required";
    if (!form.warehouse_id) e.warehouse_id = "Warehouse is required";
    else {
      const wh = WAREHOUSES.find((x) => x.id === form.warehouse_id);
      if (wh && !wh.active) e.warehouse_id = "Warehouse must be Active";
    }
    if (!form.plan_date) e.plan_date = "Plan date is required";
    else {
      const t = new Date(todayISO());
      const d = new Date(form.plan_date);
      t.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() < t.getTime()) e.plan_date = "Plan date must be Today or Future";
    }

    // frequency only for Cycle
    if (form.plan_type === "Cycle" && form.frequency && !["Daily", "Weekly", "Monthly"].includes(form.frequency)) {
      e.frequency = "Frequency must be Daily/Weekly/Monthly";
    }

    // Scope
    if (!form.scope_type) e.scope_type = "Scope Type is required";
    if (form.scope_type === "BIN") {
      if (!form.zone_code) e.zone_code = "Zone is required for BIN scope";
      if (!form.rack_code) e.rack_code = "Rack is required for BIN scope";
      if (!form.bin_code) e.bin_code = "Bin is required for BIN scope";
    }
    if (form.scope_type === "ITEM") {
      if (!form.item_id) e.item_id = "Item is required for ITEM scope";
    }
    if (form.scope_type === "CATEGORY") {
      if (!form.category) e.category = "Category is required for CATEGORY scope";
    }

    // Rules
    if (form.variance_tolerance_pct !== "") {
      const n = Number(form.variance_tolerance_pct);
      if (!Number.isFinite(n) || n < 0) e.variance_tolerance_pct = "Tolerance % must be >= 0";
    }
    if (form.enable_recount) {
      const r = Number(form.max_recount_rounds);
      if (!Number.isFinite(r) || r < 0) e.max_recount_rounds = "Max recount rounds must be >= 0";
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof typeof initialState>(key: K, value: typeof initialState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));
  const markTouched = (key: keyof typeof initialState) => setTouched((p) => ({ ...p, [key]: true }));
  const showError = (key: keyof typeof initialState) => Boolean(touched[key] && errors[key]);

  const touchAll = () => {
    const next: Record<string, boolean> = {};
    [
      "plan_type",
      "warehouse_id",
      "plan_date",
      "frequency",
      "count_mode",
      "scope_type",
      "zone_code",
      "rack_code",
      "bin_code",
      "item_id",
      "category",
      "variance_tolerance_pct",
      "max_recount_rounds",
    ].forEach((k) => (next[k] = true));
    setTouched(next);
  };

  const firstErrorTab = () => {
    const headerKeys = ["plan_type", "warehouse_id", "plan_date", "frequency"];
    const scopeKeys = ["scope_type", "zone_code", "rack_code", "bin_code", "item_id", "category"];
    const ruleKeys = ["variance_tolerance_pct", "max_recount_rounds"];
    if (headerKeys.some((k) => errors[k])) return "header";
    if (scopeKeys.some((k) => errors[k])) return "scope";
    if (ruleKeys.some((k) => errors[k])) return "rules";
    return "header";
  };

  /** Actions */
  const onReset = () => {
    if (isLocked) return;
    setForm({ ...initialState, count_plan_id: uuidLike() });
    setTouched({});
    setActiveTab("header");
  };

  const onSaveDraft = () => {
    // keep Draft
    const payload = { ...form, status: "Draft" };
    console.log("SAVE DRAFT:", payload);
    alert("Saved Draft (demo). Next: connect API.");
  };

  const onCreatePlan = () => {
    if (isLocked) return;
    touchAll();
    if (hasErrors) {
      setActiveTab(firstErrorTab());
      alert("Please fix validation errors before creating the plan.");
      return;
    }
    // Draft -> Planned (as per your list flow)
    setForm((p) => ({ ...p, status: "Planned" }));
    setActiveTab("submit");
    alert("Plan Created (Planned) ✅ (demo). Next step: CCP Assignment module.");
  };

  const onCancelPlan = () => {
    const ok = confirm("Cancel this plan? (demo)");
    if (!ok) return;
    setForm((p) => ({ ...p, status: "Cancelled" }));
    setActiveTab("submit");
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Cycle Count" />

      {/* Header Card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === "edit" ? "Edit Count Plan" : "Create Count Plan"}
          </h3>
          <p className={helperBase}>
            Header → Scope (Bin/Item/Category) → Rules → Create Plan (Assignment happens in CCP Assignment module).
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill text={form.status} tone={STATUS_TONE(form.status)} />
            {isLocked && (
              <span className="text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
                Locked: Plan cannot be edited after it is Planned.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={outlineBtn} onClick={() => router.back()}>
            Back
          </button>

          <button className={outlineBtn} onClick={onReset} disabled={isLocked}>
            Reset
          </button>

          <button
            className={classNames(primaryBtn)}
            style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSaveDraft}
            disabled={isLocked}
          >
            Save Draft
          </button>

          <button
            className={classNames(primaryBtn)}
            style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
            onClick={onCreatePlan}
            disabled={isLocked}
          >
            Create Plan
          </button>

          <button
            className={classNames(outlineBtn)}
            style={{ borderColor: FORTUNA_PRIMARY_RED, color: FORTUNA_PRIMARY_RED, opacity: form.status === "Cancelled" ? 0.6 : 1 }}
            onClick={onCancelPlan}
            disabled={form.status === "Cancelled"}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={classNames(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95",
                  isActive
                    ? "text-white shadow"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                )}
                // ✅ Your asked behavior: active tab = primary red
                style={isActive ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-6 min-w-0">
          {/* HEADER TAB */}
          {activeTab === "header" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-4">
                <div>
                  <label className={labelBase}>
                    Count Plan ID <span className={helperBase}>(System)</span>
                  </label>
                  <input readOnly value={form.count_plan_id} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div>
                  <label className={labelBase}>
                    Plan Number <span className={helperBase}>(System)</span>
                  </label>
                  <input readOnly value={form.plan_number} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  <p className={classNames(helperBase, "mt-1")}>Format: CC-YYYY-SEQ / PA-YYYY-SEQ</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      Plan Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.plan_type}
                      disabled={isLocked}
                      onChange={(e) => {
                        setField("plan_type", e.target.value);
                        markTouched("plan_type");
                      }}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("plan_type") && "border-red-400"
                      )}
                    >
                      <option value="Cycle">Cycle Count</option>
                      <option value="Physical">Physical Audit</option>
                    </select>
                    {showError("plan_type") && <p className="mt-1 text-xs text-red-600">{errors.plan_type}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      Plan Date <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={form.plan_date}
                      disabled={isLocked}
                      onChange={(e) => setField("plan_date", e.target.value)}
                      onBlur={() => markTouched("plan_date")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("plan_date") && "border-red-400"
                      )}
                    />
                    {showError("plan_date") && <p className="mt-1 text-xs text-red-600">{errors.plan_date}</p>}
                    <p className={classNames(helperBase, "mt-1")}>Validation: ≥ Today</p>
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Warehouse <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.warehouse_id}
                    disabled={isLocked}
                    onChange={(e) => {
                      setField("warehouse_id", e.target.value);
                      markTouched("warehouse_id");
                    }}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("warehouse_id") && "border-red-400"
                    )}
                  >
                    <option value="">Select Warehouse</option>
                    {WAREHOUSES.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.id}) {w.active ? "" : " - Inactive"}
                      </option>
                    ))}
                  </select>
                  {showError("warehouse_id") && <p className="mt-1 text-xs text-red-600">{errors.warehouse_id}</p>}
                  <p className={classNames(helperBase, "mt-1")}>Validation: Must be Active</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Frequency {form.plan_type !== "Cycle" && <span className={helperBase}>(Cycle only)</span>}</label>
                    <select
                      value={form.frequency}
                      disabled={isLocked || form.plan_type !== "Cycle"}
                      onChange={(e) => setField("frequency", e.target.value)}
                      onBlur={() => markTouched("frequency")}
                      className={classNames(
                        inputBase,
                        (isLocked || form.plan_type !== "Cycle") && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("frequency") && "border-red-400"
                      )}
                    >
                      <option value="">(Optional)</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                    {showError("frequency") && <p className="mt-1 text-xs text-red-600">{errors.frequency}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      Count Mode <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.count_mode}
                      disabled={isLocked}
                      onChange={(e) => setField("count_mode", e.target.value)}
                      className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    >
                      <option value="Blind">Blind (Recommended)</option>
                      <option value="Non-blind">Non-blind</option>
                    </select>
                    <p className={classNames(helperBase, "mt-1")}>Blind: counter cannot see system qty.</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className={outlineBtn} onClick={() => setActiveTab("scope")}>
                    Next: Scope →
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <div className="font-semibold">What you are creating here</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div>• Cycle Count: Partial counting (selected bins/items) on schedule</div>
                    <div>• Physical Audit: Full warehouse wide count</div>
                    <div>• Blind Count: counter cannot see system qty (recommended)</div>
                    <div>• Assignment happens in separate module: <span className="font-semibold">CCP Assignment</span></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">System Status</div>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Status</span>
                      <Pill text={form.status} tone={STATUS_TONE(form.status)} />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                      <span className="font-semibold">Flow:</span> Draft → Planned → Execution (web/mobile) → Reconciliation → Approval → Posted/Cancelled
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className={outlineBtn} onClick={() => setActiveTab("scope")}>
                    Go to Scope →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCOPE TAB */}
          {activeTab === "scope" && (
            <div className="space-y-5 min-w-0">
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Scope Definition</h4>
                <p className={helperBase}>Select what to count: BIN / ITEM / CATEGORY. (Assignment is NOT here.)</p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className={labelBase}>
                      Scope Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.scope_type}
                      disabled={isLocked}
                      onChange={(e) => {
                        setField("scope_type", e.target.value);
                        markTouched("scope_type");
                      }}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("scope_type") && "border-red-400"
                      )}
                    >
                      <option value="BIN">BIN (Zone/Rack/Bin)</option>
                      <option value="ITEM">ITEM (SKU)</option>
                      <option value="CATEGORY">CATEGORY</option>
                    </select>
                    {showError("scope_type") && <p className="mt-1 text-xs text-red-600">{errors.scope_type}</p>}
                  </div>

                  {/* BIN scope */}
                  {form.scope_type === "BIN" && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">Bin-based Selection</div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className={labelBase}>
                            Zone <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                          </label>
                          <select
                            value={form.zone_code}
                            disabled={isLocked}
                            onChange={(e) => setField("zone_code", e.target.value)}
                            onBlur={() => markTouched("zone_code")}
                            className={classNames(
                              inputBase,
                              isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                              showError("zone_code") && "border-red-400"
                            )}
                          >
                            <option value="">Select</option>
                            {ZONES.map((z) => (
                              <option key={z} value={z}>
                                {z}
                              </option>
                            ))}
                          </select>
                          {showError("zone_code") && <p className="mt-1 text-xs text-red-600">{errors.zone_code}</p>}
                        </div>

                        <div>
                          <label className={labelBase}>
                            Rack <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                          </label>
                          <select
                            value={form.rack_code}
                            disabled={isLocked || !form.zone_code}
                            onChange={(e) => setField("rack_code", e.target.value)}
                            onBlur={() => markTouched("rack_code")}
                            className={classNames(
                              inputBase,
                              (isLocked || !form.zone_code) && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                              showError("rack_code") && "border-red-400"
                            )}
                          >
                            <option value="">{form.zone_code ? "Select" : "Select Zone first"}</option>
                            {racks.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          {showError("rack_code") && <p className="mt-1 text-xs text-red-600">{errors.rack_code}</p>}
                        </div>

                        <div>
                          <label className={labelBase}>
                            Bin <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                          </label>
                          <select
                            value={form.bin_code}
                            disabled={isLocked || !form.zone_code || !form.rack_code}
                            onChange={(e) => setField("bin_code", e.target.value)}
                            onBlur={() => markTouched("bin_code")}
                            className={classNames(
                              inputBase,
                              (isLocked || !form.zone_code || !form.rack_code) && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                              showError("bin_code") && "border-red-400"
                            )}
                          >
                            <option value="">
                              {form.zone_code && form.rack_code ? "Select" : "Select Zone + Rack first"}
                            </option>
                            {bins.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                          {showError("bin_code") && <p className="mt-1 text-xs text-red-600">{errors.bin_code}</p>}
                        </div>
                      </div>

                      <p className={classNames(helperBase, "mt-3")}>
                        Note: Phase-2 lo multi-bin selection add cheyyachu. Phase-1 lo single bin selection.
                      </p>
                    </div>
                  )}

                  {/* ITEM scope */}
                  {form.scope_type === "ITEM" && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">Item-based Selection</div>
                      <div className="mt-4">
                        <label className={labelBase}>
                          Item (SKU) <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                        </label>
                        <select
                          value={form.item_id}
                          disabled={isLocked}
                          onChange={(e) => setField("item_id", e.target.value)}
                          onBlur={() => markTouched("item_id")}
                          className={classNames(
                            inputBase,
                            isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                            showError("item_id") && "border-red-400"
                          )}
                        >
                          <option value="">Select SKU</option>
                          {ITEMS.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.id} • {it.name}
                            </option>
                          ))}
                        </select>
                        {showError("item_id") && <p className="mt-1 text-xs text-red-600">{errors.item_id}</p>}
                      </div>
                      <p className={classNames(helperBase, "mt-3")}>Phase-2 lo multi SKU select, ABC based, etc.</p>
                    </div>
                  )}

                  {/* CATEGORY scope */}
                  {form.scope_type === "CATEGORY" && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">Category-based Selection</div>
                      <div className="mt-4">
                        <label className={labelBase}>
                          Category <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                        </label>
                        <select
                          value={form.category}
                          disabled={isLocked}
                          onChange={(e) => setField("category", e.target.value)}
                          onBlur={() => markTouched("category")}
                          className={classNames(
                            inputBase,
                            isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                            showError("category") && "border-red-400"
                          )}
                        >
                          <option value="">Select Category</option>
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        {showError("category") && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                      </div>
                      <p className={classNames(helperBase, "mt-3")}>Category = SKU classification (Fast/Slow/Dead/QC Hold etc.)</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Include Options</span>
                    <div className="mt-2 space-y-1">
                      <div>• include_blocked_stock default: false</div>
                      <div>• include_expired_stock default: true</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="grid grid-cols-1 gap-4">
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Include Blocked Stock</div>
                          <div className={helperBase}>Default false (QC hold/blocked).</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.include_blocked_stock}
                          disabled={isLocked}
                          onChange={(e) => setField("include_blocked_stock", e.target.checked)}
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Include Expired Stock</div>
                          <div className={helperBase}>Default true.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.include_expired_stock}
                          disabled={isLocked}
                          onChange={(e) => setField("include_expired_stock", e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button className={outlineBtn} onClick={() => setActiveTab("header")}>
                      ← Back
                    </button>
                    <button className={outlineBtn} onClick={() => setActiveTab("rules")}>
                      Next: Rules →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RULES TAB */}
          {activeTab === "rules" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Rules</h4>
                  <p className={helperBase}>Simple Phase-1 rules. Phase-2 lo advanced rules add cheddam.</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Freeze Movements During Count</div>
                      <div className={helperBase}>Recommended ON (avoid stock changes while counting).</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.freeze_movements}
                      disabled={isLocked}
                      onChange={(e) => setField("freeze_movements", e.target.checked)}
                    />
                  </label>

                  <div className="mt-4">
                    <label className={labelBase}>Variance Tolerance (%)</label>
                    <input
                      value={form.variance_tolerance_pct}
                      disabled={isLocked}
                      onChange={(e) => setField("variance_tolerance_pct", e.target.value.replace(/[^\d.]/g, ""))}
                      onBlur={() => markTouched("variance_tolerance_pct")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("variance_tolerance_pct") && "border-red-400"
                      )}
                      placeholder="Example: 0 or 1.5"
                    />
                    {showError("variance_tolerance_pct") && (
                      <p className="mt-1 text-xs text-red-600">{errors.variance_tolerance_pct}</p>
                    )}
                    <p className={classNames(helperBase, "mt-1")}>If tolerance breached → recommend recount / approval.</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Enable Recount</div>
                        <div className={helperBase}>For mismatch / tolerance breach cases.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.enable_recount}
                        disabled={isLocked}
                        onChange={(e) => setField("enable_recount", e.target.checked)}
                      />
                    </div>

                    <div className="mt-3">
                      <label className={labelBase}>Max Recount Rounds</label>
                      <input
                        value={form.max_recount_rounds}
                        disabled={isLocked || !form.enable_recount}
                        onChange={(e) => setField("max_recount_rounds", e.target.value.replace(/[^\d]/g, ""))}
                        onBlur={() => markTouched("max_recount_rounds")}
                        className={classNames(
                          inputBase,
                          (isLocked || !form.enable_recount) && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("max_recount_rounds") && "border-red-400"
                        )}
                        placeholder="Example: 1"
                      />
                      {showError("max_recount_rounds") && (
                        <p className="mt-1 text-xs text-red-600">{errors.max_recount_rounds}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button className={outlineBtn} onClick={() => setActiveTab("scope")}>
                    ← Back
                  </button>
                  <button className={outlineBtn} onClick={() => setActiveTab("submit")}>
                    Next: Submit →
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> Assignment tab intentionally removed.
                  <div className="mt-2">
                    Plan create = scope definition only. User assignment will be managed in <span className="font-semibold">CCP Assignment</span> sub-module.
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <label className={labelBase}>Internal Notes (Optional)</label>
                  <textarea
                    value={form.notes}
                    disabled={isLocked}
                    onChange={(e) => setField("notes", e.target.value)}
                    className={classNames(inputBase, "min-h-[120px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Any notes for supervisors / audit team..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT TAB */}
          {activeTab === "submit" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Review & Submit</h4>
                <p className={helperBase}>Confirm plan header, scope, and rules. Then Create Plan (Draft → Planned).</p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Header Summary</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <KV k="Plan Number" v={form.plan_number} />
                    <KV k="Plan Type" v={form.plan_type} />
                    <KV k="Warehouse" v={form.warehouse_id || "-"} />
                    <KV k="Plan Date" v={form.plan_date || "-"} />
                    <KV k="Frequency" v={form.plan_type === "Cycle" ? (form.frequency || "(optional)") : "N/A"} />
                    <KV k="Count Mode" v={form.count_mode} />
                    <KV k="Status" v={form.status} pill />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Scope Summary</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <KV k="Scope Type" v={form.scope_type} />
                    {form.scope_type === "BIN" && (
                      <>
                        <KV k="Zone" v={form.zone_code || "-"} />
                        <KV k="Rack" v={form.rack_code || "-"} />
                        <KV k="Bin" v={form.bin_code || "-"} />
                      </>
                    )}
                    {form.scope_type === "ITEM" && <KV k="Item" v={form.item_id || "-"} />}
                    {form.scope_type === "CATEGORY" && <KV k="Category" v={form.category || "-"} />}

                    <div className="my-2 border-t dark:border-gray-800" />
                    <KV k="Include Blocked" v={form.include_blocked_stock ? "Yes" : "No"} />
                    <KV k="Include Expired" v={form.include_expired_stock ? "Yes" : "No"} />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:col-span-2">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Rules Summary</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    <KV k="Freeze Movements" v={form.freeze_movements ? "Yes" : "No"} />
                    <KV k="Tolerance %" v={form.variance_tolerance_pct === "" ? "-" : form.variance_tolerance_pct} />
                    <KV k="Enable Recount" v={form.enable_recount ? "Yes" : "No"} />
                    <KV k="Max Recount Rounds" v={form.enable_recount ? form.max_recount_rounds : "N/A"} />
                  </div>

                  {hasErrors && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      There are validation errors. Please go back and fix them before creating the plan.
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <button className={outlineBtn} onClick={() => setActiveTab("rules")}>
                      ← Back
                    </button>

                    <button
                      className={classNames(primaryBtn)}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                      onClick={onSaveDraft}
                      disabled={isLocked}
                    >
                      Save Draft
                    </button>

                    <button
                      className={classNames(primaryBtn)}
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
                      onClick={onCreatePlan}
                      disabled={isLocked}
                    >
                      Create Plan
                    </button>
                  </div>

                  {form.notes?.trim() && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                      <span className="font-semibold">Notes:</span> {form.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer (optional same actions) */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button className={outlineBtn} onClick={onReset} disabled={isLocked}>
          Reset
        </button>
        <button
          className={classNames(primaryBtn)}
          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSaveDraft}
          disabled={isLocked}
        >
          Save Draft
        </button>
        <button
          className={classNames(primaryBtn)}
          style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
          onClick={onCreatePlan}
          disabled={isLocked}
        >
          Create Plan
        </button>
      </div>
    </div>
  );
}

function KV({ k, v, pill = false }: { k: string; v: string; pill?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600 dark:text-gray-300">{k}</span>
      {pill ? <Pill text={v} tone={STATUS_TONE(v)} /> : <span className="font-semibold text-gray-900 dark:text-white">{v}</span>}
    </div>
  );
}
