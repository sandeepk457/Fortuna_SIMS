"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** ===== Fortuna Theme ===== */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** ===== Types ===== */
type AdjustmentType = "IN" | "OUT";
type PostStatus = "Ready" | "Posted" | "Failed" | "Skipped";

type Plan = {
  plan_id: string;
  plan_no: string;
  warehouse_id: string;
  warehouse_name: string;
  status: "Awaiting Approval" | "Approved" | "Posted";
  scheduled_date: string;
};

type PostingLine = {
  line_id: string;
  plan_id: string;
  plan_no: string;

  warehouse_id: string;
  warehouse_name: string;

  scope_ref: string;
  item_id: string;
  item_desc: string;
  uom: string;

  system_qty: number;
  final_count: number;
  variance_qty: number;

  unit_cost: number;
  variance_value: number;

  reconciliation_action: "Accept Count" | "Adjust Stock" | "Reject Count";
  approval_status: "Approved" | "On Hold";

  adjustment_type: AdjustmentType | "—";
  adjustment_qty: number;
  reference: string;

  post_status: PostStatus;
  posted_by?: string;
  posted_at?: string;
  error?: string;
};

type AdjustmentBatch = {
  batch_id: string;
  batch_no: string;
  plan_id: string;
  plan_no: string;

  warehouse_id: string;
  posting_date: string;
  posting_status: "Draft" | "Posted" | "Failed";

  total_lines: number;
  net_variance_qty: number;
  net_variance_value: number;

  created_by: string;
  created_at: string;
  posted_by?: string;
  posted_at?: string;

  remarks?: string;
};

type AdjustmentBatchLine = {
  batch_line_id: string;
  batch_id: string;

  source_line_id: string;
  item_id: string;
  item_desc: string;
  uom: string;

  adjustment_type: "IN" | "OUT";
  adjustment_qty: number;
  unit_cost: number;

  /** signed value: OUT negative */
  line_value: number;

  scope_ref: string;
  reference: string;
};

type GeneratedBatchResult = {
  header: AdjustmentBatch;
  lines: AdjustmentBatchLine[];
};

/** ===== Masters ===== */
const WAREHOUSES = [
  { id: "WH-001", name: "Vizag Central WH", active: true },
  { id: "WH-002", name: "Hyderabad WH", active: true },
  { id: "WH-003", name: "Chennai WH", active: false },
] as const;

/** ===== UI styles ===== */
const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/20 focus:border-[#005F99]/40";

const labelBase = "text-xs font-semibold text-gray-700";
const helperBase = "text-[11px] text-gray-500";

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition active:scale-95";

const outlineBtn =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition active:scale-95";

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function MiniPill({
  text,
  tone,
}: {
  text: string;
  tone: "red" | "blue" | "amber" | "green" | "gray";
}) {
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
      : "bg-gray-100 text-gray-700";
  return <span className={classNames(base, cls)}>{text}</span>;
}

function currencyINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

function nowISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function uuid() {
  return "UUID-" + Math.random().toString(16).slice(2) + "-" + Date.now();
}

function makeBatchNo() {
  const yyyy = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900000) + 100000);
  return `ADJ-${yyyy}-${seq}`;
}

/** ===== Demo Data ===== */
const SAMPLE_PLANS: Plan[] = [
  {
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    warehouse_name: "Vizag Central WH",
    status: "Approved",
    scheduled_date: "2026-02-10",
  },
  {
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    warehouse_name: "Hyderabad WH",
    status: "Approved",
    scheduled_date: "2026-02-14",
  },
  {
    plan_id: "CCP-UUID-0003",
    plan_no: "PA-2026-0005",
    warehouse_id: "WH-003",
    warehouse_name: "Chennai WH",
    status: "Approved",
    scheduled_date: "2026-01-28",
  },
];

