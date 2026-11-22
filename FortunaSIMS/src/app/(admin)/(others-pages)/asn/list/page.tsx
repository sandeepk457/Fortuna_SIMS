"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/* =========================================================
   FORTUNA THEME COLORS
========================================================= */

const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/* =========================================================
   FORTUNA GRADIENTS
========================================================= */

const FORTUNA_GRADIENT = `linear-gradient(
  135deg,
  ${FORTUNA_PRIMARY_RED} 0%,
  ${FORTUNA_SECONDARY_BLUE} 100%
)`;

const FORTUNA_BLUE_GRADIENT = `linear-gradient(
  135deg,
  ${FORTUNA_SECONDARY_BLUE} 0%,
  #0077B8 100%
)`;

const FORTUNA_RED_GRADIENT = `linear-gradient(
  135deg,
  ${FORTUNA_PRIMARY_RED} 0%,
  #E21D45 100%
)`;

/* =========================================================
   TYPES
========================================================= */

type ASNStatus =
  | "Draft"
  | "Submitted"
  | "In Transit"
  | "Arrived"
  | "Partially Received"
  | "Fully Received"
  | "Closed";

type ASNRow = {
  asn_id: string;
  asn_number: string;
  asn_date: string;
  po_number: string;
  vendor_name: string;
  warehouse: string;
  shipment_date: string;
  expected_arrival: string;
  total_items: number;
  total_qty: number;
  status: ASNStatus;
  transporter: string;
  vehicle_number: string;
};

/* =========================================================
   DEMO ASN DATA
========================================================= */

const DEMO_ASNS: ASNRow[] = [
  {
    asn_id: "ASN-ID-001",
    asn_number: "ASN-2026-00001",
    asn_date: "2026-10-03",
    po_number: "PO-2026-00121",
    vendor_name: "Sri Lakshmi Suppliers",
    warehouse: "Vizag Central WH",
    shipment_date: "2026-10-04",
    expected_arrival: "2026-10-07",
    total_items: 2,
    total_qty: 220,
    status: "In Transit",
    transporter: "ABC Logistics",
    vehicle_number: "AP31AB1234",
  },
  {
    asn_id: "ASN-ID-002",
    asn_number: "ASN-2026-00002",
    asn_date: "2026-10-02",
    po_number: "PO-2026-00118",
    vendor_name: "Aparna Packaging",
    warehouse: "Hyderabad WH",
    shipment_date: "2026-10-03",
    expected_arrival: "2026-10-06",
    total_items: 1,
    total_qty: 50,
    status: "Arrived",
    transporter: "FastTrack Transport",
    vehicle_number: "TS09XY8899",
  },
  {
    asn_id: "ASN-ID-003",
    asn_number: "ASN-2026-00003",
    asn_date: "2026-10-01",
    po_number: "PO-2026-00110",
    vendor_name: "Sri Lakshmi Suppliers",
    warehouse: "Vizag Central WH",
    shipment_date: "2026-10-02",
    expected_arrival: "2026-10-05",
    total_items: 3,
    total_qty: 350,
    status: "Fully Received",
    transporter: "ABC Logistics",
    vehicle_number: "AP31CD4567",
  },
  {
    asn_id: "ASN-ID-004",
    asn_number: "ASN-2026-00004",
    asn_date: "2026-10-05",
    po_number: "PO-2026-00130",
    vendor_name: "Aparna Packaging",
    warehouse: "Chennai WH",
    shipment_date: "2026-10-06",
    expected_arrival: "2026-10-10",
    total_items: 2,
    total_qty: 150,
    status: "Draft",
    transporter: "",
    vehicle_number: "",
  },
  {
    asn_id: "ASN-ID-005",
    asn_number: "ASN-2026-00005",
    asn_date: "2026-09-28",
    po_number: "PO-2026-00098",
    vendor_name: "Sri Lakshmi Suppliers",
    warehouse: "Vizag Central WH",
    shipment_date: "2026-09-29",
    expected_arrival: "2026-10-01",
    total_items: 2,
    total_qty: 120,
    status: "Partially Received",
    transporter: "SouthLine Cargo",
    vehicle_number: "AP31EF7788",
  },
];

/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS: Array<"All" | ASNStatus> = [
  "All",
  "Draft",
  "Submitted",
  "In Transit",
  "Arrived",
  "Partially Received",
  "Fully Received",
  "Closed",
];

/* =========================================================
   INPUT STYLE
========================================================= */

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm transition-all focus:outline-none " +
  "focus:ring-2 focus:ring-[#005F99]/10 focus:border-[#005F99] " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

/* =========================================================
   HELPERS
========================================================= */

