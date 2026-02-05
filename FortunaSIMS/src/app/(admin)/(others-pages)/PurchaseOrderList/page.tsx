"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** PO Domain */
type POStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Issued to Vendor"
  | "Partially Received"
  | "Fully Received"
  | "Closed"
  | "Cancelled";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Department = "Stores" | "Operations" | "Maintenance" | "Finance" | "IT" | "Admin" | "Procurement";
type Currency = "INR" | "USD" | "EUR";

type ApprovalLevel = 1 | 2 | 3;
type ApprovalDecision = "Approved" | "Rejected";

type ApprovalStep = {
  level: ApprovalLevel;
  approverRole: string; // ex: "Finance", "Procurement Head"
  decision?: ApprovalDecision;
  decidedAt?: string; // ISO date
  remarks?: string;
};

type PurchaseOrder = {
  poNo: string;
  poDate: string; // yyyy-mm-dd (system)
  createdOn: string; // yyyy-mm-dd
  buyer: string;
  department: Department;

  rfqNo: string; // source RFQ (optional in future)
  prNo: string; // source PR
  vendorName: string;
  vendorCode: string;

  currency: Currency;
  totalItems: number;
  grandTotal: number;

  priority: Priority;
  status: POStatus;

  deliveryWarehouse: string; // WH-001 etc

  approvalRequired: boolean; // configurable
  approvalRoute: ApprovalStep[];
  currentApprovalLevel: ApprovalLevel;
};

/** Tabs */
type ListTab = "all" | "drafts" | "pending" | "approved" | "issued";