const RAW_LINES = [
  {
    line_id: "VL-1001",
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    warehouse_name: "Vizag Central WH",
    scope_ref: "ITEM SCOPE • FAST MOVING (A-class)",
    item_id: "SKU-31782",
    item_desc: "Industrial Bag",
    uom: "Nos",
    system_qty: 976,
    final_count: 958,
    unit_cost: 574,
    reconciliation_action: "Adjust Stock" as const,
    approval_status: "Approved" as const,
    post_status: "Ready" as const,
  },
  {
    line_id: "VL-1002",
    plan_id: "CCP-UUID-0002",
    plan_no: "CC-2026-0006",
    warehouse_id: "WH-001",
    warehouse_name: "Vizag Central WH",
    scope_ref: "ITEM SCOPE • FAST MOVING (A-class)",
    item_id: "SKU-52936",
    item_desc: "Premium Bag",
    uom: "Nos",
    system_qty: 474,
    final_count: 465,
    unit_cost: 800,
    reconciliation_action: "Accept Count" as const,
    approval_status: "Approved" as const,
    post_status: "Skipped" as const,
  },
  {
    line_id: "VL-2001",
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    warehouse_name: "Hyderabad WH",
    scope_ref: "BIN Z-A-01-03",
    item_id: "SKU-10021",
    item_desc: "HDPE Bottle 1L",
    uom: "Nos",
    system_qty: 1200,
    final_count: 1120,
    unit_cost: 25,
    reconciliation_action: "Adjust Stock" as const,
    approval_status: "Approved" as const,
    post_status: "Ready" as const,
  },
  {
    line_id: "VL-2002",
    plan_id: "CCP-UUID-0001",
    plan_no: "CC-2026-0007",
    warehouse_id: "WH-002",
    warehouse_name: "Hyderabad WH",
    scope_ref: "BIN Z-A-01-04",
    item_id: "SKU-33011",
    item_desc: "Carton Box 5-ply",
    uom: "Nos",
    system_qty: 500,
    final_count: 498,
    unit_cost: 18,
    reconciliation_action: "Adjust Stock" as const,
    approval_status: "Approved" as const,
    post_status: "Ready" as const,
  },
  {
    line_id: "VL-3001",
    plan_id: "CCP-UUID-0003",
    plan_no: "PA-2026-0005",
    warehouse_id: "WH-003",
    warehouse_name: "Chennai WH",
    scope_ref: "BIN Z-C-03-05-01",
    item_id: "SKU-81552",
    item_desc: "Premium Kit",
    uom: "Nos",
    system_qty: 395,
    final_count: 381,
    unit_cost: 918,
    reconciliation_action: "Adjust Stock" as const,
    approval_status: "Approved" as const,
    post_status: "Ready" as const,
  },
];

function buildLines(): PostingLine[] {
  return RAW_LINES.map((x) => {
    const variance_qty = x.final_count - x.system_qty;
    const adjustment_type: AdjustmentType | "—" =
      variance_qty > 0 ? "IN" : variance_qty < 0 ? "OUT" : "—";
    const adjustment_qty = Math.abs(variance_qty);
    const variance_value = variance_qty * x.unit_cost;

    return {
      ...x,
      variance_qty,
      adjustment_type,
      adjustment_qty,
      variance_value,
      reference: `${x.plan_no}:${x.line_id}`,
    };
  });
}

