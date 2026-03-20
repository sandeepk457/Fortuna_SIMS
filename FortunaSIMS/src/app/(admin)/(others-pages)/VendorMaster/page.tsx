"use client";
import React, { useMemo, useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";


/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type VendorStatus = "Active" | "Inactive";
type VendorTier = "Tier 1" | "Tier 2" | "Tier 3";
type VendorCategory = "Packaging" | "Raw Material" | "Transport" | "3PL" | "Services";

interface Vendor {
  id: string;
  code: string;
  name: string;
  category: VendorCategory;
  tier: VendorTier;
  phone: string;
  city: string;
  status: VendorStatus;
}

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

export default function VendorMasterListPage() {
  const router = useRouter(); 
  const [data, setData] = useState<Vendor[]>([]);

  // ✅ FETCH FUNCTION (Reusable)
  const fetchVendors = () => {
    fetch("http://localhost:5000/api/vendors")
      .then((res) => res.json())
      .then((apiData) => {
        const mapped = apiData.map((v: any) => ({
          id: v.id,
          code: v.code || v.vendor_code || "",
          name: v.name || v.vendor_name || "",
          category: v.category || v.vendor_category || "",
          tier: v.tier || v.vendor_tier || "",
          phone: v.phone || v.contact_phone || "",
          city: v.city || "",
          status: v.status || "",
        }));

        setData(mapped);
      })
      .catch((err) => console.error(err));
  };

  // ✅ INITIAL LOAD
  useEffect(() => {
    fetchVendors();
  }, []);

  // ✅ DELETE FUNCTION
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Are you sure to Delete this Vendor?");
    if (!confirmDelete) return;

    try {
      await fetch(`http://localhost:5000/api/vendors/${id}`, {
        method: "DELETE",
      });

      alert("Deleted Successfully");

      // 🔁 Refresh list after delete
      fetchVendors();

      // ⚡ (Optional faster UI update)
      // setData(prev => prev.filter(v => v.id !== id));

    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };
  // Column Filters
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | "">("");
  const [tierFilter, setTierFilter] = useState<VendorTier | "">("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "">("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal (demo)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<
    Pick<Vendor, "code" | "name" | "category" | "tier" | "phone" | "city" | "status">
  >({
    code: "",
    name: "",
    category: "Raw Material",
    tier: "Tier 2",
    phone: "",
    city: "",
    status: "Active",
  });

  // Filtering Logic
  const safe = (val: any) => (val || "").toString().toLowerCase();

const filteredData = useMemo(() => {
  return data.filter(
    (v) =>
      safe(v.code).includes(searchCode.toLowerCase()) &&
      safe(v.name).includes(searchName.toLowerCase()) &&
      safe(v.phone).includes(searchPhone.toLowerCase()) &&
      safe(v.city).includes(searchCity.toLowerCase()) &&
      (categoryFilter ? v.category === categoryFilter : true) &&
      (tierFilter ? v.tier === tierFilter : true) &&
      (statusFilter ? v.status === statusFilter : true)
  );
}, [
  data,
  searchCode,
  searchName,
  searchPhone,
  searchCity,
  categoryFilter,
  tierFilter,
  statusFilter,
]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Quick Stats
  const stats = useMemo(() => {
    const total = filteredData.length;
    const active = filteredData.filter((v) => v.status === "Active").length;
    const inactive = filteredData.filter((v) => v.status === "Inactive").length;
    const tier1 = filteredData.filter((v) => v.tier === "Tier 1").length;

    const byCategory = (cat: VendorCategory) =>
      filteredData.filter((v) => v.category === cat).length;

    return {
      total,
      active,
      inactive,
      tier1,
      packaging: byCategory("Packaging"),
      raw: byCategory("Raw Material"),
      transport: byCategory("Transport"),
      threepl: byCategory("3PL"),
      services: byCategory("Services"),
    };
  }, [filteredData]);

  // CSV Export
  const exportToCSV = () => {
    const header = [
      "Vendor Code",
      "Vendor Name",
      "Category",
      "Tier",
      "Phone",
      "City",
      "Status",
    ];

    const rows = filteredData.map((v) =>
      [v.code, v.name, v.category, v.tier, v.phone, v.city, v.status]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vendor-master.csv";
    link.click();
  };

  // Actions
const onDelete = async (id: string) => {
  const ok = confirm("Are you sure?");
  if (!ok) return;

  await fetch(`http://localhost:5000/api/vendors/${id}`, {
    method: "DELETE",
  });

  setData(prev => prev.filter(v => v.id !== id));
};

  const onAddVendor = () => {
    if (!newVendor.code.trim() || !newVendor.name.trim()) {
      alert("Vendor Code and Vendor Name are required.");
      return;
    }

    if (
      data.some(
        (d) =>
          d.code.trim().toLowerCase() === newVendor.code.trim().toLowerCase()
      )
    ) {
      alert("Vendor Code already exists.");
      return;
    }

    setData((p) => [{ ...newVendor }, ...p]);
    setIsModalOpen(false);

    setNewVendor({
      code: "",
      name: "",
      category: "Raw Material",
      tier: "Tier 2",
      phone: "",
      city: "",
      status: "Active",
    });

    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchCode("");
    setSearchName("");
    setSearchPhone("");
    setSearchCity("");
    setCategoryFilter("");
    setTierFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Vendor Master" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Vendor Master
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Manage suppliers, transporters, 3PL & service vendors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={() => router.push("/VendorForm")}

              className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
            >
              + Add New
            </button>

            <button
              onClick={exportToCSV}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
            >
              Export to Excel
            </button>

            <button
              onClick={resetFilters}
              className="active:scale-95 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-md transition-all duration-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Table Panel */}
          <div className="xl:col-span-9">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Vendor Code
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchCode}
                        onChange={(e) => {
                          setSearchCode(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      Vendor Name
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
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
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        value={categoryFilter}
                        onChange={(e) => {
                          setCategoryFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All</option>
                        <option value="Raw Material">Raw Material</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Transport">Transport</option>
                        <option value="3PL">3PL</option>
                        <option value="Services">Services</option>
                      </select>
                    </th>

                    <th className="px-4 py-3 text-left">
                      Tier
                      <select
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        value={tierFilter}
                        onChange={(e) => {
                          setTierFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All</option>
                        <option value="Tier 1">Tier 1</option>
                        <option value="Tier 2">Tier 2</option>
                        <option value="Tier 3">Tier 3</option>
                      </select>
                    </th>

                    <th className="px-4 py-3 text-left">
                      Phone
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchPhone}
                        onChange={(e) => {
                          setSearchPhone(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      City
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchCity}
                        onChange={(e) => {
                          setSearchCity(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      Status
                      <select
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
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

                <tbody className="dark:text-gray-200">
                  {paginatedData.map((v, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3">{v.code}</td>
                      <td className="px-4 py-3">{v.name}</td>
                      <td className="px-4 py-3">{v.category}</td>
                      <td className="px-4 py-3">{v.tier}</td>
                      <td className="px-4 py-3">{v.phone}</td>
                      <td className="px-4 py-3">{v.city}</td>
                      <td className="px-4 py-3">
                        <span
                          className={classNames(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            v.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          )}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-3">
                        <button
                          className="font-semibold text-blue-600 hover:underline"
                          onClick={() => router.push(`/VendorForm?id=${v.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="font-semibold text-rose-600 hover:underline"
                          onClick={() => handleDelete(v.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedData.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300"
                        colSpan={8}
                      >
                        No vendors found for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Controls */}
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                {filteredData.length > 0 ? (
                  <>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredData.length
                    )}{" "}
                    of {filteredData.length} entries
                  </>
                ) : (
                  <>Showing 0 entries</>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm dark:text-gray-200">
                <span>Records per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
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
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
                >
                  Previous
                </button>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="xl:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  Quick Stats
                </h3>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                />
              </div>

              <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                <StatRow label="Total Vendors" value={stats.total} />
                <StatRow label="Active" value={stats.active} badge="green" />
                <StatRow label="Inactive" value={stats.inactive} badge="red" />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Tier 1 Vendors" value={stats.tier1} />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Raw Material" value={stats.raw} />
                <StatRow label="Packaging" value={stats.packaging} />
                <StatRow label="Transport" value={stats.transport} />
                <StatRow label="3PL" value={stats.threepl} />
                <StatRow label="Services" value={stats.services} />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats
                + export.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal (Demo) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add New Vendor (Demo)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  Temporary modal. Next: Vendor Creation page.
                </p>
              </div>
              <button
                className="rounded-lg border px-3 py-1 text-sm dark:border-gray-800 dark:text-gray-200"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Vendor Code *
                </label>
                <input
                  value={newVendor.code}
                  onChange={(e) =>
                    setNewVendor((p) => ({ ...p, code: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="VEN-011"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Vendor Name *
                </label>
                <input
                  value={newVendor.name}
                  onChange={(e) =>
                    setNewVendor((p) => ({ ...p, name: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Vendor Name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Category
                </label>
                <select
                  value={newVendor.category}
                  onChange={(e) =>
                    setNewVendor((p) => ({
                      ...p,
                      category: e.target.value as VendorCategory,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Raw Material">Raw Material</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Transport">Transport</option>
                  <option value="3PL">3PL</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tier
                </label>
                <select
                  value={newVendor.tier}
                  onChange={(e) =>
                    setNewVendor((p) => ({
                      ...p,
                      tier: e.target.value as VendorTier,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Phone
                </label>
                <input
                  value={newVendor.phone}
                  onChange={(e) =>
                    setNewVendor((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="9000011111"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  City
                </label>
                <input
                  value={newVendor.city}
                  onChange={(e) =>
                    setNewVendor((p) => ({ ...p, city: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Hyderabad"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Status
                </label>
                <select
                  value={newVendor.status}
                  onChange={(e) =>
                    setNewVendor((p) => ({
                      ...p,
                      status: e.target.value as VendorStatus,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                onClick={onAddVendor}
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: number;
  badge?: "green" | "red";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span
        className={classNames(
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          badge === "green" && "bg-green-100 text-green-700",
          badge === "red" && "bg-red-100 text-red-600",
          !badge && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
        )}
      >
        {value}
      </span>
    </div>
  );
}
