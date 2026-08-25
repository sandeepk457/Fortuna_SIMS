"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit3,
  Eye,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  MoreHorizontal,
  Phone,
  MapPin,
  CalendarDays,
  Truck,
  ShieldCheck,
  Download,
  ChevronLeft,
  ChevronRight,
  IdCard,
} from "lucide-react";

/* ============================================================
   FORTUNA THEME
============================================================ */

const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

/* ============================================================
   TYPES
============================================================ */

type DriverStatus = "Active" | "Inactive" | "On Leave" | "Suspended";

type Driver = {
  id: number;
  driverCode: string;
  fullName: string;
  mobile: string;
  licenseNo: string;
  licenseType: string;
  licenseExpiry: string;
  experience: string;
  assignedVehicle: string;
  city: string;
  joiningDate: string;
  status: DriverStatus;
};

/* ============================================================
   SAMPLE DATA
============================================================ */

const INITIAL_DRIVERS: Driver[] = [
  {
    id: 1,
    driverCode: "DRV-0001",
    fullName: "Ravi Kumar",
    mobile: "9876543210",
    licenseNo: "AP31-20230012345",
    licenseType: "Heavy Motor Vehicle",
    licenseExpiry: "18-Nov-2028",
    experience: "8 Years",
    assignedVehicle: "AP31XX1234",
    city: "Visakhapatnam",
    joiningDate: "12-Jan-2023",
    status: "Active",
  },
  {
    id: 2,
    driverCode: "DRV-0002",
    fullName: "Suresh Rao",
    mobile: "9848012345",
    licenseNo: "TS08-20220067891",
    licenseType: "Heavy Motor Vehicle",
    licenseExpiry: "05-Aug-2027",
    experience: "10 Years",
    assignedVehicle: "AP32XX5678",
    city: "Hyderabad",
    joiningDate: "05-Mar-2022",
    status: "Active",
  },
  {
    id: 3,
    driverCode: "DRV-0003",
    fullName: "Arun Kumar",
    mobile: "9912345678",
    licenseNo: "TN09-20210045678",
    licenseType: "Heavy Motor Vehicle",
    licenseExpiry: "22-Jun-2027",
    experience: "7 Years",
    assignedVehicle: "TN09AB7821",
    city: "Chennai",
    joiningDate: "18-Jul-2021",
    status: "On Leave",
  },
  {
    id: 4,
    driverCode: "DRV-0004",
    fullName: "Mahesh",
    mobile: "9988776655",
    licenseNo: "TS08-20240022331",
    licenseType: "Light Motor Vehicle",
    licenseExpiry: "14-Feb-2029",
    experience: "5 Years",
    assignedVehicle: "TS08CD4432",
    city: "Hyderabad",
    joiningDate: "02-Feb-2024",
    status: "Active",
  },
  {
    id: 5,
    driverCode: "DRV-0005",
    fullName: "Prakash",
    mobile: "9866123456",
    licenseNo: "KA01-20200099881",
    licenseType: "Heavy Motor Vehicle",
    licenseExpiry: "30-Mar-2026",
    experience: "12 Years",
    assignedVehicle: "KA01MN9012",
    city: "Bengaluru",
    joiningDate: "20-Jun-2020",
    status: "Suspended",
  },
  {
    id: 6,
    driverCode: "DRV-0006",
    fullName: "Ramesh Naidu",
    mobile: "9898989898",
    licenseNo: "AP31-20250011223",
    licenseType: "Heavy Motor Vehicle",
    licenseExpiry: "11-Dec-2029",
    experience: "6 Years",
    assignedVehicle: "Unassigned",
    city: "Visakhapatnam",
    joiningDate: "15-Apr-2025",
    status: "Active",
  },
];

/* ============================================================
   MAIN PAGE
============================================================ */

