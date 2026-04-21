"use client";
import React, { useMemo, useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// ✅ Add-on (for navigation to edit PR form)
import { useRouter } from "next/navigation";



/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type PRStatus = "Draft" | "Submitted" | "Pending Approval" | "Approved" | "Rejected" | "Closed";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Department = "Stores" | "Operations" | "Maintenance" | "Finance" | "IT" | "Admin" | "Procurement";

type ApprovalLevel = 1 | 2 | 3;
type ApprovalDecision = "Approved" | "Rejected";

type ApprovalStep = {
  level: ApprovalLevel;
  role: string;// ex: "Department Head", "Finance", "Procurement"
  decision?: ApprovalDecision;
  decidedAt?: string; // ISO date
  remarks?: string;
};

interface PurchaseRequisition {
  pr_id: string;
  prNo: string;
  title: string;
  department: Department;
  requestor: string;
  requiredBy: string; // yyyy-mm-dd
  createdOn: string; // yyyy-mm-dd
  priority: Priority;
  status: PRStatus;
  totalItems: number;
  estimatedValue: number;

  // Approval workflow (demo)
  approvalRoute: ApprovalStep[];
  currentApprovalLevel: ApprovalLevel; // which level is pending (when pending)

  // ✅ ADD-ON ONLY: keep full draft payload for edit (optional)
  draftPayload?: any;
}

/** ✅ Add-on: Tabs */
type ListTab = "all" | "drafts";

/** ✅ Add-on: localStorage key for edit draft handoff */
const LS_EDIT_DRAFT = "FORTUNA_PR_EDIT_DRAFT";

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

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function withinRange(dateISO: string, from?: string, to?: string) {
  // inclusive check
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

export default function PurchaseRequisitionListPage() {
  const router = useRouter();

  const [data, setData] = useState<PurchaseRequisition[]>([]);

const fetchApprovals = async (pr_id: string) => {
  try {
    const res = await fetch(`http://localhost:5000/api/pr/${pr_id}/approvals`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Approval fetch error:", err);
    return [];
  }
};

const fetchPRs = async () => {
  setLoading(true);

  try {
    const res = await fetch("http://localhost:5000/api/pr/list");
    const data = await res.json();

    if (data.success) {
      const formatted: PurchaseRequisition[] = await Promise.all(
        data.data.map(async (pr: any) => {
          const approvals = await fetchApprovals(pr.pr_id);

          console.log("PR ID:", pr.pr_id);         
          console.log("Approvals:", approvals);


          return {
            pr_id: pr.pr_id,
            prNo: pr.pr_number,
            title: pr.justification || "PR Request",
            department: pr.department,
            requestor: pr.requested_by,
            requiredBy: pr.required_by_date || "-",
            createdOn: pr.created_at?.split("T")[0],
            priority: pr.priority,
            status: pr.status,
            totalItems: Number(pr.total_items) || 0,
            estimatedValue: pr.estimated_pr_value || 0,

            // 🔥 REAL APPROVAL DATA
            approvalRoute: approvals,

            // 🔥 CURRENT LEVEL (Pending one)
            currentApprovalLevel:
              approvals.find((a: any) => a.status?.toLowerCase() === "pending")?.level || 0,
          };
        })
      );

      setData(formatted);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to load PR list");
  } finally {
    setLoading(false);
  }
};
  
useEffect(() => {
  fetchPRs();
}, []);


const handleApprove = async (pr_id: string, level: number) => {
  try {
    const res = await fetch("http://localhost:5000/api/pr/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pr_id,
        level,
        decision: "Approved",
        remarks: "Approved",
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ PR Approved");
      fetchPRs(); // 🔥 refresh
    } else {
      alert(data.message || "Approval failed");
    }
  } catch (err) {
    console.error(err);
    alert("Error approving PR");
  }
};


// Similar function for rejection (not shown for brevity)//

const handleReject = async (pr_id: string, level: number) => {
  try {
    const res = await fetch("http://localhost:5000/api/pr/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pr_id,
        level,
        decision: "Rejected",
        remarks: "Rejected",
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("❌ PR Rejected");
      fetchPRs(); // 🔥 refresh list
    } else {
      alert(data.message || "Reject failed");
    }
  } catch (err) {
    console.error("Reject error:", err);
    alert("Error rejecting PR");
  }
};


const [loading, setLoading] = useState(false);


  /** ✅ Add-on: tab state */
  const [activeTab, setActiveTab] = useState<ListTab>("all");

  // Filters (unchanged)
  const [searchPrNo, setSearchPrNo] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [searchRequestor, setSearchRequestor] = useState("");
  const [deptFilter, setDeptFilter] = useState<Department | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [statusFilter, setStatusFilter] = useState<PRStatus | "">("");
  const [createdFrom, setCreatedFrom] = useState<string>("");
  const [createdTo, setCreatedTo] = useState<string>("");

  // Pagination (unchanged)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Approval Modal (unchanged)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
 const [selectedPR, setSelectedPR] = useState<any>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");

  /** ✅ Add-on: tab-level base filter (NO approval flow disturbance) */
  const tabFilteredBase = useMemo(() => {
    if (activeTab === "drafts") return data.filter((x) => x.status === "Draft");
    return data;
  }, [data, activeTab]);

  const filteredData = useMemo(() => {
    return tabFilteredBase.filter((pr) => {
      const ok =
        pr.prNo.toLowerCase().includes(searchPrNo.toLowerCase()) &&
        pr.title.toLowerCase().includes(searchTitle.toLowerCase()) &&
        pr.requestor.toLowerCase().includes(searchRequestor.toLowerCase()) &&
        (deptFilter ? pr.department === deptFilter : true) &&
        (priorityFilter ? pr.priority === priorityFilter : true) &&
        (statusFilter ? pr.status === statusFilter : true) &&
        withinRange(pr.createdOn, createdFrom || undefined, createdTo || undefined);

      return ok;
    });
  }, [
    tabFilteredBase,
    searchPrNo,
    searchTitle,
    searchRequestor,
    deptFilter,
    priorityFilter,
    statusFilter,
    createdFrom,
    createdTo,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats (unchanged, but now based on filteredData)
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

  // CSV Export (unchanged)
  const exportToCSV = () => {
    const header = [
      "PR No",
      "Title",
      "Department",
      "Requestor",
      "Created On",
      "Required By",
      "Priority",
      "Status",
      "Total Items",
      "Estimated Value",
    ];

    const rows = filteredData.map((pr) =>
      [
        pr.prNo,
        pr.title,
        pr.department,
        pr.requestor,
        pr.createdOn,
        pr.requiredBy,
        pr.priority,
        pr.status,
        pr.totalItems,
        pr.estimatedValue,
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "purchase-requisition-list.csv";
    link.click();
  };

  const resetFilters = () => {
    setSearchPrNo("");
    setSearchTitle("");
    setSearchRequestor("");
    setDeptFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  // ---- Approval actions (demo only) ---- (unchanged)
  const openApproval = async (pr: any) => {
  try {
    // 🔥 fetch latest approvals
    const res = await fetch(`http://localhost:5000/api/pr/${pr.pr_id}/approvals`);
    const result = await res.json();

    const latestApprovals = (result.data || []).map((a: any) => ({
  level: a.level,
  approverRole: a.role,        // 🔥 KEY FIX
   status: a.status?.toLowerCase(),
  remarks: a.remarks,
  decidedAt: a.decided_at,
}));

    // sort (optional but clean)
    latestApprovals.sort((a: any, b: any) => a.level - b.level);

    // 🔥 create updated PR object
    const updatedPR = {
      ...pr,
      approvalRoute: latestApprovals,
      currentApprovalLevel: (() => {
  const pending = latestApprovals.find(
    (a: any) => a.status?.toLowerCase() === "pending"
  );
  return pending ? pending.level : null;
})(),
    };

    // ✅ store full object (not prNo)
    setSelectedPR(updatedPR);
    setApprovalRemarks("");
    setApprovalModalOpen(true);

  } catch (err) {
    console.error(err);
  }
};

  const applyDecision = async (decision: ApprovalDecision) => {
  if (!selectedPR) return;

  try {
    const res = await fetch("http://localhost:5000/api/pr/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pr_id: selectedPR.pr_id,
        level:
  selectedPR.currentApprovalLevel ??
  selectedPR.approvalRoute.find(
    (a: any) => a.status?.toLowerCase() === "pending"
  )?.level,
        decision,
        remarks: approvalRemarks || "",
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert(`✅ ${decision} successful`);
      setApprovalModalOpen(false);
      setApprovalRemarks("");
      await fetchPRs(); // 🔥 refresh list
    } else {
      alert(data.message || "Action failed");
    }
  } catch (err) {
    console.error(err);
    alert("Error processing approval");
  }
};

  /** ✅ Add-on: Draft actions */
  const onEditDraft = (pr: PurchaseRequisition) => {
    if (pr.status !== "Draft") return;

    // save payload for create page to prefill
    localStorage.setItem(
      LS_EDIT_DRAFT,
      JSON.stringify({
        prNo: pr.prNo,
        payload: pr.draftPayload ?? pr,
      })
    );

    // ✅ Put your real route here
    // router.push("/purchase/pr/new?mode=edit");
    alert(`Edit Draft: navigate to PR form with data prefill for ${pr.prNo} (demo)`);
  };

  const onSendDraftForApproval = async (pr_id: string) => {
  const ok = confirm("Send for approval?");
  if (!ok) return;

  try {
    const res = await fetch("http://localhost:5000/api/pr/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pr_id }),
    });

    const data = await res.json();

    if (data.success) {
      alert("PR sent for approval successfully");
      await fetchPRs(); // ✅ refresh without reload
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error sending PR");
  }
};

  const onDeleteDraft = (prNo: string) => {
    const ok = confirm(`Delete draft ${prNo}?`);
    if (!ok) return;
    setData((prev) => prev.filter((x) => x.prNo !== prNo));
  };

  const statusPill = (s: PRStatus) =>
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

  const getPRByNo = (prNo: string) => data.find((x) => x.prNo === prNo);

  // const selectedPR = selectedPrNo ? getPRByNo(selectedPrNo) : undefined;

  /** ✅ Add-on: drafts count (for badge) */
  const draftsCount = useMemo(() => data.filter((x) => x.status === "Draft").length, [data]);

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Purchase Requisition" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Purchase Requisition List
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Track PRs, approvals, and procurement readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* BUtton code */}
           <button
            onClick={() => router.push("/PurchaseRequisition")}
            className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200"
            style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}>
            + Create PR
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

        {/* ✅ ADD-ON: Tabs (without removing approval flow) */}
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
            All PRs
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("drafts");
              setCurrentPage(1);
              // optional: statusFilter clear to avoid confusion
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
                      PR No
                      <input
                        className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                        placeholder="Search"
                        value={searchPrNo}
                        onChange={(e) => {
                          setSearchPrNo(e.target.value);
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

                    <th className="px-4 py-3 text-left">Items</th>
                    <th className="px-4 py-3 text-left">Est. Value</th>
                    <th className="px-4 py-3 text-left">Approval</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="dark:text-gray-200">
  {loading ? (
    // 🔄 LOADING STATE
    <tr>
      <td colSpan={10} className="text-center py-6 text-gray-500">
        Loading PRs...
      </td>
    </tr>
  ) : paginatedData.length > 0 ? (
    // ✅ DATA STATE
    paginatedData.map((pr) => (
      <tr
        key={pr.pr_id}
        className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
      >
        <td className="px-4 py-3 font-semibold">{pr.prNo}</td>

        <td className="px-4 py-3">
          <div className="font-semibold text-gray-900 dark:text-white">
            {pr.title}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
            Required By:{" "}
            <span className="font-semibold">{pr.requiredBy}</span>
          </div>
        </td>

        <td className="px-4 py-3">{pr.department}</td>
        <td className="px-4 py-3">{pr.requestor}</td>

        <td className="px-4 py-3">
          <span className={priorityPill(pr.priority)}>
            {pr.priority}
          </span>
        </td>

        <td className="px-4 py-3">
          <span className={statusPill(pr.status)}>
            {pr.status}
          </span>

          {pr.status === "Pending Approval" && (
            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
              Level {pr.currentApprovalLevel} •{" "}
              {
                pr.approvalRoute.find(
                  (s) => s.level === pr.currentApprovalLevel
                )?.approverRole
              }
            </div>
          )}
        </td>

        <td className="px-4 py-3">{pr.createdOn}</td>
        <td className="px-4 py-3">{pr.totalItems}</td>

        <td className="px-4 py-3 font-semibold">
          {formatINR(pr.estimatedValue)}
        </td>
        <td className="px-4 py-3">
  {pr.approvalRoute?.length === 0 ? (
    <span className="text-gray-400 text-xs">No Flow</span>
  ) : (
    pr.approvalRoute.map((a: any) => (
      <div key={a.level} className="text-xs">
        L{a.level} - {a.role} :
        <span
          className={
            a.status === "Approved"
              ? "text-green-600"
              : a.status === "Rejected"
              ? "text-red-600"
              : "text-amber-600"
          }
        >
          {" "}{a.status}
        </span>
      </div>
    ))
  )}
</td>
        <td className="px-4 py-3 space-x-3">
          {/* VIEW */}
          <button
          className="font-semibold text-blue-600 hover:underline"
          onClick={() =>
          router.push(`/PurchaseRequisition?id=${pr.pr_id}&mode=view`)
          }
          >
          View
          </button>

          {/* APPROVAL */}
          {/* ✅ APPROVE BUTTON */}
  {pr.status === "Pending Approval" && pr.currentApprovalLevel > 0 && (
  <>
    <button
      onClick={() => openApproval(pr)}
      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
    >
      Approve
    </button>

    <button
      onClick={() => openApproval(pr)}
      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
    >
      Reject
    </button>
  </>
)}

          {/* DRAFT ACTIONS */}
          {pr.status === "Draft" && (
            <>
              <button
            className="font-semibold text-green-600 hover:underline"
            onClick={() =>
              router.push(`/PurchaseRequisition?id=${pr.pr_id}&mode=edit`)
            }
            >
            Edit
            </button>

              <button
                className="font-semibold hover:underline text-emerald-700"
                onClick={() => onSendDraftForApproval(pr.pr_id)}
              >
                Send for Approval
              </button>

              <button
                className="font-semibold text-rose-600 hover:underline"
                onClick={() => onDeleteDraft(pr.prNo)}
              >
                Delete
              </button>
            </>
          )}
        </td>
      </tr>
    ))
  ) : (
    // ❌ EMPTY STATE
    <tr>
      <td
        className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300"
        colSpan={10}
      >
        No PRs found for current filters.
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
                <StatRow label="Total PRs" value={stats.total} />
                <StatRow label="Draft" value={stats.draft} badge="gray" />
                <StatRow label="Submitted" value={stats.submitted} badge="blue" />
                <StatRow label="Pending Approval" value={stats.pending} badge="amber" />
                <StatRow label="Approved" value={stats.approved} badge="green" />
                <StatRow label="Rejected" value={stats.rejected} badge="red" />
                <div className="my-3 border-t dark:border-gray-800" />
                <StatRow label="Total PR Value" value={stats.totalValue} money />
                <StatRow label="Avg Value / PR" value={stats.avgValue} money />
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Tip:</span> Filters apply to stats + export.
              </div>

              {/* ✅ ADD-ON small hint */}
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Drafts:</span> Use Drafts tab → Edit → Send for Approval.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal (UNCHANGED) */}
      {approvalModalOpen && selectedPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Approve / Reject PR
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  PR: <span className="font-semibold">{selectedPR.prNo}</span> • Level{" "}
                  <span className="font-semibold">{selectedPR.currentApprovalLevel}</span> •{" "}
                  <span className="font-semibold">
                    {selectedPR.approvalRoute.find((s) => s.level === selectedPR.currentApprovalLevel)?.approverRole}
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
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedPR.title}
                </div>

                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm dark:text-gray-200">
                  <Info label="Department" value={selectedPR.department} />
                  <Info label="Requestor" value={selectedPR.requestor} />
                  <Info label="Created On" value={selectedPR.createdOn} />
                  <Info label="Required By" value={selectedPR.requiredBy} />
                  <Info label="Total Items" value={String(selectedPR.totalItems)} />
                  <Info label="Estimated Value" value={formatINR(selectedPR.estimatedValue)} />
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Remarks (optional)
                  </label>
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
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Approval Route
                  </h4>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                  />
                </div>

                <div className="mt-3 space-y-2 text-sm dark:text-gray-200">
                  {selectedPR.approvalRoute.map((s) => {
                    const isCurrent =
                      s.level === selectedPR.currentApprovalLevel &&
                      (selectedPR.status === "Submitted" || selectedPR.status === "Pending Approval");
                    const decision =
                                    s.status === "approved"
                                      ? "Approved"
                                      : s.status === "rejected"
                                      ? "Rejected"
                                      : "Pending";

                    return (
                      <div
                        key={s.level}
                        className={classNames(
                          "rounded-lg border px-3 py-2",
                          isCurrent ? "border-blue-300 bg-blue-50 dark:bg-white/5" : "border-gray-200 dark:border-gray-800"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            Level {s.level} • {s.role}
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
