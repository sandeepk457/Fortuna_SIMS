"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit3,
  Eye,
  Truck,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  MoreHorizontal,
  Fuel,
  MapPin,
  CalendarDays,
  Gauge,
  ShieldCheck,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ============================================================
   FORTUNA THEME
============================================================ */

const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

/* ============================================================
   TYPES
============================================================ */

type VehicleStatus = "Active" | "Inactive" | "Maintenance" | "Blocked";

type Vehicle = {
  id: number;
  vehicleNo: string;
  vehicleType: string;
  vehicleCategory: string;
  make: string;
  model: string;
  year: string;
  capacity: string;
  capacityUom: string;
  fuelType: string;
  ownershipType: string;
  driver: string;
  city: string;
  status: VehicleStatus;
  lastService: string;
};

/* ============================================================
   SAMPLE DATA
   UI ONLY — BACKEND WILL BE CONNECTED LATER
============================================================ */

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 1,
    vehicleNo: "AP31XX1234",
    vehicleType: "Truck",
    vehicleCategory: "Heavy Vehicle",
    make: "Tata",
    model: "Prima",
    year: "2023",
    capacity: "20",
    capacityUom: "Ton",
    fuelType: "Diesel",
    ownershipType: "Owned",
    driver: "Ravi Kumar",
    city: "Visakhapatnam",
    status: "Active",
    lastService: "12-Aug-2026",
  },
  {
    id: 2,
    vehicleNo: "AP32XX5678",
    vehicleType: "Trailer",
    vehicleCategory: "Heavy Vehicle",
    make: "Ashok Leyland",
    model: "AVTR",
    year: "2022",
    capacity: "30",
    capacityUom: "Ton",
    fuelType: "Diesel",
    ownershipType: "Owned",
    driver: "Suresh Rao",
    city: "Hyderabad",
    status: "Active",
    lastService: "08-Aug-2026",
  },
  {
    id: 3,
    vehicleNo: "TN09AB7821",
    vehicleType: "Truck",
    vehicleCategory: "Medium Vehicle",
    make: "BharatBenz",
    model: "2823R",
    year: "2024",
    capacity: "16",
    capacityUom: "Ton",
    fuelType: "Diesel",
    ownershipType: "Leased",
    driver: "Arun Kumar",
    city: "Chennai",
    status: "Maintenance",
    lastService: "20-Jul-2026",
  },
  {
    id: 4,
    vehicleNo: "TS08CD4432",
    vehicleType: "Mini Truck",
    vehicleCategory: "Light Vehicle",
    make: "Tata",
    model: "407",
    year: "2023",
    capacity: "5",
    capacityUom: "Ton",
    fuelType: "Diesel",
    ownershipType: "Owned",
    driver: "Mahesh",
    city: "Hyderabad",
    status: "Active",
    lastService: "03-Aug-2026",
  },
  {
    id: 5,
    vehicleNo: "KA01MN9012",
    vehicleType: "Container",
    vehicleCategory: "Heavy Vehicle",
    make: "Volvo",
    model: "FM",
    year: "2021",
    capacity: "25",
    capacityUom: "Ton",
    fuelType: "Diesel",
    ownershipType: "Leased",
    driver: "Prakash",
    city: "Bengaluru",
    status: "Inactive",
    lastService: "15-Jun-2026",
  },
];

/* ============================================================
   MAIN PAGE
============================================================ */

export default function VehicleMasterPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  /* ============================================================
     FORM STATE
  ============================================================ */

  const emptyForm: Vehicle = {
    id: 0,
    vehicleNo: "",
    vehicleType: "Truck",
    vehicleCategory: "Heavy Vehicle",
    make: "",
    model: "",
    year: "",
    capacity: "",
    capacityUom: "Ton",
    fuelType: "Diesel",
    ownershipType: "Owned",
    driver: "",
    city: "",
    status: "Active",
    lastService: "",
  };

  const [form, setForm] = useState<Vehicle>(emptyForm);

  /* ============================================================
     FILTERED DATA
  ============================================================ */

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        vehicle.vehicleNo.toLowerCase().includes(searchText) ||
        vehicle.make.toLowerCase().includes(searchText) ||
        vehicle.model.toLowerCase().includes(searchText) ||
        vehicle.driver.toLowerCase().includes(searchText) ||
        vehicle.city.toLowerCase().includes(searchText);

      const matchesType =
        typeFilter === "All" || vehicle.vehicleType === typeFilter;

      const matchesStatus =
        statusFilter === "All" || vehicle.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, search, typeFilter, statusFilter]);


  const totalPages = Math.ceil(
  filteredVehicles.length / itemsPerPage
);

