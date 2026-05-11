"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

/** 🎨 Theme */
const RED = "#C8102E";
const BLUE = "#005F99";

/** TYPES */
type Status =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Dispatched"
  | "In Transit"
  | "Completed";

type Transfer = {
  id: number;
  from: string;
  to: string;
  date: string;
  status: Status;
  value: number;
};

/** UTIL */
function cn(...v: any[]) {
  return v.filter(Boolean).join(" ");
}

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function TransferDashboard() {
  const router = useRouter();

  /** FILTERS */
 const [filters, setFilters] = useState({
  id: "",
  from: "",
  to: "",
  date: "",
  status: "",
  value: "",
});
const [activeTab, setActiveTab] = useState<"all" | "draft">("all");
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(5);

  /** STATIC DATA */
  const [data] = useState<Transfer[]>([
    { id: 1001, from: "Vizag WH", to: "Hyderabad WH", date: "2026-04-20", status: "Draft", value: 25000 },
    { id: 1002, from: "Vizag WH", to: "Chennai WH", date: "2026-04-18", status: "Approved", value: 52000 },
    { id: 1003, from: "Delhi WH", to: "Mumbai WH", date: "2026-04-15", status: "In Transit", value: 34000 },
    { id: 1004, from: "Pune WH", to: "Bangalore WH", date: "2026-04-10", status: "Completed", value: 61000 },
    { id: 1005, from: "Hyderabad WH", to: "Vizag WH", date: "2026-04-05", status: "Submitted", value: 18000 },
  ]);

  /** FILTERED */
const rows = useMemo(() => {
  return data.filter((t) => {

    // 🔥 TAB FILTER
    if (activeTab === "draft" && t.status !== "Draft") {
      return false;
    }

    // 🔥 EXISTING FILTERS
    return (
      t.id.toString().includes(filters.id) &&
      t.from.toLowerCase().includes(filters.from.toLowerCase()) &&
      t.to.toLowerCase().includes(filters.to.toLowerCase()) &&
      t.date.includes(filters.date) &&
      (filters.status ? t.status === filters.status : true) &&
      t.value.toString().includes(filters.value)
    );
  });
}, [data, filters, activeTab]);

const totalRecords = rows.length;

const totalPages = Math.ceil(totalRecords / itemsPerPage);

const paginatedRows = rows.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);



  /** KPIs */
  const kpi = useMemo(() => {
    return {
      total: rows.length,
      draft: rows.filter((r) => r.status === "Draft").length,
      transit: rows.filter((r) => r.status === "In Transit").length,
      completed: rows.filter((r) => r.status === "Completed").length,
      value: rows.reduce((s, r) => s + r.value, 0),
    };
  }, [rows]);

  /** EXPORT CSV */
  const exportCSV = () => {
    const header = ["ID", "From", "To", "Date", "Status", "Value"];

    const lines = paginatedRows.map((r) =>
      [r.id, r.from, r.to, r.date, r.status, r.value].join(",")
    );

    const csv = [header.join(","), ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transfers.csv";
    link.click();
  };

  const badge = (s: Status) =>
    cn(
      "px-2 py-1 rounded-full text-xs font-semibold",
      s === "Draft" && "bg-gray-100 text-gray-700",
      s === "Approved" && "bg-blue-100 text-blue-700",
      s === "In Transit" && "bg-purple-100 text-purple-700",
      s === "Completed" && "bg-green-100 text-green-700",
      s === "Submitted" && "bg-indigo-100 text-indigo-700"
    );

  return (
  <div className="space-y-4">
    <PageBreadcrumb pageTitle="Stock Transfer" />

    <div className="rounded-2xl border bg-white p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Transfer Dashboard</h2>
          <p className="text-sm text-gray-500">
            Static demo (Fortuna style)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-6 py-3 text-white font-semibold rounded-2xl shadow-lg"
            style={{ backgroundColor: "#C8102E" }}
          >
            Export to Excel
          </button>

          <button
            onClick={() => router.push('/StockTransferForm')}
            className="px-6 py-3 text-white font-semibold rounded-2xl shadow-lg"
            style={{ backgroundColor: "#005F99" }}
          >
            + Add New
          </button>
        </div>
      </div>

 

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT SIDE */}
        <div className="xl:col-span-9 space-y-4">

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPI title="Total" value={kpi.total} color={RED} />
            <KPI title="Draft" value={kpi.draft} color={BLUE} />
            <KPI title="In Transit" value={kpi.transit} color={BLUE} />
            <KPI title="Completed" value={kpi.completed} color={RED} />
            <KPI title="Value" value={inr(kpi.value)} color={RED} />
          </div>


    {/* TABS */}
<div className="flex gap-2 mb-3">
  <button
    onClick={() => setActiveTab("all")}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
      activeTab === "all"
        ? "text-white"
        : "border text-gray-700 bg-white"
    }`}
    style={activeTab === "all" ? { backgroundColor: RED } : {}}
  >
    All Transfers
  </button>

  <button
    onClick={() => setActiveTab("draft")}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
      activeTab === "draft"
        ? "text-white"
        : "border text-gray-700 bg-white"
    }`}
    style={activeTab === "draft" ? { backgroundColor: BLUE } : {}}
  >
    Drafts
  </button>
