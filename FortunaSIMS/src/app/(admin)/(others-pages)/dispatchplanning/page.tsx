"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  Eye,
  Filter,
  Gauge,
  MapPin,
  Navigation,
  PackageCheck,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings2,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ============================================================
   FORTUNA THEME
============================================================ */

const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

/* ============================================================
   TYPES
============================================================ */

type TabKey =
  | "overview"
  | "orders"
  | "create"
  | "routes"
  | "assignment"
  | "execution"
  | "alerts";

type DispatchStatus =
  | "Planned"
  | "Ready"
  | "Dispatched"
  | "In Transit"
  | "Completed"
  | "Delayed"
  | "Cancelled";

type Priority =
  | "Normal"
  | "High"
  | "Urgent";

type Dispatch = {
  id: number;
  dispatchNo: string;
  date: string;
  customer: string;
  orderRef: string;
  origin: string;
  destination: string;
  vehicle: string;
  driver: string;
  driverPhone: string;
  loadType: string;
  quantity: string;
  distance: string;
  plannedDeparture: string;
  eta: string;
  priority: Priority;
  status: DispatchStatus;
  progress: number;
  routeStatus: string;
};

/* ============================================================
   SAMPLE DATA
============================================================ */

const INITIAL_DISPATCHES: Dispatch[] = [
  {
    id: 1,
    dispatchNo: "DSP-2026-0001",
    date: "25-Aug-2026",
    customer: "ABC Manufacturing",
    orderRef: "SO-45821",
    origin: "Visakhapatnam WH",
    destination: "Vijayawada",
    vehicle: "AP31XX1234",
    driver: "Ravi Kumar",
    driverPhone: "9876543210",
    loadType: "Industrial Materials",
    quantity: "18 Ton",
    distance: "350 KM",
    plannedDeparture: "06:30 AM",
    eta: "02:00 PM",
    priority: "High",
    status: "Ready",
    progress: 8,
    routeStatus: "Route Confirmed",
  },
  {
    id: 2,
    dispatchNo: "DSP-2026-0002",
    date: "25-Aug-2026",
    customer: "Global Engineering",
    orderRef: "SO-45845",
    origin: "Hyderabad WH",
    destination: "Bengaluru",
    vehicle: "AP32XX5678",
    driver: "Suresh Rao",
    driverPhone: "9848012345",
    loadType: "Machine Parts",
    quantity: "12 Ton",
    distance: "570 KM",
    plannedDeparture: "07:00 AM",
    eta: "06:00 PM",
    priority: "Normal",
    status: "Planned",
    progress: 0,
    routeStatus: "Route Confirmed",
  },
  {
    id: 3,
    dispatchNo: "DSP-2026-0003",
    date: "25-Aug-2026",
    customer: "Fortuna Customer A",
    orderRef: "SO-45852",
    origin: "Chennai WH",
    destination: "Coimbatore",
    vehicle: "TN09AB7821",
    driver: "Arun Kumar",
    driverPhone: "9912345678",
    loadType: "Finished Goods",
    quantity: "9 Ton",
    distance: "505 KM",
    plannedDeparture: "05:45 AM",
    eta: "01:30 PM",
    priority: "Urgent",
    status: "In Transit",
    progress: 64,
    routeStatus: "On Route",
  },
  {
    id: 4,
    dispatchNo: "DSP-2026-0004",
    date: "25-Aug-2026",
    customer: "South Industrial Corp",
    orderRef: "SO-45860",
    origin: "Hyderabad WH",
    destination: "Chennai",
    vehicle: "TS08CD4432",
    driver: "Mahesh",
    driverPhone: "9988776655",
    loadType: "Raw Materials",
    quantity: "20 Ton",
    distance: "625 KM",
    plannedDeparture: "08:00 AM",
    eta: "08:30 PM",
    priority: "Normal",
    status: "Completed",
    progress: 100,
    routeStatus: "Delivered",
  },
  {
    id: 5,
    dispatchNo: "DSP-2026-0005",
    date: "25-Aug-2026",
    customer: "Eastern Logistics",
    orderRef: "SO-45871",
    origin: "Visakhapatnam WH",
    destination: "Bhubaneswar",
    vehicle: "KA01MN9012",
    driver: "Prakash",
    driverPhone: "9866123456",
    loadType: "General Cargo",
    quantity: "14 Ton",
    distance: "445 KM",
    plannedDeparture: "09:00 AM",
    eta: "07:00 PM",
    priority: "High",
    status: "Delayed",
    progress: 42,
    routeStatus: "Traffic Delay",
  },
];

/* ============================================================
   MAIN PAGE
============================================================ */

