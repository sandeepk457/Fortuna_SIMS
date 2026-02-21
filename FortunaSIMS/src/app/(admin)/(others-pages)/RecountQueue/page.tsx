"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** If your app has a fixed top header (like your screenshot), keep this */
const APP_TOPBAR_H = 74; // adjust 64/72/74 based on your layout

/** Masters */
const QUEUE_STATUS = ["Queued", "Assigned", "In-Recount", "Resolved", "Closed"];
const SEVERITY = ["Low", "Medium", "High", "Critical"];

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

/** Demo Count Results (these become Recount Queue candidates based on threshold) */
const SAMPLE_RESULTS = [
  {
    id: "RQ-2026-0001",
    plan_no: "CC-2026-0007",
    task_id: "CCT-0002",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-002",
    scope_type: "BIN",
    scope_summary: "Z-A-01-01 → Z-A-01-10",
    sku_count: 42,
    variance_qty: -730,
    accuracy_pct: 94.3,
    counter: "U-004",
    counter_name: "Suresh",
    due_date: "2026-02-18",
    last_activity: "2026-02-18 11:20",
    remarks: "Blind mode: system qty hidden from counter.",
  },
  {
    id: "RQ-2026-0002",
    plan_no: "CC-2026-0006",
    task_id: "CCT-0001",
    plan_type: "Cycle Count",
    count_mode: "Guided",
    warehouse_id: "WH-001",
    scope_type: "ITEM",
    scope_summary: "FAST MOVING (A-class)",
    sku_count: 18,
    variance_qty: -40,
    accuracy_pct: 99.1,
    counter: "U-001",
    counter_name: "Ravi",
    due_date: "2026-02-16",
    last_activity: "2026-02-16 18:05",
    remarks: "Guided count with system hints.",
  },
  {
    id: "RQ-2026-0003",
    plan_no: "PA-2026-0005",
    task_id: "PAT-0020",
    plan_type: "Physical Audit",
    count_mode: "Blind",
    warehouse_id: "WH-003",
    scope_type: "BIN",
    scope_summary: "Full WH",
    sku_count: 220,
    variance_qty: -10,
    accuracy_pct: 99.99,
    counter: "U-005",
    counter_name: "Divya",
    due_date: "2026-02-10",
    last_activity: "2026-02-10 09:40",
    remarks: "Audit posted. Minor variance.",
  },
  {
    id: "RQ-2026-0004",
    plan_no: "CC-2026-0008",
    task_id: "CCT-0007",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-001",
    scope_type: "BIN",
    scope_summary: "Z-B-01-01 → Z-B-01-05",
    sku_count: 12,
    variance_qty: 0,
    accuracy_pct: 0,
    counter: "U-002",
    counter_name: "Kiran",
    due_date: "2026-02-20",
    last_activity: "2026-02-19 13:10",
    remarks: "Draft execution started.",
  },
];

