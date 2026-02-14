"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

/** Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Routes (mee project batti adjust chesuko) */
const ROUTES = {
  giCreate: "/goods-inward/create", // ✅ create page route (adjust if different)
  giView: (id: string) => `/goods-inward/view/${id}`, // demo
  giEdit: (id: string) => `/goods-inward/edit/${id}`, // demo
  grnList: "/GRN",
};

type GIStatus =
  | "Live"
  | "Inward Assigned"
  | "Inward In-Progress"
  | "Inwarded"
  | "QC Pending"
  | "QC Passed"
  | "QC Failed"
  | "Converted to GRN"
  | "Cancelled";

type TabKey =
  | "all"
  | "live"
  | "assigned"
  | "inprogress"
  | "inwarded"
  | "qc"
  | "converted"
  | "cancelled";

type InwardSource = "Issued PO" | "Without PO (Manual)" | "Transfer In";
type ReceiptType = "Full" | "Partial";

type GIRow = {
  gi_id: string;
  gi_no: string;
  gi_date: string;

  inward_source: InwardSource;
  receipt_type: ReceiptType;

  gate_entry_no: string;
  vehicle_no: string;
  warehouse: string;

  vendor_name?: string; // optional for manual/transfer
  po_nos: string[]; // multi PO

  total_items: number;
  expected_total_qty: number;

  live_mobile_qty: number;
  final_received_qty: number;

  qc_required_lines: number;
  qc_status: "NA" | "Pending" | "Passed" | "Failed";

  gi_status: GIStatus;

  assigned_receivers: number;
  shipments: number;

  last_updated: string;

  converted_grn_no?: string;
};

const DEMO_GI: GIRow[] = [
  {
    gi_id: "GI-UID-001",
    gi_no: "GI-2026-0010",
    gi_date: "2026-02-14",
    inward_source: "Issued PO",
    receipt_type: "Full",
    gate_entry_no: "GE-2026-0501",
    vehicle_no: "AP39NN9197",
    warehouse: "WH-002",
    vendor_name: "Sri Lakshmi Suppliers",
    po_nos: ["PO-2026-0121"],
    total_items: 2,
    expected_total_qty: 220,
    live_mobile_qty: 220,
    final_received_qty: 220,
    qc_required_lines: 1,
    qc_status: "Passed",
    gi_status: "QC Passed",
    assigned_receivers: 2,
    shipments: 1,
    last_updated: "2026-02-14 15:18",
  },
  {
    gi_id: "GI-UID-002",
    gi_no: "GI-2026-0011",
    gi_date: "2026-02-13",
    inward_source: "Issued PO",
    receipt_type: "Partial",
    gate_entry_no: "GE-2026-0502",
    vehicle_no: "TS09AB1122",
    warehouse: "WH-002",
    vendor_name: "Aparna Packaging",
    po_nos: ["PO-2026-0140", "PO-2026-0141"],
    total_items: 4,
    expected_total_qty: 500,
    live_mobile_qty: 280,
    final_received_qty: 0,
    qc_required_lines: 2,
    qc_status: "Pending",
    gi_status: "Inward In-Progress",
    assigned_receivers: 3,
    shipments: 2,
    last_updated: "2026-02-13 18:05",
  },
  {
    gi_id: "GI-UID-003",
    gi_no: "GI-2026-0012",
    gi_date: "2026-02-12",
    inward_source: "Without PO (Manual)",
    receipt_type: "Full",
    gate_entry_no: "GE-2026-0503",
    vehicle_no: "AP16XX7788",
    warehouse: "WH-001",
    vendor_name: "Local Vendor (Manual)",
    po_nos: [],
    total_items: 1,
    expected_total_qty: 50,
    live_mobile_qty: 0,
    final_received_qty: 50,
    qc_required_lines: 0,
    qc_status: "NA",
    gi_status: "Inwarded",
    assigned_receivers: 1,
    shipments: 1,
    last_updated: "2026-02-12 11:25",
  },
  {
    gi_id: "GI-UID-004",
    gi_no: "GI-2026-0013",
    gi_date: "2026-02-11",
    inward_source: "Issued PO",
    receipt_type: "Full",
    gate_entry_no: "GE-2026-0504",
    vehicle_no: "KA03NG2574",
    warehouse: "WH-003",
    vendor_name: "Sri Lakshmi Suppliers",
    po_nos: ["PO-2026-0100"],
    total_items: 3,
    expected_total_qty: 300,
    live_mobile_qty: 300,
    final_received_qty: 300,
    qc_required_lines: 1,
    qc_status: "Passed",
    gi_status: "Converted to GRN",
    assigned_receivers: 2,
    shipments: 1,
    last_updated: "2026-02-11 19:12",
    converted_grn_no: "GRN-2026-00012",
  },
  {
    gi_id: "GI-UID-005",
    gi_no: "GI-2026-0014",
    gi_date: "2026-02-10",
    inward_source: "Transfer In",
    receipt_type: "Partial",
    gate_entry_no: "GE-2026-0505",
    vehicle_no: "TN10AA9090",
    warehouse: "WH-001",
    vendor_name: "WH-003 Transfer",
    po_nos: [],
    total_items: 2,
    expected_total_qty: 120,
    live_mobile_qty: 0,
    final_received_qty: 0,
    qc_required_lines: 0,
    qc_status: "NA",
    gi_status: "Cancelled",
    assigned_receivers: 0,
    shipments: 1,
    last_updated: "2026-02-10 09:40",
  },
];

