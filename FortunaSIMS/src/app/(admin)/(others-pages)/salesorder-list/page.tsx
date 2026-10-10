"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type SOStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Reserved"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

type Channel = "B2B" | "D2C" | "Retail";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Currency = "INR" | "USD" | "EUR";
type ApprovalLevel = 1 | 2 | 3;
type ApprovalDecision = "Approved" | "Rejected";

type ApprovalStep = {
  level: ApprovalLevel;
  approverRole: string;
  decision?: ApprovalDecision;
  decidedAt?: string;
  remarks?: string;
};

type SalesOrder = {
  soNo: string;
  soDate: string;
  createdOn: string;
  salesRep: string;
  channel: Channel;
  customerName: string;
  customerCode: string;
  quoteNo: string;
  currency: Currency;
  totalItems: number;
  grandTotal: number;
  priority: Priority;
  status: SOStatus;
  deliveryWarehouse: string;
  requestedDeliveryDate: string;
  approvalRequired: boolean;
  approvalRoute: ApprovalStep[];
  currentApprovalLevel: ApprovalLevel;
};

type ListTab = "all" | "drafts" | "pending" | "approved" | "reserved" | "dispatched";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function withinRange(dateISO: string, from?: string, to?: string) {
  const time = new Date(dateISO).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to && time > new Date(to).getTime()) return false;
  return true;
}

