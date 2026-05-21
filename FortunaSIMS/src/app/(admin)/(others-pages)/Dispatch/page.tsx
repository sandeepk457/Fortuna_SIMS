"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Truck,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Filter,
  Plus,
  MapPin,
  CalendarDays,
  Package,
} from "lucide-react";



const COLORS = {
  primary: "#005F99",
  secondary: "#C8102E",
  bg: "#ECF5FC",
  card: "#FFFFFF",
  border: "#DCE6F2",
  text: "#0F172A",
  muted: "#64748B",
  success: "#16A34A",
  warning: "#F59E0B",
};

const dispatchData = [
  {
    id: "DCH-2026-0041",
    transferNo: "TRN-2026-101",
    fromWarehouse: "Vizag Central Warehouse",
    toWarehouse: "Hyderabad RDC",
    status: "Pending",
    priority: "High",
    transporter: "Apex Logistics",
    vehicle: "TN-45-AB-1234",
    plannedQty: 260,
    dispatchedQty: 0,
    createdDate: "2026-05-10",
    eta: "2026-05-12",
  },
  {
    id: "DCH-2026-0042",
    transferNo: "TRN-2026-102",
    fromWarehouse: "Chennai WH",
    toWarehouse: "Bangalore RDC",
    status: "In Transit",
    priority: "Medium",
    transporter: "VRL Logistics",
    vehicle: "KA-01-ZX-8899",
    plannedQty: 180,
    dispatchedQty: 160,
    createdDate: "2026-05-09",
    eta: "2026-05-11",
  },
  {
    id: "DCH-2026-0043",
    transferNo: "TRN-2026-103",
    fromWarehouse: "Pune Warehouse",
    toWarehouse: "Mumbai RDC",
    status: "Delivered",
    priority: "Low",
    transporter: "SafeExpress",
    vehicle: "MH-20-AA-1122",
    plannedQty: 95,
    dispatchedQty: 95,
    createdDate: "2026-05-08",
    eta: "2026-05-09",
  },
  {
    id: "DCH-2026-0044",
    transferNo: "TRN-2026-104",
    fromWarehouse: "Delhi WH",
    toWarehouse: "Noida RDC",
    status: "Exception",
    priority: "High",
    transporter: "BlueDart",
    vehicle: "DL-11-XX-2200",
    plannedQty: 320,
    dispatchedQty: 210,
    createdDate: "2026-05-07",
    eta: "2026-05-10",
  },
];

