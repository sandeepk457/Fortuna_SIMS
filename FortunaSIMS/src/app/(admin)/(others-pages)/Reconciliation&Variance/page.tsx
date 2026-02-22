"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** ===== Fortuna Theme ===== */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";
const APP_TOPBAR_H = 74;

/** ===== Tabs ===== */
const TABS = [
  { key: "variance", label: "Variance Summary", sub: "Report view • all variances" },
  { key: "reconciliation", label: "Reconciliation", sub: "Supervisor actions • Accept / Adjust / Reject" },
  { key: "recount", label: "Recount Queue", sub: "Operational queue • assigned recounts" },
];

/** ===== Masters ===== */
const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH" },
  { id: "WH-002", name: "Hyderabad WH" },
  { id: "WH-003", name: "Chennai WH" },
];

const USERS = [
  { id: "U-101", name: "Ravi (Counter)" },
  { id: "U-102", name: "Anitha (Counter)" },
  { id: "U-103", name: "Kiran (Counter)" },
  { id: "U-201", name: "Priya (Supervisor)" },
];

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/20 focus:border-[#005F99]/40";

const labelBase = "text-xs font-semibold text-gray-700";
const helperBase = "text-[11px] text-gray-500";

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition active:scale-95";

const outlineBtn =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition active:scale-95";

function classNames(...v) {
  return v.filter(Boolean).join(" ");
}

function MiniPill({ text, tone }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const cls =
    tone === "red"
      ? "bg-rose-50 text-rose-700"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800"
      : tone === "green"
      ? "bg-green-50 text-green-700"
      : "bg-gray-100 text-gray-700";
  return <span className={classNames(base, cls)}>{text}</span>;
}

function StatusPill({ status }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const cls =
    status === "Awaiting Approval"
      ? "bg-purple-50 text-purple-700"
      : status === "Counting In-Progress"
      ? "bg-amber-50 text-amber-800"
      : status === "Approved"
      ? "bg-green-50 text-green-700"
      : status === "Posted"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Draft"
      ? "bg-gray-100 text-gray-700"
      : "bg-gray-100 text-gray-700";
  return <span className={classNames(base, cls)}>{status}</span>;
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

function StatLine({ label, value, pillBg }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: pillBg }}>
        {value}
      </span>
    </div>
  );
}