function classNames(
  ...v: Array<string | false | undefined | null>
) {
  return v.filter(Boolean).join(" ");
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* =========================================================
   STATUS PILL
========================================================= */

function statusPill(status: ASNStatus) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

  switch (status) {
    case "Draft":
      return classNames(
        base,
        "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
      );

    case "Submitted":
      return classNames(
        base,
        "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
      );

    case "In Transit":
      return classNames(
        base,
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
      );

    case "Arrived":
      return classNames(
        base,
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
      );

    case "Partially Received":
      return classNames(
        base,
        "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
      );

    case "Fully Received":
      return classNames(
        base,
        "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
      );

    case "Closed":
      return classNames(
        base,
        "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"
      );

    default:
      return base;
  }
}

/* =========================================================
   MAIN PAGE
========================================================= */

// NEXT_PUBLIC_API_URL must point to the backend API root, e.g. http://localhost:5000/api
const RAW_API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
const ASN_API_BASE = RAW_API_BASE
  ? (RAW_API_BASE.endsWith("/api") ? RAW_API_BASE : `${RAW_API_BASE}/api`)
  : "";

async function asnApi(path: string, init?: RequestInit) {
  if (!ASN_API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is missing. Set it to your backend URL ending in /api, then restart the frontend.");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${ASN_API_BASE}/asn${normalizedPath}`;
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(body.message || `ASN API request failed (${response.status}) at ${url}`);
  }
  return body;
}

