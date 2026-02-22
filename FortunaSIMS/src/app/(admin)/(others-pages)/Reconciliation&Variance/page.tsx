"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** ===== Fortuna Theme ===== */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** ===== Fix for Top App Header overlap (put your real value) ===== */
const APP_TOPBAR_H = 74; // adjust 64/72/74 based on your layout

/** ===== Tabs ===== */
type TabKey = "variance" | "reconciliation" | "recount";

/** ===== Masters ===== */
const PLAN_STATUS = [
  "Draft",
  "Planned",
  "Counting In-Progress",
  "Awaiting Approval",
  "Approved",
  "Posted",
  "Cancelled",
] as const;

const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH" },
  { id: "WH-002", name: "Hyderabad WH" },
  { id: "WH-003", name: "Chennai WH" },
] as const;

type PlanStatus = (typeof PLAN_STATUS)[number];

type CountPlan = {
  plan_id: string;
  plan_no: string;
  plan_type: "Cycle Count" | "Physical Audit";
  count_mode: "Blind" | "Guided";
  warehouse_id: string;
  scheduled_date: string;
  status: PlanStatus;
  scope_type: "BIN" | "ITEM";
  scope_summary: string;
  sku_count: number;
};

type VarianceLine = {
  line_id: string;
  plan_id: string;
  plan_no: string;
  warehouse_id: string;

  scope_ref: string; // BIN/RACK/ITEM reference
  item_id: string;
  item_desc: string;
  uom: string;

  system_qty: number; // book
  counted_qty: number; // physical
  variance_qty: number; // counted - system
  variance_pct: number; // abs(variance)/system *100 (system 0 => 100 if variance !=0)

  threshold_exceeded: boolean;

  recount_required: boolean; // derived / user override
  recount_status: "Queued" | "In Progress" | "Completed" | "Not Required";

  reconciliation_status: "Pending" | "Accepted" | "Adjusted" | "Rejected";
  reconciliation_action: "Accept Count" | "Adjust Stock" | "Reject Count" | "";
  reconciliation_remarks: string;

  last_updated: string;
};

/** ===== Demo Plans ===== */
const SAMPLE_PLANS: CountPlan[] = [
  {
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-002",
    scheduled_date: "2026-02-14",
    status: "Awaiting Approval",
    scope_type: "BIN",
    scope_summary: "Z-A-01-01 → Z-A-01-10",
    sku_count: 42,
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
    sku_count: 18,
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
    scope_summary: "Full WH",
    sku_count: 220,
  },
];

/** ===== Demo Variance Lines =====
 * Rule: threshold_exceeded => auto recount queue
 * Threshold can be changed in UI (default 5%)
 */