/** UI helpers */
function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase = "text-sm font-medium text-gray-700 dark:text-gray-200";

const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 " +
  "shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white " +
  "shadow-theme-sm focus:outline-none focus:ring-3 focus:ring-brand-500/20";

function tabCount(rows: GIRow[], tab: TabKey) {
  if (tab === "all") return rows.length;
  if (tab === "live") return rows.filter((r) => r.gi_status === "Live").length;
  if (tab === "assigned") return rows.filter((r) => r.gi_status === "Inward Assigned").length;
  if (tab === "inprogress") return rows.filter((r) => r.gi_status === "Inward In-Progress").length;
  if (tab === "inwarded") return rows.filter((r) => r.gi_status === "Inwarded").length;
  if (tab === "qc") return rows.filter((r) => r.gi_status.includes("QC")).length;
  if (tab === "converted") return rows.filter((r) => r.gi_status === "Converted to GRN").length;
  return rows.filter((r) => r.gi_status === "Cancelled").length;
}

function giStatusBadge(status: GIStatus) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (status === "Live") return classNames(base, "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200");
  if (status === "Inward Assigned") return classNames(base, "bg-blue-100 text-blue-700");
  if (status === "Inward In-Progress") return classNames(base, "bg-amber-100 text-amber-800");
  if (status === "Inwarded") return classNames(base, "bg-blue-100 text-blue-700");
  if (status === "QC Pending") return classNames(base, "bg-amber-100 text-amber-800");
  if (status === "QC Passed") return classNames(base, "bg-green-100 text-green-700");
  if (status === "QC Failed") return classNames(base, "bg-red-100 text-red-600");
  if (status === "Converted to GRN") return classNames(base, "bg-purple-100 text-purple-700");
  return classNames(base, "bg-gray-200 text-gray-700");
}

function qcBadge(qcLines: number, qcStatus: GIRow["qc_status"]) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (qcLines <= 0) return classNames(base, "bg-sky-100 text-sky-700");
  if (qcStatus === "Passed") return classNames(base, "bg-green-100 text-green-700");
  if (qcStatus === "Failed") return classNames(base, "bg-red-100 text-red-600");
  return classNames(base, "bg-amber-100 text-amber-800");
}

