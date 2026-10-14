"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  ClipboardList,
  CheckCircle2,
  Filter,
  X,
  MoreHorizontal,
  CalendarDays,
  Boxes,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type OutwardStatus =
  | "Draft"
  | "Ready for Picking"
  | "Picking In Progress"
  | "Ready for Issue"
  | "Issued"
  | "Partially Dispatched"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

type Outward = {
  id: string;
  outwardNo: string;
  salesOrderNo: string;
  customer: string;
  warehouse: string;
  outwardDate: string;
  status: OutwardStatus;
  itemLines: number;
  plannedQty: number;
  issuedQty: number;
  dispatchedQty: number;
  priority: "Normal" | "High" | "Urgent";
  createdBy: string;
};

const INITIAL_DATA: Outward[] = [
  {
    id: "GO-1006",
    outwardNo: "GO-2026-0106",
    salesOrderNo: "SO-2026-0142",
    customer: "Sri Lakshmi Electronics",
    warehouse: "Vizag Central Warehouse",
    outwardDate: "2026-10-11",
    status: "Ready for Picking",
    itemLines: 4,
    plannedQty: 86,
    issuedQty: 0,
    dispatchedQty: 0,
    priority: "High",
    createdBy: "Sandeep K",
  },
  {
    id: "GO-1005",
    outwardNo: "GO-2026-0105",
    salesOrderNo: "SO-2026-0139",
    customer: "Coastal Digital Stores",
    warehouse: "Gajuwaka Warehouse",
    outwardDate: "2026-10-10",
    status: "Picking In Progress",
    itemLines: 3,
    plannedQty: 42,
    issuedQty: 0,
    dispatchedQty: 0,
    priority: "Normal",
    createdBy: "Inventory Admin",
  },
  {
    id: "GO-1004",
    outwardNo: "GO-2026-0104",
    salesOrderNo: "SO-2026-0134",
    customer: "Vijaya Home Appliances",
    warehouse: "Vizag Central Warehouse",
    outwardDate: "2026-10-09",
    status: "Ready for Issue",
    itemLines: 6,
    plannedQty: 115,
    issuedQty: 115,
    dispatchedQty: 0,
    priority: "Urgent",
    createdBy: "Warehouse Lead",
  },
  {
    id: "GO-1003",
    outwardNo: "GO-2026-0103",
    salesOrderNo: "SO-2026-0128",
    customer: "Sri Lakshmi Electronics",
    warehouse: "Madhurawada Warehouse",
    outwardDate: "2026-10-08",
    status: "Dispatched",
    itemLines: 2,
    plannedQty: 24,
    issuedQty: 24,
    dispatchedQty: 24,
    priority: "Normal",
    createdBy: "Inventory Admin",
  },
  {
    id: "GO-1002",
    outwardNo: "GO-2026-0102",
    salesOrderNo: "SO-2026-0122",
    customer: "Tech Point Retail",
    warehouse: "Gajuwaka Warehouse",
    outwardDate: "2026-10-07",
    status: "Partially Dispatched",
    itemLines: 5,
    plannedQty: 70,
    issuedQty: 70,
    dispatchedQty: 46,
    priority: "High",
    createdBy: "Warehouse Lead",
  },
  {
    id: "GO-1001",
    outwardNo: "GO-2026-0101",
    salesOrderNo: "SO-2026-0116",
    customer: "Coastal Digital Stores",
    warehouse: "Vizag Central Warehouse",
    outwardDate: "2026-10-05",
    status: "Delivered",
    itemLines: 3,
    plannedQty: 36,
    issuedQty: 36,
    dispatchedQty: 36,
    priority: "Normal",
    createdBy: "Sandeep K",
  },
  {
    id: "GO-1000",
    outwardNo: "GO-2026-0100",
    salesOrderNo: "SO-2026-0110",
    customer: "Smart World Electronics",
    warehouse: "Madhurawada Warehouse",
    outwardDate: "2026-10-04",
    status: "Draft",
    itemLines: 2,
    plannedQty: 18,
    issuedQty: 0,
    dispatchedQty: 0,
    priority: "Normal",
    createdBy: "Inventory Admin",
  },
  {
    id: "GO-0999",
    outwardNo: "GO-2026-0099",
    salesOrderNo: "SO-2026-0102",
    customer: "Vijaya Home Appliances",
    warehouse: "Vizag Central Warehouse",
    outwardDate: "2026-10-02",
    status: "Cancelled",
    itemLines: 1,
    plannedQty: 8,
    issuedQty: 0,
    dispatchedQty: 0,
    priority: "Normal",
    createdBy: "Warehouse Lead",
  },
];