const SAMPLE_VARIANCES: VarianceLine[] = [
  {
    line_id: "VL-0001",
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    scope_ref: "BIN Z-A-01-03",
    item_id: "SKU-10021",
    item_desc: "HDPE Bottle 1L",
    uom: "Nos",
    system_qty: 1200,
    counted_qty: 1120,
    variance_qty: -80,
    variance_pct: 6.67,
    threshold_exceeded: true,
    recount_required: true,
    recount_status: "Queued",
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
    item_id: "SKU-33011",
    item_desc: "Carton Box 5-ply",
    uom: "Nos",
    system_qty: 500,
    counted_qty: 498,
    variance_qty: -2,
    variance_pct: 0.4,
    threshold_exceeded: false,
    recount_required: false,
    recount_status: "Not Required",
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
    scope_ref: "ITEM FAST MOVING",
    item_id: "SKU-77801",
    item_desc: "Detergent Powder 10kg",
    uom: "Bag",
    system_qty: 80,
    counted_qty: 70,
    variance_qty: -10,
    variance_pct: 12.5,
    threshold_exceeded: true,
    recount_required: true,
    recount_status: "In Progress",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
  {
    line_id: "VL-0004",
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    scope_ref: "ITEM FAST MOVING",
    item_id: "SKU-88910",
    item_desc: "Hand Gloves - Medium",
    uom: "Pair",
    system_qty: 0,
    counted_qty: 15,
    variance_qty: 15,
    variance_pct: 100,
    threshold_exceeded: true,
    recount_required: true,
    recount_status: "Queued",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
];

/** ===== UI helpers ===== */
function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/20 focus:border-[#005F99]/40";

const labelBase = "text-xs font-semibold text-gray-700";
const helperBase = "text-[11px] text-gray-500";

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition active:scale-95";

const outlineBtn =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition active:scale-95";

function StatusPill({ status }: { status: string }) {
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

function MiniPill({ text, tone }: { text: string; tone: "red" | "blue" | "amber" | "green" | "gray" }) {
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

/** ===== Quick Stats Card (Right Panel) ===== */
function QuickStatsCard({
  stats,
}: {
  stats: {
    total: number;
    pendingRecon: number;
    thresholdExceeded: number;
    recountQueued: number;
    recountInProgress: number;
    netVariance: number;
  };
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Quick Stats</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <StatLine label="Total Variance Lines" value={stats.total} pillBg="#E8F0FE" />
        <StatLine label="Reconciliation Pending" value={stats.pendingRecon} pillBg="#F1E9FF" />
        <div className="my-3 border-t border-gray-100" />
        <StatLine label="Threshold Exceeded" value={stats.thresholdExceeded} pillBg="#FFF3D6" />
        <StatLine label="Recount Queued" value={stats.recountQueued} pillBg="#FFE8EC" />
        <StatLine label="Recount In-Progress" value={stats.recountInProgress} pillBg="#E8F0FE" />
        <div className="my-3 border-t border-gray-100" />
        <StatLine label="Net Variance Qty" value={stats.netVariance} pillBg="#EEF2F7" />

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-semibold">Note:</span> Filters apply to stats + export.
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value, pillBg }: { label: string; value: number | string; pillBg: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: pillBg }}>
        {value}
      </span>
    </div>
  );
}

/** ===== Main Page ===== */
export default function ReconciliationVariancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("variance");

  const [plans] = useState<CountPlan[]>(SAMPLE_PLANS);
  const [lines, setLines] = useState<VarianceLine[]>(SAMPLE_VARIANCES);

  // filters
  const [warehouse, setWarehouse] = useState<string>("All");
  const [plan, setPlan] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  // recount threshold
  const [thresholdPct, setThresholdPct] = useState<string>("5"); // default 5%

  // pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // modal (detail)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeLineId, setActiveLineId] = useState<string>("");

  const whName = (whId: string) => WAREHOUSES.find((w) => w.id === whId)?.name || whId;

  const thresholdNumber = useMemo(() => {
    const n = Number(thresholdPct);
    return Number.isFinite(n) && n >= 0 ? n : 5;
  }, [thresholdPct]);

  /** Derived: recompute threshold_exceeded & auto queue flags (demo) */
  const computedLines = useMemo(() => {
    return lines.map((l) => {
      const exceeded = Math.abs(l.variance_pct) >= thresholdNumber;
      const recountRequired = exceeded ? true : l.recount_required;

      // if exceeded, ensure in queue unless already completed/not required
      let recountStatus = l.recount_status;
      if (exceeded && (recountStatus === "Not Required")) recountStatus = "Queued";
      if (!exceeded && recountStatus !== "Completed") {
        // keep user's manual state; we won't force Not Required here
      }

      return {
        ...l,
        threshold_exceeded: exceeded,
        recount_required: recountRequired,
        recount_status: recountStatus,
      };
    });
  }, [lines, thresholdNumber]);

  /** Filtered list */
  const filteredLines = useMemo(() => {
    const q = search.trim().toLowerCase();

    return computedLines.filter((l) => {
      const byWh = warehouse === "All" ? true : l.warehouse_id === warehouse;
      const byPlan = plan === "All" ? true : l.plan_id === plan;

      const bySearch =
        !q ||
        l.plan_no.toLowerCase().includes(q) ||
        l.item_id.toLowerCase().includes(q) ||
        l.item_desc.toLowerCase().includes(q) ||
        l.scope_ref.toLowerCase().includes(q);

      // tab-specific constraints
      if (activeTab === "recount") {
        // show only queued/in-progress/completed recount-required
        return byWh && byPlan && bySearch && l.recount_required === true;
      }
      if (activeTab === "reconciliation") {
        // reconciliation relevant = pending/needs action
        return byWh && byPlan && bySearch;
      }
      // variance tab: all
      return byWh && byPlan && bySearch;
    });
  }, [computedLines, warehouse, plan, search, activeTab]);

  /** Stats */
  const quickStats = useMemo(() => {
    const base = computedLines.filter((l) => {
      const byWh = warehouse === "All" ? true : l.warehouse_id === warehouse;
      const byPlan = plan === "All" ? true : l.plan_id === plan;
      const q = search.trim().toLowerCase();
      const bySearch =
        !q ||
        l.plan_no.toLowerCase().includes(q) ||
        l.item_id.toLowerCase().includes(q) ||
        l.item_desc.toLowerCase().includes(q) ||
        l.scope_ref.toLowerCase().includes(q);
      return byWh && byPlan && bySearch;
    });

    const pendingRecon = base.filter((x) => x.reconciliation_status === "Pending").length;
    const thresholdExceeded = base.filter((x) => x.threshold_exceeded).length;
    const recountQueued = base.filter((x) => x.recount_status === "Queued").length;
    const recountInProgress = base.filter((x) => x.recount_status === "In Progress").length;
    const netVariance = base.reduce((s, x) => s + Number(x.variance_qty || 0), 0);

    return {
      total: base.length,
      pendingRecon,
      thresholdExceeded,
      recountQueued,
      recountInProgress,
      netVariance,
    };
  }, [computedLines, warehouse, plan, search]);

  /** Pagination */
  const totalPages = Math.ceil(filteredLines.length / itemsPerPage);
  const paginated = filteredLines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** Actions */
  const openLine = (id: string) => {
    setActiveLineId(id);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setActiveLineId("");
  };

  const activeLine = useMemo(() => computedLines.find((l) => l.line_id === activeLineId), [computedLines, activeLineId]);

  const updateLine = (id: string, patch: Partial<VarianceLine>) => {
    setLines((prev) => prev.map((x) => (x.line_id === id ? { ...x, ...patch, last_updated: todayISO() } : x)));
  };

  const exportToCSV = () => {
    const header = [
      "Plan No",
      "Warehouse",
      "Scope Ref",
      "Item",
      "System Qty",
      "Counted Qty",
      "Variance Qty",
      "Variance %",
      "Threshold Exceeded",
      "Recount Status",
      "Reconciliation Status",
      "Reconciliation Action",
      "Remarks",
    ];

    const rows = filteredLines.map((l) =>
      [
        l.plan_no,
        l.warehouse_id,
        l.scope_ref,
        l.item_id,
        l.system_qty,
        l.counted_qty,
        l.variance_qty,
        l.variance_pct,
        l.threshold_exceeded ? "Yes" : "No",
        l.recount_status,
        l.reconciliation_status,
        l.reconciliation_action,
        (l.reconciliation_remarks || "").replaceAll(",", " "),
      ].join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cycle-count-reconciliation-variance.csv";
    a.click();
  };

  /** UI: Tabs */
  const TABS: Array<{ key: TabKey; label: string; sub: string }> = [
    { key: "variance", label: "Variance Summary", sub: "See all variances (plan/bin/item wise)" },
    { key: "reconciliation", label: "Reconciliation", sub: "Accept / Adjust / Reject with remarks" },
    { key: "recount", label: "Recount Queue", sub: "Auto queue when threshold exceeded" },
  ];

  return (
    <div
      className="w-full max-w-[100vw] min-w-0 overflow-x-hidden"
      style={{ paddingTop: APP_TOPBAR_H }} // ✅ FIX: prevents heading hide under app header
    >
      <PageBreadcrumb pageTitle="Cycle Count • Reconciliation & Variance" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-gray-800 truncate">Reconciliation & Variance</h2>
            <p className="text-sm text-gray-500">
              Variance review → (if threshold exceeded) auto Recount Queue → Final reconciliation.
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

        {/* Layout: Left content + Right stats */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div>
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="Plan / Item / BIN / Description"
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
                  If |variance %| ≥ threshold → auto Recount Queue.
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1400px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Scope Ref</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-right">System</th>
                    <th className="px-4 py-3 text-right">Counted</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                    <th className="px-4 py-3 text-left">Flags</th>
                    <th className="px-4 py-3 text-left">Recount</th>
                    <th className="px-4 py-3 text-left">Reconciliation</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.map((l) => {
                    const varianceTone =
                      Math.abs(l.variance_pct) >= thresholdNumber ? "red" : Math.abs(l.variance_pct) >= thresholdNumber / 2 ? "amber" : "gray";

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
                            <MiniPill text={`${l.variance_pct.toFixed(2)}%`} tone={varianceTone as any} />
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {l.threshold_exceeded ? (
                              <MiniPill text="Threshold Exceeded" tone="red" />
                            ) : (
                              <MiniPill text="Within Limit" tone="gray" />
                            )}
                            {l.system_qty === 0 && l.counted_qty > 0 ? <MiniPill text="Found Stock" tone="amber" /> : null}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <MiniPill text={l.recount_status} tone={l.recount_status === "Queued" ? "red" : l.recount_status === "In Progress" ? "blue" : l.recount_status === "Completed" ? "green" : "gray"} />
                            <div className="text-xs text-gray-500">{l.recount_required ? "Recount Required" : "Not Required"}</div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <MiniPill text={l.reconciliation_status} tone={l.reconciliation_status === "Pending" ? "amber" : l.reconciliation_status === "Adjusted" ? "blue" : l.reconciliation_status === "Accepted" ? "green" : "gray"} />
                            <div className="text-xs text-gray-500">{l.reconciliation_action || "—"}</div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openLine(l.line_id)}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                          >
                            View / Reconcile
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
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
              <span className="font-semibold">Flow:</span> Count Execution → Variance Generated → Threshold Check → Recount Queue (if needed) → Final Reconciliation → Post / Adjust.
            </div>
          </div>

          {/* RIGHT */}
          <div className="min-w-0">
            <QuickStatsCard stats={quickStats} />

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
                This card is just for quick reference while reconciling.
              </div>
            </div>
          </div>
        </div>

        {/* ===== Modal: View / Reconcile ===== */}
        {isModalOpen && activeLine && (
          <div className="fixed inset-0 z-50 bg-black/40">
            <div className="h-full w-full overflow-y-auto">
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col max-h-[92vh]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        Reconcile Variance • {activeLine.plan_no} • {activeLine.item_id}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {activeLine.warehouse_id} • {whName(activeLine.warehouse_id)} • {activeLine.scope_ref}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeLine.threshold_exceeded ? <MiniPill text="Threshold Exceeded" tone="red" /> : <MiniPill text="Within Limit" tone="gray" />}
                        <MiniPill text={`Recount: ${activeLine.recount_status}`} tone={activeLine.recount_status === "Queued" ? "red" : activeLine.recount_status === "In Progress" ? "blue" : activeLine.recount_status === "Completed" ? "green" : "gray"} />
                        <MiniPill text={`Recon: ${activeLine.reconciliation_status}`} tone={activeLine.reconciliation_status === "Pending" ? "amber" : activeLine.reconciliation_status === "Adjusted" ? "blue" : activeLine.reconciliation_status === "Accepted" ? "green" : "gray"} />
                      </div>
                    </div>

                    <button onClick={closeModal} className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100" aria-label="Close">
                      ✕
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Left: numbers */}
                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Variance Details</h4>

                        <div className="mt-3 space-y-2 text-sm">
                          <SummaryRow label="Item" value={`${activeLine.item_id} • ${activeLine.item_desc}`} />
                          <SummaryRow label="UOM" value={activeLine.uom} />
                          <SummaryRow label="System Qty" value={String(activeLine.system_qty)} />
                          <SummaryRow label="Counted Qty" value={String(activeLine.counted_qty)} />
                          <SummaryRow label="Variance Qty" value={String(activeLine.variance_qty)} />
                          <SummaryRow label="Variance %" value={`${activeLine.variance_pct.toFixed(2)}%`} />
                          <SummaryRow label="Threshold %" value={`${thresholdNumber}%`} />
                        </div>

                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                          <span className="font-semibold">Rule:</span> If |variance %| ≥ threshold → auto Recount Queue.
                        </div>
                      </div>

                      {/* Right: reconciliation actions */}
                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Reconciliation Action</h4>
                        <p className={classNames(helperBase, "mt-1")}>
                          Supervisor/Approver decides final action after recount completion (or if not required).
                        </p>

                        <div className="mt-4 space-y-3">
                          <div>
                            <label className={labelBase}>Reconciliation Status</label>
                            <select
                              className={classNames(inputBase, "mt-1")}
                              value={activeLine.reconciliation_status}
                              onChange={(e) =>
                                updateLine(activeLine.line_id, {
                                  reconciliation_status: e.target.value as VarianceLine["reconciliation_status"],
                                })
                              }
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
                              value={activeLine.reconciliation_action}
                              onChange={(e) =>
                                updateLine(activeLine.line_id, {
                                  reconciliation_action: e.target.value as VarianceLine["reconciliation_action"],
                                })
                              }
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
                              value={activeLine.reconciliation_remarks}
                              onChange={(e) => updateLine(activeLine.line_id, { reconciliation_remarks: e.target.value })}
                              placeholder="Reason / notes for audit trail..."
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Force Recount Required</div>
                                <div className={helperBase}>Manual override (even if within limit).</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={activeLine.recount_required}
                                onChange={(e) =>
                                  updateLine(activeLine.line_id, {
                                    recount_required: e.target.checked,
                                    recount_status: e.target.checked ? (activeLine.recount_status === "Completed" ? "Completed" : "Queued") : "Not Required",
                                  })
                                }
                                className="h-4 w-4"
                              />
                            </div>

                            <div className="rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Recount Status</div>
                                <div className={helperBase}>Queue progression.</div>
                              </div>
                              <select
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                value={activeLine.recount_status}
                                onChange={(e) =>
                                  updateLine(activeLine.line_id, {
                                    recount_status: e.target.value as VarianceLine["recount_status"],
                                  })
                                }
                              >
                                <option value="Not Required">Not Required</option>
                                <option value="Queued">Queued</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
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

                  {/* Footer */}
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
                            alert("Saved (demo). Next: connect API to persist reconciliation decision.");
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

                    <div className={classNames(helperBase, "mt-2")}>
                      UI safe: modal uses <span className="font-semibold">max-h + internal scroll</span> so buttons/heading never hide.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ===== End Modal ===== */}
      </div>
    </div>
  );
}

/** ===== utils ===== */
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}