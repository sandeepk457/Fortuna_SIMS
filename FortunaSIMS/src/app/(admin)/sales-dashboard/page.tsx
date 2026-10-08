"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

type Warehouse =
  | "All Warehouses"
  | "Vizag WH"
  | "Hyderabad WH"
  | "Chennai WH";

type Range = 7 | 30 | 90;

type OrderStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Allocated"
  | "Picking"
  | "Ready for Dispatch"
  | "Dispatched"
  | "Delivered"
  | "On Hold";

type SalesOrder = {
  so: string;
  customer: string;
  warehouse: string;
  date: string;
  deliveryDate: string;
  value: number;
  status: OrderStatus;
  items: number;
};

/* ================================================================
   HELPERS
================================================================ */

function cn(...values: Array<string | false | undefined | null>) {
  return values.filter(Boolean).join(" ");
}

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ================================================================
   DEMO SALES ORDERS
================================================================ */

const orders: SalesOrder[] = [
  {
    so: "SO-2026-00125",
    customer: "Fortuna Retail (Vizag)",
    warehouse: "Vizag WH",
    date: "2026-10-08",
    deliveryDate: "2026-10-10",
    value: 245000,
    status: "Approved",
    items: 8,
  },
  {
    so: "SO-2026-00124",
    customer: "Prime IT Park Canteen",
    warehouse: "Hyderabad WH",
    date: "2026-10-08",
    deliveryDate: "2026-10-09",
    value: 86500,
    status: "Pending Approval",
    items: 4,
  },
  {
    so: "SO-2026-00123",
    customer: "Metro Supermarket",
    warehouse: "Vizag WH",
    date: "2026-10-07",
    deliveryDate: "2026-10-11",
    value: 198000,
    status: "Allocated",
    items: 6,
  },
  {
    so: "SO-2026-00122",
    customer: "City Hospital Stores",
    warehouse: "Chennai WH",
    date: "2026-10-07",
    deliveryDate: "2026-10-12",
    value: 142500,
    status: "Ready for Dispatch",
    items: 5,
  },
  {
    so: "SO-2026-00121",
    customer: "ABC Manufacturing Ltd",
    warehouse: "Vizag WH",
    date: "2026-10-06",
    deliveryDate: "2026-10-09",
    value: 425000,
    status: "Dispatched",
    items: 12,
  },
  {
    so: "SO-2026-00120",
    customer: "Sri Lakshmi Distributors",
    warehouse: "Hyderabad WH",
    date: "2026-10-05",
    deliveryDate: "2026-10-08",
    value: 97500,
    status: "Delivered",
    items: 3,
  },
  {
    so: "SO-2026-00119",
    customer: "Neon Motors",
    warehouse: "Vizag WH",
    date: "2026-10-04",
    deliveryDate: "2026-10-08",
    value: 368000,
    status: "Picking",
    items: 10,
  },
  {
    so: "SO-2026-00118",
    customer: "Global Auto Components",
    warehouse: "Chennai WH",
    date: "2026-10-03",
    deliveryDate: "2026-10-10",
    value: 286000,
    status: "On Hold",
    items: 7,
  },
];

/* ================================================================
   SALES TREND
================================================================ */

const trendData = {
  7: [
    { label: "02 Oct", orders: 18, value: 320000 },
    { label: "03 Oct", orders: 24, value: 465000 },
    { label: "04 Oct", orders: 21, value: 390000 },
    { label: "05 Oct", orders: 29, value: 520000 },
    { label: "06 Oct", orders: 34, value: 645000 },
    { label: "07 Oct", orders: 31, value: 585000 },
    { label: "08 Oct", orders: 38, value: 735000 },
  ],

  30: [
    { label: "W1", orders: 142, value: 2650000 },
    { label: "W2", orders: 168, value: 3180000 },
    { label: "W3", orders: 191, value: 3720000 },
    { label: "W4", orders: 214, value: 4210000 },
  ],

  90: [
    { label: "Jul", orders: 510, value: 9850000 },
    { label: "Aug", orders: 584, value: 11250000 },
    { label: "Sep", orders: 642, value: 12880000 },
  ],
};