export default function GoodsInwardListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<GIRow[]>(DEMO_GI);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const [q, setQ] = useState("");
  const [warehouse, setWarehouse] = useState<string>("");
  const [vendor, setVendor] = useState<string>("");
  const [source, setSource] = useState<string>("");

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "assigned", label: "Assigned" },
    { key: "inprogress", label: "In-Progress" },
    { key: "inwarded", label: "Inwarded" },
    { key: "qc", label: "QC" },
    { key: "converted", label: "Converted" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const warehouses = useMemo(() => Array.from(new Set(rows.map((r) => r.warehouse))), [rows]);
  const vendors = useMemo(() => Array.from(new Set(rows.map((r) => r.vendor_name || "-"))), [rows]);
  const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.inward_source))), [rows]);

  const filtered = useMemo(() => {
    let data = [...rows];

    if (activeTab === "live") data = data.filter((r) => r.gi_status === "Live");
    if (activeTab === "assigned") data = data.filter((r) => r.gi_status === "Inward Assigned");
    if (activeTab === "inprogress") data = data.filter((r) => r.gi_status === "Inward In-Progress");
    if (activeTab === "inwarded") data = data.filter((r) => r.gi_status === "Inwarded");
    if (activeTab === "qc") data = data.filter((r) => r.gi_status.includes("QC"));
    if (activeTab === "converted") data = data.filter((r) => r.gi_status === "Converted to GRN");
    if (activeTab === "cancelled") data = data.filter((r) => r.gi_status === "Cancelled");

    const term = q.trim().toLowerCase();
    if (term) {
      data = data.filter((r) => {
        const blob = `${r.gi_no} ${r.gate_entry_no} ${r.vehicle_no} ${r.warehouse} ${r.vendor_name ?? ""} ${r.po_nos.join(" ")} ${r.gi_status}`.toLowerCase();
        return blob.includes(term);
      });
    }

    if (warehouse) data = data.filter((r) => r.warehouse === warehouse);
    if (vendor) data = data.filter((r) => (r.vendor_name || "-") === vendor);
    if (source) data = data.filter((r) => r.inward_source === source);

    data.sort((a, b) => (a.gi_date < b.gi_date ? 1 : -1));
    return data;
  }, [rows, activeTab, q, warehouse, vendor, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage, PAGE_SIZE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, q, warehouse, vendor, source]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  /** Quick stats based on current filtered list */
  const stats = useMemo(() => {
    const total = filtered.length;
    const live = filtered.filter((x) => x.gi_status === "Live").length;
    const assigned = filtered.filter((x) => x.gi_status === "Inward Assigned").length;
    const inProgress = filtered.filter((x) => x.gi_status === "Inward In-Progress").length;
    const inwarded = filtered.filter((x) => x.gi_status === "Inwarded").length;
    const qcPending = filtered.filter((x) => x.gi_status === "QC Pending").length;
    const qcFailed = filtered.filter((x) => x.gi_status === "QC Failed").length;
    const converted = filtered.filter((x) => x.gi_status === "Converted to GRN").length;

    const expQty = filtered.reduce((s, x) => s + (Number(x.expected_total_qty) || 0), 0);
    const liveQty = filtered.reduce((s, x) => s + (Number(x.live_mobile_qty) || 0), 0);
    const finalQty = filtered.reduce((s, x) => s + (Number(x.final_received_qty) || 0), 0);

    const totalVendors = new Set(filtered.map((x) => x.vendor_name || "-")).size;
    const totalWH = new Set(filtered.map((x) => x.warehouse)).size;

    return {
      total,
      live,
      assigned,
      inProgress,
      inwarded,
      qcPending,
      qcFailed,
      converted,
      expQty,
      liveQty,
      finalQty,
      totalVendors,
      totalWH,
    };
  }, [filtered]);

  /** Export CSV */
  const exportToCSV = () => {
    const header = [
      "GI No",
      "GI Date",
      "Warehouse",
      "Inward Source",
      "Receipt Type",
      "Gate Entry No",
      "Vehicle No",
      "Vendor",
      "PO Nos",
      "Shipments",
      "Assigned Receivers",
      "Total Items",
      "Expected Qty",
      "Live Mobile Qty",
      "Final Received Qty",
      "QC Lines",
      "QC Status",
      "GI Status",
      "Converted GRN",
      "Last Updated",
    ];

    const rowsCsv = filtered.map((r) =>
      [
        r.gi_no,
        r.gi_date,
        r.warehouse,
        r.inward_source,
        r.receipt_type,
        r.gate_entry_no,
        r.vehicle_no,
        r.vendor_name ?? "",
        r.po_nos.join(" | "),
        r.shipments,
        r.assigned_receivers,
        r.total_items,
        r.expected_total_qty,
        r.live_mobile_qty,
        r.final_received_qty,
        r.qc_required_lines,
        r.qc_status,
        r.gi_status,
        r.converted_grn_no ?? "",
        r.last_updated,
      ]
        .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header.join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "goods-inward-list.csv";
    link.click();
  };

  const onClearFilters = () => {
    setQ("");
    setWarehouse("");
    setVendor("");
    setSource("");
  };

  /** Actions (demo) */
  const onView = (r: GIRow) => alert(`Open GI view: ${r.gi_no} (demo)`);
  const onOpenLive = (r: GIRow) => alert(`Open Live Receiving screen: ${r.gi_no} (demo)`);
  const onOpenGRN = (r: GIRow) => {
    if (!r.converted_grn_no) return alert("Not converted yet.");
    router.push(ROUTES.grnList);
  };

  const onCancel = (r: GIRow) => {
    if (r.gi_status === "Converted to GRN") return alert("Already converted. Cannot cancel.");
    const ok = confirm(`Cancel Goods Inward ${r.gi_no}?`);
    if (!ok) return;
    setRows((p) =>
      p.map((x) => (x.gi_id === r.gi_id ? { ...x, gi_status: "Cancelled", last_updated: nowStamp() } : x))
    );
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Goods Inward" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Goods Inward List</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Live Receiving flow tracking. (Filters apply to stats + export)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/GoodsInwardForm")}
            className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
            style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
          >
            + Create Inward
          </button>

          <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
            onClick={exportToCSV}
          >
            Export to Excel
          </button>

          <button type="button" className={outlineBtn} onClick={onClearFilters}>
            Reset Filters
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
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                )}
                style={isActive ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
              >
                {t.label}
                <span
                  className={classNames(
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    isActive ? "bg-white/20" : "bg-gray-100 dark:bg-white/10"
                  )}
                >
                  {tabCount(rows, t.key)}
                </span>

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

        {/* Body layout: Table + Quick Stats */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Table + Filters */}
            <div className="xl:col-span-9 min-w-0">
              {/* Filters */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <label className={labelBase}>Search</label>
                  <input
                    className={inputBase}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search GI / Gate / Vehicle / PO / Vendor / WH / Status"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={labelBase}>Warehouse</label>
                  <select className={inputBase} value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                    <option value="">All</option>
                    {warehouses.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className={labelBase}>Vendor</label>
                  <select className={inputBase} value={vendor} onChange={(e) => setVendor(e.target.value)}>
                    <option value="">All</option>
                    {vendors.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className={labelBase}>Source</label>
                  <select className={inputBase} value={source} onChange={(e) => setSource(e.target.value)}>
                    <option value="">All</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="mt-6 w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[1500px] w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">GI</th>
                      <th className="px-4 py-3 text-left">Gate / Vehicle</th>
                      <th className="px-4 py-3 text-left">WH</th>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-left">POs</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Shipments</th>
                      <th className="px-4 py-3 text-left">Receivers</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-left">Expected</th>
                      <th className="px-4 py-3 text-left">Live</th>
                      <th className="px-4 py-3 text-left">Final</th>
                      <th className="px-4 py-3 text-left">QC</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Updated</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {paginatedRows.map((r) => (
                      <tr key={r.gi_id} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white">{r.gi_no}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{r.gi_date}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold">{r.gate_entry_no}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{r.vehicle_no}</div>
                        </td>

                        <td className="px-4 py-3">{r.warehouse}</td>
                        <td className="px-4 py-3">{r.inward_source}</td>

                        <td className="px-4 py-3">
                          {r.po_nos.length ? (
                            <div className="flex flex-wrap gap-1">
                              {r.po_nos.slice(0, 2).map((p) => (
                                <span
                                  key={p}
                                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200"
                                >
                                  {p}
                                </span>
                              ))}
                              {r.po_nos.length > 2 && (
                                <span className="text-xs text-gray-500 dark:text-gray-300">+{r.po_nos.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">{r.vendor_name || "-"}</td>
                        <td className="px-4 py-3">{r.shipments}</td>
                        <td className="px-4 py-3">{r.assigned_receivers}</td>
                        <td className="px-4 py-3">{r.total_items}</td>

                        <td className="px-4 py-3 font-semibold">{r.expected_total_qty}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-blue-700">{r.live_mobile_qty}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{r.final_received_qty}</td>

                        <td className="px-4 py-3">
                          <span className={qcBadge(r.qc_required_lines, r.qc_status)}>
                            {r.qc_required_lines > 0 ? `QC: ${r.qc_status}` : "QC: Not required"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={giStatusBadge(r.gi_status)}>{r.gi_status}</span>
                          {r.gi_status === "Converted to GRN" && r.converted_grn_no && (
                            <div className="mt-1 text-xs text-purple-700">{r.converted_grn_no}</div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-600 dark:text-gray-300">{r.last_updated}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className={outlineBtn} onClick={() => onView(r)}>
                              View
                            </button>

                            <button
                              type="button"
                              className={classNames(primaryBtn, "active:scale-95")}
                              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                              onClick={() => onOpenLive(r)}
                            >
                              Open Live
                            </button>

                            <button type="button" className={outlineBtn} onClick={() => onOpenGRN(r)}>
                              GRN
                            </button>

                            <button
                              type="button"
                              className={classNames(primaryBtn, "active:scale-95")}
                              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                              onClick={() => onCancel(r)}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={16} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No Goods Inward records found for current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filtered.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} records
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={outlineBtn}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={classNames(
                          "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold",
                          page === currentPage ? "text-white" : "border border-gray-200 bg-white text-gray-700"
                        )}
                        style={page === currentPage ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className={outlineBtn}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to table + quick stats + export.
              </div>
            </div>

            {/* Quick Stats */}
            <div className="xl:col-span-3 min-w-0">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white">Quick Stats</h3>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
                </div>

                <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                  <StatRow label="Total GI" value={stats.total} badge="gray" />
                  <StatRow label="Live" value={stats.live} badge="gray" />
                  <StatRow label="Assigned" value={stats.assigned} badge="blue" />
                  <StatRow label="In-Progress" value={stats.inProgress} badge="amber" />
                  <StatRow label="Inwarded" value={stats.inwarded} badge="blue" />
                  <StatRow label="QC Pending" value={stats.qcPending} badge="amber" />
                  <StatRow label="QC Failed" value={stats.qcFailed} badge="red" />
                  <StatRow label="Converted" value={stats.converted} badge="green" />

                  <div className="my-3 border-t dark:border-gray-800" />

                  <StatRow label="Expected Qty (Sum)" value={stats.expQty} badge="blue" />
                  <StatRow label="Live Qty (Sum)" value={stats.liveQty} badge="blue" />
                  <StatRow label="Final Qty (Sum)" value={stats.finalQty} badge="green" />

                  <div className="my-3 border-t dark:border-gray-800" />

                  <StatRow label="Vendors" value={stats.totalVendors} badge="blue" />
                  <StatRow label="Warehouses" value={stats.totalWH} badge="blue" />
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> Live qty = mobile scans. Final qty = supervisor sync / inwarded.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small pieces */
function StatRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: number;
  badge?: "green" | "red" | "amber" | "blue" | "gray";
}) {
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
          badge === "gray" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
          !badge && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
        )}
      >
        {String(value)}
      </span>
    </div>
  );
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}