const paginatedVehicles = filteredVehicles.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

  /* ============================================================
     KPI VALUES
  ============================================================ */

  const totalVehicles = vehicles.length;

  const activeVehicles = vehicles.filter(
    (v) => v.status === "Active"
  ).length;

  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "Maintenance"
  ).length;

  const blockedVehicles = vehicles.filter(
    (v) => v.status === "Blocked"
  ).length;

  /* ============================================================
     RESET FILTERS
  ============================================================ */

  function resetFilters() {
  setSearch("");
  setTypeFilter("All");
  setStatusFilter("All");
  setCurrentPage(1);
}


function exportToExcel() {
  const headers = [
    "Vehicle Number",
    "Vehicle Type",
    "Category",
    "Make",
    "Model",
    "Year",
    "Capacity",
    "Capacity UOM",
    "Fuel Type",
    "Ownership",
    "Driver",
    "City",
    "Status",
    "Last Service",
  ];

  const rows = filteredVehicles.map((vehicle) => [
    vehicle.vehicleNo,
    vehicle.vehicleType,
    vehicle.vehicleCategory,
    vehicle.make,
    vehicle.model,
    vehicle.year,
    vehicle.capacity,
    vehicle.capacityUom,
    vehicle.fuelType,
    vehicle.ownershipType,
    vehicle.driver,
    vehicle.city,
    vehicle.status,
    vehicle.lastService,
  ]);

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${String(cell ?? "")}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              ${headers.map((header) => `<th>${header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "vehicle-master.xls";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

  /* ============================================================
     OPEN ADD
  ============================================================ */

  function openAddVehicle() {
    setEditingVehicle(null);
    setForm({
      ...emptyForm,
      id: Date.now(),
    });
    setShowModal(true);
  }

  /* ============================================================
     OPEN EDIT
  ============================================================ */

  function openEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setForm({ ...vehicle });
    setShowModal(true);
  }

  /* ============================================================
     OPEN VIEW
  ============================================================ */

  function openViewVehicle(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setShowViewModal(true);
  }

  /* ============================================================
     SAVE VEHICLE
  ============================================================ */

  function handleSaveVehicle(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.vehicleNo.trim() ||
      !form.vehicleType ||
      !form.make.trim() ||
      !form.model.trim() ||
      !form.capacity.trim()
    ) {
      alert("Please fill all mandatory vehicle fields.");
      return;
    }

    if (editingVehicle) {
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === editingVehicle.id ? { ...form } : vehicle
        )
      );
    } else {
      setVehicles((prev) => [
        {
          ...form,
          id: Date.now(),
        },
        ...prev,
      ]);
    }

    setShowModal(false);
    setEditingVehicle(null);
    setForm(emptyForm);
  }

  /* ============================================================
     STATUS BADGE
  ============================================================ */

  function statusBadge(status: VehicleStatus) {
    const styles: Record<VehicleStatus, string> = {
      Active:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      Inactive:
        "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
      Maintenance:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      Blocked:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {status}
      </span>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="space-y-6">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: FORTUNA_RED }}
            />

            <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937] dark:text-white">
              Vehicle Master
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage fleet vehicles, capacity, ownership and operational status.
          </p>
        </div>

        {/* Excel Download */}
    {/* Header Actions */}
<div className="flex items-center gap-3">
  {/* Download Excel - Fortuna Blue */}
  <button
    onClick={exportToExcel}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005F99] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#005F99]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#004A78] hover:shadow-lg active:scale-95"
  >
    <Download size={17} />
    Download Excel
  </button>

  {/* Add Vehicle - Fortuna Red */}
  <button
    onClick={openAddVehicle}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8102E] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#C8102E]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#A80D26] hover:shadow-lg active:scale-95"
  >
    <Plus size={17} />
    Add Vehicle
  </button>
</div>
</div>

      {/* ========================================================
          KPI CARDS
      ======================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          title="Total Vehicles"
          value={totalVehicles}
          subtitle="Fleet database"
          icon={<Truck size={20} />}
          gradient="blue"
        />

        <KpiCard
          title="Active Vehicles"
          value={activeVehicles}
          subtitle="Operational fleet"
          icon={<CheckCircle2 size={20} />}
          gradient="red"
        />

        <KpiCard
          title="Maintenance"
          value={maintenanceVehicles}
          subtitle="Requires attention"
          icon={<AlertTriangle size={20} />}
          gradient="blue"
        />

        <KpiCard
          title="Blocked"
          value={blockedVehicles}
          subtitle="Restricted vehicles"
          icon={<ShieldCheck size={20} />}
          gradient="red"
        />

      </div>

      {/* ========================================================
          MAIN CONTAINER
      ======================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        {/* ======================================================
            FILTER HEADER
        ====================================================== */}

        <div className="border-b border-gray-100 p-5 dark:border-gray-800">

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Fleet Vehicles
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Search, filter and manage registered vehicles.
              </p>
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-[#005F99] hover:text-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* Search */}

            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Search Vehicle
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1);
}}
                  placeholder="Vehicle No / Make / Model / Driver"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                />
              </div>
            </div>

            {/* Vehicle Type */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Vehicle Type
              </label>

              <select
                value={typeFilter}
                onChange={(e) => {
  setTypeFilter(e.target.value);
  setCurrentPage(1);
}}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
              >
                <option value="All">All Types</option>
                <option value="Truck">Truck</option>
                <option value="Trailer">Trailer</option>
                <option value="Mini Truck">Mini Truck</option>
                <option value="Container">Container</option>
              </select>
            </div>

            {/* Status */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => {
  setStatusFilter(e.target.value);
  setCurrentPage(1);
}}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

          </div>
        </div>

        {/* ======================================================
            TABLE
        ====================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] text-left">

            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-950/60">

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Vehicle
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Type
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Capacity
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Driver
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Location
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Fuel
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {filteredVehicles.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005F99]/10 text-[#005F99]">
                        <Truck size={24} />
                      </div>

                      <p className="font-semibold text-gray-800 dark:text-white">
                        No vehicles found
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Try changing your search or filters.
                      </p>

                    </div>
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="group transition-colors hover:bg-[#005F99]/[0.025] dark:hover:bg-white/[0.025]"
                  >

                    {/* Vehicle */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white shadow-sm">
                          <Truck size={18} />
                        </div>

                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {vehicle.vehicleNo}
                          </div>

                          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {vehicle.make} {vehicle.model}
                          </div>
                        </div>

                      </div>

                    </td>

                    {/* Type */}

                    <td className="px-5 py-4">

                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {vehicle.vehicleType}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {vehicle.vehicleCategory}
                      </div>

                    </td>

                    {/* Capacity */}

                    <td className="px-5 py-4">

                      <div className="text-sm font-semibold text-gray-800 dark:text-white">
                        {vehicle.capacity} {vehicle.capacityUom}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500">
                        Load capacity
                      </div>

                    </td>

                    {/* Driver */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8102E]/10 text-[#C8102E]">
                          <Users size={14} />
                        </div>

                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {vehicle.driver || "Unassigned"}
                        </div>

                      </div>

                    </td>

                    {/* Location */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin size={14} className="text-[#005F99]" />
                        {vehicle.city}
                      </div>

                    </td>

                    {/* Fuel */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <Fuel size={14} className="text-[#C8102E]" />
                        {vehicle.fuelType}
                      </div>

                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      {statusBadge(vehicle.status)}
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-1">

                        <button
                          onClick={() => openViewVehicle(vehicle)}
                          title="View Vehicle"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#005F99]/10 hover:text-[#005F99]"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => openEditVehicle(vehicle)}
                          title="Edit Vehicle"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#C8102E]/10 hover:text-[#C8102E]"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          title="More"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* ======================================================
            TABLE FOOTER
        ====================================================== */}

        <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:flex-row lg:items-center lg:justify-between">

  {/* Showing */}
  <div>
    Showing{" "}
    <span className="font-semibold text-gray-700 dark:text-gray-200">
      {filteredVehicles.length === 0
        ? 0
        : (currentPage - 1) * itemsPerPage + 1}
    </span>
    {" - "}
    <span className="font-semibold text-gray-700 dark:text-gray-200">
      {Math.min(
        currentPage * itemsPerPage,
        filteredVehicles.length
      )}
    </span>
    {" of "}
    <span className="font-semibold text-gray-700 dark:text-gray-200">
      {filteredVehicles.length}
    </span>{" "}
    vehicles
  </div>

  {/* Records per page */}
  <div className="flex items-center gap-2">
    <span>Records per page:</span>

    <select
      value={itemsPerPage}
      onChange={(e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
      }}
      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
    >
      <option value={5}>5</option>
      <option value={10}>10</option>
      <option value={25}>25</option>
      <option value={50}>50</option>
    </select>
  </div>

  {/* Pagination */}
  <div className="flex items-center gap-2">

    <button
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage((page) => Math.max(1, page - 1))
      }
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-[#005F99] hover:text-[#005F99] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
    >
      <ChevronLeft size={14} />
      Previous
    </button>

    <div className="rounded-lg bg-[#005F99] px-3 py-1.5 text-xs font-bold text-white">
      {currentPage} / {Math.max(totalPages, 1)}
    </div>

    <button
      disabled={
        currentPage === totalPages ||
        totalPages === 0
      }
      onClick={() =>
        setCurrentPage((page) =>
          Math.min(totalPages, page + 1)
        )
      }
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-[#005F99] hover:text-[#005F99] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
    >
      Next
      <ChevronRight size={14} />
    </button>

  </div>

</div>

      </div>

      {/* ========================================================
          ADD / EDIT VEHICLE MODAL
      ======================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">

            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">

              <div>
                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8102E] to-[#005F99] text-white">
                    <Truck size={18} />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                  </h2>

                </div>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maintain vehicle master information for fleet operations.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            {/* Form */}

            <form onSubmit={handleSaveVehicle}>

              <div className="space-y-7 p-6">

                {/* Basic Information */}

                <FormSection
                  title="Basic Vehicle Information"
                  subtitle="Identify the vehicle and its classification."
                >

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                    <FormInput
                      label="Vehicle Number"
                      required
                      value={form.vehicleNo}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          vehicleNo: value.toUpperCase(),
                        }))
                      }
                      placeholder="e.g. AP31XX1234"
                    />

                    <FormSelect
                      label="Vehicle Type"
                      required
                      value={form.vehicleType}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          vehicleType: value,
                        }))
                      }
                      options={[
                        "Truck",
                        "Trailer",
                        "Mini Truck",
                        "Container",
                      ]}
                    />

                    <FormSelect
                      label="Vehicle Category"
                      value={form.vehicleCategory}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          vehicleCategory: value,
                        }))
                      }
                      options={[
                        "Heavy Vehicle",
                        "Medium Vehicle",
                        "Light Vehicle",
                      ]}
                    />

                    <FormInput
                      label="Make"
                      required
                      value={form.make}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          make: value,
                        }))
                      }
                      placeholder="e.g. Tata"
                    />

                    <FormInput
                      label="Model"
                      required
                      value={form.model}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          model: value,
                        }))
                      }
                      placeholder="e.g. Prima"
                    />

                    <FormInput
                      label="Manufacturing Year"
                      value={form.year}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          year: value,
                        }))
                      }
                      placeholder="e.g. 2024"
                    />

                  </div>

                </FormSection>

                {/* Capacity */}

                <FormSection
                  title="Capacity & Operations"
                  subtitle="Define vehicle load and operational characteristics."
                >

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

                    <FormInput
                      label="Load Capacity"
                      required
                      value={form.capacity}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          capacity: value,
                        }))
                      }
                      placeholder="e.g. 20"
                    />

                    <FormSelect
                      label="Capacity UOM"
                      value={form.capacityUom}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          capacityUom: value,
                        }))
                      }
                      options={["Ton", "Kg", "Litre", "Cubic Meter"]}
                    />

                    <FormSelect
                      label="Fuel Type"
                      value={form.fuelType}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          fuelType: value,
                        }))
                      }
                      options={[
                        "Diesel",
                        "Petrol",
                        "CNG",
                        "LNG",
                        "Electric",
                        "Hybrid",
                      ]}
                    />

                    <FormSelect
                      label="Ownership"
                      value={form.ownershipType}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          ownershipType: value,
                        }))
                      }
                      options={[
                        "Owned",
                        "Leased",
                        "Contract",
                      ]}
                    />

                  </div>

                </FormSection>

                {/* Assignment */}

                <FormSection
                  title="Assignment & Location"
                  subtitle="Assign the vehicle to an operational driver and location."
                >

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                    <FormInput
                      label="Current Driver"
                      value={form.driver}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          driver: value,
                        }))
                      }
                      placeholder="e.g. Ravi Kumar"
                    />

                    <FormInput
                      label="Operating City"
                      value={form.city}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          city: value,
                        }))
                      }
                      placeholder="e.g. Visakhapatnam"
                    />

                    <FormSelect
                      label="Status"
                      value={form.status}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          status: value as VehicleStatus,
                        }))
                      }
                      options={[
                        "Active",
                        "Inactive",
                        "Maintenance",
                        "Blocked",
                      ]}
                    />

                  </div>

                </FormSection>

                {/* Maintenance */}

                <FormSection
                  title="Maintenance"
                  subtitle="Track the latest vehicle service reference."
                >

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormInput
                      label="Last Service Date"
                      value={form.lastService}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          lastService: value,
                        }))
                      }
                      placeholder="e.g. 12-Aug-2026"
                    />

                    <div className="rounded-xl border border-[#005F99]/15 bg-[#005F99]/5 p-4">
                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#005F99]/10 text-[#005F99]">
                          <Gauge size={17} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            Fleet Maintenance Control
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                            Maintenance scheduling and service history can be
                            integrated with the Fleet Maintenance module.
                          </p>
                        </div>

                      </div>
                    </div>

                  </div>

                </FormSection>

              </div>

              {/* Modal Footer */}

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#C8102E] to-[#005F99] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {editingVehicle ? "Update Vehicle" : "Save Vehicle"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ========================================================
          VIEW VEHICLE MODAL
      ======================================================== */}

      {showViewModal && selectedVehicle && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">

            {/* Header */}

            <div className="relative overflow-hidden bg-gradient-to-br from-[#005F99] to-[#C8102E] px-6 py-6 text-white">

              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-start justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <Truck size={28} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/70">
                      Vehicle Master
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      {selectedVehicle.vehicleNo}
                    </h2>

                    <p className="mt-1 text-sm text-white/75">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            {/* Details */}

            <div className="p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Operational Status
                  </p>

                  <div className="mt-2">
                    {statusBadge(selectedVehicle.status)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditVehicle(selectedVehicle);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#005F99] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004a78]"
                >
                  <Edit3 size={15} />
                  Edit Vehicle
                </button>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <DetailItem
                  icon={<Truck size={16} />}
                  label="Vehicle Type"
                  value={selectedVehicle.vehicleType}
                />

                <DetailItem
                  icon={<Gauge size={16} />}
                  label="Capacity"
                  value={`${selectedVehicle.capacity} ${selectedVehicle.capacityUom}`}
                />

                <DetailItem
                  icon={<Fuel size={16} />}
                  label="Fuel Type"
                  value={selectedVehicle.fuelType}
                />

                <DetailItem
                  icon={<Users size={16} />}
                  label="Current Driver"
                  value={selectedVehicle.driver || "Unassigned"}
                />

                <DetailItem
                  icon={<MapPin size={16} />}
                  label="Operating City"
                  value={selectedVehicle.city || "Not assigned"}
                />

                <DetailItem
                  icon={<CalendarDays size={16} />}
                  label="Manufacturing Year"
                  value={selectedVehicle.year || "Not available"}
                />

                <DetailItem
                  icon={<ShieldCheck size={16} />}
                  label="Ownership"
                  value={selectedVehicle.ownershipType}
                />

                <DetailItem
                  icon={<Gauge size={16} />}
                  label="Category"
                  value={selectedVehicle.vehicleCategory}
                />

                <DetailItem
                  icon={<CalendarDays size={16} />}
                  label="Last Service"
                  value={selectedVehicle.lastService || "Not available"}
                />

              </div>

            </div>

            {/* Footer */}

            <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">

              <button
                onClick={() => setShowViewModal(false)}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: "red" | "blue";
}) {
  const gradientClass =
    gradient === "red"
      ? "from-[#C8102E] via-[#D51F3D] to-[#9F0D25]"
      : "from-[#005F99] via-[#087DBA] to-[#00466F]";

  const shadowClass =
    gradient === "red"
      ? "shadow-[0_12px_35px_rgba(200,16,46,0.18)] hover:shadow-[0_18px_45px_rgba(200,16,46,0.28)]"
      : "shadow-[0_12px_35px_rgba(0,95,153,0.18)] hover:shadow-[0_18px_45px_rgba(0,95,153,0.28)]";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br ${gradientClass} p-5 text-white transition-all duration-300 hover:-translate-y-1 ${shadowClass}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl transition-transform duration-500 group-hover:scale-125" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />

      <div className="relative z-10">

        <div className="flex items-center justify-between">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-md">
            {icon}
          </div>

          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white/80">
            LIVE
          </span>

        </div>

        <div className="mt-5">

          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {title}
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-white/60">
            {subtitle}
          </p>

        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-black/15 ring-1 ring-white/10">
          <div className="h-full w-[48%] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] transition-all duration-700 group-hover:w-[65%]" />
        </div>

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

      <div className="mb-4 flex items-start gap-3">

        <div className="mt-1 h-8 w-1 rounded-full bg-gradient-to-b from-[#C8102E] to-[#005F99]" />

        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
          <span className="ml-1 text-[#C8102E]">*</span>
        )}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}

        {required && (
          <span className="ml-1 text-[#C8102E]">*</span>
        )}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

    </div>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950">

      <div className="flex items-center gap-2 text-[#005F99]">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white">
        {value}
      </p>

    </div>
  );
}