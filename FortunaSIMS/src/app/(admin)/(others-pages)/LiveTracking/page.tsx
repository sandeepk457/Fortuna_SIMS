"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Gauge,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  Signal,
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

type VehicleStatus =
  | "On Time"
  | "Delayed"
  | "Idle"
  | "Completed";

type FleetVehicle = {
  id: string;
  vehicleNo: string;
  type: string;
  driver: string;
  origin: string;
  destination: string;
  location: string;
  status: VehicleStatus;
  speed: number;
  distance: number;
  totalDistance: number;
  eta: string;
  progress: number;
  lastUpdated: string;
  tripNo: string;
  fuel: string;
};

/* ============================================================
   MOCK LIVE VEHICLES
============================================================ */

const INITIAL_VEHICLES: FleetVehicle[] = [
  {
    id: "VH001",
    vehicleNo: "AP31XX1234",
    type: "Heavy Truck",
    driver: "Ravi Kumar",
    origin: "Visakhapatnam",
    destination: "Hyderabad",
    location: "Rajahmundry",
    status: "On Time",
    speed: 64,
    distance: 318,
    totalDistance: 625,
    eta: "18:30",
    progress: 51,
    lastUpdated: "1 min ago",
    tripNo: "TRP-2026-0001",
    fuel: "68%",
  },
  {
    id: "VH002",
    vehicleNo: "AP32XX5678",
    type: "Container",
    driver: "Arun Kumar",
    origin: "Hyderabad",
    destination: "Chennai",
    location: "Nellore",
    status: "Delayed",
    speed: 42,
    distance: 286,
    totalDistance: 625,
    eta: "22:15",
    progress: 46,
    lastUpdated: "2 min ago",
    tripNo: "TRP-2026-0002",
    fuel: "54%",
  },
  {
    id: "VH003",
    vehicleNo: "TN09AB7821",
    type: "Heavy Truck",
    driver: "Mahesh",
    origin: "Chennai",
    destination: "Bengaluru",
    location: "Chennai",
    status: "Idle",
    speed: 0,
    distance: 0,
    totalDistance: 350,
    eta: "20:00",
    progress: 8,
    lastUpdated: "4 min ago",
    tripNo: "TRP-2026-0003",
    fuel: "81%",
  },
  {
    id: "VH004",
    vehicleNo: "TS08CD4432",
    type: "Trailer",
    driver: "Suresh",
    origin: "Hyderabad",
    destination: "Visakhapatnam",
    location: "Vijayawada",
    status: "On Time",
    speed: 58,
    distance: 274,
    totalDistance: 620,
    eta: "19:45",
    progress: 44,
    lastUpdated: "1 min ago",
    tripNo: "TRP-2026-0004",
    fuel: "73%",
  },
  {
    id: "VH005",
    vehicleNo: "AP39ZZ9087",
    type: "Light Truck",
    driver: "Prasad",
    origin: "Visakhapatnam",
    destination: "Rajahmundry",
    location: "Visakhapatnam",
    status: "Completed",
    speed: 0,
    distance: 198,
    totalDistance: 198,
    eta: "Completed",
    progress: 100,
    lastUpdated: "8 min ago",
    tripNo: "TRP-2026-0005",
    fuel: "42%",
  },
];

/* ============================================================
   STATUS COLORS
============================================================ */

function statusConfig(status: VehicleStatus) {
  switch (status) {
    case "On Time":
      return {
        color: "#059669",
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        label: "On Time",
      };

    case "Delayed":
      return {
        color: "#D97706",
        bg: "bg-amber-50",
        text: "text-amber-600",
        label: "Delayed",
      };

    case "Idle":
      return {
        color: FORTUNA_BLUE,
        bg: "bg-[#005F99]/10",
        text: "text-[#005F99]",
        label: "Idle",
      };

    case "Completed":
      return {
        color: FORTUNA_RED,
        bg: "bg-[#C8102E]/10",
        text: "text-[#C8102E]",
        label: "Completed",
      };
  }
}

/* ============================================================
   STATUS BADGE
============================================================ */

function TrackingStatusBadge({
  status,
}: {
  status: VehicleStatus;
}) {
  const config = statusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${config.bg} ${config.text}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: config.color,
        }}
      />

      {config.label}
    </span>
  );
}

/* ============================================================
   KPI CARD
============================================================ */

