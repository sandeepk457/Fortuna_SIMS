"use client";

import React, { useState, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

interface Item {
  code: string;
  name: string;
  category: string;
  uom: string;
  status: string;
}

export default function ItemMasterPage() {
  const [data] = useState<Item[]>([
    { code: "ITM-001", name: "Industrial Pump", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-002", name: "Safety Helmet", category: "Safety Equipment", uom: "Nos", status: "Inactive" },
    { code: "ITM-003", name: "Gear Box", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-004", name: "Hand Gloves", category: "Safety Equipment", uom: "Pairs", status: "Active" },
    { code: "ITM-005", name: "Motor", category: "Machinery", uom: "Nos", status: "Inactive" },
    { code: "ITM-006", name: "Hydraulic Cylinder", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-007", name: "Safety Goggles", category: "Safety Equipment", uom: "Nos", status: "Active" },
    { code: "ITM-008", name: "Air Compressor", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-009", name: "Reflective Jacket", category: "Safety Equipment", uom: "Nos", status: "Inactive" },
    { code: "ITM-010", name: "Conveyor Belt", category: "Machinery", uom: "Meters", status: "Active" },
    { code: "ITM-011", name: "Fire Extinguisher", category: "Safety Equipment", uom: "Nos", status: "Active" },
    { code: "ITM-012", name: "Lathe Machine", category: "Machinery", uom: "Nos", status: "Inactive" },
    { code: "ITM-013", name: "Safety Shoes", category: "Safety Equipment", uom: "Pairs", status: "Active" },
    { code: "ITM-014", name: "Drill Machine", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-015", name: "Face Shield", category: "Safety Equipment", uom: "Nos", status: "Inactive" },
    { code: "ITM-016", name: "Welding Machine", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-017", name: "Ear Protection Plug", category: "Safety Equipment", uom: "Pairs", status: "Active" },
    { code: "ITM-018", name: "Forklift", category: "Machinery", uom: "Nos", status: "Inactive" },
    { code: "ITM-019", name: "Dust Mask", category: "Safety Equipment", uom: "Nos", status: "Active" },
    { code: "ITM-020", name: "Generator", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-021", name: "Pressure Valve", category: "Machinery", uom: "Nos", status: "Inactive" },
    { code: "ITM-022", name: "Safety Harness", category: "Safety Equipment", uom: "Nos", status: "Active" },
    { code: "ITM-023", name: "Control Panel", category: "Machinery", uom: "Nos", status: "Active" },
    { code: "ITM-024", name: "Industrial Ladder", category: "Safety Equipment", uom: "Nos", status: "Inactive" },
    { code: "ITM-025", name: "Water Pump Assembly", category: "Machinery", uom: "Nos", status: "Active" },
  ]);

  // Column Filters
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.code.toLowerCase().includes(searchCode.toLowerCase()) &&
      item.name.toLowerCase().includes(searchName.toLowerCase()) &&
      (categoryFilter ? item.category === categoryFilter : true) &&
      (statusFilter ? item.status === statusFilter : true)
    );
  }, [data, searchCode, searchName, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Excel Export
  const exportToExcel = () => {
    const header = ["Item Code", "Item Name", "Category", "UOM", "Status"];
    const rows = filteredData.map((item) =>
      [item.code, item.name, item.category, item.uom, item.status].join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "item-master.csv";
    link.click();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Item Master" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">

        {/* Header */}
<div className="flex justify-between items-center mb-6">

  {/* Left Side */}
  <div>
    <h2 className="text-2xl font-semibold text-gray-800">
      Item Master
    </h2>
    <p className="text-sm text-gray-500">
      Manage and control inventory items centrally.
    </p>
  </div>

  {/* Right Side Buttons */}
  <div className="flex items-center gap-2">

    {/* Add New Button */}
    <button
      onClick={() => setIsModalOpen(true)}
      className="bg-[#005F99] hover:bg-[#004a7a] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
    >
      + Add New
    </button>

    {/* Excel Button */}
    <button
      onClick={exportToExcel}
      className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
    >
      Export to Excel
    </button>

  </div>

</div>


        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  Item Code
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
                  Item Name
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
                  Category
                  <select
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Safety Equipment">Safety Equipment</option>
                  </select>
                </th>

                <th className="px-4 py-3 text-left">UOM</th>

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
              {paginatedData.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{item.code}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.uom}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3 text-blue-600 cursor-pointer">
                    <span>Edit</span>
                    <span className="text-red-500">Delete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">

          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} entries
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
              disabled={currentPage === 1}
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

      </div>
    </div>
  );
}
