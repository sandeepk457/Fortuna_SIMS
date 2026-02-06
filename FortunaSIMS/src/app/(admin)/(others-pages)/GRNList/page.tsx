"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// ✅ Add-on (for navigation to edit PO form)
import { useRouter } from "next/navigation";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type GRNStatus = "Draft" | "QC Pending" | "Posted" | "Rejected";
type TabKey = "all" | "drafts" | "qc" | "posted" | "rejected";

type GRNRow = {
  grn_id: string;
  grn_number: string;
  grn_date: string;

  po_number: string;
  vendor_name: string;
  warehouse: string;

  receipt_type: "Full" | "Partial";
  total_items: number;

  accepted_total_qty: number;
  excess_total_qty: number;

  qc_required: boolean;
  qc_status: "Pending" | "Passed" | "Failed";

  grn_status: GRNStatus;

  created_by: string;
  last_updated: string;

  posting_date?: string;
  rejection_reason?: string;
};

const DEMO_GRNS: GRNRow[] = [
  {
    grn_id: "GRN-UID-001",
    grn_number: "GRN-2026-00011",
    grn_date: "2026-02-05",
    po_number: "PO-2026-00021",
    vendor_name: "Sri Lakshmi Suppliers",
    warehouse: "WH-002",
    receipt_type: "Partial",
    total_items: 2,
    accepted_total_qty: 70,
    excess_total_qty: 20,
    qc_required: true,
    qc_status: "Pending",
    grn_status: "QC Pending",
    created_by: "Warehouse Exec",
    last_updated: "2026-02-05 11:10",
  },
  {
    grn_id: "GRN-UID-002",
    grn_number: "GRN-2026-00012",
    grn_date: "2026-02-06",
    po_number: "PO-2026-00021",
    vendor_name: "Sri Lakshmi Suppliers",
    warehouse: "WH-002",
    receipt_type: "Partial",
    total_items: 2,
    accepted_total_qty: 50,
    excess_total_qty: 0,
    qc_required: true,
    qc_status: "Passed",
    grn_status: "Posted",
    created_by: "Warehouse Exec",
    last_updated: "2026-02-06 17:40",
    posting_date: "2026-02-06",
  },
  {
    grn_id: "GRN-UID-003",
    grn_number: "GRN-2026-00013",
    grn_date: "2026-02-07",
    po_number: "PO-2026-00022",
    vendor_name: "Aparna Packaging",
    warehouse: "WH-001",
    receipt_type: "Full",
    total_items: 1,
    accepted_total_qty: 100,
    excess_total_qty: 0,
    qc_required: false,
    qc_status: "Passed",
    grn_status: "Draft",
    created_by: "Warehouse Exec",
    last_updated: "2026-02-07 10:05",
  },
  {
    grn_id: "GRN-UID-004",
    grn_number: "GRN-2026-00014",
    grn_date: "2026-02-08",
    po_number: "PO-2026-00022",
    vendor_name: "Aparna Packaging",
    warehouse: "WH-001",
    receipt_type: "Partial",
    total_items: 1,
    accepted_total_qty: 0,
    excess_total_qty: 0,
    qc_required: true,
    qc_status: "Failed",
    grn_status: "Rejected",
    created_by: "Warehouse Exec",
    last_updated: "2026-02-08 15:25",
    rejection_reason: "Damaged packaging rolls. Vendor to replace.",
  },
];

/** UI helpers */
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

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function statusBadge(status: GRNStatus) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (status === "Draft")
    return classNames(base, "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200");
  if (status === "QC Pending") return classNames(base, "bg-amber-100 text-amber-800");
  if (status === "Posted") return classNames(base, "bg-green-100 text-green-700");
  return classNames(base, "bg-red-100 text-red-600");
}

function qcBadge(qcRequired: boolean, qcStatus: "Pending" | "Passed" | "Failed") {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (!qcRequired) return classNames(base, "bg-sky-100 text-sky-700");
  if (qcStatus === "Passed") return classNames(base, "bg-green-100 text-green-700");
  if (qcStatus === "Failed") return classNames(base, "bg-red-100 text-red-600");
  return classNames(base, "bg-amber-100 text-amber-800");
}

