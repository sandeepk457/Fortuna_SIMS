"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Masters */
const QUEUE_STATUS = ["New", "Assigned", "In-Recount", "Resolved", "Closed"];

// Severity for UI / SLA priority
const SEVERITY = ["Low", "Medium", "High"];

// Business thresholds (Phase-1 demo)
const DEFAULT_THRESHOLDS = {
  absVarianceQty: 10, // >= 10 qty variance => queue
  variancePct: 2, // >= 2% => queue
};

const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH" },
  { id: "WH-002", name: "Hyderabad WH" },
  { id: "WH-003", name: "Chennai WH" },
];

const USERS = [
  { id: "U-001", name: "Ravi", mobile: "9xxxx11111", wh: ["WH-001", "WH-002"], role: "Supervisor" },
  { id: "U-002", name: "Kiran", mobile: "9xxxx22222", wh: ["WH-001"], role: "Counter" },
  { id: "U-003", name: "Aparna", mobile: "9xxxx33333", wh: ["WH-001", "WH-003"], role: "Counter" },
  { id: "U-004", name: "Suresh", mobile: "9xxxx44444", wh: ["WH-002"], role: "Counter" },
  { id: "U-005", name: "Divya", mobile: "9xxxx55555", wh: ["WH-003"], role: "Counter" },
];

/** Demo data */
const SAMPLE_RECOUNT_QUEUE = [
  {
    rq_id: "RQ-UUID-0001",
    rq_no: "RQ-2026-0004",
    plan_no: "CC-2026-0008",
    task_id: "CCT-0007",
    warehouse_id: "WH-001",
    scope_type: "BIN",
    scope_summary: "Z-B-01-01 → Z-B-01-05",
    count_mode: "Blind",
    original_counter_id: "U-002",
    sku_count: 12,
    variance_qty: -18,
    abs_variance: 18,
    variance_pct: 3.2,
    severity: "High",
    status: "Assigned",
    due_date: "2026-02-20",
    last_activity: "2026-02-19 13:10",
    created_reason: "Abs variance threshold exceeded",
    supervisor_notes: "Random bin shows big mismatch. Assign recount with different counter.",
    recount_team_ids: ["U-001", "U-003"],
    audit_log: [
      { at: "2026-02-19 13:11", by: "System", action: "Queue created (threshold exceeded)" },
      { at: "2026-02-19 13:12", by: "Ravi", action: "Assigned recount team" },
    ],
  },
  {
    rq_id: "RQ-UUID-0002",
    rq_no: "RQ-2026-0005",
    plan_no: "CC-2026-0007",
    task_id: "CCT-0002",
    warehouse_id: "WH-002",
    scope_type: "ITEM",
    scope_summary: "FAST MOVING (A-class)",
    count_mode: "Guided",
    original_counter_id: "U-004",
    sku_count: 8,
    variance_qty: -5,
    abs_variance: 5,
    variance_pct: 2.6,
    severity: "Medium",
    status: "New",
    due_date: "",
    last_activity: "2026-02-19 16:40",
    created_reason: "Variance % threshold exceeded",
    supervisor_notes: "",
    recount_team_ids: [],
    audit_log: [{ at: "2026-02-19 16:40", by: "System", action: "Queue created (variance % exceeded)" }],
  },
  {
    rq_id: "RQ-UUID-0003",
    rq_no: "RQ-2026-0006",
    plan_no: "PA-2026-0005",
    task_id: "PAT-0011",
    warehouse_id: "WH-003",
    scope_type: "BIN",
    scope_summary: "Dock Area Bins",
    count_mode: "Blind",
    original_counter_id: "U-005",
    sku_count: 20,
    variance_qty: 0,
    abs_variance: 0,
    variance_pct: 0,
    severity: "Low",
    status: "Resolved",
    due_date: "2026-02-18",
    last_activity: "2026-02-18 11:05",
    created_reason: "Supervisor flagged (manual)",
    supervisor_notes: "Manual recount requested for audit sampling.",
    recount_team_ids: ["U-001", "U-005"],
    audit_log: [
      { at: "2026-02-17 18:00", by: "Ravi", action: "Manual flag → Recount queue created" },
      { at: "2026-02-18 10:00", by: "Divya", action: "Recount completed" },
      { at: "2026-02-18 11:05", by: "Ravi", action: "Resolved (variance acceptable)" },
    ],
  },
];

/** Helpers */
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

function whName(whId) {
  return WAREHOUSES.find((w) => w.id === whId)?.name || whId;
}