export default function DriverMasterPage() {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);

  const [search, setSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  /* ============================================================
     FORM
  ============================================================ */

  const emptyForm: Driver = {
    id: 0,
    driverCode: "",
    fullName: "",
    mobile: "",
    licenseNo: "",
    licenseType: "Heavy Motor Vehicle",
    licenseExpiry: "",
    experience: "",
    assignedVehicle: "Unassigned",
    city: "",
    joiningDate: "",
    status: "Active",
  };

  const [form, setForm] = useState<Driver>(emptyForm);

  /* ============================================================
     FILTERED DATA
  ============================================================ */

  const filteredDrivers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return drivers.filter((driver) => {
      const matchesSearch =
        !searchText ||
        driver.driverCode.toLowerCase().includes(searchText) ||
        driver.fullName.toLowerCase().includes(searchText) ||
        driver.mobile.toLowerCase().includes(searchText) ||
        driver.licenseNo.toLowerCase().includes(searchText) ||
        driver.assignedVehicle.toLowerCase().includes(searchText) ||
        driver.city.toLowerCase().includes(searchText);

      const matchesLicense =
        licenseFilter === "All" ||
        driver.licenseType === licenseFilter;

      const matchesStatus =
        statusFilter === "All" ||
        driver.status === statusFilter;

      return matchesSearch && matchesLicense && matchesStatus;
    });
  }, [drivers, search, licenseFilter, statusFilter]);

  /* ============================================================
     PAGINATION
  ============================================================ */

  const totalPages = Math.ceil(
    filteredDrivers.length / itemsPerPage
  );

  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ============================================================
     KPI
  ============================================================ */

  const totalDrivers = drivers.length;

  const activeDrivers = drivers.filter(
    (driver) => driver.status === "Active"
  ).length;

  const onLeaveDrivers = drivers.filter(
    (driver) => driver.status === "On Leave"
  ).length;

  const suspendedDrivers = drivers.filter(
    (driver) => driver.status === "Suspended"
  ).length;

  /* ============================================================
     RESET
  ============================================================ */

  function resetFilters() {
    setSearch("");
    setLicenseFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  /* ============================================================
     ADD DRIVER
  ============================================================ */

  function openAddDriver() {
    setEditingDriver(null);

    setForm({
      ...emptyForm,
      id: Date.now(),
      driverCode: `DRV-${String(drivers.length + 1).padStart(4, "0")}`,
    });

    setShowModal(true);
  }

  /* ============================================================
     EDIT DRIVER
  ============================================================ */

  function openEditDriver(driver: Driver) {
    setEditingDriver(driver);
    setForm({ ...driver });
    setShowModal(true);
  }

  /* ============================================================
     VIEW DRIVER
  ============================================================ */

  function openViewDriver(driver: Driver) {
    setSelectedDriver(driver);
    setShowViewModal(true);
  }

  /* ============================================================
     SAVE DRIVER
  ============================================================ */

  function handleSaveDriver(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.driverCode.trim() ||
      !form.fullName.trim() ||
      !form.mobile.trim() ||
      !form.licenseNo.trim() ||
      !form.licenseExpiry.trim()
    ) {
      alert("Please fill all mandatory driver fields.");
      return;
    }

    if (editingDriver) {
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === editingDriver.id
            ? { ...form }
            : driver
        )
      );
    } else {
      setDrivers((prev) => [
        {
          ...form,
          id: Date.now(),
        },
        ...prev,
      ]);
    }

    setShowModal(false);
    setEditingDriver(null);
    setForm(emptyForm);
  }

  /* ============================================================
     EXPORT EXCEL
============================================================ */

  function exportToExcel() {
    const headers = [
      "Driver Code",
      "Full Name",
      "Mobile",
      "License Number",
      "License Type",
      "License Expiry",
      "Experience",
      "Assigned Vehicle",
      "City",
      "Joining Date",
      "Status",
    ];

    const rows = filteredDrivers.map((driver) => [
      driver.driverCode,
      driver.fullName,
      driver.mobile,
      driver.licenseNo,
      driver.licenseType,
      driver.licenseExpiry,
      driver.experience,
      driver.assignedVehicle,
      driver.city,
      driver.joiningDate,
      driver.status,
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
                ${headers
                  .map((header) => `<th>${header}</th>`)
                  .join("")}
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
    link.download = "driver-master.xls";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /* ============================================================
     STATUS BADGE
  ============================================================ */

  function statusBadge(status: DriverStatus) {
    const styles: Record<DriverStatus, string> = {
      Active:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",

      Inactive:
        "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",

      "On Leave":
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",

      Suspended:
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
          HEADER
      ======================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: FORTUNA_RED,
              }}
            />

            <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937] dark:text-white">
              Driver Master
            </h1>

          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage driver profiles, licences, assignments and operational status.
          </p>
        </div>

        {/* Header Actions */}

        <div className="flex items-center gap-3">

          {/* Excel */}

          <button
            onClick={exportToExcel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005F99] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#005F99]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#004A78] hover:shadow-lg active:scale-95"
          >
            <Download size={17} />
            Download Excel
          </button>

          {/* Add Driver */}

          <button
            onClick={openAddDriver}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8102E] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#C8102E]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#A80D26] hover:shadow-lg active:scale-95"
          >
            <Plus size={17} />
            Add Driver
          </button>

        </div>

      </div>

      {/* ========================================================
          KPI CARDS
      ======================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          title="Total Drivers"
          value={totalDrivers}
          subtitle="Driver database"
          icon={<Users size={20} />}
          gradient="blue"
        />

        <KpiCard
          title="Active Drivers"
          value={activeDrivers}
          subtitle="Operational drivers"
          icon={<CheckCircle2 size={20} />}
          gradient="red"
        />

        <KpiCard
          title="On Leave"
          value={onLeaveDrivers}
          subtitle="Currently unavailable"
          icon={<AlertTriangle size={20} />}
          gradient="blue"
        />

        <KpiCard
          title="Suspended"
          value={suspendedDrivers}
          subtitle="Restricted drivers"
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
                Fleet Drivers
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Search, filter and manage registered drivers.
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
                Search Driver
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
                  placeholder="Name / Driver Code / Mobile / Vehicle"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                />

              </div>

            </div>

            {/* License Type */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Licence Type
              </label>

              <select
                value={licenseFilter}
                onChange={(e) => {
                  setLicenseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#005F99] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
              >
                <option value="All">
                  All Licence Types
                </option>

                <option value="Heavy Motor Vehicle">
                  Heavy Motor Vehicle
                </option>

                <option value="Light Motor Vehicle">
                  Light Motor Vehicle
                </option>

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
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
              </select>

            </div>

          </div>

        </div>

        {/* ======================================================
            TABLE
        ====================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px] text-left">

            <thead>

              <tr className="border-b border-gray-200 bg-[#C8102E]">

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white">
                  Driver
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white">
                  Contact
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white">
                  Licence
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white">
                  Experience
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white">
                  Vehicle
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white">
                  Location
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-white">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {paginatedDrivers.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >

                    <div className="mx-auto flex max-w-sm flex-col items-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005F99]/10 text-[#005F99]">
                        <Users size={24} />
                      </div>

                      <p className="font-semibold text-gray-800 dark:text-white">
                        No drivers found
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Try changing your search or filters.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                paginatedDrivers.map((driver) => (

                  <tr
                    key={driver.id}
                    className="group transition-colors hover:bg-[#005F99]/[0.025] dark:hover:bg-white/[0.025]"
                  >

                    {/* Driver */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#005F99] to-[#C8102E] text-white shadow-sm">
                          <Users size={18} />
                        </div>

                        <div>

                          <div className="font-semibold text-gray-900 dark:text-white">
                            {driver.fullName}
                          </div>

                          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <IdCard size={11} />
                            {driver.driverCode}
                          </div>

                        </div>

                      </div>

                    </td>

                    {/* Contact */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#005F99]/10 text-[#005F99]">
                          <Phone size={14} />
                        </div>

                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {driver.mobile}
                        </span>

                      </div>

                    </td>

                    {/* Licence */}

                    <td className="px-5 py-4">

                      <div className="text-sm font-semibold text-gray-800 dark:text-white">
                        {driver.licenseNo}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {driver.licenseType}
                      </div>

                      <div className="mt-1 text-[11px] text-[#C8102E]">
                        Exp: {driver.licenseExpiry}
                      </div>

                    </td>

                    {/* Experience */}

                    <td className="px-5 py-4">

                      <div className="text-sm font-semibold text-gray-800 dark:text-white">
                        {driver.experience}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500">
                        Driving experience
                      </div>

                    </td>

                    {/* Vehicle */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8102E]/10 text-[#C8102E]">
                          <Truck size={14} />
                        </div>

                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {driver.assignedVehicle}
                        </span>

                      </div>

                    </td>

                    {/* Location */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin
                          size={14}
                          className="text-[#005F99]"
                        />
                        {driver.city}
                      </div>

                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      {statusBadge(driver.status)}
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-1">

                        <button
                          onClick={() =>
                            openViewDriver(driver)
                          }
                          title="View Driver"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#005F99]/10 hover:text-[#005F99]"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() =>
                            openEditDriver(driver)
                          }
                          title="Edit Driver"
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
            PAGINATION
        ====================================================== */}

        <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:flex-row lg:items-center lg:justify-between">

          {/* Showing */}

          <div>

            Showing{" "}

            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {filteredDrivers.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}
            </span>

            {" - "}

            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {Math.min(
                currentPage * itemsPerPage,
                filteredDrivers.length
              )}
            </span>

            {" of "}

            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {filteredDrivers.length}
            </span>{" "}
            drivers

          </div>

          {/* Records */}

          <div className="flex items-center gap-2">

            <span>
              Records per page:
            </span>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(
                  Number(e.target.value)
                );
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

          {/* Navigation */}

          <div className="flex items-center gap-2">

            <button
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1)
                )
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
                  Math.min(
                    totalPages,
                    page + 1
                  )
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
          ADD / EDIT DRIVER MODAL
      ======================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">

            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8102E] to-[#005F99] text-white">
                    <Users size={19} />
                  </div>

                  <div>

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {editingDriver
                        ? "Edit Driver"
                        : "Add New Driver"}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Maintain driver master information for fleet operations.
                    </p>

                  </div>

                </div>

              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            {/* Form */}

            <form onSubmit={handleSaveDriver}>

              <div className="space-y-7 p-6">

                {/* Basic Information */}

                <FormSection
                  title="Driver Information"
                  subtitle="Maintain the driver's identity and contact details."
                >

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                    <FormInput
                      label="Driver Code"
                      required
                      value={form.driverCode}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          driverCode:
                            value.toUpperCase(),
                        }))
                      }
                      placeholder="DRV-0001"
                    />

                    <FormInput
                      label="Full Name"
                      required
                      value={form.fullName}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          fullName: value,
                        }))
                      }
                      placeholder="e.g. Ravi Kumar"
                    />

                    <FormInput
                      label="Mobile Number"
                      required
                      value={form.mobile}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          mobile: value,
                        }))
                      }
                      placeholder="e.g. 9876543210"
                    />

                    <FormInput
                      label="City"
                      value={form.city}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          city: value,
                        }))
                      }
                      placeholder="e.g. Visakhapatnam"
                    />

                    <FormInput
                      label="Joining Date"
                      value={form.joiningDate}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          joiningDate: value,
                        }))
                      }
                      placeholder="e.g. 15-Apr-2025"
                    />

                    <FormSelect
                      label="Status"
                      value={form.status}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          status:
                            value as DriverStatus,
                        }))
                      }
                      options={[
                        "Active",
                        "Inactive",
                        "On Leave",
                        "Suspended",
                      ]}
                    />

                  </div>

                </FormSection>

                {/* Licence */}

                <FormSection
                  title="Licence Information"
                  subtitle="Maintain driving licence and validity details."
                >

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                    <FormInput
                      label="Licence Number"
                      required
                      value={form.licenseNo}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          licenseNo:
                            value.toUpperCase(),
                        }))
                      }
                      placeholder="Licence number"
                    />

                    <FormSelect
                      label="Licence Type"
                      required
                      value={form.licenseType}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          licenseType: value,
                        }))
                      }
                      options={[
                        "Heavy Motor Vehicle",
                        "Light Motor Vehicle",
                      ]}
                    />

                    <FormInput
                      label="Licence Expiry"
                      required
                      value={form.licenseExpiry}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          licenseExpiry:
                            value,
                        }))
                      }
                      placeholder="e.g. 18-Nov-2028"
                    />

                    <FormInput
                      label="Driving Experience"
                      value={form.experience}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          experience: value,
                        }))
                      }
                      placeholder="e.g. 8 Years"
                    />

                  </div>

                </FormSection>

                {/* Vehicle Assignment */}

                <FormSection
                  title="Vehicle Assignment"
                  subtitle="Associate the driver with an operational fleet vehicle."
                >

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormSelect
                      label="Assigned Vehicle"
                      value={form.assignedVehicle}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          assignedVehicle:
                            value,
                        }))
                      }
                      options={[
                        "Unassigned",
                        "AP31XX1234",
                        "AP32XX5678",
                        "TN09AB7821",
                        "TS08CD4432",
                        "KA01MN9012",
                      ]}
                    />

                    <div className="rounded-xl border border-[#005F99]/15 bg-[#005F99]/5 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#005F99]/10 text-[#005F99]">
                          <Truck size={17} />
                        </div>

                        <div>

                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            Vehicle Assignment
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                            Driver-to-vehicle assignment can later be connected
                            directly with Vehicle Master records.
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </FormSection>

                {/* Compliance */}

                <FormSection
                  title="Driver Compliance"
                  subtitle="Maintain driver eligibility and licence validity information."
                >

                  <div className="rounded-xl border border-[#C8102E]/15 bg-[#C8102E]/5 p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C8102E]/10 text-[#C8102E]">
                        <ShieldCheck size={17} />
                      </div>

                      <div>

                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          Compliance Monitoring
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                          Licence expiry, driver eligibility and compliance
                          alerts can be integrated with the Fleet module.
                        </p>

                      </div>

                    </div>

                  </div>

                </FormSection>

              </div>

              {/* Footer */}

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#C8102E] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#C8102E]/20 transition hover:bg-[#A80D26] hover:shadow-lg"
                >
                  {editingDriver
                    ? "Update Driver"
                    : "Save Driver"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ========================================================
          VIEW DRIVER MODAL
      ======================================================== */}

      {showViewModal && selectedDriver && (

        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">

            {/* Gradient Header */}

            <div className="relative overflow-hidden bg-gradient-to-br from-[#005F99] to-[#C8102E] px-6 py-6 text-white">

              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-start justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <Users size={28} />
                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-wider text-white/70">
                      Driver Master
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      {selectedDriver.fullName}
                    </h2>

                    <p className="mt-1 text-sm text-white/75">
                      {selectedDriver.driverCode}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setShowViewModal(false)
                  }
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
                    {statusBadge(
                      selectedDriver.status
                    )}
                  </div>

                </div>

                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditDriver(
                      selectedDriver
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#005F99] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004A78]"
                >
                  <Edit3 size={15} />
                  Edit Driver
                </button>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <DetailItem
                  icon={<IdCard size={16} />}
                  label="Driver Code"
                  value={
                    selectedDriver.driverCode
                  }
                />

                <DetailItem
                  icon={<Phone size={16} />}
                  label="Mobile"
                  value={
                    selectedDriver.mobile
                  }
                />

                <DetailItem
                  icon={<Truck size={16} />}
                  label="Vehicle"
                  value={
                    selectedDriver.assignedVehicle
                  }
                />

                <DetailItem
                  icon={<ShieldCheck size={16} />}
                  label="Licence Type"
                  value={
                    selectedDriver.licenseType
                  }
                />

                <DetailItem
                  icon={<IdCard size={16} />}
                  label="Licence Number"
                  value={
                    selectedDriver.licenseNo
                  }
                />

                <DetailItem
                  icon={<CalendarDays size={16} />}
                  label="Licence Expiry"
                  value={
                    selectedDriver.licenseExpiry
                  }
                />

                <DetailItem
                  icon={<CalendarDays size={16} />}
                  label="Experience"
                  value={
                    selectedDriver.experience ||
                    "Not available"
                  }
                />

                <DetailItem
                  icon={<MapPin size={16} />}
                  label="City"
                  value={
                    selectedDriver.city ||
                    "Not assigned"
                  }
                />

                <DetailItem
                  icon={<CalendarDays size={16} />}
                  label="Joining Date"
                  value={
                    selectedDriver.joiningDate ||
                    "Not available"
                  }
                />

              </div>

            </div>

            {/* Footer */}

            <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">

              <button
                onClick={() =>
                  setShowViewModal(false)
                }
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
          <span className="ml-1 text-[#C8102E]">
            *
          </span>
        )}

      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
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
          <span className="ml-1 text-[#C8102E]">
            *
          </span>
        )}

      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#005F99] focus:ring-2 focus:ring-[#005F99]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
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