function tabCount(rows: GRNRow[], tab: TabKey) {
  if (tab === "all") return rows.length;
  if (tab === "drafts") return rows.filter((r) => r.grn_status === "Draft").length;
  if (tab === "qc") return rows.filter((r) => r.grn_status === "QC Pending").length;
  if (tab === "posted") return rows.filter((r) => r.grn_status === "Posted").length;
  return rows.filter((r) => r.grn_status === "Rejected").length;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function GRNListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [rows, setRows] = useState<GRNRow[]>(DEMO_GRNS);

  const [q, setQ] = useState("");
  const [warehouse, setWarehouse] = useState<string>("");
  const [vendor, setVendor] = useState<string>("");

  const [openReject, setOpenReject] = useState<{ open: boolean; grn_id?: string }>({ open: false });
  const [rejectReason, setRejectReason] = useState("");

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "drafts", label: "Drafts" },
    { key: "qc", label: "QC Pending" },
    { key: "posted", label: "Posted" },
    { key: "rejected", label: "Rejected" },
  ];

  const warehouses = useMemo(() => Array.from(new Set(rows.map((r) => r.warehouse))), [rows]);
  const vendors = useMemo(() => Array.from(new Set(rows.map((r) => r.vendor_name))), [rows]);

  const filtered = useMemo(() => {
    let data = [...rows];

    if (activeTab === "drafts") data = data.filter((r) => r.grn_status === "Draft");
    if (activeTab === "qc") data = data.filter((r) => r.grn_status === "QC Pending");
    if (activeTab === "posted") data = data.filter((r) => r.grn_status === "Posted");
    if (activeTab === "rejected") data = data.filter((r) => r.grn_status === "Rejected");

    const term = q.trim().toLowerCase();
    if (term) {
      data = data.filter((r) => {
        const blob = `${r.grn_number} ${r.po_number} ${r.vendor_name} ${r.warehouse} ${r.grn_status}`.toLowerCase();
        return blob.includes(term);
      });
    }

    if (warehouse) data = data.filter((r) => r.warehouse === warehouse);
    if (vendor) data = data.filter((r) => r.vendor_name === vendor);

    data.sort((a, b) => (a.grn_date < b.grn_date ? 1 : -1));
    return data;
  }, [rows, activeTab, q, warehouse, vendor]);

  /** Quick Stats (based on CURRENT filtered list, same like PR list) */
  const stats = useMemo(() => {
    const total = filtered.length;
    const draft = filtered.filter((x) => x.grn_status === "Draft").length;
    const qcPending = filtered.filter((x) => x.grn_status === "QC Pending").length;
    const posted = filtered.filter((x) => x.grn_status === "Posted").length;
    const rejected = filtered.filter((x) => x.grn_status === "Rejected").length;

    const totalAccepted = filtered.reduce((s, x) => s + (Number(x.accepted_total_qty) || 0), 0);
    const totalExcess = filtered.reduce((s, x) => s + (Number(x.excess_total_qty) || 0), 0);

    const postedToday = filtered.filter((x) => x.grn_status === "Posted" && x.posting_date === todayISO()).length;

    const totalVendors = new Set(filtered.map((x) => x.vendor_name)).size;
    const totalWH = new Set(filtered.map((x) => x.warehouse)).size;

    return {
      total,
      draft,
      qcPending,
      posted,
      rejected,
      totalAccepted,
      totalExcess,
      postedToday,
      totalVendors,
      totalWH,
    };
  }, [filtered]);

  /** Export CSV (Excel friendly) */
  const exportToCSV = () => {
    const header = [
      "GRN Number",
      "GRN Date",
      "PO Number",
      "Vendor",
      "Warehouse",
      "Receipt Type",
      "Total Items",
      "Accepted Qty",
      "Excess Qty",
      "QC Required",
      "QC Status",
      "GRN Status",
      "Posted Date",
      "Created By",
      "Last Updated",
      "Rejection Reason",
    ];

    const rowsCsv = filtered.map((r) =>
      [
        r.grn_number,
        r.grn_date,
        r.po_number,
        r.vendor_name,
        r.warehouse,
        r.receipt_type,
        r.total_items,
        r.accepted_total_qty,
        r.excess_total_qty,
        r.qc_required ? "Yes" : "No",
        r.qc_status,
        r.grn_status,
        r.posting_date ?? "",
        r.created_by,
        r.last_updated,
        r.rejection_reason ?? "",
      ]
        .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header.join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "grn-list.csv";
    link.click();
  };

  /** Actions */
  const onView = (r: GRNRow) => alert(`Open GRN view: ${r.grn_number} (demo)`);
  const onEditDraft = (r: GRNRow) => r.grn_status === "Draft" && alert(`Open Draft edit: ${r.grn_number} (demo)`);

  const onDeleteDraft = (r: GRNRow) => {
    if (r.grn_status !== "Draft") return;
    const ok = confirm(`Delete Draft GRN ${r.grn_number}?`);
    if (!ok) return;
    setRows((p) => p.filter((x) => x.grn_id !== r.grn_id));
  };

  const onMarkQCPassedAndPost = (r: GRNRow) => {
    if (r.grn_status !== "QC Pending") return;

    setRows((p) =>
      p.map((x) =>
        x.grn_id === r.grn_id
          ? {
              ...x,
              qc_status: "Passed",
              grn_status: "Posted",
              posting_date: todayISO(),
              last_updated: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
          : x
      )
    );

    alert("QC Passed → GRN Posted (demo).");
  };

  const onOpenReject = (r: GRNRow) => {
    setRejectReason("");
    setOpenReject({ open: true, grn_id: r.grn_id });
  };

  const onConfirmReject = () => {
    if (!openReject.grn_id) return;
    if (!rejectReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }

    setRows((p) =>
      p.map((x) =>
        x.grn_id === openReject.grn_id
          ? {
              ...x,
              grn_status: "Rejected",
              qc_status: x.qc_required ? "Failed" : x.qc_status,
              rejection_reason: rejectReason.trim(),
              last_updated: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
          : x
      )
    );

    setOpenReject({ open: false });
    alert("GRN Rejected (demo).");
  };

  const onClearFilters = () => {
    setQ("");
    setWarehouse("");
    setVendor("");
  };

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Goods Receipt Note (GRN)" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GRN List</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Draft → QC Pending → Posted / Rejected. (Filters apply to stats + export)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
  onClick={() => router.push("/GRN")}
  className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
>
  + Create GRN
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
                  isActive ? "text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
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
                    placeholder="Search GRN / PO / Vendor / WH / Status"
                  />
                </div>

                <div className="lg:col-span-3">
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

                <div className="lg:col-span-3">
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
              </div>

              {/* Table */}
              <div className="mt-6 w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[1350px] w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">GRN</th>
                      <th className="px-4 py-3 text-left">PO</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">WH</th>
                      <th className="px-4 py-3 text-left">Receipt</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-left">Accepted</th>
                      <th className="px-4 py-3 text-left">Excess</th>
                      <th className="px-4 py-3 text-left">QC</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Updated</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {filtered.map((r) => (
                      <tr
                        key={r.grn_id}
                        className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white">{r.grn_number}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{r.grn_date}</div>
                        </td>

                        <td className="px-4 py-3">{r.po_number}</td>
                        <td className="px-4 py-3">{r.vendor_name}</td>
                        <td className="px-4 py-3">{r.warehouse}</td>
                        <td className="px-4 py-3">{r.receipt_type}</td>
                        <td className="px-4 py-3">{r.total_items}</td>

                        <td className="px-4 py-3 font-semibold">{r.accepted_total_qty}</td>

                        <td className="px-4 py-3">
                          <span className={classNames("font-semibold", r.excess_total_qty > 0 ? "text-amber-700" : "")}>
                            {r.excess_total_qty}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={qcBadge(r.qc_required, r.qc_status)}>
                            {r.qc_required ? `QC: ${r.qc_status}` : "QC: Not required"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={statusBadge(r.grn_status)}>{r.grn_status}</span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-600 dark:text-gray-300">{r.last_updated}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className={outlineBtn} onClick={() => onView(r)}>
                              View
                            </button>

                            {r.grn_status === "Draft" && (
                              <>
                                <button
                                  type="button"
                                  className={classNames(primaryBtn, "active:scale-95")}
                                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                                  onClick={() => onEditDraft(r)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={classNames(primaryBtn, "active:scale-95")}
                                  style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                                  onClick={() => onDeleteDraft(r)}
                                >
                                  Delete
                                </button>
                              </>
                            )}

                            {r.grn_status === "QC Pending" && (
                              <>
                                <button
                                  type="button"
                                  className={classNames(primaryBtn, "active:scale-95")}
                                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                                  onClick={() => onMarkQCPassedAndPost(r)}
                                >
                                  QC Pass & Post
                                </button>

                                <button
                                  type="button"
                                  className={classNames(primaryBtn, "active:scale-95")}
                                  style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                                  onClick={() => onOpenReject(r)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>

                          {r.grn_status === "Rejected" && r.rejection_reason && (
                            <div className="mt-2 max-w-[360px] text-xs text-red-600 whitespace-normal">
                              Reason: {r.rejection_reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No GRNs found for current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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
                  <StatRow label="Total GRNs" value={stats.total} badge="gray" />
                  <StatRow label="Draft" value={stats.draft} badge="gray" />
                  <StatRow label="QC Pending" value={stats.qcPending} badge="amber" />
                  <StatRow label="Posted" value={stats.posted} badge="green" />
                  <StatRow label="Rejected" value={stats.rejected} badge="red" />

                  <div className="my-3 border-t dark:border-gray-800" />

                  <StatRow label="Accepted Qty (Sum)" value={stats.totalAccepted} badge="blue" />
                  <StatRow label="Excess Qty (Sum)" value={stats.totalExcess} badge="amber" />
                  <StatRow label="Posted Today" value={stats.postedToday} badge="green" />

                  <div className="my-3 border-t dark:border-gray-800" />

                  <StatRow label="Vendors" value={stats.totalVendors} badge="blue" />
                  <StatRow label="Warehouses" value={stats.totalWH} badge="blue" />
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> Excess qty helps track quarantine/RTV decisions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {openReject.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject GRN</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Reason is mandatory.</p>

            <div className="mt-4">
              <label className={labelBase}>
                Rejection Reason <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className={classNames(inputBase, "min-h-[120px] resize-y")}
                placeholder="Example: Damaged goods / failed QC / mismatch..."
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={outlineBtn}
                onClick={() => {
                  setOpenReject({ open: false });
                  setRejectReason("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className={classNames(primaryBtn, "active:scale-95")}
                style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                onClick={onConfirmReject}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
