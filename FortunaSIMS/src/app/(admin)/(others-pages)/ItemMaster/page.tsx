"use client";

import React, { useState, useMemo,useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface Item {
  code: string;
  name: string;
  category: string;
  uom: string;
  status: string;
}

export default function ItemMasterPage() {
  const router = useRouter();
  const [data, setData] = useState<Item[]>([]);
  
  // Column Filters
  const [searchCode, setSearchCode] = useState("");
  const [uploading, setUploading] = useState(false);

  //  (FETCH FUNCTION)
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const fetchItems = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/items");
      const result = await res.json();

      console.log("API DATA:", result); // 🔥 ADD THIS

      setData(result);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  // 👉  (USE EFFECT)
  useEffect(() => {
    fetchItems();
  }, []);

  //stub for delete function//

  const handleDelete = async (id) => {
  if (!confirm("Are you sure to delete?")) return;

  const res = await fetch(`http://localhost:5000/api/items/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();

  if (res.ok) {
    alert("Deleted successfully");
    fetchItems(); // refresh
  } else {
    alert(data.error);
  }
};

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    setUploading(true);

    const res = await fetch("http://localhost:5000/api/items/bulk-upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ Uploaded: ${data.totalInserted} items\n❌ Skipped: ${data.skipped}`);

      // 🔥 DOWNLOAD ERROR FILE (FIXED)
      if (data.errorFile) {
        const link = document.createElement("a");
        link.href = `http://localhost:5000/${data.errorFile}`;
        link.download = "Error_Report.xlsx";
        link.click();
      }

      // 🔥 RELOAD AFTER SUCCESS
      window.location.reload();

    } else {
      alert(data.error || "Upload failed");
    }

  } catch (err) {
    console.error(err);
    alert("Error uploading file");
  } finally {
    setUploading(false);
  }
};


  const [searchName, setSearchName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.code.toLowerCase().includes(searchCode.toLowerCase()) &&
      item.name.toLowerCase().includes(searchName.toLowerCase()) &&
      item.category?.toLowerCase().includes(category.toLowerCase()) &&
      (statusFilter ? item.status === statusFilter : true)
    );
  }, [data, searchCode, searchName, category, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Excel Export
  const exportToExcel = () => {
  const header = ["item_name",
  "short_name",
  "item_type",
  "category",
  "sub_category",
  "brand",
  "uom",
  "alt_uom",
  "conversion_factor",
  "barcode",
  "hsn_sac",
  "description",

  // Inventory
  "inventory_controlled",
  "batch_controlled",
  "serial_controlled",
  "expiry_controlled",
  "min_stock_level",
  "max_stock_level",
  "reorder_qty",

  // Storage
  "storage_type",
  "hazardous",
  "fragile",
  "stackable",
  "default_warehouse",
  "default_zone",
  "default_bin",

  // Valuation
  "valuation_method",
  "standard_cost",
  "inventory_gl_code",

  // Status
  "status"];

  const rows = data.map((item) => [
    item.name,
    item.short_name || "",
    item.item_type || "",
    item.category,
    item.sub_category || "",
    item.brand || "",
    item.uom,
    item.alt_uom || "",
    item.conversion_factor || "",
    item.barcode || "",
    item.hsn_sac || "",
    item.description || "",

    item.inventory_controlled || false,
    item.batch_controlled || false,
    item.serial_controlled || false,
    item.expiry_controlled || false,
    item.min_stock_level || "",
    item.max_stock_level || "",
    item.reorder_qty || "",

    item.storage_type || "",
    item.hazardous || false,
    item.fragile || false,
    item.stackable || false,
    item.default_warehouse || "",
    item.default_zone || "",
    item.default_bin || "",

    item.valuation_method || "FIFO",
    item.standard_cost || "",
    item.inventory_gl_code || "",

    item.status || "Active"
  ]);

  const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "item-master-full-template.csv";
  link.click();
};

// Template Download
  const downloadTemplate = () => {
  const header = [
    "item_name",
    "short_name",
    "item_type",
    "category",
    "sub_category",
    "brand",
    "uom",
    "alt_uom",
    "conversion_factor",
    "barcode",
    "hsn_sac",
    "description",

    "inventory_controlled",
    "batch_controlled",
    "serial_controlled",
    "expiry_controlled",
    "min_stock_level",
    "max_stock_level",
    "reorder_qty",

    "storage_type",
    "hazardous",
    "fragile",
    "stackable",
    "default_warehouse",
    "default_zone",
    "default_bin",

    "valuation_method",
    "standard_cost",
    "inventory_gl_code",

    "status"
  ];

  const csvContent = header.join(",");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "item-upload-template.csv";
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
      
      onClick={() => router.push("/ItemMasterForm")}
      className="bg-[#005F99] hover:bg-[#004a7a] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
    >
      + Add New
    </button>

    {/* ✅ Upload Button (Clean UI) */}
  <button
    onClick={() => document.getElementById("fileInput")?.click()}
    className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
    >
  
    {uploading ? "Uploading..." : "Upload Excel"}
  </button>

  {/* Hidden Input */}
  <input
    id="fileInput"
    type="file"
    accept=".xlsx, .xls"
    onChange={handleFileUpload}
    style={{ display: "none" }}
  />


    {/* Excel Button */}
    <button
      onClick={exportToExcel}
      className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
    >
      Export to Excel
    </button>

    {/* 🔥 NEW: TEMPLATE DOWNLOAD */}
  <button
    onClick={downloadTemplate}
    className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200">
    Download Template
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
                <input
                className="mt-2 w-full border rounded px-2 py-1 text-xs"
                placeholder="Search"
                value={category}
                 onChange={(e) => {
                 setCategory(e.target.value);
                  setCurrentPage(1);
                  }}
                   />
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
                   <span
                  onClick={() => router.push(`/ItemMasterForm?id=${item.id}`)}
                  className="cursor-pointer text-blue-600">
                  Edit
                  </span>
                    <span
                    className="text-red-500 cursor-pointer"
                    onClick={() => handleDelete(item.id)}
                  >
                   Delete
                  </span>
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