/** UI helpers */
function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function withinRange(dateISO: string, from?: string, to?: string) {
  const t = new Date(dateISO).getTime();
  if (from) {
    const f = new Date(from).getTime();
    if (t < f) return false;
  }
  if (to) {
    const e = new Date(to).getTime();
    if (t > e) return false;
  }
  return true;
}
function formatMoney(value: number, currency: Currency) {
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

export default function PurchaseOrderListPage() {
  const [data, setData] = useState<PurchaseOrder[]>([
    {
      poNo: "PO-2026-000201",
      poDate: "2026-02-03",
      createdOn: "2026-02-03",
      buyer: "Sandeep",
      department: "Procurement",
      rfqNo: "RFQ-2026-000101",
      prNo: "PR-000103",
      vendorName: "Aparna Packaging",
      vendorCode: "V-002",
      currency: "INR",
      totalItems: 2,
      grandTotal: 68080,
      priority: "High",
      status: "Pending Approval",
      deliveryWarehouse: "WH-002",
      approvalRequired: true,
      currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Finance" },
        { level: 2, approverRole: "Procurement Head" },
        { level: 3, approverRole: "Admin" },
      ],
    },
    {
      poNo: "PO-2026-000202",
      poDate: "2026-02-02",
      createdOn: "2026-02-02",
      buyer: "Aparna",
      department: "Maintenance",
      rfqNo: "RFQ-2026-000099",
      prNo: "PR-000101",
      vendorName: "Sri Lakshmi Suppliers",
      vendorCode: "V-001",
      currency: "INR",
      totalItems: 6,
      grandTotal: 145000,
      priority: "Urgent",
      status: "Approved",
      deliveryWarehouse: "WH-001",
      approvalRequired: true,
      currentApprovalLevel: 2,
      approvalRoute: [
        { level: 1, approverRole: "Finance", decision: "Approved", decidedAt: "2026-02-02", remarks: "OK" },
        { level: 2, approverRole: "Procurement Head" },
        { level: 3, approverRole: "Admin" },
      ],
    },
    {
      poNo: "PO-2026-000203",
      poDate: "2026-02-01",
      createdOn: "2026-02-01",
      buyer: "Divya",
      department: "Admin",
      rfqNo: "RFQ-2026-000090",
      prNo: "PR-000104",
      vendorName: "Prime 3PL",
      vendorCode: "V-010",
      currency: "INR",
      totalItems: 1,
      grandTotal: 18000,
      priority: "Low",
      status: "Draft",
      deliveryWarehouse: "WH-003",
      approvalRequired: false,
      currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Finance" },
        { level: 2, approverRole: "Procurement Head" },
        { level: 3, approverRole: "Admin" },
      ],
    },
    {
      poNo: "PO-2026-000204",
      poDate: "2026-01-30",
      createdOn: "2026-01-30",
      buyer: "Kiran",
      department: "Operations",
      rfqNo: "RFQ-2026-000088",
      prNo: "PR-000105",
      vendorName: "FastLine Transport",
      vendorCode: "V-007",
      currency: "INR",
      totalItems: 1,
      grandTotal: 95000,
      priority: "High",
      status: "Issued to Vendor",
      deliveryWarehouse: "WH-002",
      approvalRequired: true,
      currentApprovalLevel: 3,
      approvalRoute: [
        { level: 1, approverRole: "Finance", decision: "Approved", decidedAt: "2026-01-31" },
        { level: 2, approverRole: "Procurement Head", decision: "Approved", decidedAt: "2026-02-01" },
        { level: 3, approverRole: "Admin", decision: "Approved", decidedAt: "2026-02-01" },
      ],
    },
    {
      poNo: "PO-2026-000205",
      poDate: "2026-01-28",
      createdOn: "2026-01-28",
      buyer: "Ravi",
      department: "Stores",
      rfqNo: "RFQ-2026-000080",
      prNo: "PR-000099",
      vendorName: "Sri Lakshmi Suppliers",
      vendorCode: "V-001",
      currency: "INR",
      totalItems: 3,
      grandTotal: 42000,
      priority: "Medium",
      status: "Rejected",
      deliveryWarehouse: "WH-001",
      approvalRequired: true,
      currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Finance", decision: "Rejected", decidedAt: "2026-01-29", remarks: "Budget not available" },
        { level: 2, approverRole: "Procurement Head" },
        { level: 3, approverRole: "Admin" },
      ],
    },
  ]);

  /** Tabs */
  const [activeTab, setActiveTab] = useState<ListTab>("all");

  /** Filters */
  const [searchPoNo, setSearchPoNo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchBuyer, setSearchBuyer] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "">("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "">("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  /** Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /** Approval Modal */
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedPoNo, setSelectedPoNo] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");

  /** Tab base filtering */
  const tabFilteredBase = useMemo(() => {
    if (activeTab === "drafts") return data.filter((x) => x.status === "Draft");
    if (activeTab === "pending") return data.filter((x) => x.status === "Pending Approval");
    if (activeTab === "approved") return data.filter((x) => x.status === "Approved");
    if (activeTab === "issued") return data.filter((x) => x.status === "Issued to Vendor");
    return data;
  }, [data, activeTab]);

  /** Apply filters */
  const filteredData = useMemo(() => {
    return tabFilteredBase.filter((po) => {
      const ok =
        po.poNo.toLowerCase().includes(searchPoNo.toLowerCase()) &&
        po.vendorName.toLowerCase().includes(searchVendor.toLowerCase()) &&
        po.buyer.toLowerCase().includes(searchBuyer.toLowerCase()) &&
        (deptFilter ? po.department === deptFilter : true) &&
        (statusFilter ? po.status === statusFilter : true) &&
        withinRange(po.createdOn, createdFrom || undefined, createdTo || undefined);

      return ok;
    });
  }, [
    tabFilteredBase,
    searchPoNo,
    searchVendor,
    searchBuyer,
    deptFilter,
    statusFilter,
    createdFrom,
    createdTo,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** Stats (based on filteredData) */
  const stats = useMemo(() => {
    const total = filteredData.length;
    const draft = filteredData.filter((x) => x.status === "Draft").length;
    const pending = filteredData.filter((x) => x.status === "Pending Approval").length;
    const approved = filteredData.filter((x) => x.status === "Approved").length;
    const issued = filteredData.filter((x) => x.status === "Issued to Vendor").length;
    const rejected = filteredData.filter((x) => x.status === "Rejected").length;
    const closed = filteredData.filter((x) => x.status === "Closed").length;

    const totalValue = filteredData.reduce((s, x) => s + (Number(x.grandTotal) || 0), 0);
    const avgValue = total ? Math.round(totalValue / total) : 0;

    return { total, draft, pending, approved, issued, rejected, closed, totalValue, avgValue };
  }, [filteredData]);

  /** Badges */
  const draftsCount = useMemo(() => data.filter((x) => x.status === "Draft").length, [data]);
  const pendingCount = useMemo(() => data.filter((x) => x.status === "Pending Approval").length, [data]);

  /** Export */
  const exportToCSV = () => {
    const header = [
      "PO No",
      "Vendor",
      "Buyer",
      "Department",
      "Created On",
      "PO Date",
      "RFQ No",
      "PR No",
      "Warehouse",
      "Currency",
      "Grand Total",
      "Status",
      "Items",
      "Priority",
    ];

    const rows = filteredData.map((po) =>
      [
        po.poNo,
        po.vendorName,
        po.buyer,
        po.department,
        po.createdOn,
        po.poDate,
        po.rfqNo,
        po.prNo,
        po.deliveryWarehouse,
        po.currency,
        po.grandTotal,
        po.status,
        po.totalItems,
        po.priority,
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "purchase-order-list.csv";
    link.click();
  };

  const resetFilters = () => {
    setSearchPoNo("");
    setSearchVendor("");
    setSearchBuyer("");
    setDeptFilter("");
    setStatusFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  /** Approval modal actions */
  const openApproval = (poNo: string) => {
    setSelectedPoNo(poNo);
    setApprovalRemarks("");
    setApprovalModalOpen(true);
  };

  const applyDecision = (decision: ApprovalDecision) => {
    if (!selectedPoNo) return;

    setData((prev) =>
      prev.map((po) => {
        if (po.poNo !== selectedPoNo) return po;
        if (po.status !== "Pending Approval") return po;

        const now = todayISO();
        const lvl = po.currentApprovalLevel;

        const nextRoute = po.approvalRoute.map((s) => {
          if (s.level !== lvl) return s;
          return {
            ...s,
            decision,
            decidedAt: now,
            remarks: approvalRemarks?.trim() ? approvalRemarks.trim() : undefined,
          };
        });

        if (decision === "Rejected") {
          return { ...po, status: "Rejected", approvalRoute: nextRoute };
        }

        const nextLevel = (lvl + 1) as ApprovalLevel;
        const hasNext = po.approvalRoute.some((s) => s.level === nextLevel);

        if (hasNext) {
          return {
            ...po,
            status: "Pending Approval",
            approvalRoute: nextRoute,
            currentApprovalLevel: nextLevel,
          };
        }

        return { ...po, status: "Approved", approvalRoute: nextRoute };
      })
    );

    setApprovalModalOpen(false);
  };

  /** Issue action (demo) */
  const issueToVendor = (poNo: string) => {
    const ok = confirm(`Issue PO ${poNo} to Vendor?`);
    if (!ok) return;

    setData((prev) =>
      prev.map((po) => {
        if (po.poNo !== poNo) return po;
        if (po.status !== "Approved") return po;
        return { ...po, status: "Issued to Vendor" };
      })
    );
  };

  /** ✅ Draft actions (ONLY in Drafts tab) */
  const onEditDraft = (poNo: string) => {
    // Replace with router.push("/procurement/po/new?mode=edit&poNo=...")
    alert(`Edit Draft PO: ${poNo} (demo)`);
  };

  const onSendDraftForApproval = (poNo: string) => {
    const ok = confirm(`Send draft PO ${poNo} for approval?`);
    if (!ok) return;

    setData((prev) =>
      prev.map((po) => {
        if (po.poNo !== poNo) return po;
        if (po.status !== "Draft") return po;

        // Draft -> Pending Approval
        return {
          ...po,
          status: "Pending Approval",
          approvalRequired: true, // in demo we assume approvals required once submitted
          currentApprovalLevel: 1,
          approvalRoute: po.approvalRoute.map((s) => ({ ...s, decision: undefined, decidedAt: undefined, remarks: undefined })),
        };
      })
    );

    // UX: switch to Pending tab after send
    setActiveTab("pending");
    setCurrentPage(1);
  };

  /** ✅ REQUIRED: Delete draft (ONLY in Drafts tab) */
  const onDeleteDraft = (poNo: string) => {
    const ok = confirm(`Delete draft PO ${poNo}? This cannot be undone.`);
    if (!ok) return;
    setData((prev) => prev.filter((x) => x.poNo !== poNo));
  };

  const statusPill = (s: POStatus) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600",
      s === "Pending Approval" && "bg-amber-100 text-amber-800",
      s === "Issued to Vendor" && "bg-blue-100 text-blue-700",
      s === "Partially Received" && "bg-indigo-100 text-indigo-700",
      s === "Fully Received" && "bg-emerald-100 text-emerald-700",
      s === "Closed" && "bg-purple-100 text-purple-700",
      s === "Cancelled" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
    );

  const priorityPill = (p: Priority) =>
    classNames(
      "rounded-full px-2.5 py-1 text-xs font-semibold",
      p === "Low" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      p === "Medium" && "bg-blue-100 text-blue-700",
      p === "High" && "bg-amber-100 text-amber-800",
      p === "Urgent" && "bg-rose-100 text-rose-700"
    );

  const getPOByNo = (poNo: string) => data.find((x) => x.poNo === poNo);
  const selectedPO = selectedPoNo ? getPOByNo(selectedPoNo) : undefined;

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Purchase Order (PO)" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">PO List</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Track purchase orders, approvals, and vendor issuing status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => alert("Next step: navigate to PO Creation page (demo)")}
              className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
            >
              + Create PO
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

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          <TabBtn
            active={activeTab === "all"}
            color={FORTUNA_PRIMARY_RED}
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            label="All POs"
          />

          <TabBtn
            active={activeTab === "drafts"}
            color={FORTUNA_SECONDARY_BLUE}
            onClick={() => {
              setActiveTab("drafts");
              setStatusFilter("");
              setCurrentPage(1);
            }}
            label={
              <>
                Drafts
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                  {draftsCount}
                </span>
              </>
            }
          />

          <TabBtn
            active={activeTab === "pending"}
            color={FORTUNA_PRIMARY_RED}
            onClick={() => {
              setActiveTab("pending");
              setStatusFilter("");
              setCurrentPage(1);
            }}
            label={
              <>
                Pending Approval
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              </>
            }
          />

          <TabBtn
            active={activeTab === "approved"}
            color={FORTUNA_SECONDARY_BLUE}
            onClick={() => {
              setActiveTab("approved");
              setStatusFilter("");
              setCurrentPage(1);
            }}
            label="Approved"
          />

          <TabBtn
            active={activeTab === "issued"}
            color={FORTUNA_PRIMARY_RED}
            onClick={() => {
              setActiveTab("issued");
              setStatusFilter("");
              setCurrentPage(1);
            }}
            label="Issued"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Table Panel */}
          <div className="xl:col-span-9">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      PO No
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchPoNo}
                        onChange={(e) => {
                          setSearchPoNo(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      Vendor
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchVendor}
                        onChange={(e) => {
                          setSearchVendor(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      Buyer
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchBuyer}
                        onChange={(e) => {
                          setSearchBuyer(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      Department
                      <select
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        value={deptFilter}
                        onChange={(e) => {
                          setDeptFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All</option>
                        <option value="Stores">Stores</option>
                        <option value="Operations">Operations</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Finance">Finance</option>
                        <option value="IT">IT</option>
                        <option value="Admin">Admin</option>
                        <option value="Procurement">Procurement</option>
                      </select>
                    </th>

                    <th className="px-4 py-3 text-left">
                      Priority
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-300">(from RFQ)</div>
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
                        <option value="Draft">Draft</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Issued to Vendor">Issued to Vendor</option>
                        <option value="Partially Received">Partially Received</option>
                        <option value="Fully Received">Fully Received</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </th>

                    <th className="px-4 py-3 text-left">
                      Created On
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          className="w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                          value={createdFrom}
                          onChange={(e) => {
                            setCreatedFrom(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                        <input
                          type="date"
                          className="w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                          value={createdTo}
                          onChange={(e) => {
                            setCreatedTo(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                    </th>

                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-left">Grand Total</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="dark:text-gray-200">
                  {paginatedData.map((po) => (
                    <tr
                      key={po.poNo}
                      className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-semibold">{po.poNo}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{po.vendorName}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{po.vendorCode}</div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                          RFQ: <span className="font-semibold">{po.rfqNo}</span> • PR:{" "}
                          <span className="font-semibold">{po.prNo}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">{po.buyer}</td>
                      <td className="px-4 py-3">{po.department}</td>

                      <td className="px-4 py-3">
                        <span className={priorityPill(po.priority)}>{po.priority}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={statusPill(po.status)}>{po.status}</span>

                        {po.status === "Pending Approval" && po.approvalRequired && (
                          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                            Level {po.currentApprovalLevel} •{" "}
                            {po.approvalRoute.find((s) => s.level === po.currentApprovalLevel)?.approverRole}
                          </div>
                        )}

                        {!po.approvalRequired && po.status !== "Draft" && (
                          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                            Approval: <span className="font-semibold">Not Required</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">{po.createdOn}</td>
                      <td className="px-4 py-3">{po.totalItems}</td>
                      <td className="px-4 py-3 font-semibold">{formatMoney(po.grandTotal, po.currency)}</td>

                      <td className="px-4 py-3 space-x-3">
                        <button
                          className="font-semibold text-blue-600 hover:underline"
                          onClick={() => alert(`View: open PO detail for ${po.poNo} (demo)`)}
                        >
                          View
                        </button>

                        {/* ✅ Draft actions ONLY in Drafts tab */}
                        {activeTab === "drafts" && po.status === "Draft" && (
                          <>
                            <button
                              className="font-semibold hover:underline"
                              style={{ color: FORTUNA_SECONDARY_BLUE }}
                              onClick={() => onEditDraft(po.poNo)}
                            >
                              Edit
                            </button>

                            <button
                              className="font-semibold hover:underline text-emerald-700"
                              onClick={() => onSendDraftForApproval(po.poNo)}
                            >
                              Send for Approval
                            </button>

                            {/* ✅ Delete ONLY in Drafts tab */}
                            <button
                              className="font-semibold text-rose-600 hover:underline"
                              onClick={() => onDeleteDraft(po.poNo)}
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {/* ✅ Approval modal like PR list (NOT in drafts tab) */}
                        {activeTab !== "drafts" && po.status === "Pending Approval" && po.approvalRequired && (
                          <button
                            className="font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                            onClick={() => openApproval(po.poNo)}
                          >
                            Approve / Reject
                          </button>
                        )}

                        {/* ✅ Issue after approval (NOT in drafts tab) */}
                        {activeTab !== "drafts" && po.status === "Approved" && (
                          <button
                            className="font-semibold hover:underline text-emerald-700"
                            onClick={() => issueToVendor(po.poNo)}
                          >
                            Issue to Vendor
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {paginatedData.length === 0 && (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300" colSpan={10}>
                        No POs found for current filters.
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
                    {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
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
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Quick Stats</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
              </div>

              <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                <StatRow label="Total POs" value={stats.total} />
                <StatRow label="Draft" value={stats.draft} badge="gray" />
                <StatRow label="Pending Approval" value={stats.pending} badge="amber" />
                <StatRow label="Approved" value={stats.approved} badge="green" />
                <StatRow label="Issued" value={stats.issued} badge="blue" />
                <StatRow label="Rejected" value={stats.rejected} badge="red" />
                <StatRow label="Closed" value={stats.closed} badge="purple" />

                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Total PO Value" value={stats.totalValue} money />
                <StatRow label="Avg Value / PO" value={stats.avgValue} money />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats + export.
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Drafts:</span> Drafts tab lo only Edit / Send for Approval / Delete.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal (PR list la same pattern) */}
      {approvalModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approve / Reject PO</h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  PO: <span className="font-semibold">{selectedPO.poNo}</span> • Level{" "}
                  <span className="font-semibold">{selectedPO.currentApprovalLevel}</span> •{" "}
                  <span className="font-semibold">
                    {selectedPO.approvalRoute.find((s) => s.level === selectedPO.currentApprovalLevel)?.approverRole}
                  </span>
                </p>
              </div>
              <button
                className="rounded-lg border px-3 py-1 text-sm dark:border-gray-800 dark:text-gray-200"
                onClick={() => setApprovalModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* PO Summary */}
              <div className="lg:col-span-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedPO.vendorName} ({selectedPO.vendorCode})
                </div>

                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm dark:text-gray-200">
                  <Info label="Buyer" value={selectedPO.buyer} />
                  <Info label="Department" value={selectedPO.department} />
                  <Info label="Created On" value={selectedPO.createdOn} />
                  <Info label="PO Date" value={selectedPO.poDate} />
                  <Info label="RFQ No" value={selectedPO.rfqNo} />
                  <Info label="PR No" value={selectedPO.prNo} />
                  <Info label="Warehouse" value={selectedPO.deliveryWarehouse} />
                  <Info label="Items" value={String(selectedPO.totalItems)} />
                  <Info label="Grand Total" value={formatMoney(selectedPO.grandTotal, selectedPO.currency)} />
                  <Info label="Priority" value={selectedPO.priority} />
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Remarks (optional)</label>
                  <textarea
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    className="mt-2 w-full min-h-[90px] resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    placeholder="Add approval/rejection remarks..."
                  />
                </div>
              </div>

              {/* Approval Route */}
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Approval Route</h4>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
                </div>

                <div className="mt-3 space-y-2 text-sm dark:text-gray-200">
                  {selectedPO.approvalRoute.map((s) => {
                    const isCurrent =
                      s.level === selectedPO.currentApprovalLevel && selectedPO.status === "Pending Approval";
                    const decision = s.decision ?? "Pending";

                    return (
                      <div
                        key={s.level}
                        className={classNames(
                          "rounded-lg border px-3 py-2",
                          isCurrent
                            ? "border-blue-300 bg-blue-50 dark:bg-white/5"
                            : "border-gray-200 dark:border-gray-800"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            Level {s.level} • {s.approverRole}
                          </span>
                          <span
                            className={classNames(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              decision === "Approved" && "bg-green-100 text-green-700",
                              decision === "Rejected" && "bg-red-100 text-red-600",
                              decision === "Pending" && "bg-amber-100 text-amber-800"
                            )}
                          >
                            {decision}
                          </span>
                        </div>

                        {s.decidedAt && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                            {s.decidedAt}
                            {s.remarks ? ` • ${s.remarks}` : ""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                    onClick={() => applyDecision("Rejected")}
                  >
                    Reject
                  </button>
                  <button
                    className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                    onClick={() => applyDecision("Approved")}
                  >
                    Approve
                  </button>
                </div>

                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> This is demo approval (state update). Next: connect API + role access.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small components */
function TabBtn({
  active,
  color,
  onClick,
  label,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  label: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95",
        active
          ? "text-white shadow"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
      )}
      style={active ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
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
  badge?: "green" | "red" | "amber" | "blue" | "gray" | "purple";
  money?: boolean;
}) {
  const showValue = money
    ? (() => {
        try {
          return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
            value
          );
        } catch {
          return `₹${Math.round(value)}`;
        }
      })()
    : String(value);

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span
        className={classNames(
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          badge === "green" && "bg-green-100 text-green-700",
          badge === "red" && "bg-red-100 text-red-600",
          badge === "amber" && "bg-amber-100 text-amber-800",
          badge === "blue" && "bg-blue-100 text-blue-700",
          badge === "purple" && "bg-purple-100 text-purple-700",
          badge === "gray" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
          !badge && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
        )}
      >
        {showValue}
      </span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-800">
      <div className="text-xs text-gray-500 dark:text-gray-300">{label}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}