/** Utils */
function classNames(...v) {
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

function Pill({ text, tone = "gray" }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const map = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-800",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return <span className={classNames(base, map[tone] || map.gray)}>{text}</span>;
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

function QuickStatsCard({ stats }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Quick Stats</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <StatLine label="Total Queue" value={stats.total} pillBg="#E8F0FE" />
        <div className="my-3 border-t border-gray-100" />

        {QUEUE_STATUS.map((s) => (
          <StatLine
            key={s}
            label={s}
            value={stats.byStatus[s] || 0}
            pillBg={
              s === "Queued"
                ? "#FFF3D6"
                : s === "Assigned"
                ? "#E8F0FE"
                : s === "In-Recount"
                ? "#F1E9FF"
                : s === "Resolved"
                ? "#E8F7EF"
                : "#EEF2F7"
            }
          />
        ))}

        <div className="my-3 border-t border-gray-100" />
        <StatLine label="High/Critical" value={stats.highOrCritical} pillBg="#FFE8EC" />
        <StatLine label="Avg Abs Variance" value={stats.avgAbsVar.toFixed(0)} pillBg="#E8F0FE" />

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-semibold">Tip:</span> Threshold & filters apply to Queue + Export.
        </div>
      </div>
    </div>
  );
}

/** Severity logic (demo) */
function severityFromVariance(absVar) {
  if (absVar >= 500) return "Critical";
  if (absVar >= 200) return "High";
  if (absVar >= 50) return "Medium";
  return "Low";
}

function severityTone(sev) {
  if (sev === "Critical") return "rose";
  if (sev === "High") return "amber";
  if (sev === "Medium") return "purple";
  return "gray";
}

function statusTone(st) {
  if (st === "Queued") return "amber";
  if (st === "Assigned") return "blue";
  if (st === "In-Recount") return "purple";
  if (st === "Resolved") return "green";
  return "gray";
}

export default function RecountQueuePage() {
  /** In-memory queue state */
  const [threshold, setThreshold] = useState(50); // default
  const [queueMap, setQueueMap] = useState(() => {
    // initial statuses based on threshold
    const map = {};
    SAMPLE_RESULTS.forEach((r) => {
      const absVar = Math.abs(Number(r.variance_qty || 0));
      map[r.id] = {
        status: absVar >= 50 ? "Queued" : "Closed",
        assigned_to: [],
        supervisor_notes: "",
        recount_due: "",
      };
    });
    return map;
  });

  /** Filters */
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("All");
  const [status, setStatus] = useState("All");
  const [severity, setSeverity] = useState("All");

  /** Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /** Modal */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  /** Modal form */
  const [modalForm, setModalForm] = useState({
    assignTo: [],
    recountDue: "",
    supervisorNotes: "",
    actionMode: "Assign", // Assign / Resolve / Close
  });

  const whName = (whId) => WAREHOUSES.find((w) => w.id === whId)?.name || whId;

  /** Build “queue rows” from results + queueMap + threshold (auto-queue) */
  const queueRows = useMemo(() => {
    return SAMPLE_RESULTS.map((r) => {
      const absVar = Math.abs(Number(r.variance_qty || 0));
      const sev = severityFromVariance(absVar);
      const autoQueued = absVar >= Number(threshold);

      const state = queueMap[r.id] || { status: "Queued", assigned_to: [], supervisor_notes: "", recount_due: "" };
      // if threshold changes, we keep manual statuses, but if it’s never touched you still see queued/closed behavior.
      // For demo: if currently Closed but autoQueued becomes true, show Queued unless it was explicitly Closed by user.
      let computedStatus = state.status;
      if (computedStatus === "Closed" && autoQueued) computedStatus = "Queued";
      if (computedStatus === "Queued" && !autoQueued) computedStatus = "Closed";

      return {
        ...r,
        abs_variance: absVar,
        severity: sev,
        queue_status: computedStatus,
        assigned_to: state.assigned_to || [],
        supervisor_notes: state.supervisor_notes || "",
        recount_due: state.recount_due || "",
      };
    });
  }, [threshold, queueMap]);

  /** Apply filters */
  const filtered = useMemo(() => {
    return queueRows.filter((r) => {
      const q = search.trim().toLowerCase();
      const bySearch =
        !q ||
        (r.id || "").toLowerCase().includes(q) ||
        (r.plan_no || "").toLowerCase().includes(q) ||
        (r.task_id || "").toLowerCase().includes(q) ||
        (r.scope_summary || "").toLowerCase().includes(q) ||
        (r.counter_name || "").toLowerCase().includes(q);

      const byWh = warehouse === "All" ? true : r.warehouse_id === warehouse;
      const bySt = status === "All" ? true : r.queue_status === status;
      const bySev = severity === "All" ? true : r.severity === severity;

      return bySearch && byWh && bySt && bySev;
    });
  }, [queueRows, search, warehouse, status, severity]);

  /** Quick stats */
  const quickStats = useMemo(() => {
    const byStatus = {};
    let highOrCritical = 0;
    let sumAbs = 0;

    filtered.forEach((r) => {
      byStatus[r.queue_status] = (byStatus[r.queue_status] || 0) + 1;
      if (r.severity === "High" || r.severity === "Critical") highOrCritical += 1;
      sumAbs += Number(r.abs_variance || 0);
    });

    return {
      total: filtered.length,
      byStatus,
      highOrCritical,
      avgAbsVar: filtered.length ? sumAbs / filtered.length : 0,
    };
  }, [filtered]);

  /** Pagination */
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** Export */
  const exportToCSV = () => {
    const header = [
      "Queue ID",
      "Plan No",
      "Task ID",
      "Warehouse",
      "Scope",
      "SKU Count",
      "Variance Qty",
      "Abs Variance",
      "Severity",
      "Queue Status",
      "Assigned To",
      "Recount Due",
      "Last Activity",
    ];

    const rows = filtered.map((r) =>
      [
        r.id,
        r.plan_no,
        r.task_id,
        r.warehouse_id,
        `${r.scope_type}: ${String(r.scope_summary || "").replaceAll(",", " ")}`,
        String(r.sku_count || 0),
        String(r.variance_qty || 0),
        String(r.abs_variance || 0),
        r.severity,
        r.queue_status,
        (r.assigned_to || [])
          .map((id) => USERS.find((u) => u.id === id)?.name || id)
          .join("|"),
        r.recount_due || "",
        r.last_activity || "",
      ].join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "recount-queue.csv";
    link.click();
  };

  /** Modal helpers */
  const openModal = (row, mode = "Assign") => {
    setActiveRow(row);

    const available = USERS.filter((u) => u.wh.includes(row.warehouse_id));
    const prefill = (queueMap[row.id]?.assigned_to || row.assigned_to || []).slice();

    setModalForm({
      assignTo: prefill.length ? prefill : available.slice(0, 1).map((u) => u.id), // simple default
      recountDue: queueMap[row.id]?.recount_due || row.recount_due || "",
      supervisorNotes: queueMap[row.id]?.supervisor_notes || row.supervisor_notes || "",
      actionMode: mode,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveRow(null);
  };

  const toggleAssign = (id) => {
    setModalForm((p) => {
      const exists = p.assignTo.includes(id);
      return { ...p, assignTo: exists ? p.assignTo.filter((x) => x !== id) : [...p.assignTo, id] };
    });
  };

  const saveModal = () => {
    if (!activeRow) return;

    const mode = modalForm.actionMode;

    // validation
    if (mode === "Assign" || mode === "In-Recount") {
      if (!modalForm.assignTo.length) {
        alert("Select at least 1 assignee for recount.");
        return;
      }
    }

    setQueueMap((prev) => {
      const current = prev[activeRow.id] || {};
      let nextStatus = current.status || activeRow.queue_status;

      if (mode === "Assign") nextStatus = "Assigned";
      if (mode === "In-Recount") nextStatus = "In-Recount";
      if (mode === "Resolve") nextStatus = "Resolved";
      if (mode === "Close") nextStatus = "Closed";

      return {
        ...prev,
        [activeRow.id]: {
          ...current,
          status: nextStatus,
          assigned_to: modalForm.assignTo.slice(),
          recount_due: modalForm.recountDue,
          supervisor_notes: modalForm.supervisorNotes,
        },
      };
    });

    alert("Saved (demo). Next: connect API → create recount tasks → update variance resolution workflow.");
    closeModal();
  };

  const resetFilters = () => {
    setSearch("");
    setWarehouse("All");
    setStatus("All");
    setSeverity("All");
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden">
      <PageBreadcrumb pageTitle="Recount Queue" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-gray-800">Recount Queue</h2>
            <p className="text-sm text-gray-500">
              Variance threshold exceeded → auto queue. Supervisor assigns recount → resolves → closes.
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

            <button onClick={resetFilters} className={outlineBtn}>
              Reset Filters
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="Search Queue ID / Plan / Task / Scope / Counter"
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
                <label className={labelBase}>Queue Status</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {QUEUE_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelBase}>Severity</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={severity}
                  onChange={(e) => {
                    setSeverity(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {SEVERITY.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Threshold (auto queue) */}
            <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800">Variance Threshold (Auto Queue)</div>
                  <div className="text-xs text-gray-600">
                    Records with <span className="font-semibold">Abs(Variance Qty) ≥ Threshold</span> appear as Queued.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-40">
                    <input
                      className={inputBase}
                      value={String(threshold)}
                      onChange={(e) => {
                        const v = Number(String(e.target.value || "").replace(/[^\d]/g, ""));
                        setThreshold(Number.isFinite(v) ? v : 0);
                        setCurrentPage(1);
                      }}
                      placeholder="e.g., 50"
                    />
                    <div className={helperBase}>Recommended: 50 / 100 / 200</div>
                  </div>

                  <button
                    className={classNames(primaryBtn)}
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                    onClick={() => alert("Demo: threshold applied. Next: persist in settings (API).")}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1300px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Queue ID</th>
                    <th className="px-4 py-3 text-left">Plan / Task</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-left">SKUs</th>
                    <th className="px-4 py-3 text-left">Variance</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                    <th className="px-4 py-3 text-left">Queue Status</th>
                    <th className="px-4 py-3 text-left">Assigned</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {r.id}
                        <div className="mt-1 text-xs text-gray-500">{r.plan_type} • {r.count_mode}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.plan_no}</div>
                        <div className="mt-1 text-xs text-gray-500">Task: {r.task_id}</div>
                        <div className="mt-1 text-xs text-gray-500">Counter: {r.counter_name}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.warehouse_id}</div>
                        <div className="mt-1 text-xs text-gray-500">{whName(r.warehouse_id)}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.scope_type}</div>
                        <div className="mt-1 text-xs text-gray-500">{r.scope_summary}</div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-800">{r.sku_count}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold" style={{ color: r.variance_qty < 0 ? FORTUNA_PRIMARY_RED : "#0F766E" }}>
                          {r.variance_qty}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Abs: {r.abs_variance}</div>
                      </td>

                      <td className="px-4 py-3">
                        <Pill text={r.severity} tone={severityTone(r.severity)} />
                      </td>

                      <td className="px-4 py-3">
                        <Pill text={r.queue_status} tone={statusTone(r.queue_status)} />
                      </td>

                      <td className="px-4 py-3">
                        {r.assigned_to?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {r.assigned_to.slice(0, 2).map((id) => {
                              const u = USERS.find((x) => x.id === id);
                              return (
                                <span key={id} className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                  {u?.name || id}
                                </span>
                              );
                            })}
                            {r.assigned_to.length > 2 && (
                              <span className="text-xs text-gray-500">+{r.assigned_to.length - 2} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openModal(r, "Assign")}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                          >
                            View / Assign
                          </button>

                          <button
                            onClick={() => openModal(r, "Resolve")}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: "#0F766E" }}
                          >
                            Resolve
                          </button>

                          <button
                            onClick={() => openModal(r, "Close")}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: FORTUNA_PRIMARY_RED }}
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
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
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
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

        {/* ========================= MODAL ========================= */}
        {isModalOpen && activeRow && (
          <div className="fixed inset-0 z-50 bg-black/40">
            {/* Overlay scroll */}
            <div className="h-full w-full overflow-y-auto" style={{ paddingTop: APP_TOPBAR_H }}>
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col h-[92vh]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        Recount Queue • {activeRow.id}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Plan: <span className="font-semibold">{activeRow.plan_no}</span> • Task:{" "}
                        <span className="font-semibold">{activeRow.task_id}</span> • Warehouse:{" "}
                        <span className="font-semibold">{activeRow.warehouse_id}</span> ({whName(activeRow.warehouse_id)})
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                        >
                          {activeRow.plan_type}
                        </span>
                        <Pill text={activeRow.queue_status} tone={statusTone(activeRow.queue_status)} />
                        <Pill text={activeRow.severity} tone={severityTone(activeRow.severity)} />
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700">
                          {activeRow.count_mode} Mode
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
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Left */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Queue Details</h4>
                          <p className={classNames(helperBase, "mt-1")}>
                            Supervisor reviews variance → assigns recount → resolves/close.
                          </p>

                          <div className="mt-4 space-y-2 text-sm">
                            <SummaryRow label="Scope" value={`${activeRow.scope_type}: ${activeRow.scope_summary}`} />
                            <SummaryRow label="SKU Count" value={String(activeRow.sku_count)} />
                            <SummaryRow label="Variance Qty" value={String(activeRow.variance_qty)} />
                            <SummaryRow label="Abs Variance" value={String(activeRow.abs_variance)} />
                            <SummaryRow label="Counter" value={`${activeRow.counter_name} (${activeRow.counter})`} />
                            <SummaryRow label="Due Date" value={activeRow.due_date || "-"} />
                            <SummaryRow label="Last Activity" value={activeRow.last_activity || "-"} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                            <span className="font-semibold">Note:</span> In Blind mode, counter can’t see System Qty.
                            Recount should be controlled by Supervisor.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-800">Supervisor Notes</h4>
                            <Pill text={modalForm.actionMode} tone="blue" />
                          </div>

                          <textarea
                            className={classNames(inputBase, "mt-3 min-h-[110px] resize-y")}
                            value={modalForm.supervisorNotes}
                            onChange={(e) => setModalForm((p) => ({ ...p, supervisorNotes: e.target.value }))}
                            placeholder="Reason for recount, special instructions, evidence checks..."
                          />
                        </div>
                      </div>

                      {/* Right */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800">Assign Recount Team</h4>
                              <p className={helperBase}>Users filtered by Warehouse.</p>
                            </div>

                            <button
                              type="button"
                              className={outlineBtn}
                              onClick={() => setModalForm((p) => ({ ...p, assignTo: [] }))}
                            >
                              Clear
                            </button>
                          </div>

                          <div className="mt-3">
                            <label className={labelBase}>Recount Due Date</label>
                            <input
                              type="date"
                              className={classNames(inputBase, "mt-1")}
                              value={modalForm.recountDue}
                              onChange={(e) => setModalForm((p) => ({ ...p, recountDue: e.target.value }))}
                            />
                            <div className={helperBase}>Optional (recommended for SLAs).</div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {USERS.filter((u) => u.wh.includes(activeRow.warehouse_id)).map((u) => {
                              const checked = modalForm.assignTo.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => toggleAssign(u.id)}
                                  className={classNames(
                                    "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition",
                                    checked ? "border-transparent text-white shadow-sm" : "border-gray-200 hover:bg-gray-50"
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
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                            <div className="text-sm font-semibold text-gray-800">Selected</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {modalForm.assignTo.length === 0 ? (
                                <span className="text-sm text-gray-500">No assignees selected.</span>
                              ) : (
                                modalForm.assignTo.map((id) => {
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
                                        onClick={() => toggleAssign(id)}
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
                          <h4 className="text-sm font-semibold text-gray-800">Next Step</h4>
                          <div className="mt-3 space-y-2 text-sm">
                            <SummaryRow label="Action Mode" value={modalForm.actionMode} />
                            <SummaryRow label="Queue Status (current)" value={activeRow.queue_status} />
                            <SummaryRow label="Recount Assignees" value={String(modalForm.assignTo.length)} />
                            <SummaryRow label="Recount Due" value={modalForm.recountDue || "-"} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                            <span className="font-semibold">Flow:</span> Assign → In-Recount → Resolved → Close → Post to Reconciliation.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
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
                          onClick={() => setModalForm((p) => ({ ...p, actionMode: "Assign" }))}
                        >
                          Assign
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: "#6D28D9" }}
                          onClick={() => setModalForm((p) => ({ ...p, actionMode: "In-Recount" }))}
                        >
                          In-Recount
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: "#0F766E" }}
                          onClick={() => setModalForm((p) => ({ ...p, actionMode: "Resolve" }))}
                        >
                          Resolve
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                          onClick={() => setModalForm((p) => ({ ...p, actionMode: "Close" }))}
                        >
                          Close
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: "#111827" }}
                          onClick={saveModal}
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div className={classNames(helperBase, "mt-2")}>
                      UI Fix: overlay scroll + modal fixed height + internal body scroll → header/footer won’t hide (zoom safe).
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