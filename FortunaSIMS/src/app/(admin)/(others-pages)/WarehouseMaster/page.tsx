"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";


const StatRow = ({ label, value, badge }: any) => {
  const badgeColor: any = {
    gray: "bg-gray-200 text-gray-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeColor[badge] || ""}`}>
        {value}
      </span>
    </div>
  );
};

interface Warehouse {
  code: string;
  name: string;
  warehouseType: "DC" | "Plant" | "Hub" | "Store";
  city: string;
  state: string;
  capacitySqft: number;
  status: "Active" | "Inactive";
}

export default function WarehouseMasterPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [data, setData] = useState<Warehouse[]>([]);

  // Column Filters
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // =========================
//  QUICK STATS CALCULATION
// =========================
const stats = useMemo(() => {
  const total = data.length;

  const active = data.filter((w) => w.status === "Active").length;
  const inactive = data.filter((w) => w.status === "Inactive").length;

  const dcCount = data.filter((w) => w.warehouseType === "General DC").length;

  const cities = new Set(data.map((w) => w.city));
  const states = new Set(data.map((w) => w.state));

  return {
    total,
    active,
    inactive,
    dcCount,
    cityCount: cities.size,
    stateCount: states.size,
  };
}, [data]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

useEffect(() => {
  fetchWarehouses();
}, []);

const fetchWarehouses = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/warehouses");

    console.log("API DATA:", res.data);

    // 🔥 MAP backend → frontend structure
    const mapped = res.data.map((item) => ({
      code: item.warehouse_code,
      name: item.warehouse_name,
      warehouseType: item.warehouse_type,
      city: item.city,
      state: item.state,
      capacitySqft: item.capacity_sqft || 0,
      status: item.status,
    }));

    setData(mapped);

  } catch (err) {
    console.error("Fetch error:", err);
  }
};

  // Filtering Logic
 const filteredData = useMemo(() => {
  return data.filter((wh) =>
    wh.code.toLowerCase().includes(searchCode.toLowerCase()) &&
    wh.name.toLowerCase().includes(searchName.toLowerCase()) &&
    (typeFilter ? wh.warehouseType === typeFilter : true) &&
    (cityFilter ? wh.city === cityFilter : true) &&
    (stateFilter ? wh.state === stateFilter : true) &&
    (statusFilter ? wh.status === statusFilter : true)
  );
}, [data, searchCode, searchName, typeFilter, cityFilter, stateFilter, statusFilter]);


  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Excel Export (CSV)
  const exportToExcel = () => {
    const header = ["Warehouse Code", "Warehouse Name", "Type", "City", "State", "Capacity (Sqft)", "Status"];
    const rows = filteredData.map((wh) =>
      [wh.code, wh.name, wh.warehouseType, wh.city, wh.state, wh.capacitySqft, wh.status].join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "warehouse-master.csv";
    link.click();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Warehouse Master" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">

        {/* 🔥 Quick Stats */}


        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          {/* Left Side */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Warehouse Master
            </h2>
            <p className="text-sm text-gray-500">
              Manage and control warehouse locations centrally.
            </p>
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/WarehouseForm")}
              className="bg-[#005F99] hover:bg-[#004a7a] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
            >
              + Add New
            </button>

            <button
              onClick={exportToExcel}
              className="bg-[#C8102E] hover:bg-[#a70d26] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
            >
              Export to Excel
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6"></div>
        

        {/* Table */}
        <div className="overflow-x-auto xl:col-span-3" style={{display:"flex", flexDirection:"row"}}>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  Warehouse Code
                  <input
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                    placeholder="Search"
                    value={searchCode}
                    onChange={(e) => {
                      setSearchCode(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </th>

                <th className="px-4 py-3 text-left">
                  Warehouse Name
                  <input
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                    placeholder="Search"
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </th>

                <th className="px-4 py-3 text-left">
                  Type
                  <select
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    <option value="DC">DC</option>
                    <option value="Plant">Plant</option>
                    <option value="Hub">Hub</option>
                    <option value="Store">Store</option>
                  </select>
                </th>

                <th className="px-4 py-3 text-left">
                  City
                  <select
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    {/* Keep cities minimal; can be dynamic later */}
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Visakhapatnam">Visakhapatnam</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Gurugram">Gurugram</option>
                    <option value="Jaipur">Jaipur</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Indore">Indore</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Bhubaneswar">Bhubaneswar</option>
                    <option value="Kochi">Kochi</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Patna">Patna</option>
                    <option value="Surat">Surat</option>
                    <option value="Vijayawada">Vijayawada</option>
                    <option value="Nellore">Nellore</option>
                  </select>
                </th>

                <th className="px-4 py-3 text-left">
  State
  <select
    className="mt-2 w-full border rounded px-2 py-1 text-xs"
    value={stateFilter}
    onChange={(e) => {
      setStateFilter(e.target.value);
      setCurrentPage(1);
    }}
  >
    <option value="">All</option>
    <option value="Telangana">Telangana</option>
    <option value="Andhra Pradesh">Andhra Pradesh</option>
    <option value="Tamil Nadu">Tamil Nadu</option>
    <option value="Karnataka">Karnataka</option>
    <option value="Maharashtra">Maharashtra</option>
    <option value="West Bengal">West Bengal</option>
    <option value="Haryana">Haryana</option>
    <option value="Rajasthan">Rajasthan</option>
    <option value="Gujarat">Gujarat</option>
    <option value="Madhya Pradesh">Madhya Pradesh</option>
    <option value="Uttar Pradesh">Uttar Pradesh</option>
    <option value="Odisha">Odisha</option>
    <option value="Kerala">Kerala</option>
    <option value="Bihar">Bihar</option>
  </select>
</th>


                <th className="px-4 py-3 text-left">Capacity (Sqft)</th>

                <th className="px-4 py-3 text-left">
                  Status
                  <select
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </th>

                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((wh, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{wh.code}</td>
                  <td className="px-4 py-3">{wh.name}</td>
                  <td className="px-4 py-3">{wh.warehouseType}</td>
                  <td className="px-4 py-3">{wh.city}</td>
                  <td className="px-4 py-3">{wh.state}</td>
                  <td className="px-4 py-3">{wh.capacitySqft.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        wh.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {wh.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3 text-blue-600 cursor-pointer">
                    <span>Edit</span>
                    <span className="text-red-500">View</span>
                  </td>
                </tr>
              ))}

              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                    No warehouses found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="grid grid-cols-1 gap-4 mb-6">
  

  {/* Stats Card */}
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm col-span-1">
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-gray-800">Quick Stats</h3>
      <span className="h-2 w-2 rounded-full bg-red-600" />
    </div>

    <div className="mt-4 space-y-3 text-sm">
      <StatRow label="Total Warehouses" value={stats.total} />
      <StatRow label="Active" value={stats.active} badge="green" />
      <StatRow label="Inactive" value={stats.inactive} badge="red" />
      <StatRow label="DC Count" value={stats.dcCount} badge="blue" />
      <div className="my-3 border-t" />
      <StatRow label="Cities Covered" value={stats.cityCount} badge="amber" />
      <StatRow label="States Covered" value={stats.stateCount} badge="purple" />
    </div>

    <div className="mt-4 text-xs text-gray-500">
      Tip: Filters apply to both table & stats.
    </div>
  </div>

</div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            {filteredData.length === 0 ? (
              <>Showing 0 entries</>
            ) : (
              <>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                {filteredData.length} entries
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>Records per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || totalPages === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal Placeholder (optional) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Add New Warehouse
                  </h3>
                  <p className="text-sm text-gray-500">
                    (Demo modal) Next step: warehouse creation form.
                  </p>
                </div>
                <button
                  className="rounded-lg px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
                Form will be added here (Warehouse Code, Name, Type, City, State,
                Capacity, Status, etc.)
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#005F99] text-sm font-semibold text-white hover:bg-[#004a7a]"
                >
                  Save (Demo)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      
    </div>
  );
}
