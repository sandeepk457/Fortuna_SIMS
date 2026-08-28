"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Fuel,
  Gauge,
  MapPin,
  Plus,
  Search,
  Truck,
  User,
  X,
  Route,
  Play,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

/* ============================================================
   FORTUNA THEME
============================================================ */

const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

/* ============================================================
   TYPES
============================================================ */

type TripsheetStatus =
  | "Open"
  | "In Progress"
  | "Completed"
  | "Exception";

type Tripsheet = {
  id: number;
  tripsheetNo: string;
  dispatchNo: string;
  vehicle: string;
  vehicleType: string;
  driver: string;
  origin: string;
  destination: string;
  departure: string;
  eta: string;
  startOdometer: number;
  currentOdometer: number;
  fuel: number;
  status: TripsheetStatus;
  distance: number;
  remarks: string;
};

/* ============================================================
   MOCK DATA
============================================================ */

const INITIAL_TRIPSHEETS: Tripsheet[] = [
  {
    id: 1,
    tripsheetNo: "TS-2026-0001",
    dispatchNo: "DSP-2026-0142",
    vehicle: "AP31XX1234",
    vehicleType: "Heavy Truck",
    driver: "Ravi Kumar",
    origin: "Visakhapatnam",
    destination: "Hyderabad",
    departure: "08:15 AM",
    eta: "06:30 PM",
    startOdometer: 58210,
    currentOdometer: 58528,
    fuel: 72,
    status: "In Progress",
    distance: 625,
    remarks: "",
  },
  {
    id: 2,
    tripsheetNo: "TS-2026-0002",
    dispatchNo: "DSP-2026-0143",
    vehicle: "AP32XX5678",
    vehicleType: "Container",
    driver: "Arun Kumar",
    origin: "Vijayawada",
    destination: "Chennai",
    departure: "07:45 AM",
    eta: "05:45 PM",
    startOdometer: 44120,
    currentOdometer: 44398,
    fuel: 61,
    status: "In Progress",
    distance: 520,
    remarks: "",
  },
  {
    id: 3,
    tripsheetNo: "TS-2026-0003",
    dispatchNo: "DSP-2026-0138",
    vehicle: "TN09AB7821",
    vehicleType: "Heavy Truck",
    driver: "Mahesh Kumar",
    origin: "Chennai",
    destination: "Bengaluru",
    departure: "06:30 AM",
    eta: "03:00 PM",
    startOdometer: 78340,
    currentOdometer: 78692,
    fuel: 54,
    status: "Completed",
    distance: 350,
    remarks: "",
  },
  {
    id: 4,
    tripsheetNo: "TS-2026-0004",
    dispatchNo: "DSP-2026-0145",
    vehicle: "TS08CD4432",
    vehicleType: "Trailer",
    driver: "Suresh Reddy",
    origin: "Hyderabad",
    destination: "Nagpur",
    departure: "09:00 AM",
    eta: "09:30 PM",
    startOdometer: 92110,
    currentOdometer: 92302,
    fuel: 48,
    status: "Exception",
    distance: 500,
    remarks: "",
  },
  {
    id: 5,
    tripsheetNo: "TS-2026-0005",
    dispatchNo: "DSP-2026-0146",
    vehicle: "AP39YY9087",
    vehicleType: "Medium Truck",
    driver: "Venkatesh",
    origin: "Rajahmundry",
    destination: "Visakhapatnam",
    departure: "10:15 AM",
    eta: "02:30 PM",
    startOdometer: 31820,
    currentOdometer: 31820,
    fuel: 83,
    status: "Open",
    distance: 190,
    remarks: "",
  },
  {
    id: 6,
    tripsheetNo: "TS-2026-0006",
    dispatchNo: "DSP-2026-0147",
    vehicle: "KA05MN2244",
    vehicleType: "Container",
    driver: "Prakash",
    origin: "Bengaluru",
    destination: "Coimbatore",
    departure: "05:45 AM",
    eta: "01:30 PM",
    startOdometer: 67210,
    currentOdometer: 67528,
    fuel: 66,
    status: "Completed",
    distance: 310,
    remarks: "",
  },
  {
    id: 7,
    tripsheetNo: "TS-2026-0007",
    dispatchNo: "DSP-2026-0148",
    vehicle: "AP37AB6611",
    vehicleType: "Heavy Truck",
    driver: "Naveen",
    origin: "Visakhapatnam",
    destination: "Vijayawada",
    departure: "11:00 AM",
    eta: "05:00 PM",
    startOdometer: 51100,
    currentOdometer: 51244,
    fuel: 77,
    status: "In Progress",
    distance: 350,
    remarks: "",
  },
  {
    id: 8,
    tripsheetNo: "TS-2026-0008",
    dispatchNo: "DSP-2026-0149",
    vehicle: "TS07EF5512",
    vehicleType: "Trailer",
    driver: "Ramesh",
    origin: "Hyderabad",
    destination: "Vijayawada",
    departure: "08:40 AM",
    eta: "04:30 PM",
    startOdometer: 70420,
    currentOdometer: 70602,
    fuel: 59,
    status: "Open",
    distance: 275,
    remarks: "",
  },
];

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: TripsheetStatus;
}) {
  const styles: Record<TripsheetStatus, string> = {
    Open: "bg-blue-50 text-[#005F99]",
    "In Progress": "bg-amber-50 text-amber-600",
    Completed: "bg-emerald-50 text-emerald-600",
    Exception: "bg-[#C8102E]/10 text-[#C8102E]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "Completed"
            ? "bg-emerald-500"
            : status === "Exception"
            ? "bg-[#C8102E]"
            : status === "In Progress"
            ? "bg-amber-500"
            : "bg-[#005F99]"
        }`}
      />
      {status}
    </span>
  );
}

/* ============================================================
   KPI CARD
============================================================ */

function TripsheetKpi({
  title,
  value,
  icon,
  variant,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "blue" | "red" | "green" | "amber";
  subtitle: string;
}) {
  const gradients = {
    blue:
      "from-[#005F99] to-[#0077B8]",
    red:
      "from-[#C8102E] to-[#E52A48]",
    green:
      "from-emerald-600 to-emerald-500",
    amber:
      "from-amber-600 to-orange-500",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">

      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradients[variant]}`}
      />

      <div className="flex items-start justify-between">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[variant]} text-white shadow-md`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

/* ============================================================
   INPUT LABEL
============================================================ */

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
      {children}
    </label>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function TripsheetManagementPage() {
  const [tripsheets, setTripsheets] = useState<Tripsheet[]>(
    INITIAL_TRIPSHEETS
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedTripsheet, setSelectedTripsheet] =
    useState<Tripsheet | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [remarksDraft, setRemarksDraft] =
    useState("");

  const [createOpen, setCreateOpen] =
    useState(false);

  /* ============================================================
     LOCK BACKGROUND SCROLL WHEN OVERLAY IS OPEN
  ============================================================ */

  useEffect(() => {
    const overlayOpen = detailsOpen || createOpen;

    if (overlayOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [detailsOpen, createOpen]);

  const [form, setForm] = useState({
    vehicle: "",
    driver: "",
    dispatchNo: "",
    origin: "",
    destination: "",
    departure: "",
    eta: "",
    startOdometer: "",
    fuel: "",
    remarks: "",
  });

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredTripsheets = useMemo(() => {
    const query = search.toLowerCase().trim();

    return tripsheets.filter((trip) => {
      const matchesSearch =
        !query ||
        trip.tripsheetNo.toLowerCase().includes(query) ||
        trip.dispatchNo.toLowerCase().includes(query) ||
        trip.vehicle.toLowerCase().includes(query) ||
        trip.driver.toLowerCase().includes(query) ||
        trip.origin.toLowerCase().includes(query) ||
        trip.destination.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        trip.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tripsheets, search, statusFilter]);

  /* ============================================================
     PAGINATION
  ============================================================ */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTripsheets.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const startIndex =
    (safePage - 1) * pageSize;

  const paginatedTripsheets =
    filteredTripsheets.slice(
      startIndex,
      startIndex + pageSize
    );

  /* ============================================================
     KPI COUNTS
  ============================================================ */

  const totalTrips = tripsheets.length;

  const openTrips = tripsheets.filter(
    (x) => x.status === "Open"
  ).length;

  const inProgressTrips = tripsheets.filter(
    (x) => x.status === "In Progress"
  ).length;

  const completedTrips = tripsheets.filter(
    (x) => x.status === "Completed"
  ).length;

  const exceptionTrips = tripsheets.filter(
    (x) => x.status === "Exception"
  ).length;

  /* ============================================================
     VIEW DETAILS
  ============================================================ */

  const viewTripsheet = (trip: Tripsheet) => {
    setSelectedTripsheet(trip);
    setRemarksDraft(trip.remarks || "");
    setDetailsOpen(true);
  };

  const saveRemarks = () => {
    if (!selectedTripsheet) return;

    const updatedRemarks = remarksDraft.trim();

    setTripsheets((current) =>
      current.map((trip) =>
        trip.id === selectedTripsheet.id
          ? { ...trip, remarks: updatedRemarks }
          : trip
      )
    );

    setSelectedTripsheet((current) =>
      current
        ? { ...current, remarks: updatedRemarks }
        : current
    );
  };

  /* ============================================================
     START TRIP
  ============================================================ */

  const startTrip = (id: number) => {
    setTripsheets((current) =>
      current.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              status: "In Progress",
            }
          : trip
      )
    );

    setSelectedTripsheet((current) =>
      current?.id === id
        ? {
            ...current,
            status: "In Progress",
          }
        : current
    );
  };

  /* ============================================================
     COMPLETE TRIP
  ============================================================ */

  const completeTrip = (id: number) => {
    setTripsheets((current) =>
      current.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              status: "Completed",
              currentOdometer:
                trip.startOdometer +
                trip.distance,
            }
          : trip
      )
    );

    setSelectedTripsheet((current) =>
      current?.id === id
        ? {
            ...current,
            status: "Completed",
            currentOdometer:
              current.startOdometer +
              current.distance,
          }
        : current
    );
  };

  /* ============================================================
     CREATE TRIPSHEET
  ============================================================ */

  const createTripsheet = () => {
    if (
      !form.vehicle ||
      !form.driver ||
      !form.origin ||
      !form.destination
    ) {
      alert(
        "Please fill Vehicle, Driver, Origin and Destination."
      );
      return;
    }

    const newTripsheet: Tripsheet = {
      id: Date.now(),
      tripsheetNo: `TS-2026-${String(
        tripsheets.length + 1
      ).padStart(4, "0")}`,
      dispatchNo:
        form.dispatchNo ||
        `DSP-2026-${String(
          150 + tripsheets.length
        )}`,
      vehicle: form.vehicle,
      vehicleType: "Fleet Vehicle",
      driver: form.driver,
      origin: form.origin,
      destination: form.destination,
      departure:
        form.departure || "Not Set",
      eta: form.eta || "Not Set",
      startOdometer:
        Number(form.startOdometer) || 0,
      currentOdometer:
        Number(form.startOdometer) || 0,
      fuel: Number(form.fuel) || 0,
      status: "Open",
      distance: 0,
      remarks: form.remarks.trim(),
    };

    setTripsheets((current) => [
      newTripsheet,
      ...current,
    ]);

    setForm({
      vehicle: "",
      driver: "",
      dispatchNo: "",
      origin: "",
      destination: "",
      departure: "",
      eta: "",
      startOdometer: "",
      fuel: "",
      remarks: "",
    });

    setCreateOpen(false);
    setPage(1);
  };

  /* ============================================================
     RESET FILTERS
  ============================================================ */

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPage(1);
  };

  /* ============================================================
     EXPORT
  ============================================================ */

  const exportTripsheets = () => {
    const headers = [
      "Tripsheet No",
      "Dispatch No",
      "Vehicle",
      "Driver",
      "Origin",
      "Destination",
      "Departure",
      "ETA",
      "Status",
      "Distance",
      "Fuel %",
      "Remarks",
    ];

    const rows = filteredTripsheets.map(
      (trip) => [
        trip.tripsheetNo,
        trip.dispatchNo,
        trip.vehicle,
        trip.driver,
        trip.origin,
        trip.destination,
        trip.departure,
        trip.eta,
        trip.status,
        trip.distance,
        trip.fuel,
        trip.remarks,
      ]
    );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(
              /"/g,
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "Fortuna_Tripsheet_Management.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white shadow-md">
              <FileText size={18} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Tripsheet Management
              </h1>

              <p className="mt-0.5 text-xs text-gray-500">
                Manage trip execution, vehicle movement and driver operations.
              </p>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={exportTripsheets}
            className="inline-flex items-center gap-2 rounded-xl border border-[#005F99]/20 bg-[#005F99]/5 px-4 py-2.5 text-xs font-bold text-[#005F99] transition hover:bg-[#005F99]/10"
          >
            <Download size={14} />
            Export
          </button>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#E52A48] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Plus size={14} />
            Create Tripsheet
          </button>

        </div>

      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <TripsheetKpi
          title="Total Tripsheets"
          value={totalTrips}
          icon={<FileText size={18} />}
          variant="blue"
          subtitle="All active records"
        />

        <TripsheetKpi
          title="Open"
          value={openTrips}
          icon={<Clock3 size={18} />}
          variant="blue"
          subtitle="Awaiting departure"
        />

        <TripsheetKpi
          title="In Progress"
          value={inProgressTrips}
          icon={<Truck size={18} />}
          variant="amber"
          subtitle="Trips currently running"
        />

        <TripsheetKpi
          title="Completed"
          value={completedTrips}
          icon={<CheckCircle2 size={18} />}
          variant="green"
          subtitle="Successfully completed"
        />

        <TripsheetKpi
          title="Exceptions"
          value={exceptionTrips}
          icon={<AlertTriangle size={18} />}
          variant="red"
          subtitle="Requires attention"
        />

      </div>

      {/* ======================================================
          MAIN TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">

        {/* TABLE HEADER */}

        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Tripsheet Register
              </h2>

              <p className="mt-1 text-[10px] text-gray-400">
                Monitor and manage all vehicle trip sheets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#005F99]/10 px-3 py-1.5 text-[10px] font-bold text-[#005F99]">
                {filteredTripsheets.length} Records
              </span>
            </div>

          </div>

          {/* FILTERS */}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">

            <div className="relative md:col-span-2">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#005F99]"
              />

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search tripsheet, vehicle, driver or route..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="All">
                All Status
              </option>
              <option value="Open">
                Open
              </option>
              <option value="In Progress">
                In Progress
              </option>
              <option value="Completed">
                Completed
              </option>
              <option value="Exception">
                Exception
              </option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-[#C8102E] hover:text-[#C8102E] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1250px]">

            <thead>

              <tr className="bg-gradient-to-r from-[#005F99] to-[#C8102E]">

                {[
                  "Tripsheet",
                  "Vehicle",
                  "Driver",
                  "Route",
                  "Departure",
                  "ETA",
                  "Fuel",
                  "Status",
                  "Action",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white"
                  >
                    {head}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {paginatedTripsheets.map(
                (trip) => (
                  <tr
                    key={trip.id}
                    onClick={() =>
                      viewTripsheet(trip)
                    }
                    className="cursor-pointer transition hover:bg-[#005F99]/5 dark:hover:bg-gray-900"
                  >

                    {/* Tripsheet */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99]/10 to-[#C8102E]/10 text-[#005F99]">
                          <FileText size={15} />
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {trip.tripsheetNo}
                          </p>

                          <p className="mt-0.5 text-[9px] text-gray-400">
                            {trip.dispatchNo}
                          </p>
                        </div>

                      </div>

                    </td>

                    {/* Vehicle */}

                    <td className="px-4 py-4">

                      <p className="text-xs font-bold text-gray-800 dark:text-white">
                        {trip.vehicle}
                      </p>

                      <p className="mt-0.5 text-[9px] text-gray-400">
                        {trip.vehicleType}
                      </p>

                    </td>

                    {/* Driver */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-2">

                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C8102E]/10 text-[#C8102E]">
                          <User size={12} />
                        </div>

                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {trip.driver}
                        </span>

                      </div>

                    </td>

                    {/* Route */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-2 text-xs">

                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {trip.origin}
                        </span>

                        <ArrowRight
                          size={12}
                          className="text-[#C8102E]"
                        />

                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {trip.destination}
                        </span>

                      </div>

                      <p className="mt-1 text-[9px] text-gray-400">
                        Planned distance: {trip.distance} km
                      </p>

                    </td>

                    {/* Departure */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <CalendarDays
                          size={13}
                          className="text-[#005F99]"
                        />
                        {trip.departure}
                      </div>

                    </td>

                    {/* ETA */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <Clock3
                          size={13}
                          className="text-[#C8102E]"
                        />
                        {trip.eta}
                      </div>

                    </td>

                    {/* Fuel */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-2">

                        <Fuel
                          size={13}
                          className="text-[#005F99]"
                        />

                        <div className="w-16">

                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
                              style={{
                                width: `${trip.fuel}%`,
                              }}
                            />

                          </div>

                          <p className="mt-1 text-[9px] font-bold text-gray-500">
                            {trip.fuel}%
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* Status */}

                    <td className="px-4 py-4">
                      <StatusBadge
                        status={trip.status}
                      />
                    </td>

                    {/* Action */}

                    <td
                      className="px-4 py-4"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >

                      <button
                        type="button"
                        onClick={() =>
                          viewTripsheet(trip)
                        }
                        className="rounded-lg border border-[#005F99]/20 bg-[#005F99]/5 px-3 py-2 text-[10px] font-bold text-[#005F99] transition hover:bg-[#005F99]/10"
                      >
                        View
                      </button>

                    </td>

                  </tr>
                )
              )}

              {paginatedTripsheets.length ===
                0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center"
                  >
                    <FileText
                      size={28}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-gray-500">
                      No tripsheets found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">

          <div className="text-[10px] text-gray-400">

            Showing{" "}

            <span className="font-bold text-gray-700 dark:text-gray-200">
              {filteredTripsheets.length === 0
                ? 0
                : startIndex + 1}
            </span>

            {" – "}

            <span className="font-bold text-gray-700 dark:text-gray-200">
              {Math.min(
                startIndex + pageSize,
                filteredTripsheets.length
              )}
            </span>

            {" of "}

            <span className="font-bold text-gray-700 dark:text-gray-200">
              {filteredTripsheets.length}
            </span>

            {" tripsheets"}

          </div>

          <div className="flex items-center gap-2">

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(
                  Number(e.target.value)
                );
                setPage(1);
              }}
              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[10px] font-semibold text-gray-600 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value={5}>
                5 / page
              </option>
              <option value={10}>
                10 / page
              </option>
              <option value={20}>
                20 / page
              </option>
            </select>

            <button
              type="button"
              disabled={safePage === 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(current - 1, 1)
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#005F99] hover:text-[#005F99] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#005F99] to-[#C8102E] px-2 text-[10px] font-bold text-white shadow-sm">
              {safePage}
            </div>

            <button
              type="button"
              disabled={
                safePage >= totalPages
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    current + 1,
                    totalPages
                  )
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#C8102E] hover:text-[#C8102E] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
            >
              <ChevronRight size={14} />
            </button>

          </div>

        </div>

      </div>

      {/* ======================================================
          DETAILS DRAWER
      ====================================================== */}

      {detailsOpen &&
        selectedTripsheet && (
          <div className="fixed inset-0 z-[999999]">

            <button
              type="button"
              aria-label="Close"
              onClick={() =>
                setDetailsOpen(false)
              }
              className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm"
            />

            <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl dark:bg-gray-950">

              {/* Drawer Header */}

              <div className="sticky top-0 z-20 overflow-hidden bg-gradient-to-br from-[#005F99] to-[#C8102E] px-6 py-5 text-white">

                <div className="flex items-start justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <FileText size={16} />
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Tripsheet
                      </span>

                    </div>

                    <h2 className="mt-3 text-xl font-bold">
                      {selectedTripsheet.tripsheetNo}
                    </h2>

                    <p className="mt-1 text-xs text-white/70">
                      {selectedTripsheet.dispatchNo}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDetailsOpen(false)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    <X size={17} />
                  </button>

                </div>

                <div className="mt-4">
                  <StatusBadge
                    status={
                      selectedTripsheet.status
                    }
                  />
                </div>

              </div>

              <div className="space-y-5 p-6">

                {/* Vehicle & Driver */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">

                    <Truck
                      size={16}
                      className="text-[#005F99]"
                    />

                    <p className="mt-2 text-[9px] uppercase tracking-wider text-gray-400">
                      Vehicle
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {selectedTripsheet.vehicle}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400">
                      {selectedTripsheet.vehicleType}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">

                    <User
                      size={16}
                      className="text-[#C8102E]"
                    />

                    <p className="mt-2 text-[9px] uppercase tracking-wider text-gray-400">
                      Driver
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {selectedTripsheet.driver}
                    </p>

                  </div>

                </div>

                {/* Route */}

                <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">

                  <div className="flex items-center gap-2">

                    <Route
                      size={15}
                      className="text-[#005F99]"
                    />

                    <p className="text-xs font-bold text-gray-800 dark:text-white">
                      Trip Route
                    </p>

                  </div>

                  <div className="mt-5 space-y-5">

                    <div className="flex gap-3">

                      <div className="flex flex-col items-center">

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#005F99]/10 text-[#005F99]">
                          <MapPin size={14} />
                        </div>

                        <div className="h-8 w-px bg-gradient-to-b from-[#005F99] to-[#C8102E]" />

                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400">
                          Origin
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                          {selectedTripsheet.origin}
                        </p>
                      </div>

                    </div>

                    <div className="flex gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8102E]/10 text-[#C8102E]">
                        <MapPin size={14} />
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400">
                          Destination
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                          {selectedTripsheet.destination}
                        </p>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Operational Metrics */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-[#005F99]/5 p-4">

                    <Gauge
                      size={15}
                      className="text-[#005F99]"
                    />

                    <p className="mt-2 text-[9px] text-gray-400">
                      Starting Odometer
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#005F99]">
                      {selectedTripsheet.startOdometer.toLocaleString()} km
                    </p>

                  </div>

                  <div className="rounded-2xl bg-[#C8102E]/5 p-4">

                    <Gauge
                      size={15}
                      className="text-[#C8102E]"
                    />

                    <p className="mt-2 text-[9px] text-gray-400">
                      Current Odometer
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#C8102E]">
                      {selectedTripsheet.currentOdometer.toLocaleString()} km
                    </p>

                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-[#005F99]/5 to-[#C8102E]/5 p-4">

                    <Fuel
                      size={15}
                      className="text-[#005F99]"
                    />

                    <p className="mt-2 text-[9px] text-gray-400">
                      Fuel Level
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white">
                      {selectedTripsheet.fuel}%
                    </p>

                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">

                    <Route
                      size={15}
                      className="text-[#C8102E]"
                    />

                    <p className="mt-2 text-[9px] text-gray-400">
                      Planned Distance
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white">
                      {selectedTripsheet.distance} km
                    </p>

                  </div>

                </div>

                {/* Remarks */}

                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">

                  <div className="flex items-center justify-between gap-3">

                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Remarks
                    </p>

                    <span className="text-[9px] font-medium text-gray-400">
                      Editable
                    </span>

                  </div>

                  <textarea
                    rows={4}
                    value={remarksDraft}
                    onChange={(e) =>
                      setRemarksDraft(e.target.value)
                    }
                    placeholder="Enter trip remarks..."
                    className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-700 outline-none transition focus:border-[#005F99] focus:bg-white focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:bg-gray-950"
                  />

                  <div className="mt-3 flex justify-end">

                    <button
                      type="button"
                      onClick={saveRemarks}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#005F99] to-[#C8102E] px-4 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Check size={13} />
                      Save Remarks
                    </button>

                  </div>

                </div>

                {/* Actions */}

                <div className="grid grid-cols-2 gap-3">

                  {selectedTripsheet.status ===
                    "Open" && (
                    <button
                      type="button"
                      onClick={() =>
                        startTrip(
                          selectedTripsheet.id
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#005F99] to-[#0077B8] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <Play size={14} />
                      Start Trip
                    </button>
                  )}

                  {selectedTripsheet.status ===
                    "In Progress" && (
                    <button
                      type="button"
                      onClick={() =>
                        completeTrip(
                          selectedTripsheet.id
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#005F99] to-[#C8102E] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <Check size={14} />
                      Complete Trip
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setDetailsOpen(false)
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                  >
                    <X size={14} />
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      {/* ======================================================
          CREATE TRIPSHEET MODAL
      ====================================================== */}

      {createOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setCreateOpen(false)
            }
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-950">

            {/* Header */}

            <div className="sticky top-0 z-10 bg-gradient-to-br from-[#C8102E] to-[#005F99] px-6 py-5 text-white">

              <div className="flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                      <Plus size={17} />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                      Fleet Operations
                    </span>

                  </div>

                  <h2 className="mt-3 text-xl font-bold">
                    Create Tripsheet
                  </h2>

                  <p className="mt-1 text-xs text-white/70">
                    Create a new vehicle trip execution sheet.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCreateOpen(false)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <X size={17} />
                </button>

              </div>

            </div>

            <div className="space-y-5 p-6">

              {/* Vehicle / Driver */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <FieldLabel>
                    Vehicle
                  </FieldLabel>

                  <input
                    value={form.vehicle}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        vehicle:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. AP31XX1234"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Driver
                  </FieldLabel>

                  <input
                    value={form.driver}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        driver:
                          e.target.value,
                      })
                    }
                    placeholder="Driver name"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

              </div>

              {/* Dispatch */}

              <div>
                <FieldLabel>
                  Dispatch Number
                </FieldLabel>

                <input
                  value={form.dispatchNo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dispatchNo:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. DSP-2026-0150"
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Route */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <FieldLabel>
                    Origin
                  </FieldLabel>

                  <input
                    value={form.origin}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        origin:
                          e.target.value,
                      })
                    }
                    placeholder="Origin location"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Destination
                  </FieldLabel>

                  <input
                    value={form.destination}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        destination:
                          e.target.value,
                      })
                    }
                    placeholder="Destination location"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

              </div>

              {/* Times */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <FieldLabel>
                    Planned Departure
                  </FieldLabel>

                  <input
                    type="time"
                    value={form.departure}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        departure:
                          e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Expected Arrival
                  </FieldLabel>

                  <input
                    type="time"
                    value={form.eta}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        eta: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

              </div>

              {/* Vehicle Metrics */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                  <FieldLabel>
                    Starting Odometer (km)
                  </FieldLabel>

                  <input
                    type="number"
                    value={
                      form.startOdometer
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startOdometer:
                          e.target.value,
                      })
                    }
                    placeholder="Starting odometer"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Fuel Level (%)
                  </FieldLabel>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.fuel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fuel: e.target.value,
                      })
                    }
                    placeholder="Fuel percentage"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

              </div>

              {/* Remarks */}

              <div>
                <FieldLabel>
                  Remarks
                </FieldLabel>

                <textarea
                  rows={4}
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      remarks:
                        e.target.value,
                    })
                  }
                  placeholder="Enter trip remarks..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Actions */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setCreateOpen(false)
                  }
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={createTripsheet}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#005F99] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Check size={14} />
                  Create Tripsheet
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}