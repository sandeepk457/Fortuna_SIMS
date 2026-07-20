"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";
/** Layout constants */
const APP_TOPBAR_H = 74; 




/** Masters */
const TASK_STATUS = ["Assigned", "In-Progress", "Paused", "Submitted", "Closed"];
const PLAN_TYPES = ["Cycle Count", "Physical Audit"];
const COUNT_MODES = ["Blind", "Guided"];


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

const SAMPLE_TASKS = [
  {
    task_id: "CCT-0001",
    plan_no: "CC-2026-0007",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-002",
    scope_type: "BIN",
    scope_summary: "Z-A-01-01 → Z-A-01-10",
    assigned_to: "U-001",
    due_date: "2026-02-18",
    status: "Assigned",
    progress_pct: 0,
    lines: [
      { line_id: "L-1", bin: "Z-A-01-01", sku: "SKU-1001", sku_name: "Apple iPhone Cover", uom: "PCS", system_qty: 120, counted_qty: "", variance: "" },
      { line_id: "L-2", bin: "Z-A-01-02", sku: "SKU-1002", sku_name: "USB-C Cable", uom: "PCS", system_qty: 60, counted_qty: "", variance: "" },
      { line_id: "L-3", bin: "Z-A-01-05", sku: "SKU-1003", sku_name: "Power Bank 10k", uom: "PCS", system_qty: 25, counted_qty: "", variance: "" },
    ],
  },
  {
    task_id: "CCT-0002",
    plan_no: "CC-2026-0007",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-002",
    scope_type: "BIN",
    scope_summary: "Z-A-01-01 → Z-A-01-10",
    assigned_to: "U-004",
    due_date: "2026-02-18",
    status: "In-Progress",
    progress_pct: 33,
    lines: [
      { line_id: "L-1", bin: "Z-A-01-03", sku: "SKU-2001", sku_name: "Laptop Sleeve", uom: "PCS", system_qty: 40, counted_qty: 39, variance: -1 },
      { line_id: "L-2", bin: "Z-A-01-04", sku: "SKU-2002", sku_name: "Wireless Mouse", uom: "PCS", system_qty: 18, counted_qty: "", variance: "" },
      { line_id: "L-3", bin: "Z-A-01-06", sku: "SKU-2003", sku_name: "Keyboard", uom: "PCS", system_qty: 22, counted_qty: "", variance: "" },
    ],
  },
  {
    task_id: "CCT-0003",
    plan_no: "PA-2026-0005",
    plan_type: "Physical Audit",
    count_mode: "Guided",
    warehouse_id: "WH-003",
    scope_type: "BIN",
    scope_summary: "Full WH",
    assigned_to: "U-005",
    due_date: "2026-02-20",
    status: "Paused",
    progress_pct: 15,
    lines: [
      { line_id: "L-1", bin: "R-01-B-01", sku: "SKU-3001", sku_name: "LED Bulb 9W", uom: "PCS", system_qty: 200, counted_qty: 195, variance: -5 },
      { line_id: "L-2", bin: "R-01-B-02", sku: "SKU-3002", sku_name: "Extension Box", uom: "PCS", system_qty: 50, counted_qty: "", variance: "" },
    ],
  },
];

/** Helpers */
function classNames(...v: Array<string | number | boolean | null | undefined>) {
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

function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: string }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-800",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return <span className={classNames(base, map[tone] || map.gray)}>{children}</span>;
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Assigned"
      ? "blue"
      : status === "In-Progress"
      ? "amber"
      : status === "Paused"
      ? "purple"
      : status === "Submitted"
      ? "green"
      : status === "Closed"
      ? "emerald"
      : "gray";
  return <Pill tone={tone}>{status}</Pill>;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

