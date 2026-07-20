"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Master */
const PLAN_STATUS = [
  "Draft",
  "Planned",
  "Counting In-Progress",
  "Awaiting Approval",
  "Approved",
  "Posted",
  "Cancelled",
];

const ROLE_TYPES = ["Counter", "Supervisor", "Approver"];

const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH" },
  { id: "WH-002", name: "Hyderabad WH" },
  { id: "WH-003", name: "Chennai WH" },
];

const USERS = [
  { id: "U-001", name: "Ravi", mobile: "9xxxx11111", wh: ["WH-001", "WH-002"] },
  { id: "U-002", name: "Kiran", mobile: "9xxxx22222", wh: ["WH-001"] },
  { id: "U-003", name: "Aparna", mobile: "9xxxx33333", wh: ["WH-001", "WH-003"] },
  { id: "U-004", name: "Suresh", mobile: "9xxxx44444", wh: ["WH-002"] },
  { id: "U-005", name: "Divya", mobile: "9xxxx55555", wh: ["WH-003"] },
];

/** Demo plans */
const SAMPLE_PLANS = [
  {
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-002",
    scheduled_date: "2026-02-14",
    status: "Counting In-Progress",
    scope_type: "BIN",
    scope_summary: "Z-A-01-01 → Z-A-01-10",
    sku_count: 42,
    variance_qty: -730,
    accuracy_pct: 94.3,
    assigned_to: ["U-001", "U-004"],
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
    variance_qty: -40,
    accuracy_pct: 99.1,
    assigned_to: ["U-003"],
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
    variance_qty: -10,
    accuracy_pct: 99.99,
    assigned_to: ["U-005"],
  },
  {
    plan_id: "CCP-UUID-0004",
    plan_no: "CC-2026-0008",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-001",
    scheduled_date: "2026-02-20",
    status: "Draft",
    scope_type: "BIN",
    scope_summary: "Z-B-01-01 → Z-B-01-05",
    sku_count: 12,
    variance_qty: 0,
    accuracy_pct: 0,
    assigned_to: [],
  },
];

/** UI helpers */
function classNames(...v: (string | false | null | undefined)[]) {
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

/** Pills */
function StatusPill({ status }: { status: string }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const cls =
    status === "Draft"
      ? "bg-gray-100 text-gray-700"
      : status === "Planned"
      ? "bg-blue-50 text-blue-700"
      : status === "Counting In-Progress"
      ? "bg-amber-50 text-amber-800"
      : status === "Awaiting Approval"
      ? "bg-purple-50 text-purple-700"
      : status === "Approved"
      ? "bg-green-50 text-green-700"
      : status === "Posted"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Cancelled"
      ? "bg-rose-50 text-rose-700"
      : "bg-gray-100 text-gray-700";

  return <span className={classNames(base, cls)}>{status}</span>;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

type QuickStats = {
  total: number;
  byStatus: Record<string, number>;
  totalVariance: number;
  avgAccuracy: number;
};

/** Quick stats card (RIGHT panel) */
function QuickStatsCard({ stats }: { stats: QuickStats }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Quick Stats</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <StatLine label="Total Records" value={stats.total} pillBg="#E8F0FE" />
        <div className="my-3 border-t border-gray-100" />

        {PLAN_STATUS.map((s) => (
          <StatLine
            key={s}
            label={s}
            value={stats.byStatus[s] || 0}
            pillBg={
              s === "Draft"
                ? "#EEF2F7"
                : s === "Planned"
                ? "#E8F0FE"
                : s === "Counting In-Progress"
                ? "#FFF3D6"
                : s === "Awaiting Approval"
                ? "#F1E9FF"
                : s === "Approved"
                ? "#E8F7EF"
                : s === "Posted"
                ? "#E7FAF3"
                : "#FFE8EC"
            }
          />
        ))}

        <div className="my-3 border-t border-gray-100" />
        <StatLine label="Avg Accuracy %" value={stats.avgAccuracy.toFixed(2)} pillBg="#E8F0FE" />
        <StatLine label="Total Variance Qty" value={stats.totalVariance} pillBg="#FFF3D6" />

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-semibold">Tip:</span> Filters apply to stats + export.
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value, pillBg }: { label: string; value: string | number; pillBg?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: pillBg }}>
        {value}
      </span>
    </div>
  );
}