export default function ASNListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ASNRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const loadASNs = async () => {
    setLoading(true); setApiError("");
    try {
      const body = await asnApi("?page=1&limit=100");
      const records = Array.isArray(body.data) ? body.data
        : Array.isArray(body.rows) ? body.rows
        : Array.isArray(body.asns) ? body.asns
        : Array.isArray(body.data?.rows) ? body.data.rows
        : Array.isArray(body.data?.asns) ? body.data.asns
        : Array.isArray(body.data?.records) ? body.data.records
        : [];
      setRows(records.map((a: any) => ({
        asn_id: String(a.id ?? a.asn_id ?? ""),
        asn_number: a.asn_number || a.asn_id || "—",
        asn_date: a.asn_date || "",
        po_number: a.po_number || "",
        vendor_name: a.vendor_name || "",
        warehouse: a.warehouse_name || "",
        shipment_date: a.shipment_date || "",
        expected_arrival: a.expected_arrival || "",
        total_items: Number(a.item_count ?? a.total_items ?? 0),
        total_qty: Number(a.total_shipping_qty ?? a.total_qty ?? 0),
        status: a.status || "Draft",
        transporter: a.transporter || "",
        vehicle_number: a.vehicle_number || "",
      })));
    } catch (error: any) { setApiError(error.message || "Unable to load ASNs."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadASNs(); }, []);

  const deleteASN = async (row: ASNRow) => {
    if (row.status !== "Draft") return;
    if (!window.confirm(`Delete draft ${row.asn_number}? This cannot be undone.`)) return;
    try { await asnApi(`/${encodeURIComponent(row.asn_id)}`, { method: "DELETE" }); await loadASNs(); }
    catch (error: any) { alert(error.message || "Unable to delete ASN."); }
  };

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<"All" | ASNStatus>("All");
  const [warehouse, setWarehouse] = useState("All");
  const [vendor, setVendor] = useState("All");

  /* =======================================================
     MODAL
  ======================================================= */

  const [selectedASN, setSelectedASN] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const openASNDetails = (row: ASNRow) => {
  router.push(`/asn/create?asn_id=${encodeURIComponent(row.asn_id)}&view=1`);
};
  /* =======================================================
     PAGINATION
  ======================================================= */

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  /* =======================================================
     DROPDOWNS
  ======================================================= */

  const warehouses = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(rows.map((x) => x.warehouse))
      ),
    ],
    [rows]
  );

  const vendors = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(rows.map((x) => x.vendor_name))
      ),
    ],
    [rows]
  );

  /* =======================================================
     FILTERED ROWS
  ======================================================= */

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.asn_number.toLowerCase().includes(q) ||
        row.po_number.toLowerCase().includes(q) ||
        row.vendor_name.toLowerCase().includes(q) ||
        row.warehouse.toLowerCase().includes(q) ||
        row.vehicle_number.toLowerCase().includes(q);

      const matchesStatus =
        status === "All" || row.status === status;

      const matchesWarehouse =
        warehouse === "All" ||
        row.warehouse === warehouse;

      const matchesVendor =
        vendor === "All" ||
        row.vendor_name === vendor;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesWarehouse &&
        matchesVendor
      );
    });
  }, [
    rows,
    search,
    status,
    warehouse,
    vendor,
  ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    return {
      total: rows.length,

      draft: rows.filter(
        (x) => x.status === "Draft"
      ).length,

      submitted: rows.filter(
        (x) => x.status === "Submitted"
      ).length,

      inTransit: rows.filter(
        (x) => x.status === "In Transit"
      ).length,

      received: rows.filter(
        (x) =>
          x.status === "Partially Received" ||
          x.status === "Fully Received"
      ).length,
    };
  }, [rows]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length / pageSize
    )
  );

  const paginatedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    const endIndex =
      startIndex + pageSize;

    return filteredRows.slice(
      startIndex,
      endIndex
    );
  }, [
    filteredRows,
    currentPage,
    pageSize,
  ]);

  const pageStart =
    filteredRows.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const pageEnd = Math.min(
    currentPage * pageSize,
    filteredRows.length
  );

  /* =======================================================
     RESET PAGINATION
  ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    status,
    warehouse,
    vendor,
    pageSize,
  ]);

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setWarehouse("All");
    setVendor("All");
    setCurrentPage(1);
  };

  /* =======================================================
     EXPORT ASN DATA (EXCEL-COMPATIBLE CSV)
  ======================================================= */

  const exportToExcel = () => {
    const header = ["ASN Number", "ASN Date", "PO Number", "Vendor", "Warehouse", "Shipment Date", "Expected Arrival", "Total Items", "Total Quantity", "Status", "Transporter", "Vehicle Number"];
    const csvRows = filteredRows.map((asn) => [
      asn.asn_number, asn.asn_date, asn.po_number, asn.vendor_name, asn.warehouse,
      asn.shipment_date, asn.expected_arrival, asn.total_items, asn.total_qty,
      asn.status, asn.transporter, asn.vehicle_number,
    ].map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","));
    const csvContent = [header.map((value) => `"${value}"`).join(","), ...csvRows].join("\r\n");
    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fortuna-asn-list.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* =======================================================
     PAGE NUMBERS
  ======================================================= */

  const getPageNumbers = () => {
    const pages: Array<number | "ellipsis"> = [];

    if (totalPages <= 7) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);

    return pages;
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">

      {/* ===================================================
          BREADCRUMB
      =================================================== */}

      <PageBreadcrumb
        pageTitle="Advance Shipping Notice (ASN)"
      />

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-3">

              <div
                className="h-8 w-1 rounded-full"
                style={{
                  backgroundColor:
                    FORTUNA_PRIMARY_RED,
                }}
              />

              <h3
                className="text-lg font-bold"
                style={{
                  color:
                    FORTUNA_PRIMARY_RED,
                }}
              >
                ASN List
              </h3>

              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor:
                    `${FORTUNA_SECONDARY_BLUE}10`,
                  color:
                    FORTUNA_SECONDARY_BLUE,
                }}
              >
                Supplier Shipment Notice
              </span>

            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Track supplier shipment notifications linked to Purchase Orders.
            </p>

          </div>

          {/* HEADER ACTIONS */}

          <div className="flex flex-wrap gap-2">

            {/* EXPORT EXCEL */}
            <button
              type="button"
              onClick={exportToExcel}
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: FORTUNA_SECONDARY_BLUE, color: FORTUNA_SECONDARY_BLUE, background: `linear-gradient(135deg, ${FORTUNA_SECONDARY_BLUE}08 0%, ${FORTUNA_SECONDARY_BLUE}15 100%)` }}
            >
              Export Excel
            </button>


            {/* CLEAR FILTERS */}

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                borderColor:
                  FORTUNA_SECONDARY_BLUE,
                color:
                  FORTUNA_SECONDARY_BLUE,
                background: `linear-gradient(
                  135deg,
                  ${FORTUNA_SECONDARY_BLUE}08 0%,
                  ${FORTUNA_SECONDARY_BLUE}15 100%
                )`,
              }}
            >
              Clear Filters
            </button>

            {/* CREATE ASN */}

            <Link
              href="/asn/create"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background:
                  FORTUNA_GRADIENT,
              }}
            >
              + Create ASN
            </Link>

          </div>

        </div>
      </div>

      {/* ===================================================
          KPI CARDS
      =================================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <SummaryCard
          label="Total ASN"
          value={summary.total}
          accent={
            FORTUNA_SECONDARY_BLUE
          }
          icon="ASN"
        />

        <SummaryCard
          label="Draft"
          value={summary.draft}
          accent={
            FORTUNA_PRIMARY_RED
          }
          icon="DR"
        />

        <SummaryCard
          label="Submitted"
          value={summary.submitted}
          accent={
            FORTUNA_SECONDARY_BLUE
          }
          icon="SB"
        />

        <SummaryCard
          label="In Transit"
          value={summary.inTransit}
          accent={
            FORTUNA_PRIMARY_RED
          }
          icon="IT"
        />

        <SummaryCard
          label="Receiving"
          value={summary.received}
          accent={
            FORTUNA_SECONDARY_BLUE
          }
          icon="RC"
        />

      </div>

      {/* MAIN CONTENT + RIGHT QUICK STATS LAYOUT */}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px] xl:items-start">
        <div className="min-w-0 space-y-6">

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-4">

          {/* SEARCH */}

          <div className="min-w-0 lg:col-span-2">

            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Search
            </label>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search ASN, PO, vendor, warehouse, vehicle..."
              className={inputBase}
            />

          </div>

          {/* STATUS */}

          <div className="min-w-0">

            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as
                    | "All"
                    | ASNStatus
                )
              }
              className={inputBase}
            >
              {STATUS_OPTIONS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

          </div>

          {/* WAREHOUSE */}

          <div className="min-w-0">

            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Warehouse
            </label>

            <select
              value={warehouse}
              onChange={(e) =>
                setWarehouse(
                  e.target.value
                )
              }
              className={inputBase}
            >
              {warehouses.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

          </div>

        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">

          {/* VENDOR */}

          <div className="min-w-0">

            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Vendor
            </label>

            <select
              value={vendor}
              onChange={(e) =>
                setVendor(
                  e.target.value
                )
              }
              className={inputBase}
            >
              {vendors.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

          </div>

          {/* SHOWING */}

          <div className="flex min-w-0 items-end">

            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">

              Showing{" "}

              <span
                className="font-bold"
                style={{
                  color:
                    FORTUNA_PRIMARY_RED,
                }}
              >
                {filteredRows.length}
              </span>

              {" "}of{" "}

              <span className="font-bold text-gray-900 dark:text-white">
                {rows.length}
              </span>

              {" "}ASN records

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================
          ASN TABLE
      =================================================== */}

      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        {/* TABLE SECTION HEADER */}

        <div
          className="border-b px-5 py-4"
          style={{
            borderColor:
              `${FORTUNA_PRIMARY_RED}25`,
          }}
        >

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <h4
                className="font-bold"
                style={{
                  color:
                    FORTUNA_PRIMARY_RED,
                }}
              >
                Advance Shipping Notices
              </h4>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supplier shipment information before physical receipt.
              </p>

            </div>

            {/* RECORDS BADGE */}

            <div
              className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor:
                  `${FORTUNA_SECONDARY_BLUE}10`,
                color:
                  FORTUNA_SECONDARY_BLUE,
              }}
            >
              {filteredRows.length} Records
            </div>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">

          <table className="w-full min-w-[1450px] table-auto text-[13px]">

            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[120px]" />
              <col className="w-[145px]" />
              <col className="w-[190px]" />
              <col className="w-[170px]" />
              <col className="w-[135px]" />
              <col className="w-[145px]" />
              <col className="w-[75px]" />
              <col className="w-[175px]" />
              <col className="w-[130px]" />
              <col className="w-[210px]" />
            </colgroup>

            {/* =================================================
                HEADER
            ================================================= */}

            <thead>

              <tr
                className="border-b text-white"
                style={{
                  backgroundColor:
                    FORTUNA_PRIMARY_RED,
                  borderColor:
                    FORTUNA_PRIMARY_RED,
                }}
              >

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  ASN Number
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  ASN Date
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  PO Number
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  Vendor
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  Warehouse
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  Shipment Date
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  Expected Arrival
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  Qty
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  Transport
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                  Status
                </th>

                <th className="whitespace-nowrap px-3 py-3 text-right font-semibold">
                  Actions
                </th>

              </tr>

            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>

              {paginatedRows.map(
                (row) => (

                  <tr
                    key={row.asn_id}
                    className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                  >

                    {/* ASN NUMBER */}

                    <td className="max-w-[190px] px-3 py-4">

                      <button
                        type="button"
                        onClick={() => openASNDetails(row)}
                        className="font-bold hover:underline"
                        style={{
                          color:
                            FORTUNA_SECONDARY_BLUE,
                        }}
                      >
                        {row.asn_number}
                      </button>

                    </td>

                    {/* ASN DATE */}

                    <td className="whitespace-nowrap px-3 py-4 text-gray-700 dark:text-gray-300">
                      {formatDate(
                        row.asn_date
                      )}
                    </td>

                    {/* PO NUMBER */}

                    <td
                      className="max-w-[145px] break-words px-3 py-4 font-semibold"
                      style={{
                        color:
                          FORTUNA_PRIMARY_RED,
                      }}
                    >
                      {row.po_number}
                    </td>

                    {/* VENDOR */}

                    <td className="px-3 py-4">

                      <div
                        className="line-clamp-2 font-semibold text-gray-900 dark:text-white"
                        title={
                          row.vendor_name
                        }
                      >
                        {row.vendor_name}
                      </div>

                    </td>

                    {/* WAREHOUSE */}

                    <td
                      className="truncate px-3 py-4 text-gray-700 dark:text-gray-300"
                      title={
                        row.warehouse
                      }
                    >
                      {row.warehouse}
                    </td>

                    {/* SHIPMENT DATE */}

                    <td className="whitespace-nowrap px-3 py-4 text-gray-700 dark:text-gray-300">
                      {formatDate(
                        row.shipment_date
                      )}
                    </td>

                    {/* EXPECTED ARRIVAL */}

                    <td className="whitespace-nowrap px-3 py-4 text-gray-700 dark:text-gray-300">
                      {formatDate(
                        row.expected_arrival
                      )}
                    </td>

                    {/* QTY */}

                    <td className="px-3 py-4">

                      <div
                        className="font-bold"
                        style={{
                          color:
                            FORTUNA_PRIMARY_RED,
                        }}
                      >
                        {row.total_qty.toLocaleString(
                          "en-IN"
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500">
                        {row.total_items} item(s)
                      </div>

                    </td>

                    {/* TRANSPORT */}

                    <td className="px-3 py-4">

                      <div
                        className="line-clamp-1 font-semibold"
                        title={
                          row.transporter ||
                          "—"
                        }
                        style={{
                          color:
                            row.transporter
                              ? FORTUNA_SECONDARY_BLUE
                              : "#6B7280",
                        }}
                      >
                        {row.transporter ||
                          "—"}
                      </div>

                      <div
                        className="mt-0.5 truncate text-[11px]"
                        title={
                          row.vehicle_number ||
                          "No vehicle"
                        }
                        style={{
                          color:
                            row.vehicle_number
                              ? FORTUNA_PRIMARY_RED
                              : "#6B7280",
                        }}
                      >
                        {row.vehicle_number ||
                          "No vehicle"}
                      </div>

                    </td>

                    {/* STATUS */}

                    <td className="px-3 py-4">

                      <span
                        className={statusPill(
                          row.status
                        )}
                      >
                        {row.status}
                      </span>

                    </td>

                    {/* ACTIONS */}

                    <td className="px-3 py-4">

                      <div className="flex flex-wrap justify-end gap-1.5">

                        {/* VIEW */}

                        <button
                          type="button"
                          onClick={() => openASNDetails(row)}
                          className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                          style={{
                            background:
                              FORTUNA_BLUE_GRADIENT,
                          }}
                        >
                          View
                        </button>

                        {/* EDIT */}

                       

{row.status === "Draft" && (
  <Link
    href={`/asn/create?asn_id=${row.asn_id}`}
    className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    style={{
      background: FORTUNA_RED_GRADIENT,
    }}
  >
    Edit
  </Link>
)}

{row.status === "Draft" && (
                          <button type="button" onClick={() => deleteASN(row)} className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50">Delete</button>
                        )}

                        {/* CREATE INWARD */}

                        {(row.status ===
                          "Submitted" ||
                          row.status ===
                            "In Transit" ||
                          row.status ===
                            "Arrived") && (

                          <button
                          type="button"
                          className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                          style={{
                          background: FORTUNA_RED_GRADIENT,
                           }}
                          onClick={() => router.push("/GoodsInwardForm")}
                          >
                           Create Inward
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )
              )}

              {/* EMPTY */}

              {paginatedRows.length === 0 && (
                <tr>

                  <td
                    colSpan={11}
                    className="px-5 py-16 text-center text-sm text-gray-500"
                  >
                    No ASN records found for the selected filters.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            PAGINATION FOOTER
        =================================================== */}

        <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">

          {/* RECORD RANGE */}

          <div className="text-xs text-gray-500 dark:text-gray-400">

            Showing{" "}

            <span
              className="font-bold"
              style={{
                color:
                  FORTUNA_PRIMARY_RED,
              }}
            >
              {pageStart}
            </span>

            {" "}to{" "}

            <span
              className="font-bold"
              style={{
                color:
                  FORTUNA_PRIMARY_RED,
              }}
            >
              {pageEnd}
            </span>

            {" "}of{" "}

            <span className="font-bold text-gray-800 dark:text-gray-200">
              {filteredRows.length}
            </span>

            {" "}ASN records

          </div>

          {/* PAGINATION CONTROLS */}

          <div className="flex flex-wrap items-center justify-center gap-2">

            {/* ROWS */}

            <div className="flex items-center gap-2">

              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Rows:
              </span>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(
                    Number(
                      e.target.value
                    )
                  );

                  setCurrentPage(1);
                }}
                className="rounded-lg border bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm outline-none transition focus:ring-2 dark:bg-gray-900 dark:text-gray-200"
                style={{
                  borderColor:
                    FORTUNA_SECONDARY_BLUE,
                  boxShadow:
                    `0 0 0 2px ${FORTUNA_SECONDARY_BLUE}10`,
                }}
              >

                <option value={5}>
                  5
                </option>

                <option value={10}>
                  10
                </option>

                <option value={20}>
                  20
                </option>

                <option value={50}>
                  50
                </option>

              </select>

            </div>

            {/* PREVIOUS */}

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.max(
                      1,
                      prev - 1
                    )
                )
              }
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background:
                  FORTUNA_BLUE_GRADIENT,
              }}
            >
              ← Previous
            </button>

            {/* PAGE NUMBERS */}

            <div className="flex items-center gap-1">

              {getPageNumbers().map(
                (page, index) => {

                  if (
                    page ===
                    "ellipsis"
                  ) {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-1 text-xs font-semibold text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive =
                    page ===
                    currentPage;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                      style={{
                        background:
                          isActive
                            ? FORTUNA_GRADIENT
                            : `linear-gradient(
                                135deg,
                                ${FORTUNA_SECONDARY_BLUE}08 0%,
                                ${FORTUNA_SECONDARY_BLUE}15 100%
                              )`,

                        color:
                          isActive
                            ? "#FFFFFF"
                            : FORTUNA_SECONDARY_BLUE,

                        border:
                          `1px solid ${
                            isActive
                              ? "transparent"
                              : `${FORTUNA_SECONDARY_BLUE}35`
                          }`,

                        boxShadow:
                          isActive
                            ? `0 3px 8px ${FORTUNA_PRIMARY_RED}35`
                            : "none",
                      }}
                    >
                      {page}
                    </button>
                  );
                }
              )}

            </div>

            {/* NEXT */}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.min(
                      totalPages,
                      prev + 1
                    )
                )
              }
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background:
                  FORTUNA_BLUE_GRADIENT,
              }}
            >
              Next →
            </button>

          </div>

          {/* WORKFLOW */}

          <div
            className="hidden min-w-0 break-words text-right text-xs font-semibold xl:block"
            style={{
              color:
                FORTUNA_SECONDARY_BLUE,
            }}
          >
            PO → ASN → Goods Inward → GRN → Putaway
          </div>

        </div>

        </div>
        </div>
        {/* RIGHT SIDE QUICK STATS - PO LIST STYLE */}
        <aside className="min-w-0">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:sticky xl:top-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800 dark:text-white">Quick Stats</h3>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
            </div>
            <div className="space-y-3">
              {[
                { label: "Total ASN", value: filteredRows.length, color: "bg-slate-100 text-slate-700" },
                { label: "Draft", value: filteredRows.filter((x) => x.status === "Draft").length, color: "bg-slate-100 text-slate-700" },
                { label: "Submitted", value: filteredRows.filter((x) => x.status === "Submitted").length, color: "bg-blue-100 text-blue-700" },
                { label: "In Transit", value: filteredRows.filter((x) => x.status === "In Transit").length, color: "bg-indigo-100 text-indigo-700" },
                { label: "Arrived", value: filteredRows.filter((x) => x.status === "Arrived").length, color: "bg-amber-100 text-amber-800" },
                { label: "Partially Received", value: filteredRows.filter((x) => x.status === "Partially Received").length, color: "bg-orange-100 text-orange-700" },
                { label: "Fully Received", value: filteredRows.filter((x) => x.status === "Fully Received").length, color: "bg-green-100 text-green-700" },
                { label: "Closed", value: filteredRows.filter((x) => x.status === "Closed").length, color: "bg-purple-100 text-purple-700" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{stat.label}</span>
                  <span className={`min-w-[38px] rounded-full px-3 py-1 text-center text-xs font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
            <div className="my-5 border-t border-gray-200 dark:border-gray-800" />
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              <span className="font-semibold">Tip:</span> Current search and filters apply to these stats and the export.
            </div>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
              ASN status summary updates automatically based on filtered records.
            </div>
          </div>
        </aside>
      </div>

      {/* ===================================================
          VIEW MODAL
      =================================================== */}

      {selectedASN && (

        <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]">

          <div className="my-8 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

            {/* MODAL HEADER */}

            <div
              className="border-b p-5"
              style={{
                borderColor:
                  `${FORTUNA_PRIMARY_RED}25`,
              }}
            >

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <h3
                      className="text-lg font-bold"
                      style={{
                        color:
                          FORTUNA_PRIMARY_RED,
                      }}
                    >
                      {selectedASN.asn_number}
                    </h3>

                    <span
                      className={statusPill(
                        selectedASN.status
                      )}
                    >
                      {selectedASN.status}
                    </span>

                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Purchase Order:{" "}
                    {selectedASN.po_number}
                  </p>

                </div>

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedASN(null)
                  }
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  ✕
                </button>

              </div>

            </div>

            {/* MODAL BODY */}

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              {detailLoading && <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">Loading complete ASN details…</div>}
              {detailError && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{detailError}</div>}
              {(() => {
                const d: any = selectedASN;
                const vendor = d.vendor || d.vendor_details || {};
                const wh = d.warehouse_details || d.warehouse_master || {};
                const items = d.items || d.asn_items || d.lines || [];
                const attachments = d.attachments || d.asn_attachments || [];
                const history = d.history || d.asn_history || [];
                const value = (...vals: any[]) => vals.find(v => v !== null && v !== undefined && String(v).trim() !== "") ?? "—";
                return <>
                  <section>
                    <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">ASN & Shipment Details</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Info label="ASN Number" value={String(value(d.asn_number, d.asn_id))}/>
                      <Info label="ASN Date" value={formatDate(value(d.asn_date))}/>
                      <Info label="Status" value={String(value(d.status))}/>
                      <Info label="PO Number" value={String(value(d.po_number))}/>
                      <Info label="PO Date" value={formatDate(value(d.po_date))}/>
                      <Info label="Shipment Date" value={formatDate(value(d.shipment_date))}/>
                      <Info label="Expected Arrival" value={formatDate(value(d.expected_arrival))}/>
                      <Info label="Delivery Schedule" value={String(value(d.delivery_schedule))}/>
                      <Info label="Transporter" value={String(value(d.transporter))}/>
                      <Info label="Vehicle Number" value={String(value(d.vehicle_number))}/>
                      <Info label="LR / AWB Number" value={String(value(d.lr_awb_number))}/>
                      <Info label="Shipping Reference" value={String(value(d.shipping_reference))}/>
                      <Info label="Packages" value={String(value(d.package_count))}/>
                      <Info label="Pallets" value={String(value(d.pallet_count))}/>
                      <Info label="Total Weight" value={`${value(d.total_weight)} ${value(d.weight_uom, "")}`}/>
                      <Info label="Invoice Number" value={String(value(d.invoice_number))}/>
                      <Info label="Invoice Date" value={formatDate(value(d.invoice_date))}/>
                      <Info label="E-Way Bill" value={String(value(d.eway_bill_number))}/>
                      <Info label="Packing List" value={String(value(d.packing_list_number))}/>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Info label="Packing Instructions" value={String(value(d.packing_instructions))}/>
                      <Info label="Remarks" value={String(value(d.remarks))}/>
                    </div>
                  </section>
                  <section>
                    <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Vendor Details</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Info label="Vendor ID" value={String(value(d.vendor_id, vendor.vendor_id, vendor.id))}/>
                      <Info label="Vendor Name" value={String(value(d.vendor_name, vendor.vendor_name, vendor.name))}/>
                      <Info label="Vendor Code" value={String(value(d.vendor_code, vendor.vendor_code))}/>
                      <Info label="GSTIN" value={String(value(d.vendor_gstin, d.gstin, vendor.gstin))}/>
                      <Info label="Contact Person" value={String(value(d.vendor_contact_person, d.contact_person, vendor.contact_person_name))}/>
                      <Info label="Phone" value={String(value(d.vendor_phone, d.contact_phone, vendor.contact_phone))}/>
                      <Info label="Email" value={String(value(d.vendor_email, d.contact_email, vendor.contact_email))}/>
                      <Info label="Address" value={String(value(d.vendor_address, d.registered_address, vendor.registered_address, vendor.address))}/>
                    </div>
                  </section>
                  <section>
                    <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Warehouse Details</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Info label="Warehouse ID" value={String(value(d.warehouse_id, wh.warehouse_id))}/>
                      <Info label="Warehouse Name" value={String(value(d.warehouse_name, d.warehouse, wh.warehouse_name))}/>
                      <Info label="Warehouse Code" value={String(value(d.warehouse_code, wh.warehouse_code))}/>
                      <Info label="Address" value={String(value(d.warehouse_address, wh.address_line1, wh.address))}/>
                      <Info label="City" value={String(value(d.warehouse_city, wh.city))}/>
                      <Info label="State" value={String(value(d.warehouse_state, wh.state))}/>
                      <Info label="Pincode" value={String(value(d.warehouse_pincode, wh.pincode, wh.postal_code))}/>
                    </div>
                  </section>
                  <section>
                    <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">ASN Items ({items.length})</h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="min-w-[850px] w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-white/5"><tr>{["Item Code","Description","UOM","Ordered Qty","Previously ASN","Shipping Qty","Delivery Date"].map(h=><th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>)}</tr></thead>
                        <tbody>{items.map((it: any, i: number)=><tr key={it.asn_item_id || it.po_item_id || i} className="border-t border-gray-100 dark:border-gray-800"><td className="px-3 py-3">{value(it.item_id, it.item_code)}</td><td className="px-3 py-3">{value(it.item_description, it.description)}</td><td className="px-3 py-3">{value(it.uom)}</td><td className="px-3 py-3">{value(it.ordered_qty)}</td><td className="px-3 py-3">{value(it.previously_asn_qty)}</td><td className="px-3 py-3">{value(it.shipping_qty)}</td><td className="px-3 py-3">{formatDate(value(it.delivery_date))}</td></tr>)}</tbody>
                      </table>
                    </div>
                    {!items.length && <p className="text-sm text-gray-500">No item details were returned by the ASN API.</p>}
                  </section>
                  <section>
                    <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Attachments ({attachments.length})</h4>
                    {attachments.length ? <ul className="space-y-2">{attachments.map((a: any, i: number)=><li key={a.id || a.attachment_id || i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm dark:border-gray-700"><span>{value(a.file_name, a.original_name, a.name)}</span>{(a.file_url || a.url || a.file_path) && <a className="font-semibold text-[#005F99] underline" href={a.file_url || a.url || a.file_path} target="_blank" rel="noreferrer">Open file</a>}</li>)}</ul> : <p className="text-sm text-gray-500">No attachments.</p>}
                  </section>
                  <section>
                    <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Activity History ({history.length})</h4>
                    {history.length ? <ul className="space-y-2">{history.map((h: any,i: number)=><li key={h.id || i} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/5">{value(h.action, h.status, h.description, h.remarks)} <span className="text-xs text-gray-500">{value(h.created_at, h.action_date)}</span></li>)}</ul> : <p className="text-sm text-gray-500">No history records returned.</p>}
                  </section>
                </>;
              })()}
            </div>

            {/* LEGACY SUMMARY BODY (replaced by full detail sections) */}
            {false && <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">

              <Info
                label="ASN Date"
                value={formatDate(
                  selectedASN.asn_date
                )}
              />

              <Info
                label="PO Number"
                value={
                  selectedASN.po_number
                }
              />

              <Info
                label="Vendor"
                value={
                  selectedASN.vendor_name
                }
              />

              <Info
                label="Warehouse"
                value={
                  selectedASN.warehouse
                }
              />

              <Info
                label="Shipment Date"
                value={formatDate(
                  selectedASN.shipment_date
                )}
              />

              <Info
                label="Expected Arrival"
                value={formatDate(
                  selectedASN.expected_arrival
                )}
              />

              <Info
                label="Total Items"
                value={String(
                  selectedASN.total_items
                )}
              />

              <Info
                label="Total Quantity"
                value={selectedASN.total_qty.toLocaleString(
                  "en-IN"
                )}
              />

              <Info
                label="Transporter"
                value={
                  selectedASN.transporter ||
                  "—"
                }
              />

              <Info
                label="Vehicle Number"
                value={
                  selectedASN.vehicle_number ||
                  "—"
                }
              />

              <div>

                <div className="mb-1 text-xs font-medium text-gray-500">
                  Status
                </div>

                <span
                  className={statusPill(
                    selectedASN.status
                  )}
                >
                  {selectedASN.status}
                </span>

              </div>

            </div>}

            {/* MODAL FOOTER */}

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 p-5 dark:border-gray-800">

              {/* CLOSE */}

              <button
                type="button"
                onClick={() =>
                  setSelectedASN(null)
                }
                className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background:
                    FORTUNA_BLUE_GRADIENT,
                }}
              >
                Close
              </button>

              {/* EDIT ASN */}

              {selectedASN.status ===
                "Draft" && (

                <Link
                  href={`/asn/create?asn_id=${selectedASN.asn_id}`}
                  className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    background:
                      FORTUNA_GRADIENT,
                  }}
                >
                  Edit ASN
                </Link>

              )}

              {/* CREATE GOODS INWARD */}

              {(selectedASN.status ===
                "Submitted" ||
                selectedASN.status ===
                  "In Transit" ||
                selectedASN.status ===
                  "Arrived") && (

                  <button
  type="button"
  onClick={() => router.push("/GoodsInwardForm")}
  className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  style={{
    background: FORTUNA_RED_GRADIENT,
  }}
>
  Create Goods Inward
</button>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: string;
}) {
  const isRed =
    accent === FORTUNA_PRIMARY_RED;

  return (
    <div
      className="group relative min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:bg-gray-900"
      style={{
        borderColor:
          `${accent}35`,
      }}
    >

      {/* TOP STRIP */}

      <div
        className="h-1.5 w-full"
        style={{
          backgroundColor:
            accent,
        }}
      />

      <div className="relative p-4">

        <div className="flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            {/* ICON */}

            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold text-white shadow-sm"
              style={{
                background:
                  isRed
                    ? FORTUNA_RED_GRADIENT
                    : FORTUNA_BLUE_GRADIENT,
              }}
            >
              {icon}
            </span>

            <div className="min-w-0">

              <div className="truncate text-sm font-semibold text-gray-600 dark:text-gray-300">
                {label}
              </div>

              <div className="mt-1 flex items-center gap-2">

                <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {value}
                </span>

                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      accent,
                    boxShadow:
                      `0 0 0 4px ${accent}15`,
                  }}
                />

              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM INDICATOR */}

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">

          <div
            className="h-full rounded-full transition-all duration-300 group-hover:w-full"
            style={{
              width: isRed
                ? "55%"
                : "65%",
              background:
                isRed
                  ? FORTUNA_RED_GRADIENT
                  : FORTUNA_BLUE_GRADIENT,
            }}
          />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl border bg-gray-50 p-3 dark:bg-white/5"
      style={{
        borderColor:
          `${FORTUNA_SECONDARY_BLUE}15`,
      }}
    >

      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </div>

    </div>
  );
}