function QuickStatsCard({ stats }: { stats: { total: number; byStatus: Record<string, number>; avgProgress: number } }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Quick Stats</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <StatLine label="Total Tasks" value={stats.total} pillBg="#E8F0FE" />
        <div className="my-3 border-t border-gray-100" />

        {TASK_STATUS.map((s) => (
          <StatLine
            key={s}
            label={s}
            value={stats.byStatus[s] || 0}
            pillBg={
              s === "Assigned"
                ? "#E8F0FE"
                : s === "In-Progress"
                ? "#FFF3D6"
                : s === "Paused"
                ? "#F1E9FF"
                : s === "Submitted"
                ? "#E8F7EF"
                : "#E7FAF3"
            }
          />
        ))}

        <div className="my-3 border-t border-gray-100" />
        <StatLine label="Avg Progress %" value={stats.avgProgress.toFixed(0)} pillBg="#E8F0FE" />

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-semibold">Tip:</span> Execute → Save Draft/Pause → Submit for Supervisor.
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value, pillBg }: { label: string; value: string | number; pillBg: string }) {
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
export default function CountExecutionPage() {
  // In-memory tasks
  const [tasks, setTasks] = useState(SAMPLE_TASKS);

  // Filters
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("All");
  const [status, setStatus] = useState("All");
  const [assignee, setAssignee] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Modal states
  const [lineSearch, setLineSearch] = useState("");
  const [scanBin, setScanBin] = useState("");
  const [scanSku, setScanSku] = useState("");
  const [remarks, setRemarks] = useState("");

  const whName = (id: string) => WAREHOUSES.find((w) => w.id === id)?.name || id;
  const userName = (id: string) => USERS.find((u) => u.id === id)?.name || id;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const bySearch =
        (t.plan_no || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.task_id || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.scope_summary || "").toLowerCase().includes(search.toLowerCase()) ||
        (userName(t.assigned_to) || "").toLowerCase().includes(search.toLowerCase());

      const byWh = warehouse === "All" ? true : t.warehouse_id === warehouse;
      const bySt = status === "All" ? true : t.status === status;
      const byAsg = assignee === "All" ? true : t.assigned_to === assignee;

      return bySearch && byWh && bySt && byAsg;
    });
  }, [tasks, search, warehouse, status, assignee]);

  const quickStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let progressSum = 0;

    filteredTasks.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      progressSum += Number(t.progress_pct || 0);
    });

    return {
      total: filteredTasks.length,
      byStatus,
      avgProgress: filteredTasks.length ? progressSum / filteredTasks.length : 0,
    };
  }, [filteredTasks]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeTask = useMemo(
    () => tasks.find((t) => t.task_id === activeTaskId) || null,
    [tasks, activeTaskId]
  );

  const exportToCSV = () => {
    const header = [
      "Task ID",
      "Plan No",
      "Plan Type",
      "Count Mode",
      "Warehouse",
      "Assignee",
      "Due Date",
      "Status",
      "Progress %",
    ];

    const rows = filteredTasks.map((t) =>
      [
        t.task_id,
        t.plan_no,
        t.plan_type,
        t.count_mode,
        t.warehouse_id,
        userName(t.assigned_to),
        t.due_date || "",
        t.status,
        String(t.progress_pct || 0),
      ].join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "count-execution.csv";
    link.click();
  };

  const resetModalState = () => {
    setLineSearch("");
    setScanBin("");
    setScanSku("");
    setRemarks("");
  };

  const openExecute = (taskId: string) => {
    setActiveTaskId(taskId);
    setIsModalOpen(true);
    resetModalState();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTaskId(null);
    resetModalState();
  };

  const calcProgress = (lines: Array<{ counted_qty: string | number }>) => {
    if (!lines?.length) return 0;
    const done = lines.filter((l) => String(l.counted_qty).trim() !== "").length;
    return Math.round((done / lines.length) * 100);
  };

  const updateLineCount = (lineId: string, value: string) => {
    if (!activeTask) return;

    const num = value === "" ? "" : Number(value);
    if (
      value !== "" &&
      (typeof num !== "number" || !Number.isFinite(num) || (num as number) < 0)
    )
      return;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== activeTask.task_id) return t;

        const updatedLines = t.lines.map((l) => {
          if (l.line_id !== lineId) return l;

          const counted = value === "" ? "" : Number(value);
          const variance = counted === "" ? "" : Number(counted) - Number(l.system_qty || 0);

          return { ...l, counted_qty: counted, variance } as typeof l;
        });

        const progress_pct = calcProgress(updatedLines);
        const nextStatus =
          t.status === "Submitted" || t.status === "Closed"
            ? t.status
            : progress_pct > 0
            ? "In-Progress"
            : "Assigned";

        return { ...t, lines: updatedLines as typeof t.lines, progress_pct, status: nextStatus };
      })
    );
  };

  const saveDraft = () => {
    if (!activeTask) return;
    alert("Saved Draft (demo). Next: API PATCH task lines + remarks.");
  };

  const pauseTask = () => {
    if (!activeTask) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.task_id === activeTask.task_id
          ? { ...t, status: "Paused" }
          : t
      )
    );

    alert("Task Paused (demo).");
  };

  const submitTask = () => {
    if (!activeTask) return;

    // Basic validation
    const missing = activeTask.lines.some((l) => String(l.counted_qty).trim() === "");
    if (missing) {
      const ok = confirm("Some lines are not counted yet. Submit anyway?");
      if (!ok) return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.task_id === activeTask.task_id ? { ...t, status: "Submitted" } : t
      )
    );

    alert("Submitted to Supervisor (demo). Next: approval/reconciliation module.");
    closeModal();
  };

  const focusFirstMatch = () => {
    // demo: just scroll body to top
    const el = document.getElementById("countExecModalBody");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredLines = useMemo(() => {
    if (!activeTask) return [];
    const q = lineSearch.trim().toLowerCase();
    if (!q) return activeTask.lines;

    return activeTask.lines.filter(
      (l) =>
        (l.bin || "").toLowerCase().includes(q) ||
        (l.sku || "").toLowerCase().includes(q) ||
        (l.sku_name || "").toLowerCase().includes(q)
    );
  }, [activeTask, lineSearch]);

  const scanHint = useMemo(() => {
    if (!activeTask) return "";
    if (activeTask.scope_type === "BIN") return "Scan / Enter BIN to jump quickly";
    return "Scan / Enter SKU to jump quickly";
  }, [activeTask]);

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden">
      <PageBreadcrumb pageTitle="Count Execution" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Count Execution</h2>
            <p className="text-sm text-gray-500">
              Counters execute assigned tasks (Web). Blind mode hides system qty; Guided shows it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportToCSV}
              className={primaryBtn}
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
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div>
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="Task ID / Plan No / Scope / Assignee"
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
                <label className={labelBase}>Task Status</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {TASK_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelBase}>Assignee</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={assignee}
                  onChange={(e) => {
                    setAssignee(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} • {u.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1100px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Task</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Mode</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-left">Assignee</th>
                    <th className="px-4 py-3 text-left">Due</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Progress</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTasks.map((t) => (
                    <tr key={t.task_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {t.task_id}
                        <div className="mt-1 text-xs text-gray-500">{t.plan_type}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{t.plan_no}</div>
                        <div className="mt-1 text-xs text-gray-500">{t.scope_type}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{t.warehouse_id}</div>
                        <div className="mt-1 text-xs text-gray-500">{whName(t.warehouse_id)}</div>
                      </td>

                      <td className="px-4 py-3">
                        <Pill tone={t.count_mode === "Blind" ? "purple" : "blue"}>{t.count_mode}</Pill>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-semibold">{t.scope_summary}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Lines: <span className="font-semibold">{t.lines.length}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{userName(t.assigned_to)}</div>
                        <div className="mt-1 text-xs text-gray-500">{t.assigned_to}</div>
                      </td>

                      <td className="px-4 py-3">{t.due_date || "-"}</td>

                      <td className="px-4 py-3">
                        <StatusPill status={t.status} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, Number(t.progress_pct || 0)))}%`,
                                backgroundColor: FORTUNA_SECONDARY_BLUE,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{t.progress_pct || 0}%</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => openExecute(t.task_id)}
                          className="text-sm font-semibold hover:underline"
                          style={{ color: FORTUNA_SECONDARY_BLUE }}
                        >
                          Execute
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedTasks.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                        No tasks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom controls */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing {filteredTasks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} entries
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

        {/* ========================= EXECUTION MODAL ========================= */}
        {isModalOpen && activeTask && (
          <div className="fixed inset-0 z-50 bg-black/40">
            {/* overlay scrollable + items-start => header hide problem solved */}
            <div className="h-full w-full overflow-y-auto"style={{ paddingTop: APP_TOPBAR_H }}>
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                {/* fixed height modal */}
                <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col"style={{ height: `calc(100vh - ${APP_TOPBAR_H}px - 32px)` }}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        Execute Task • {activeTask.task_id}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Plan: <span className="font-semibold">{activeTask.plan_no}</span> •{" "}
                        {activeTask.plan_type} •{" "}
                        Warehouse: <span className="font-semibold">{activeTask.warehouse_id}</span> • {whName(activeTask.warehouse_id)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                        >
                          {activeTask.count_mode} Mode
                        </span>
                        <StatusPill status={activeTask.status} />
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700">
                          Scope: {activeTask.scope_type} • {activeTask.scope_summary}
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

                  {/* Body */}
                  <div id="countExecModalBody" className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
                      {/* LEFT - Lines */}
                      <div className="min-w-0 space-y-4">
                        {/* Quick search / scan row */}
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="w-full">
                              <label className={labelBase}>Search Lines</label>
                              <input
                                className={classNames(inputBase, "mt-1")}
                                placeholder="Search BIN / SKU / Name"
                                value={lineSearch}
                                onChange={(e) => setLineSearch(e.target.value)}
                              />
                              <p className={classNames(helperBase, "mt-1")}>
                                {activeTask.count_mode === "Blind"
                                  ? "Blind mode: system qty hidden from counter."
                                  : "Guided mode: system qty visible for fast validation."}
                              </p>
                            </div>

                            <button
                              type="button"
                              className={outlineBtn}
                              onClick={() => {
                                setLineSearch("");
                                setScanBin("");
                                setScanSku("");
                                focusFirstMatch();
                              }}
                            >
                              Clear
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelBase}>{scanHint}</label>
                              <input
                                className={classNames(inputBase, "mt-1")}
                                placeholder={activeTask.scope_type === "BIN" ? "e.g., Z-A-01-05" : "e.g., SKU-1001"}
                                value={activeTask.scope_type === "BIN" ? scanBin : scanSku}
                                onChange={(e) => {
                                  if (activeTask.scope_type === "BIN") setScanBin(e.target.value);
                                  else setScanSku(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter") return;
                                  const q = (activeTask.scope_type === "BIN" ? scanBin : scanSku).trim().toLowerCase();
                                  if (!q) return;
                                  setLineSearch(q);
                                }}
                              />
                              <p className={helperBase + " mt-1"}>Press Enter to filter lines.</p>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-3">
                              <div className="text-sm font-semibold text-gray-800">Progress</div>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, Number(activeTask.progress_pct || 0)))}%`,
                                      backgroundColor: FORTUNA_SECONDARY_BLUE,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">
                                  {activeTask.progress_pct || 0}%
                                </span>
                              </div>
                              <div className={helperBase + " mt-2"}>
                                Counted lines:{" "}
                                <span className="font-semibold">
                                  {activeTask.lines.filter((l) => String(l.counted_qty).trim() !== "").length}
                                </span>{" "}
                                / {activeTask.lines.length}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lines table */}
                        <div className="rounded-2xl border border-gray-200 overflow-x-auto">
                          <table className="min-w-[980px] w-full border-collapse text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left">BIN</th>
                                <th className="px-4 py-3 text-left">SKU</th>
                                <th className="px-4 py-3 text-left">Item</th>
                                <th className="px-4 py-3 text-left">UOM</th>
                                <th className="px-4 py-3 text-left">
                                  {activeTask.count_mode === "Blind" ? "System Qty" : "System Qty"}
                                </th>
                                <th className="px-4 py-3 text-left">Counted Qty</th>
                                <th className="px-4 py-3 text-left">Variance</th>
                              </tr>
                            </thead>

                            <tbody>
                              {filteredLines.map((l) => {
                                const countedFilled = String(l.counted_qty).trim() !== "";
                                return (
                                  <tr key={l.line_id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-800">{l.bin}</td>
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-gray-800">{l.sku}</div>
                                      <div className="mt-1 text-xs text-gray-500">{l.line_id}</div>
                                    </td>
                                    <td className="px-4 py-3">{l.sku_name}</td>
                                    <td className="px-4 py-3">{l.uom}</td>

                                    <td className="px-4 py-3">
                                      {activeTask.count_mode === "Blind" ? (
                                        <span className="text-gray-400 text-sm">Hidden</span>
                                      ) : (
                                        <span className="font-semibold text-gray-800">{l.system_qty}</span>
                                      )}
                                    </td>

                                    <td className="px-4 py-3">
                                      <input
                                        className={classNames(
                                          inputBase,
                                          "max-w-[160px]",
                                          countedFilled ? "border-[#005F99]/40" : ""
                                        )}
                                        inputMode="numeric"
                                        placeholder="Enter qty"
                                        value={l.counted_qty === "" ? "" : String(l.counted_qty)}
                                        onChange={(e) => updateLineCount(l.line_id, e.target.value.replace(/[^\d]/g, ""))}
                                      />
                                      <div className={helperBase + " mt-1"}>
                                        {countedFilled ? "Saved in-memory (demo)" : "Pending"}
                                      </div>
                                    </td>

                                    <td className="px-4 py-3">
                                      {String(l.variance).trim() === "" ? (
                                        <span className="text-gray-400">-</span>
                                      ) : (
                                        <span
                                          className={classNames(
                                            "font-semibold",
                                            Number(l.variance) === 0
                                              ? "text-gray-700"
                                              : Number(l.variance) > 0
                                              ? "text-green-700"
                                              : "text-rose-700"
                                          )}
                                        >
                                          {l.variance}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}

                              {filteredLines.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                    No lines found for current search.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                          <span className="font-semibold">Rule:</span> Blind count lo system qty hidden, submit ayyaka supervisor variance review chestaru.
                        </div>
                      </div>

                      {/* RIGHT - Summary */}
                      <div className="min-w-0 space-y-4">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Task Summary</h4>

                          <div className="mt-3 space-y-2 text-sm">
                            <SummaryRow label="Task ID" value={activeTask.task_id} />
                            <SummaryRow label="Plan No" value={activeTask.plan_no} />
                            <SummaryRow label="Type" value={activeTask.plan_type} />
                            <SummaryRow label="Mode" value={activeTask.count_mode} />
                            <SummaryRow
                              label="Warehouse"
                              value={`${activeTask.warehouse_id} • ${whName(activeTask.warehouse_id)}`}
                            />
                            <SummaryRow label="Assignee" value={`${userName(activeTask.assigned_to)} • ${activeTask.assigned_to}`} />
                            <SummaryRow label="Due Date" value={activeTask.due_date || "-"} />
                            <SummaryRow label="Status" value={activeTask.status} />
                            <SummaryRow label="Progress" value={`${activeTask.progress_pct || 0}%`} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                            <span className="font-semibold">Next:</span> Submit → Supervisor verifies → Reconciliation & Variance.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Counter Remarks (Optional)</h4>
                          <textarea
                            className={classNames(inputBase, "mt-2 min-h-[110px] resize-y")}
                            placeholder="Notes for supervisor (damaged stock, bin label mismatch, etc.)"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                          <div className={helperBase + " mt-2"}>
                            This will be saved with task submission (demo).
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer (always visible) */}
                  <div className="border-t bg-white px-5 py-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <button type="button" className={outlineBtn} onClick={closeModal}>
                        Close
                      </button>

                      <div className="flex w-full sm:w-auto gap-2">
                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/3 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                          onClick={saveDraft}
                        >
                          Save Draft
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/3 sm:w-auto")}
                          style={{ backgroundColor: "#6D28D9" }}
                          onClick={pauseTask}
                        >
                          Pause
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/3 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                          onClick={submitTask}
                        >
                          Submit
                        </button>
                      </div>
                    </div>

                    <div className={classNames(helperBase, "mt-2")}>
                      UI Fix: overlay scroll + modal fixed height + internal body scroll ⇒ header/footer never hide (zoom issues reduced).
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