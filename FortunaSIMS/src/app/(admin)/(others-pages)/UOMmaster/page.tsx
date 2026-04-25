"use client";
import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

type Status = "Active" | "Inactive";
type UomCategory = "Count" | "Weight" | "Length" | "Volume" | "Pack" | "Other";

interface Uom {
  id: number; 
  code: string;
  name: string;
  category: UomCategory;
  status: Status;
}


export default function UomMasterPage() {
  // Data (in-memory)
 const [data, setData] = useState<Uom[]>([]);

  useEffect(() => {
  fetchUoms();
}, []);

const fetchUoms = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/uoms");
    setData(res.data);
  } catch (err) {
    console.error("Error fetching UOMs:", err);
  }
};

  // Filters
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<UomCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState<UomForm>({
  code: "",
  name: "",
  category: "Count",
  status: "Active",
});

  // Form state
  interface UomForm {
  code: string;
  name: string;
  category: UomCategory;
  status: Status;
}

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);

  const filteredData = useMemo(() => {
    return data.filter((u) => {
      const byCode = u.code.toLowerCase().includes(searchCode.toLowerCase());
      const byName = u.name.toLowerCase().includes(searchName.toLowerCase());
      const byCat = categoryFilter ? u.category === categoryFilter : true;
      const byStatus = statusFilter ? u.status === statusFilter : true;
      return byCode && byName && byCat && byStatus;
    });
  }, [data, searchCode, searchName, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setForm({ code: "", name: "", category: "Count", status: "Active" });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

const openEdit = (u: Uom) => {
  setForm({
    code: u.code,
    name: u.name,
    category: u.category,
    status: u.status,
  });
  setEditingId(u.id);
  setIsModalOpen(true);
};

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const onSave = async () => {
  try {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();

    if (!code || !name) {
      alert("UOM Code & UOM Name are required.");
      return;
    }

    const payload = {
      ...form,
      code,
      name,
    };

    if (editingId) {
      // ✅ UPDATE API
      await axios.put(`http://localhost:5000/api/uoms/${editingId}`, payload);
    } else {
      // ✅ CREATE API
      await axios.post("http://localhost:5000/api/uoms", payload);
    }

    alert("Saved successfully ✅");

    fetchUoms(); // 🔥 reload from DB
    closeModal();
  } catch (err) {
    console.error("Save error:", err);
    alert("Error saving UOM ❌");
  }
};

  const onDelete = async (id: number) => {
  const ok = confirm("Delete UOM?");
  if (!ok) return;

  try {
    await axios.delete(`http://localhost:5000/api/uoms/${id}`);
    fetchUoms(); // reload from DB
  } catch (err) {
    console.error("Delete error:", err);
    alert("Error deleting UOM ❌");
  }
};

  const exportToCSV = () => {
    const header = ["UOM Code", "UOM Name", "Category", "Status"];
    const rows = filteredData.map((u) =>
      [u.code, u.name, u.category, u.status].join(",")
    );
    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "uom-master.csv";
    link.click();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="UOM Master" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">UOM Master</h2>
            <p className="text-sm text-gray-500">
              Manage Units of Measure centrally (Nos, Kg, Ltr, etc.)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAdd}
              className="bg-[#005F99] hover:bg-[#004a7a] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
            >
              + Add New
            </button>

            <button
              onClick={exportToCSV}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
            >
              Export to CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  UOM Code
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
                  UOM Name
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
                      setCategoryFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    <option value="Count">Count</option>
                    <option value="Weight">Weight</option>
                    <option value="Length">Length</option>
                    <option value="Volume">Volume</option>
                    <option value="Pack">Pack</option>
                    <option value="Other">Other</option>
                  </select>
                </th>

                <th className="px-4 py-3 text-left">
                  Status
                  <select
                    className="mt-2 w-full border rounded px-2 py-1 text-xs"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
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
              {paginatedData.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.code}
                  </td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                 <td className="px-4 py-3 text-center">
  <div className="flex flex-col items-center gap-2">

    {/* EDIT */}
    <button
      onClick={() => openEdit(u)}
      className="w-[80px] px-3 py-1 text-xs rounded-lg text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: "linear-gradient(135deg, #005F99, #0f6da8)",
      }}
    >
      Edit
    </button>

    {/* DELETE */}
    <button
      onClick={() => onDelete(u.id)}
      className="w-[80px] px-3 py-1 text-xs rounded-lg text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
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

              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No records found.
                  </td>
                </tr>
              )}
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingId ? "Edit UOM" : "Add New UOM"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Create/Update unit of measure.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    UOM Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, code: e.target.value }))
                    }
                    placeholder="e.g., NOS, KG, LTR"
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/30"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Tip: Keep short & unique (2–6 chars).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    UOM Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g., Numbers, Kilogram"
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          category: e.target.value as UomCategory,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/30"
                    >
                      <option value="Count">Count</option>
                      <option value="Weight">Weight</option>
                      <option value="Length">Length</option>
                      <option value="Volume">Volume</option>
                      <option value="Pack">Pack</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          status: e.target.value as Status,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/30"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={onSave}
                  className="bg-[#005F99] hover:bg-[#004a7a] active:scale-95 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
                >
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