function userName(uid) {
  return USERS.find((u) => u.id === uid)?.name || uid;
}

function userLabel(uid) {
  const u = USERS.find((x) => x.id === uid);
  if (!u) return uid;
  return `${u.name} • ${u.id}`;
}

/** Pills */
function StatusPill({ status }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const cls =
    status === "New"
      ? "bg-gray-100 text-gray-700"
      : status === "Assigned"
      ? "bg-blue-50 text-blue-700"
      : status === "In-Recount"
      ? "bg-amber-50 text-amber-800"
      : status === "Resolved"
      ? "bg-green-50 text-green-700"
      : status === "Closed"
      ? "bg-rose-50 text-rose-700"
      : "bg-gray-100 text-gray-700";

  return <span className={classNames(base, cls)}>{status}</span>;
}

function SeverityPill({ severity }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const cls =
    severity === "Low"
      ? "bg-gray-100 text-gray-700"
      : severity === "Medium"
      ? "bg-amber-50 text-amber-800"
      : "bg-rose-50 text-rose-700";
  return <span className={classNames(base, cls)}>{severity}</span>;
}

function ModePill({ mode }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const cls = mode === "Blind" ? "bg-gray-100 text-gray-700" : "bg-emerald-50 text-emerald-700";
  return <span className={classNames(base, cls)}>{mode} Mode</span>;
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

/** Quick stats (right panel) */
function QuickStatsCard({ stats }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Quick Stats</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <StatLine label="Total Records" value={stats.total} pillBg="#E8F0FE" />
        <div className="my-3 border-t border-gray-100" />

        {QUEUE_STATUS.map((s) => (
          <StatLine
            key={s}
            label={s}
            value={stats.byStatus[s] || 0}
            pillBg={
              s === "New"
                ? "#EEF2F7"
                : s === "Assigned"
                ? "#E8F0FE"
                : s === "In-Recount"
                ? "#FFF3D6"
                : s === "Resolved"
                ? "#E8F7EF"
                : "#FFE8EC"
            }
          />
        ))}

        <div className="my-3 border-t border-gray-100" />
        <StatLine label="High Severity" value={stats.high} pillBg="#FFE8EC" />
        <StatLine label="Open (New+Assigned+In-Recount)" value={stats.open} pillBg="#FFF3D6" />

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-semibold">Tip:</span> Filters apply to stats + export.
        </div>
      </div>
    </div>
  );
}

