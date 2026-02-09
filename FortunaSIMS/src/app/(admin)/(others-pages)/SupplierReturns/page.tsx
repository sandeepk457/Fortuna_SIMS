"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";


/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Supplier Return */
type ReturnStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Issued to Vendor"
  | "Closed";

type ReturnType = "Excess Return" | "QC Rejected" | "Damage Return" | "Other";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Department = "Stores" | "Operations" | "Maintenance" | "Finance" | "IT" | "Admin" | "Procurement";

type ApprovalDecision = "Approved" | "Rejected";

type ReturnSource = "GRN" | "PO" | "Stock";

interface SupplierReturn {
  srNo: string; // SR-YYYY-SEQ
  createdOn: string; // yyyy-mm-dd
  department: Department;
  createdBy: string;
  vendorName: string;
  vendorId: string;
  sourceType: ReturnSource;
  sourceRef: string; // GRN/PO ref
  returnType: ReturnType;
  priority: Priority;
  status: ReturnStatus;

  totalItems: number;
  totalQty: number;
  estimatedValue: number;

  approvalRequired: boolean;
  currentApproverRole?: string; // "Stores Head", "Finance", etc.
  lastRemarks?: string;

  draftPayload?: any; // optional for edit
}

/** Tabs */
type ListTab = "all" | "drafts" | "pending" | "issued" | "closed";

/** Local helpers */
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