function QuickStatsCard({ title, stats, note }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {stats.map((s) => (
          <StatLine key={s.label} label={s.label} value={s.value} pillBg={s.pillBg} />
        ))}

        {note ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <span className="font-semibold">Note:</span> {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function currencyINR(n) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

/** ===== Demo data (realistic) ===== */
const SAMPLE_PLANS = [
  {
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-002",
    scheduled_date: "2026-02-14",
    status: "Awaiting Approval",
    scope_type: "BIN",
    scope_summary: "Z-A-01-01 → Z-A-01-12",
    sku_count: 48,
  },
  {
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    plan_type: "Cycle Count",
    count_mode: "Guided",
    warehouse_id: "WH-001",
    scheduled_date: "2026-02-10",
    status: "Awaiting Approval",
    scope_type: "ITEM",
    scope_summary: "FAST MOVING (A-class)",
    sku_count: 22,
  },
  {
    plan_id: "CCP-UUID-0003",
    plan_no: "PA-2026-0005",
    plan_type: "Physical Audit",
    count_mode: "Blind",
    warehouse_id: "WH-003",
    scheduled_date: "2026-01-28",
    status: "Posted",
    scope_type: "BIN",
    scope_summary: "Full WH (sampled)",
    sku_count: 220,
  },
];

const SAMPLE_LINES = [
  {
    line_id: "VL-0001",
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    scope_ref: "BIN Z-A-01-03",
    category: "Packaging",
    item_id: "SKU-10021",
    item_desc: "HDPE Bottle 1L",
    uom: "Nos",
    unit_cost: 25,
    system_qty: 1200,
    counted_qty: 1120,
    recount_required: true,
    recount_status: "Queued",
    recount_assignee: "Ravi (Counter)",
    recount_due_date: "2026-02-20",
    recount_notes: "Threshold exceeded",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
  {
    line_id: "VL-0002",
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    scope_ref: "BIN Z-A-01-04",
    category: "Packaging",
    item_id: "SKU-33011",
    item_desc: "Carton Box 5-ply",
    uom: "Nos",
    unit_cost: 18,
    system_qty: 500,
    counted_qty: 498,
    recount_required: false,
    recount_status: "Not Required",
    recount_assignee: "",
    recount_due_date: "",
    recount_notes: "",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
  {
    line_id: "VL-0003",
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    scope_ref: "ITEM SCOPE • FAST MOVING (A-class)",
    category: "Finished Goods",
    item_id: "SKU-52936",
    item_desc: "Premium Bag",
    uom: "Nos",
    unit_cost: 800,
    system_qty: 474,
    counted_qty: 465,
    recount_required: false,
    recount_status: "Not Required",
    recount_assignee: "",
    recount_due_date: "",
    recount_notes: "",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
  {
    line_id: "VL-0004",
    plan_id: "CCP-UUID-0003",
    plan_no: "PA-2026-0005",
    warehouse_id: "WH-003",
    scope_ref: "BIN Z-C-03-05-01",
    category: "Consumables",
    item_id: "SKU-81552",
    item_desc: "Premium Kit",
    uom: "Nos",
    unit_cost: 918,
    system_qty: 395,
    counted_qty: 381,
    recount_required: false,
    recount_status: "Not Required",
    recount_assignee: "",
    recount_due_date: "",
    recount_notes: "",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
  {
    line_id: "VL-0005",
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    scope_ref: "ITEM SCOPE • FAST MOVING (A-class)",
    category: "Spare Parts",
    item_id: "SKU-31782",
    item_desc: "Industrial Bag",
    uom: "Nos",
    unit_cost: 574,
    system_qty: 976,
    counted_qty: 958,
    recount_required: true,
    recount_status: "Queued",
    recount_assignee: "",
    recount_due_date: "2026-02-19",
    recount_notes: "High impact",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
];

export default function ReconciliationVariancePage() {
  const [activeTab, setActiveTab] = useState("reconciliation");

  const [plans] = useState(SAMPLE_PLANS);
  const [lines, setLines] = useState(SAMPLE_LINES);

  // filters
  const [warehouse, setWarehouse] = useState("All");
  const [plan, setPlan] = useState("All");
  const [search, setSearch] = useState("");

  // threshold
  const [thresholdPct, setThresholdPct] = useState("5");
  const thresholdNumber = useMemo(() => {
    const n = Number(thresholdPct);
    return Number.isFinite(n) && n >= 0 ? n : 5;
  }, [thresholdPct]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLineId, setActiveLineId] = useState("");

  const whName = (whId) => WAREHOUSES.find((w) => w.id === whId)?.name || whId;

  /** compute variance + threshold + high impact */
  const computedLines = useMemo(() => {
    return lines.map((l) => {
      const variance_qty = Number(l.counted_qty) - Number(l.system_qty);
      const variance_pct =
        l.system_qty === 0 ? (l.counted_qty === 0 ? 0 : 100) : (Math.abs(variance_qty) / Math.abs(l.system_qty)) * 100;

      const threshold_exceeded = Math.abs(variance_pct) >= thresholdNumber;
      const variance_value = Number(l.unit_cost || 0) * variance_qty;
      const highImpact = Math.abs(variance_value) > 25000;

      const recount_required = threshold_exceeded || highImpact ? true : !!l.recount_required;

      let recount_status = l.recount_status;
      if (recount_required && recount_status === "Not Required") recount_status = "Queued";
      if (!recount_required && recount_status !== "Completed") recount_status = "Not Required";

      return {
        ...l,
        variance_qty,
        variance_pct: Number(variance_pct.toFixed(2)),
        threshold_exceeded,
        variance_value,
        highImpact,
        recount_required,
        recount_status,
      };
    });
  }, [lines, thresholdNumber]);

  /** filter base by search + warehouse + plan */
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return computedLines.filter((l) => {
      const byWh = warehouse === "All" ? true : l.warehouse_id === warehouse;
      const byPlan = plan === "All" ? true : l.plan_id === plan;

      const bySearch =
        !q ||
        String(l.plan_no).toLowerCase().includes(q) ||
        String(l.item_id).toLowerCase().includes(q) ||
        String(l.item_desc).toLowerCase().includes(q) ||
        String(l.scope_ref).toLowerCase().includes(q) ||
        String(l.category || "").toLowerCase().includes(q);

      return byWh && byPlan && bySearch;
    });
  }, [computedLines, warehouse, plan, search]);

  /** tab-wise final filter (NO CONFUSION) */
  const filteredLines = useMemo(() => {
    if (activeTab === "variance") return baseFiltered;

    if (activeTab === "reconciliation") {
      // Only actionable lines:
      // If recount_required -> allow only when recount_status Completed
      // Else -> allow
      return baseFiltered.filter((l) => (l.recount_required ? l.recount_status === "Completed" : true));
    }

    // recount tab: only recount_required queue items
    return baseFiltered.filter((l) => l.recount_required && l.recount_status !== "Not Required");
  }, [baseFiltered, activeTab]);

  /** pagination */
  const totalPages = Math.ceil(filteredLines.length / itemsPerPage);
  const paginated = filteredLines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** quick stats (tab-wise) */
  const rightStats = useMemo(() => {
    const base = baseFiltered;

    const pending = base.filter((x) => x.reconciliation_status === "Pending").length;
    const accepted = base.filter((x) => x.reconciliation_status === "Accepted").length;
    const adjusted = base.filter((x) => x.reconciliation_status === "Adjusted").length;
    const rejected = base.filter((x) => x.reconciliation_status === "Rejected").length;

    const queued = base.filter((x) => x.recount_status === "Queued").length;
    const inprog = base.filter((x) => x.recount_status === "In Progress").length;
    const completed = base.filter((x) => x.recount_status === "Completed").length;

    const exceeded = base.filter((x) => x.threshold_exceeded).length;
    const highImpact = base.filter((x) => x.highImpact).length;

    if (activeTab === "reconciliation") {
      return {
        title: "Quick Stats • Reconciliation",
        note: "Only recount-completed items become actionable here (if recount required).",
        stats: [
          { label: "Actionable Lines", value: filteredLines.length, pillBg: "#E8F0FE" },
          { label: "Pending", value: pending, pillBg: "#FFF3D6" },
          { label: "Accepted", value: accepted, pillBg: "#E9FBEA" },
          { label: "Adjusted", value: adjusted, pillBg: "#E8F0FE" },
          { label: "Rejected", value: rejected, pillBg: "#FFE8EC" },
        ],
      };
    }

    if (activeTab === "recount") {
      return {
        title: "Quick Stats • Recount Queue",
        note: "Complete recount to unlock reconciliation for recount-required items.",
        stats: [
          { label: "Queued", value: queued, pillBg: "#FFE8EC" },
          { label: "In Progress", value: inprog, pillBg: "#E8F0FE" },
          { label: "Completed", value: completed, pillBg: "#E9FBEA" },
          { label: "Threshold Exceeded", value: exceeded, pillBg: "#FFF3D6" },
          { label: "High Impact", value: highImpact, pillBg: "#FFF3D6" },
        ],
      };
    }

    // variance tab
    return {
      title: "Quick Stats • Variance",
      note: "Variance report view across filtered scope.",
      stats: [
        { label: "Total Lines", value: filteredLines.length, pillBg: "#E8F0FE" },
        { label: "Threshold Exceeded", value: exceeded, pillBg: "#FFF3D6" },
        { label: "High Impact", value: highImpact, pillBg: "#FFF3D6" },
        { label: "Net Variance Qty", value: base.reduce((s, x) => s + Number(x.variance_qty || 0), 0), pillBg: "#EEF2F7" },
        { label: "Net Variance Value", value: currencyINR(base.reduce((s, x) => s + Number(x.variance_value || 0), 0)), pillBg: "#EEF2F7" },
      ],
    };
  }, [baseFiltered, filteredLines.length, activeTab]);

  /** modal */
  const openLine = (id) => {
    setActiveLineId(id);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setActiveLineId("");
  };
  const activeLine = useMemo(() => computedLines.find((l) => l.line_id === activeLineId), [computedLines, activeLineId]);

  const updateLine = (id, patch) => {
    setLines((prev) => prev.map((x) => (x.line_id === id ? { ...x, ...patch, last_updated: todayISO() } : x)));
  };

  /** export */
  const exportToCSV = () => {
    const header = [
      "Plan No",
      "Warehouse",
      "Scope Ref",
      "Category",
      "Item",
      "System Qty",
      "Counted Qty",
      "Variance Qty",
      "Variance %",
      "Variance Value",
      "Recount Required",
      "Recount Status",
      "Recount Assignee",
      "Reconciliation Status",
      "Reconciliation Action",
      "Remarks",
    ];
    const rows = filteredLines.map((l) =>
      [
        l.plan_no,
        l.warehouse_id,
        l.scope_ref,
        l.category,
        l.item_id,
        l.system_qty,
        l.counted_qty,
        l.variance_qty,
        l.variance_pct,
        l.variance_value,
        l.recount_required ? "Yes" : "No",
        l.recount_status,
        l.recount_assignee,
        l.reconciliation_status,
        l.reconciliation_action,
        (l.reconciliation_remarks || "").replaceAll(",", " "),
      ].join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cycle-count-${activeTab}.csv`;
    a.click();
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden" style={{ paddingTop: APP_TOPBAR_H }}>
      <PageBreadcrumb pageTitle="Cycle Count • Reconciliation & Variance" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-gray-800 truncate">Reconciliation & Variance</h2>
            <p className="text-sm text-gray-500">
              Variance review → Recount Queue (if needed) → Supervisor reconciliation → Posting.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={classNames(primaryBtn)}
              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
              onClick={exportToCSV}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-2">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const isActive = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(t.key);
                    setCurrentPage(1);
                  }}
                  className={classNames(
                    "relative rounded-xl px-4 py-2 text-sm font-semibold transition",
                    isActive ? "text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                  )}
                  style={isActive ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
                >
                  <div className="text-left">
                    <div>{t.label}</div>
                    <div className={classNames("text-[11px] font-medium", isActive ? "text-white/80" : "text-gray-400")}>
                      {t.sub}
                    </div>
                  </div>

                  {isActive && (
                    <span
                      className="absolute -bottom-[6px] left-4 right-4 h-[3px] rounded-full"
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div>
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="Plan / Item / BIN / Category / Description"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div>
                <label className={labelBase}>Warehouse</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={warehouse}
                  onChange={(e) => {
                    setWarehouse(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {WAREHOUSES.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.id} • {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelBase}>Plan</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={plan}
                  onChange={(e) => {
                    setPlan(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {plans.map((p) => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.plan_no} • {p.warehouse_id} • {p.scope_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelBase}>Variance Threshold %</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  value={thresholdPct}
                  onChange={(e) => {
                    setThresholdPct(e.target.value.replace(/[^\d.]/g, ""));
                    setCurrentPage(1);
                  }}
                  placeholder="e.g., 5"
                />
                <div className={classNames(helperBase, "mt-1")}>
                  If |variance %| ≥ threshold OR high impact → recount required.
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1300px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  {activeTab === "reconciliation" ? (
                    <tr>
                      <th className="px-4 py-3 text-left">Plan / Scope</th>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-right">System</th>
                      <th className="px-4 py-3 text-right">Final Count</th>
                      <th className="px-4 py-3 text-right">Variance</th>
                      <th className="px-4 py-3 text-right">Value</th>
                      <th className="px-4 py-3 text-left">Recon Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-left">Remarks</th>
                    </tr>
                  ) : activeTab === "recount" ? (
                    <tr>
                      <th className="px-4 py-3 text-left">Plan / Scope</th>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-right">System</th>
                      <th className="px-4 py-3 text-right">Counted</th>
                      <th className="px-4 py-3 text-left">Recount</th>
                      <th className="px-4 py-3 text-left">Assignee</th>
                      <th className="px-4 py-3 text-left">Due</th>
                      <th className="px-4 py-3 text-left">Reason</th>
                      <th className="px-4 py-3 text-left">Open</th>
                      <th className="px-4 py-3 text-left">Ops</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3 text-left">Plan</th>
                      <th className="px-4 py-3 text-left">Warehouse</th>
                      <th className="px-4 py-3 text-left">Scope</th>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-right">System</th>
                      <th className="px-4 py-3 text-right">Counted</th>
                      <th className="px-4 py-3 text-right">Variance</th>
                      <th className="px-4 py-3 text-right">Value</th>
                      <th className="px-4 py-3 text-left">Flags</th>
                      <th className="px-4 py-3 text-left">Open</th>
                    </tr>
                  )}
                </thead>

                <tbody>
                  {paginated.map((l) => {
                    const varianceTone =
                      Math.abs(l.variance_pct) >= thresholdNumber
                        ? "red"
                        : Math.abs(l.variance_pct) >= thresholdNumber / 2
                        ? "amber"
                        : "gray";

                    if (activeTab === "reconciliation") {
                      return (
                        <tr key={l.line_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{l.plan_no}</div>
                            <div className="text-xs text-gray-500">
                              {l.warehouse_id} • {l.scope_ref}
                            </div>

                            <div className="mt-1">
                              {l.recount_required ? (
                                <MiniPill text={`Recount ${l.recount_status}`} tone={l.recount_status === "Completed" ? "green" : "amber"} />
                              ) : (
                                <MiniPill text="No Recount" tone="gray" />
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{l.item_id}</div>
                            <div className="text-xs text-gray-500">{l.item_desc}</div>
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">{l.system_qty}</td>
                          <td className="px-4 py-3 text-right font-semibold">{l.counted_qty}</td>

                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold">{l.variance_qty}</div>
                            <div className="mt-1">
                              <MiniPill text={`${l.variance_pct.toFixed(2)}%`} tone={varianceTone} />
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">{currencyINR(l.variance_value)}</td>

                          <td className="px-4 py-3">
                            <select
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                              value={l.reconciliation_status}
                              onChange={(e) =>
                                updateLine(l.line_id, {
                                  reconciliation_status: e.target.value,
                                  reconciliation_action:
                                    e.target.value === "Accepted"
                                      ? "Accept Count"
                                      : e.target.value === "Adjusted"
                                      ? "Adjust Stock"
                                      : e.target.value === "Rejected"
                                      ? "Reject Count"
                                      : "",
                                })
                              }
                            >
                              <option value="Pending">Pending</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Adjusted">Adjusted</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                              value={l.reconciliation_action || ""}
                              onChange={(e) => updateLine(l.line_id, { reconciliation_action: e.target.value })}
                            >
                              <option value="">Select</option>
                              <option value="Accept Count">Accept Count</option>
                              <option value="Adjust Stock">Adjust Stock</option>
                              <option value="Reject Count">Reject Count</option>
                            </select>

                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => openLine(l.line_id)}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: FORTUNA_SECONDARY_BLUE }}
                              >
                                View details
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              className="w-[320px] max-w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                              value={l.reconciliation_remarks || ""}
                              onChange={(e) => updateLine(l.line_id, { reconciliation_remarks: e.target.value })}
                              placeholder="Reason for audit trail..."
                            />
                          </td>
                        </tr>
                      );
                    }

                    if (activeTab === "recount") {
                      const tone =
                        l.recount_status === "Queued"
                          ? "red"
                          : l.recount_status === "In Progress"
                          ? "blue"
                          : l.recount_status === "Completed"
                          ? "green"
                          : "gray";

                      return (
                        <tr key={l.line_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{l.plan_no}</div>
                            <div className="text-xs text-gray-500">
                              {l.warehouse_id} • {l.scope_ref}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{l.item_id}</div>
                            <div className="text-xs text-gray-500">{l.item_desc}</div>
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">{l.system_qty}</td>
                          <td className="px-4 py-3 text-right font-semibold">{l.counted_qty}</td>

                          <td className="px-4 py-3">
                            <MiniPill text={l.recount_status} tone={tone} />
                            <div className="text-xs text-gray-500 mt-1">{l.recount_required ? "Required" : "—"}</div>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                              value={l.recount_assignee || ""}
                              onChange={(e) => updateLine(l.line_id, { recount_assignee: e.target.value })}
                            >
                              <option value="">Unassigned</option>
                              {USERS.map((u) => (
                                <option key={u.id} value={u.name}>
                                  {u.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="mt-2 text-xs font-semibold hover:underline"
                              style={{ color: FORTUNA_SECONDARY_BLUE }}
                              onClick={() => updateLine(l.line_id, { recount_assignee: "Ravi (Counter)" })}
                            >
                              Assign to me
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                              value={l.recount_due_date || ""}
                              onChange={(e) => updateLine(l.line_id, { recount_due_date: e.target.value })}
                              placeholder="YYYY-MM-DD"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-800">
                              {l.highImpact ? "High impact OR threshold exceeded" : l.threshold_exceeded ? "Threshold exceeded" : l.recount_notes || "—"}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openLine(l.line_id)}
                              className="text-sm font-semibold hover:underline"
                              style={{ color: FORTUNA_SECONDARY_BLUE }}
                            >
                              Open
                            </button>
                          </td>

                          {/* OPS column */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={l.recount_status !== "Queued"}
                                className={classNames(
                                  "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                                  l.recount_status === "Queued"
                                    ? "border-gray-200 bg-white hover:bg-gray-50"
                                    : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                )}
                                onClick={() =>
                                  updateLine(l.line_id, {
                                    recount_status: "In Progress",
                                    recount_notes: l.recount_notes || "Recount started",
                                  })
                                }
                                style={l.recount_status === "Queued" ? { color: FORTUNA_SECONDARY_BLUE } : undefined}
                              >
                                Start
                              </button>

                              <button
                                type="button"
                                disabled={l.recount_status !== "In Progress"}
                                className={classNames(
                                  "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                                  l.recount_status === "In Progress"
                                    ? "border-gray-200 bg-white hover:bg-gray-50"
                                    : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                )}
                                onClick={() =>
                                  updateLine(l.line_id, {
                                    recount_status: "Completed",
                                    recount_notes: l.recount_notes ? `${l.recount_notes} • Completed` : "Recount completed",
                                  })
                                }
                                style={l.recount_status === "In Progress" ? { color: FORTUNA_PRIMARY_RED } : undefined}
                              >
                                Complete
                              </button>
                            </div>

                            <div className="mt-2 text-[11px] text-gray-500">
                              {l.recount_status === "Completed"
                                ? "Unlocked for Reconciliation"
                                : l.recount_status === "In Progress"
                                ? "Counter is recounting"
                                : "Waiting to start"}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // variance tab
                    return (
                      <tr key={l.line_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{l.plan_no}</div>
                          <div className="text-xs text-gray-500">{l.plan_id}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{l.warehouse_id}</div>
                          <div className="text-xs text-gray-500">{whName(l.warehouse_id)}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{l.scope_ref}</div>
                          <div className="text-xs text-gray-500">{l.last_updated}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{l.item_id}</div>
                          <div className="text-xs text-gray-500">{l.item_desc}</div>
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">{l.system_qty}</td>
                        <td className="px-4 py-3 text-right font-semibold">{l.counted_qty}</td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold">{l.variance_qty}</div>
                          <div className="mt-1">
                            <MiniPill text={`${l.variance_pct.toFixed(2)}%`} tone={varianceTone} />
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">{currencyINR(l.variance_value)}</td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {l.threshold_exceeded ? <MiniPill text="Threshold Exceeded" tone="red" /> : <MiniPill text="Within Limit" tone="gray" />}
                            {l.highImpact ? <MiniPill text="High Impact" tone="amber" /> : null}
                            {l.system_qty === 0 && l.counted_qty > 0 ? <MiniPill text="Found Stock" tone="amber" /> : null}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openLine(l.line_id)}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === "recount" ? 10 : 10} className="px-4 py-10 text-center text-gray-500">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom controls */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing {filteredLines.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredLines.length)} of {filteredLines.length} entries
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span>Records per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
              <span className="font-semibold">Flow:</span> Count Execution → Variance Generated → Threshold/Impact Check → Recount Queue → Reconciliation → Stock Adjustment Posting.
            </div>
          </div>

          {/* RIGHT */}
          <div className="min-w-0">
            <QuickStatsCard title={rightStats.title} stats={rightStats.stats} note={rightStats.note} />

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Plan Status (Reference)</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
              </div>

              <div className="mt-3 space-y-2 text-sm">
                {plans.map((p) => (
                  <div key={p.plan_id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{p.plan_no}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {p.warehouse_id} • {p.scope_type} • {p.scope_summary}
                        </div>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                  </div>
                ))}
              </div>

              <div className={classNames(helperBase, "mt-3")}>
                This card is just for quick reference while working.
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && activeLine && (
          <div className="fixed inset-0 z-50 bg-black/40">
            <div className="h-full w-full overflow-y-auto">
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col max-h-[92vh]">
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        View • {activeLine.plan_no} • {activeLine.item_id}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {activeLine.warehouse_id} • {whName(activeLine.warehouse_id)} • {activeLine.scope_ref}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeLine.threshold_exceeded ? <MiniPill text="Threshold Exceeded" tone="red" /> : <MiniPill text="Within Limit" tone="gray" />}
                        {activeLine.highImpact ? <MiniPill text="High Impact" tone="amber" /> : null}
                        {activeLine.recount_required ? (
                          <MiniPill
                            text={`Recount: ${activeLine.recount_status}`}
                            tone={
                              activeLine.recount_status === "Queued"
                                ? "red"
                                : activeLine.recount_status === "In Progress"
                                ? "blue"
                                : activeLine.recount_status === "Completed"
                                ? "green"
                                : "gray"
                            }
                          />
                        ) : (
                          <MiniPill text="No Recount" tone="gray" />
                        )}
                        <MiniPill
                          text={`Recon: ${activeLine.reconciliation_status}`}
                          tone={
                            activeLine.reconciliation_status === "Pending"
                              ? "amber"
                              : activeLine.reconciliation_status === "Adjusted"
                              ? "blue"
                              : activeLine.reconciliation_status === "Accepted"
                              ? "green"
                              : "red"
                          }
                        />
                      </div>
                    </div>

                    <button onClick={closeModal} className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100" aria-label="Close">
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Variance Details</h4>
                        <div className="mt-3 space-y-2 text-sm">
                          <SummaryRow label="Category" value={activeLine.category || "—"} />
                          <SummaryRow label="Item" value={`${activeLine.item_id} • ${activeLine.item_desc}`} />
                          <SummaryRow label="UOM" value={activeLine.uom} />
                          <SummaryRow label="Unit Cost" value={currencyINR(activeLine.unit_cost)} />
                          <SummaryRow label="System Qty" value={String(activeLine.system_qty)} />
                          <SummaryRow label="Counted Qty" value={String(activeLine.counted_qty)} />
                          <SummaryRow label="Variance Qty" value={String(activeLine.variance_qty)} />
                          <SummaryRow label="Variance %" value={`${activeLine.variance_pct.toFixed(2)}%`} />
                          <SummaryRow label="Variance Value" value={currencyINR(activeLine.variance_value)} />
                          <SummaryRow label="Threshold %" value={`${thresholdNumber}%`} />
                        </div>

                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                          <span className="font-semibold">Rule:</span> If |variance %| ≥ threshold OR high impact → recount required.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Reconciliation</h4>
                        <p className={classNames(helperBase, "mt-1")}>
                          Supervisor decides final action after recount completion (if recount required).
                        </p>

                        <div className="mt-4 space-y-3">
                          <div>
                            <label className={labelBase}>Reconciliation Status</label>
                            <select
                              className={classNames(inputBase, "mt-1")}
                              value={activeLine.reconciliation_status}
                              onChange={(e) => updateLine(activeLine.line_id, { reconciliation_status: e.target.value })}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Adjusted">Adjusted</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>

                          <div>
                            <label className={labelBase}>Action</label>
                            <select
                              className={classNames(inputBase, "mt-1")}
                              value={activeLine.reconciliation_action || ""}
                              onChange={(e) => updateLine(activeLine.line_id, { reconciliation_action: e.target.value })}
                            >
                              <option value="">Select</option>
                              <option value="Accept Count">Accept Count</option>
                              <option value="Adjust Stock">Adjust Stock</option>
                              <option value="Reject Count">Reject Count</option>
                            </select>
                            <div className={classNames(helperBase, "mt-1")}>
                              * “Adjust Stock” will later trigger Inventory Adjustment transaction (Phase-2 API).
                            </div>
                          </div>

                          <div>
                            <label className={labelBase}>Remarks</label>
                            <textarea
                              className={classNames(inputBase, "mt-1 min-h-[110px] resize-y")}
                              value={activeLine.reconciliation_remarks || ""}
                              onChange={(e) => updateLine(activeLine.line_id, { reconciliation_remarks: e.target.value })}
                              placeholder="Reason / notes for audit trail..."
                            />
                          </div>

                          {/* Recount Ops (optional) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Recount Status</div>
                                <div className={helperBase}>Queue progression.</div>
                              </div>
                              <select
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                value={activeLine.recount_status}
                                onChange={(e) => updateLine(activeLine.line_id, { recount_status: e.target.value })}
                              >
                                <option value="Not Required">Not Required</option>
                                <option value="Queued">Queued</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Assignee</div>
                                <div className={helperBase}>Who will recount.</div>
                              </div>
                              <select
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                value={activeLine.recount_assignee || ""}
                                onChange={(e) => updateLine(activeLine.line_id, { recount_assignee: e.target.value })}
                              >
                                <option value="">Unassigned</option>
                                {USERS.map((u) => (
                                  <option key={u.id} value={u.name}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                            <span className="font-semibold">Audit Trail:</span> status/action/remarks should be stored with user + timestamp in API.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t bg-white px-5 py-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <button type="button" className={outlineBtn} onClick={closeModal}>
                        Close
                      </button>

                      <div className="flex w-full sm:w-auto gap-2">
                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                          onClick={() => {
                            alert("Saved (demo). Next: connect API.");
                            closeModal();
                          }}
                        >
                          Save (Demo)
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                          onClick={() => {
                            alert("Post/Adjust (demo). Next: create Inventory Adjustment + accounting postings in backend.");
                            closeModal();
                          }}
                        >
                          Post / Adjust (Demo)
                        </button>
                      </div>
                    </div>

                    <div className={classNames(helperBase, "mt-2")}>Modal uses internal scroll — header/footer never hide.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* End Modal */}
      </div>
    </div>
  );
}