/* ================================================================
   ORDER STATUS
================================================================ */

const statusData = [
  {
    status: "Draft",
    count: 42,
    accent: FORTUNA_BLUE,
  },
  {
    status: "Pending Approval",
    count: 28,
    accent: FORTUNA_RED,
  },
  {
    status: "Approved",
    count: 86,
    accent: FORTUNA_BLUE,
  },
  {
    status: "Allocated",
    count: 64,
    accent: FORTUNA_RED,
  },
  {
    status: "Picking",
    count: 39,
    accent: FORTUNA_BLUE,
  },
  {
    status: "Ready for Dispatch",
    count: 24,
    accent: FORTUNA_RED,
  },
  {
    status: "Dispatched",
    count: 51,
    accent: FORTUNA_BLUE,
  },
  {
    status: "Delivered",
    count: 911,
    accent: FORTUNA_RED,
  },
];

/* ================================================================
   TOP CUSTOMERS
================================================================ */

const topCustomers = [
  {
    name: "Fortuna Retail Group",
    orders: 84,
    value: 2850000,
  },
  {
    name: "Neon Motors",
    orders: 61,
    value: 2240000,
  },
  {
    name: "ABC Manufacturing",
    orders: 54,
    value: 1985000,
  },
  {
    name: "Metro Supermarket",
    orders: 47,
    value: 1740000,
  },
  {
    name: "Global Auto Components",
    orders: 39,
    value: 1525000,
  },
];

/* ================================================================
   PENDING ACTIONS
================================================================ */

const pendingActions = [
  {
    title: "Approval Pending",
    count: 28,
    description: "Sales orders waiting for approval",
    accent: FORTUNA_RED,
  },
  {
    title: "Allocation Pending",
    count: 19,
    description: "Approved orders awaiting stock allocation",
    accent: FORTUNA_BLUE,
  },
  {
    title: "Dispatch Pending",
    count: 24,
    description: "Orders ready for dispatch planning",
    accent: FORTUNA_RED,
  },
  {
    title: "Invoice Pending",
    count: 17,
    description: "Dispatches awaiting invoice generation",
    accent: FORTUNA_BLUE,
  },
];

/* ================================================================
   MAIN DASHBOARD
================================================================ */

