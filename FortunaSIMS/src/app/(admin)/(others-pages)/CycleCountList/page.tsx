"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Status list (must match your dropdown) */
const CC_STATUS = [
  "Draft",
  "Planned",
  "Counting In-Progress",
  "Awaiting Approval",
  "Approved",
  "Posted",
  "Cancelled",
];

/** Tabs like GRN list */
const TABS = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "planned", label: "Planned" },
  { key: "inprogress", label: "Counting In-Progress" },
  { key: "awaiting", label: "Awaiting Approval" },
  { key: "approved", label: "Approved" },
  { key: "posted", label: "Posted" },
  { key: "cancelled", label: "Cancelled" },
];

/** Helpers */
function classNames(...v: (string | false | null | undefined)[]) {
  return v.filter(Boolean).join(" ");
}
function withinRange(dateISO: string | null, from: string | null, to: string | null) {
  if (!dateISO) return true;
  const t = new Date(dateISO).getTime();
  if (from) {
    const f = new Date(from).getTime();
    if (t < f) return false;
  }
  if (to) {
    const e = new Date(to).getTime();
    if (t > e) return false;
  }
  return true;
}
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CycleCountListPage() {
  const router = useRouter();

  /** Demo data (replace with API later) */
  const [data, setData] = useState([
    {
      ccNo: "CC-2026-0007",
      createdOn: "2026-02-12",
      warehouse: "WH-002",
      type: "Cycle Count",
      method: "Blind Count",
      scopeType: "Bin",
      scopeValue: "Z-A-01-01 → Z-A-01-10",
      scheduledOn: "2026-02-14",
      status: "Counting In-Progress",
      skuCount: 42,
      varianceQty: -730,
      accuracyPct: 94.3,
      assigned: ["Ravi", "Kiran"],
    },
    {
      ccNo: "CC-2026-0006",
      createdOn: "2026-02-08",
      warehouse: "WH-001",
      type: "Cycle Count",
      method: "Guided Count",
      scopeType: "SKU",
      scopeValue: "FAST MOVING (A-class)",
      scheduledOn: "2026-02-10",
      status: "Awaiting Approval",
      skuCount: 18,
      varianceQty: -40,
      accuracyPct: 99.1,
      assigned: ["Aparna"],
    },
    {
      ccNo: "CC-2026-0005",
      createdOn: "2026-01-20",
      warehouse: "WH-003",
      type: "Physical Audit",
      method: "Blind Count",
      scopeType: "Warehouse",
      scopeValue: "Full WH",
      scheduledOn: "2026-01-28",
      status: "Posted",
      skuCount: 220,
      varianceQty: -10,
      accuracyPct: 99.99,
      assigned: ["Suresh", "Divya"],
    },
    {
      ccNo: "CC-2026-0004",
      createdOn: "2026-01-14",
      warehouse: "WH-002",
      type: "Cycle Count",
      method: "Guided Count",
      scopeType: "Bin",
      scopeValue: "QC_HOLD",
      scheduledOn: "2026-01-15",
      status: "Cancelled",
      skuCount: 6,
      varianceQty: 0,
      accuracyPct: 0,
      assigned: ["Ravi"],
    },
    {
      ccNo: "CC-2026-0008",
      createdOn: todayISO(),
      warehouse: "WH-001",
      type: "Cycle Count",
      method: "Blind Count",
      scopeType: "Bin",
      scopeValue: "Z-B-01-01 → Z-B-01-05",
      scheduledOn: "2026-02-20",
      status: "Draft",
      skuCount: 12,
      varianceQty: 0,
      accuracyPct: 0,
      assigned: ["Kiran"],
    },
  ]);

  /** Tabs */
  const [activeTab, setActiveTab] = useState("all");

  /** Filters (GRN style) */
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scheduledFrom, setScheduledFrom] = useState("");
  const [scheduledTo, setScheduledTo] = useState("");

  /** Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /** Base by tab */
  const tabFilteredBase = useMemo(() => {
    if (activeTab === "drafts") return data.filter((x) => x.status === "Draft");
    if (activeTab === "planned") return data.filter((x) => x.status === "Planned");
    if (activeTab === "inprogress") return data.filter((x) => x.status === "Counting In-Progress");
    if (activeTab === "awaiting") return data.filter((x) => x.status === "Awaiting Approval");
    if (activeTab === "approved") return data.filter((x) => x.status === "Approved");
    if (activeTab === "posted") return data.filter((x) => x.status === "Posted");
    if (activeTab === "cancelled") return data.filter((x) => x.status === "Cancelled");
    return data;
  }, [data, activeTab]);

  /** Apply filters (important: filters apply to stats + export also, like GRN) */
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabFilteredBase.filter((r) => {
      const hay = [
        r.ccNo,
        r.warehouse,
        r.type,
        r.method,
        r.scopeType,
        r.scopeValue,
        r.status,
        ...(r.assigned || []),
      ]
        .join(" ")
        .toLowerCase();

      const okSearch = q ? hay.includes(q) : true;
      const okWh = warehouseFilter === "All" ? true : r.warehouse === warehouseFilter;
      const okStatus = statusFilter === "All" ? true : r.status === statusFilter;
      const okDate = withinRange(r.scheduledOn, scheduledFrom || null, scheduledTo || null);

      return okSearch && okWh && okStatus && okDate;
    });
  }, [tabFilteredBase, search, warehouseFilter, statusFilter, scheduledFrom, scheduledTo]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);

  const paginatedData = filteredData.slice(
    (pageSafe - 1) * itemsPerPage,
    pageSafe * itemsPerPage
  );

  /** Counts for badges (like GRN tab badges) */
  const badgeCount = useMemo(() => {
    const base = data; // badges generally show overall counts, like GRN screenshot
    const map: Record<string, number> = {};
    map.all = base.length;
    map.drafts = base.filter((x) => x.status === "Draft").length;
    map.planned = base.filter((x) => x.status === "Planned").length;
    map.inprogress = base.filter((x) => x.status === "Counting In-Progress").length;
    map.awaiting = base.filter((x) => x.status === "Awaiting Approval").length;
    map.approved = base.filter((x) => x.status === "Approved").length;
    map.posted = base.filter((x) => x.status === "Posted").length;
    map.cancelled = base.filter((x) => x.status === "Cancelled").length;
    return map;
  }, [data]);

  /** Quick stats (based on filteredData like your GRN page note) */
  const stats = useMemo(() => {
    const total = filteredData.length;
    const draft = filteredData.filter((x) => x.status === "Draft").length;
    const planned = filteredData.filter((x) => x.status === "Planned").length;
    const inProgress = filteredData.filter((x) => x.status === "Counting In-Progress").length;
    const awaiting = filteredData.filter((x) => x.status === "Awaiting Approval").length;
    const approved = filteredData.filter((x) => x.status === "Approved").length;
    const posted = filteredData.filter((x) => x.status === "Posted").length;
    const cancelled = filteredData.filter((x) => x.status === "Cancelled").length;

    const avgAccuracy =
      total > 0
        ? Math.round(
            (filteredData.reduce((s, x) => s + (Number(x.accuracyPct) || 0), 0) / total) * 100
          ) / 100
        : 0;

    const varianceTotal = filteredData.reduce((s, x) => s + (Number(x.varianceQty) || 0), 0);

    return {
      total,
      draft,
      planned,
      inProgress,
      awaiting,
      approved,
      posted,
      cancelled,
      avgAccuracy,
      varianceTotal,
    };
  }, [filteredData]);

  /** Actions (Draft clear, Cancel, Approve, Post) */
  const onView = (ccNo: string) => alert(`View ${ccNo} (demo)`);
  const onEdit = (ccNo: string) => alert(`Edit ${ccNo} (demo)`);
  const onClearDraft = (ccNo: string) => {
    const ok = confirm(`Clear draft ${ccNo}? This cannot be undone.`);
    if (!ok) return;
    setData((prev) => prev.filter((x) => x.ccNo !== ccNo));
  };
  const onCancel = (ccNo: string) => {
    const ok = confirm(`Cancel ${ccNo}?`);
    if (!ok) return;
    setData((prev) =>
      prev.map((x) => (x.ccNo === ccNo ? { ...x, status: "Cancelled" } : x))
    );
  };
  const onApprove = (ccNo: string) => {
    const ok = confirm(`Approve ${ccNo}?`);
    if (!ok) return;
    setData((prev) =>
      prev.map((x) => (x.ccNo === ccNo ? { ...x, status: "Approved" } : x))
    );
  };
  const onPost = (ccNo: string) => {
    const ok = confirm(`Post ${ccNo}? (Final step)`);
    if (!ok) return;
    setData((prev) =>
      prev.map((x) => (x.ccNo === ccNo ? { ...x, status: "Posted" } : x))
    );
  };

  /** Export (same style as your PO/GRN list) */
  const exportToCSV = () => {
    const header = [
      "CC No",
      "Created On",
      "Warehouse",
      "Type",
      "Method",
      "Scope Type",
      "Scope Value",
      "Scheduled On",
      "Status",
      "SKU Count",
      "Variance Qty",
      "Accuracy %",
      "Assigned",
    ];
    const rows = filteredData.map((r) =>
      [
        r.ccNo,
        r.createdOn,
        r.warehouse,
        r.type,
        r.method,
        r.scopeType,
        r.scopeValue,
        r.scheduledOn,
        r.status,
        r.skuCount,
        r.varianceQty,
        r.accuracyPct,
        (r.assigned || []).join(" | "),
      ]
        .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cycle-count-list.csv";
    link.click();
  };

  const resetFilters = () => {
    setSearch("");
    setWarehouseFilter("All");
    setStatusFilter("All");
    setScheduledFrom("");
    setScheduledTo("");
    setCurrentPage(1);
  };

  const statusPill = (s: string) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Posted" && "bg-green-100 text-green-700",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Awaiting Approval" && "bg-purple-100 text-purple-700",
      s === "Counting In-Progress" && "bg-amber-100 text-amber-800",
      s === "Planned" && "bg-blue-100 text-blue-700",
      s === "Cancelled" && "bg-gray-200 text-gray-700",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
    );

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Cycle Count" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header (GRN model) */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Cycle Count List
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Draft → Planned → Counting In-Progress → Awaiting Approval → Approved → Posted / Cancelled.
              (Filters apply to stats + export)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/NewCCPForm")}
              className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
            >
              + Create Cycle Count
            </button>

            <button
              onClick={exportToCSV}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
            >
              Export to Excel
            </button>

            <button
              onClick={resetFilters}
              className="active:scale-95 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-md transition-all duration-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Tabs (GRN model) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <TabBtn
              key={t.key}
              active={activeTab === t.key}
              color={t.key === "drafts" ? FORTUNA_PRIMARY_RED : FORTUNA_SECONDARY_BLUE}
              onClick={() => {
                setActiveTab(t.key);
                setCurrentPage(1);
                setStatusFilter("All"); // like GRN style
              }}
              label={
                <>
                  {t.label}
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                    {badgeCount[t.key]}
                  </span>
                </>
              }
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left: list table */}
          <div className="xl:col-span-9">
            {/* Filters row like GRN screenshot */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Search
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  placeholder="Search CC No / Warehouse / Scope / Assigned / Status"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Warehouse
                </label>
                <select
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={warehouseFilter}
                  onChange={(e) => {
                    setWarehouseFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="WH-001">WH-001</option>
                  <option value="WH-002">WH-002</option>
                  <option value="WH-003">WH-003</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Status
                </label>
                <select
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {CC_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Scheduled From
                </label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={scheduledFrom}
                  onChange={(e) => {
                    setScheduledFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Scheduled To
                </label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={scheduledTo}
                  onChange={(e) => {
                    setScheduledTo(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-rose-700">CC No</th>
                    <th className="px-4 py-3 text-left text-rose-700">Warehouse</th>
                    <th className="px-4 py-3 text-left text-rose-700">Type</th>
                    <th className="px-4 py-3 text-left text-rose-700">Scope</th>
                    <th className="px-4 py-3 text-left text-rose-700">Scheduled</th>
                    <th className="px-4 py-3 text-left text-rose-700">Status</th>
                    <th className="px-4 py-3 text-left text-rose-700">SKUs</th>
                    <th className="px-4 py-3 text-left text-rose-700">Variance</th>
                    <th className="px-4 py-3 text-left text-rose-700">Accuracy %</th>
                    <th className="px-4 py-3 text-left text-rose-700">Assigned</th>
                    <th className="px-4 py-3 text-left text-rose-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="dark:text-gray-200">
                  {paginatedData.map((r) => {
                    const isDraft = r.status === "Draft";
                    const isPosted = r.status === "Posted";
                    const isCancelled = r.status === "Cancelled";
                    const canEdit = !isPosted && !isCancelled;
                    const canCancel = !isPosted && !isCancelled;
                    const canApprove = r.status === "Awaiting Approval";
                    const canPost = r.status === "Approved";

                    return (
                      <tr
                        key={r.ccNo}
                        className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold">{r.ccNo}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">{r.createdOn}</div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-rose-700">{r.warehouse}</td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-rose-700">{r.type}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">{r.method}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-rose-700">{r.scopeType}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">{r.scopeValue}</div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-rose-700">{r.scheduledOn}</td>

                        <td className="px-4 py-3">
                          <span className={statusPill(r.status)}>{r.status}</span>
                        </td>

                        <td className="px-4 py-3 font-semibold">{r.skuCount}</td>
                        <td className="px-4 py-3 font-semibold">{r.varianceQty}</td>
                        <td className="px-4 py-3 font-semibold">
                          {Number(r.accuracyPct || 0).toFixed(2)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(r.assigned || []).slice(0, 2).map((u) => (
                              <span
                                key={u}
                                className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                              >
                                {u}
                              </span>
                            ))}
                            {(r.assigned || []).length > 2 && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                +{(r.assigned || []).length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap space-x-3">
                          <button
                            className="font-semibold text-blue-600 hover:underline"
                            onClick={() => onView(r.ccNo)}
                          >
                            View
                          </button>

                          {canEdit && (
                            <button
                              className="font-semibold hover:underline"
                              style={{ color: FORTUNA_PRIMARY_RED }}
                              onClick={() => onEdit(r.ccNo)}
                            >
                              Edit
                            </button>
                          )}

                          {/* Draft-only: Clear Draft (like your requirement) */}
                          {isDraft && (
                            <button
                              className="font-semibold text-rose-600 hover:underline"
                              onClick={() => onClearDraft(r.ccNo)}
                            >
                              Clear Draft
                            </button>
                          )}

                          {/* Awaiting Approval: Approve */}
                          {canApprove && (
                            <button
                              className="font-semibold hover:underline"
                              style={{ color: FORTUNA_SECONDARY_BLUE }}
                              onClick={() => onApprove(r.ccNo)}
                            >
                              Approve
                            </button>
                          )}

                          {/* Approved: Post */}
                          {canPost && (
                            <button
                              className="font-semibold hover:underline text-emerald-700"
                              onClick={() => onPost(r.ccNo)}
                            >
                              Post
                            </button>
                          )}

                          {/* Cancel for eligible rows */}
                          {canCancel && (
                            <button
                              className="font-semibold text-gray-700 hover:underline"
                              onClick={() => onCancel(r.ccNo)}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedData.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300"
                        colSpan={11}
                      >
                        No records found for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Controls (same like your PO list) */}
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                {filteredData.length > 0 ? (
                  <>
                    Showing {(pageSafe - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(pageSafe * itemsPerPage, filteredData.length)} of{" "}
                    {filteredData.length} entries
                  </>
                ) : (
                  <>Showing 0 entries</>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm dark:text-gray-200">
                <span>Records per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={pageSafe === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
                >
                  Previous
                </button>

                <button
                  disabled={pageSafe === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right: Quick Stats card (GRN model) */}
          <div className="xl:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Quick Stats
                </h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
              </div>

              <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                <StatRow label="Total Records" value={stats.total} />
                <StatRow label="Draft" value={stats.draft} badge="gray" />
                <StatRow label="Planned" value={stats.planned} badge="blue" />
                <StatRow label="In-Progress" value={stats.inProgress} badge="amber" />
                <StatRow label="Awaiting Approval" value={stats.awaiting} badge="purple" />
                <StatRow label="Approved" value={stats.approved} badge="green" />
                <StatRow label="Posted" value={stats.posted} badge="green" />
                <StatRow label="Cancelled" value={stats.cancelled} badge="gray" />

                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Avg Accuracy %" value={stats.avgAccuracy} badge="blue" />
                <StatRow label="Total Variance Qty" value={stats.varianceTotal} badge="amber" />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats + export.
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Drafts tab:</span> Edit / Clear Draft only. <br />
                <span className="font-semibold">Awaiting Approval:</span> Approve enabled. <br />
                <span className="font-semibold">Approved:</span> Post enabled.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small components */
function TabBtn({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  color: string;
}) {

  
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95",
        active
          ? "text-white shadow"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
      )}
      style={active ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}


function StatRow({ label, value, badge }: { label: string; value: number | string; badge?: "green" | "red" | "amber" | "blue" | "purple" | "gray" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span
        className={classNames(
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          badge === "green" && "bg-green-100 text-green-700",
          badge === "red" && "bg-red-100 text-red-600",
          badge === "amber" && "bg-amber-100 text-amber-800",
          badge === "blue" && "bg-blue-100 text-blue-700",
          badge === "purple" && "bg-purple-100 text-purple-700",
          badge === "gray" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
          !badge && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
        )}
      >
        {String(value)}
      </span>
    </div>
  );
}