export default function DispatchListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");





  const filteredData = useMemo(() => {
    return dispatchData.filter((row) => {
      const matchesSearch =
        row.id.toLowerCase().includes(search.toLowerCase()) ||
        row.transferNo.toLowerCase().includes(search.toLowerCase()) ||
        row.fromWarehouse.toLowerCase().includes(search.toLowerCase()) ||
        row.toWarehouse.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const stats = {
    pending: dispatchData.filter((x) => x.status === "Pending").length,
    transit: dispatchData.filter((x) => x.status === "In Transit").length,
    delivered: dispatchData.filter((x) => x.status === "Delivered").length,
    exception: dispatchData.filter((x) => x.status === "Exception").length,
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "In Transit":
        return "bg-blue-100 text-blue-700";
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Exception":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-orange-100 text-orange-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* <p
            className="text-sm uppercase tracking-[0.35em]"
            style={{ color: "#7C96B8" }}
          >
            Fortuna SIMS
          </p> */}

          <h1
            className="mt-2 text-4xl font-bold"
            style={{ color: COLORS.text }}
          >
            Dispatch Management
          </h1>

          <p
            className="mt-2 max-w-3xl text-base"
            style={{ color: COLORS.muted }}
          >
            Manage warehouse transfer dispatches, transporter movements,
            shipment tracking and delivery monitoring from one centralized
            control workspace.
          </p>
        </div>

        <button
  onClick={() => router.push("/Dispatch/Details")}
  className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
  style={{ backgroundColor: COLORS.primary }}
>
  <Plus size={18} />
  Create Dispatch
</button>
      </div>

      {/* KPI Cards */}
<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
  <StatCard
    title="Pending Dispatch"
    value={stats.pending}
    icon={<Clock3 size={18} />}
    bg="linear-gradient(135deg, #C8102E 0%, #D94A63 100%)"
  />

  <StatCard
    title="In Transit"
    value={stats.transit}
    icon={<Truck size={18} />}
    bg="linear-gradient(135deg, #005F99 0%, #2C7FB8 100%)"
  />

  <StatCard
    title="Delivered"
    value={stats.delivered}
    icon={<CheckCircle2 size={18} />}
    bg="linear-gradient(135deg, #0F9D58 0%, #34C38F 100%)"
  />

  <StatCard
    title="Exceptions"
    value={stats.exception}
    icon={<AlertTriangle size={18} />}
    bg="linear-gradient(135deg, #B45309 0%, #F59E0B 100%)"
  />
</div>

      {/* Filters */}
      <div
        className="mt-8 rounded-3xl border p-5 shadow-sm"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.border,
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border bg-white px-4 py-3">
            <Search size={18} style={{ color: COLORS.muted }} />

            <input
              type="text"
              placeholder="Search Dispatch / Transfer / Warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3">
              <Filter size={18} style={{ color: COLORS.muted }} />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm outline-none"
              >
                <option>All</option>
                <option>Pending</option>
                <option>In Transit</option>
                <option>Delivered</option>
                <option>Exception</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Table */}
      <div
        className="mt-8 overflow-hidden rounded-3xl border shadow-sm"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.border,
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead
              className="border-b"
              style={{
                backgroundColor: "#F8FBFF",
                borderColor: COLORS.border,
              }}
            >
              <tr>
                {[
                  "Dispatch",
                  "Route",
                  "Transport",
                  "Quantity",
                  "Priority",
                  "Status",
                  "ETA",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em]"
                    style={{ color: "#7C96B8" }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredData.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b transition hover:bg-slate-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  }`}
                  style={{ borderColor: COLORS.border }}
                >
                  {/* Dispatch */}
                  <td className="px-6 py-5">
                    <div>
                      <div
                        className="text-base font-bold"
                        style={{ color: COLORS.text }}
                      >
                        {row.id}
                      </div>

                      <div
                        className="mt-1 text-xs"
                        style={{ color: COLORS.muted }}
                      >
                        {row.transferNo}
                      </div>
                    </div>
                  </td>

                  {/* Route */}
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={15}
                          style={{ color: COLORS.primary }}
                        />

                        <span
                          className="text-sm font-semibold"
                          style={{ color: COLORS.text }}
                        >
                          {row.fromWarehouse}
                        </span>
                      </div>

                      <div
                        className="pl-6 text-xs"
                        style={{ color: COLORS.muted }}
                      >
                        ↓
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin
                          size={15}
                          style={{ color: COLORS.secondary }}
                        />

                        <span
                          className="text-sm font-semibold"
                          style={{ color: COLORS.text }}
                        >
                          {row.toWarehouse}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Transport */}
                  <td className="px-6 py-5">
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: COLORS.text }}
                      >
                        {row.transporter}
                      </div>

                      <div
                        className="mt-1 text-xs"
                        style={{ color: COLORS.muted }}
                      >
                        Vehicle: {row.vehicle}
                      </div>
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Package
                        size={18}
                        style={{ color: COLORS.primary }}
                      />

                      <div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: COLORS.text }}
                        >
                          {row.dispatchedQty}/{row.plannedQty}
                        </div>

                        <div
                          className="text-xs"
                          style={{ color: COLORS.muted }}
                        >
                          Units
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${priorityBadge(
                        row.priority
                      )}`}
                    >
                      {row.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* ETA */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={16}
                        style={{ color: COLORS.primary }}
                      />

                      <div>
                        <div
                          className="text-sm font-semibold"
                          style={{ color: COLORS.text }}
                        >
                          {row.eta}
                        </div>

                        <div
                          className="text-xs"
                          style={{ color: COLORS.muted }}
                        >
                          Expected Delivery
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5">
                  <button
  onClick={() =>
  router.push(`/Dispatch/Details?id=${row.id}`)
}
  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
  style={{ backgroundColor: COLORS.primary }}
>
  <Eye size={16} />
  View
</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>





        {filteredData.length === 0 && (
          <div className="p-10 text-center">
            <div
              className="text-lg font-semibold"
              style={{ color: COLORS.text }}
            >
              No dispatch records found
            </div>

            <div
              className="mt-2 text-sm"
              style={{ color: COLORS.muted }}
            >
              Try changing search or filter criteria.
            </div>
          </div>
        )}
      </div>



  </div>
);
}








//function statcard//

function StatCard({
  title,
  value,
  icon,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-5 text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: bg,
      }}
    >
      {/* Soft Glow */}
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
            {title}
          </p>

          <h2 className="mt-5 text-4xl font-bold leading-none">
            {value}
          </h2>
        </div>

        <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}