const STATUS_OPTIONS: OutwardStatus[] = [
  "Draft",
  "Ready for Picking",
  "Picking In Progress",
  "Ready for Issue",
  "Issued",
  "Partially Dispatched",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

const STATUS_CLASSES: Record<OutwardStatus, string> = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "Ready for Picking":
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Picking In Progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Ready for Issue":
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Issued: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  "Partially Dispatched":
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  Dispatched:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  Delivered:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: OutwardStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASSES[status]}`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 text-white shadow-sm transition duration-200 hover:-translate-y-1"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/90">{title}</p>
          <p className="mt-3 text-3xl font-extrabold">{value}</p>
          <p className="mt-2 text-xs text-white/80">{subtitle}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function GoodsOutwardListPage() {
  const [rows, setRows] = useState<Outward[]>(INITIAL_DATA);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeCancelled, setIncludeCancelled] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedRow, setSelectedRow] = useState<Outward | null>(null);
  const [actionRowId, setActionRowId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const warehouses = useMemo(
    () => [...new Set(rows.map((row) => row.warehouse))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [
          row.outwardNo,
          row.salesOrderNo,
          row.customer,
          row.warehouse,
          row.status,
          row.createdBy,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All Statuses" || row.status === statusFilter;

      const matchesWarehouse =
        warehouseFilter === "All Warehouses" ||
        row.warehouse === warehouseFilter;

      const matchesFrom = !dateFrom || row.outwardDate >= dateFrom;
      const matchesTo = !dateTo || row.outwardDate <= dateTo;

      const matchesCancelled =
        includeCancelled || row.status !== "Cancelled";

      return (
        matchesSearch &&
        matchesStatus &&
        matchesWarehouse &&
        matchesFrom &&
        matchesTo &&
        matchesCancelled
      );
    });
  }, [
    rows,
    search,
    statusFilter,
    warehouseFilter,
    dateFrom,
    dateTo,
    includeCancelled,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const countStatus = (statuses: OutwardStatus[]) =>
    rows.filter((row) => statuses.includes(row.status)).length;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
    setWarehouseFilter("All Warehouses");
    setDateFrom("");
    setDateTo("");
    setIncludeCancelled(true);
    setPage(1);
  };

  const handleStatusChange = (id: string, status: OutwardStatus) => {
    setRows((previousRows) =>
      previousRows.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, status };

        // Demo UI only. This does not update real inventory stock.
        if (["Issued", "Dispatched", "Delivered"].includes(status)) {
          updatedRow.issuedQty = row.plannedQty;
        }

        if (["Dispatched", "Delivered"].includes(status)) {
          updatedRow.dispatchedQty = row.plannedQty;
        }

        return updatedRow;
      })
    );

    setNotice(
      `${id}: status changed to ${status} in demo mode. No inventory stock was changed.`
    );

    setActionRowId(null);
    setSelectedRow(null);
  };

  const exportCsv = () => {
    const headers = [
      "Outward Number",
      "Sales Order",
      "Customer",
      "Warehouse",
      "Date",
      "Status",
      "Item Lines",
      "Planned Qty",
      "Issued Qty",
      "Dispatched Qty",
      "Priority",
      "Created By",
    ];

    const csvRows = filteredRows.map((row) => [
      row.outwardNo,
      row.salesOrderNo,
      row.customer,
      row.warehouse,
      row.outwardDate,
      row.status,
      row.itemLines,
      row.plannedQty,
      row.issuedQty,
      row.dispatchedQty,
      row.priority,
      row.createdBy,
    ]);

    const csv = [headers, ...csvRows]
      .map((line) =>
        line
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `fortuna-goods-outward-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const resetDemo = () => {
    setRows(INITIAL_DATA);
    resetFilters();
    setNotice("Goods Outward demo records have been reset.");
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "All Statuses" ||
    warehouseFilter !== "All Warehouses" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    !includeCancelled;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 text-gray-800 dark:bg-gray-950 dark:text-gray-100 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>Inventory &amp; WMS</span>
            <ArrowRight size={14} />
            <span>Goods Outward</span>
          </div>

          <h1
            className="text-2xl font-extrabold sm:text-3xl"
            style={{ color: FORTUNA_PRIMARY_RED }}
          >
            Goods Outward
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage sales order fulfilment, picking, goods issue, dispatch and
            delivery.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            Reset Demo
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <Download size={16} />
            Export CSV
          </button>

          <Link
            href="/goods-outward/create"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110"
            style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
          >
            <Plus size={18} />
            Create Outward
          </Link>
        </div>
      </div>

      {/* Notification */}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={17} />
            {notice}
          </div>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Close notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Outward"
          value={rows.filter((r) => r.status !== "Cancelled").length}
          subtitle="Active outward documents"
          icon={<ClipboardList size={24} />}
          color={FORTUNA_SECONDARY_BLUE}
        />

        <KpiCard
          title="Pending Picking"
          value={countStatus(["Ready for Picking", "Picking In Progress"])}
          subtitle="Awaiting pick completion"
          icon={<Package size={24} />}
          color={FORTUNA_PRIMARY_RED}
        />

        <KpiCard
          title="Ready for Issue"
          value={countStatus(["Ready for Issue"])}
          subtitle="Awaiting goods issue"
          icon={<Boxes size={24} />}
          color="#168FA3"
        />

        <KpiCard
          title="Dispatched / Delivered"
          value={countStatus([
            "Dispatched",
            "Partially Dispatched",
            "Delivered",
          ])}
          subtitle="Outbound delivery progress"
          icon={<Truck size={24} />}
          color="#374151"
        />
      </section>

      {/* Workflow */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white">
            Outward Workflow
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Follow the outward document through each operational stage.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Create", icon: <Plus size={17} /> },
            { label: "Pick & Pack", icon: <Package size={17} /> },
            { label: "Ready for Issue", icon: <ClipboardList size={17} /> },
            { label: "Goods Issue", icon: <Boxes size={17} /> },
            { label: "Dispatch", icon: <Truck size={17} /> },
            { label: "Delivered", icon: <CheckCircle2 size={17} /> },
          ].map((step, index) => (
            <div
              key={step.label}
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                style={{
                  backgroundColor:
                    index % 2 === 0
                      ? FORTUNA_PRIMARY_RED
                      : FORTUNA_SECONDARY_BLUE,
                }}
              >
                {step.icon}
              </div>

              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Register */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-800 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
              Goods Outward Register
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {filteredRows.length} records found
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search outward, SO, customer..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold ${
                showFilters || hasActiveFilters
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 border-b border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950 sm:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2 text-xs font-semibold">
              Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal dark:border-gray-700 dark:bg-gray-900"
              >
                <option>All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-semibold">
              Warehouse
              <select
                value={warehouseFilter}
                onChange={(event) => {
                  setWarehouseFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal dark:border-gray-700 dark:bg-gray-900"
              >
                <option>All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-semibold">
              From Date
              <span className="relative block">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-2 text-sm font-normal dark:border-gray-700 dark:bg-gray-900"
                />
              </span>
            </label>

            <label className="space-y-2 text-xs font-semibold">
              To Date
              <span className="relative block">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-2 text-sm font-normal dark:border-gray-700 dark:bg-gray-900"
                />
              </span>
            </label>

            <div className="flex flex-col justify-end gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-xs dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="checkbox"
                  checked={includeCancelled}
                  onChange={(event) => {
                    setIncludeCancelled(event.target.checked);
                    setPage(1);
                  }}
                  className="accent-red-700"
                />
                Include cancelled
              </label>

              <button
                type="button"
                onClick={resetFilters}
                className="text-left text-xs font-bold text-red-700 hover:underline dark:text-red-300"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left">
            <thead>
              <tr style={{ backgroundColor: FORTUNA_PRIMARY_RED }}>
                {[
                  "Outward / Date",
                  "Sales Order",
                  "Customer",
                  "Warehouse",
                  "Quantities",
                  "Status",
                  "Priority",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wide text-white"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {row.outwardNo}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(row.outwardDate)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <Link
                      href={`/sales-orderform?order_id=${encodeURIComponent(
                        row.salesOrderNo
                      )}`}
                      className="font-bold hover:underline"
                      style={{ color: FORTUNA_SECONDARY_BLUE }}
                    >
                      {row.salesOrderNo}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {row.itemLines} item lines
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="max-w-[200px] truncate text-sm font-semibold">
                      {row.customer}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      By {row.createdBy}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {row.warehouse}
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm font-bold">
                      {row.plannedQty} planned
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {row.issuedQty} issued · {row.dispatchedQty} dispatched
                    </p>

                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${
                            row.plannedQty
                              ? Math.min(
                                  100,
                                  (row.dispatchedQty / row.plannedQty) * 100
                                )
                              : 0
                          }%`,
                          backgroundColor: FORTUNA_SECONDARY_BLUE,
                        }}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={row.status} />
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        row.priority === "Urgent"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : row.priority === "High"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {row.priority}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="View details"
                        onClick={() => setSelectedRow(row)}
                        className="rounded-lg border border-gray-200 p-2 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950"
                      >
                        <Eye size={16} />
                      </button>

                      {row.status === "Draft" && (
                        <Link
                          href={`/goods-outward/create?outwardId=${encodeURIComponent(
                            row.id
                          )}`}
                          title="Edit draft"
                          className="rounded-lg border border-gray-200 p-2 hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
                        >
                          <Pencil size={16} />
                        </Link>
                      )}

                      {row.status !== "Cancelled" &&
                        row.status !== "Delivered" && (
                          <div className="relative">
                            <button
                              type="button"
                              title="More actions"
                              onClick={() =>
                                setActionRowId(
                                  actionRowId === row.id ? null : row.id
                                )
                              }
                              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {actionRowId === row.id && (
                              <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                {row.status === "Ready for Picking" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        row.id,
                                        "Picking In Progress"
                                      )
                                    }
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    Start Picking (Demo)
                                  </button>
                                )}

                                {row.status === "Picking In Progress" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        row.id,
                                        "Ready for Issue"
                                      )
                                    }
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    Mark Ready for Issue (Demo)
                                  </button>
                                )}

                                {row.status === "Ready for Issue" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(row.id, "Issued")
                                    }
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    Mark Issued (Demo)
                                  </button>
                                )}

                                {row.status === "Issued" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(row.id, "Dispatched")
                                    }
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    Mark Dispatched (Demo)
                                  </button>
                                )}

                                {(row.status === "Dispatched" ||
                                  row.status === "Partially Dispatched") && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(row.id, "Delivered")
                                    }
                                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    Mark Delivered (Demo)
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    handleStatusChange(row.id, "Cancelled")
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                                >
                                  Cancel Outward (Demo)
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </td>
                </tr>
              ))}

              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Search
                      size={30}
                      className="mx-auto text-gray-400"
                    />
                    <p className="mt-3 font-bold">No records found</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Change your search or filter criteria.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 text-sm font-bold text-red-700 hover:underline"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col justify-between gap-4 border-t border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page</span>

            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <span>· {filteredRows.length} records</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronLeft size={17} />
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="rounded-lg border border-gray-200 p-2 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Demo disclaimer */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
        <p>
          <strong>Demo Mode:</strong> This page currently uses sample data.
          Status actions only change the local UI. They do not update the
          backend or inventory. Actual stock deduction must happen only after
          successful Goods Issue confirmation through the backend.
        </p>
      </div>

      {/* View Details Modal */}
      {selectedRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRow(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-gray-800">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Goods Outward Details
                </p>

                <h2
                  className="mt-2 text-xl font-extrabold"
                  style={{ color: FORTUNA_PRIMARY_RED }}
                >
                  {selectedRow.outwardNo}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Sales Order: {selectedRow.salesOrderNo}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                aria-label="Close details"
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              {[
                ["Customer", selectedRow.customer],
                ["Warehouse", selectedRow.warehouse],
                ["Outward Date", formatDate(selectedRow.outwardDate)],
                ["Status", selectedRow.status],
                ["Item Lines", String(selectedRow.itemLines)],
                ["Priority", selectedRow.priority],
                ["Planned Quantity", String(selectedRow.plannedQty)],
                ["Issued Quantity", String(selectedRow.issuedQty)],
                ["Dispatched Quantity", String(selectedRow.dispatchedQty)],
                ["Created By", selectedRow.createdBy],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"
                >
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
              {selectedRow.status === "Draft" && (
                <Link
                  href={`/goods-outward/create?outwardId=${encodeURIComponent(
                    selectedRow.id
                  )}`}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
                  style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                >
                  <Pencil size={15} />
                  Edit Draft
                </Link>
              )}

              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold dark:border-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}