function TrackingKpi({
  title,
  value,
  subtitle,
  icon,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: "blue" | "red" | "green" | "amber";
}) {
  const styles = {
    blue: {
      border: "border-[#005F99]/15",
      glow: "bg-[#005F99]/10",
      icon: "bg-gradient-to-br from-[#005F99] to-[#0077B8]",
      title: "text-[#005F99]",
    },
    red: {
      border: "border-[#C8102E]/15",
      glow: "bg-[#C8102E]/10",
      icon: "bg-gradient-to-br from-[#C8102E] to-[#E52A45]",
      title: "text-[#C8102E]",
    },
    green: {
      border: "border-emerald-200",
      glow: "bg-emerald-500/10",
      icon: "bg-gradient-to-br from-emerald-600 to-emerald-400",
      title: "text-emerald-600",
    },
    amber: {
      border: "border-amber-200",
      glow: "bg-amber-500/10",
      icon: "bg-gradient-to-br from-amber-600 to-amber-400",
      title: "text-amber-600",
    },
  };

  const current = styles[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${current.border} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-900`}
    >
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${current.glow} blur-2xl`}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.16em] ${current.title}`}
          >
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${current.icon} text-white shadow-md`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] =
    useState<FleetVehicle[]>(INITIAL_VEHICLES);

  const [selectedVehicle, setSelectedVehicle] =
    useState<FleetVehicle | null>(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [routeOpen, setRouteOpen] =
    useState(false);

  const [issueOpen, setIssueOpen] =
    useState(false);

  const [issueType, setIssueType] =
    useState("Vehicle Breakdown");

  const [issuePriority, setIssuePriority] =
    useState("High");

  const [issueDescription, setIssueDescription] =
    useState("");

  const [issueSubmitted, setIssueSubmitted] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | VehicleStatus>("All");

  /* ============================================================
     ACTIVE TRIP TABLE FILTERS & PAGINATION
  ============================================================ */

  const [tripSearch, setTripSearch] = useState("");

  const [tripStatusFilter, setTripStatusFilter] =
    useState<"All" | VehicleStatus>("All");

  const [tripLocationFilter, setTripLocationFilter] =
    useState("All");

  const [tripPage, setTripPage] = useState(1);

  const [tripPageSize, setTripPageSize] = useState(5);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.vehicleNo
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        vehicle.driver
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        vehicle.location
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        vehicle.destination
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  /* ============================================================
     ACTIVE TRIP TABLE FILTER + PAGINATION
  ============================================================ */

  const tripFilteredVehicles = useMemo(() => {
    const query = tripSearch.trim().toLowerCase();

    return filteredVehicles.filter((vehicle) => {
      const matchesSearch =
        !query ||
        vehicle.vehicleNo.toLowerCase().includes(query) ||
        vehicle.driver.toLowerCase().includes(query) ||
        vehicle.tripNo.toLowerCase().includes(query) ||
        vehicle.location.toLowerCase().includes(query) ||
        vehicle.origin.toLowerCase().includes(query) ||
        vehicle.destination.toLowerCase().includes(query);

      const matchesStatus =
        tripStatusFilter === "All" ||
        vehicle.status === tripStatusFilter;

      const matchesLocation =
        tripLocationFilter === "All" ||
        vehicle.location === tripLocationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLocation
      );
    });
  }, [
    filteredVehicles,
    tripSearch,
    tripStatusFilter,
    tripLocationFilter,
  ]);

  const tripTotalPages = Math.max(
    1,
    Math.ceil(
      tripFilteredVehicles.length / tripPageSize
    )
  );

  const safeTripPage = Math.min(
    tripPage,
    tripTotalPages
  );

  const tripStartIndex =
    (safeTripPage - 1) * tripPageSize;

  const paginatedTripVehicles =
    tripFilteredVehicles.slice(
      tripStartIndex,
      tripStartIndex + tripPageSize
    );

  const tripLocations = useMemo(
    () =>
      Array.from(
        new Set(
          filteredVehicles.map(
            (vehicle) => vehicle.location
          )
        )
      ),
    [filteredVehicles]
  );

  const resetTripTableFilters = () => {
    setTripSearch("");
    setTripStatusFilter("All");
    setTripLocationFilter("All");
    setTripPage(1);
  };

  /* ============================================================
     KPI COUNTS
  ============================================================ */

  const totalVehicles = vehicles.length;

  const activeVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.status === "On Time" ||
      vehicle.status === "Delayed"
  ).length;

  const onTimeVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "On Time"
  ).length;

  const delayedVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Delayed"
  ).length;

  /* ============================================================
     REFRESH
  ============================================================ */

  const handleRefresh = () => {
    setIsRefreshing(true);

    setTimeout(() => {
      setIsRefreshing(false);

      setVehicles((current) =>
        current.map((vehicle) => {
          if (
            vehicle.status === "On Time" &&
            vehicle.progress < 95
          ) {
            const newProgress = Math.min(
              vehicle.progress + 1,
              99
            );

            return {
              ...vehicle,
              progress: newProgress,
              distance: Math.min(
                vehicle.distance + 5,
                vehicle.totalDistance
              ),
              lastUpdated: "Just now",
            };
          }

          return {
            ...vehicle,
            lastUpdated: "Just now",
          };
        })
      );
    }, 700);
  };

  /* ============================================================
     OPEN VEHICLE
  ============================================================ */

  const openVehicle = (vehicle: FleetVehicle) => {
    setSelectedVehicle(vehicle);
    setDrawerOpen(true);
    setRouteOpen(false);
  };

  /* ============================================================
     CLOSE DRAWER
  ============================================================ */

  const closeVehicle = () => {
    setDrawerOpen(false);
    setRouteOpen(false);
    setIssueOpen(false);
    setIssueSubmitted(false);
    setSelectedVehicle(null);
  };

  const openReportIssue = () => {
    setRouteOpen(false);
    setIssueSubmitted(false);
    setIssueType("Vehicle Breakdown");
    setIssuePriority("High");
    setIssueDescription("");
    setIssueOpen(true);
  };

  const closeReportIssue = () => {
    setIssueOpen(false);
    setIssueSubmitted(false);
  };

  const submitReportIssue = () => {
    if (!issueDescription.trim()) {
      alert("Please enter an issue description.");
      return;
    }

    setIssueSubmitted(true);
  };

  return (
    <>
      <div className="space-y-6">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#005F99] via-[#006EA8] to-[#C8102E] p-7 text-white shadow-xl">

          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#C8102E]/30 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <LocateFixed size={21} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                    Fleet & Logistics
                  </p>

                  <p className="text-sm font-semibold">
                    Live Operations
                  </p>
                </div>

              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Live Fleet Tracking
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Monitor active vehicles, routes, trip progress and
                operational exceptions from a single workspace.
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <RefreshCw
                  size={15}
                  className={
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#C8102E] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Download size={15} />

                Export Tracking
              </button>

            </div>

          </div>

        </div>

        {/* ======================================================
            KPI CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <TrackingKpi
            title="Total Vehicles"
            value={`${totalVehicles}`}
            subtitle="Fleet under monitoring"
            icon={<Truck size={19} />}
            variant="blue"
          />

          <TrackingKpi
            title="Active Vehicles"
            value={`${activeVehicles}`}
            subtitle="Currently on route"
            icon={<Navigation size={19} />}
            variant="red"
          />

          <TrackingKpi
            title="On Time"
            value={`${onTimeVehicles}`}
            subtitle="Meeting planned ETA"
            icon={<CheckCircle2 size={19} />}
            variant="green"
          />

          <TrackingKpi
            title="Delayed"
            value={`${delayedVehicles}`}
            subtitle="Requires attention"
            icon={<AlertTriangle size={19} />}
            variant="amber"
          />

        </div>

        {/* ======================================================
            FILTER BAR
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">

              <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Search Vehicle
              </label>

              <div className="relative">

                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Vehicle / Driver / Location / Destination"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                />

              </div>

            </div>

            <div className="w-full lg:w-52">

              <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "All"
                      | VehicleStatus
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
              >
                <option value="All">
                  All Status
                </option>

                <option value="On Time">
                  On Time
                </option>

                <option value="Delayed">
                  Delayed
                </option>

                <option value="Idle">
                  Idle
                </option>

                <option value="Completed">
                  Completed
                </option>
              </select>

            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="h-11 rounded-xl border border-gray-200 px-4 text-xs font-bold text-gray-600 transition hover:border-[#C8102E] hover:text-[#C8102E] dark:border-gray-700 dark:text-gray-300"
            >
              Reset Filters
            </button>

          </div>

        </div>

        {/* ======================================================
            TRACKING WORKSPACE
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* ====================================================
              MAP
          ==================================================== */}

          <div className="xl:col-span-8">

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                <div>

                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Live Tracking Map
                  </h2>

                  <p className="mt-1 text-[10px] text-gray-400">
                    Vehicle positions and active routes
                  </p>

                </div>

                <div className="flex items-center gap-2">

                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live
                  </span>

                  <span className="text-[10px] text-gray-400">
                    Updated {vehicles[0]?.lastUpdated}
                  </span>

                </div>

              </div>

              {/* Map Surface */}

              <div className="relative h-[480px] overflow-hidden bg-[#EAF2F7] dark:bg-[#0B1720]">

                {/* Grid */}

                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(#B8CBD8 1px, transparent 1px), linear-gradient(90deg, #B8CBD8 1px, transparent 1px)",
                    backgroundSize: "42px 42px",
                  }}
                />

                {/* Decorative route lines */}

                <div className="absolute left-[8%] top-[25%] h-[2px] w-[78%] rotate-[10deg] bg-gradient-to-r from-[#005F99]/20 via-[#005F99] to-[#C8102E]/40" />

                <div className="absolute left-[15%] top-[62%] h-[2px] w-[65%] -rotate-[7deg] bg-gradient-to-r from-[#C8102E]/20 via-[#C8102E] to-[#005F99]/40" />

                <div className="absolute left-[30%] top-[15%] h-[70%] w-[2px] rotate-[14deg] bg-[#005F99]/20" />

                {/* Map Labels */}

                <div className="absolute left-[8%] top-[19%] text-[10px] font-bold text-gray-500">
                  VISAKHAPATNAM
                </div>

                <div className="absolute left-[42%] top-[38%] text-[10px] font-bold text-gray-500">
                  VIJAYAWADA
                </div>

                <div className="absolute right-[12%] top-[23%] text-[10px] font-bold text-gray-500">
                  HYDERABAD
                </div>

                <div className="absolute right-[14%] bottom-[20%] text-[10px] font-bold text-gray-500">
                  CHENNAI
                </div>

                <div className="absolute left-[44%] bottom-[13%] text-[10px] font-bold text-gray-500">
                  BENGALURU
                </div>

                {/* Vehicle Markers */}

                {vehicles
                  .filter(
                    (vehicle) =>
                      vehicle.status !==
                      "Completed"
                  )
                  .map((vehicle, index) => {

                    const positions = [
                      {
                        left: "24%",
                        top: "30%",
                      },
                      {
                        left: "67%",
                        top: "47%",
                      },
                      {
                        left: "77%",
                        top: "70%",
                      },
                      {
                        left: "45%",
                        top: "61%",
                      },
                    ];

                    const position =
                      positions[index %
                        positions.length];

                    const config =
                      statusConfig(
                        vehicle.status
                      );

                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() =>
                          openVehicle(
                            vehicle
                          )
                        }
                        className="group absolute -translate-x-1/2 -translate-y-1/2"
                        style={position}
                      >

                        <div className="relative">

                          <div
                            className="absolute -inset-3 animate-ping rounded-full opacity-20"
                            style={{
                              backgroundColor:
                                config.color,
                            }}
                          />

                          <div
                            className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-white shadow-xl dark:border-gray-900"
                            style={{
                              background:
                                `linear-gradient(135deg, ${FORTUNA_BLUE}, ${config.color})`,
                            }}
                          >
                            <Truck size={17} />
                          </div>

                          <div className="absolute left-1/2 top-12 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 shadow-lg dark:bg-gray-900 dark:text-gray-200">
                            {vehicle.vehicleNo}
                          </div>

                        </div>

                      </button>
                    );
                  })}

                {/* Map Legend */}

                <div className="absolute bottom-4 left-4 rounded-xl border border-white/70 bg-white/90 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">

                  <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Status
                  </p>

                  <div className="space-y-1.5">

                    <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      On Time
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Delayed
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-[#005F99]" />
                      Idle
                    </div>

                  </div>

                </div>

                {/* Map Controls */}

                <div className="absolute right-4 top-4 flex flex-col gap-2">

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/90 text-[#005F99] shadow-md backdrop-blur-sm"
                  >
                    <LocateFixed size={15} />
                  </button>

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/90 text-[#C8102E] shadow-md backdrop-blur-sm"
                  >
                    <Route size={15} />
                  </button>

                </div>

              </div>

            </div>

          </div>

          {/* ====================================================
              ACTIVE VEHICLES
          ==================================================== */}

          <div className="xl:col-span-4">

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                <div>

                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Active Vehicles
                  </h2>

                  <p className="mt-1 text-[10px] text-gray-400">
                    {filteredVehicles.length} vehicles matching filters
                  </p>

                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white">
                  <Truck size={15} />
                </div>

              </div>

              <div className="max-h-[480px] space-y-2 overflow-y-auto p-3">

                {filteredVehicles.length === 0 ? (

                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                      <Truck size={20} />
                    </div>

                    <p className="mt-3 text-xs font-semibold text-gray-500">
                      No vehicles found
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400">
                      Try changing your filters.
                    </p>

                  </div>

                ) : (

                  filteredVehicles.map(
                    (vehicle) => {

                      const config =
                        statusConfig(
                          vehicle.status
                        );

                      return (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() =>
                            openVehicle(
                              vehicle
                            )
                          }
                          className="group w-full rounded-xl border border-gray-200 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#005F99]/30 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
                        >

                          <div className="flex items-start justify-between gap-2">

                            <div className="flex min-w-0 items-center gap-3">

                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                                style={{
                                  background:
                                    `linear-gradient(135deg, ${FORTUNA_BLUE}, ${config.color})`,
                                }}
                              >
                                <Truck
                                  size={15}
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-xs font-bold text-gray-800 dark:text-white">
                                  {vehicle.vehicleNo}
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-gray-400">
                                  {vehicle.driver}
                                </p>

                              </div>

                            </div>

                            <TrackingStatusBadge
                              status={
                                vehicle.status
                              }
                            />

                          </div>

                          <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-400">

                            <MapPin
                              size={11}
                              className="shrink-0 text-[#C8102E]"
                            />

                            <span className="truncate">
                              {vehicle.location}
                            </span>

                            <ArrowRight
                              size={10}
                              className="shrink-0 text-[#005F99]"
                            />

                            <span className="truncate">
                              {vehicle.destination}
                            </span>

                          </div>

                          <div className="mt-3">

                            <div className="mb-1 flex items-center justify-between">

                              <span className="text-[9px] text-gray-400">
                                Trip Progress
                              </span>

                              <span
                                className="text-[9px] font-bold"
                                style={{
                                  color:
                                    config.color,
                                }}
                              >
                                {vehicle.progress}%
                              </span>

                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
                                style={{
                                  width: `${vehicle.progress}%`,
                                }}
                              />

                            </div>

                          </div>

                          <div className="mt-3 flex items-center justify-between">

                            <div className="flex items-center gap-3">

                              <span className="flex items-center gap-1 text-[9px] text-gray-400">
                                <Gauge
                                  size={10}
                                  className="text-[#005F99]"
                                />
                                {vehicle.speed} km/h
                              </span>

                              <span className="flex items-center gap-1 text-[9px] text-gray-400">
                                <Clock3
                                  size={10}
                                  className="text-[#C8102E]"
                                />
                                ETA {vehicle.eta}
                              </span>

                            </div>

                            <span className="text-[9px] font-bold text-[#005F99] opacity-0 transition group-hover:opacity-100">
                              View →
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )

                )}

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            TRIP DETAILS TABLE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Active Trip Details
                </h2>

                <p className="mt-1 text-[10px] text-gray-400">
                  Operational telemetry for monitored fleet vehicles.
                </p>

              </div>

              <div className="flex items-center gap-2">

                <span className="flex items-center gap-1.5 rounded-full bg-[#005F99]/10 px-3 py-1.5 text-[10px] font-bold text-[#005F99]">
                  <Signal size={11} />
                  Tracking Connected
                </span>

              </div>

            </div>

            {/* ======================================================
                TABLE FILTERS
            ====================================================== */}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">

              <div className="relative md:col-span-2">

                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#005F99]"
                />

                <input
                  type="text"
                  value={tripSearch}
                  onChange={(e) => {
                    setTripSearch(e.target.value);
                    setTripPage(1);
                  }}
                  placeholder="Search vehicle, driver or trip..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />

              </div>

              <select
                value={tripStatusFilter}
                onChange={(e) => {
                  setTripStatusFilter(
                    e.target.value as
                      | "All"
                      | VehicleStatus
                  );
                  setTripPage(1);
                }}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="All">All Status</option>
                <option value="On Time">On Time</option>
                <option value="Delayed">Delayed</option>
                <option value="Idle">Idle</option>
                <option value="Completed">Completed</option>
              </select>

              <div className="flex gap-2">

                <select
                  value={tripLocationFilter}
                  onChange={(e) => {
                    setTripLocationFilter(e.target.value);
                    setTripPage(1);
                  }}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  <option value="All">All Locations</option>

                  {tripLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={resetTripTableFilters}
                  className="h-10 shrink-0 rounded-xl border border-gray-200 px-3 text-[10px] font-bold text-gray-600 transition hover:border-[#C8102E] hover:text-[#C8102E] dark:border-gray-700 dark:text-gray-300"
                >
                  Reset
                </button>

              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead>

                <tr className="border-b border-gray-200 bg-gradient-to-r from-[#005F99] to-[#C8102E] dark:border-gray-800">

                  {[
                    "Vehicle",
                    "Driver",
                    "Route",
                    "Location",
                    "Speed",
                    "Distance",
                    "ETA",
                    "Status",
                    "Updated",
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

                {paginatedTripVehicles.map(
                  (vehicle) => (

                    <tr
                      key={vehicle.id}
                      onClick={() =>
                        openVehicle(
                          vehicle
                        )
                      }
                      className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2">

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#005F99]/10 text-[#005F99]">
                            <Truck size={14} />
                          </div>

                          <div>

                            <p className="text-xs font-bold text-gray-800 dark:text-white">
                              {vehicle.vehicleNo}
                            </p>

                            <p className="text-[9px] text-gray-400">
                              {vehicle.type}
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2">

                          <Users
                            size={13}
                            className="text-[#C8102E]"
                          />

                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {vehicle.driver}
                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-1 text-[10px] text-gray-500">

                          <span>
                            {vehicle.origin}
                          </span>

                          <ArrowRight
                            size={10}
                            className="text-[#C8102E]"
                          />

                          <span>
                            {vehicle.destination}
                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-1.5">

                          <MapPin
                            size={12}
                            className="text-[#005F99]"
                          />

                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {vehicle.location}
                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <span className="text-xs font-bold text-gray-800 dark:text-white">
                          {vehicle.speed} km/h
                        </span>

                      </td>

                      <td className="px-4 py-4">

                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {vehicle.distance} /{" "}
                          {vehicle.totalDistance} km
                        </span>

                      </td>

                      <td className="px-4 py-4">

                        <span className="text-xs font-bold text-[#005F99]">
                          {vehicle.eta}
                        </span>

                      </td>

                      <td className="px-4 py-4">

                        <TrackingStatusBadge
                          status={
                            vehicle.status
                          }
                        />

                      </td>

                      <td className="px-4 py-4">

                        <span className="text-[10px] text-gray-400">
                          {vehicle.lastUpdated}
                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* ======================================================
              TABLE PAGINATION
          ====================================================== */}

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">

            <div className="text-[10px] text-gray-400">
              Showing{" "}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {tripFilteredVehicles.length === 0
                  ? 0
                  : tripStartIndex + 1}
              </span>
              {" – "}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {Math.min(
                  tripStartIndex + tripPageSize,
                  tripFilteredVehicles.length
                )}
              </span>
              {" of "}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {tripFilteredVehicles.length}
              </span>
              {" vehicles"}
            </div>

            <div className="flex items-center gap-2">

              <select
                value={tripPageSize}
                onChange={(e) => {
                  setTripPageSize(Number(e.target.value));
                  setTripPage(1);
                }}
                className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[10px] font-semibold text-gray-600 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>

              <button
                type="button"
                disabled={safeTripPage === 1}
                onClick={() =>
                  setTripPage((page) =>
                    Math.max(page - 1, 1)
                  )
                }
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#005F99] hover:text-[#005F99] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#005F99] to-[#C8102E] px-2 text-[10px] font-bold text-white shadow-sm">
                {safeTripPage}
              </div>

              <button
                type="button"
                disabled={safeTripPage >= tripTotalPages}
                onClick={() =>
                  setTripPage((page) =>
                    Math.min(page + 1, tripTotalPages)
                  )
                }
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#C8102E] hover:text-[#C8102E] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
              >
                <ChevronRight size={14} />
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          VEHICLE DETAIL DRAWER
      ====================================================== */}

      {drawerOpen &&
        selectedVehicle && (

          <div className="fixed inset-0 z-[99999]">

            {/* Backdrop */}

            <button
              type="button"
              aria-label="Close vehicle details"
              onClick={closeVehicle}
              className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-[2px]"
            />

            {/* Drawer */}

            <div className="absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto bg-white shadow-2xl dark:bg-gray-950">

              {/* Header */}

              <div className="sticky top-0 z-10 bg-gradient-to-r from-[#005F99] to-[#C8102E] px-6 py-5 text-white">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                      Live Vehicle
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      {selectedVehicle.vehicleNo}
                    </h2>

                    <p className="mt-1 text-xs text-white/75">
                      {selectedVehicle.driver}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={closeVehicle}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
                  >
                    <X size={18} />
                  </button>

                </div>

              </div>

              <div className="space-y-6 p-6">

                {/* Status */}

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Current Status
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {selectedVehicle.status}
                    </p>

                  </div>

                  <TrackingStatusBadge
                    status={
                      selectedVehicle.status
                    }
                  />

                </div>

                {/* Vehicle / Driver */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">

                    <Truck
                      size={17}
                      className="text-[#005F99]"
                    />

                    <p className="mt-3 text-[10px] text-gray-400">
                      Vehicle Type
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white">
                      {selectedVehicle.type}
                    </p>

                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">

                    <Users
                      size={17}
                      className="text-[#C8102E]"
                    />

                    <p className="mt-3 text-[10px] text-gray-400">
                      Driver
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-gray-800 dark:text-white">
                      {selectedVehicle.driver}
                    </p>

                  </div>

                </div>

                {/* Route */}

                <div>

                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Active Route
                  </p>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005F99]/10 text-[#005F99]">
                        <MapPin size={16} />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] text-gray-400">
                          Current Location
                        </p>

                        <p className="truncate text-sm font-bold text-gray-800 dark:text-white">
                          {selectedVehicle.location}
                        </p>

                      </div>

                      <ArrowRight
                        size={17}
                        className="shrink-0 text-[#C8102E]"
                      />

                      <div className="min-w-0">

                        <p className="text-[10px] text-gray-400">
                          Destination
                        </p>

                        <p className="truncate text-sm font-bold text-gray-800 dark:text-white">
                          {selectedVehicle.destination}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

                {/* Telemetry */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-[#005F99]/5 to-white p-4 dark:border-gray-800 dark:from-[#005F99]/10 dark:to-gray-950">

                    <Gauge
                      size={17}
                      className="text-[#005F99]"
                    />

                    <p className="mt-3 text-[10px] text-gray-400">
                      Current Speed
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#005F99]">
                      {selectedVehicle.speed}{" "}
                      <span className="text-[10px]">
                        km/h
                      </span>
                    </p>

                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-[#C8102E]/5 to-white p-4 dark:border-gray-800 dark:from-[#C8102E]/10 dark:to-gray-950">

                    <Zap
                      size={17}
                      className="text-[#C8102E]"
                    />

                    <p className="mt-3 text-[10px] text-gray-400">
                      Fuel Level
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#C8102E]">
                      {selectedVehicle.fuel}
                    </p>

                  </div>

                </div>

                {/* Progress */}

                <div>

                  <div className="mb-3 flex items-center justify-between">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Trip Progress
                    </p>

                    <span className="text-sm font-bold text-[#005F99]">
                      {selectedVehicle.progress}%
                    </span>

                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
                        style={{
                          width: `${selectedVehicle.progress}%`,
                        }}
                      />

                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">

                      <span>
                        {selectedVehicle.distance} km
                      </span>

                      <span>
                        {selectedVehicle.totalDistance} km total
                      </span>

                    </div>

                  </div>

                </div>

                {/* ETA */}

                <div className="rounded-xl border border-[#005F99]/15 bg-gradient-to-r from-[#005F99]/5 via-white to-[#C8102E]/5 p-4 dark:from-[#005F99]/10 dark:via-gray-950 dark:to-[#C8102E]/10">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white">
                        <Clock3 size={17} />
                      </div>

                      <div>

                        <p className="text-[10px] text-gray-400">
                          Estimated Arrival
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                          {selectedVehicle.eta}
                        </p>

                      </div>

                    </div>

                    <Activity
                      size={20}
                      className="text-[#005F99]"
                    />

                  </div>

                </div>

                {/* Trip Information */}

                <div>

                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Trip Information
                  </p>

                  <div className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">

                    <div className="flex items-center justify-between">

                      <span className="text-xs text-gray-400">
                        Trip Number
                      </span>

                      <span className="text-xs font-bold text-gray-800 dark:text-white">
                        {selectedVehicle.tripNo}
                      </span>

                    </div>

                    <div className="flex items-center justify-between">

                      <span className="text-xs text-gray-400">
                        Origin
                      </span>

                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {selectedVehicle.origin}
                      </span>

                    </div>

                    <div className="flex items-center justify-between">

                      <span className="text-xs text-gray-400">
                        Destination
                      </span>

                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {selectedVehicle.destination}
                      </span>

                    </div>

                    <div className="flex items-center justify-between">

                      <span className="text-xs text-gray-400">
                        Last GPS Update
                      </span>

                      <span className="text-xs font-semibold text-[#005F99]">
                        {selectedVehicle.lastUpdated}
                      </span>

                    </div>

                  </div>

                </div>

                {/* ============================================================
                    ROUTE VIEW
                ============================================================ */}

                {routeOpen && (
                  <div className="overflow-hidden rounded-2xl border border-[#005F99]/15 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                    {/* Route Header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#005F99] to-[#C8102E] px-4 py-3 text-white">

                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                          <Route size={17} />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                            Active Route
                          </p>

                          <p className="mt-0.5 text-sm font-bold">
                            {selectedVehicle.origin} → {selectedVehicle.destination}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRouteOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
                        aria-label="Close route view"
                      >
                        <X size={15} />
                      </button>

                    </div>

                    <div className="space-y-4 p-4">

                      {/* Route Progress */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Route Progress
                          </span>

                          <span className="text-xs font-bold text-[#005F99]">
                            {selectedVehicle.progress}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E] transition-all duration-500"
                            style={{
                              width: `${selectedVehicle.progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Route Timeline */}
                      <div className="relative rounded-xl border border-gray-200 p-4 dark:border-gray-800">

                        <div className="absolute bottom-10 left-[29px] top-10 w-px bg-gradient-to-b from-[#005F99] via-[#C8102E] to-gray-200" />

                        {/* Origin */}
                        <div className="relative flex gap-3">
                          <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#005F99] text-white shadow-md">
                            <MapPin size={13} />
                          </div>

                          <div className="pb-5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                              Origin
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white">
                              {selectedVehicle.origin}
                            </p>
                          </div>
                        </div>

                        {/* Current Location */}
                        <div className="relative flex gap-3">
                          <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white shadow-md">
                            <LocateFixed size={13} />
                          </div>

                          <div className="pb-5">
                            <div className="flex items-center gap-2">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                Current Location
                              </p>

                              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-600">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                LIVE
                              </span>
                            </div>

                            <p className="mt-1 text-sm font-bold text-[#005F99]">
                              {selectedVehicle.location}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-400">
                              {selectedVehicle.speed} km/h • Updated {selectedVehicle.lastUpdated}
                            </p>
                          </div>
                        </div>

                        {/* Destination */}
                        <div className="relative flex gap-3">
                          <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C8102E] text-white shadow-md">
                            <Navigation size={13} />
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                              Destination
                            </p>

                            <p className="mt-1 text-sm font-bold text-[#C8102E]">
                              {selectedVehicle.destination}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-400">
                              ETA {selectedVehicle.eta}
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Route Metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-[#005F99]/5 p-3 text-center">
                          <p className="text-[9px] text-gray-400">Distance</p>
                          <p className="mt-1 text-sm font-bold text-[#005F99]">
                            {selectedVehicle.distance} km
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#C8102E]/5 p-3 text-center">
                          <p className="text-[9px] text-gray-400">Remaining</p>
                          <p className="mt-1 text-sm font-bold text-[#C8102E]">
                            {Math.max(
                              selectedVehicle.totalDistance - selectedVehicle.distance,
                              0
                            )} km
                          </p>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-[#005F99]/5 to-[#C8102E]/5 p-3 text-center">
                          <p className="text-[9px] text-gray-400">ETA</p>
                          <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white">
                            {selectedVehicle.eta}
                          </p>
                        </div>
                      </div>

                      {/* Back to Vehicle Details */}
                      <button
                        type="button"
                        onClick={() => setRouteOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#005F99]/20 bg-[#005F99]/5 px-4 py-3 text-xs font-bold text-[#005F99] transition hover:bg-[#005F99]/10"
                      >
                        <LocateFixed size={14} />
                        Back to Vehicle Details
                      </button>

                    </div>

                  </div>
                )}

                {/* Future Actions */}

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() => setRouteOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#005F99] to-[#0077B8] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <Navigation size={14} />
                    View Route
                  </button>

                  <button
                    type="button"
                    onClick={openReportIssue}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#C8102E]/20 bg-[#C8102E]/5 px-4 py-3 text-xs font-bold text-[#C8102E] transition hover:bg-[#C8102E]/10"
                  >
                    <AlertTriangle size={14} />
                    Report Issue
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      {/* ======================================================
          REPORT ISSUE MODAL
      ====================================================== */}

      {issueOpen && selectedVehicle && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close report issue"
            onClick={closeReportIssue}
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#C8102E] via-[#C8102E] to-[#005F99] px-6 py-5 text-white">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                      <AlertTriangle size={17} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                      Fleet Operations
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">
                    Report Operational Issue
                  </h3>
                  <p className="mt-1 text-xs text-white/75">
                    Create an exception against the selected vehicle.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeReportIssue}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
                  aria-label="Close report issue"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {!issueSubmitted ? (
              <div className="space-y-5 p-6">
                <div className="rounded-2xl border border-[#005F99]/15 bg-gradient-to-r from-[#005F99]/5 via-white to-[#C8102E]/5 p-4 dark:border-gray-800 dark:from-[#005F99]/10 dark:via-gray-950 dark:to-[#C8102E]/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white shadow-md">
                      <Truck size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        Selected Vehicle
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-gray-900 dark:text-white">
                        {selectedVehicle.vehicleNo}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {selectedVehicle.tripNo} • {selectedVehicle.driver}
                      </p>
                    </div>
                    <TrackingStatusBadge status={selectedVehicle.status} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Issue Type
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <option>Vehicle Breakdown</option>
                    <option>Traffic Delay</option>
                    <option>Route Blocked</option>
                    <option>Accident</option>
                    <option>Driver Issue</option>
                    <option>Fuel Issue</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Low", "Medium", "High", "Critical"].map((priority) => {
                      const active = issuePriority === priority;
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setIssuePriority(priority)}
                          className={`rounded-xl border px-2 py-2.5 text-[10px] font-bold transition ${
                            active
                              ? priority === "Critical"
                                ? "border-[#C8102E] bg-[#C8102E] text-white shadow-md"
                                : priority === "High"
                                ? "border-[#C8102E]/40 bg-[#C8102E]/10 text-[#C8102E]"
                                : priority === "Medium"
                                ? "border-amber-300 bg-amber-50 text-amber-600"
                                : "border-[#005F99]/30 bg-[#005F99]/10 text-[#005F99]"
                              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                          }`}
                        >
                          {priority}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Issue Description
                    </label>
                    <span className="text-[9px] text-gray-400">Required</span>
                  </div>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the issue, location, impact or immediate action required..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeReportIssue}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReportIssue}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#005F99] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <AlertTriangle size={14} />
                    Submit Issue
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-7 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white shadow-lg">
                  <CheckCircle2 size={30} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">
                  Issue Reported Successfully
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-500">
                  The operational issue has been recorded for {" "}
                  <span className="font-bold text-[#005F99]">
                    {selectedVehicle.vehicleNo}
                  </span>
                  .
                </p>
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Issue Type</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white">
                      {issueType}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Priority</span>
                    <span className="text-xs font-bold text-[#C8102E]">
                      {issuePriority}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeReportIssue}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#C8102E] to-[#005F99] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:shadow-lg"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
}