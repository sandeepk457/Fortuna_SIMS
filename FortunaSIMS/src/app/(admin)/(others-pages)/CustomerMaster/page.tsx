"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type CustomerStatus = "Active" | "Inactive" | "Blocked";
type CustomerTier = "Key Account" | "Standard" | "Small";
type PaymentTerms = "Advance" | "Net 7" | "Net 15" | "Net 30" | "Net 45" | "Custom";

interface Customer {
  code: string;
  name: string;
  tier: CustomerTier;
  phone: string;
  city: string;
  paymentTerms: PaymentTerms;
  creditLimit: number;
  status: CustomerStatus;
}

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function formatINR(value: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${value}`;
  }
}

export default function CustomerMasterListPage() {
  const [data, setData] = useState<Customer[]>([
    {
      code: "CUST-001",
      name: "Sri Sai Retail Mart",
      tier: "Key Account",
      phone: "9000011111",
      city: "Vizag",
      paymentTerms: "Net 30",
      creditLimit: 250000,
      status: "Active",
    },
    {
      code: "CUST-002",
      name: "Aparna Traders",
      tier: "Standard",
      phone: "9000022222",
      city: "Hyderabad",
      paymentTerms: "Net 15",
      creditLimit: 150000,
      status: "Active",
    },
    {
      code: "CUST-003",
      name: "FastBuy Wholesale",
      tier: "Standard",
      phone: "9000033333",
      city: "Vijayawada",
      paymentTerms: "Net 7",
      creditLimit: 100000,
      status: "Inactive",
    },
    {
      code: "CUST-004",
      name: "Prime Distributors",
      tier: "Key Account",
      phone: "9000044444",
      city: "Chennai",
      paymentTerms: "Net 45",
      creditLimit: 500000,
      status: "Active",
    },
    {
      code: "CUST-005",
      name: "Local Kirana Hub",
      tier: "Small",
      phone: "9000055555",
      city: "Anakapalli",
      paymentTerms: "Advance",
      creditLimit: 25000,
      status: "Blocked",
    },
    {
      code: "CUST-006",
      name: "Omni Stores",
      tier: "Standard",
      phone: "9000066666",
      city: "Hyderabad",
      paymentTerms: "Net 30",
      creditLimit: 200000,
      status: "Active",
    },
    {
      code: "CUST-007",
      name: "BoxPro Retailers",
      tier: "Small",
      phone: "9000077777",
      city: "Pune",
      paymentTerms: "Net 15",
      creditLimit: 50000,
      status: "Active",
    },
    {
      code: "CUST-008",
      name: "SkyRoute Buyers",
      tier: "Standard",
      phone: "9000088888",
      city: "Delhi",
      paymentTerms: "Custom",
      creditLimit: 120000,
      status: "Active",
    },
    {
      code: "CUST-009",
      name: "ColdChain Clients",
      tier: "Key Account",
      phone: "9000099999",
      city: "Mumbai",
      paymentTerms: "Net 30",
      creditLimit: 350000,
      status: "Inactive",
    },
    {
      code: "CUST-010",
      name: "General Super Market",
      tier: "Standard",
      phone: "9000000000",
      city: "Hyderabad",
      paymentTerms: "Net 30",
      creditLimit: 180000,
      status: "Active",
    },
  ]);

  // Column Filters
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [tierFilter, setTierFilter] = useState<CustomerTier | "">("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [termsFilter, setTermsFilter] = useState<PaymentTerms | "">("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "">("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal (demo)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<
    Pick<Customer, "code" | "name" | "tier" | "phone" | "city" | "paymentTerms" | "creditLimit" | "status">
  >({
    code: "",
    name: "",
    tier: "Standard",
    phone: "",
    city: "",
    paymentTerms: "Net 30",
    creditLimit: 0,
    status: "Active",
  });

  // Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(
      (c) =>
        c.code.toLowerCase().includes(searchCode.toLowerCase()) &&
        c.name.toLowerCase().includes(searchName.toLowerCase()) &&
        c.phone.toLowerCase().includes(searchPhone.toLowerCase()) &&
        c.city.toLowerCase().includes(searchCity.toLowerCase()) &&
        (tierFilter ? c.tier === tierFilter : true) &&
        (termsFilter ? c.paymentTerms === termsFilter : true) &&
        (statusFilter ? c.status === statusFilter : true)
    );
  }, [
    data,
    searchCode,
    searchName,
    searchPhone,
    searchCity,
    tierFilter,
    termsFilter,
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
    const active = filteredData.filter((c) => c.status === "Active").length;
    const inactive = filteredData.filter((c) => c.status === "Inactive").length;
    const blocked = filteredData.filter((c) => c.status === "Blocked").length;
    const keyAccounts = filteredData.filter((c) => c.tier === "Key Account").length;

    const totalCredit = filteredData.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);
    const avgCredit = total > 0 ? Math.round(totalCredit / total) : 0;

    return { total, active, inactive, blocked, keyAccounts, totalCredit, avgCredit };
  }, [filteredData]);

  // CSV Export
  const exportToCSV = () => {
    const header = [
      "Customer Code",
      "Customer Name",
      "Tier",
      "Phone",
      "City",
      "Payment Terms",
      "Credit Limit",
      "Status",
    ];

    const rows = filteredData.map((c) =>
      [c.code, c.name, c.tier, c.phone, c.city, c.paymentTerms, c.creditLimit, c.status]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "customer-master.csv";
    link.click();
  };

  // Actions
  const onDelete = (code: string) => {
    const ok = confirm(`Delete customer ${code}?`);
    if (!ok) return;
    setData((p) => p.filter((x) => x.code !== code));
  };

  const onAddCustomer = () => {
    const code = newCustomer.code.trim();
    const name = newCustomer.name.trim();

    if (!code || !name) {
      alert("Customer Code and Customer Name are required.");
      return;
    }

    if (data.some((d) => d.code.trim().toLowerCase() === code.toLowerCase())) {
      alert("Customer Code already exists.");
      return;
    }

    if (Number.isNaN(Number(newCustomer.creditLimit)) || Number(newCustomer.creditLimit) < 0) {
      alert("Credit Limit should be a valid number.");
      return;
    }

    setData((p) => [{ ...newCustomer, code, name, creditLimit: Number(newCustomer.creditLimit) }, ...p]);
    setIsModalOpen(false);

    setNewCustomer({
      code: "",
      name: "",
      tier: "Standard",
      phone: "",
      city: "",
      paymentTerms: "Net 30",
      creditLimit: 0,
      status: "Active",
    });

    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchCode("");
    setSearchName("");
    setSearchPhone("");
    setSearchCity("");
    setTierFilter("");
    setTermsFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Customer Master" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Customer Master
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Maintain client details, payment terms, and credit limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
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
                      Customer Code
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
                      Customer Name
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
                        <option value="Key Account">Key Account</option>
                        <option value="Standard">Standard</option>
                        <option value="Small">Small</option>
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
                      Payment Terms
                      <select
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        value={termsFilter}
                        onChange={(e) => {
                          setTermsFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All</option>
                        <option value="Advance">Advance</option>
                        <option value="Net 7">Net 7</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </th>

                    <th className="px-4 py-3 text-left">Credit Limit</th>

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
                        <option value="Blocked">Blocked</option>
                      </select>
                    </th>

                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="dark:text-gray-200">
                  {paginatedData.map((c) => (
                    <tr
                      key={c.code}
                      className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3">{c.code}</td>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">{c.tier}</td>
                      <td className="px-4 py-3">{c.phone}</td>
                      <td className="px-4 py-3">{c.city}</td>
                      <td className="px-4 py-3">{c.paymentTerms}</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatINR(c.creditLimit)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={classNames(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            c.status === "Active" && "bg-green-100 text-green-700",
                            c.status === "Inactive" && "bg-red-100 text-red-600",
                            c.status === "Blocked" && "bg-amber-100 text-amber-800"
                          )}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 space-x-3">
                        <button
                          className="font-semibold text-blue-600 hover:underline"
                          onClick={() => alert(`Edit flow: open Customer Form for ${c.code}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="font-semibold text-rose-600 hover:underline"
                          onClick={() => onDelete(c.code)}
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
                        colSpan={9}
                      >
                        No customers found for current filters.
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
                    {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                    {filteredData.length} entries
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
                <StatRow label="Total Customers" value={stats.total} />
                <StatRow label="Active" value={stats.active} badge="green" />
                <StatRow label="Inactive" value={stats.inactive} badge="red" />
                <StatRow label="Blocked" value={stats.blocked} badge="amber" />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Key Accounts" value={stats.keyAccounts} />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Total Credit Limit" value={stats.totalCredit} money />
                <StatRow label="Avg Credit / Customer" value={stats.avgCredit} money />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats + export.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal (Demo) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add New Customer (Demo)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  Temporary modal. Next: Customer Creation page.
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
                  Customer Code *
                </label>
                <input
                  value={newCustomer.code}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, code: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="CUST-011"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Customer Name *
                </label>
                <input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Customer Name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tier
                </label>
                <select
                  value={newCustomer.tier}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, tier: e.target.value as any }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Key Account">Key Account</option>
                  <option value="Standard">Standard</option>
                  <option value="Small">Small</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Phone
                </label>
                <input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="9000011111"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  City
                </label>
                <input
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, city: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Hyderabad"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Payment Terms
                </label>
                <select
                  value={newCustomer.paymentTerms}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, paymentTerms: e.target.value as any }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Advance">Advance</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Credit Limit
                </label>
                <input
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, creditLimit: Number(e.target.value) }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="150000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Status
                </label>
                <select
                  value={newCustomer.status}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, status: e.target.value as any }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blocked">Blocked</option>
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
                onClick={onAddCustomer}
              >
                Add Customer
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
  money,
}: {
  label: string;
  value: number;
  badge?: "green" | "red" | "amber";
  money?: boolean;
}) {
  const showValue = money ? formatINR(value) : String(value);

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span
        className={classNames(
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          badge === "green" && "bg-green-100 text-green-700",
          badge === "red" && "bg-red-100 text-red-600",
          badge === "amber" && "bg-amber-100 text-amber-800",
          !badge && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
        )}
      >
        {showValue}
      </span>
    </div>
  );
}