export default function DispatchPlanningPage() {
  const [activeTab, setActiveTab] =
    useState<TabKey>("overview");

  const [dispatches, setDispatches] =
    useState<Dispatch[]>(
      INITIAL_DISPATCHES
    );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [priorityFilter, setPriorityFilter] =
    useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(10);

  const [selectedDispatch, setSelectedDispatch] =
    useState<Dispatch | null>(null);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingDispatch, setEditingDispatch] =
    useState<Dispatch | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  /* ============================================================
     FILTERED DATA
  ============================================================ */

  const filteredDispatches = useMemo(() => {
    const text = search
      .trim()
      .toLowerCase();

    return dispatches.filter((item) => {
      const searchMatch =
        !text ||
        item.dispatchNo
          .toLowerCase()
          .includes(text) ||
        item.customer
          .toLowerCase()
          .includes(text) ||
        item.driver
          .toLowerCase()
          .includes(text) ||
        item.vehicle
          .toLowerCase()
          .includes(text) ||
        item.destination
          .toLowerCase()
          .includes(text);

      const statusMatch =
        statusFilter === "All" ||
        item.status === statusFilter;

      const priorityMatch =
        priorityFilter === "All" ||
        item.priority === priorityFilter;

      return (
        searchMatch &&
        statusMatch &&
        priorityMatch
      );
    });
  }, [
    dispatches,
    search,
    statusFilter,
    priorityFilter,
  ]);

  /* ============================================================
     PAGINATION
  ============================================================ */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredDispatches.length /
        itemsPerPage
    )
  );

  const paginatedDispatches =
    filteredDispatches.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage * itemsPerPage
    );

  /* ============================================================
     KPI
  ============================================================ */

  const total = dispatches.length;

  const planned = dispatches.filter(
    (x) =>
      x.status === "Planned" ||
      x.status === "Ready"
  ).length;

  const inTransit = dispatches.filter(
    (x) =>
      x.status === "Dispatched" ||
      x.status === "In Transit"
  ).length;

  const completed = dispatches.filter(
    (x) => x.status === "Completed"
  ).length;

  const delayed = dispatches.filter(
    (x) => x.status === "Delayed"
  ).length;

  /* ============================================================
     OPEN CREATE
  ============================================================ */

  function openCreate() {
    setEditingDispatch(null);
    setShowCreateModal(true);
  }

  /* ============================================================
     OPEN EDIT
  ============================================================ */

  function openEdit(item: Dispatch) {
    setEditingDispatch(item);
    setShowCreateModal(true);
  }

  /* ============================================================
     VIEW
  ============================================================ */

  function openView(item: Dispatch) {
    setSelectedDispatch(item);
    setShowViewModal(true);
  }

  /* ============================================================
     EXPORT
  ============================================================ */

  function exportExcel() {
    const headers = [
      "Dispatch No",
      "Date",
      "Customer",
      "Order Ref",
      "Origin",
      "Destination",
      "Vehicle",
      "Driver",
      "Load Type",
      "Quantity",
      "Distance",
      "Departure",
      "ETA",
      "Priority",
      "Status",
    ];

    const rows = filteredDispatches.map(
      (item) => [
        item.dispatchNo,
        item.date,
        item.customer,
        item.orderRef,
        item.origin,
        item.destination,
        item.vehicle,
        item.driver,
        item.loadType,
        item.quantity,
        item.distance,
        item.plannedDeparture,
        item.eta,
        item.priority,
        item.status,
      ]
    );

    const html = `
      <html>
      <head>
      <meta charset="UTF-8">
      </head>
      <body>
      <table border="1">
        <thead>
          <tr>
            ${headers
              .map(
                (h) =>
                  `<th>${h}</th>`
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (cell) =>
                      `<td>${String(
                        cell ?? ""
                      )}</td>`
                  )
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
      </body>
      </html>
    `;

    const blob = new Blob(
      [html],
      {
        type: "application/vnd.ms-excel",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "Fortuna_Dispatch_Planning.xls";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /* ============================================================
     TAB DEFINITIONS
  ============================================================ */

  const tabs: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "overview",
      label: "Overview",
      icon: <Gauge size={16} />,
    },
    {
      key: "orders",
      label: "Dispatch Orders",
      icon: <PackageCheck size={16} />,
    },
    {
      key: "create",
      label: "Create Dispatch",
      icon: <Plus size={16} />,
    },
    {
      key: "routes",
      label: "Route Planning",
      icon: <Route size={16} />,
    },
    {
      key: "assignment",
      label: "Assignment",
      icon: <Users size={16} />,
    },
    {
      key: "execution",
      label: "Execution",
      icon: <Navigation size={16} />,
    },
    {
      key: "alerts",
      label: "Alerts",
      icon: <AlertTriangle size={16} />,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#005F99] via-[#005F99] to-[#C8102E] p-6 text-white shadow-[0_15px_45px_rgba(0,95,153,0.20)]">

        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#C8102E]/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Truck size={19} />
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                Fleet & Logistics
              </span>

            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Dispatch Planning
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
              Plan, assign, execute and monitor
              fleet dispatch operations from a
              single operational workspace.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <Download size={17} />
              Export
            </button>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#C8102E] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Plus size={17} />
              Plan Dispatch
            </button>

          </div>

        </div>

      </div>

      {/* ======================================================
          TABS
      ====================================================== */}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex min-w-max gap-1">

          {tabs.map((tab) => {

            const active =
              activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => {

                  if (
                    tab.key ===
                    "create"
                  ) {
                    openCreate();
                    return;
                  }

                  setActiveTab(
                    tab.key
                  );
                }}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#C8102E] to-[#005F99] text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-50 hover:text-[#005F99] dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}

        </div>

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      {activeTab === "overview" && (
        <OverviewTab
          dispatches={dispatches}
          total={total}
          planned={planned}
          inTransit={inTransit}
          completed={completed}
          delayed={delayed}
          onView={openView}
          onCreate={openCreate}
          onTab={setActiveTab}
        />
      )}

      {activeTab === "orders" && (
        <OrdersTab
          dispatches={paginatedDispatches}
          filteredCount={
            filteredDispatches.length
          }
          search={search}
          setSearch={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          setStatusFilter={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          priorityFilter={
            priorityFilter
          }
          setPriorityFilter={(value) => {
            setPriorityFilter(value);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
          onPrevious={() =>
            setCurrentPage((p) =>
              Math.max(1, p - 1)
            )
          }
          onNext={() =>
            setCurrentPage((p) =>
              Math.min(
                totalPages,
                p + 1
              )
            )
          }
          onView={openView}
          onEdit={openEdit}
          onExport={exportExcel}
          onCreate={openCreate}
        />
      )}

      {activeTab === "routes" && (
        <RoutePlanningTab
          dispatches={dispatches}
        />
      )}

      {activeTab === "assignment" && (
        <AssignmentTab
          dispatches={dispatches}
        />
      )}

      {activeTab === "execution" && (
        <ExecutionTab
          dispatches={dispatches}
          onView={openView}
        />
      )}

      {activeTab === "alerts" && (
        <AlertsTab
          dispatches={dispatches}
          onView={openView}
        />
      )}

      {/* ======================================================
          VIEW MODAL
      ====================================================== */}

      {showViewModal &&
        selectedDispatch && (
          <ViewDispatchModal
            dispatch={
              selectedDispatch
            }
            onClose={() =>
              setShowViewModal(false)
            }
            onEdit={() => {
              setShowViewModal(
                false
              );
              openEdit(
                selectedDispatch
              );
            }}
          />
        )}

      {/* ======================================================
          CREATE MODAL
      ====================================================== */}

      {showCreateModal && (
        <CreateDispatchModal
          dispatch={
            editingDispatch
          }
          onClose={() =>
            setShowCreateModal(
              false
            )
          }
          onSave={(item) => {

            if (editingDispatch) {

              setDispatches(
                (prev) =>
                  prev.map(
                    (existing) =>
                      existing.id ===
                      item.id
                        ? item
                        : existing
                  )
              );

            } else {

              setDispatches(
                (prev) => [
                  {
                    ...item,
                    id: Date.now(),
                  },
                  ...prev,
                ]
              );

            }

            setShowCreateModal(
              false
            );

            setActiveTab(
              "orders"
            );
          }}
        />
      )}

    </div>
  );
}

/* ============================================================
   OVERVIEW TAB
============================================================ */

function OverviewTab({
  dispatches,
  total,
  planned,
  inTransit,
  completed,
  delayed,
  onView,
  onCreate,
  onTab,
}: {
  dispatches: Dispatch[];
  total: number;
  planned: number;
  inTransit: number;
  completed: number;
  delayed: number;
  onView: (item: Dispatch) => void;
  onCreate: () => void;
  onTab: (tab: TabKey) => void;
}) {
  return (
    <div className="space-y-6">

      {/* KPI */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <KpiCard
          title="Total Dispatches"
          value={total}
          subtitle="Today's operational plan"
          icon={<Route size={20} />}
          variant="blue"
        />

        <KpiCard
          title="Planned / Ready"
          value={planned}
          subtitle="Awaiting departure"
          icon={<Clock3 size={20} />}
          variant="red"
        />

        <KpiCard
          title="In Transit"
          value={inTransit}
          subtitle="Active fleet movement"
          icon={<Navigation size={20} />}
          variant="blue"
        />

        <KpiCard
          title="Completed"
          value={completed}
          subtitle="Successfully delivered"
          icon={
            <CheckCircle2 size={20} />
          }
          variant="red"
        />

        <KpiCard
          title="Exceptions"
          value={delayed}
          subtitle="Needs attention"
          icon={
            <AlertTriangle size={20} />
          }
          variant="blue"
        />

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ACTIVE DISPATCHES */}

        <div className="xl:col-span-2">

          <Panel
            title="Today's Dispatch Activity"
            subtitle="Current fleet movement and operational status."
            action={
              <button
                onClick={() =>
                  onTab("orders")
                }
                className="text-xs font-bold text-[#005F99] hover:underline"
              >
                View All
              </button>
            }
          >

            <div className="space-y-3">

              {dispatches.map(
                (item) => (
                  <DispatchMiniCard
                    key={item.id}
                    item={item}
                    onView={() =>
                      onView(item)
                    }
                  />
                )
              )}

            </div>

          </Panel>

        </div>

        {/* QUICK ACTIONS */}

        <Panel
          title="Quick Actions"
          subtitle="Common dispatch operations."
        >

          <div className="grid grid-cols-2 gap-3">

            <QuickAction
              icon={<Plus size={18} />}
              title="New Dispatch"
              subtitle="Create plan"
              color="red"
              onClick={onCreate}
            />

            <QuickAction
              icon={
                <Users size={18} />
              }
              title="Assignment"
              subtitle="Vehicle & driver"
              color="blue"
              onClick={() =>
                onTab(
                  "assignment"
                )
              }
            />

            <QuickAction
              icon={
                <Route size={18} />
              }
              title="Routes"
              subtitle="Plan routes"
              color="blue"
              onClick={() =>
                onTab("routes")
              }
            />

            <QuickAction
              icon={
                <AlertTriangle
                  size={18}
                />
              }
              title="Alerts"
              subtitle="Exceptions"
              color="red"
              onClick={() =>
                onTab("alerts")
              }
            />

          </div>

          <div className="mt-5 rounded-xl bg-gradient-to-br from-[#005F99]/10 to-[#C8102E]/10 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#005F99] shadow-sm dark:bg-gray-900">
                <Zap size={17} />
              </div>

              <div>

                <p className="text-xs font-bold text-gray-800 dark:text-white">
                  Dispatch Efficiency
                </p>

                <p className="mt-1 text-2xl font-bold text-[#005F99]">
                  94.2%
                </p>

                <p className="mt-1 text-[11px] text-gray-500">
                  +4.8% compared with last week
                </p>

              </div>

            </div>

          </div>

        </Panel>

      </div>

      {/* PERFORMANCE */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <PerformanceCard
          title="On-Time Dispatch"
          value="96.4%"
          detail="Target 95%"
          percentage={96}
          variant="blue"
        />

        <PerformanceCard
          title="Vehicle Utilization"
          value="87.8%"
          detail="Target 85%"
          percentage={88}
          variant="red"
        />

        <PerformanceCard
          title="Route Compliance"
          value="93.6%"
          detail="Target 92%"
          percentage={94}
          variant="blue"
        />

      </div>

    </div>
  );
}

/* ============================================================
   ORDERS TAB
============================================================ */

function OrdersTab({
  dispatches,
  filteredCount,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  currentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  onPrevious,
  onNext,
  onView,
  onEdit,
  onExport,
  onCreate,
}: {
  dispatches: Dispatch[];
  filteredCount: number;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (v: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onView: (item: Dispatch) => void;
  onEdit: (item: Dispatch) => void;
  onExport: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-5">

      <Panel
        title="Dispatch Orders"
        subtitle="Manage all planned fleet dispatches."
        action={
          <div className="flex gap-2">

            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-lg bg-[#005F99] px-3 py-2 text-xs font-bold text-white"
            >
              <Download size={14} />
              Excel
            </button>

            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C8102E] px-3 py-2 text-xs font-bold text-white"
            >
              <Plus size={14} />
              New
            </button>

          </div>
        }
      >

        {/* FILTERS */}

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">

          <div className="relative lg:col-span-2">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search dispatch, customer, vehicle, driver..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="All">
              All Status
            </option>
            <option value="Planned">
              Planned
            </option>
            <option value="Ready">
              Ready
            </option>
            <option value="In Transit">
              In Transit
            </option>
            <option value="Completed">
              Completed
            </option>
            <option value="Delayed">
              Delayed
            </option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(
                e.target.value
              )
            }
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="All">
              All Priority
            </option>
            <option value="Normal">
              Normal
            </option>
            <option value="High">
              High
            </option>
            <option value="Urgent">
              Urgent
            </option>
          </select>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1350px]">

            <thead>

              <tr className="bg-gradient-to-r from-[#C8102E] to-[#A50E27]">

                {[
                  "Dispatch",
                  "Customer / Route",
                  "Vehicle",
                  "Driver",
                  "Load",
                  "Schedule",
                  "Priority",
                  "Status",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white"
                  >
                    {head}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {dispatches.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-16 text-center text-sm text-gray-500"
                  >
                    No dispatches found.
                  </td>
                </tr>
              ) : (
                dispatches.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-[#005F99]/[0.025]"
                    >

                      <td className="px-4 py-4">

                        <div className="font-bold text-gray-800 dark:text-white">
                          {
                            item.dispatchNo
                          }
                        </div>

                        <div className="mt-1 text-[11px] text-gray-400">
                          {
                            item.orderRef
                          }
                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="font-semibold text-gray-800 dark:text-white">
                          {
                            item.customer
                          }
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                          <MapPin
                            size={11}
                          />
                          {
                            item.origin
                          }
                          <ArrowRight
                            size={11}
                          />
                          {
                            item.destination
                          }
                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2">

                          <Truck
                            size={15}
                            className="text-[#005F99]"
                          />

                          <span className="text-sm font-semibold">
                            {
                              item.vehicle
                            }
                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2">

                          <Users
                            size={15}
                            className="text-[#C8102E]"
                          />

                          <div>
                            <div className="text-sm font-semibold">
                              {
                                item.driver
                              }
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {
                                item.driverPhone
                              }
                            </div>
                          </div>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="text-sm font-bold">
                          {
                            item.quantity
                          }
                        </div>

                        <div className="text-[10px] text-gray-400">
                          {
                            item.loadType
                          }
                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="text-sm font-semibold">
                          {
                            item.plannedDeparture
                          }
                        </div>

                        <div className="text-[10px] text-gray-400">
                          ETA:{" "}
                          {item.eta}
                        </div>

                      </td>

                      <td className="px-4 py-4">
                        <PriorityBadge
                          priority={
                            item.priority
                          }
                        />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </td>

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-1">

                          <IconButton
                            icon={
                              <Eye
                                size={15}
                              />
                            }
                            title="View"
                            onClick={() =>
                              onView(
                                item
                              )
                            }
                            color="blue"
                          />

                          <IconButton
                            icon={
                              <Edit3
                                size={15}
                              />
                            }
                            title="Edit"
                            onClick={() =>
                              onEdit(
                                item
                              )
                            }
                            color="red"
                          />

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">

          <span>
            Showing{" "}
            <b>
              {filteredCount === 0
                ? 0
                : (currentPage - 1) *
                    itemsPerPage +
                  1}
            </b>{" "}
            -{" "}
            <b>
              {Math.min(
                currentPage *
                  itemsPerPage,
                filteredCount
              )}
            </b>{" "}
            of{" "}
            <b>{filteredCount}</b>
          </span>

          <div className="flex items-center gap-2">

            <select
              value={itemsPerPage}
              onChange={(e) =>
                setItemsPerPage(
                  Number(
                    e.target.value
                  )
                )
              }
              className="rounded-lg border border-gray-200 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value={5}>
                5 / page
              </option>
              <option value={10}>
                10 / page
              </option>
              <option value={25}>
                25 / page
              </option>
            </select>

            <button
              onClick={onPrevious}
              disabled={
                currentPage === 1
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronLeft
                size={15}
              />
            </button>

            <span className="rounded-lg bg-[#005F99] px-3 py-2 font-bold text-white">
              {currentPage} /{" "}
              {totalPages}
            </span>

            <button
              onClick={onNext}
              disabled={
                currentPage ===
                totalPages
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronRight
                size={15}
              />
            </button>

          </div>

        </div>

      </Panel>

    </div>
  );
}

/* ============================================================
   ROUTE PLANNING
============================================================ */

function RoutePlanningTab({
  dispatches,
}: {
  dispatches: Dispatch[];
}) {
  const [showRouteModal, setShowRouteModal] =
    useState(false);

  const [routes, setRoutes] =
    useState<Dispatch[]>(dispatches);

  const [routeForm, setRouteForm] = useState({
    origin: "",
    destination: "",
    distance: "",
    date: "25-Aug-2026",
    routeType: "Standard",
    priority: "Normal",
    vehicle: "Unassigned",
    driver: "Unassigned",
  });

  function updateRouteField(
    field: keyof typeof routeForm,
    value: string
  ) {
    setRouteForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function saveRoute(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !routeForm.origin.trim() ||
      !routeForm.destination.trim() ||
      !routeForm.distance.trim()
    ) {
      alert(
        "Please enter Origin, Destination and Distance."
      );
      return;
    }

    const newRoute: Dispatch = {
      id: Date.now(),

      dispatchNo: `DSP-2026-${String(
        routes.length + 1
      ).padStart(4, "0")}`,

      date: routeForm.date,

      customer: "Route Planning",

      orderRef: "ROUTE-PLANNED",

      origin: routeForm.origin,

      destination:
        routeForm.destination,

      vehicle: routeForm.vehicle,

      driver: routeForm.driver,

      driverPhone: "",

      loadType: "Route Movement",

      quantity: "-",

      distance:
        routeForm.distance,

      plannedDeparture: "--",

      eta: "--",

      priority:
        routeForm.priority as Priority,

      status: "Planned",

      progress: 0,

      routeStatus: "Route Confirmed",
    };

    setRoutes((prev) => [
      newRoute,
      ...prev,
    ]);

    setRouteForm({
      origin: "",
      destination: "",
      distance: "",
      date: "25-Aug-2026",
      routeType: "Standard",
      priority: "Normal",
      vehicle: "Unassigned",
      driver: "Unassigned",
    });

    setShowRouteModal(false);
  }

  return (
    <>
      <div className="space-y-6">

        {/* =====================================================
            ROUTE KPIs
        ===================================================== */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          <RouteKpi
            title="Active Routes"
            value={String(routes.length)}
            icon={
              <Navigation size={19} />
            }
            variant="blue"
          />

          <RouteKpi
            title="Total Distance"
            value="5,840 KM"
            icon={
              <Route size={19} />
            }
            variant="red"
          />

          <RouteKpi
            title="Route Compliance"
            value="93.6%"
            icon={
              <CheckCircle2 size={19} />
            }
            variant="blue"
          />

        </div>

        {/* =====================================================
            ROUTE PLANNING WORKSPACE
        ===================================================== */}

        <Panel
          title="Route Planning Workspace"
          subtitle="Monitor planned origin-to-destination movements."
          action={
            <button
              onClick={() =>
                setShowRouteModal(true)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#005F99] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#005F99]/20 transition hover:-translate-y-0.5 hover:bg-[#004C7A]"
            >
              <Plus size={15} />
              Add Route
            </button>
          }
        >

          <div className="space-y-4">

            {routes.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4 transition hover:border-[#005F99]/30 hover:shadow-sm dark:border-gray-800"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* Route Info */}

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white shadow-sm">
                        <Route
                          size={19}
                        />
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="font-bold text-gray-800 dark:text-white">
                            {
                              item.dispatchNo
                            }
                          </span>

                          <StatusBadge
                            status={
                              item.status
                            }
                          />

                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">

                          <span className="font-medium">
                            {
                              item.origin
                            }
                          </span>

                          <ArrowRight
                            size={13}
                            className="text-[#C8102E]"
                          />

                          <span className="font-medium">
                            {
                              item.destination
                            }
                          </span>

                          <span className="ml-2 rounded-full bg-[#005F99]/10 px-2.5 py-1 font-semibold text-[#005F99]">
                            {
                              item.distance
                            }
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* Route Progress */}

                    <div className="min-w-[220px]">

                      <div className="mb-1 flex justify-between text-[11px]">

                        <span className="text-gray-500">
                          Route Progress
                        </span>

                        <span className="font-bold text-[#005F99]">
                          {
                            item.progress
                          }
                          %
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E] transition-all"
                          style={{
                            width: `${item.progress}%`,
                          }}
                        />

                      </div>

                      <p className="mt-1 text-[10px] text-gray-400">
                        {
                          item.routeStatus
                        }
                      </p>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </Panel>

      </div>

      {/* =====================================================
          ADD ROUTE MODAL
      ===================================================== */}

      {showRouteModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

            {/* Modal Header */}

            <div className="relative overflow-hidden bg-gradient-to-br from-[#005F99] to-[#C8102E] p-6 text-white">

              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Route size={20} />
                  </div>

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      Fleet & Logistics
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Add Route
                    </h2>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowRouteModal(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            {/* Form */}

            <form
              onSubmit={saveRoute}
              className="p-6"
            >

              <div className="space-y-6">

                {/* Route Details */}

                <div>

                  <div className="mb-4 flex items-center gap-3">

                    <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#C8102E] to-[#005F99]" />

                    <div>

                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Route Details
                      </h3>

                      <p className="text-[11px] text-gray-500">
                        Define origin and destination for the route.
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {/* Origin */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Origin
                        <span className="ml-1 text-[#C8102E]">
                          *
                        </span>
                      </label>

                      <div className="relative">

                        <MapPin
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#005F99]"
                        />

                        <input
                          value={
                            routeForm.origin
                          }
                          onChange={(e) =>
                            updateRouteField(
                              "origin",
                              e.target
                                .value
                            )
                          }
                          placeholder="e.g. Visakhapatnam WH"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />

                      </div>

                    </div>

                    {/* Destination */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Destination
                        <span className="ml-1 text-[#C8102E]">
                          *
                        </span>
                      </label>

                      <div className="relative">

                        <Navigation
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8102E]"
                        />

                        <input
                          value={
                            routeForm.destination
                          }
                          onChange={(e) =>
                            updateRouteField(
                              "destination",
                              e.target
                                .value
                            )
                          }
                          placeholder="e.g. Vijayawada"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />

                      </div>

                    </div>

                    {/* Distance */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Estimated Distance
                        <span className="ml-1 text-[#C8102E]">
                          *
                        </span>
                      </label>

                      <input
                        value={
                          routeForm.distance
                        }
                        onChange={(e) =>
                          updateRouteField(
                            "distance",
                            e.target
                              .value
                          )
                        }
                        placeholder="e.g. 350 KM"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      />

                    </div>

                    {/* Date */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Route Date
                      </label>

                      <div className="relative">

                        <CalendarDays
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#005F99]"
                        />

                        <input
                          value={
                            routeForm.date
                          }
                          onChange={(e) =>
                            updateRouteField(
                              "date",
                              e.target
                                .value
                            )
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />

                      </div>

                    </div>

                  </div>

                </div>

                {/* Assignment */}

                <div>

                  <div className="mb-4 flex items-center gap-3">

                    <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#005F99] to-[#C8102E]" />

                    <div>

                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Fleet Assignment
                      </h3>

                      <p className="text-[11px] text-gray-500">
                        Optionally assign vehicle and driver.
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {/* Vehicle */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Vehicle
                      </label>

                      <select
                        value={
                          routeForm.vehicle
                        }
                        onChange={(e) =>
                          updateRouteField(
                            "vehicle",
                            e.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      >

                        <option>
                          Unassigned
                        </option>

                        <option>
                          AP31XX1234
                        </option>

                        <option>
                          AP32XX5678
                        </option>

                        <option>
                          TN09AB7821
                        </option>

                        <option>
                          TS08CD4432
                        </option>

                        <option>
                          KA01MN9012
                        </option>

                      </select>

                    </div>

                    {/* Driver */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Driver
                      </label>

                      <select
                        value={
                          routeForm.driver
                        }
                        onChange={(e) =>
                          updateRouteField(
                            "driver",
                            e.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      >

                        <option>
                          Unassigned
                        </option>

                        <option>
                          Ravi Kumar
                        </option>

                        <option>
                          Suresh Rao
                        </option>

                        <option>
                          Arun Kumar
                        </option>

                        <option>
                          Mahesh
                        </option>

                        <option>
                          Prakash
                        </option>

                      </select>

                    </div>

                    {/* Route Type */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Route Type
                      </label>

                      <select
                        value={
                          routeForm.routeType
                        }
                        onChange={(e) =>
                          updateRouteField(
                            "routeType",
                            e.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      >

                        <option>
                          Standard
                        </option>

                        <option>
                          Express
                        </option>

                        <option>
                          Multi-Stop
                        </option>

                        <option>
                          Priority
                        </option>

                      </select>

                    </div>

                    {/* Priority */}

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Priority
                      </label>

                      <select
                        value={
                          routeForm.priority
                        }
                        onChange={(e) =>
                          updateRouteField(
                            "priority",
                            e.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      >

                        <option>
                          Normal
                        </option>

                        <option>
                          High
                        </option>

                        <option>
                          Urgent
                        </option>

                      </select>

                    </div>

                  </div>

                </div>

                {/* Route Preview */}

                <div className="rounded-xl border border-[#005F99]/15 bg-gradient-to-r from-[#005F99]/5 to-[#C8102E]/5 p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#005F99] shadow-sm dark:bg-gray-900">
                      <Route
                        size={16}
                      />
                    </div>

                    <div className="min-w-0">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Route Preview
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">

                        <span>
                          {routeForm.origin ||
                            "Origin"}
                        </span>

                        <ArrowRight
                          size={15}
                          className="text-[#C8102E]"
                        />

                        <span>
                          {routeForm.destination ||
                            "Destination"}
                        </span>

                        {routeForm.distance && (
                          <span className="rounded-full bg-[#005F99]/10 px-2 py-1 text-[10px] font-bold text-[#005F99]">
                            {
                              routeForm.distance
                            }
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* Footer */}

              <div className="mt-7 flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">

                <button
                  type="button"
                  onClick={() =>
                    setShowRouteModal(
                      false
                    )
                  }
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C8102E] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#C8102E]/20 transition hover:-translate-y-0.5 hover:bg-[#A80D26]"
                >
                  <CheckCircle2
                    size={16}
                  />
                  Save Route
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </>
  );
}

/* ============================================================
   ASSIGNMENT
============================================================ */

function AssignmentTab({
  dispatches,
}: {
  dispatches: Dispatch[];
}) {
  const vehicles = [
    {
      no: "AP31XX1234",
      type: "Heavy Truck",
      capacity: "20 Ton",
      status: "Assigned",
      driver: "Ravi Kumar",
    },
    {
      no: "AP32XX5678",
      type: "Container",
      capacity: "16 Ton",
      status: "Available",
      driver: "Unassigned",
    },
    {
      no: "TN09AB7821",
      type: "Heavy Truck",
      capacity: "12 Ton",
      status: "Assigned",
      driver: "Arun Kumar",
    },
    {
      no: "TS08CD4432",
      type: "Trailer",
      capacity: "25 Ton",
      status: "Assigned",
      driver: "Mahesh",
    },
  ];

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        <AssignmentKpi
          title="Available Vehicles"
          value="18"
          icon={
            <Truck size={19} />
          }
          variant="blue"
        />

        <AssignmentKpi
          title="Available Drivers"
          value="24"
          icon={
            <Users size={19} />
          }
          variant="red"
        />

        <AssignmentKpi
          title="Assignment Conflicts"
          value="02"
          icon={
            <AlertTriangle
              size={19}
            />
          }
          variant="blue"
        />

      </div>

      <Panel
        title="Vehicle & Driver Assignment"
        subtitle="Manage fleet resources against planned dispatches."
        action={
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#C8102E] px-3 py-2 text-xs font-bold text-white">
            <Settings2 size={14} />
            Manage Assignment
          </button>
        }
      >

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>

              <tr className="border-b border-gray-200 dark:border-gray-800">

                {[
                  "Vehicle",
                  "Type",
                  "Capacity",
                  "Driver",
                  "Availability",
                  "Action",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400"
                  >
                    {head}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {vehicles.map(
                (vehicle) => (
                  <tr
                    key={
                      vehicle.no
                    }
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-2">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#005F99]/10 text-[#005F99]">
                          <Truck
                            size={16}
                          />
                        </div>

                        <span className="font-bold">
                          {
                            vehicle.no
                          }
                        </span>

                      </div>

                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {
                        vehicle.type
                      }
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold">
                      {
                        vehicle.capacity
                      }
                    </td>

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-2">

                        <Users
                          size={14}
                          className="text-[#C8102E]"
                        />

                        <span className="text-sm font-semibold">
                          {
                            vehicle.driver
                          }
                        </span>

                      </div>

                    </td>

                    <td className="px-4 py-4">

                      {vehicle.status ===
                      "Available" ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                          Available
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#005F99]">
                          Assigned
                        </span>
                      )}

                    </td>

                    <td className="px-4 py-4">

                      <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#005F99] hover:text-[#005F99] dark:border-gray-700 dark:text-gray-300">
                        Assign
                      </button>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </Panel>

    </div>
  );
}

/* ============================================================
   EXECUTION
============================================================ */

function ExecutionTab({
  dispatches,
  onView,
}: {
  dispatches: Dispatch[];
  onView: (item: Dispatch) => void;
}) {
  const executionStages: {
    status: DispatchStatus;
    color: string;
  }[] = [
    {
      status: "Planned",
      color: FORTUNA_BLUE,
    },
    {
      status: "Ready",
      color: FORTUNA_RED,
    },
    {
      status: "In Transit",
      color: "#D97706",
    },
    {
      status: "Completed",
      color: "#059669",
    },
  ];

  return (
    <div className="space-y-6">

      <Panel
        title="Dispatch Execution Board"
        subtitle="Live operational status of today's dispatches."
      >

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

          {executionStages.map(
            (stage) => {

              const items =
                dispatches.filter(
                  (item) =>
                    item.status ===
                    stage.status
                );

              return (
                <div
                  key={
                    stage.status
                  }
                  className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950"
                >

                  <div className="mb-3 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            stage.color,
                        }}
                      />

                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {
                          stage.status
                        }
                      </span>

                    </div>

                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-gray-500 shadow-sm dark:bg-gray-900">
                      {
                        items.length
                      }
                    </span>

                  </div>

                  <div className="space-y-2">

                    {items.length ===
                    0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-[11px] text-gray-400 dark:border-gray-700">
                        No dispatches
                      </div>
                    ) : (
                      items.map(
                        (item) => (
                          <button
                            key={
                              item.id
                            }
                            onClick={() =>
                              onView(
                                item
                              )
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#005F99]/30 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                          >

                            <div className="flex items-center justify-between">

                              <span className="text-xs font-bold text-gray-800 dark:text-white">
                                {
                                  item.dispatchNo
                                }
                              </span>

                              <span className="text-[10px] font-bold text-[#005F99]">
                                {
                                  item.progress
                                }
                                %
                              </span>

                            </div>

                            <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {
                                item.customer
                              }
                            </p>

                            <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">

                              {
                                item.origin
                              }

                              <ArrowRight
                                size={10}
                              />

                              {
                                item.destination
                              }

                            </div>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
                                style={{
                                  width: `${item.progress}%`,
                                }}
                              />

                            </div>

                          </button>
                        )
                      )
                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

      </Panel>

      {/* TIMELINE */}

      <Panel
        title="Operational Timeline"
        subtitle="Latest dispatch milestones."
      >

        <div className="space-y-5">

          {dispatches
            .slice(0, 5)
            .map((item, index) => (
              <div
                key={item.id}
                className="flex gap-4"
              >

                <div className="flex flex-col items-center">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white">
                    <Truck
                      size={15}
                    />
                  </div>

                  {index !==
                    dispatches.length -
                      1 && (
                    <div className="mt-1 h-full w-px bg-gray-200 dark:bg-gray-800" />
                  )}

                </div>

                <div className="pb-5">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {
                        item.dispatchNo
                      }
                    </span>

                    <StatusBadge
                      status={
                        item.status
                      }
                    />

                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      item.origin
                    }{" "}
                    →{" "}
                    {
                      item.destination
                    }
                  </p>

                  <p className="mt-1 text-[10px] text-gray-400">
                    Driver:{" "}
                    {
                      item.driver
                    }{" "}
                    • Vehicle:{" "}
                    {
                      item.vehicle
                    }
                  </p>

                </div>

              </div>
            ))}

        </div>

      </Panel>

    </div>
  );
}

/* ============================================================
   ALERTS
============================================================ */

function AlertsTab({
  dispatches,
  onView,
}: {
  dispatches: Dispatch[];
  onView: (item: Dispatch) => void;
}) {
  const alerts = dispatches.filter(
    (item) =>
      item.status ===
        "Delayed" ||
      item.priority === "Urgent"
  );

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <AlertKpi
          title="Critical"
          value="01"
          icon={
            <AlertTriangle
              size={18}
            />
          }
          variant="red"
        />

        <AlertKpi
          title="Warnings"
          value="03"
          icon={
            <Clock3 size={18} />
          }
          variant="blue"
        />

        <AlertKpi
          title="Resolved"
          value="12"
          icon={
            <CheckCircle2
              size={18}
            />
          }
          variant="blue"
        />

      </div>

      <Panel
        title="Dispatch Exceptions & Alerts"
        subtitle="Operational exceptions requiring attention."
        action={
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300">
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      >

        <div className="space-y-3">

          {alerts.map((item) => {

            const urgent =
              item.priority ===
              "Urgent";

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  urgent
                    ? "border-[#C8102E]/20 bg-[#C8102E]/5"
                    : "border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5"
                }`}
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex items-start gap-3">

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        urgent
                          ? "bg-[#C8102E]/10 text-[#C8102E]"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <AlertTriangle
                        size={18}
                      />
                    </div>

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="text-sm font-bold text-gray-800 dark:text-white">
                          {
                            item.dispatchNo
                          }
                        </span>

                        <PriorityBadge
                          priority={
                            item.priority
                          }
                        />

                      </div>

                      <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {item.status ===
                        "Delayed"
                          ? "Dispatch delay detected"
                          : "Urgent dispatch requires attention"}
                      </p>

                      <p className="mt-1 text-[11px] text-gray-500">
                        {
                          item.origin
                        }{" "}
                        →{" "}
                        {
                          item.destination
                        }{" "}
                        • Vehicle:{" "}
                        {
                          item.vehicle
                        }
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        onView(item)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#005F99] hover:text-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <Eye size={14} />
                      View
                    </button>

                    <button className="inline-flex items-center gap-2 rounded-lg bg-[#005F99] px-3 py-2 text-xs font-bold text-white">
                      Resolve
                    </button>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </Panel>

    </div>
  );
}

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  variant: "red" | "blue";
}) {
  const gradient =
    variant === "red"
      ? "from-[#C8102E] via-[#D31B3A] to-[#9D0D25]"
      : "from-[#005F99] via-[#087EBB] to-[#00466F]";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg transition duration-300 hover:-translate-y-1`}
    >

      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl transition group-hover:scale-125" />

      <div className="relative">

        <div className="flex items-center justify-between">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            {icon}
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
            Today
          </span>

        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/65">
          {title}
        </p>

        <p className="mt-1 text-3xl font-bold">
          {value}
        </p>

        <p className="mt-1 text-[11px] text-white/60">
          {subtitle}
        </p>

      </div>

    </div>
  );
}

/* ============================================================
   PANEL
============================================================ */

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}

        </div>

        {action}

      </div>

      <div className="p-5">
        {children}
      </div>

    </div>
  );
}

/* ============================================================
   DISPATCH MINI CARD
============================================================ */

function DispatchMiniCard({
  item,
  onView,
}: {
  item: Dispatch;
  onView: () => void;
}) {
  return (
    <button
      onClick={onView}
      className="group w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#005F99]/30 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
    >

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

        <div className="flex items-center gap-3 lg:w-[260px]">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white">
            <Truck size={17} />
          </div>

          <div>

            <p className="text-xs font-bold text-gray-800 dark:text-white">
              {item.dispatchNo}
            </p>

            <p className="mt-1 text-[10px] text-gray-400">
              {item.customer}
            </p>

          </div>

        </div>

        <div className="flex-1">

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">

            <span>
              {item.origin}
            </span>

            <ArrowRight
              size={13}
              className="text-[#C8102E]"
            />

            <span>
              {item.destination}
            </span>

          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

            <div
              className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
              style={{
                width: `${item.progress}%`,
              }}
            />

          </div>

        </div>

        <div className="flex items-center gap-3">

          <PriorityBadge
            priority={item.priority}
          />

          <StatusBadge
            status={item.status}
          />

        </div>

      </div>

    </button>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon,
  title,
  subtitle,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: "red" | "blue";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
    >

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          color === "red"
            ? "bg-[#C8102E]/10 text-[#C8102E]"
            : "bg-[#005F99]/10 text-[#005F99]"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 text-xs font-bold text-gray-800 dark:text-white">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-gray-400">
        {subtitle}
      </p>

    </button>
  );
}

/* ============================================================
   PERFORMANCE
============================================================ */

function PerformanceCard({
  title,
  value,
  detail,
  percentage,
  variant,
}: {
  title: string;
  value: string;
  detail: string;
  percentage: number;
  variant: "red" | "blue";
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

      <div className="flex items-center justify-between">

        <span className="text-xs font-semibold text-gray-500">
          {title}
        </span>

        <span
          className={`text-lg font-bold ${
            variant === "red"
              ? "text-[#C8102E]"
              : "text-[#005F99]"
          }`}
        >
          {value}
        </span>

      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

        <div
          className={`h-full rounded-full ${
            variant === "red"
              ? "bg-gradient-to-r from-[#C8102E] to-[#E0445E]"
              : "bg-gradient-to-r from-[#005F99] to-[#16A1D8]"
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <p className="mt-2 text-[10px] text-gray-400">
        {detail}
      </p>

    </div>
  );
}

/* ============================================================
   ROUTE KPI
============================================================ */

function RouteKpi({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant: "red" | "blue";
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          variant === "red"
            ? "bg-[#C8102E]/10 text-[#C8102E]"
            : "bg-[#005F99]/10 text-[#005F99]"
        }`}
      >
        {icon}
      </div>

      <div>

        <p className="text-xs text-gray-500">
          {title}
        </p>

        <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">
          {value}
        </p>

      </div>

    </div>
  );
}

/* ============================================================
   ASSIGNMENT KPI
============================================================ */

function AssignmentKpi({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant: "red" | "blue";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

      <div
        className={`absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl ${
          variant === "red"
            ? "bg-[#C8102E]/10"
            : "bg-[#005F99]/10"
        }`}
      />

      <div className="relative flex items-center gap-4">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            variant === "red"
              ? "bg-[#C8102E]/10 text-[#C8102E]"
              : "bg-[#005F99]/10 text-[#005F99]"
          }`}
        >
          {icon}
        </div>

        <div>

          <p className="text-xs text-gray-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   ALERT KPI
============================================================ */

function AlertKpi({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant: "red" | "blue";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        variant === "red"
          ? "border-[#C8102E]/15 bg-[#C8102E]/5"
          : "border-[#005F99]/15 bg-[#005F99]/5"
      }`}
    >

      <div className="flex items-center justify-between">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            variant === "red"
              ? "bg-[#C8102E]/10 text-[#C8102E]"
              : "bg-[#005F99]/10 text-[#005F99]"
          }`}
        >
          {icon}
        </div>

        <span className="text-2xl font-bold text-gray-800 dark:text-white">
          {value}
        </span>

      </div>

      <p className="mt-4 text-xs font-bold text-gray-600 dark:text-gray-300">
        {title}
      </p>

    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: DispatchStatus;
}) {
  const config: Record<
    DispatchStatus,
    string
  > = {
    Planned:
      "bg-blue-50 text-[#005F99] border-blue-200",
    Ready:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    Dispatched:
      "bg-amber-50 text-amber-700 border-amber-200",
    "In Transit":
      "bg-indigo-50 text-indigo-700 border-indigo-200",
    Completed:
      "bg-gray-100 text-gray-600 border-gray-200",
    Delayed:
      "bg-orange-50 text-orange-700 border-orange-200",
    Cancelled:
      "bg-red-50 text-[#C8102E] border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${config[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* ============================================================
   PRIORITY BADGE
============================================================ */

function PriorityBadge({
  priority,
}: {
  priority: Priority;
}) {
  if (priority === "Urgent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#C8102E]/10 px-2.5 py-1 text-[10px] font-bold text-[#C8102E]">
        <AlertTriangle size={10} />
        Urgent
      </span>
    );
  }

  if (priority === "High") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
        <AlertTriangle size={10} />
        High
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
      Normal
    </span>
  );
}

/* ============================================================
   ICON BUTTON
============================================================ */

function IconButton({
  icon,
  title,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  color: "red" | "blue";
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        color === "red"
          ? "text-[#C8102E] hover:bg-[#C8102E]/10"
          : "text-[#005F99] hover:bg-[#005F99]/10"
      }`}
    >
      {icon}
    </button>
  );
}

/* ============================================================
   VIEW DISPATCH MODAL
============================================================ */

function ViewDispatchModal({
  dispatch,
  onClose,
  onEdit,
}: {
  dispatch: Dispatch;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

        <div className="relative overflow-hidden bg-gradient-to-br from-[#005F99] to-[#C8102E] p-6 text-white">

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Dispatch Details
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {
                  dispatch.dispatchNo
                }
              </h2>

              <p className="mt-1 text-sm text-white/70">
                {dispatch.customer}
              </p>

            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
            >
              <X size={18} />
            </button>

          </div>

        </div>

        <div className="p-6">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <StatusBadge
              status={
                dispatch.status
              }
            />

            <div className="flex gap-2">

              <PriorityBadge
                priority={
                  dispatch.priority
                }
              />

              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-[#005F99] px-3 py-2 text-xs font-bold text-white"
              >
                <Edit3 size={13} />
                Edit
              </button>

            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <Detail
              label="Order Reference"
              value={
                dispatch.orderRef
              }
              icon={
                <PackageCheck
                  size={15}
                />
              }
            />

            <Detail
              label="Planning Date"
              value={dispatch.date}
              icon={
                <CalendarDays
                  size={15}
                />
              }
            />

            <Detail
              label="Vehicle"
              value={
                dispatch.vehicle
              }
              icon={
                <Truck size={15} />
              }
            />

            <Detail
              label="Driver"
              value={
                dispatch.driver
              }
              icon={
                <Users size={15} />
              }
            />

            <Detail
              label="Origin"
              value={
                dispatch.origin
              }
              icon={
                <MapPin size={15} />
              }
            />

            <Detail
              label="Destination"
              value={
                dispatch.destination
              }
              icon={
                <Navigation
                  size={15}
                />
              }
            />

            <Detail
              label="Load"
              value={`${dispatch.quantity} • ${dispatch.loadType}`}
              icon={
                <PackageCheck
                  size={15}
                />
              }
            />

            <Detail
              label="Distance"
              value={
                dispatch.distance
              }
              icon={
                <Route size={15} />
              }
            />

            <Detail
              label="Schedule"
              value={`${dispatch.plannedDeparture} → ${dispatch.eta}`}
              icon={
                <Clock3 size={15} />
              }
            />

          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-950">

            <div className="flex justify-between text-xs">

              <span className="font-semibold text-gray-500">
                Dispatch Progress
              </span>

              <span className="font-bold text-[#005F99]">
                {dispatch.progress}%
              </span>

            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">

              <div
                className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
                style={{
                  width: `${dispatch.progress}%`,
                }}
              />

            </div>

          </div>

        </div>

        <div className="border-t border-gray-100 p-5 dark:border-gray-800">

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   CREATE DISPATCH MODAL
============================================================ */

function CreateDispatchModal({
  dispatch,
  onClose,
  onSave,
}: {
  dispatch: Dispatch | null;
  onClose: () => void;
  onSave: (item: Dispatch) => void;
}) {
  const [form, setForm] =
    useState<Dispatch>(
      dispatch || {
        id: Date.now(),
        dispatchNo: `DSP-2026-${String(
          Math.floor(
            Math.random() * 9000
          ) + 1000
        )}`,
        date: "25-Aug-2026",
        customer: "",
        orderRef: "",
        origin: "",
        destination: "",
        vehicle: "Unassigned",
        driver: "Unassigned",
        driverPhone: "",
        loadType: "General Cargo",
        quantity: "",
        distance: "",
        plannedDeparture: "",
        eta: "",
        priority: "Normal",
        status: "Planned",
        progress: 0,
        routeStatus: "Route Pending",
      }
    );

  function update<K extends keyof Dispatch>(
    key: K,
    value: Dispatch[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function submit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !form.customer ||
      !form.origin ||
      !form.destination ||
      !form.quantity
    ) {
      alert(
        "Please fill all mandatory fields."
      );
      return;
    }

    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8102E] to-[#005F99] text-white">
              <Route size={19} />
            </div>

            <div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {dispatch
                  ? "Edit Dispatch"
                  : "Create New Dispatch"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Create and configure a fleet movement plan.
              </p>

            </div>

          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>

        </div>

        <form onSubmit={submit}>

          <div className="space-y-7 p-6">

            <FormSection
              title="Dispatch Information"
              subtitle="Basic dispatch and customer details."
            >

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                <FormInput
                  label="Dispatch Number"
                  value={
                    form.dispatchNo
                  }
                  onChange={(v) =>
                    update(
                      "dispatchNo",
                      v
                    )
                  }
                />

                <FormInput
                  label="Planning Date"
                  value={form.date}
                  onChange={(v) =>
                    update(
                      "date",
                      v
                    )
                  }
                />

                <FormInput
                  label="Customer"
                  required
                  value={
                    form.customer
                  }
                  onChange={(v) =>
                    update(
                      "customer",
                      v
                    )
                  }
                  placeholder="Customer name"
                />

                <FormInput
                  label="Order Reference"
                  value={
                    form.orderRef
                  }
                  onChange={(v) =>
                    update(
                      "orderRef",
                      v
                    )
                  }
                  placeholder="SO-XXXXX"
                />

                <FormSelect
                  label="Priority"
                  value={
                    form.priority
                  }
                  options={[
                    "Normal",
                    "High",
                    "Urgent",
                  ]}
                  onChange={(v) =>
                    update(
                      "priority",
                      v as Priority
                    )
                  }
                />

                <FormSelect
                  label="Status"
                  value={
                    form.status
                  }
                  options={[
                    "Planned",
                    "Ready",
                    "Dispatched",
                    "In Transit",
                    "Completed",
                    "Delayed",
                    "Cancelled",
                  ]}
                  onChange={(v) =>
                    update(
                      "status",
                      v as DispatchStatus
                    )
                  }
                />

              </div>

            </FormSection>

            <FormSection
              title="Route Planning"
              subtitle="Define origin and destination."
            >

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <FormInput
                  label="Origin"
                  required
                  value={
                    form.origin
                  }
                  onChange={(v) =>
                    update(
                      "origin",
                      v
                    )
                  }
                  placeholder="Origin warehouse"
                />

                <FormInput
                  label="Destination"
                  required
                  value={
                    form.destination
                  }
                  onChange={(v) =>
                    update(
                      "destination",
                      v
                    )
                  }
                  placeholder="Destination"
                />

                <FormInput
                  label="Estimated Distance"
                  value={
                    form.distance
                  }
                  onChange={(v) =>
                    update(
                      "distance",
                      v
                    )
                  }
                  placeholder="e.g. 350 KM"
                />

                <FormInput
                  label="Route Status"
                  value={
                    form.routeStatus
                  }
                  onChange={(v) =>
                    update(
                      "routeStatus",
                      v
                    )
                  }
                  placeholder="Route Confirmed"
                />

              </div>

            </FormSection>

            <FormSection
              title="Vehicle & Driver"
              subtitle="Assign fleet resources."
            >

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <FormSelect
                  label="Vehicle"
                  value={
                    form.vehicle
                  }
                  options={[
                    "Unassigned",
                    "AP31XX1234",
                    "AP32XX5678",
                    "TN09AB7821",
                    "TS08CD4432",
                    "KA01MN9012",
                  ]}
                  onChange={(v) =>
                    update(
                      "vehicle",
                      v
                    )
                  }
                />

                <FormSelect
                  label="Driver"
                  value={
                    form.driver
                  }
                  options={[
                    "Unassigned",
                    "Ravi Kumar",
                    "Suresh Rao",
                    "Arun Kumar",
                    "Mahesh",
                    "Prakash",
                  ]}
                  onChange={(v) =>
                    update(
                      "driver",
                      v
                    )
                  }
                />

                <FormInput
                  label="Driver Phone"
                  value={
                    form.driverPhone
                  }
                  onChange={(v) =>
                    update(
                      "driverPhone",
                      v
                    )
                  }
                  placeholder="10 digit mobile"
                />

              </div>

            </FormSection>

            <FormSection
              title="Load Details"
              subtitle="Capture cargo and load information."
            >

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <FormInput
                  label="Load Quantity"
                  required
                  value={
                    form.quantity
                  }
                  onChange={(v) =>
                    update(
                      "quantity",
                      v
                    )
                  }
                  placeholder="e.g. 18 Ton"
                />

                <FormInput
                  label="Load Type"
                  value={
                    form.loadType
                  }
                  onChange={(v) =>
                    update(
                      "loadType",
                      v
                    )
                  }
                  placeholder="General Cargo"
                />

              </div>

            </FormSection>

            <FormSection
              title="Schedule"
              subtitle="Set dispatch timing and expected arrival."
            >

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <FormInput
                  label="Planned Departure"
                  value={
                    form.plannedDeparture
                  }
                  onChange={(v) =>
                    update(
                      "plannedDeparture",
                      v
                    )
                  }
                  placeholder="06:30 AM"
                />

                <FormInput
                  label="Expected Arrival"
                  value={form.eta}
                  onChange={(v) =>
                    update(
                      "eta",
                      v
                    )
                  }
                  placeholder="02:00 PM"
                />

              </div>

            </FormSection>

          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-[#C8102E] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#C8102E]/20 hover:bg-[#A80D26]"
            >
              {dispatch
                ? "Update Dispatch"
                : "Save Dispatch"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* ============================================================
   FORM SECTION
============================================================ */

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>

      <div className="mb-4 flex gap-3">

        <div className="w-1 rounded-full bg-gradient-to-b from-[#C8102E] to-[#005F99]" />

        <div>

          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {subtitle}
          </p>

        </div>

      </div>

      {children}

    </section>
  );
}

/* ============================================================
   FORM INPUT
============================================================ */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">

        {label}

        {required && (
          <span className="ml-1 text-[#C8102E]">
            *
          </span>
        )}

      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
      />

    </div>
  );
}

/* ============================================================
   FORM SELECT
============================================================ */

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
      >

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/* ============================================================
   DETAIL
============================================================ */

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">

      <div className="flex items-center gap-2 text-[#005F99]">

        {icon}

        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </span>

      </div>

      <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white">
        {value || "—"}
      </p>

    </div>
  );
}