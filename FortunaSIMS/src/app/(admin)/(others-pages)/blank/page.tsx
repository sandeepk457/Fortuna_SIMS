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
  ]);

  // Filters
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Filtering logic
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

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Item Master</h2>
            <p className="text-sm text-gray-500">Manage and control inventory items centrally.</p>
          </div>

         <button
          onClick={exportToExcel}
          className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200">
          Export to Excel
        </button>

          
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

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} entries
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
