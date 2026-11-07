"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// ✅ Add-on (for navigation to edit PO form)
import { useRouter } from "next/navigation";


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

type ApprovalLevel = 0 | 1 | 2 | 3;
type ApprovalDecision = "Approved" | "Rejected";

type ApprovalStep = {
  level: ApprovalLevel;
  approverRole: string; // ex: "Finance", "Procurement Head"
  decision?: ApprovalDecision;
  decidedAt?: string; // ISO date
  remarks?: string;
};

type PurchaseOrder = {
  poId: string; // PostgreSQL purchase_orders.po_id UUID
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
function withinRange(
  dateISO: string,
  from?: string,
  to?: string
) {
  if (!from && !to) return true;
  if (!dateISO) return false;

  const date = dateISO.slice(0, 10);

  if (from && date < from) return false;
  if (to && date > to) return false;

  return true;
}

/** Read JSON or plain-text API responses safely. */
async function readApiResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
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

const mapApiPurchaseOrder = (row: any): PurchaseOrder => {
  const validStatuses: POStatus[] = [
    "Draft", "Pending Approval", "Approved", "Rejected", "Issued to Vendor",
    "Partially Received", "Fully Received", "Closed", "Cancelled",
  ];
  const validPriorities: Priority[] = ["Low", "Medium", "High", "Urgent"];
  const validDepartments: Department[] = [
    "Stores", "Operations", "Maintenance", "Finance", "IT", "Admin", "Procurement",
  ];
  const validCurrencies: Currency[] = ["INR", "USD", "EUR"];

  const status = validStatuses.includes(row.status) ? row.status : "Draft";
  const priority = validPriorities.includes(row.priority) ? row.priority : "Medium";
  const department = validDepartments.includes(row.department) ? row.department : "Procurement";
  const currency = validCurrencies.includes(row.currency) ? row.currency : "INR";
  const dateOnly = (value: unknown): string => {
  if (!value) return "";

  const text = String(value).trim();

  // PostgreSQL DATE: preserve exact date
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  // PostgreSQL timestamp: convert to India timezone
  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

  return {
    poId: String(row.po_id ?? ""),
    poNo: String(row.po_number ?? row.poNo ?? ""),
    poDate: dateOnly(row.po_date),
    createdOn: dateOnly(
  row.created_at ??
  row.created_on ??
  row.createdOn ??
  row.po_date
),
    buyer: String(row.buyer ?? ""),
    department,
    rfqNo: String(row.rfq_number ?? row.rfq_no ?? row.rfq_id ?? ""),
    prNo: String(row.pr_number ?? row.pr_no ?? row.pr_id ?? ""),
    vendorName: String(row.vendor_name ?? ""),
    vendorCode: String(row.vendor_code ?? ""),
    currency,
    totalItems: Number(row.total_items ?? 0),
    grandTotal: Number(row.total_value ?? row.grand_total ?? 0),
    priority,
    status,
    deliveryWarehouse: String(row.delivery_warehouse ?? ""),
    approvalRequired: Boolean(row.approval_required),
    approvalRoute: [{ level: 1, approverRole: "Procurement Manager" }],
    currentApprovalLevel: Math.min(Math.max(Number(row.current_approval_level ?? 0), 0), 3) as ApprovalLevel,
  };
};

export default function PurchaseOrderListPage() {
  const router = useRouter();
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");



  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(`${API_BASE}/api/purchase-orders`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const result = await readApiResponse(response);
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || `Request failed (${response.status})`);
      }

      const rows = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
      setData(rows.map(mapApiPurchaseOrder));
    } catch (error) {
      console.error("Fetch PO List Error:", error);
      setLoadError(error instanceof Error ? error.message : "Unable to load purchase orders.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    void fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

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
  const [searchCreatedOn, setSearchCreatedOn] = useState("");

  /** Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /** Approval Modal */
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedPoNo, setSelectedPoNo] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approvalActionLoading, setApprovalActionLoading] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [submittingPoId, setSubmittingPoId] = useState<string | null>(null);

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

    // Created On text search
    const createdOnSearch = searchCreatedOn.trim().toLowerCase();

    const matchesCreatedOn =
      !createdOnSearch ||
      po.createdOn.toLowerCase().includes(createdOnSearch);

    // Existing filters
    const ok =
      po.poNo.toLowerCase().includes(searchPoNo.toLowerCase()) &&
      po.vendorName.toLowerCase().includes(searchVendor.toLowerCase()) &&
      po.buyer.toLowerCase().includes(searchBuyer.toLowerCase()) &&
      (deptFilter ? po.department === deptFilter : true) &&
      (statusFilter ? po.status === statusFilter : true) &&
      withinRange(
        po.createdOn,
        createdFrom || undefined,
        createdTo || undefined
      ) &&
      matchesCreatedOn;

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
  searchCreatedOn, // NEW
]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
    setApprovalError("");
    setApprovalModalOpen(true);
  };

  const applyDecision = async (decision: ApprovalDecision) => {
    if (!selectedPoNo || !selectedPO) return;

    if (!selectedPO.poId) {
      setApprovalError("PO database ID is missing. Refresh the list and try again.");
      return;
    }

    setApprovalActionLoading(true);
    setApprovalError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/purchase-orders/${encodeURIComponent(selectedPO.poId)}/approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            remarks: approvalRemarks.trim() || null,
            // Temporary identity until application authentication is connected.
            approver_id: "Procurement Manager",
          }),
        }
      );

      const result = await readApiResponse(response);
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || `Approval failed (${response.status})`);
      }

      await fetchPurchaseOrders();
      setApprovalModalOpen(false);
      setSelectedPoNo("");
      setApprovalRemarks("");
      setActiveTab(decision === "Approved" ? "approved" : "all");
      setCurrentPage(1);
    } catch (error) {
      console.error("PO Approval Error:", error);
      setApprovalError(
        error instanceof Error ? error.message : "Unable to save PO approval."
      );
    } finally {
      setApprovalActionLoading(false);
    }
  };

    