export default function SupplierReturnsListPage() {
  const router = useRouter();

  const [data, setData] = useState<SupplierReturn[]>([
    {
      srNo: "SR-2026-0001",
      createdOn: "2026-02-03",
      department: "Stores",
      createdBy: "Sandeep",
      vendorName: "Sri Lakshmi Suppliers",
      vendorId: "V-001",
      sourceType: "GRN",
      sourceRef: "GRN-2026-0042",
      returnType: "Excess Return",
      priority: "High",
      status: "Draft",
      totalItems: 2,
      totalQty: 20,
      estimatedValue: 18000,
      approvalRequired: true,
      currentApproverRole: "Stores Head",
      draftPayload: { srNo: "SR-2026-0001", note: "Excess qty moved to quarantine." },
    },
    {
      srNo: "SR-2026-0002",
      createdOn: "2026-02-02",
      department: "Maintenance",
      createdBy: "Aparna",
      vendorName: "Aparna Packaging",
      vendorId: "V-002",
      sourceType: "PO",
      sourceRef: "PO-2026-0109",
      returnType: "QC Rejected",
      priority: "Urgent",
      status: "Pending Approval",
      totalItems: 1,
      totalQty: 5,
      estimatedValue: 12500,
      approvalRequired: true,
      currentApproverRole: "Finance",
      lastRemarks: "QC failed – return required",
    },
    {
      srNo: "SR-2026-0003",
      createdOn: "2026-02-01",
      department: "Stores",
      createdBy: "Ravi",
      vendorName: "FastLine Transport",
      vendorId: "V-003",
      sourceType: "GRN",
      sourceRef: "GRN-2026-0039",
      returnType: "Damage Return",
      priority: "Medium",
      status: "Approved",
      totalItems: 3,
      totalQty: 12,
      estimatedValue: 22000,
      approvalRequired: true,
      currentApproverRole: "Procurement",
    },
    {
      srNo: "SR-2026-0004",
      createdOn: "2026-01-30",
      department: "Operations",
      createdBy: "Kiran",
      vendorName: "Prime 3PL",
      vendorId: "V-004",
      sourceType: "Stock",
      sourceRef: "STOCK-ADJ-0011",
      returnType: "Other",
      priority: "Low",
      status: "Issued to Vendor",
      totalItems: 1,
      totalQty: 2,
      estimatedValue: 6000,
      approvalRequired: false,
    },
    {
      srNo: "SR-2026-0005",
      createdOn: "2026-01-28",
      department: "Stores",
      createdBy: "Divya",
      vendorName: "Sri Lakshmi Suppliers",
      vendorId: "V-001",
      sourceType: "GRN",
      sourceRef: "GRN-2026-0031",
      returnType: "QC Rejected",
      priority: "High",
      status: "Closed",
      totalItems: 2,
      totalQty: 8,
      estimatedValue: 14000,
      approvalRequired: true,
    },
  ]);

  /** Tabs */
  const [activeTab, setActiveTab] = useState<ListTab>("all");

  /** Filters */
  const [searchSrNo, setSearchSrNo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchCreatedBy, setSearchCreatedBy] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<ReturnSource | "">("");
  const [createdFrom, setCreatedFrom] = useState<string>("");
  const [createdTo, setCreatedTo] = useState<string>("");

  /** Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /** Approval modal */
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedSrNo, setSelectedSrNo] = useState<string>("");
  const [approvalRemarks, setApprovalRemarks] = useState("");

  const tabFilteredBase = useMemo(() => {
    if (activeTab === "drafts") return data.filter((x) => x.status === "Draft");
    if (activeTab === "pending") return data.filter((x) => x.status === "Pending Approval");
    if (activeTab === "issued") return data.filter((x) => x.status === "Issued to Vendor");
    if (activeTab === "closed") return data.filter((x) => x.status === "Closed");
    return data;
  }, [data, activeTab]);

  const filteredData = useMemo(() => {
    return tabFilteredBase.filter((sr) => {
      const ok =
        sr.srNo.toLowerCase().includes(searchSrNo.toLowerCase()) &&
        sr.vendorName.toLowerCase().includes(searchVendor.toLowerCase()) &&
        sr.createdBy.toLowerCase().includes(searchCreatedBy.toLowerCase()) &&
        (deptFilter ? sr.department === deptFilter : true) &&
        (priorityFilter ? sr.priority === priorityFilter : true) &&
        (statusFilter ? sr.status === statusFilter : true) &&
        (sourceFilter ? sr.sourceType === sourceFilter : true) &&
        withinRange(sr.createdOn, createdFrom || undefined, createdTo || undefined);

      return ok;
    });
  }, [
    tabFilteredBase,
    searchSrNo,
    searchVendor,
    searchCreatedBy,
    deptFilter,
    priorityFilter,
    statusFilter,
    sourceFilter,
    createdFrom,
    createdTo,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    const base = filteredData;
    const total = base.length;
    const draft = base.filter((x) => x.status === "Draft").length;
    const pending = base.filter((x) => x.status === "Pending Approval").length;
    const approved = base.filter((x) => x.status === "Approved").length;
    const rejected = base.filter((x) => x.status === "Rejected").length;
    const issued = base.filter((x) => x.status === "Issued to Vendor").length;
    const closed = base.filter((x) => x.status === "Closed").length;

    const totalValue = base.reduce((s, x) => s + (Number(x.estimatedValue) || 0), 0);
    const totalQty = base.reduce((s, x) => s + (Number(x.totalQty) || 0), 0);

    // unique vendors count
    const vendorCount = new Set(base.map((x) => x.vendorId)).size;

    return { total, draft, pending, approved, rejected, issued, closed, totalValue, totalQty, vendorCount };
  }, [filteredData]);

  const resetFilters = () => {
    setSearchSrNo("");
    setSearchVendor("");
    setSearchCreatedBy("");
    setDeptFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setSourceFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  /** Export CSV */
  const exportToCSV = () => {
    const header = [
      "SR No",
      "Created On",
      "Department",
      "Created By",
      "Vendor",
      "Vendor ID",
      "Source Type",
      "Source Ref",
      "Return Type",
      "Priority",
      "Status",
      "Items",
      "Total Qty",
      "Estimated Value",
    ];

    const rows = filteredData.map((sr) =>
      [
        sr.srNo,
        sr.createdOn,
        sr.department,
        sr.createdBy,
        sr.vendorName,
        sr.vendorId,
        sr.sourceType,
        sr.sourceRef,
        sr.returnType,
        sr.priority,
        sr.status,
        sr.totalItems,
        sr.totalQty,
        sr.estimatedValue,
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "supplier-returns-list.csv";
    link.click();
  };

  /** Actions */
  const onCreateReturn = () => {
    // ✅ set your real route
    // router.push("/procurement/returns/supplier/new");
    alert("Navigate to Supplier Return Create page (demo). Set router.push to your route.");
  };

  const onView = (srNo: string) => alert(`View Supplier Return: ${srNo} (demo)`);

  const onEditDraft = (sr: SupplierReturn) => {
    if (sr.status !== "Draft") return;
    // localStorage handoff optional
    localStorage.setItem(
      "FORTUNA_SR_EDIT_DRAFT",
      JSON.stringify({ srNo: sr.srNo, payload: sr.draftPayload ?? sr })
    );
    alert(`Edit Draft: ${sr.srNo} (demo). Navigate to form with prefill.`);
  };

  const onDeleteDraft = (srNo: string) => {
    const ok = confirm(`Delete draft ${srNo}?`);
    if (!ok) return;
    setData((prev) => prev.filter((x) => x.srNo !== srNo));
  };

  const onSendForApproval = (srNo: string) => {
    const ok = confirm(`Send ${srNo} for approval?`);
    if (!ok) return;

    setData((prev) =>
      prev.map((x) =>
        x.srNo === srNo && x.status === "Draft"
          ? {
              ...x,
              status: "Pending Approval",
              approvalRequired: true,
              currentApproverRole: x.currentApproverRole ?? "Stores Head",
              lastRemarks: "Sent for approval",
            }
          : x
      )
    );
    setActiveTab("all");
    setCurrentPage(1);
  };

  const openApproval = (srNo: string) => {
    setSelectedSrNo(srNo);
    setApprovalRemarks("");
    setApprovalModalOpen(true);
  };

  const applyDecision = (decision: ApprovalDecision) => {
    if (!selectedSrNo) return;

    setData((prev) =>
      prev.map((x) => {
        if (x.srNo !== selectedSrNo) return x;
        if (x.status !== "Pending Approval") return x;

        if (decision === "Rejected") {
          return {
            ...x,
            status: "Rejected",
            lastRemarks: approvalRemarks?.trim() ? approvalRemarks.trim() : "Rejected",
          };
        }

        return {
          ...x,
          status: "Approved",
          lastRemarks: approvalRemarks?.trim() ? approvalRemarks.trim() : "Approved",
        };
      })
    );

    setApprovalModalOpen(false);
  };

  const onIssueToVendor = (srNo: string) => {
    const ok = confirm(`Issue ${srNo} to vendor? (This would trigger email in Phase-2)`);
    if (!ok) return;

    setData((prev) =>
      prev.map((x) =>
        x.srNo === srNo && (x.status === "Approved" || x.status === "Rejected" ? false : true)
          ? x
          : x.srNo === srNo && x.status === "Approved"
          ? { ...x, status: "Issued to Vendor", lastRemarks: "Issued to Vendor", approvalRequired: false }
          : x
      )
    );
  };

  /** UI pills */
  const statusPill = (s: ReturnStatus) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600",
      s === "Pending Approval" && "bg-amber-100 text-amber-800",
      s === "Issued to Vendor" && "bg-blue-100 text-blue-700",
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

  const selectedSR = selectedSrNo ? data.find((x) => x.srNo === selectedSrNo) : undefined;

  const draftsCount = useMemo(() => data.filter((x) => x.status === "Draft").length, [data]);

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Supplier Returns" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Supplier Returns List</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Track returns to vendors (from GRN/PO/Stock), approvals, and issue status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              
                            onClick={() => router.push("/SupplierreturnForm")}

              className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
            >
              + Create Supplier Return
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
            label="All Returns"
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            color={FORTUNA_PRIMARY_RED}
          />
          <TabBtn
            active={activeTab === "drafts"}
            label="Drafts"
            badge={draftsCount}
            onClick={() => {
              setActiveTab("drafts");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            color={FORTUNA_SECONDARY_BLUE}
          />
          <TabBtn
            active={activeTab === "pending"}
            label="Pending Approval"
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            color={FORTUNA_PRIMARY_RED}
          />
          <TabBtn
            active={activeTab === "issued"}
            label="Issued"
            onClick={() => {
              setActiveTab("issued");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            color={FORTUNA_SECONDARY_BLUE}
          />
          <TabBtn
            active={activeTab === "closed"}
            label="Closed"
            onClick={() => {
              setActiveTab("closed");
              setCurrentPage(1);
              setStatusFilter("");
            }}
            color={FORTUNA_PRIMARY_RED}
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
                      SR No
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchSrNo}
                        onChange={(e) => {
                          setSearchSrNo(e.target.value);
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
                      Created By
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchCreatedBy}
                        onChange={(e) => {
                          setSearchCreatedBy(e.target.value);
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
                      Source
                      <select
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        value={sourceFilter}
                        onChange={(e) => {
                          setSourceFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All</option>
                        <option value="GRN">GRN</option>
                        <option value="PO">PO</option>
                        <option value="Stock">Stock</option>
                      </select>
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
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Issued to Vendor">Issued to Vendor</option>
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

                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left">Est. Value</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="dark:text-gray-200">
                  {paginatedData.map((sr) => (
                    <tr
                      key={sr.srNo}
                      className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-semibold">{sr.srNo}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{sr.vendorName}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                          {sr.vendorId} • {sr.sourceType}: <span className="font-semibold">{sr.sourceRef}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">{sr.createdBy}</td>
                      <td className="px-4 py-3">{sr.department}</td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                          {sr.sourceType}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={priorityPill(sr.priority)}>{sr.priority}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={statusPill(sr.status)}>{sr.status}</span>
                        {sr.status === "Pending Approval" && (
                          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                            Approver: <span className="font-semibold">{sr.currentApproverRole ?? "—"}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">{sr.createdOn}</td>
                      <td className="px-4 py-3">{sr.totalItems}</td>
                      <td className="px-4 py-3">{sr.totalQty}</td>
                      <td className="px-4 py-3 font-semibold">{formatINR(sr.estimatedValue)}</td>

                      <td className="px-4 py-3 space-x-3">
                        <button className="font-semibold text-blue-600 hover:underline" onClick={() => onView(sr.srNo)}>
                          View
                        </button>

                        {/* Approval flow (demo) */}
                        {sr.status === "Pending Approval" && (
                          <button
                            className="font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                            onClick={() => openApproval(sr.srNo)}
                          >
                            Approve / Reject
                          </button>
                        )}

                        {/* Issue to vendor after Approved */}
                        {sr.status === "Approved" && (
                          <button
                            className="font-semibold hover:underline text-emerald-700"
                            onClick={() => onIssueToVendor(sr.srNo)}
                          >
                            Issue to Vendor
                          </button>
                        )}

                        {/* Draft actions */}
                        {sr.status === "Draft" && (
                          <>
                            <button
                              className="font-semibold hover:underline"
                              style={{ color: FORTUNA_SECONDARY_BLUE }}
                              onClick={() => onEditDraft(sr)}
                            >
                              Edit
                            </button>

                            <button
                              className="font-semibold hover:underline text-emerald-700"
                              onClick={() => onSendForApproval(sr.srNo)}
                            >
                              Send for Approval
                            </button>

                            <button
                              className="font-semibold text-rose-600 hover:underline"
                              onClick={() => onDeleteDraft(sr.srNo)}
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
                      <td className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300" colSpan={12}>
                        No supplier returns found for current filters.
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

          {/* Quick Stats */}
          <div className="xl:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Quick Stats</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
              </div>

              <div className="mt-4 space-y-3 text-sm dark:text-gray-200">
                <StatRow label="Total Returns" value={stats.total} />
                <StatRow label="Draft" value={stats.draft} badge="gray" />
                <StatRow label="Pending Approval" value={stats.pending} badge="amber" />
                <StatRow label="Approved" value={stats.approved} badge="green" />
                <StatRow label="Rejected" value={stats.rejected} badge="red" />
                <StatRow label="Issued to Vendor" value={stats.issued} badge="blue" />
                <StatRow label="Closed" value={stats.closed} badge="purple" />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Total Vendors" value={stats.vendorCount} badge="blue" />
                <StatRow label="Total Qty" value={stats.totalQty} badge="gray" />
                <StatRow label="Total Value" value={stats.totalValue} money />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats + export.
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Drafts:</span> Use Drafts tab → Edit / Send for Approval / Delete.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModalOpen && selectedSR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approve / Reject Supplier Return</h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  SR: <span className="font-semibold">{selectedSR.srNo}</span> • Vendor:{" "}
                  <span className="font-semibold">{selectedSR.vendorName}</span> •{" "}
                  <span className="font-semibold">{selectedSR.sourceType}:{selectedSR.sourceRef}</span>
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
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedSR.returnType} • {selectedSR.priority}
                </div>

                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm dark:text-gray-200">
                  <Info label="Department" value={selectedSR.department} />
                  <Info label="Created By" value={selectedSR.createdBy} />
                  <Info label="Created On" value={selectedSR.createdOn} />
                  <Info label="Items" value={String(selectedSR.totalItems)} />
                  <Info label="Total Qty" value={String(selectedSR.totalQty)} />
                  <Info label="Estimated Value" value={formatINR(selectedSR.estimatedValue)} />
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
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Approval</h4>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
                </div>

                <div className="mt-3 text-sm dark:text-gray-200">
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-300">Current Approver Role</div>
                    <div className="font-semibold">{selectedSR.currentApproverRole ?? "—"}</div>
                  </div>

                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Demo approval updates local state only.
                  </div>
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
                  <span className="font-semibold">Next:</span> Approved → Issue to Vendor / Close.
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
  active,
  label,
  badge,
  onClick,
  color,
}: {
  active: boolean;
  label: string;
  badge?: number;
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
        <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>
      )}
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