</div>


          {/* TABLE */}
          <div className="overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm border-collapse">

              <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-4 py-3 text-center">ID</th>
              <th className="px-4 py-3 text-center">From</th>
              <th className="px-4 py-3 text-center">To</th>
              <th className="px-4 py-3 text-center">Date</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Value</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>

      {/* 🔥 FILTER ROW */}
      <tr className="bg-gray-100 text-black">
        
        <th className="p-2">
          <input
            placeholder="Search ID"
            className="w-full px-2 py-1 border rounded text-xs"
            onChange={(e) =>
              setFilters({ ...filters, id: e.target.value })
            }
          />
        </th>

    <th className="p-2">
      <input
        placeholder="From"
        className="w-full px-2 py-1 border rounded text-xs"
        onChange={(e) =>
          setFilters({ ...filters, from: e.target.value })
        }
      />
    </th>

    <th className="p-2">
      <input
        placeholder="To"
        className="w-full px-2 py-1 border rounded text-xs"
        onChange={(e) =>
          setFilters({ ...filters, to: e.target.value })
        }
      />
    </th>

    <th className="p-2">
      <input
        placeholder="Date"
        className="w-full px-2 py-1 border rounded text-xs"
        onChange={(e) =>
          setFilters({ ...filters, date: e.target.value })
        }
      />
    </th>

    <th className="p-2">
      <select
        className="w-full px-2 py-1 border rounded text-xs"
        onChange={(e) =>
          setFilters({ ...filters, status: e.target.value })
        }
      >
        <option value="">All</option>
        <option>Draft</option>
        <option>Submitted</option>
        <option>Approved</option>
        <option>In Transit</option>
        <option>Completed</option>
      </select>
    </th>

    <th className="p-2">
      <input
        placeholder="Value"
        className="w-full px-2 py-1 border rounded text-xs"
        onChange={(e) =>
          setFilters({ ...filters, value: e.target.value })
        }
      />
    </th>
        <th></th>
      </tr>
        </thead>

              <tbody>
                {paginatedRows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">

                    <td className="px-4 py-3 text-center font-semibold">
                      TR-{r.id}
                    </td>

                    <td className="px-4 py-3 text-center">{r.from}</td>
                    <td className="px-4 py-3 text-center">{r.to}</td>
                    <td className="px-4 py-3 text-center">{r.date}</td>

                    <td className="px-4 py-3 text-center">
                      <span className={badge(r.status)}>
                        {r.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-semibold">
                      {inr(r.value)}
                    </td>

                    <td className="px-4 py-3 text-center">
  <div className="flex flex-col items-center gap-2">

    {/* VIEW */}
    <button
  onClick={() => alert(`View ${r.id}`)}
  className="px-3 py-1 text-xs rounded-lg text-white shadow-md transition-all duration-200 hover:scale-105"
  style={{
    background: "linear-gradient(135deg, #005F99, #3B82F6)", // blue gradient
  }}
>
  View
</button>

    {/* EDIT */}
    <button
  onClick={() => alert(`Edit ${r.id}`)}
  className="px-3 py-1 text-xs rounded-lg text-white shadow-md transition-all duration-200 hover:scale-105"
  style={{
    background: "linear-gradient(135deg, #e58646, #f18963)",
  }}
>
  Edit
</button>

    {/* DELETE */}
    <button
  onClick={() => {
    if (confirm("Delete this transfer?")) {
      alert(`Deleted ${r.id}`);
    }
  }}
  className="px-3 py-1 text-xs rounded-lg text-white shadow-md transition-all duration-200 hover:scale-105"
  style={{
    background: "linear-gradient(135deg, #C8102E, #EF4444)",
  }}
>
  Delete
</button>

  </div>
</td>


                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      No transfers found
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

            <div className="flex items-center justify-between mt-4 text-sm">

{/* LEFT: Showing count */}
<div className="text-gray-600">
  Showing{" "}
  {totalRecords === 0
    ? 0
    : (currentPage - 1) * itemsPerPage + 1}
  {" - "}
  {Math.min(currentPage * itemsPerPage, totalRecords)}
  {" of "}
  {totalRecords}
</div>

  {/* RIGHT: Controls */}
  <div className="flex items-center justify-between mt-4 text-sm">

  {/* LEFT
  <div className="text-gray-600">
    Showing{" "}
    {(currentPage - 1) * itemsPerPage + 1}
    {" - "}
    {Math.min(currentPage * itemsPerPage, totalRecords)}
    {" of "}
    {totalRecords}
  </div> */}

  {/* RIGHT */}
  <div className="flex items-center gap-4">

    {/* Records per page */}
    <div className="flex items-center gap-2 text-gray-600">
      <span>Records per page:</span>

      <select
        value={itemsPerPage}
        onChange={(e) => {
          setItemsPerPage(Number(e.target.value));
          setCurrentPage(1);
        }}
        className="rounded-md border px-2 py-1 text-sm"
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>

    {/* Prev / Next */}
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className="px-3 py-1 rounded border disabled:opacity-50"
    >
      Prev
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-3 py-1 rounded border disabled:opacity-50"
    >
      Next
    </button>

  </div>
</div>
</div>



          </div>
        </div>

        {/* RIGHT SIDE → QUICK STATS */}
        <div className="xl:col-span-3">
          <div className="rounded-2xl border p-5 shadow-sm">

            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Quick Stats</h3>
              <span className="h-2 w-2 bg-red-600 rounded-full" />
            </div>

            <div className="mt-4 space-y-3 text-sm">

              <StatRow label="Total Transfers" value={kpi.total} />
              <StatRow label="Draft" value={kpi.draft} badge="gray" />
              <StatRow label="Submitted" value={rows.filter(r => r.status==="Submitted").length} badge="blue" />
              <StatRow label="Approved" value={rows.filter(r => r.status==="Approved").length} badge="green" />
              <StatRow label="In Transit" value={kpi.transit} badge="amber" />
              <StatRow label="Completed" value={kpi.completed} badge="green" />

              <div className="border-t my-3" />

              <StatRow label="Total Value" value={inr(kpi.value)} />
              <StatRow label="Avg Value" value={inr(kpi.value / (kpi.total || 1))} />

            </div>

            <div className="mt-4 text-xs text-gray-500">
              Tip: Filters apply to stats + export
            </div>

          </div>
        </div>

      </div>

    </div>

  </div>
);
}

/** KPI */
function KPI({ title, value, color }: any) {
  return (
    <div
      className="relative rounded-2xl p-4 text-white shadow-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      }}
    >
      {/* Glow effect */}
      <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10">
        <div className="text-xs opacity-80 tracking-wide">
          {title}
        </div>

        <div className="text-2xl font-bold mt-1">
          {value}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, badge }: any) {
  const colorMap: any = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <span className={`px-2 py-1 rounded-full text-xs ${colorMap[badge] || "bg-gray-100"}`}>
        {value}
      </span>
    </div>
  );
}