/** Issue Approved PO to Vendor - Database API */
const issueToVendor = async (poNo: string) => {
  const po = data.find((item) => item.poNo === poNo);

  if (!po) {
    alert("Purchase Order not found. Please refresh the list.");
    return;
  }

  if (!po.poId) {
    alert("PO database ID is missing. Please refresh the list.");
    return;
  }

  if (po.status !== "Approved") {
    alert("Only Approved Purchase Orders can be issued to Vendor.");
    return;
  }

  const confirmed = confirm(
    `Issue PO ${poNo} to Vendor ${po.vendorName}?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_BASE}/api/purchase-orders/${encodeURIComponent(po.poId)}/issue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result?.success === false) {
      throw new Error(
        result?.message || `Issue PO failed (${response.status})`
      );
    }

    alert(result.message || `PO ${poNo} issued to Vendor successfully.`);

    // Refresh from PostgreSQL
    await fetchPurchaseOrders();

    // Show issued PO
    setActiveTab("all");
    setCurrentPage(1);
  } catch (error) {
    console.error("Issue PO to Vendor Error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Unable to issue Purchase Order to Vendor."
    );
  }
};


  /** ✅ Draft actions (ONLY in Drafts tab) */
  const onEditDraft = (poNo: string) => {
    // Replace with router.push("/procurement/po/new?mode=edit&poNo=...")
    alert(`Edit Draft PO: ${poNo} (demo)`);
  };

  const onSendDraftForApproval = async (poNo: string) => {
    const po = data.find((item) => item.poNo === poNo);
    if (!po) {
      alert("Purchase order was not found in the current list. Please refresh and try again.");
      return;
    }

    if (po.status !== "Draft") {
      alert(`Only Draft purchase orders can be submitted. Current status: ${po.status}`);
      return;
    }

    if (!po.poId) {
      alert("PO database ID is missing. Refresh the list and try again.");
      return;
    }

    if (submittingPoId) return;

    const ok = confirm(`Send draft PO ${poNo} for approval?`);
    if (!ok) return;

    setSubmittingPoId(po.poId);

    try {
      const url = `${API_BASE}/api/purchase-orders/${encodeURIComponent(po.poId)}/submit-for-approval`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await readApiResponse(response);

      if (!response.ok || result?.success === false) {
        console.error("PO Submit API Error:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          response: result,
        });

        throw new Error(
          result?.message ||
            result?.error ||
            `Submit PO failed: HTTP ${response.status} ${response.statusText}`
        );
      }

      // The backend is the source of truth for PO status. Refresh from DB.
      await fetchPurchaseOrders();
      setActiveTab("pending");
      setStatusFilter("");
      setCurrentPage(1);

      alert(result?.message || `PO ${poNo} submitted for approval successfully.`);
    } catch (error) {
      console.error("Submit PO for Approval Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to submit PO for approval."
      );
    } finally {
      setSubmittingPoId(null);
    }
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
          onClick={() => router.push("/PurchaseOrderForm")}
          className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}>
          + Create PO
          </button>


            <button
              onClick={() => void fetchPurchaseOrders()}
              disabled={loading}
              className="active:scale-95 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-md transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
            >
              {loading ? "Refreshing..." : "Refresh List"}
            </button>

            <button
              onClick={exportToCSV}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
            >
              Export CSV
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

                    <th className="px-4 py-3 text-left min-w-[240px]">
  <div className="font-semibold text-white">
    Created On
  </div>

  
  {/* Date Range */}
  <div className="mt-2 grid grid-cols-2 gap-2">
    <input
      type="date"
      title="Created From"
      className="min-w-0 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs text-gray-800"
      value={createdFrom}
      onChange={(e) => {
        setCreatedFrom(e.target.value);
        setCurrentPage(1);
      }}
    />

    <input
      type="date"
      title="Created To"
      className="min-w-0 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs text-gray-800"
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
                  {loading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                        Loading purchase orders from database...
                      </td>
                    </tr>
                  )}
                  {!loading && loadError && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-red-600">
                        Failed to load purchase orders: {loadError}
                        <button className="ml-3 font-semibold underline" onClick={() => void fetchPurchaseOrders()}>
                          Retry
                        </button>
                      </td>
                    </tr>
                  )}
                  {!loading && !loadError && paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                        No purchase orders found.
                      </td>
                    </tr>
                  )}
                  {!loading && !loadError && paginatedData.map((po) => (
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
                            {po.approvalRoute.find((s) => s.level === po.currentApprovalLevel)?.approverRole || "Procurement Manager"}
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
                              type="button"
                              className="font-semibold hover:underline text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={submittingPoId === po.poId || submittingPoId !== null}
                              onClick={() => void onSendDraftForApproval(po.poNo)}
                            >
                              {submittingPoId === po.poId ? "Submitting..." : "Send for Approval"}
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
                    {selectedPO.approvalRoute.find((s) => s.level === selectedPO.currentApprovalLevel)?.approverRole || "Procurement Manager"}
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
                    disabled={approvalActionLoading}
                    onClick={() => void applyDecision("Rejected")}
                  >
                    {approvalActionLoading ? "Saving..." : "Reject"}
                  </button>
                  <button
                    className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                    disabled={approvalActionLoading}
                    onClick={() => void applyDecision("Approved")}
                  >
                    {approvalActionLoading ? "Saving..." : "Approve"}
                  </button>
                </div>

                {approvalError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {approvalError}
                  </div>
                )}

                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Approval:</span> Single-level Procurement Manager approval. Status and remarks are saved to PostgreSQL.
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