/** MAIN */
export default function CCPAssignmentPage() {
  const [plans] = useState(SAMPLE_PLANS);

  // Filters
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("All");
  const [status, setStatus] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<typeof SAMPLE_PLANS[number] | null>(null);

  // Modal form
  const [assignment, setAssignment] = useState<{
    role_type: string;
    include_mobile: boolean;
    max_per_user: string;
    allow_reassign: boolean;
    due_date: string;
    remarks: string;
    assignees: string[];
  }>({
    role_type: "Counter",
    include_mobile: true,
    max_per_user: "0",
    allow_reassign: true,
    due_date: "",
    remarks: "",
    assignees: [],
  });

  const [userSearch, setUserSearch] = useState("");

  const whName = (whId: string) => WAREHOUSES.find((w) => w.id === whId)?.name || whId;

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const bySearch =
        (p.plan_no || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.plan_type || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.scope_summary || "").toLowerCase().includes(search.toLowerCase());

      const byWh = warehouse === "All" ? true : p.warehouse_id === warehouse;
      const bySt = status === "All" ? true : p.status === status;

      return bySearch && byWh && bySt;
    });
  }, [plans, search, warehouse, status]);

  const quickStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let totalVariance = 0;
    let accSum = 0;
    let accCount = 0;

    filteredPlans.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      totalVariance += Number(p.variance_qty || 0);

      const a = Number(p.accuracy_pct || 0);
      if (a > 0) {
        accSum += a;
        accCount += 1;
      }
    });

    return {
      total: filteredPlans.length,
      byStatus,
      totalVariance,
      avgAccuracy: accCount ? accSum / accCount : 0,
    };
  }, [filteredPlans]);

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getAssignStatus = (plan: typeof SAMPLE_PLANS[number]) => {
    const assignedCount = (plan.assigned_to || []).length;
    if (assignedCount === 0) return "Not Assigned";
    if (assignedCount >= 2) return "Fully Assigned"; // demo
    return "Partially Assigned";
  };

  const assignPill = (s: string) => {
    const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
    const cls =
      s === "Not Assigned"
        ? "bg-gray-100 text-gray-700"
        : s === "Partially Assigned"
        ? "bg-amber-50 text-amber-800"
        : "bg-green-50 text-green-700";
    return <span className={classNames(base, cls)}>{s}</span>;
  };

  const exportToCSV = () => {
    const header = [
      "Plan No",
      "Plan Type",
      "Warehouse",
      "Scheduled Date",
      "Status",
      "Scope Type",
      "Scope Summary",
      "SKU Count",
      "Assigned Users",
    ];

    const rows = filteredPlans.map((p) =>
      [
        p.plan_no,
        p.plan_type,
        p.warehouse_id,
        p.scheduled_date,
        p.status,
        p.scope_type,
        (p.scope_summary || "").replaceAll(",", " "),
        String(p.sku_count || 0),
        (p.assigned_to || [])
          .map((id) => USERS.find((u) => u.id === id)?.name || id)
          .join("|"),
      ].join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ccp-assignment.csv";
    link.click();
  };

  const resetAssignmentForm = (plan: typeof SAMPLE_PLANS[number] | null) => {
    setAssignment({
      role_type: "Counter",
      include_mobile: true,
      max_per_user: "0",
      allow_reassign: true,
      due_date: "",
      remarks: "",
      assignees: (plan?.assigned_to || []).slice(),
    });
    setUserSearch("");
  };

  const openAssignPopup = (plan: typeof SAMPLE_PLANS[number]) => {
    setActivePlan(plan);
    resetAssignmentForm(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActivePlan(null);
    setUserSearch("");
  };

  const toggleAssignee = (userId: string) => {
    setAssignment((p) => {
      const exists = p.assignees.includes(userId);
      return {
        ...p,
        assignees: exists ? p.assignees.filter((id) => id !== userId) : [...p.assignees, userId],
      };
    });
  };

  const availableUsers = useMemo(() => {
    const wh = activePlan?.warehouse_id;
    const base = wh ? USERS.filter((u) => u.wh.includes(wh)) : USERS;

    const q = userSearch.trim().toLowerCase();
    if (!q) return base;

    return base.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.mobile.toLowerCase().includes(q)
    );
  }, [activePlan, userSearch]);

  const validateAndSave = () => {
    if (!activePlan) return;

    if (!assignment.role_type) {
      alert("Role Type is required.");
      return;
    }
    if (assignment.assignees.length === 0) {
      alert("Select at least one assignee.");
      return;
    }
    if (assignment.max_per_user.trim()) {
      const n = Number(assignment.max_per_user);
      if (!Number.isFinite(n) || n < 0) {
        alert("Max tasks per user must be 0 or a valid number.");
        return;
      }
    }

    console.log("ASSIGNMENT_SAVE_DEMO", { plan: activePlan, assignment });
    alert("Assignment saved (demo). Next: connect API + create tasks for counters.");
    closeModal();
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden">
      <PageBreadcrumb pageTitle="Cycle Count Assignment" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">CCP Assignment</h2>
            <p className="text-sm text-gray-500">
              Assign users to Count Plans (popup). Quick Stats panel like List page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportToCSV}
              className={classNames(primaryBtn)}
              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
            >
              Export to CSV
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div>
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="Search Plan No / Type / Scope"
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
                <label className={labelBase}>Status</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {PLAN_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1200px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Plan No</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-left">Scheduled</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Assign Status</th>
                    <th className="px-4 py-3 text-left">SKUs</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPlans.map((p) => {
                    const assignStatus = getAssignStatus(p);
                    return (
                      <tr key={p.plan_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {p.plan_no}
                          <div className="mt-1 text-xs text-gray-500">{p.plan_id}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{p.warehouse_id}</div>
                          <div className="mt-1 text-xs text-gray-500">{whName(p.warehouse_id)}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{p.plan_type}</div>
                          <div className="mt-1 text-xs text-gray-500">{p.count_mode} Count</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{p.scope_type}</div>
                          <div className="mt-1 text-xs text-gray-500">{p.scope_summary}</div>
                        </td>

                        <td className="px-4 py-3">{p.scheduled_date}</td>

                        <td className="px-4 py-3">
                          <StatusPill status={p.status} />
                        </td>

                        <td className="px-4 py-3">{assignPill(assignStatus)}</td>

                        <td className="px-4 py-3 font-semibold text-gray-800">{p.sku_count}</td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => openAssignPopup(p)}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedPlans.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
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
                Showing {filteredPlans.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredPlans.length)} of {filteredPlans.length} entries
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
          </div>

          {/* RIGHT */}
          <div className="min-w-0">
            <QuickStatsCard stats={quickStats} />
          </div>
        </div>

        {/* ========================= MODAL (UI FIXED) ========================= */}
        {isModalOpen && activePlan && (
          <div className="fixed inset-0 z-50 bg-black/40">
            {/* FIX 1: items-start (not center) so header never hides. */}
            <div className="h-full w-full overflow-y-auto">
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                {/* FIX 2: fixed height + flex layout. */}
                <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col h-[92vh]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        Assign Users • {activePlan.plan_no}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Warehouse: <span className="font-semibold">{activePlan.warehouse_id}</span> •{" "}
                        {whName(activePlan.warehouse_id)} • Scope:{" "}
                        <span className="font-semibold">{activePlan.scope_type}</span> ({activePlan.scope_summary})
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                        >
                          {activePlan.plan_type}
                        </span>
                        <StatusPill status={activePlan.status} />
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700">
                          {activePlan.count_mode} Count
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Body (scrollable) — FIX 3: flex-1 + min-h-0 */}
                  <div className="ccpModalBody flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Left */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Assignment Setup</h4>
                          <p className={classNames(helperBase, "mt-1")}>
                            UI Fix: modal uses fixed height + internal scroll (header/footer always visible).
                          </p>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelBase}>Role Type</label>
                              <select
                                className={classNames(inputBase, "mt-1")}
                                value={assignment.role_type}
                                onChange={(e) => setAssignment((p) => ({ ...p, role_type: e.target.value }))}
                              >
                                {ROLE_TYPES.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={labelBase}>Due Date</label>
                              <input
                                type="date"
                                className={classNames(inputBase, "mt-1")}
                                value={assignment.due_date}
                                onChange={(e) => setAssignment((p) => ({ ...p, due_date: e.target.value }))}
                              />
                              <p className={classNames(helperBase, "mt-1")}>Optional due date for counters.</p>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelBase}>Max Tasks per User</label>
                              <input
                                className={classNames(inputBase, "mt-1")}
                                value={assignment.max_per_user}
                                onChange={(e) =>
                                  setAssignment((p) => ({
                                    ...p,
                                    max_per_user: e.target.value.replace(/[^\d]/g, ""),
                                  }))
                                }
                                placeholder="0 = no limit"
                              />
                              <p className={classNames(helperBase, "mt-1")}>Optional: workload balancing.</p>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Allow Reassign</div>
                                <div className={helperBase}>Supervisor can reassign later.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={assignment.allow_reassign}
                                onChange={(e) =>
                                  setAssignment((p) => ({ ...p, allow_reassign: e.target.checked }))
                                }
                                className="h-4 w-4"
                              />
                            </div>
                          </div>

                          {/* <div className="mt-3 rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">Include Mobile Push</div>
                              <div className={helperBase}>Phase-2: push notification integration.</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={assignment.include_mobile}
                              onChange={(e) =>
                                setAssignment((p) => ({ ...p, include_mobile: e.target.checked }))
                              }
                              className="h-4 w-4"
                            />
                          </div> */}

                          <div className="mt-3">
                            <label className={labelBase}>Remarks (Optional)</label>
                            <textarea
                              className={classNames(inputBase, "mt-1 min-h-[90px] resize-y")}
                              value={assignment.remarks}
                              onChange={(e) => setAssignment((p) => ({ ...p, remarks: e.target.value }))}
                              placeholder="Instructions for counters (e.g., follow blind count rules)."
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                          <span className="font-semibold">Note:</span> This is ONLY assignment popup. Plan Create screen lo assignment tab undadu.
                        </div>
                      </div>

                      {/* Right */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800">Select Assignees</h4>
                              <p className={helperBase}>Users filtered by Warehouse. Search supported.</p>
                            </div>
                            <button
                              type="button"
                              className={outlineBtn}
                              onClick={() => setAssignment((p) => ({ ...p, assignees: [] }))}
                            >
                              Clear
                            </button>
                          </div>

                          <div className="mt-3">
                            <label className={labelBase}>User Search</label>
                            <input
                              className={classNames(inputBase, "mt-1")}
                              placeholder="Search name / id / mobile"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {availableUsers.map((u) => {
                              const checked = assignment.assignees.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => toggleAssignee(u.id)}
                                  className={classNames(
                                    "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition",
                                    checked
                                      ? "border-transparent text-white shadow-sm"
                                      : "border-gray-200 hover:bg-gray-50"
                                  )}
                                  style={checked ? { backgroundColor: FORTUNA_SECONDARY_BLUE } : undefined}
                                >
                                  <div className="min-w-0">
                                    <div className={classNames("font-semibold", checked ? "text-white" : "text-gray-900")}>
                                      {u.name}
                                    </div>
                                    <div className={classNames("text-xs", checked ? "text-white/80" : "text-gray-500")}>
                                      {u.id} • {u.mobile}
                                    </div>
                                  </div>

                                  <div
                                    className={classNames(
                                      "rounded-full px-3 py-1 text-xs font-semibold",
                                      checked ? "bg-white/15 text-white" : "bg-gray-100 text-gray-700"
                                    )}
                                  >
                                    {checked ? "Selected" : "Select"}
                                  </div>
                                </button>
                              );
                            })}

                            {availableUsers.length === 0 && (
                              <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
                                No users mapped to this warehouse.
                              </div>
                            )}
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                            <div className="text-sm font-semibold text-gray-800">Selected</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {assignment.assignees.length === 0 ? (
                                <span className="text-sm text-gray-500">No assignees selected.</span>
                              ) : (
                                assignment.assignees.map((id) => {
                                  const u = USERS.find((x) => x.id === id);
                                  return (
                                    <span
                                      key={id}
                                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                                    >
                                      {u?.name || id}
                                      <button
                                        type="button"
                                        className="rounded-full px-2 py-0.5 text-blue-700 hover:bg-blue-100"
                                        onClick={() => toggleAssignee(id)}
                                        aria-label={`Remove ${u?.name || id}`}
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Assignment Summary</h4>

                          <div className="mt-3 space-y-2 text-sm">
                            <SummaryRow label="Plan No" value={activePlan.plan_no} />
                            <SummaryRow
                              label="Warehouse"
                              value={`${activePlan.warehouse_id} • ${whName(activePlan.warehouse_id)}`}
                            />
                            <SummaryRow label="Role" value={assignment.role_type} />
                            <SummaryRow label="Scope" value={`${activePlan.scope_type}: ${activePlan.scope_summary}`} />
                            <SummaryRow label="Assignees" value={String(assignment.assignees.length)} />
                            <SummaryRow label="Due Date" value={assignment.due_date || "-"} />
                            <SummaryRow label="Mobile Push" value={assignment.include_mobile ? "Yes" : "No"} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                            <span className="font-semibold">Next:</span> Save → create tasks → counters execute on Web/Mobile → reconciliation.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer (always visible) */}
                  <div className="border-t bg-white px-5 py-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <button type="button" className={outlineBtn} onClick={closeModal}>
                        Cancel
                      </button>

                      <div className="flex w-full sm:w-auto gap-2">
                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                          onClick={() => alert("Edit mode (demo): update assignees + save.")}
                        >
                          Edit (Demo)
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                          onClick={validateAndSave}
                        >
                          Save Assignment
                        </button>
                      </div>
                    </div>

                    <div className={classNames(helperBase, "mt-2")}>
                      UI Fix: wrapper uses <span className="font-semibold">items-start + scrollable overlay</span>, modal uses{" "}
                      <span className="font-semibold">fixed height</span> +{" "}
                      <span className="font-semibold">internal body scroll</span>.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ========================= END MODAL ========================= */}
      </div>
    </div>
  );
}