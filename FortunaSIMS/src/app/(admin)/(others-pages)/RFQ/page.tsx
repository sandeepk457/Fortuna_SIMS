"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** RFQ domain */
type RFQStatus =
  | "Draft"
  | "Created"
  | "Sent"
  | "Quotations Received"
  | "Under Comparison"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Closed";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Department = "Stores" | "Operations" | "Maintenance" | "Finance" | "IT" | "Admin" | "Procurement";

type ApprovalLevel = 1 | 2 | 3;
type ApprovalDecision = "Approved" | "Rejected";

type ApprovalStep = {
  level: ApprovalLevel;
  approverRole: string; // ex: "Procurement Head", "Finance"
  decision?: ApprovalDecision;
  decidedAt?: string; // yyyy-mm-dd
  remarks?: string;
};

type RFQVendor = {
  vendorId: string;
  vendorName: string;
  contactEmail?: string;
};

type RFQItem = {
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  spec?: string;
};

interface RFQ {
  rfqNo: string;
  prNo: string; // From Approved PR
  title: string;

  department: Department;
  buyer: string;

  createdOn: string; // yyyy-mm-dd
  dueDate: string; // vendor quote due date
  requiredBy?: string; // optional: delivery required by

  priority: Priority;
  status: RFQStatus;

  vendors: RFQVendor[];
  totalItems: number;

  /** quotation tracking */
  quotesReceived: number; // how many vendor quotes received
  lastUpdatedOn: string; // yyyy-mm-dd

  /** approval workflow (optional) */
  approvalRoute: ApprovalStep[];
  currentApprovalLevel: ApprovalLevel;

  /** Draft edit payload (optional) */
  draftPayload?: any;
}

/** Tabs */
type ListTab = "all" | "drafts" | "sent" | "pendingApproval";

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