export default function SalesDashboard() {
  const [warehouse, setWarehouse] =
    useState<Warehouse>("All Warehouses");

  const [range, setRange] =
    useState<Range>(30);

  /* ============================================================
     RECENT ORDERS PAGINATION
  ============================================================ */

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  /* ============================================================
     FILTER ORDERS
  ============================================================ */

  const filteredOrders = useMemo(() => {
    if (warehouse === "All Warehouses") {
      return orders;
    }

    return orders.filter(
      (order) =>
        order.warehouse === warehouse
    );
  }, [warehouse]);

  /* ============================================================
     PAGINATION
  ============================================================ */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length / pageSize
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedOrders =
    filteredOrders.slice(
      (safeCurrentPage - 1) *
        pageSize,
      safeCurrentPage * pageSize
    );

  const startRecord =
    filteredOrders.length === 0
      ? 0
      : (safeCurrentPage - 1) *
          pageSize +
        1;

  const endRecord = Math.min(
    safeCurrentPage * pageSize,
    filteredOrders.length
  );

  /* ============================================================
     FILTER HANDLERS
  ============================================================ */

  const handleWarehouseChange = (
    value: Warehouse
  ) => {
    setWarehouse(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (
    value: number
  ) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  /* ============================================================
     EXCEL EXPORT
  ============================================================ */

  const handleExportExcel = () => {
    const headers = [
      "SO No",
      "Customer",
      "Warehouse",
      "Order Date",
      "Delivery Date",
      "Items",
      "Value",
      "Status",
    ];
    const rows = filteredOrders.map((order) => [
      order.so,
      order.customer,
      order.warehouse,
      order.date,
      order.deliveryDate,
      order.items,
      order.value,
      order.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `Fortuna_Sales_Orders_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ============================================================
     DASHBOARD TOTAL
  ============================================================ */

  const totalValue =
    filteredOrders.reduce(
      (sum, order) =>
        sum + order.value,
      0
    );

  const trend =
    trendData[range];

  const maxTrendValue =
    Math.max(
      ...trend.map(
        (item) => item.value
      )
    );

  const statusTotal =
    statusData.reduce(
      (sum, item) =>
        sum + item.count,
      0
    );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-4">

      <PageBreadcrumb
        pageTitle="Sales Dashboard"
      />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">

        {/* ======================================================
            HEADER
        ======================================================= */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-2">

              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    FORTUNA_RED,
                }}
              />

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Sales Intelligence Dashboard
              </h2>

            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Real-time visibility across
              quotations, sales orders,
              allocation, dispatch and
              invoicing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            {/* Warehouse */}

            <select
              value={warehouse}
              onChange={(e) =>
                handleWarehouseChange(
                  e.target
                    .value as Warehouse
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-[#005F99] dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
            >
              <option>
                All Warehouses
              </option>

              <option>
                Vizag WH
              </option>

              <option>
                Hyderabad WH
              </option>

              <option>
                Chennai WH
              </option>
            </select>

            {/* Date Range */}

            <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-950">

              {[7, 30, 90].map(
                (days) => {
                  const active =
                    range === days;

                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setRange(
                          days as Range
                        )
                      }
                      className={cn(
                        "rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                        active
                          ? "text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      )}
                      style={
                        active
                          ? {
                              backgroundColor:
                                FORTUNA_BLUE,
                            }
                          : undefined
                      }
                    >
                      {days}D
                    </button>
                  );
                }
              )}

            </div>

          </div>
        </div>

        {/* ======================================================
            KPI CARDS
        ======================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <KPI
            title="Total Sales Orders"
            value="1,245"
            accent={FORTUNA_BLUE}
            footer="+12.8% vs previous period"
          />

          <KPI
            title="Pending Approval"
            value="28"
            accent={FORTUNA_RED}
            footer="Requires attention"
          />

          <KPI
            title="Approved Orders"
            value="86"
            accent={FORTUNA_BLUE}
            footer="Ready for allocation"
          />

          <KPI
            title="Allocated Orders"
            value="64"
            accent={FORTUNA_RED}
            footer="Stock successfully reserved"
          />

          <KPI
            title="Ready for Dispatch"
            value="24"
            accent={FORTUNA_BLUE}
            footer="Dispatch planning required"
          />

          <KPI
            title="Dispatched"
            value="51"
            accent={FORTUNA_RED}
            footer="In transit"
          />

          <KPI
            title="Delivered"
            value="911"
            accent={FORTUNA_BLUE}
            footer="73.2% fulfillment"
          />

          <KPI
            title="Sales Value"
            value={inr(12785000)}
            accent={FORTUNA_RED}
            footer="+18.4% vs previous period"
          />

        </div>

        {/* ======================================================
            ACTION SUMMARY
        ======================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          {pendingActions.map(
            (item) => (
              <ActionCard
                key={item.title}
                title={item.title}
                count={item.count}
                description={
                  item.description
                }
                accent={
                  item.accent
                }
              />
            )
          )}

        </div>

        {/* ======================================================
            CHARTS
        ======================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* SALES TREND */}

          <div className="xl:col-span-8">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Sales Order Trend
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Order value performance •
                    Last {range} days
                  </p>
                </div>

                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      FORTUNA_BLUE,
                  }}
                />

              </div>

              <div className="mt-6 flex h-[280px] items-end gap-3 overflow-hidden">

                {trend.map(
                  (item) => {

                    const height =
                      (item.value /
                        maxTrendValue) *
                      210;

                    return (
                      <div
                        key={
                          item.label
                        }
                        className="flex h-full flex-1 flex-col justify-end"
                      >

                        <div className="mb-2 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          {inr(
                            item.value
                          )}
                        </div>

                        <div className="flex h-[210px] items-end justify-center">

                          <div
                            className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[#005F99] via-[#087DBA] to-[#52B6DF] shadow-[0_8px_20px_rgba(0,95,153,0.20)] transition-all duration-500 hover:-translate-y-1"
                            style={{
                              height: `${height}px`,
                            }}
                          />

                        </div>

                        <div className="mt-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          {
                            item.label
                          }
                        </div>

                        <div className="mt-1 text-center text-[10px] text-gray-400">
                          {
                            item.orders
                          }{" "}
                          orders
                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            </div>
          </div>

          {/* ORDER STATUS */}

          <div className="xl:col-span-4">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Order Status
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Current order distribution
                  </p>
                </div>

                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      FORTUNA_RED,
                  }}
                />

              </div>

              <div className="mt-5 space-y-4">

                {statusData.map(
                  (item) => {

                    const percentage =
                      (item.count /
                        statusTotal) *
                      100;

                    return (
                      <div
                        key={
                          item.status
                        }
                      >

                        <div className="mb-1.5 flex items-center justify-between">

                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {
                              item.status
                            }
                          </span>

                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {
                              item.count
                            }
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                item.accent,
                            }}
                          />

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            TOP CUSTOMERS + RECENT ORDERS
        ======================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* TOP CUSTOMERS */}

          <div className="xl:col-span-4">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Top Customers
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Highest sales contribution
                  </p>
                </div>

                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      FORTUNA_BLUE,
                  }}
                />

              </div>

              <div className="mt-5 space-y-3">

                {topCustomers.map(
                  (
                    customer,
                    index
                  ) => (

                    <div
                      key={
                        customer.name
                      }
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-gray-800 dark:bg-white/5"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{
                              backgroundColor:
                                index %
                                  2 ===
                                0
                                  ? FORTUNA_RED
                                  : FORTUNA_BLUE,
                            }}
                          >
                            {index +
                              1}
                          </div>

                          <div className="min-w-0">

                            <div className="truncate text-xs font-bold text-gray-900 dark:text-white">
                              {
                                customer.name
                              }
                            </div>

                            <div className="mt-1 text-[10px] text-gray-500">
                              {
                                customer.orders
                              }{" "}
                              orders
                            </div>

                          </div>

                        </div>

                        <div className="shrink-0 text-right">

                          <div className="text-xs font-bold text-gray-900 dark:text-white">
                            {inr(
                              customer.value
                            )}
                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

          {/* RECENT SALES ORDERS */}

          <div className="xl:col-span-8">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">

              {/* Header */}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Recent Sales Orders
                  </h3>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Latest order activity
                  </p>

                </div>

                <div className="flex items-center gap-3">

                  {/* Excel-compatible CSV */}

                  <button
                    type="button"
                    onClick={
                      handleExportExcel
                    }
                    className="rounded-lg border border-[#005F99]/20 bg-[#005F99]/5 px-3 py-2 text-xs font-semibold text-[#005F99] transition hover:bg-[#005F99] hover:text-white"
                  >
                    ↓ Export CSV
                  </button>

                  {/* View All */}

                  <button
                    type="button"
                    className="text-xs font-semibold hover:underline"
                    style={{
                      color:
                        FORTUNA_BLUE,
                    }}
                  >
                    View All
                  </button>

                </div>

              </div>

              {/* TABLE */}

              <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">

                <table className="min-w-[900px] w-full text-sm">

                  <thead className="bg-[#C8102E]">

                    <tr>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                        SO No
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                        Customer
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                        Warehouse
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                        Order Date
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                        Items
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                        Value
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {paginatedOrders.map(
                      (order) => (

                        <tr
                          key={order.so}
                          className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                        >

                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {order.so}
                          </td>

                          <td className="px-4 py-3">

                            <div className="font-semibold text-gray-900 dark:text-white">
                              {
                                order.customer
                              }
                            </div>

                            <div className="mt-1 text-[10px] text-gray-500">
                              Delivery:{" "}
                              {
                                order.deliveryDate
                              }
                            </div>

                          </td>

                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                            {
                              order.warehouse
                            }
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                            {order.date}
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            {order.items}
                          </td>

                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {inr(
                              order.value
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge
                              status={
                                order.status
                              }
                            />
                          </td>

                        </tr>

                      )
                    )}

                    {paginatedOrders.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-sm text-gray-500"
                        >
                          No sales orders
                          found for the
                          selected
                          warehouse.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  PAGINATION
              ================================================== */}

              <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">

                {/* Record Information */}

                <div className="flex flex-wrap items-center gap-3">

                  <span className="text-xs text-gray-500 dark:text-gray-400">

                    Showing{" "}

                    <span className="font-semibold text-gray-800 dark:text-white">
                      {startRecord}
                    </span>

                    {" – "}

                    <span className="font-semibold text-gray-800 dark:text-white">
                      {endRecord}
                    </span>

                    {" of "}

                    <span className="font-semibold text-gray-800 dark:text-white">
                      {
                        filteredOrders.length
                      }
                    </span>

                  </span>

                  {/* Page Size */}

                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(
                        Number(
                          e.target
                            .value
                        )
                      )
                    }
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value={10}>
                      10 / page
                    </option>

                    <option value={20}>
                      20 / page
                    </option>

                    <option value={50}>
                      50 / page
                    </option>
                  </select>

                </div>

                {/* Pagination Controls */}

                <div className="flex items-center gap-1">

                  {/* Previous */}

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage ===
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}

                  {Array.from(
                    {
                      length:
                        Math.min(
                          totalPages,
                          5
                        ),
                    },
                    (
                      _,
                      index
                    ) =>
                      index + 1
                  ).map(
                    (page) => (

                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        className={cn(
                          "h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition",
                          safeCurrentPage ===
                            page
                            ? "text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                        )}
                        style={
                          safeCurrentPage ===
                          page
                            ? {
                                backgroundColor:
                                  FORTUNA_RED,
                              }
                            : undefined
                        }
                      >
                        {page}
                      </button>

                    )
                  )}

                  {/* Last Page */}

                  {totalPages >
                    5 && (
                    <>
                      <span className="px-1 text-xs text-gray-400">
                        ...
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            totalPages
                          )
                        }
                        className={cn(
                          "h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition",
                          safeCurrentPage ===
                            totalPages
                            ? "text-white"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                        )}
                        style={
                          safeCurrentPage ===
                          totalPages
                            ? {
                                backgroundColor:
                                  FORTUNA_RED,
                              }
                            : undefined
                        }
                      >
                        {
                          totalPages
                        }
                      </button>
                    </>
                  )}

                  {/* Next */}

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage ===
                        totalPages ||
                      filteredOrders.length ===
                        0
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    Next
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            SALES SUMMARY FOOTER
        ======================================================= */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-r from-[#005F99] to-[#003E66] p-5 text-white shadow-[0_12px_35px_rgba(0,95,153,0.18)]">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />

                <span className="text-sm font-bold">
                  Sales Operations Intelligence
                </span>

                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[9px] font-semibold backdrop-blur-md">
                  LIVE
                </span>

              </div>

              <p className="mt-2 text-xs text-white/65">
                Monitor order processing,
                allocation, dispatch
                readiness and invoice
                dependencies from one place.
              </p>

            </div>

            <div className="flex gap-6">

              <div>

                <div className="text-[10px] uppercase tracking-wider text-white/50">
                  Filtered Orders
                </div>

                <div className="mt-1 text-xl font-bold">
                  {
                    filteredOrders.length
                  }
                </div>

              </div>

              <div>

                <div className="text-[10px] uppercase tracking-wider text-white/50">
                  Filtered Value
                </div>

                <div className="mt-1 text-xl font-bold">
                  {inr(
                    totalValue
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

/* ================================================================
   KPI COMPONENT
================================================================ */

function KPI({
  title,
  value,
  accent,
  footer,
}: {
  title: string;
  value: string | number;
  accent: string;
  footer: string;
}) {
  const isRed =
    accent === FORTUNA_RED;

  const gradient = isRed
    ? "from-[#C8102E] via-[#D51F3D] to-[#9F0D25]"
    : "from-[#005F99] via-[#087DBA] to-[#00466F]";

  const glow = isRed
    ? "shadow-[0_12px_35px_rgba(200,16,46,0.20)] hover:shadow-[0_18px_45px_rgba(200,16,46,0.30)]"
    : "shadow-[0_12px_35px_rgba(0,95,153,0.20)] hover:shadow-[0_18px_45px_rgba(0,95,153,0.30)]";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/20",
        "bg-gradient-to-br",
        gradient,
        "p-5 text-white",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1",
        glow
      )}
    >

      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:scale-125" />

      <div className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-70" />

      <div className="relative z-10">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/20">

              <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />

            </span>

            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
              {title}
            </span>

          </div>

          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-md">
            LIVE
          </span>

        </div>

        <div className="mt-5 text-3xl font-bold tracking-tight text-white drop-shadow-sm">
          {value}
        </div>

        <div className="mt-1 text-[11px] font-medium text-white/65">
          {footer}
        </div>

        <div className="mt-5">

          <div className="h-1.5 overflow-hidden rounded-full bg-black/15 ring-1 ring-white/10">

            <div className="h-full w-[52%] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.65)] transition-all duration-700 group-hover:w-[68%]" />

          </div>

        </div>

      </div>

    </div>
  );
}

/* ================================================================
   ACTION CARD
================================================================ */

function ActionCard({
  title,
  count,
  description,
  accent,
}: {
  title: string;
  count: number;
  description: string;
  accent: string;
}) {
  const isRed =
    accent === FORTUNA_RED;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/20",
        "bg-gradient-to-br p-4 text-white",
        isRed
          ? "from-[#C8102E] via-[#D51F3D] to-[#9F0D25]"
          : "from-[#005F99] via-[#087DBA] to-[#00466F]",
        "transition-all duration-300 hover:-translate-y-1",
        isRed
          ? "shadow-[0_10px_28px_rgba(200,16,46,0.18)] hover:shadow-[0_16px_38px_rgba(200,16,46,0.28)]"
          : "shadow-[0_10px_28px_rgba(0,95,153,0.18)] hover:shadow-[0_16px_38px_rgba(0,95,153,0.28)]"
      )}
    >

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10">

        <div className="flex items-center justify-between">

          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
            {title}
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-xs font-bold ring-1 ring-white/20">
            !
          </span>

        </div>

        <div className="mt-3 text-3xl font-bold">
          {count}
        </div>

        <p className="mt-1 text-[11px] text-white/65">
          {description}
        </p>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-black/15">

          <div className="h-full w-[65%] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.65)]" />

        </div>

      </div>

    </div>
  );
}

/* ================================================================
   STATUS BADGE
================================================================ */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const styles: Record<
    OrderStatus,
    string
  > = {
    Draft:
      "bg-gray-100 text-gray-700",

    "Pending Approval":
      "bg-amber-100 text-amber-800",

    Approved:
      "bg-green-100 text-green-700",

    Allocated:
      "bg-blue-100 text-blue-700",

    Picking:
      "bg-purple-100 text-purple-700",

    "Ready for Dispatch":
      "bg-cyan-100 text-cyan-700",

    Dispatched:
      "bg-indigo-100 text-indigo-700",

    Delivered:
      "bg-emerald-100 text-emerald-700",

    "On Hold":
      "bg-rose-100 text-rose-700",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}