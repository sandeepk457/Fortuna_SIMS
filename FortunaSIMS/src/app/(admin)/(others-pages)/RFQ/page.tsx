"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** RFQ Domain */
type RFQStatus =
  | "Draft"
  | "Submitted"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Closed";

type Priority = "Low" | "Medium" | "High" | "Urgent";
type Department = "Stores" | "Operations" | "Maintenance" | "Finance" | "IT" | "Admin" | "Procurement";
type Currency = "INR" | "USD" | "EUR";

type ApprovalLevel = 1 | 2 | 3;
type ApprovalDecision = "Approved" | "Rejected";

type ApprovalStep = {
  level: ApprovalLevel;
  approverRole: string; // ex: "Department Head", "Finance", "Procurement"
  decision?: ApprovalDecision;
  decidedAt?: string; // ISO date
  remarks?: string;
};

type RFQItemLine = {
  rfq_item_id: string;
  item_code: string;
  item_description: string;
  uom: string;
  qty: number;
  target_price?: number;
};

type RFQVendorLine = {
  vendor_id: string;
  vendor_name: string;
  vendor_code: string;
  email?: string;
  phone?: string;
  invited: boolean;
  responded: boolean;
  quoted_total?: number;
};

interface RFQRecord {
  rfqNo: string;
  title: string;
  department: Department;
  requestor: string;
  createdOn: string; // yyyy-mm-dd
  requiredBy: string; // yyyy-mm-dd
  priority: Priority;
  status: RFQStatus;

  currency: Currency;
  totalItems: number;
  estimatedValue: number;

  prNo: string; // source
  approvalRoute: ApprovalStep[];
  currentApprovalLevel: ApprovalLevel;

  vendors: RFQVendorLine[];
  items: RFQItemLine[];

  /** Optional draft handoff payload */
  draftPayload?: any;
}

/** Tabs */
type ListTab = "all" | "drafts";

/** localStorage key for edit draft handoff (optional) */
const LS_EDIT_DRAFT = "FORTUNA_RFQ_EDIT_DRAFT";