export default function RFQListPage() {
  const router = useRouter();

  const [data, setData] = useState<RFQ[]>([
    {
      rfqNo: "RFQ-000201",
      prNo: "PR-000103",
      title: "Packaging materials (monthly)",
      department: "Stores",
      buyer: "Sandeep",
      createdOn: "2026-02-03",
      dueDate: "2026-02-06",
      requiredBy: "2026-02-10",
      priority: "High",
      status: "Draft",
      vendors: [
        { vendorId: "V-001", vendorName: "Sri Lakshmi Traders", contactEmail: "sales@sltraders.com" },
        { vendorId: "V-002", vendorName: "PackPro Supplies", contactEmail: "quotes@packpro.com" },
      ],
      totalItems: 8,
      quotesReceived: 0,
      lastUpdatedOn: "2026-02-03",
      currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Procurement Head" },
        { level: 2, approverRole: "Finance" },
        { level: 3, approverRole: "Management" },
      ],
      draftPayload: {
        rfqNo: "RFQ-000201",
        prNo: "PR-000103",
        vendors: ["V-001", "V-002"],
      },
    },
    {
      rfqNo: "RFQ-000202",
      prNo: "PR-000101",
      title: "Spare parts for conveyor maintenance",
      department: "Maintenance",
      buyer: "Aparna",
      createdOn: "2026-02-02",
      dueDate: "2026-02-05",
      requiredBy: "2026-02-10",
      priority: "Urgent",
      status: "Sent",
      vendors: [
        { vendorId: "V-010", vendorName: "MechZone Spares" },
        { vendorId: "V-011", vendorName: "Industrial Hub" },
        { vendorId: "V-012", vendorName: "Ravi Bearings" },
      ],
      totalItems: 6,
      quotesReceived: 1,
      lastUpdatedOn: "2026-02-03",
      currentApprovalLevel: 1,
      approvalRoute: [{ level: 1, approverRole: "Procurement Head" }],
    },
    {
      rfqNo: "RFQ-000203",
      prNo: "PR-000102",
      title: "New barcode scanners",
      department: "IT",
      buyer: "Sandeep",
      createdOn: "2026-02-01",
      dueDate: "2026-02-04",
      requiredBy: "2026-02-15",
      priority: "Medium",
      status: "Quotations Received",
      vendors: [
        { vendorId: "V-020", vendorName: "TechKart" },
        { vendorId: "V-021", vendorName: "Barcode World" },
      ],
      totalItems: 3,
      quotesReceived: 2,
      lastUpdatedOn: "2026-02-03",
      currentApprovalLevel: 1,
      approvalRoute: [{ level: 1, approverRole: "Procurement Head" }],
    },
    {
      rfqNo: "RFQ-000204",
      prNo: "PR-000105",
      title: "Forklift servicing contract",
      department: "Operations",
      buyer: "Kiran",
      createdOn: "2026-02-03",
      dueDate: "2026-02-07",
      requiredBy: "2026-02-18",
      priority: "High",
      status: "Pending Approval",
      vendors: [{ vendorId: "V-030", vendorName: "ForkCare Services" }],
      totalItems: 1,
      quotesReceived: 1,
      lastUpdatedOn: "2026-02-04",
      currentApprovalLevel: 2,
      approvalRoute: [
        { level: 1, approverRole: "Procurement Head", decision: "Approved", decidedAt: "2026-02-04", remarks: "OK" },
        { level: 2, approverRole: "Finance" },
        { level: 3, approverRole: "Management" },
      ],
    },
    {
      rfqNo: "RFQ-000205",
      prNo: "PR-000104",
      title: "Office supplies",
      department: "Admin",
      buyer: "Divya",
      createdOn: "2026-02-01",
      dueDate: "2026-02-03",
      requiredBy: "2026-02-20",
      priority: "Low",
      status: "Rejected",
      vendors: [{ vendorId: "V-040", vendorName: "Stationery Mart" }],
      totalItems: 9,
      quotesReceived: 0,
      lastUpdatedOn: "2026-02-02",
      currentApprovalLevel: 1,
      approvalRoute: [{ level: 1, approverRole: "Procurement Head", decision: "Rejected", decidedAt: "2026-02-02", remarks: "Not required now" }],
    },
  ]);

  /** Tabs */
  const [activeTab, setActiveTab] = useState<ListTab>("all");

  /** Filters */
  const [searchRFQNo, setSearchRFQNo] = useState("");
  const [searchPRNo, setSearchPRNo] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [searchBuyer, setSearchBuyer] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [statusFilter, setStatusFilter] = useState<RFQStatus | "">("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  /** Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /** Approval Modal */
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRFQNo, setSelectedRFQNo] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");

  /** Tab base filter */
  const tabFilteredBase = useMemo(() => {
    if (activeTab === "drafts") return data.filter((x) => x.status === "Draft");
    if (activeTab === "sent") return data.filter((x) => x.status === "Sent" || x.status === "Created");
    if (activeTab === "pendingApproval") return data.filter((x) => x.status === "Pending Approval");
    return data;
  }, [data, activeTab]);

  const filteredData = useMemo(() => {
    return tabFilteredBase.filter((rfq) => {
      const ok =
        rfq.rfqNo.toLowerCase().includes(searchRFQNo.toLowerCase()) &&
        rfq.prNo.toLowerCase().includes(searchPRNo.toLowerCase()) &&
        rfq.title.toLowerCase().includes(searchTitle.toLowerCase()) &&
        rfq.buyer.toLowerCase().includes(searchBuyer.toLowerCase()) &&
        (deptFilter ? rfq.department === deptFilter : true) &&
        (priorityFilter ? rfq.priority === priorityFilter : true) &&
        (statusFilter ? rfq.status === statusFilter : true) &&
        withinRange(rfq.createdOn, createdFrom || undefined, createdTo || undefined);

      return ok;
    });
  }, [
    tabFilteredBase,
    searchRFQNo,
    searchPRNo,
    searchTitle,
    searchBuyer,
    deptFilter,
    priorityFilter,
    statusFilter,
    createdFrom,
    createdTo,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const draft = filteredData.filter((x) => x.status === "Draft").length;
    const sent = filteredData.filter((x) => x.status === "Sent" || x.status === "Created").length;
    const quotes = filteredData.filter((x) => x.status === "Quotations Received" || x.status === "Under Comparison").length;
    const pending = filteredData.filter((x) => x.status === "Pending Approval").length;
    const approved = filteredData.filter((x) => x.status === "Approved").length;
    const rejected = filteredData.filter((x) => x.status === "Rejected").length;

    const totalVendors = filteredData.reduce((s, x) => s + (x.vendors?.length || 0), 0);
    const totalQuotes = filteredData.reduce((s, x) => s + (Number(x.quotesReceived) || 0), 0);

    return { total, draft, sent, quotes, pending, approved, rejected, totalVendors, totalQuotes };
  }, [filteredData]);

  const exportToCSV = () => {
    const header = [
      "RFQ No",
      "PR No",
      "Title",
      "Department",
      "Buyer",
      "Created On",
      "Due Date",
      "Priority",
      "Status",
      "Vendors",
      "Items",
      "Quotes Received",
    ];

    const rows = filteredData.map((rfq) =>
      [
        rfq.rfqNo,
        rfq.prNo,
        rfq.title,
        rfq.department,
        rfq.buyer,
        rfq.createdOn,
        rfq.dueDate,
        rfq.priority,
        rfq.status,
        rfq.vendors?.length ?? 0,
        rfq.totalItems,
        rfq.quotesReceived,
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rfq-list.csv";
    link.click();
  };

  const resetFilters = () => {
    setSearchRFQNo("");
    setSearchPRNo("");
    setSearchTitle("");
    setSearchBuyer("");
    setDeptFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  /** Status UI */
  const statusPill = (s: RFQStatus) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600",
      s === "Pending Approval" && "bg-amber-100 text-amber-800",
      (s === "Sent" || s === "Created") && "bg-blue-100 text-blue-700",
      (s === "Quotations Received" || s === "Under Comparison") && "bg-purple-100 text-purple-700",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      s === "Closed" && "bg-slate-100 text-slate-700"
    );

  const priorityPill = (p: Priority) =>
    classNames(
      "rounded-full px-2.5 py-1 text-xs font-semibold",
      p === "Low" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      p === "Medium" && "bg-blue-100 text-blue-700",
      p === "High" && "bg-amber-100 text-amber-800",
      p === "Urgent" && "bg-rose-100 text-rose-700"
    );

  /** Actions */
  const openApproval = (rfqNo: string) => {
    setSelectedRFQNo(rfqNo);
    setApprovalRemarks("");
    setApprovalModalOpen(true);
  };

  const getRFQByNo = (rfqNo: string) => data.find((x) => x.rfqNo === rfqNo);
  const selectedRFQ = selectedRFQNo ? getRFQByNo(selectedRFQNo) : undefined;

  const applyDecision = (decision: ApprovalDecision) => {
    if (!selectedRFQNo) return;

    setData((prev) =>
      prev.map((rfq) => {
        if (rfq.rfqNo !== selectedRFQNo) return rfq;
        if (rfq.status !== "Pending Approval") return rfq;

        const now = todayISO();
        const lvl = rfq.currentApprovalLevel;

        const nextRoute = rfq.approvalRoute.map((s) => {
          if (s.level !== lvl) return s;
          return {
            ...s,
            decision,
            decidedAt: now,
            remarks: approvalRemarks?.trim() ? approvalRemarks.trim() : undefined,
          };
        });

        if (decision === "Rejected") {
          return { ...rfq, status: "Rejected", approvalRoute: nextRoute };
        }

        const nextLevel = (lvl + 1) as ApprovalLevel;
        const hasNext = rfq.approvalRoute.some((s) => s.level === nextLevel);

        if (hasNext) {
          return {
            ...rfq,
            status: "Pending Approval",
            approvalRoute: nextRoute,
            currentApprovalLevel: nextLevel,
          };
        }

        return { ...rfq, status: "Approved", approvalRoute: nextRoute };
      })
    );

    setApprovalModalOpen(false);
  };

  const onEditDraft = (rfq: RFQ) => {
    if (rfq.status !== "Draft") return;
    // router.push(`/procurement/rfq/create?mode=edit&rfqNo=${rfq.rfqNo}`);
    alert(`Edit Draft RFQ: ${rfq.rfqNo} (demo)`);
  };

  const onSendRFQ = (rfqNo: string) => {
    const ok = confirm(`Send ${rfqNo} to selected vendors?`);
    if (!ok) return;

    setData((prev) =>
      prev.map((x) =>
        x.rfqNo === rfqNo
          ? {
              ...x,
              status: "Sent",
              lastUpdatedOn: todayISO(),
            }
          : x
      )
    );

    setActiveTab("all");
    setCurrentPage(1);
  };

  const onOpenComparison = (rfqNo: string) => {
    // router.push(`/procurement/rfq/comparison?rfqNo=${rfqNo}`);
    alert(`Open Vendor Quote Comparison for ${rfqNo} (demo)`);
  };

  const onView = (rfqNo: string) => {
    // router.push(`/procurement/rfq/view?rfqNo=${rfqNo}`);
    alert(`View RFQ Detail/Approval: ${rfqNo} (demo)`);
  };

  const draftsCount = useMemo(() => data.filter((x) => x.status === "Draft").length, [data]);

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="RFQ (Request for Quotation)" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">RFQ List</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Track RFQs, vendor responses, comparison, and approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => alert("Next: Navigate to Create RFQ (From Approved PR)")}
              className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
            >
              + Create RFQ (From PR)
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
            label="All RFQs"
            active={activeTab === "all"}
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            color={FORTUNA_PRIMARY_RED}
          />
          <TabBtn
            label={`Drafts`}
            badge={draftsCount}
            active={activeTab === "drafts"}
            onClick={() => {
              setActiveTab("drafts");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            color={FORTUNA_SECONDARY_BLUE}
          />
          <TabBtn
            label="Sent"
            active={activeTab === "sent"}
            onClick={() => {
              setActiveTab("sent");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            color={FORTUNA_SECONDARY_BLUE}
          />
          <TabBtn
            label="Pending Approval"
            active={activeTab === "pendingApproval"}
            onClick={() => {
              setActiveTab("pendingApproval");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            color={FORTUNA_SECONDARY_BLUE}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Table */}
          <div className="xl:col-span-9">
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      RFQ No
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchRFQNo}
                        onChange={(e) => {
                          setSearchRFQNo(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      PR No
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchPRNo}
                        onChange={(e) => {
                          setSearchPRNo(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </th>

                    <th className="px-4 py-3 text-left">
                      Title
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchTitle}
                        onChange={(e) => {
                          setSearchTitle(e.target.value);
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
                      Priority
                      <select
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        value={priorityFilter}
                        onChange={(e) => {
                          setPriorityFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
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
                        <option value="Created">Created</option>
                        <option value="Sent">Sent</option>
                        <option value="Quotations Received">Quotations Received</option>
                        <option value="Under Comparison">Under Comparison</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Closed">Closed</option>
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

                    <th className="px-4 py-3 text-left">Vendors</th>
                    <th className="px-4 py-3 text-left">Quotes</th>
                    <th className="px-4 py-3 text-left">Due</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="dark:text-gray-200">
                  {paginatedData.map((rfq) => (
                    <tr key={rfq.rfqNo} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold">{rfq.rfqNo}</td>

                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{rfq.prNo}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{rfq.title}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                          Items: <span className="font-semibold">{rfq.totalItems}</span> • Updated:{" "}
                          <span className="font-semibold">{rfq.lastUpdatedOn}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">{rfq.department}</td>
                      <td className="px-4 py-3">{rfq.buyer}</td>

                      <td className="px-4 py-3">
                        <span className={priorityPill(rfq.priority)}>{rfq.priority}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={statusPill(rfq.status)}>{rfq.status}</span>

                        {rfq.status === "Pending Approval" && (
                          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                            Level {rfq.currentApprovalLevel} •{" "}
                            {rfq.approvalRoute.find((s) => s.level === rfq.currentApprovalLevel)?.approverRole}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">{rfq.createdOn}</td>
                      <td className="px-4 py-3">{rfq.vendors?.length ?? 0}</td>
                      <td className="px-4 py-3">{rfq.quotesReceived}</td>
                      <td className="px-4 py-3 font-semibold">{rfq.dueDate}</td>

                      <td className="px-4 py-3 space-x-3">
                        <button className="font-semibold text-blue-600 hover:underline" onClick={() => onView(rfq.rfqNo)}>
                          View
                        </button>

                        {rfq.status === "Draft" && (
                          <>
                            <button
                              className="font-semibold hover:underline"
                              style={{ color: FORTUNA_SECONDARY_BLUE }}
                              onClick={() => onEditDraft(rfq)}
                            >
                              Edit
                            </button>

                            <button className="font-semibold hover:underline text-emerald-700" onClick={() => onSendRFQ(rfq.rfqNo)}>
                              Send RFQ
                            </button>
                          </>
                        )}

                        {(rfq.status === "Quotations Received" || rfq.status === "Under Comparison") && (
                          <button
                            className="font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                            onClick={() => onOpenComparison(rfq.rfqNo)}
                          >
                            Compare
                          </button>
                        )}

                        {rfq.status === "Pending Approval" && (
                          <button
                            className="font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                            onClick={() => openApproval(rfq.rfqNo)}
                          >
                            Approve / Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {paginatedData.length === 0 && (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300" colSpan={12}>
                        No RFQs found for current filters.
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
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
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

          {/* Stats */}
          <div className="xl:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Quick Stats</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
              </div>

              <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                <StatRow label="Total RFQs" value={stats.total} />
                <StatRow label="Draft" value={stats.draft} badge="gray" />
                <StatRow label="Sent" value={stats.sent} badge="blue" />
                <StatRow label="Quotes Stage" value={stats.quotes} badge="purple" />
                <StatRow label="Pending Approval" value={stats.pending} badge="amber" />
                <StatRow label="Approved" value={stats.approved} badge="green" />
                <StatRow label="Rejected" value={stats.rejected} badge="red" />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Total Vendors" value={stats.totalVendors} badge="blue" />
                <StatRow label="Total Quotes Received" value={stats.totalQuotes} badge="purple" />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats + export.
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Next:</span> “Create RFQ (From PR)” page  + Items mapping .
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModalOpen && selectedRFQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approve / Reject RFQ</h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  RFQ: <span className="font-semibold">{selectedRFQ.rfqNo}</span> • PR:{" "}
                  <span className="font-semibold">{selectedRFQ.prNo}</span> • Level{" "}
                  <span className="font-semibold">{selectedRFQ.currentApprovalLevel}</span> •{" "}
                  <span className="font-semibold">
                    {selectedRFQ.approvalRoute.find((s) => s.level === selectedRFQ.currentApprovalLevel)?.approverRole}
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
              <div className="lg:col-span-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedRFQ.title}</div>

                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm dark:text-gray-200">
                  <Info label="Department" value={selectedRFQ.department} />
                  <Info label="Buyer" value={selectedRFQ.buyer} />
                  <Info label="Created On" value={selectedRFQ.createdOn} />
                  <Info label="Due Date" value={selectedRFQ.dueDate} />
                  <Info label="Vendors" value={String(selectedRFQ.vendors?.length ?? 0)} />
                  <Info label="Quotes Received" value={String(selectedRFQ.quotesReceived)} />
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

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Approval Route</h4>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
                </div>

                <div className="mt-3 space-y-2 text-sm dark:text-gray-200">
                  {selectedRFQ.approvalRoute.map((s) => {
                    const isCurrent = s.level === selectedRFQ.currentApprovalLevel && selectedRFQ.status === "Pending Approval";
                    const decision = s.decision ?? "Pending";

                    return (
                      <div
                        key={s.level}
                        className={classNames(
                          "rounded-lg border px-3 py-2",
                          isCurrent ? "border-blue-300 bg-blue-50 dark:bg-white/5" : "border-gray-200 dark:border-gray-800"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Level {s.level} • {s.approverRole}</span>
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
                            {s.decidedAt}{s.remarks ? ` • ${s.remarks}` : ""}
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
                  <span className="font-semibold">Note:</span> Demo approval (local state). Next: API + role based access.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small UI components */
function TabBtn({
  label,
  badge,
  active,
  onClick,
  color,
}: {
  label: string;
  badge?: number;
  active: boolean;
  onClick: () => void;
  color: string;
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
      {typeof badge === "number" && (
        <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: number;
  badge?: "green" | "red" | "amber" | "blue" | "gray" | "purple";
}) {
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
        {String(value)}
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
