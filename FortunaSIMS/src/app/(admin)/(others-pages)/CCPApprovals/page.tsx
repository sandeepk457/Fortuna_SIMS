"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** ===== Fortuna Theme ===== */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";
const APP_TOPBAR_H = 74;

/** ===== UI helpers ===== */
function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/20 focus:border-[#005F99]/40";

const labelBase = "text-xs font-semibold text-gray-700";
const helperBase = "text-[11px] text-gray-500";

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition active:scale-95";

const outlineBtn =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition active:scale-95";

type Tone = "red" | "blue" | "amber" | "green" | "gray" | "purple";

function MiniPill({ text, tone }: { text: string; tone: Tone }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const cls =
    tone === "red"
      ? "bg-rose-50 text-rose-700"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800"
      : tone === "green"
      ? "bg-green-50 text-green-700"
      : tone === "purple"
      ? "bg-purple-50 text-purple-700"
      : "bg-gray-100 text-gray-700";
  return <span className={classNames(base, cls)}>{text}</span>;
}

function StatLine({ label, value, pillBg }: { label: string; value: number | string; pillBg: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: pillBg }}>
        {value}
      </span>
    </div>
  );
}

function QuickStatsCard({
  title,
  stats,
  note,
}: {
  title: string;
  stats: Array<{ label: string; value: number | string; pillBg: string }>;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {stats.map((s) => (
          <StatLine key={s.label} label={s.label} value={s.value} pillBg={s.pillBg} />
        ))}

        {note ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <span className="font-semibold">Note:</span> {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function currencyINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

/** ===== Masters ===== */
const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH" },
  { id: "WH-002", name: "Hyderabad WH" },
  { id: "WH-003", name: "Chennai WH" },
] as const;

const APPROVERS = [
  { id: "A-001", name: "Suresh (Inventory Controller)" },
  { id: "A-002", name: "Meena (WH Head)" },
  { id: "A-003", name: "Finance Review (User)" },
] as const;

type ApprovalStatus = "Pending" | "Under Review" | "On Hold" | "Approved" | "Rejected";

type CountPlan = {
  plan_id: string;
  plan_no: string;
  plan_type: "Cycle Count" | "Physical Audit";
  count_mode: "Blind" | "Guided";
  warehouse_id: string;
  scheduled_date: string;
  scope_type: "BIN" | "ITEM";
  scope_summary: string;
  sku_count: number;

  // process statuses
  plan_status: "Awaiting Approval" | "Approved" | "Posted" | "Cancelled";

  // approval fields
  approval_status: ApprovalStatus;
  approval_owner: string; // approver name
  approval_remarks: string;
  approval_updated: string;
};

type VarianceLine = {
  line_id: string;
  plan_id: string;
  plan_no: string;
  warehouse_id: string;

  scope_ref: string;
  category: string;
  item_id: string;
  item_desc: string;
  uom: string;

  unit_cost: number;
  system_qty: number;
  counted_qty: number;

  // recount / recon
  recount_required: boolean;
  recount_status: "Not Required" | "Queued" | "In Progress" | "Completed";
  reconciliation_status: "Pending" | "Accepted" | "Adjusted" | "Rejected";
  reconciliation_action: "" | "Accept Count" | "Adjust Stock" | "Reject Count";
  reconciliation_remarks: string;

  last_updated: string;
};

/** ===== Demo Data ===== */
const SAMPLE_PLANS: CountPlan[] = [
  {
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    plan_type: "Cycle Count",
    count_mode: "Blind",
    warehouse_id: "WH-002",
    scheduled_date: "2026-02-14",
    scope_type: "BIN",
    scope_summary: "Z-A-01-01 → Z-A-01-12",
    sku_count: 48,
    plan_status: "Awaiting Approval",
    approval_status: "Pending",
    approval_owner: "Suresh (Inventory Controller)",
    approval_remarks: "",
    approval_updated: "2026-02-18",
  },
  {
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    plan_type: "Cycle Count",
    count_mode: "Guided",
    warehouse_id: "WH-001",
    scheduled_date: "2026-02-10",
    scope_type: "ITEM",
    scope_summary: "FAST MOVING (A-class)",
    sku_count: 22,
    plan_status: "Awaiting Approval",
    approval_status: "Under Review",
    approval_owner: "Meena (WH Head)",
    approval_remarks: "Check high value impact items",
    approval_updated: "2026-02-18",
  },
  {
    plan_id: "CCP-UUID-0003",
    plan_no: "PA-2026-0005",
    plan_type: "Physical Audit",
    count_mode: "Blind",
    warehouse_id: "WH-003",
    scheduled_date: "2026-01-28",
    scope_type: "BIN",
    scope_summary: "Full WH (sampled)",
    sku_count: 220,
    plan_status: "Approved",
    approval_status: "Approved",
    approval_owner: "Finance Review (User)",
    approval_remarks: "Approved for posting",
    approval_updated: "2026-02-01",
  },
];

const SAMPLE_LINES: VarianceLine[] = [
  // Plan 0001
  {
    line_id: "VL-0001",
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    scope_ref: "BIN Z-A-01-03",
    category: "Packaging",
    item_id: "SKU-10021",
    item_desc: "HDPE Bottle 1L",
    uom: "Nos",
    unit_cost: 25,
    system_qty: 1200,
    counted_qty: 1120,
    recount_required: true,
    recount_status: "Completed",
    reconciliation_status: "Adjusted",
    reconciliation_action: "Adjust Stock",
    reconciliation_remarks: "Recount confirmed; adjust to physical",
    last_updated: "2026-02-18",
  },
  {
    line_id: "VL-0002",
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    scope_ref: "BIN Z-A-01-04",
    category: "Packaging",
    item_id: "SKU-33011",
    item_desc: "Carton Box 5-ply",
    uom: "Nos",
    unit_cost: 18,
    system_qty: 500,
    counted_qty: 498,
    recount_required: false,
    recount_status: "Not Required",
    reconciliation_status: "Accepted",
    reconciliation_action: "Accept Count",
    reconciliation_remarks: "Within tolerance",
    last_updated: "2026-02-18",
  },
  // Plan 0002 (one pending -> makes plan not eligible)
  {
    line_id: "VL-0003",
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    scope_ref: "ITEM SCOPE • FAST MOVING (A-class)",
    category: "Finished Goods",
    item_id: "SKU-52936",
    item_desc: "Premium Bag",
    uom: "Nos",
    unit_cost: 800,
    system_qty: 474,
    counted_qty: 465,
    recount_required: false,
    recount_status: "Not Required",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
  {
    line_id: "VL-0004",
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    scope_ref: "ITEM SCOPE • FAST MOVING (A-class)",
    category: "Spare Parts",
    item_id: "SKU-31782",
    item_desc: "Industrial Bag",
    uom: "Nos",
    unit_cost: 574,
    system_qty: 976,
    counted_qty: 958,
    recount_required: true,
    recount_status: "In Progress",
    reconciliation_status: "Pending",
    reconciliation_action: "",
    reconciliation_remarks: "",
    last_updated: "2026-02-18",
  },
  // Plan 0003 (eligible but already approved)
  {
    line_id: "VL-0005",
    plan_id: "CCP-UUID-0003",
    plan_no: "PA-2026-0005",
    warehouse_id: "WH-003",
    scope_ref: "BIN Z-C-03-05-01",
    category: "Consumables",
    item_id: "SKU-81552",
    item_desc: "Premium Kit",
    uom: "Nos",
    unit_cost: 918,
    system_qty: 395,
    counted_qty: 381,
    recount_required: false,
    recount_status: "Not Required",
    reconciliation_status: "Adjusted",
    reconciliation_action: "Adjust Stock",
    reconciliation_remarks: "Approved by audit lead",
    last_updated: "2026-02-01",
  },
];

/** ===== CCP Approvals Page ===== */
export default function CCPApprovalsPage() {
  const [plans, setPlans] = useState<CountPlan[]>(SAMPLE_PLANS);
  const [lines] = useState<VarianceLine[]>(SAMPLE_LINES);

  // filters
  const [warehouse, setWarehouse] = useState<string>("All");
  const [status, setStatus] = useState<ApprovalStatus | "All">("All");
  const [risk, setRisk] = useState<"All" | "High Impact" | "Threshold Exceeded" | "Recount Pending">("All");
  const [search, setSearch] = useState<string>("");

  // pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activePlanId, setActivePlanId] = useState<string>("");

  const whName = (whId: string) => WAREHOUSES.find((w) => w.id === whId)?.name || whId;

  /** Derived per line: variance qty/value + risk flags */
  const computedLines = useMemo(() => {
    return lines.map((l) => {
      const variance_qty = Number(l.counted_qty) - Number(l.system_qty);
      const variance_pct =
        l.system_qty === 0 ? (l.counted_qty === 0 ? 0 : 100) : (Math.abs(variance_qty) / Math.abs(l.system_qty)) * 100;

      const variance_value = Number(l.unit_cost || 0) * variance_qty;
      const threshold_exceeded = Math.abs(variance_pct) >= 5; // approvals module typically uses fixed policy threshold (or fetch)
      const highImpact = Math.abs(variance_value) > 25000;

      return {
        ...l,
        variance_qty,
        variance_pct: Number(variance_pct.toFixed(2)),
        variance_value,
        threshold_exceeded,
        highImpact,
      };
    });
  }, [lines]);

  /** Plan metrics computed from lines */
  const planMetrics = useMemo(() => {
    const map = new Map<
      string,
      {
        totalVarianceLines: number;
        pendingRecon: number;
        recountRequired: number;
        recountPending: number; // queued/in progress
        recountCompleted: number;
        thresholdExceeded: number;
        highImpact: number;
        netVarianceQty: number;
        netVarianceValue: number;
        eligibleForApproval: boolean;
      }
    >();

    for (const p of plans) {
      const plines = computedLines.filter((x) => x.plan_id === p.plan_id);
      const totalVarianceLines = plines.length;

      const pendingRecon = plines.filter((x) => x.reconciliation_status === "Pending").length;

      const recountRequired = plines.filter((x) => x.recount_required).length;
      const recountPending = plines.filter(
        (x) => x.recount_required && (x.recount_status === "Queued" || x.recount_status === "In Progress")
      ).length;
      const recountCompleted = plines.filter((x) => x.recount_required && x.recount_status === "Completed").length;

      const thresholdExceeded = plines.filter((x: any) => x.threshold_exceeded).length;
      const highImpact = plines.filter((x: any) => x.highImpact).length;

      const netVarianceQty = plines.reduce((s: number, x: any) => s + Number(x.variance_qty || 0), 0);
      const netVarianceValue = plines.reduce((s: number, x: any) => s + Number(x.variance_value || 0), 0);

      // Eligibility rule (enterprise):
      // 1) No pending reconciliation
      // 2) If recount required -> recount must be completed for those lines
      const eligibleForApproval =
        pendingRecon === 0 && recountPending === 0 && (recountRequired === 0 || recountCompleted === recountRequired);

      map.set(p.plan_id, {
        totalVarianceLines,
        pendingRecon,
        recountRequired,
        recountPending,
        recountCompleted,
        thresholdExceeded,
        highImpact,
        netVarianceQty,
        netVarianceValue,
        eligibleForApproval,
      });
    }

    return map;
  }, [plans, computedLines]);

  /** Filter plans (queue) */
  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();

    return plans.filter((p) => {
      const m = planMetrics.get(p.plan_id);
      const byWh = warehouse === "All" ? true : p.warehouse_id === warehouse;
      const byStatus = status === "All" ? true : p.approval_status === status;

      const bySearch =
        !q ||
        p.plan_no.toLowerCase().includes(q) ||
        p.plan_type.toLowerCase().includes(q) ||
        p.scope_summary.toLowerCase().includes(q) ||
        p.warehouse_id.toLowerCase().includes(q);

      const byRisk = (() => {
        if (!m) return true;
        if (risk === "All") return true;
        if (risk === "High Impact") return m.highImpact > 0;
        if (risk === "Threshold Exceeded") return m.thresholdExceeded > 0;
        if (risk === "Recount Pending") return m.recountPending > 0;
        return true;
      })();

      return byWh && byStatus && bySearch && byRisk;
    });
  }, [plans, planMetrics, warehouse, status, risk, search]);

  /** Pagination */
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const paginatedPlans = filteredPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /** Right panel stats */
  const rightStats = useMemo(() => {
    const base = plans;
    const pending = base.filter((p) => p.approval_status === "Pending").length;
    const underReview = base.filter((p) => p.approval_status === "Under Review").length;
    const onHold = base.filter((p) => p.approval_status === "On Hold").length;
    const approved = base.filter((p) => p.approval_status === "Approved").length;
    const rejected = base.filter((p) => p.approval_status === "Rejected").length;

    const eligible = base.filter((p) => planMetrics.get(p.plan_id)?.eligibleForApproval).length;

    return {
      title: "Quick Stats • CCP Approvals",
      note: "Eligibility rule: No Pending recon + recount-required lines must be Completed.",
      stats: [
        { label: "Plans (Filtered)", value: filteredPlans.length, pillBg: "#E8F0FE" },
        { label: "Eligible Now", value: eligible, pillBg: "#E9FBEA" },
        { label: "Pending", value: pending, pillBg: "#FFF3D6" },
        { label: "Under Review", value: underReview, pillBg: "#E8F0FE" },
        { label: "On Hold", value: onHold, pillBg: "#EEF2F7" },
        { label: "Approved", value: approved, pillBg: "#E9FBEA" },
        { label: "Rejected", value: rejected, pillBg: "#FFE8EC" },
      ],
    };
  }, [plans, filteredPlans.length, planMetrics]);

  /** Modal open/close */
  const openPlan = (id: string) => {
    setActivePlanId(id);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setActivePlanId("");
  };

  const activePlan = useMemo(() => plans.find((p) => p.plan_id === activePlanId), [plans, activePlanId]);
  const activeMetrics = useMemo(() => (activePlanId ? planMetrics.get(activePlanId) : undefined), [activePlanId, planMetrics]);

  const activePlanLines = useMemo(() => {
    if (!activePlanId) return [];
    // show lines sorted by impact value desc for reviewer
    const plines: any[] = computedLines.filter((x) => x.plan_id === activePlanId);
    return plines.sort((a, b) => Math.abs(Number(b.variance_value || 0)) - Math.abs(Number(a.variance_value || 0)));
  }, [computedLines, activePlanId]);

  /** Plan update helper */
  const updatePlan = (id: string, patch: Partial<CountPlan>) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.plan_id === id
          ? {
              ...p,
              ...patch,
              approval_updated: todayISO(),
            }
          : p
      )
    );
  };

  /** Export queue to CSV */
  const exportToCSV = () => {
    const header = [
      "Plan No",
      "Plan Type",
      "Warehouse",
      "Scope",
      "Scheduled Date",
      "Approval Status",
      "Eligible",
      "Variance Lines",
      "Pending Recon",
      "Recount Pending",
      "High Impact Lines",
      "Threshold Exceeded Lines",
      "Net Variance Qty",
      "Net Variance Value",
      "Approval Owner",
      "Approval Remarks",
    ];

    const rows = filteredPlans.map((p) => {
      const m = planMetrics.get(p.plan_id);
      return [
        p.plan_no,
        p.plan_type,
        p.warehouse_id,
        `${p.scope_type} • ${p.scope_summary}`,
        p.scheduled_date,
        p.approval_status,
        m?.eligibleForApproval ? "Yes" : "No",
        m?.totalVarianceLines ?? 0,
        m?.pendingRecon ?? 0,
        m?.recountPending ?? 0,
        m?.highImpact ?? 0,
        m?.thresholdExceeded ?? 0,
        m?.netVarianceQty ?? 0,
        m?.netVarianceValue ?? 0,
        p.approval_owner,
        (p.approval_remarks || "").replaceAll(",", " "),
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ccp-approvals-queue.csv";
    a.click();
  };

  const approvalPillTone = (s: ApprovalStatus): Tone => {
    if (s === "Approved") return "green";
    if (s === "Rejected") return "red";
    if (s === "On Hold") return "gray";
    if (s === "Under Review") return "blue";
    return "amber"; // Pending
  };

  return (
    <div
  className="w-full max-w-[100vw] min-w-0 overflow-x-hidden"
  style={{ ["--app-topbar-h" as any]: "74px" }} // change 74px if your topbar is different
>
      <PageBreadcrumb pageTitle="Cycle Count • CCP Approvals" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-gray-800 truncate">CCP Approvals</h2>
            <p className="text-sm text-gray-500">
              Approve plans after reconciliation completion • Enforces segregation-of-duties • Unlocks Stock Adjustment Posting.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={classNames(primaryBtn)}
              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
              onClick={exportToCSV}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div>
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="Plan no / scope / type / warehouse"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div>
                <label className={labelBase}>Warehouse</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={warehouse}
                  onChange={(e) => {
                    setWarehouse(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {WAREHOUSES.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.id} • {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelBase}>Approval Status</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className={labelBase}>Risk Filter</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={risk}
                  onChange={(e) => {
                    setRisk(e.target.value as any);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="High Impact">High Impact</option>
                  <option value="Threshold Exceeded">Threshold Exceeded</option>
                  <option value="Recount Pending">Recount Pending</option>
                </select>
                <div className={classNames(helperBase, "mt-1")}>Use risk filters to focus audit-critical plans.</div>
              </div>
            </div>

            {/* Queue Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1300px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Warehouse</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-right">Variance Lines</th>
                    <th className="px-4 py-3 text-right">Net Qty</th>
                    <th className="px-4 py-3 text-right">Net Value</th>
                    <th className="px-4 py-3 text-left">Risk</th>
                    <th className="px-4 py-3 text-left">Eligibility</th>
                    <th className="px-4 py-3 text-left">Approval</th>
                    <th className="px-4 py-3 text-left">Open</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPlans.map((p) => {
                    const m = planMetrics.get(p.plan_id);
                    const eligible = !!m?.eligibleForApproval;

                    return (
                      <tr key={p.plan_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{p.plan_no}</div>
                          <div className="text-xs text-gray-500">
                            {p.plan_type} • {p.count_mode} • {p.scheduled_date}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <MiniPill text={p.plan_status} tone={p.plan_status === "Approved" ? "green" : p.plan_status === "Posted" ? "blue" : "purple"} />
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{p.warehouse_id}</div>
                          <div className="text-xs text-gray-500">{whName(p.warehouse_id)}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {p.scope_type} • {p.scope_summary}
                          </div>
                          <div className="text-xs text-gray-500">SKU Count: {p.sku_count}</div>
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">{m?.totalVarianceLines ?? 0}</td>
                        <td className="px-4 py-3 text-right font-semibold">{m?.netVarianceQty ?? 0}</td>
                        <td className="px-4 py-3 text-right font-semibold">{currencyINR(m?.netVarianceValue ?? 0)}</td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {(m?.highImpact ?? 0) > 0 ? <MiniPill text={`High Impact ${m?.highImpact}`} tone="amber" /> : <MiniPill text="No High Impact" tone="gray" />}
                            {(m?.thresholdExceeded ?? 0) > 0 ? (
                              <MiniPill text={`Threshold ${m?.thresholdExceeded}`} tone="red" />
                            ) : (
                              <MiniPill text="Within Threshold" tone="gray" />
                            )}
                            {(m?.recountPending ?? 0) > 0 ? <MiniPill text={`Recount Pending ${m?.recountPending}`} tone="blue" /> : <MiniPill text="No Recount Pending" tone="gray" />}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {eligible ? (
                            <div className="flex flex-col gap-1">
                              <MiniPill text="Eligible" tone="green" />
                              <div className="text-xs text-gray-500">Ready to approve</div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <MiniPill text="Not Eligible" tone="amber" />
                              <div className="text-xs text-gray-500">
                                Pending recon: {m?.pendingRecon ?? 0} • Recount pending: {m?.recountPending ?? 0}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <MiniPill text={p.approval_status} tone={approvalPillTone(p.approval_status)} />
                            <div className="text-xs text-gray-500 truncate">Owner: {p.approval_owner}</div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openPlan(p.plan_id)}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: FORTUNA_SECONDARY_BLUE }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedPlans.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                        No plans found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom controls */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing {filteredPlans.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredPlans.length)} of {filteredPlans.length} entries
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

            {/* Footer note */}
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
              <span className="font-semibold">Eligibility logic:</span> All lines must be reconciled (no Pending) and any
              recount-required lines must be Completed.
            </div>
          </div>

          {/* RIGHT */}
          <div className="min-w-0">
            <QuickStatsCard title={rightStats.title} stats={rightStats.stats} note={rightStats.note} />

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Approval Controls</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
              </div>

              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <label className={labelBase}>Default Approver (demo)</label>
                  <select className={classNames(inputBase, "mt-1")} defaultValue={APPROVERS[0].name}>
                    {APPROVERS.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <div className={classNames(helperBase, "mt-1")}>In real app: approver comes from RBAC role mapping.</div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  <span className="font-semibold">Note:</span> This module approves the plan (control layer). Posting is handled
                  in <span className="font-semibold">Stock Adjustment Posting</span>.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Modal: Plan Approval Detail ===== */}
        {isModalOpen && activePlan && activeMetrics && (
          <div
  className="fixed left-0 right-0 bottom-0 z-50 bg-black/40"
  style={{ top: "var(--app-topbar-h, 74px)" }}
>
            <div className="h-full w-full overflow-y-auto">
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col max-h-[92vh]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        Approve Plan • {activePlan.plan_no} • {activePlan.plan_type}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {activePlan.warehouse_id} • {whName(activePlan.warehouse_id)} • {activePlan.scope_type} •{" "}
                        {activePlan.scope_summary}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <MiniPill text={`Approval: ${activePlan.approval_status}`} tone={approvalPillTone(activePlan.approval_status)} />
                        {activeMetrics.eligibleForApproval ? <MiniPill text="Eligible" tone="green" /> : <MiniPill text="Not Eligible" tone="amber" />}
                        {(activeMetrics.highImpact ?? 0) > 0 ? <MiniPill text={`High Impact ${activeMetrics.highImpact}`} tone="amber" /> : <MiniPill text="No High Impact" tone="gray" />}
                        {(activeMetrics.thresholdExceeded ?? 0) > 0 ? (
                          <MiniPill text={`Threshold ${activeMetrics.thresholdExceeded}`} tone="red" />
                        ) : (
                          <MiniPill text="Within Threshold" tone="gray" />
                        )}
                        {(activeMetrics.recountPending ?? 0) > 0 ? (
                          <MiniPill text={`Recount Pending ${activeMetrics.recountPending}`} tone="blue" />
                        ) : (
                          <MiniPill text="No Recount Pending" tone="gray" />
                        )}
                      </div>
                    </div>

                    <button onClick={closeModal} className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100" aria-label="Close">
                      ✕
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
                      {/* Left: Summary + Decision */}
                      <div className="space-y-5">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Plan Summary</h4>
                          <div className="mt-3 space-y-2 text-sm">
                            <SummaryRow label="Plan No" value={activePlan.plan_no} />
                            <SummaryRow label="Plan Type" value={`${activePlan.plan_type} • ${activePlan.count_mode}`} />
                            <SummaryRow label="Warehouse" value={`${activePlan.warehouse_id} • ${whName(activePlan.warehouse_id)}`} />
                            <SummaryRow label="Scope" value={`${activePlan.scope_type} • ${activePlan.scope_summary}`} />
                            <SummaryRow label="Scheduled" value={activePlan.scheduled_date} />
                            <SummaryRow label="SKU Count" value={String(activePlan.sku_count)} />
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">KPI Snapshot</h4>
                          <div className="mt-3 space-y-2 text-sm">
                            <SummaryRow label="Variance Lines" value={String(activeMetrics.totalVarianceLines)} />
                            <SummaryRow label="Pending Recon" value={String(activeMetrics.pendingRecon)} />
                            <SummaryRow label="Recount Required" value={String(activeMetrics.recountRequired)} />
                            <SummaryRow label="Recount Pending" value={String(activeMetrics.recountPending)} />
                            <SummaryRow label="Net Variance Qty" value={String(activeMetrics.netVarianceQty)} />
                            <SummaryRow label="Net Variance Value" value={currencyINR(activeMetrics.netVarianceValue)} />
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                            <span className="font-semibold">Eligibility:</span>{" "}
                            {activeMetrics.eligibleForApproval
                              ? "All checks passed. You can approve this plan."
                              : "Not eligible yet. Complete pending reconciliation / recount first."}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-800">Approval Decision</h4>

                          <div className="mt-3 space-y-3">
                            <div>
                              <label className={labelBase}>Approval Status</label>
                              <select
                                className={classNames(inputBase, "mt-1")}
                                value={activePlan.approval_status}
                                onChange={(e) => updatePlan(activePlan.plan_id, { approval_status: e.target.value as ApprovalStatus })}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Under Review">Under Review</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <div className={classNames(helperBase, "mt-1")}>
                                Recommended: set <span className="font-semibold">Under Review</span> while checking high impact lines.
                              </div>
                            </div>

                            <div>
                              <label className={labelBase}>Approver</label>
                              <select
                                className={classNames(inputBase, "mt-1")}
                                value={activePlan.approval_owner}
                                onChange={(e) => updatePlan(activePlan.plan_id, { approval_owner: e.target.value })}
                              >
                                {APPROVERS.map((a) => (
                                  <option key={a.id} value={a.name}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={labelBase}>Remarks</label>
                              <textarea
                                className={classNames(inputBase, "mt-1 min-h-[110px] resize-y")}
                                value={activePlan.approval_remarks || ""}
                                onChange={(e) => updatePlan(activePlan.plan_id, { approval_remarks: e.target.value })}
                                placeholder="Approval comments / hold reason / rejection reason..."
                              />
                            </div>

                            {/* Guardrails (demo UI) */}
                            {!activeMetrics.eligibleForApproval && activePlan.approval_status === "Approved" ? (
                              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                <span className="font-semibold">Warning:</span> Plan not eligible yet. In real backend, approval
                                API should block this action.
                              </div>
                            ) : null}

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                              <span className="font-semibold">Audit trail:</span> store approval decision with user + timestamp.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Lines (Top impact) */}
                      <div className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">Variance Lines (sorted by impact)</h4>
                            <div className={classNames(helperBase, "mt-1")}>
                              Review high value impact and threshold-exceeded lines first.
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <MiniPill text={`Total ${activePlanLines.length}`} tone="gray" />
                            <MiniPill text={`High Impact ${activeMetrics.highImpact}`} tone={activeMetrics.highImpact > 0 ? "amber" : "gray"} />
                            <MiniPill text={`Pending Recon ${activeMetrics.pendingRecon}`} tone={activeMetrics.pendingRecon > 0 ? "amber" : "gray"} />
                          </div>
                        </div>

                        <div className="mt-4 w-full overflow-x-auto rounded-2xl border border-gray-200">
                          <table className="min-w-[1100px] w-full border-collapse text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left">Item</th>
                                <th className="px-4 py-3 text-left">Scope</th>
                                <th className="px-4 py-3 text-right">System</th>
                                <th className="px-4 py-3 text-right">Final</th>
                                <th className="px-4 py-3 text-right">Var</th>
                                <th className="px-4 py-3 text-right">%</th>
                                <th className="px-4 py-3 text-right">Value</th>
                                <th className="px-4 py-3 text-left">Recount</th>
                                <th className="px-4 py-3 text-left">Recon</th>
                                <th className="px-4 py-3 text-left">Flags</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activePlanLines.map((l: any) => {
                                const varianceTone: Tone =
                                  Math.abs(l.variance_pct) >= 5 ? "red" : Math.abs(l.variance_pct) >= 2.5 ? "amber" : "gray";

                                const recountTone: Tone =
                                  l.recount_status === "Completed"
                                    ? "green"
                                    : l.recount_status === "In Progress"
                                    ? "blue"
                                    : l.recount_status === "Queued"
                                    ? "amber"
                                    : "gray";

                                const reconTone: Tone =
                                  l.reconciliation_status === "Accepted"
                                    ? "green"
                                    : l.reconciliation_status === "Adjusted"
                                    ? "blue"
                                    : l.reconciliation_status === "Rejected"
                                    ? "red"
                                    : "amber";

                                return (
                                  <tr key={l.line_id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-gray-900">{l.item_id}</div>
                                      <div className="text-xs text-gray-500">{l.item_desc}</div>
                                      <div className="mt-1 text-xs text-gray-500">Category: {l.category}</div>
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-gray-900">{l.scope_ref}</div>
                                      <div className="text-xs text-gray-500">{l.warehouse_id}</div>
                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold">{l.system_qty}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{l.counted_qty}</td>

                                    <td className="px-4 py-3 text-right font-semibold">{l.variance_qty}</td>

                                    <td className="px-4 py-3 text-right">
                                      <MiniPill text={`${Number(l.variance_pct).toFixed(2)}%`} tone={varianceTone} />
                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold">{currencyINR(Number(l.variance_value || 0))}</td>

                                    <td className="px-4 py-3">
                                      {l.recount_required ? (
                                        <div className="flex flex-col gap-1">
                                          <MiniPill text={l.recount_status} tone={recountTone} />
                                          <div className="text-xs text-gray-500">Required</div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-1">
                                          <MiniPill text="Not Required" tone="gray" />
                                          <div className="text-xs text-gray-500">—</div>
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-1">
                                        <MiniPill text={l.reconciliation_status} tone={reconTone} />
                                        <div className="text-xs text-gray-500">{l.reconciliation_action || "—"}</div>
                                      </div>
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-2">
                                        {l.highImpact ? <MiniPill text="High Impact" tone="amber" /> : <MiniPill text="Normal" tone="gray" />}
                                        {l.threshold_exceeded ? <MiniPill text="Threshold" tone="red" /> : <MiniPill text="Within" tone="gray" />}
                                        {l.system_qty === 0 && l.counted_qty > 0 ? <MiniPill text="Found Stock" tone="purple" /> : null}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}

                              {activePlanLines.length === 0 ? (
                                <tr>
                                  <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                                    No lines found for this plan.
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                          <span className="font-semibold">Tip:</span> If you want stricter governance, you can block approval when
                          High Impact lines exist unless Finance approver is selected.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t bg-white px-5 py-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <button type="button" className={outlineBtn} onClick={closeModal}>
                        Close
                      </button>

                      <div className="flex w-full sm:w-auto gap-2">
                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-1/2 sm:w-auto")}
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                          onClick={() => {
                            alert("Saved (demo). Next: connect API to persist approval decision.");
                            closeModal();
                          }}
                        >
                          Save (Demo)
                        </button>

                        <button
                          type="button"
                          disabled={!activeMetrics.eligibleForApproval}
                          className={classNames(
                            primaryBtn,
                            "w-1/2 sm:w-auto",
                            !activeMetrics.eligibleForApproval && "opacity-50 cursor-not-allowed"
                          )}
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                          onClick={() => {
                            updatePlan(activePlan.plan_id, {
                              approval_status: "Approved",
                              plan_status: "Approved",
                              approval_remarks: activePlan.approval_remarks || "Approved for posting",
                            });
                            alert("Approved (demo). Next: Posting module becomes enabled for this plan.");
                            closeModal();
                          }}
                        >
                          Approve (Demo)
                        </button>
                      </div>
                    </div>

                    <div className={classNames(helperBase, "mt-2")}>
                      Modal uses internal scroll — header/footer never hide.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ===== End Modal ===== */}
      </div>
    </div>
  );
}