"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

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

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm transition-all focus:outline-none " +
  "focus:ring-2 focus:ring-[#005F99]/10 focus:border-[#005F99] " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

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

export default function ASNListPage() {
  const [rows] = useState<ASNRow[]>(DEMO_ASNS);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ASNStatus>("All");
  const [warehouse, setWarehouse] = useState("All");
  const [vendor, setVendor] = useState("All");

  const [selectedASN, setSelectedASN] = useState<ASNRow | null>(null);

  const warehouses = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((x) => x.warehouse)))],
    [rows]
  );

  const vendors = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((x) => x.vendor_name)))],
    [rows]
  );

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

      const matchesStatus = status === "All" || row.status === status;

      const matchesWarehouse =
        warehouse === "All" || row.warehouse === warehouse;

      const matchesVendor = vendor === "All" || row.vendor_name === vendor;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesWarehouse &&
        matchesVendor
      );
    });
  }, [rows, search, status, warehouse, vendor]);

  const summary = useMemo(() => {
    return {
      total: rows.length,
      draft: rows.filter((x) => x.status === "Draft").length,
      submitted: rows.filter((x) => x.status === "Submitted").length,
      inTransit: rows.filter((x) => x.status === "In Transit").length,
      received: rows.filter(
        (x) =>
          x.status === "Partially Received" ||
          x.status === "Fully Received"
      ).length,
    };
  }, [rows]);

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setWarehouse("All");
    setVendor("All");
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <PageBreadcrumb pageTitle="Advance Shipping Notice (ASN)" />

      {/* =========================================================
          PAGE HEADER
      ========================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="h-8 w-1 rounded-full"
                style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
              />

              <h3
                className="text-lg font-bold"
                style={{ color: FORTUNA_PRIMARY_RED }}
              >
                ASN List
              </h3>

              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${FORTUNA_PRIMARY_RED}10`,
                  color: FORTUNA_PRIMARY_RED,
                }}
              >
                Supplier Shipment Notice
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Track supplier shipment notifications linked to Purchase Orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Clear Filters
            </button>

            <Link
              href="/asn/create"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{
                backgroundColor: FORTUNA_PRIMARY_RED,
              }}
            >
              + Create ASN
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================
          KPI CARDS
      ========================================================== */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total ASN"
          value={summary.total}
          accent={FORTUNA_SECONDARY_BLUE}
          icon="ASN"
        />

        <SummaryCard
          label="Draft"
          value={summary.draft}
          accent={FORTUNA_PRIMARY_RED}
          icon="DR"
        />

        <SummaryCard
          label="Submitted"
          value={summary.submitted}
          accent={FORTUNA_SECONDARY_BLUE}
          icon="SB"
        />

        <SummaryCard
          label="In Transit"
          value={summary.inTransit}
          accent={FORTUNA_PRIMARY_RED}
          icon="IT"
        />

        <SummaryCard
          label="Receiving"
          value={summary.received}
          accent={FORTUNA_SECONDARY_BLUE}
          icon="RC"
        />
      </div>

      {/* =========================================================
          FILTERS
      ========================================================== */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="min-w-0 lg:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Search
            </label>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ASN, PO, vendor, warehouse, vehicle..."
              className={inputBase}
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "All" | ASNStatus)
              }
              className={inputBase}
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Warehouse
            </label>

            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className={inputBase}
            >
              {warehouses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Vendor
            </label>

            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className={inputBase}
            >
              {vendors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex min-w-0 items-end">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
              Showing{" "}
              <span
                className="font-bold"
                style={{ color: FORTUNA_PRIMARY_RED }}
              >
                {filteredRows.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {rows.length}
              </span>{" "}
              ASN records
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          ASN TABLE
      ========================================================== */}
      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Section Heading - PRIMARY RED ONLY */}
        <div
          className="border-b px-5 py-4"
          style={{
            borderColor: `${FORTUNA_PRIMARY_RED}25`,
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h4
                className="font-bold"
                style={{ color: FORTUNA_PRIMARY_RED }}
              >
                Advance Shipping Notices
              </h4>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supplier shipment information before physical receipt.
              </p>
            </div>

            <div
              className="w-fit rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${FORTUNA_PRIMARY_RED}10`,
                color: FORTUNA_PRIMARY_RED,
              }}
            >
              {filteredRows.length} Records
            </div>
          </div>
        </div>

        {/* =======================================================
            TABLE SCROLL AREA
            Only table scrolls horizontally.
        ======================================================== */}
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[1080px] table-fixed text-[13px]">
            <colgroup>
              <col className="w-[125px]" />
              <col className="w-[95px]" />
              <col className="w-[110px]" />
              <col className="w-[135px]" />
              <col className="w-[115px]" />
              <col className="w-[110px]" />
              <col className="w-[115px]" />
              <col className="w-[65px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[150px]" />
            </colgroup>

            {/* PRIMARY RED ONLY */}
            <thead>
              <tr
                className="border-b text-white"
                style={{
                  backgroundColor: FORTUNA_PRIMARY_RED,
                  borderColor: FORTUNA_PRIMARY_RED,
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

            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.asn_id}
                  className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                >
                  <td className="truncate px-3 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedASN(row)}
                      className="font-bold hover:underline"
                      style={{ color: FORTUNA_SECONDARY_BLUE }}
                    >
                      {row.asn_number}
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-gray-700 dark:text-gray-300">
                    {formatDate(row.asn_date)}
                  </td>

                  <td
                    className="truncate px-3 py-4 font-semibold"
                    style={{ color: FORTUNA_PRIMARY_RED }}
                  >
                    {row.po_number}
                  </td>

                  <td className="px-3 py-4">
                    <div
                      className="line-clamp-2 font-semibold text-gray-900 dark:text-white"
                      title={row.vendor_name}
                    >
                      {row.vendor_name}
                    </div>
                  </td>

                  <td
                    className="truncate px-3 py-4 text-gray-700 dark:text-gray-300"
                    title={row.warehouse}
                  >
                    {row.warehouse}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-gray-700 dark:text-gray-300">
                    {formatDate(row.shipment_date)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-gray-700 dark:text-gray-300">
                    {formatDate(row.expected_arrival)}
                  </td>

                  <td className="px-3 py-4">
                    <div
                      className="font-bold"
                      style={{ color: FORTUNA_PRIMARY_RED }}
                    >
                      {row.total_qty.toLocaleString("en-IN")}
                    </div>

                    <div className="text-[11px] text-gray-500">
                      {row.total_items} item(s)
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div
                      className="line-clamp-1 font-semibold"
                      title={row.transporter || "—"}
                      style={{
                        color: row.transporter
                          ? FORTUNA_SECONDARY_BLUE
                          : "#6B7280",
                      }}
                    >
                      {row.transporter || "—"}
                    </div>

                    <div
                      className="mt-0.5 truncate text-[11px]"
                      title={row.vehicle_number || "No vehicle"}
                      style={{
                        color: row.vehicle_number
                          ? FORTUNA_PRIMARY_RED
                          : "#6B7280",
                      }}
                    >
                      {row.vehicle_number || "No vehicle"}
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <span className={statusPill(row.status)}>
                      {row.status}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedASN(row)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:border-[#005F99] hover:text-[#005F99] dark:border-gray-700 dark:text-gray-200"
                      >
                        View
                      </button>

                      {row.status === "Draft" && (
                        <Link
                          href={`/asn/create?asn_id=${row.asn_id}`}
                          className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90"
                          style={{
                            backgroundColor: FORTUNA_SECONDARY_BLUE,
                          }}
                        >
                          Edit
                        </Link>
                      )}

                      {(row.status === "Submitted" ||
                        row.status === "In Transit" ||
                        row.status === "Arrived") && (
                        <button
                          type="button"
                          className="rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition hover:bg-red-50 dark:hover:bg-red-500/10"
                          style={{
                            borderColor: FORTUNA_PRIMARY_RED,
                            color: FORTUNA_PRIMARY_RED,
                          }}
                          onClick={() =>
                            alert(
                              `Goods Inward creation for ${row.asn_number} will be connected in the next phase.`
                            )
                          }
                        >
                          Create Inward
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
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

        {/* =======================================================
            FOOTER
        ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 text-xs text-gray-500 dark:border-gray-800">
          <span className="shrink-0">
            ASN records:{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {filteredRows.length}
            </span>
          </span>

          <span
            className="min-w-0 break-words text-right font-semibold"
            style={{ color: FORTUNA_SECONDARY_BLUE }}
          >
            PO → ASN → Goods Inward → GRN → Putaway
          </span>
        </div>
      </div>

      {/* =========================================================
          VIEW MODAL
      ========================================================== */}
      {selectedASN && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* Modal Header */}
            <div
              className="border-b p-5"
              style={{
                borderColor: `${FORTUNA_PRIMARY_RED}25`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className="text-lg font-bold"
                      style={{ color: FORTUNA_PRIMARY_RED }}
                    >
                      {selectedASN.asn_number}
                    </h3>

                    <span className={statusPill(selectedASN.status)}>
                      {selectedASN.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Purchase Order: {selectedASN.po_number}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedASN(null)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="ASN Date"
                value={formatDate(selectedASN.asn_date)}
              />

              <Info
                label="PO Number"
                value={selectedASN.po_number}
              />

              <Info
                label="Vendor"
                value={selectedASN.vendor_name}
              />

              <Info
                label="Warehouse"
                value={selectedASN.warehouse}
              />

              <Info
                label="Shipment Date"
                value={formatDate(selectedASN.shipment_date)}
              />

              <Info
                label="Expected Arrival"
                value={formatDate(selectedASN.expected_arrival)}
              />

              <Info
                label="Total Items"
                value={String(selectedASN.total_items)}
              />

              <Info
                label="Total Quantity"
                value={selectedASN.total_qty.toLocaleString("en-IN")}
              />

              <Info
                label="Transporter"
                value={selectedASN.transporter || "—"}
              />

              <Info
                label="Vehicle Number"
                value={selectedASN.vehicle_number || "—"}
              />

              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">
                  Status
                </div>

                <span className={statusPill(selectedASN.status)}>
                  {selectedASN.status}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 p-5 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setSelectedASN(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
              >
                Close
              </button>

              {selectedASN.status === "Draft" && (
                <Link
                  href={`/asn/create?asn_id=${selectedASN.asn_id}`}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{
                    backgroundColor: FORTUNA_SECONDARY_BLUE,
                  }}
                >
                  Edit ASN
                </Link>
              )}

              {(selectedASN.status === "Submitted" ||
                selectedASN.status === "In Transit" ||
                selectedASN.status === "Arrived") && (
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      `Create Goods Inward from ${selectedASN.asn_number} — API integration pending.`
                    )
                  }
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{
                    backgroundColor: FORTUNA_PRIMARY_RED,
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

/* =============================================================
   SUMMARY CARD
   Alternating Fortuna Primary Red / Secondary Blue
============================================================= */

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
  const isRed = accent === FORTUNA_PRIMARY_RED;

  return (
    <div
      className="group relative min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:bg-gray-900"
      style={{
        borderColor: `${accent}35`,
      }}
    >
      {/* Solid Fortuna top strip */}
      <div
        className="h-1.5 w-full"
        style={{
          backgroundColor: accent,
        }}
      />

      <div className="relative p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Solid color icon */}
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold text-white shadow-sm"
              style={{
                backgroundColor: accent,
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
                    backgroundColor: accent,
                    boxShadow: `0 0 0 4px ${accent}15`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-300 group-hover:w-full"
            style={{
              width: isRed ? "55%" : "65%",
              backgroundColor: accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   INFO BOX
============================================================= */

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
        borderColor: `${FORTUNA_SECONDARY_BLUE}15`,
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