function formatMoney(value: number, currency: Currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value)}`;
  }
}

export default function SalesOrderListPage() {
  const router = useRouter();

  // Static demo data for UI development. Replace this array with the API response when integration is ready.
  const [data, setData] = useState<SalesOrder[]>([
    {
      soNo: "SO-2026-000201", soDate: "2026-10-01", createdOn: "2026-10-01",
      salesRep: "Sandeep", channel: "B2B", customerName: "ABC Retail Pvt Ltd", customerCode: "CUS-1001",
      quoteNo: "SQ-2026-018", currency: "INR", totalItems: 8, grandTotal: 125000,
      priority: "High", status: "Approved", deliveryWarehouse: "WH-001",
      requestedDeliveryDate: "2026-10-15", approvalRequired: true, currentApprovalLevel: 3,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager", decision: "Approved", decidedAt: "2026-10-01" },
        { level: 2, approverRole: "Finance Manager", decision: "Approved", decidedAt: "2026-10-01" },
        { level: 3, approverRole: "Sales Head", decision: "Approved", decidedAt: "2026-10-01" },
      ],
    },
    {
      soNo: "SO-2026-000202", soDate: "2026-10-02", createdOn: "2026-10-02",
      salesRep: "Aparna", channel: "Retail", customerName: "Sri Lakshmi Traders", customerCode: "CUS-1002",
      quoteNo: "SQ-2026-021", currency: "INR", totalItems: 5, grandTotal: 78500,
      priority: "Medium", status: "Draft", deliveryWarehouse: "WH-002",
      requestedDeliveryDate: "2026-10-18", approvalRequired: false, currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager" },
        { level: 2, approverRole: "Finance Manager" },
        { level: 3, approverRole: "Sales Head" },
      ],
    },
    {
      soNo: "SO-2026-000203", soDate: "2026-10-03", createdOn: "2026-10-03",
      salesRep: "Divya", channel: "B2B", customerName: "Global Mart", customerCode: "CUS-1003",
      quoteNo: "SQ-2026-022", currency: "INR", totalItems: 12, grandTotal: 245000,
      priority: "Urgent", status: "Pending Approval", deliveryWarehouse: "WH-001",
      requestedDeliveryDate: "2026-10-20", approvalRequired: true, currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager" },
        { level: 2, approverRole: "Finance Manager" },
        { level: 3, approverRole: "Sales Head" },
      ],
    },
    {
      soNo: "SO-2026-000204", soDate: "2026-10-04", createdOn: "2026-10-04",
      salesRep: "Kiran", channel: "D2C", customerName: "Fresh Basket Stores", customerCode: "CUS-1004",
      quoteNo: "SQ-2026-024", currency: "INR", totalItems: 4, grandTotal: 46200,
      priority: "High", status: "Dispatched", deliveryWarehouse: "WH-003",
      requestedDeliveryDate: "2026-10-16", approvalRequired: true, currentApprovalLevel: 3,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager", decision: "Approved", decidedAt: "2026-10-04" },
        { level: 2, approverRole: "Finance Manager", decision: "Approved", decidedAt: "2026-10-04" },
        { level: 3, approverRole: "Sales Head", decision: "Approved", decidedAt: "2026-10-04" },
      ],
    },
    {
      soNo: "SO-2026-000205", soDate: "2026-10-05", createdOn: "2026-10-05",
      salesRep: "Ravi", channel: "B2B", customerName: "Metro Supplies", customerCode: "CUS-1005",
      quoteNo: "SQ-2026-025", currency: "INR", totalItems: 9, grandTotal: 186750,
      priority: "Medium", status: "Delivered", deliveryWarehouse: "WH-002",
      requestedDeliveryDate: "2026-10-22", approvalRequired: true, currentApprovalLevel: 3,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager", decision: "Approved", decidedAt: "2026-10-05" },
        { level: 2, approverRole: "Finance Manager", decision: "Approved", decidedAt: "2026-10-05" },
        { level: 3, approverRole: "Sales Head", decision: "Approved", decidedAt: "2026-10-05" },
      ],
    },
    {
      soNo: "SO-2026-000206", soDate: "2026-10-06", createdOn: "2026-10-06",
      salesRep: "Sandeep", channel: "Retail", customerName: "City Supermarket", customerCode: "CUS-1006",
      quoteNo: "SQ-2026-026", currency: "INR", totalItems: 6, grandTotal: 63900,
      priority: "Low", status: "Cancelled", deliveryWarehouse: "WH-001",
      requestedDeliveryDate: "2026-10-25", approvalRequired: false, currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager" },
        { level: 2, approverRole: "Finance Manager" },
        { level: 3, approverRole: "Sales Head" },
      ],
    },
    {
      soNo: "SO-2026-000207", soDate: "2026-10-07", createdOn: "2026-10-07",
      salesRep: "Aparna", channel: "B2B", customerName: "Eastern Distributors", customerCode: "CUS-1007",
      quoteNo: "SQ-2026-027", currency: "INR", totalItems: 15, grandTotal: 312400,
      priority: "Urgent", status: "Reserved", deliveryWarehouse: "WH-004",
      requestedDeliveryDate: "2026-10-21", approvalRequired: true, currentApprovalLevel: 3,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager", decision: "Approved", decidedAt: "2026-10-07" },
        { level: 2, approverRole: "Finance Manager", decision: "Approved", decidedAt: "2026-10-07" },
        { level: 3, approverRole: "Sales Head", decision: "Approved", decidedAt: "2026-10-07" },
      ],
    },
    {
      soNo: "SO-2026-000208", soDate: "2026-10-08", createdOn: "2026-10-08",
      salesRep: "Divya", channel: "D2C", customerName: "Coastal Foods", customerCode: "CUS-1008",
      quoteNo: "SQ-2026-029", currency: "INR", totalItems: 3, grandTotal: 54200,
      priority: "Medium", status: "Rejected", deliveryWarehouse: "WH-001",
      requestedDeliveryDate: "2026-10-23", approvalRequired: true, currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Sales Manager", decision: "Rejected", decidedAt: "2026-10-08", remarks: "Credit limit review required" },
        { level: 2, approverRole: "Finance Manager" },
        { level: 3, approverRole: "Sales Head" },
      ],
    },
  ]);

  const [activeTab, setActiveTab] = useState<ListTab>("all");
  const [searchSoNo, setSearchSoNo] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchSalesRep, setSearchSalesRep] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "">("");
  const [statusFilter, setStatusFilter] = useState<SOStatus | "">("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedSoNo, setSelectedSoNo] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewSoNo, setViewSoNo] = useState("");

  const tabFilteredBase = useMemo(() => {
    if (activeTab === "drafts") return data.filter((x) => x.status === "Draft");
    if (activeTab === "pending") return data.filter((x) => x.status === "Pending Approval");
    if (activeTab === "approved") return data.filter((x) => x.status === "Approved");
    if (activeTab === "reserved") return data.filter((x) => x.status === "Reserved");
    if (activeTab === "dispatched") return data.filter((x) => x.status === "Dispatched");
    return data;
  }, [data, activeTab]);

  const filteredData = useMemo(() => tabFilteredBase.filter((so) =>
    so.soNo.toLowerCase().includes(searchSoNo.toLowerCase()) &&
    so.customerName.toLowerCase().includes(searchCustomer.toLowerCase()) &&
    so.salesRep.toLowerCase().includes(searchSalesRep.toLowerCase()) &&
    (channelFilter ? so.channel === channelFilter : true) &&
    (statusFilter ? so.status === statusFilter : true) &&
    withinRange(so.createdOn, createdFrom || undefined, createdTo || undefined)
  ), [tabFilteredBase, searchSoNo, searchCustomer, searchSalesRep, channelFilter, statusFilter, createdFrom, createdTo]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const draft = filteredData.filter((x) => x.status === "Draft").length;
    const pending = filteredData.filter((x) => x.status === "Pending Approval").length;
    const approved = filteredData.filter((x) => x.status === "Approved").length;
    const reserved = filteredData.filter((x) => x.status === "Reserved").length;
    const dispatched = filteredData.filter((x) => x.status === "Dispatched").length;
    const rejected = filteredData.filter((x) => x.status === "Rejected").length;
    const cancelled = filteredData.filter((x) => x.status === "Cancelled").length;
    const totalValue = filteredData.reduce((sum, x) => sum + (Number(x.grandTotal) || 0), 0);
    const avgValue = total ? Math.round(totalValue / total) : 0;
    return { total, draft, pending, approved, reserved, dispatched, rejected, cancelled, totalValue, avgValue };
  }, [filteredData]);

  const draftsCount = useMemo(() => data.filter((x) => x.status === "Draft").length, [data]);
  const pendingCount = useMemo(() => data.filter((x) => x.status === "Pending Approval").length, [data]);

  const exportToCSV = () => {
    const header = ["SO No", "Customer", "Customer Code", "Sales Rep", "Channel", "Created On", "SO Date", "Quote No", "Warehouse", "Delivery Date", "Currency", "Grand Total", "Status", "Items", "Priority"];
    const rows = filteredData.map((so) => [
      so.soNo, so.customerName, so.customerCode, so.salesRep, so.channel, so.createdOn, so.soDate,
      so.quoteNo, so.deliveryWarehouse, so.requestedDeliveryDate, so.currency, so.grandTotal, so.status, so.totalItems, so.priority,
    ]);
    const csvContent = [header.join(","), ...rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sales-order-list.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const resetFilters = () => {
    setSearchSoNo("");
    setSearchCustomer("");
    setSearchSalesRep("");
    setChannelFilter("");
    setStatusFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  const openApproval = (soNo: string) => {
    setSelectedSoNo(soNo);
    setApprovalRemarks("");
    setApprovalModalOpen(true);
  };

  const applyDecision = (decision: ApprovalDecision) => {
    if (!selectedSoNo) return;
    setData((prev) => prev.map((so) => {
      if (so.soNo !== selectedSoNo || so.status !== "Pending Approval") return so;
      const now = todayISO();
      const level = so.currentApprovalLevel;
      const nextRoute = so.approvalRoute.map((step) => step.level === level
        ? { ...step, decision, decidedAt: now, remarks: approvalRemarks.trim() || undefined }
        : step);
      if (decision === "Rejected") return { ...so, status: "Rejected", approvalRoute: nextRoute };
      const nextLevel = (level + 1) as ApprovalLevel;
      const hasNext = so.approvalRoute.some((step) => step.level === nextLevel);
      if (hasNext) return { ...so, status: "Pending Approval", approvalRoute: nextRoute, currentApprovalLevel: nextLevel };
      return { ...so, status: "Approved", approvalRoute: nextRoute };
    }));
    setApprovalModalOpen(false);
  };

  const issueSO = (soNo: string) => {
    if (!confirm(`Issue Sales Order ${soNo} for fulfillment?`)) return;
    setData((prev) => prev.map((so) => so.soNo === soNo && so.status === "Approved" ? { ...so, status: "Reserved" } : so));
  };

  const onEditDraft = (soNo: string) => {
    router.push(`/sales-orderform?mode=edit&soNo=${encodeURIComponent(soNo)}`);
  };

  const onSendDraftForApproval = (soNo: string) => {
    if (!confirm(`Send draft Sales Order ${soNo} for approval?`)) return;
    setData((prev) => prev.map((so) => so.soNo !== soNo || so.status !== "Draft" ? so : {
      ...so,
      status: "Pending Approval",
      approvalRequired: true,
      currentApprovalLevel: 1,
      approvalRoute: so.approvalRoute.map((step) => ({ ...step, decision: undefined, decidedAt: undefined, remarks: undefined })),
    }));
    setActiveTab("pending");
    setCurrentPage(1);
  };

  const onDeleteDraft = (soNo: string) => {
    if (!confirm(`Delete draft Sales Order ${soNo}? This cannot be undone.`)) return;
    setData((prev) => prev.filter((x) => x.soNo !== soNo));
  };

  const statusPill = (status: SOStatus) => classNames(
    "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
    status === "Approved" && "bg-green-100 text-green-700",
    status === "Rejected" && "bg-red-100 text-red-600",
    status === "Pending Approval" && "bg-amber-100 text-amber-800",
    status === "Reserved" && "bg-blue-100 text-blue-700",
    status === "Dispatched" && "bg-indigo-100 text-indigo-700",
    status === "Delivered" && "bg-emerald-100 text-emerald-700",
    status === "Cancelled" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
    status === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
  );

  const priorityPill = (priority: Priority) => classNames(
    "rounded-full px-2.5 py-1 text-xs font-semibold",
    priority === "Low" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
    priority === "Medium" && "bg-blue-100 text-blue-700",
    priority === "High" && "bg-amber-100 text-amber-800",
    priority === "Urgent" && "bg-rose-100 text-rose-700",
  );

  const getSOByNo = (soNo: string) => data.find((x) => x.soNo === soNo);
  const selectedSO = selectedSoNo ? getSOByNo(selectedSoNo) : undefined;
  const viewedSO = viewSoNo ? getSOByNo(viewSoNo) : undefined;

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Sales Order (SO)" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header - follows the PO List layout */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">SO List</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">Track sales orders, approvals, reservations, dispatches, and customer deliveries.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => router.push("/sales-orderform")} className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}>
              + Create SO
            </button>
            <button type="button" onClick={exportToCSV} className="active:scale-95 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-rose-700">Export to Excel</button>
            <button type="button" onClick={resetFilters} className="active:scale-95 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-md transition-all duration-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5">Reset Filters</button>
          </div>
        </div>

        {/* Tabs - same PO List tab button treatment */}
        <div className="mb-4 flex flex-wrap gap-2">
          <TabBtn active={activeTab === "all"} color={FORTUNA_PRIMARY_RED} onClick={() => { setActiveTab("all"); setCurrentPage(1); }} label="All SOs" />
          <TabBtn active={activeTab === "drafts"} color={FORTUNA_SECONDARY_BLUE} onClick={() => { setActiveTab("drafts"); setStatusFilter(""); setCurrentPage(1); }} label={<>Drafts <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">{draftsCount}</span></>} />
          <TabBtn active={activeTab === "pending"} color={FORTUNA_PRIMARY_RED} onClick={() => { setActiveTab("pending"); setStatusFilter(""); setCurrentPage(1); }} label={<>Pending Approval <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">{pendingCount}</span></>} />
          <TabBtn active={activeTab === "approved"} color={FORTUNA_SECONDARY_BLUE} onClick={() => { setActiveTab("approved"); setStatusFilter(""); setCurrentPage(1); }} label="Approved" />
          <TabBtn active={activeTab === "reserved"} color={FORTUNA_PRIMARY_RED} onClick={() => { setActiveTab("reserved"); setStatusFilter(""); setCurrentPage(1); }} label="Reserved" />
          <TabBtn active={activeTab === "dispatched"} color={FORTUNA_SECONDARY_BLUE} onClick={() => { setActiveTab("dispatched"); setStatusFilter(""); setCurrentPage(1); }} label="Dispatched" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Table Panel */}
          <div className="xl:col-span-9">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">SO No
                      <input className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900" placeholder="Search" value={searchSoNo} onChange={(e) => { setSearchSoNo(e.target.value); setCurrentPage(1); }} />
                    </th>
                    <th className="px-4 py-3 text-left">Customer
                      <input className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900" placeholder="Search" value={searchCustomer} onChange={(e) => { setSearchCustomer(e.target.value); setCurrentPage(1); }} />
                    </th>
                    <th className="px-4 py-3 text-left">Sales Rep
                      <input className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900" placeholder="Search" value={searchSalesRep} onChange={(e) => { setSearchSalesRep(e.target.value); setCurrentPage(1); }} />
                    </th>
                    <th className="px-4 py-3 text-left">Channel
                      <select className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900" value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value as Channel | ""); setCurrentPage(1); }}>
                        <option value="">All</option><option value="B2B">B2B</option><option value="D2C">D2C</option><option value="Retail">Retail</option>
                      </select>
                    </th>
                    <th className="px-4 py-3 text-left">Priority<div className="mt-2 text-xs text-gray-500 dark:text-gray-300">(from quote)</div></th>
                    <th className="px-4 py-3 text-left">Status
                      <select className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as SOStatus | ""); setCurrentPage(1); }}>
                        <option value="">All</option><option value="Draft">Draft</option><option value="Pending Approval">Pending Approval</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="Reserved">Reserved</option><option value="Dispatched">Dispatched</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                      </select>
                    </th>
                    <th className="px-4 py-3 text-left">Created On
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input type="date" aria-label="Created from" className="w-full min-w-0 rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setCurrentPage(1); }} />
                        <input type="date" aria-label="Created to" className="w-full min-w-0 rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setCurrentPage(1); }} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-left">Grand Total</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="dark:text-gray-200">
                  {paginatedData.map((so) => (
                    <tr key={so.soNo} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold">
                        {so.soNo}
                        <div className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-300">SO Date: {so.soDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{so.customerName}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{so.customerCode}</div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">Quote: <span className="font-semibold">{so.quoteNo}</span> • WH: <span className="font-semibold">{so.deliveryWarehouse}</span></div>
                      </td>
                      <td className="px-4 py-3">{so.salesRep}</td>
                      <td className="px-4 py-3">{so.channel}</td>
                      <td className="px-4 py-3"><span className={priorityPill(so.priority)}>{so.priority}</span></td>
                      <td className="px-4 py-3">
                        <span className={statusPill(so.status)}>{so.status}</span>
                        {so.status === "Pending Approval" && so.approvalRequired && <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">Level {so.currentApprovalLevel} • {so.approvalRoute.find((s) => s.level === so.currentApprovalLevel)?.approverRole}</div>}
                        {!so.approvalRequired && so.status !== "Draft" && <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">Approval: <span className="font-semibold">Not Required</span></div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{so.createdOn}</td>
                      <td className="px-4 py-3">{so.totalItems}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">{formatMoney(so.grandTotal, so.currency)}</td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[330px] flex-wrap gap-x-3 gap-y-2">
                          <button type="button" className="font-semibold text-blue-600 hover:underline" onClick={() => { setViewSoNo(so.soNo); setViewModalOpen(true); }}>View</button>
                          {activeTab === "drafts" && so.status === "Draft" && <>
                            <button type="button" className="font-semibold hover:underline" style={{ color: FORTUNA_SECONDARY_BLUE }} onClick={() => onEditDraft(so.soNo)}>Edit</button>
                            <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => onSendDraftForApproval(so.soNo)}>Send for Approval</button>
                            <button type="button" className="font-semibold text-rose-600 hover:underline" onClick={() => onDeleteDraft(so.soNo)}>Delete</button>
                          </>}
                          {activeTab !== "drafts" && so.status === "Pending Approval" && so.approvalRequired && <button type="button" className="font-semibold hover:underline" style={{ color: FORTUNA_SECONDARY_BLUE }} onClick={() => openApproval(so.soNo)}>Approve / Reject</button>}
                          {activeTab !== "drafts" && so.status === "Approved" && <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => issueSO(so.soNo)}>Reserve / Fulfill</button>}
                          {so.status === "Reserved" && <button type="button" className="font-semibold text-blue-700 hover:underline" onClick={() => setData((prev) => prev.map((x) => x.soNo === so.soNo ? { ...x, status: "Dispatched" } : x))}>Dispatch</button>}
                          {so.status === "Dispatched" && <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => setData((prev) => prev.map((x) => x.soNo === so.soNo ? { ...x, status: "Delivered" } : x))}>Mark Delivered</button>}
                          {["Draft", "Pending Approval", "Approved", "Reserved"].includes(so.status) && <button type="button" className="font-semibold text-gray-500 hover:text-rose-700 hover:underline" onClick={() => { if (confirm(`Cancel Sales Order ${so.soNo}?`)) setData((prev) => prev.map((x) => x.soNo === so.soNo ? { ...x, status: "Cancelled" } : x)); }}>Cancel</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && <tr><td className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300" colSpan={10}>No Sales Orders found for current filters.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Bottom controls: same arrangement as PO List */}
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                {filteredData.length > 0 ? <>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries</> : <>Showing 0 entries</>}
              </div>
              <div className="flex items-center gap-2 text-sm dark:text-gray-200">
                <span>Records per page:</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="rounded-md border px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900">
                  <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700">Previous</button>
                <button type="button" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)} className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700">Next</button>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel: same right-side panel as PO List */}
          <div className="xl:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Quick Stats</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
              </div>
              <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                <StatRow label="Total SOs" value={stats.total} />
                <StatRow label="Draft" value={stats.draft} badge="gray" />
                <StatRow label="Pending Approval" value={stats.pending} badge="amber" />
                <StatRow label="Approved" value={stats.approved} badge="green" />
                <StatRow label="Reserved" value={stats.reserved} badge="blue" />
                <StatRow label="Dispatched" value={stats.dispatched} badge="purple" />
                <StatRow label="Rejected" value={stats.rejected} badge="red" />
                <StatRow label="Cancelled" value={stats.cancelled} badge="gray" />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Total SO Value" value={stats.totalValue} money />
                <StatRow label="Avg Value / SO" value={stats.avgValue} money />
              </div>
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"><span className="font-semibold">Tip:</span> Filters apply to stats + export.</div>
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"><span className="font-semibold">Drafts:</span> Drafts tab lo only Edit / Send for Approval / Delete.</div>
            </div>
          </div>
        </div>
      </div>

      {/* View SO modal */}
      {viewModalOpen && viewedSO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewModalOpen(false); }}>
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Order Details</h3><p className="text-xs text-gray-500 dark:text-gray-300">SO: <span className="font-semibold">{viewedSO.soNo}</span></p></div>
              <button type="button" className="rounded-lg border px-3 py-1 text-sm dark:border-gray-800 dark:text-gray-200" onClick={() => setViewModalOpen(false)}>Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Customer" value={`${viewedSO.customerName} (${viewedSO.customerCode})`} />
              <Info label="Sales Representative" value={viewedSO.salesRep} />
              <Info label="Channel" value={viewedSO.channel} />
              <Info label="Created On" value={viewedSO.createdOn} />
              <Info label="SO Date" value={viewedSO.soDate} />
              <Info label="Quote No" value={viewedSO.quoteNo} />
              <Info label="Warehouse" value={viewedSO.deliveryWarehouse} />
              <Info label="Requested Delivery" value={viewedSO.requestedDeliveryDate} />
              <Info label="Items" value={String(viewedSO.totalItems)} />
              <Info label="Grand Total" value={formatMoney(viewedSO.grandTotal, viewedSO.currency)} />
              <Info label="Priority" value={viewedSO.priority} />
              <Info label="Status" value={viewedSO.status} />
            </div>
            <div className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Approval Route</h4>
              <div className="mt-3 space-y-2">
                {viewedSO.approvalRoute.map((step) => <div key={step.level} className="flex flex-col gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"><span className="font-semibold dark:text-gray-100">Level {step.level} • {step.approverRole}</span><span className={classNames("w-fit rounded-full px-2 py-0.5 text-xs font-semibold", step.decision === "Approved" && "bg-green-100 text-green-700", step.decision === "Rejected" && "bg-red-100 text-red-600", !step.decision && "bg-amber-100 text-amber-800")}>{step.decision ?? "Pending"}</span>{step.decidedAt && <span className="text-xs text-gray-500">{step.decidedAt}{step.remarks ? ` • ${step.remarks}` : ""}</span>}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval modal: same layout/pattern as PO List */}
      {approvalModalOpen && selectedSO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approve / Reject Sales Order</h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">SO: <span className="font-semibold">{selectedSO.soNo}</span> • Level <span className="font-semibold">{selectedSO.currentApprovalLevel}</span> • <span className="font-semibold">{selectedSO.approvalRoute.find((s) => s.level === selectedSO.currentApprovalLevel)?.approverRole}</span></p>
              </div>
              <button type="button" className="rounded-lg border px-3 py-1 text-sm dark:border-gray-800 dark:text-gray-200" onClick={() => setApprovalModalOpen(false)}>Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 lg:col-span-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedSO.customerName} ({selectedSO.customerCode})</div>
                <div className="mt-2 grid grid-cols-1 gap-3 text-sm dark:text-gray-200 sm:grid-cols-2">
                  <Info label="Sales Rep" value={selectedSO.salesRep} /><Info label="Channel" value={selectedSO.channel} /><Info label="Created On" value={selectedSO.createdOn} /><Info label="SO Date" value={selectedSO.soDate} /><Info label="Quote No" value={selectedSO.quoteNo} /><Info label="Warehouse" value={selectedSO.deliveryWarehouse} /><Info label="Items" value={String(selectedSO.totalItems)} /><Info label="Grand Total" value={formatMoney(selectedSO.grandTotal, selectedSO.currency)} />
                </div>
                <div className="mt-4"><label className="text-sm font-medium text-gray-700 dark:text-gray-200">Remarks (optional)</label><textarea value={approvalRemarks} onChange={(e) => setApprovalRemarks(e.target.value)} className="mt-2 min-h-[90px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white" placeholder="Add approval/rejection remarks..." /></div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Approval Route</h4><span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} /></div>
                <div className="mt-3 space-y-2 text-sm dark:text-gray-200">
                  {selectedSO.approvalRoute.map((step) => {
                    const isCurrent = step.level === selectedSO.currentApprovalLevel && selectedSO.status === "Pending Approval";
                    const decision = step.decision ?? "Pending";
                    return <div key={step.level} className={classNames("rounded-lg border px-3 py-2", isCurrent ? "border-blue-300 bg-blue-50 dark:bg-white/5" : "border-gray-200 dark:border-gray-800")}><div className="flex items-center justify-between gap-2"><span className="font-semibold">Level {step.level} • {step.approverRole}</span><span className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold", decision === "Approved" && "bg-green-100 text-green-700", decision === "Rejected" && "bg-red-100 text-red-600", decision === "Pending" && "bg-amber-100 text-amber-800")}>{decision}</span></div>{step.decidedAt && <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{step.decidedAt}{step.remarks ? ` • ${step.remarks}` : ""}</div>}</div>;
                  })}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} onClick={() => applyDecision("Rejected")}>Reject</button>
                  <button type="button" className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} onClick={() => applyDecision("Approved")}>Approve</button>
                </div>
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"><span className="font-semibold">Note:</span> Demo approval updates local state only. API + role access can be connected later.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, color, onClick, label }: { active: boolean; color: string; onClick: () => void; label: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={classNames("rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95", active ? "text-white shadow" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5")} style={active ? { backgroundColor: color } : undefined}>
      {label}
    </button>
  );
}

function StatRow({ label, value, badge, money }: { label: string; value: number; badge?: "green" | "red" | "amber" | "blue" | "gray" | "purple"; money?: boolean }) {
  const showValue = money
    ? (() => { try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); } catch { return `₹${Math.round(value)}`; } })()
    : String(value);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className={classNames("rounded-full px-2.5 py-1 text-xs font-semibold", badge === "green" && "bg-green-100 text-green-700", badge === "red" && "bg-red-100 text-red-600", badge === "amber" && "bg-amber-100 text-amber-800", badge === "blue" && "bg-blue-100 text-blue-700", badge === "purple" && "bg-purple-100 text-purple-700", (badge === "gray" || !badge) && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200")}>{showValue}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-800"><div className="text-xs text-gray-500 dark:text-gray-300">{label}</div><div className="text-sm font-semibold text-gray-900 dark:text-white">{value}</div></div>;
}