/** ===== Page ===== */
export default function StockAdjustmentPostingPage() {
  const [plans] = useState<Plan[]>(SAMPLE_PLANS);
  const [lines, setLines] = useState<PostingLine[]>(() => buildLines());

  // Filters
  const [warehouse, setWarehouse] = useState<string>("All");
  const [plan, setPlan] = useState<string>("All");
  const [status, setStatus] = useState<PostStatus | "All">("All");
  const [search, setSearch] = useState<string>("");
  const [onlyAdjustable, setOnlyAdjustable] = useState<boolean>(true);

  // Selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Batches
  const [generatedBatches, setGeneratedBatches] = useState<GeneratedBatchResult[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string>("");

  const isWarehouseActive = (whId: string) =>
    WAREHOUSES.find((w) => w.id === whId)?.active ?? true;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return lines.filter((l) => {
      const byWh = warehouse === "All" ? true : l.warehouse_id === warehouse;
      const byPlan = plan === "All" ? true : l.plan_id === plan;
      const byStatus = status === "All" ? true : l.post_status === status;
      const byAdj = onlyAdjustable ? l.reconciliation_action === "Adjust Stock" : true;

      const bySearch =
        !q ||
        l.plan_no.toLowerCase().includes(q) ||
        l.item_id.toLowerCase().includes(q) ||
        l.item_desc.toLowerCase().includes(q) ||
        l.scope_ref.toLowerCase().includes(q) ||
        l.reference.toLowerCase().includes(q);

      return byWh && byPlan && byStatus && byAdj && bySearch;
    });
  }, [lines, warehouse, plan, status, search, onlyAdjustable]);

  const stats = useMemo(() => {
    const base = filtered;
    const ready = base.filter((x) => x.post_status === "Ready").length;
    const posted = base.filter((x) => x.post_status === "Posted").length;
    const failed = base.filter((x) => x.post_status === "Failed").length;

    const netQty = base.reduce((s, x) => s + x.variance_qty, 0);
    const netValue = base.reduce((s, x) => s + x.variance_value, 0);
    const inactiveWh = base.filter((x) => !isWarehouseActive(x.warehouse_id)).length;

    const selectedCount = Object.keys(selected).filter((id) => selected[id]).length;

    return { total: base.length, ready, posted, failed, netQty, netValue, inactiveWh, selectedCount };
  }, [filtered, selected]);

  const toggleAll = (checked: boolean) => {
    const map: Record<string, boolean> = {};
    filtered.forEach((l) => {
      const selectable =
        l.post_status === "Ready" &&
        isWarehouseActive(l.warehouse_id) &&
        l.reconciliation_action === "Adjust Stock" &&
        l.adjustment_qty > 0 &&
        l.adjustment_type !== "—";
      map[l.line_id] = selectable ? checked : false;
    });
    setSelected(map);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const exportCSV = () => {
    const header = [
      "Plan No",
      "Warehouse",
      "Scope Ref",
      "Item",
      "System Qty",
      "Final Count",
      "Variance Qty",
      "Adjustment Type",
      "Adjustment Qty",
      "Variance Value",
      "Recon Action",
      "Post Status",
      "Reference",
      "Posted By",
      "Posted At",
      "Error",
    ];

    const rows = filtered.map((l) =>
      [
        l.plan_no,
        l.warehouse_id,
        l.scope_ref,
        l.item_id,
        l.system_qty,
        l.final_count,
        l.variance_qty,
        l.adjustment_type,
        l.adjustment_qty,
        l.variance_value,
        l.reconciliation_action,
        l.post_status,
        l.reference,
        l.posted_by || "",
        l.posted_at || "",
        (l.error || "").replaceAll(",", " "),
      ].join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stock-adjustment-posting.csv";
    a.click();
  };

  const postSelectedDemo = () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (ids.length === 0) {
      alert("Select at least one READY line to post.");
      return;
    }

    const selectedLines = lines.filter((l) => ids.includes(l.line_id));

    const eligible = selectedLines.filter((l) => {
      const whActive = isWarehouseActive(l.warehouse_id);
      const isReady = l.post_status === "Ready";
      const isAdjust = l.reconciliation_action === "Adjust Stock";
      const hasQty = l.adjustment_qty > 0 && l.adjustment_type !== "—";
      return whActive && isReady && isAdjust && hasQty;
    });

    if (eligible.length === 0) {
      alert("No eligible lines. Must be Ready + Adjust Stock + Active WH + Qty > 0.");
      return;
    }

    // Group by plan_id (1 batch per plan)
    const byPlan = new Map<string, PostingLine[]>();
    for (const l of eligible) {
      if (!byPlan.has(l.plan_id)) byPlan.set(l.plan_id, []);
      byPlan.get(l.plan_id)!.push(l);
    }

    const results: GeneratedBatchResult[] = [];

    byPlan.forEach((planLines, planId) => {
      const first = planLines[0];

      const batch_id = uuid();
      const header: AdjustmentBatch = {
        batch_id,
        batch_no: makeBatchNo(),
        plan_id: planId,
        plan_no: first.plan_no,
        warehouse_id: first.warehouse_id,
        posting_date: new Date().toISOString().slice(0, 10),
        posting_status: "Posted",
        total_lines: planLines.length,
        net_variance_qty: planLines.reduce((s, x) => s + x.variance_qty, 0),
        net_variance_value: planLines.reduce((s, x) => s + x.variance_value, 0),
        created_by: "System",
        created_at: nowISO(),
        posted_by: "System",
        posted_at: nowISO(),
        remarks: "Demo batch posting",
      };

      const batchLines: AdjustmentBatchLine[] = planLines.map((l) => ({
        batch_line_id: uuid(),
        batch_id,
        source_line_id: l.line_id,
        item_id: l.item_id,
        item_desc: l.item_desc,
        uom: l.uom,
        adjustment_type: l.adjustment_type as "IN" | "OUT",
        adjustment_qty: l.adjustment_qty,
        unit_cost: l.unit_cost,
        line_value: l.adjustment_qty * l.unit_cost * (l.adjustment_type === "OUT" ? -1 : 1),
        scope_ref: l.scope_ref,
        reference: l.reference,
      }));

      results.push({ header, lines: batchLines });
    });

    // Mark lines
    setLines((prev) =>
      prev.map((l) => {
        if (!ids.includes(l.line_id)) return l;

        const isEligible = eligible.some((x) => x.line_id === l.line_id);
        if (!isEligible) {
          if (!isWarehouseActive(l.warehouse_id)) return { ...l, post_status: "Failed", error: "Warehouse inactive" };
          if (l.post_status !== "Ready") return { ...l, post_status: "Failed", error: "Not Ready" };
          if (l.reconciliation_action !== "Adjust Stock") return { ...l, post_status: "Skipped" };
          if (l.adjustment_qty === 0 || l.adjustment_type === "—") return { ...l, post_status: "Skipped" };
          return { ...l, post_status: "Failed", error: "Not eligible" };
        }

        return { ...l, post_status: "Posted", posted_by: "System", posted_at: nowISO(), error: "" };
      })
    );

    setGeneratedBatches((prev) => [...results, ...prev]);
    setSelected({});
    alert(`Posted (Demo): ${results.length} batch(es) created (1 per plan).`);
  };

  const openBatch = (batchId: string) => {
    setActiveBatchId(batchId);
    setIsBatchModalOpen(true);
  };

  const closeBatch = () => {
    setIsBatchModalOpen(false);
    setActiveBatchId("");
  };

  const activeBatch = useMemo(
    () => generatedBatches.find((b) => b.header.batch_id === activeBatchId),
    [generatedBatches, activeBatchId]
  );

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden">
      <PageBreadcrumb pageTitle="Cycle Count • Stock Adjustment Posting" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-gray-800 truncate">Stock Adjustment Posting</h2>
            <p className="text-sm text-gray-500">
              Creates <span className="font-semibold">1 batch header per plan</span> + multiple lines. Posting is immutable (reversal via new adjustment).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryBtn}
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
              onClick={exportCSV}
            >
              Export CSV
            </button>

            <button
              type="button"
              className={primaryBtn}
              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
              onClick={postSelectedDemo}
            >
              Post Selected (Demo)
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div className="min-w-0">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className={labelBase}>Search</label>
                <input
                  className={classNames(inputBase, "mt-1")}
                  placeholder="Plan / Item / BIN / Ref / Description"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div>
                <label className={labelBase}>Warehouse</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                >
                  <option value="All">All</option>
                  {WAREHOUSES.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.id} • {w.name} {w.active ? "" : "(Inactive)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelBase}>Plan</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                >
                  <option value="All">All</option>
                  {plans.map((p) => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.plan_no} • {p.warehouse_id} • {p.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelBase}>Post Status</label>
                <select
                  className={classNames(inputBase, "mt-1")}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="All">All</option>
                  <option value="Ready">Ready</option>
                  <option value="Posted">Posted</option>
                  <option value="Failed">Failed</option>
                  <option value="Skipped">Skipped</option>
                </select>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id="onlyAdjust"
                    type="checkbox"
                    checked={onlyAdjustable}
                    onChange={(e) => setOnlyAdjustable(e.target.checked)}
                  />
                  <label htmlFor="onlyAdjust" className="text-sm text-gray-700">
                    Show only “Adjust Stock” lines
                  </label>
                </div>

                <div className={helperBase}>
                  Selection allowed only for <span className="font-semibold">Ready</span> + <span className="font-semibold">Active WH</span> + qty &gt; 0.
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[1500px] w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} />
                        Select
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Plan / Scope</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-right">System</th>
                    <th className="px-4 py-3 text-right">Final</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                    <th className="px-4 py-3 text-left">Adjustment</th>
                    <th className="px-4 py-3 text-right">Adj Qty</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3 text-left">Post</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((l) => {
                    const selectable =
                      l.post_status === "Ready" &&
                      isWarehouseActive(l.warehouse_id) &&
                      l.reconciliation_action === "Adjust Stock" &&
                      l.adjustment_qty > 0 &&
                      l.adjustment_type !== "—";

                    const varTone =
                      l.variance_qty === 0 ? "gray" : l.variance_qty < 0 ? "red" : "green";

                    const adjTone =
                      l.adjustment_type === "IN"
                        ? "green"
                        : l.adjustment_type === "OUT"
                        ? "red"
                        : "gray";

                    const postTone =
                      l.post_status === "Posted"
                        ? "green"
                        : l.post_status === "Ready"
                        ? "blue"
                        : l.post_status === "Failed"
                        ? "red"
                        : "gray";

                    return (
                      <tr key={l.line_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={!!selected[l.line_id]}
                            disabled={!selectable}
                            onChange={(e) => toggleOne(l.line_id, e.target.checked)}
                          />
                          {!isWarehouseActive(l.warehouse_id) ? (
                            <div className="mt-2">
                              <MiniPill text="Warehouse Inactive" tone="amber" />
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{l.plan_no}</div>
                          <div className="text-xs text-gray-500">
                            {l.warehouse_id} • {l.scope_ref}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <MiniPill
                              text={l.reconciliation_action}
                              tone={l.reconciliation_action === "Adjust Stock" ? "blue" : "gray"}
                            />
                            <MiniPill text={l.approval_status} tone="green" />
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{l.item_id}</div>
                          <div className="text-xs text-gray-500">{l.item_desc}</div>
                          <div className="text-xs text-gray-500">{l.uom}</div>
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">{l.system_qty}</td>
                        <td className="px-4 py-3 text-right font-semibold">{l.final_count}</td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold">{l.variance_qty}</div>
                          <div className="mt-1">
                            <MiniPill
                              text={l.variance_qty === 0 ? "0" : l.variance_qty < 0 ? "Decrease" : "Increase"}
                              tone={varTone as any}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <MiniPill
                            text={l.adjustment_type === "—" ? "No Adj" : `Adj ${l.adjustment_type}`}
                            tone={adjTone as any}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {l.adjustment_type === "IN"
                              ? "Stock Increase"
                              : l.adjustment_type === "OUT"
                              ? "Stock Decrease"
                              : "No change"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">{l.adjustment_qty}</td>

                        <td className="px-4 py-3 text-right font-semibold">{currencyINR(l.variance_value)}</td>

                        <td className="px-4 py-3">
                          <MiniPill text={l.post_status} tone={postTone as any} />
                          {l.post_status === "Posted" ? (
                            <div className="text-xs text-gray-500 mt-1">
                              {l.posted_by} • {l.posted_at}
                            </div>
                          ) : null}
                          {l.post_status === "Failed" && l.error ? (
                            <div className="text-xs text-rose-600 mt-1">{l.error}</div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{l.reference}</div>
                          <div className="text-xs text-gray-500">{l.line_id}</div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                        No records found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
              <span className="font-semibold">Batch Rule:</span> 1 header per plan, line-items derived from variance lines where action = Adjust Stock.
              <br />
              <span className="font-semibold">Posting:</span> Immutable. Reversal only via new adjustment (Admin role).
            </div>
          </div>

          {/* RIGHT */}
          <div className="min-w-0 space-y-4">
            {/* Quick Stats */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Quick Stats • Posting</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <Stat label="Total Lines" value={stats.total} pillBg="#E8F0FE" />
                <Stat label="Ready" value={stats.ready} pillBg="#E8F0FE" />
                <Stat label="Posted" value={stats.posted} pillBg="#E9FBEA" />
                <Stat label="Failed" value={stats.failed} pillBg="#FFE8EC" />

                <div className="my-3 border-t border-gray-100" />

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Net Variance Qty</span>
                  <span className="font-semibold text-gray-900">{stats.netQty}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Net Variance Value</span>
                  <span className="font-semibold text-gray-900">{currencyINR(stats.netValue)}</span>
                </div>

                {stats.inactiveWh > 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <span className="font-semibold">Warning:</span> {stats.inactiveWh} line(s) belong to an inactive warehouse.
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                    <span className="font-semibold">Note:</span> Select only Ready lines in Active warehouses.
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700">
                  <div className="font-semibold mb-1">Selected</div>
                  <div className="text-gray-600">{stats.selectedCount} line(s)</div>
                </div>

                <button
                  type="button"
                  className={classNames(primaryBtn, "w-full")}
                  style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                  onClick={postSelectedDemo}
                >
                  Post Selected (Demo)
                </button>

                <button
                  type="button"
                  className={classNames(outlineBtn, "w-full")}
                  onClick={() => setSelected({})}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Latest Batches */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Latest Posted Batches</h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
              </div>

              <div className="mt-3 space-y-2">
                {generatedBatches.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    No batches yet. Post selected lines to create batch headers.
                  </div>
                ) : (
                  generatedBatches.slice(0, 6).map((b) => (
                    <button
                      key={b.header.batch_id}
                      type="button"
                      onClick={() => openBatch(b.header.batch_id)}
                      className="w-full text-left rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{b.header.batch_no}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {b.header.plan_no} • {b.header.warehouse_id} • {b.header.posting_date}
                          </div>
                        </div>
                        <MiniPill text="Posted" tone="green" />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                        <span>Lines: <span className="font-semibold">{b.header.total_lines}</span></span>
                        <span>Net: <span className="font-semibold">{currencyINR(b.header.net_variance_value)}</span></span>
                      </div>
                    </button>
                  ))
                )}

                <div className={classNames(helperBase, "mt-2")}>
                  Click a batch to preview header + lines.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Batch Preview Modal ===== */}
        {isBatchModalOpen && activeBatch && (
          <div className="fixed inset-0 z-50 bg-black/40">
            <div className="h-full w-full overflow-y-auto">
              <div className="min-h-full w-full flex items-start justify-center py-4 px-3 sm:px-6">
                <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col max-h-[92vh]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b bg-white rounded-t-2xl">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        Batch Preview • {activeBatch.header.batch_no}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {activeBatch.header.plan_no} • {activeBatch.header.warehouse_id} • {activeBatch.header.posting_date}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <MiniPill text="Posted" tone="green" />
                        <MiniPill text={`Lines: ${activeBatch.header.total_lines}`} tone="blue" />
                        <MiniPill text={`Net Qty: ${activeBatch.header.net_variance_qty}`} tone="gray" />
                        <MiniPill text={`Net Value: ${currencyINR(activeBatch.header.net_variance_value)}`} tone="gray" />
                      </div>
                    </div>

                    <button
                      onClick={closeBatch}
                      className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Header Summary */}
                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Header</h4>
                        <div className="mt-3 space-y-2 text-sm">
                          <Row label="Batch No" value={activeBatch.header.batch_no} />
                          <Row label="Plan No" value={activeBatch.header.plan_no} />
                          <Row label="Warehouse" value={activeBatch.header.warehouse_id} />
                          <Row label="Posting Date" value={activeBatch.header.posting_date} />
                          <Row label="Created By" value={activeBatch.header.created_by} />
                          <Row label="Created At" value={activeBatch.header.created_at} />
                          <Row label="Posted By" value={activeBatch.header.posted_by || "—"} />
                          <Row label="Posted At" value={activeBatch.header.posted_at || "—"} />
                          <Row label="Remarks" value={activeBatch.header.remarks || "—"} />
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-800">Totals</h4>
                        <div className="mt-3 space-y-2 text-sm">
                          <Row label="Total Lines" value={String(activeBatch.header.total_lines)} />
                          <Row label="Net Variance Qty" value={String(activeBatch.header.net_variance_qty)} />
                          <Row label="Net Variance Value" value={currencyINR(activeBatch.header.net_variance_value)} />
                        </div>

                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                          <span className="font-semibold">Note:</span> Line value is signed (OUT negative), so totals reflect real impact.
                        </div>
                      </div>
                    </div>

                    {/* Lines table */}
                    <div className="mt-5 w-full overflow-x-auto rounded-2xl border border-gray-200">
                      <table className="min-w-[1100px] w-full border-collapse text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left">Item</th>
                            <th className="px-4 py-3 text-left">Scope</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3 text-right">Unit Cost</th>
                            <th className="px-4 py-3 text-right">Line Value</th>
                            <th className="px-4 py-3 text-left">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBatch.lines.map((ln) => (
                            <tr key={ln.batch_line_id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{ln.item_id}</div>
                                <div className="text-xs text-gray-500">{ln.item_desc}</div>
                                <div className="text-xs text-gray-500">{ln.uom}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-800">{ln.scope_ref}</div>
                              </td>
                              <td className="px-4 py-3">
                                <MiniPill text={ln.adjustment_type} tone={ln.adjustment_type === "IN" ? "green" : "red"} />
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">{ln.adjustment_qty}</td>
                              <td className="px-4 py-3 text-right font-semibold">{currencyINR(ln.unit_cost)}</td>
                              <td className="px-4 py-3 text-right font-semibold">{currencyINR(ln.line_value)}</td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{ln.reference}</div>
                                <div className="text-xs text-gray-500">{ln.source_line_id}</div>
                              </td>
                            </tr>
                          ))}
                          {activeBatch.lines.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                No line items.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t bg-white px-5 py-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <button type="button" className={outlineBtn} onClick={closeBatch}>
                        Close
                      </button>

                      <button
                        type="button"
                        className={primaryBtn}
                        style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                        onClick={() => alert("Demo: Print/Export batch PDF/CSV can be added next.")}
                      >
                        Export Batch (Demo)
                      </button>
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
        {/* ===== End Batch Modal ===== */}
      </div>
    </div>
  );
}

/** ===== Small UI atoms ===== */
function Stat({ label, value, pillBg }: { label: string; value: number | string; pillBg: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: pillBg }}>
        {value}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}