/** MAIN PAGE */
export default function RecountQueuePage() {
  const [rows, setRows] = useState(SAMPLE_RECOUNT_QUEUE);

  // Filters
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("All");
  const [status, setStatus] = useState("All");
  const [severity, setSeverity] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Thresholds (Phase-1 control)
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [active, setActive] = useState(null);

  // Modal state
  const [teamSearch, setTeamSearch] = useState("");
  const [edit, setEdit] = useState({
    due_date: "",
    recount_team_ids: [],
    supervisor_notes: "",
    status: "New",
  });

  /** Derived filtered list */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const bySearch =
        !q ||
        (r.rq_no || "").toLowerCase().includes(q) ||
        (r.plan_no || "").toLowerCase().includes(q) ||
        (r.task_id || "").toLowerCase().includes(q) ||
        (r.scope_summary || "").toLowerCase().includes(q);

      const byWh = warehouse === "All" ? true : r.warehouse_id === warehouse;
      const bySt = status === "All" ? true : r.status === status;
      const bySev = severity === "All" ? true : r.severity === severity;

      return bySearch && byWh && bySt && bySev;
    });
  }, [rows, search, warehouse, status, severity]);

  /** Quick stats */
  const quickStats = useMemo(() => {
    const byStatus = {};
    let high = 0;
    let open = 0;

    filtered.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      if (r.severity === "High") high += 1;
      if (["New", "Assigned", "In-Recount"].includes(r.status)) open += 1;
    });

    return { total: filtered.length, byStatus, high, open };
  }, [filtered]);

  /** Pagination */
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** Export */
  const exportToCSV = () => {
    const header = [
      "RQ No",
      "Plan No",
      "Task ID",
      "Warehouse",
      "Scope Type",
      "Scope Summary",
      "Mode",
      "SKU Count",
      "Variance Qty",
      "Abs Variance",
      "Variance %",
      "Severity",
      "Status",
      "Due Date",
      "Recount Team",
      "Last Activity",
      "Created Reason",
    ];

    const rowsCsv = filtered.map((r) =>
      [
        r.rq_no,
        r.plan_no,
        r.task_id,
        r.warehouse_id,
        r.scope_type,
        (r.scope_summary || "").replaceAll(",", " "),
        r.count_mode,
        String(r.sku_count || 0),
        String(r.variance_qty || 0),
        String(r.abs_variance || 0),
        String(r.variance_pct || 0),
        r.severity,
        r.status,
        r.due_date || "",
        (r.recount_team_ids || []).map((id) => userName(id)).join("|"),
        r.last_activity,
        (r.created_reason || "").replaceAll(",", " "),
      ].join(",")
    );

    const csvContent = [header.join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "recount-queue.csv";
    link.click();
  };

  /** Auto create queue (demo) */
  const autoGenerateDemoQueue = () => {
    // This simulates system creating a new queue entry when thresholds exceed.
    const demo = {
      rq_id: `RQ-UUID-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      rq_no: `RQ-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      plan_no: "CC-2026-0010",
      task_id: `CCT-${String(Math.floor(Math.random() * 90) + 10).padStart(4, "0")}`,
      warehouse_id: "WH-001",
      scope_type: "BIN",
      scope_summary: "Z-A-01-06 → Z-A-01-10",
      count_mode: "Blind",
      original_counter_id: "U-003",
      sku_count: 10,
      variance_qty: -12,
      abs_variance: 12,
      variance_pct: 2.4,
      severity: "High",
      status: "New",
      due_date: "",
      last_activity: "2026-02-21 10:15",
      created_reason: `Auto: Abs≥${thresholds.absVarianceQty} or %≥${thresholds.variancePct}`,
      supervisor_notes: "",
      recount_team_ids: [],
      audit_log: [{ at: "2026-02-21 10:15", by: "System", action: "Queue created (demo trigger)" }],
    };

    // basic rule check
    const eligible =
      demo.abs_variance >= Number(thresholds.absVarianceQty) || demo.variance_pct >= Number(thresholds.variancePct);

    if (!eligible) {
      alert("Demo entry did not breach threshold. Adjust threshold and try again.");
      return;
    }

    setRows((p) => [demo, ...p]);
    alert("Recount Queue created (demo).");
  };

  /** Modal open/close */
  const openModal = (r) => {
    setActive(r);
    setEdit({
      due_date: r.due_date || "",
      recount_team_ids: (r.recount_team_ids || []).slice(),
      supervisor_notes: r.supervisor_notes || "",
      status: r.status || "New",
    });
    setTeamSearch("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActive(null);
    setTeamSearch("");
  };

  /** Team selection inside modal (filtered by warehouse) */
  const availableUsers = useMemo(() => {
    const wh = active?.warehouse_id;
    const base = wh ? USERS.filter((u) => u.wh.includes(wh)) : USERS;

    const q = teamSearch.trim().toLowerCase();
    if (!q) return base;

    return base.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.mobile.toLowerCase().includes(q)
    );
  }, [active, teamSearch]);

  const toggleTeam = (uid) => {
    setEdit((p) => {
      const exists = p.recount_team_ids.includes(uid);
      return { ...p, recount_team_ids: exists ? p.recount_team_ids.filter((x) => x !== uid) : [...p.recount_team_ids, uid] };
    });
  };

  /** Modal actions */
  const save = () => {
    if (!active) return;

    // simple validation
    if (["Assigned", "In-Recount"].includes(edit.status) && edit.recount_team_ids.length === 0) {
      alert("Select at least one recount team member.");
      return;
    }

    setRows((p) =>
      p.map((r) => {
        if (r.rq_id !== active.rq_id) return r;

        const nowLog = { at: "2026-02-21 10:20", by: "Supervisor", action: `Saved: status=${edit.status}` };
        return {
          ...r,
          due_date: edit.due_date,
          recount_team_ids: edit.recount_team_ids,
          supervisor_notes: edit.supervisor_notes,
          status: edit.status,
          last_activity: "2026-02-21 10:20",
          audit_log: [...(r.audit_log || []), nowLog],
        };
      })
    );

    alert("Saved (demo).");
    closeModal();
  };

  const setStatusAndSave = (nextStatus) => {
    setEdit((p) => ({ ...p, status: nextStatus }));
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden">
      <PageBreadcrumb pageTitle="Recount Queue" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Recount Queue</h2>
            <p className="text-sm text-gray-500">
              Variance threshold exceeded → auto queue → supervisor assigns recount → resolves/close.
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

            <button
              onClick={autoGenerateDemoQueue}
              className={classNames(primaryBtn)}
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
            >
              + Demo Trigger Queue
            </button>
          </div>
        </div>

        {/* Layout: left list + right stats */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div>
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="RQ No / Plan No / Task / Scope"
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

            {/* Threshold controls (Phase-1) */}
            <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Auto Queue Thresholds (Phase-1)</div>
                  <div className={helperBase}>System creates a queue when any threshold exceeds.</div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <div>
                    <label className={labelBase}>Abs Variance Qty ≥</label>
                    <input
                      className={classNames(inputBase, "mt-1")}
                      value={String(thresholds.absVarianceQty)}
                      onChange={(e) =>
                        setThresholds((p) => ({ ...p, absVarianceQty: Number(e.target.value.replace(/[^\d]/g, "")) || 0 }))
                      }
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className={labelBase}>Variance % ≥</label>
                    <input
                      className={classNames(inputBase, "mt-1")}
                      value={String(thresholds.variancePct)}
                      onChange={(e) =>
                        setThresholds((p) => ({ ...p, variancePct: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 }))
                      }
                      placeholder="2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1300px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">RQ No</th>
                    <th className="px-4 py-3 text-left">Plan / Task</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-left">Mode</th>
                    <th className="px-4 py-3 text-left">Variance</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Due</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.rq_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {r.rq_no}
                        <div className="mt-1 text-xs text-gray-500">{r.rq_id}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.plan_no}</div>
                        <div className="mt-1 text-xs text-gray-500">Task: {r.task_id}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.warehouse_id}</div>
                        <div className="mt-1 text-xs text-gray-500">{whName(r.warehouse_id)}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.scope_type}</div>
                        <div className="mt-1 text-xs text-gray-500">{r.scope_summary}</div>
                      </td>

                      <td className="px-4 py-3">
                        <ModePill mode={r.count_mode} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">
                          Qty: {r.variance_qty} (Abs: {r.abs_variance})
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Var%: {r.variance_pct}% • SKUs: {r.sku_count}</div>
                      </td>

                      <td className="px-4 py-3">
                        <SeverityPill severity={r.severity} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusPill status={r.status} />
                      </td>

                      <td className="px-4 py-3">{r.due_date || "-"}</td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => openModal(r)}
                          className="text-sm font-semibold hover:underline"
                          style={{ color: FORTUNA_SECONDARY_BLUE }}
                        >
                          View / Manage
                        </button>
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
        {isModalOpen && active && (
          <div className="fixed inset-0 z-50 bg-black/40">
            {/* zoom/header safe approach */}
            <div className="h-full w-full overflow-y-auto">
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col h-[92vh]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        Recount Queue • {active.rq_no}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Plan: <span className="font-semibold">{active.plan_no}</span> • Task:{" "}
                        <span className="font-semibold">{active.task_id}</span> • Warehouse:{" "}
                        <span className="font-semibold">{active.warehouse_id}</span> ({whName(active.warehouse_id)})
                      </p>

                      {/* Top “pills” (continuity with your flow) */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                        >
                          Cycle Count
                        </span>
                        <StatusPill status={edit.status} />
                        <SeverityPill severity={active.severity} />
                        <ModePill mode={active.count_mode} />
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
                      {/* LEFT */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Queue Details</h4>
                          <p className={classNames(helperBase, "mt-1")}>
                            Supervisor reviews variance → assigns recount → resolves/close.
                          </p>

                          <div className="mt-4 space-y-2 text-sm">
                            <SummaryRow label="Scope" value={`${active.scope_type}: ${active.scope_summary}`} />
                            <SummaryRow label="SKU Count" value={String(active.sku_count)} />
                            <SummaryRow label="Variance Qty" value={String(active.variance_qty)} />
                            <SummaryRow label="Abs Variance" value={String(active.abs_variance)} />
                            <SummaryRow label="Variance %" value={`${active.variance_pct}%`} />
                            <SummaryRow label="Counter" value={`${userName(active.original_counter_id)} (${active.original_counter_id})`} />
                            <SummaryRow label="Due Date" value={edit.due_date || "-"} />
                            <SummaryRow label="Last Activity" value={active.last_activity} />
                            <SummaryRow label="Created Reason" value={active.created_reason} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                            <span className="font-semibold">Note:</span> In Blind mode, counter can’t see System Qty.
                            Recount should be controlled by Supervisor.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-800">Supervisor Notes</h4>
                            <button
                              type="button"
                              className="text-xs font-semibold rounded-full px-3 py-1 bg-blue-50 text-blue-700"
                              onClick={() => setStatusAndSave("Assigned")}
                            >
                              Assign
                            </button>
                          </div>

                          <textarea
                            className={classNames(inputBase, "mt-3 min-h-[110px] resize-y")}
                            value={edit.supervisor_notes}
                            onChange={(e) => setEdit((p) => ({ ...p, supervisor_notes: e.target.value }))}
                            placeholder="Supervisor remarks..."
                          />
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Audit Trail (Demo)</h4>
                          <div className="mt-3 space-y-2 text-sm">
                            {(active.audit_log || []).map((x, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2">
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-800">{x.action}</div>
                                  <div className="text-xs text-gray-500">By: {x.by}</div>
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">{x.at}</div>
                              </div>
                            ))}
                            {(active.audit_log || []).length === 0 && (
                              <div className="text-sm text-gray-500">No audit logs.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT */}
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
                              onClick={() => setEdit((p) => ({ ...p, recount_team_ids: [] }))}
                            >
                              Clear
                            </button>
                          </div>

                          <div className="mt-3">
                            <label className={labelBase}>Recount Due Date</label>
                            <input
                              type="date"
                              className={classNames(inputBase, "mt-1")}
                              value={edit.due_date}
                              onChange={(e) => setEdit((p) => ({ ...p, due_date: e.target.value }))}
                            />
                            <p className={classNames(helperBase, "mt-1")}>Optional (recommended for SLAs).</p>
                          </div>

                          <div className="mt-3">
                            <label className={labelBase}>User Search</label>
                            <input
                              className={classNames(inputBase, "mt-1")}
                              placeholder="Search name / id / mobile"
                              value={teamSearch}
                              onChange={(e) => setTeamSearch(e.target.value)}
                            />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {availableUsers.map((u) => {
                              const checked = edit.recount_team_ids.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => toggleTeam(u.id)}
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
                              {edit.recount_team_ids.length === 0 ? (
                                <span className="text-sm text-gray-500">No assignees selected.</span>
                              ) : (
                                edit.recount_team_ids.map((id) => (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                                  >
                                    {userName(id)}
                                    <button
                                      type="button"
                                      className="rounded-full px-2 py-0.5 text-blue-700 hover:bg-blue-100"
                                      onClick={() => toggleTeam(id)}
                                      aria-label={`Remove ${userName(id)}`}
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Task Summary</h4>
                          <div className="mt-3 space-y-2 text-sm">
                            <SummaryRow label="Task ID" value={active.task_id} />
                            <SummaryRow label="Plan No" value={active.plan_no} />
                            <SummaryRow label="Type" value="Cycle Count" />
                            <SummaryRow label="Mode" value={active.count_mode} />
                            <SummaryRow label="Warehouse" value={`${active.warehouse_id} • ${whName(active.warehouse_id)}`} />
                            <SummaryRow label="Assignee" value={edit.recount_team_ids.length ? userLabel(edit.recount_team_ids[0]) : "-"} />
                            <SummaryRow label="Due Date" value={edit.due_date || "-"} />
                            <SummaryRow label="Status" value={edit.status} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                            <span className="font-semibold">Next:</span> In-Recount → Submit results → Reconciliation & Variance.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <label className={labelBase}>Queue Status</label>
                          <select
                            className={classNames(inputBase, "mt-1")}
                            value={edit.status}
                            onChange={(e) => setEdit((p) => ({ ...p, status: e.target.value }))}
                          >
                            {QUEUE_STATUS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <p className={classNames(helperBase, "mt-1")}>
                            Rule suggestion: Assigned/In-Recount requires team.
                          </p>
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
                          onClick={() => setStatusAndSave("Assigned")}
                        >
                          Assign
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: "#6D28D9" }}
                          onClick={() => setStatusAndSave("In-Recount")}
                        >
                          In-Recount
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: "#0F766E" }}
                          onClick={() => setStatusAndSave("Resolved")}
                        >
                          Resolve
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                          onClick={() => setStatusAndSave("Closed")}
                        >
                          Close
                        </button>

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: "#111827" }}
                          onClick={save}
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div className={classNames(helperBase, "mt-2")}>
                      UI Fix ready: overlay scroll + fixed height + internal body scroll ⇒ header/footer never hide (zoom issues reduced).
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