/** helpers */
function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}
function formatMoney(n: number, currency: Currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
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

  const [data, setData] = useState<RFQRecord[]>([
    {
      rfqNo: "RFQ-2026-000101",
      title: "Packaging materials (monthly)",
      department: "Stores",
      requestor: "Ravi",
      createdOn: "2026-02-01",
      requiredBy: "2026-02-07",
      priority: "High",
      status: "Pending Approval",
      currency: "INR",
      totalItems: 4,
      estimatedValue: 68080,
      prNo: "PR-000103",
      currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Department Head" },
        { level: 2, approverRole: "Finance" },
        { level: 3, approverRole: "Procurement" },
      ],
      vendors: [
        { vendor_id: "V1", vendor_name: "Sri Lakshmi Suppliers", vendor_code: "V-001", invited: true, responded: false },
        { vendor_id: "V2", vendor_name: "Aparna Packaging", vendor_code: "V-002", invited: true, responded: true, quoted_total: 67500 },
      ],
      items: [
        { rfq_item_id: "I1", item_code: "PKG-001", item_description: "Carton boxes", uom: "Nos", qty: 1000, target_price: 45 },
        { rfq_item_id: "I2", item_code: "PKG-002", item_description: "Bubble wrap roll", uom: "Nos", qty: 50, target_price: 350 },
        { rfq_item_id: "I3", item_code: "PKG-003", item_description: "Packing tape", uom: "Nos", qty: 200, target_price: 65 },
        { rfq_item_id: "I4", item_code: "PKG-004", item_description: "Stretch film", uom: "Nos", qty: 40, target_price: 420 },
      ],
    },
    {
      rfqNo: "RFQ-2026-000102",
      title: "Conveyor spare parts",
      department: "Maintenance",
      requestor: "Sandeep",
      createdOn: "2026-02-02",
      requiredBy: "2026-02-10",
      priority: "Urgent",
      status: "Approved",
      currency: "INR",
      totalItems: 6,
      estimatedValue: 145000,
      prNo: "PR-000101",
      currentApprovalLevel: 3,
      approvalRoute: [
        { level: 1, approverRole: "Department Head", decision: "Approved", decidedAt: "2026-02-02", remarks: "OK" },
        { level: 2, approverRole: "Finance", decision: "Approved", decidedAt: "2026-02-03", remarks: "Budget ok" },
        { level: 3, approverRole: "Procurement", decision: "Approved", decidedAt: "2026-02-03", remarks: "Proceed PO" },
      ],
      vendors: [
        { vendor_id: "V1", vendor_name: "Sri Lakshmi Suppliers", vendor_code: "V-001", invited: true, responded: true, quoted_total: 146500 },
        { vendor_id: "V3", vendor_name: "Prime 3PL", vendor_code: "V-010", invited: true, responded: true, quoted_total: 145000 },
      ],
      items: [
        { rfq_item_id: "I1", item_code: "SP-101", item_description: "Bearing set", uom: "Nos", qty: 10, target_price: 3500 },
        { rfq_item_id: "I2", item_code: "SP-102", item_description: "Belt roller", uom: "Nos", qty: 6, target_price: 6200 },
        { rfq_item_id: "I3", item_code: "SP-103", item_description: "Chain lubricant", uom: "Ltr", qty: 15, target_price: 650 },
        { rfq_item_id: "I4", item_code: "SP-104", item_description: "Sensor", uom: "Nos", qty: 3, target_price: 4500 },
        { rfq_item_id: "I5", item_code: "SP-105", item_description: "Fasteners", uom: "Nos", qty: 300, target_price: 12 },
        { rfq_item_id: "I6", item_code: "SP-106", item_description: "Alignment kit", uom: "Set", qty: 1, target_price: 15000 },
      ],
    },
    {
      rfqNo: "RFQ-2026-000103",
      title: "New barcode scanners",
      department: "IT",
      requestor: "Aparna",
      createdOn: "2026-02-03",
      requiredBy: "2026-02-15",
      priority: "Medium",
      status: "Submitted",
      currency: "INR",
      totalItems: 3,
      estimatedValue: 78000,
      prNo: "PR-000102",
      currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Department Head" },
        { level: 2, approverRole: "Finance" },
        { level: 3, approverRole: "Procurement" },
      ],
      vendors: [
        { vendor_id: "V4", vendor_name: "TechZone India", vendor_code: "V-021", invited: true, responded: false },
        { vendor_id: "V5", vendor_name: "ScanPro Systems", vendor_code: "V-022", invited: true, responded: false },
      ],
      items: [
        { rfq_item_id: "I1", item_code: "IT-201", item_description: "Barcode scanner handheld", uom: "Nos", qty: 3, target_price: 26000 },
      ],
    },

    /** ✅ Draft sample row */
    {
      rfqNo: "RFQ-2026-000104",
      title: "Draft: Laptop procurement for new joiners",
      department: "IT",
      requestor: "Sandeep",
      createdOn: "2026-02-03",
      requiredBy: "2026-02-22",
      priority: "Medium",
      status: "Draft",
      currency: "INR",
      totalItems: 2,
      estimatedValue: 120000,
      prNo: "PR-000106",
      currentApprovalLevel: 1,
      approvalRoute: [
        { level: 1, approverRole: "Department Head" },
        { level: 2, approverRole: "Finance" },
        { level: 3, approverRole: "Procurement" },
      ],
      vendors: [
        { vendor_id: "V6", vendor_name: "LaptopWorld", vendor_code: "V-030", invited: false, responded: false },
      ],
      items: [
        { rfq_item_id: "I1", item_code: "LT-001", item_description: "Laptop i5 16GB", uom: "Nos", qty: 2, target_price: 60000 },
      ],
      draftPayload: {
        rfqNo: "RFQ-2026-000104",
        department: "IT",
        priority: "Medium",
        title: "Laptop procurement for new joiners",
        vendors: [{ vendor_name: "LaptopWorld", vendor_code: "V-030" }],
        items: [{ item_code: "LT-001", qty: 2, price: 60000 }],
      },
    },
  ]);

  /** Tabs state */
  const [activeTab, setActiveTab] = useState<ListTab>("all");

  /** Filters */
  const [searchRfqNo, setSearchRfqNo] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [searchRequestor, setSearchRequestor] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [statusFilter, setStatusFilter] = useState<RFQStatus | "">("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  /** Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /** Approval modal */
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRfqNo, setSelectedRfqNo] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");

  /** Tab base filter */
  const tabFilteredBase = useMemo(() => {
    if (activeTab === "drafts") return data.filter((x) => x.status === "Draft");
    return data;
  }, [data, activeTab]);

  /** Filtered data */
  const filteredData = useMemo(() => {
    return tabFilteredBase.filter((rfq) => {
      const ok =
        rfq.rfqNo.toLowerCase().includes(searchRfqNo.toLowerCase()) &&
        rfq.title.toLowerCase().includes(searchTitle.toLowerCase()) &&
        rfq.requestor.toLowerCase().includes(searchRequestor.toLowerCase()) &&
        (deptFilter ? rfq.department === deptFilter : true) &&
        (priorityFilter ? rfq.priority === priorityFilter : true) &&
        (statusFilter ? rfq.status === statusFilter : true) &&
        withinRange(rfq.createdOn, createdFrom || undefined, createdTo || undefined);
      return ok;
    });
  }, [
    tabFilteredBase,
    searchRfqNo,
    searchTitle,
    searchRequestor,
    deptFilter,
    priorityFilter,
    statusFilter,
    createdFrom,
    createdTo,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** Stats */
  const stats = useMemo(() => {
    const total = filteredData.length;
    const draft = filteredData.filter((x) => x.status === "Draft").length;
    const submitted = filteredData.filter((x) => x.status === "Submitted").length;
    const pending = filteredData.filter((x) => x.status === "Pending Approval").length;
    const approved = filteredData.filter((x) => x.status === "Approved").length;
    const rejected = filteredData.filter((x) => x.status === "Rejected").length;

    const totalValue = filteredData.reduce((s, x) => s + (Number(x.estimatedValue) || 0), 0);
    const avgValue = total ? Math.round(totalValue / total) : 0;

    return { total, draft, submitted, pending, approved, rejected, totalValue, avgValue };
  }, [filteredData]);

  /** CSV Export */
  const exportToCSV = () => {
    const header = [
      "RFQ No",
      "Title",
      "Department",
      "Requestor",
      "Created On",
      "Required By",
      "PR No",
      "Priority",
      "Status",
      "Vendors",
      "Items",
      "Currency",
      "Estimated Value",
    ];

    const rows = filteredData.map((rfq) =>
      [
        rfq.rfqNo,
        rfq.title,
        rfq.department,
        rfq.requestor,
        rfq.createdOn,
        rfq.requiredBy,
        rfq.prNo,
        rfq.priority,
        rfq.status,
        rfq.vendors.length,
        rfq.items.length,
        rfq.currency,
        rfq.estimatedValue,
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
    setSearchRfqNo("");
    setSearchTitle("");
    setSearchRequestor("");
    setDeptFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  /** Approval actions */
  const openApproval = (rfqNo: string) => {
    setSelectedRfqNo(rfqNo);
    setApprovalRemarks("");
    setApprovalModalOpen(true);
  };

  const applyDecision = (decision: ApprovalDecision) => {
    if (!selectedRfqNo) return;

    setData((prev) =>
      prev.map((rfq) => {
        if (rfq.rfqNo !== selectedRfqNo) return rfq;

        // Only pending/submitted actionable (demo)
        if (!(rfq.status === "Pending Approval" || rfq.status === "Submitted")) return rfq;

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

  /** ✅ Draft actions */
  const onEditDraft = (rfq: RFQRecord) => {
    if (rfq.status !== "Draft") return;

    // optional: store payload for create page prefill
    localStorage.setItem(
      LS_EDIT_DRAFT,
      JSON.stringify({
        rfqNo: rfq.rfqNo,
        payload: rfq.draftPayload ?? rfq,
      })
    );

    // router.push("/procurement/rfq/new?mode=edit");
    alert(`Edit Draft RFQ: navigate to RFQ form with prefill for ${rfq.rfqNo} (demo)`);
  };

  const onSendDraftForApproval = (rfqNo: string) => {
    const ok = confirm(`Send ${rfqNo} for approval?`);
    if (!ok) return;

    setData((prev) =>
      prev.map((rfq) => {
        if (rfq.rfqNo !== rfqNo) return rfq;
        if (rfq.status !== "Draft") return rfq;

        // Draft -> Submitted (then approval flow can pick it up)
        return {
          ...rfq,
          status: "Submitted",
          currentApprovalLevel: 1,
        };
      })
    );

    setActiveTab("all");
    setCurrentPage(1);
  };

  /** ✅ FIX REQUIRED: Delete Draft (ONLY in Drafts tab) */
  const onDeleteDraft = (rfqNo: string) => {
    const ok = confirm(`Delete draft ${rfqNo}? This cannot be undone.`);
    if (!ok) return;
    setData((prev) => prev.filter((x) => x.rfqNo !== rfqNo));
  };

  /** Pills */
  const statusPill = (s: RFQStatus) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600",
      s === "Pending Approval" && "bg-amber-100 text-amber-800",
      s === "Submitted" && "bg-blue-100 text-blue-700",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      s === "Closed" && "bg-purple-100 text-purple-700"
    );

  const priorityPill = (p: Priority) =>
    classNames(
      "rounded-full px-2.5 py-1 text-xs font-semibold",
      p === "Low" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      p === "Medium" && "bg-blue-100 text-blue-700",
      p === "High" && "bg-amber-100 text-amber-800",
      p === "Urgent" && "bg-rose-100 text-rose-700"
    );

  const getRFQByNo = (rfqNo: string) => data.find((x) => x.rfqNo === rfqNo);
  const selectedRFQ = selectedRfqNo ? getRFQByNo(selectedRfqNo) : undefined;

  /** Drafts count for badge */
  const draftsCount = useMemo(() => data.filter((x) => x.status === "Draft").length, [data]);

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="RFQ Management" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">RFQ List</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Track RFQs, vendor invitations, and approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
  onClick={() => router.push("/RFQForm")}
  className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
>
  + Create RFQ
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
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={classNames(
              "rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95",
              activeTab === "all"
                ? "text-white shadow"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
            )}
            style={activeTab === "all" ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
          >
            All RFQs
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("drafts");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            className={classNames(
              "rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95",
              activeTab === "drafts"
                ? "text-white shadow"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
            )}
            style={activeTab === "drafts" ? { backgroundColor: FORTUNA_SECONDARY_BLUE } : undefined}
          >
            Drafts
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
              {draftsCount}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Table Panel */}
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
                        value={searchRfqNo}
                        onChange={(e) => {
                          setSearchRfqNo(e.target.value);
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
                      Requestor
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchRequestor}
                        onChange={(e) => {
                          setSearchRequestor(e.target.value);
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
                        <option value="Submitted">Submitted</option>
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
                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-left">Est. Value</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="dark:text-gray-200">
                  {paginatedData.map((rfq) => (
                    <tr
                      key={rfq.rfqNo}
                      className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-semibold">{rfq.rfqNo}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{rfq.title}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                          Required By: <span className="font-semibold">{rfq.requiredBy}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                          PR: <span className="font-semibold">{rfq.prNo}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">{rfq.department}</td>
                      <td className="px-4 py-3">{rfq.requestor}</td>

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
                      <td className="px-4 py-3">{rfq.vendors.length}</td>
                      <td className="px-4 py-3">{rfq.totalItems}</td>
                      <td className="px-4 py-3 font-semibold">{formatMoney(rfq.estimatedValue, rfq.currency)}</td>

                      <td className="px-4 py-3 space-x-3">
                        <button
                          className="font-semibold text-blue-600 hover:underline"
                          onClick={() => alert(`View RFQ details for ${rfq.rfqNo} (demo)`)}
                        >
                          View
                        </button>

                        {/* ✅ EXISTING APPROVAL FLOW stays SAME */}
                        {(rfq.status === "Submitted" || rfq.status === "Pending Approval") && (
                          <button
                            className="font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                            onClick={() => openApproval(rfq.rfqNo)}
                          >
                            Approve / Reject
                          </button>
                        )}

                        {/* ✅ Draft-specific actions: Edit / Send / Delete ONLY in Drafts tab */}
                        {activeTab === "drafts" && rfq.status === "Draft" && (
                          <>
                            <button
                              className="font-semibold hover:underline"
                              style={{ color: FORTUNA_SECONDARY_BLUE }}
                              onClick={() => onEditDraft(rfq)}
                            >
                              Edit
                            </button>

                            <button
                              className="font-semibold hover:underline text-emerald-700"
                              onClick={() => onSendDraftForApproval(rfq.rfqNo)}
                            >
                              Send for Approval
                            </button>

                            {/* ✅ FIX: Delete ONLY in Drafts tab */}
                            <button
                              className="font-semibold text-rose-600 hover:underline"
                              onClick={() => onDeleteDraft(rfq.rfqNo)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {paginatedData.length === 0 && (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300" colSpan={11}>
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
                <StatRow label="Total RFQs" value={stats.total} />
                <StatRow label="Draft" value={stats.draft} badge="gray" />
                <StatRow label="Submitted" value={stats.submitted} badge="blue" />
                <StatRow label="Pending Approval" value={stats.pending} badge="amber" />
                <StatRow label="Approved" value={stats.approved} badge="green" />
                <StatRow label="Rejected" value={stats.rejected} badge="red" />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Total Est. Value" value={stats.totalValue} money />
                <StatRow label="Avg Value / RFQ" value={stats.avgValue} money />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats + export.
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Drafts:</span> Drafts tab lo Edit → Send for Approval → Delete.
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
                  RFQ: <span className="font-semibold">{selectedRFQ.rfqNo}</span> • Level{" "}
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
                  <Info label="Requestor" value={selectedRFQ.requestor} />
                  <Info label="Created On" value={selectedRFQ.createdOn} />
                  <Info label="Required By" value={selectedRFQ.requiredBy} />
                  <Info label="PR No" value={selectedRFQ.prNo} />
                  <Info label="Vendors" value={String(selectedRFQ.vendors.length)} />
                  <Info label="Items" value={String(selectedRFQ.totalItems)} />
                  <Info label="Est. Value" value={formatMoney(selectedRFQ.estimatedValue, selectedRFQ.currency)} />
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
                    const isCurrent =
                      s.level === selectedRFQ.currentApprovalLevel &&
                      (selectedRFQ.status === "Submitted" || selectedRFQ.status === "Pending Approval");
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
function StatRow({
  label,
  value,
  badge,
  money,
}: {
  label: string;
  value: number;
  badge?: "green" | "red" | "amber" | "blue" | "gray";
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
