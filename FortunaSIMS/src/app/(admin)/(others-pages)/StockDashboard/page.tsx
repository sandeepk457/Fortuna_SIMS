"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme (minimal accents) */
const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

type Warehouse = "Vizag WH" | "Hyderabad WH" | "Chennai WH";
type Category = "Machinery" | "Safety" | "Packaging" | "Electrical";

type SKU = {
  sku: string;
  name: string;
  category: Category;
  uom: string;
  unitCost: number;
  reorderLevel: number;
};

type StockByWH = Record<Warehouse, number>;

/** Movement is already aggregated. We’ll treat outX as “outflow in selected window”. */
type Movement = {
  sku: string;
  lastMoveDate: string; // yyyy-mm-dd
  in7: number;
  out7: number;
  in30: number;
  out30: number;
  in90: number;
  out90: number;
};

function cn(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function inr(n: number) {
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

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysDiff(fromISO: string, toISO: string) {
  const a = new Date(fromISO);
  const b = new Date(toISO);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-[rgba(0,95,153,0.12)] " +
  "focus:border-[rgba(0,95,153,0.45)] dark:bg-gray-950 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

export default function StockDashboardCorporateV2() {
  const today = todayISO();
  const whs: Warehouse[] = ["Vizag WH", "Hyderabad WH", "Chennai WH"];

  /** Filters */
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const [warehouse, setWarehouse] = useState<Warehouse | "All">("All");
  const [range, setRange] = useState<7 | 30 | 90>(30);

  /** Demo master */
  const [skus] = useState<SKU[]>([
    { sku: "ITM-001", name: "Industrial Pump", category: "Machinery", uom: "Nos", unitCost: 18000, reorderLevel: 8 },
    { sku: "ITM-002", name: "Safety Helmet", category: "Safety", uom: "Nos", unitCost: 450, reorderLevel: 20 },
    { sku: "ITM-003", name: "Gear Box", category: "Machinery", uom: "Nos", unitCost: 24000, reorderLevel: 3 },
    { sku: "ITM-004", name: "Hand Gloves", category: "Safety", uom: "Pairs", unitCost: 120, reorderLevel: 30 },
    { sku: "ITM-005", name: "Packing Tape", category: "Packaging", uom: "Nos", unitCost: 80, reorderLevel: 25 },
    { sku: "ITM-006", name: "MCB 32A", category: "Electrical", uom: "Nos", unitCost: 220, reorderLevel: 15 },
    { sku: "ITM-007", name: "Air Compressor", category: "Machinery", uom: "Nos", unitCost: 52000, reorderLevel: 2 },
    { sku: "ITM-008", name: "Stretch Film Roll", category: "Packaging", uom: "Nos", unitCost: 550, reorderLevel: 12 },
  ]);

  const [stock] = useState<Record<string, StockByWH>>({
    "ITM-001": { "Vizag WH": 6, "Hyderabad WH": 5, "Chennai WH": 0 },
    "ITM-002": { "Vizag WH": 12, "Hyderabad WH": 4, "Chennai WH": 2 },
    "ITM-003": { "Vizag WH": 0, "Hyderabad WH": 1, "Chennai WH": 0 },
    "ITM-004": { "Vizag WH": 20, "Hyderabad WH": 15, "Chennai WH": 40 },
    "ITM-005": { "Vizag WH": 8, "Hyderabad WH": 0, "Chennai WH": 5 },
    "ITM-006": { "Vizag WH": 10, "Hyderabad WH": 24, "Chennai WH": 3 },
    "ITM-007": { "Vizag WH": 1, "Hyderabad WH": 0, "Chennai WH": 0 },
    "ITM-008": { "Vizag WH": 0, "Hyderabad WH": 10, "Chennai WH": 4 },
  });

  const [movement] = useState<Movement[]>([
    { sku: "ITM-001", lastMoveDate: "2026-02-08", in7: 4, out7: 6, in30: 12, out30: 18, in90: 20, out90: 30 },
    { sku: "ITM-002", lastMoveDate: "2026-02-07", in7: 10, out7: 14, in30: 30, out30: 42, in90: 60, out90: 88 },
    { sku: "ITM-003", lastMoveDate: "2025-11-25", in7: 0, out7: 0, in30: 0, out30: 0, in90: 0, out90: 0 }, // dead
    { sku: "ITM-004", lastMoveDate: "2026-02-06", in7: 6, out7: 3, in30: 20, out30: 12, in90: 35, out90: 28 },
    { sku: "ITM-005", lastMoveDate: "2026-01-10", in7: 0, out7: 0, in30: 0, out30: 3, in90: 12, out90: 14 }, // slow
    { sku: "ITM-006", lastMoveDate: "2026-02-08", in7: 5, out7: 9, in30: 15, out30: 27, in90: 28, out90: 52 },
    { sku: "ITM-007", lastMoveDate: "2025-10-02", in7: 0, out7: 0, in30: 0, out30: 0, in90: 0, out90: 0 }, // dead
    { sku: "ITM-008", lastMoveDate: "2026-02-01", in7: 4, out7: 2, in30: 14, out30: 9, in90: 25, out90: 21 },
  ]);

  const mMap = useMemo(() => new Map(movement.map((m) => [m.sku, m])), [movement]);

  const metricForRange = (m: Movement) => {
    if (range === 7) return { inX: m.in7, outX: m.out7 };
    if (range === 30) return { inX: m.in30, outX: m.out30 };
    return { inX: m.in90, outX: m.out90 };
  };

  /** Build rows (filtered + computed) */
  const rows = useMemo(() => {
    return skus
      .filter((x) => {
        const s = (x.sku + " " + x.name).toLowerCase();
        return s.includes(search.toLowerCase()) && (cat ? x.category === cat : true);
      })
      .map((x) => {
        const byWh = stock[x.sku] ?? { "Vizag WH": 0, "Hyderabad WH": 0, "Chennai WH": 0 };

        const onHandAll = whs.reduce((sum, w) => sum + (byWh[w] ?? 0), 0);
        const onHandSelected = warehouse === "All" ? onHandAll : (byWh[warehouse] ?? 0);

        const valueAll = onHandAll * x.unitCost;
        const valueSelected = onHandSelected * x.unitCost;

        const mv = mMap.get(x.sku) ?? {
          sku: x.sku,
          lastMoveDate: "1900-01-01",
          in7: 0,
          out7: 0,
          in30: 0,
          out30: 0,
          in90: 0,
          out90: 0,
        };

        const idleDays = daysDiff(mv.lastMoveDate, today);
        const { inX, outX } = metricForRange(mv);

        const status =
          onHandSelected <= 0 ? "Out" : onHandSelected < x.reorderLevel ? "Low" : "OK";

        /** Ageing buckets */
        const ageingBucket =
          idleDays <= 30 ? "0-30" : idleDays <= 60 ? "31-60" : idleDays <= 90 ? "61-90" : "90+";

        /** Simple flags */
        const dead = idleDays >= 60 && outX === 0; // no movement & idle
        const fast = outX >= (range === 7 ? 8 : range === 30 ? 25 : 60);

        return {
          ...x,
          byWh,
          onHandAll,
          onHandSelected,
          valueAll,
          valueSelected,
          inX,
          outX,
          idleDays,
          ageingBucket,
          dead,
          fast,
          status,
        };
      });
  }, [skus, stock, whs, search, cat, warehouse, today, mMap, range]);

  /** KPI (respect filters + warehouse selection) */
  const kpi = useMemo(() => {
    const totalSkus = rows.length;
    const totalQty = rows.reduce((s, r) => s + r.onHandSelected, 0);
    const totalValue = rows.reduce((s, r) => s + r.valueSelected, 0);

    const low = rows.filter((r) => r.status === "Low").length;
    const out = rows.filter((r) => r.status === "Out").length;
    const fast = rows.filter((r) => r.fast).length;
    const dead = rows.filter((r) => r.dead).length;

    const ageing = {
      "0-30": rows.filter((r) => r.ageingBucket === "0-30").length,
      "31-60": rows.filter((r) => r.ageingBucket === "31-60").length,
      "61-90": rows.filter((r) => r.ageingBucket === "61-90").length,
      "90+": rows.filter((r) => r.ageingBucket === "90+").length,
    };

    return { totalSkus, totalQty, totalValue, low, out, fast, dead, ageing };
  }, [rows]);

  /** Warehouse value breakdown (cards) */
  const whBreakdown = useMemo(() => {
    const out: Array<{ wh: Warehouse; qty: number; value: number }> = [];
    for (const w of whs) {
      const qty = skus.reduce((sum, sku) => sum + ((stock[sku.sku]?.[w] ?? 0)), 0);
      const value = skus.reduce((sum, sku) => sum + ((stock[sku.sku]?.[w] ?? 0) * sku.unitCost), 0);
      out.push({ wh: w, qty, value });
    }
    return out;
  }, [whs, skus, stock]);

  /** Rankings */
  const fastMoving = useMemo(() => [...rows].sort((a, b) => b.outX - a.outX).slice(0, 5), [rows]);
  const deadStock = useMemo(() => [...rows].filter((r) => r.dead).sort((a, b) => b.valueSelected - a.valueSelected).slice(0, 5), [rows]);

  /** Export CSV (filtered rows) */
  const exportCSV = () => {
    const header = [
      "SKU",
      "Name",
      "Category",
      "UOM",
      "Unit Cost",
      "WH Filter",
      "On Hand",
      "Stock Value",
      `IN ${range}d`,
      `OUT ${range}d`,
      "Idle Days",
      "Ageing Bucket",
      "Status",
    ];

    const lines = rows.map((r) =>
      [
        r.sku,
        r.name,
        r.category,
        r.uom,
        r.unitCost,
        warehouse,
        r.onHandSelected,
        r.valueSelected,
        r.inX,
        r.outX,
        r.idleDays,
        r.ageingBucket,
        r.status,
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock-dashboard-${warehouse}-${range}d.csv`;
    link.click();
  };

  /** Export PDF (print to PDF) */
  const exportPDF = () => {
    // best simple corporate export without extra libs
    window.print();
  };

  const badge = (s: "OK" | "Low" | "Out") =>
    cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
      s === "OK" && "bg-green-100 text-green-700",
      s === "Low" && "bg-amber-100 text-amber-800",
      s === "Out" && "bg-rose-100 text-rose-700"
    );

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Stock Dashboard" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: FORTUNA_RED }} />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                SKU Stock Dashboard
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Filters affect KPIs + Rankings + Export • Movement window: {range} days • Warehouse: {warehouse}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all"
              style={{ backgroundColor: FORTUNA_BLUE }}
              onClick={exportCSV}
            >
              Export CSV
            </button>
            <button
              className="active:scale-95 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all"
              style={{ backgroundColor: FORTUNA_RED }}
              onClick={exportPDF}
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters Row (clean & compact) */}
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Search (SKU / Name)</label>
            <input className={cn(inputBase, "mt-2")} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ex: ITM-002 / Helmet" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Category</label>
            <select className={cn(inputBase, "mt-2")} value={cat} onChange={(e) => setCat(e.target.value as any)}>
              <option value="">All</option>
              <option value="Machinery">Machinery</option>
              <option value="Safety">Safety</option>
              <option value="Packaging">Packaging</option>
              <option value="Electrical">Electrical</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Warehouse</label>
            <select className={cn(inputBase, "mt-2")} value={warehouse} onChange={(e) => setWarehouse(e.target.value as any)}>
              <option value="All">All Warehouses</option>
              <option value="Vizag WH">Vizag WH</option>
              <option value="Hyderabad WH">Hyderabad WH</option>
              <option value="Chennai WH">Chennai WH</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Date Range (Movement Window)</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[7, 30, 90].map((d) => {
                const active = range === d;
                return (
                  <button
                    key={d}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-95",
                      active
                        ? "text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                    )}
                    style={active ? { backgroundColor: FORTUNA_BLUE, borderColor: FORTUNA_BLUE } : undefined}
                    onClick={() => setRange(d as 7 | 30 | 90)}
                    type="button"
                  >
                    Last {d}d
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Warehouse breakdown cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {whBreakdown.map((x) => (
            <div key={x.wh} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{x.wh}</div>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_BLUE }} />
              </div>
              <div className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{inr(x.value)}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">Total Qty: <span className="font-semibold">{x.qty}</span></div>
              <div className="mt-3 h-1 w-full rounded-full bg-gray-100 dark:bg-white/10">
                <div className="h-1 rounded-full" style={{ width: "45%", backgroundColor: FORTUNA_BLUE, opacity: 0.9 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Clean KPI grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <KPI title="Total SKUs" value={kpi.totalSkus} accent={FORTUNA_RED} />
          <KPI title="Total Qty" value={kpi.totalQty} accent={FORTUNA_BLUE} />
          <KPI title="Stock Value" value={inr(kpi.totalValue)} accent={FORTUNA_RED} />
          <KPI title="Low Stock" value={kpi.low} accent={FORTUNA_BLUE} />
          <KPI title="Out of Stock" value={kpi.out} accent={FORTUNA_RED} />
          <KPI title="Fast Moving" value={kpi.fast} accent={FORTUNA_BLUE} />
          <KPI title="Dead Stock" value={kpi.dead} accent={FORTUNA_RED} />
        </div>

        {/* Ageing strip (corporate summary) */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Stock Ageing Summary</h3>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_RED }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AgeChip label="0–30 days" value={kpi.ageing["0-30"]} accent={FORTUNA_BLUE} />
            <AgeChip label="31–60 days" value={kpi.ageing["31-60"]} accent={FORTUNA_BLUE} />
            <AgeChip label="61–90 days" value={kpi.ageing["61-90"]} accent={FORTUNA_RED} />
            <AgeChip label="90+ days" value={kpi.ageing["90+"]} accent={FORTUNA_RED} />
          </div>
        </div>

        {/* Main grid: Matrix + Rank cards */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Matrix Table */}
          <div className="xl:col-span-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  SKU Stock Matrix (Enterprise View)
                </h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_BLUE }} />
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[1250px] w-full border-collapse text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      {whs.map((w) => (
                        <th key={w} className="px-4 py-3 text-left">
                          {w}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left">On Hand ({warehouse})</th>
                      <th className="px-4 py-3 text-left">Value ({warehouse})</th>
                      <th className="px-4 py-3 text-left">{range}d OUT</th>
                      <th className="px-4 py-3 text-left">Idle Days</th>
                      <th className="px-4 py-3 text-left">Ageing</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {rows.map((r) => (
                      <tr key={r.sku} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold">{r.sku}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white">{r.name}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                            Cost: {inr(r.unitCost)} • Reorder: {r.reorderLevel} {r.uom}
                          </div>
                        </td>
                        <td className="px-4 py-3">{r.category}</td>

                        {whs.map((w) => (
                          <td key={w} className="px-4 py-3 font-semibold">
                            {r.byWh[w] ?? 0}
                          </td>
                        ))}

                        <td className="px-4 py-3 font-semibold">{r.onHandSelected} {r.uom}</td>
                        <td className="px-4 py-3 font-semibold">{inr(r.valueSelected)}</td>
                        <td className="px-4 py-3 font-semibold">{r.outX}</td>
                        <td className="px-4 py-3">{r.idleDays}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                            {r.ageingBucket}
                          </span>
                        </td>
                        <td className="px-4 py-3"><span className={badge(r.status as any)}>{r.status}</span></td>
                        <td className="px-4 py-3">
                          {r.status !== "OK" ? (
                            <button
                              className="font-semibold hover:underline"
                              style={{ color: FORTUNA_BLUE }}
                              onClick={() => alert(`Next: Create PR for ${r.sku}`)}
                            >
                              Create PR
                            </button>
                          ) : (
                            <button className="font-semibold text-blue-600 hover:underline" onClick={() => alert(`Open SKU Details for ${r.sku}`)}>
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No SKUs found for filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Note:</span> Movement window ({range}d) changes Fast/Dead logic + rank cards.
              </div>
            </div>
          </div>

          {/* Rank cards */}
          <div className="xl:col-span-4 space-y-6">
            <RankCard
              title={`Top Fast Moving (OUT in last ${range}d)`}
              accent={FORTUNA_BLUE}
              rows={fastMoving.map((r) => ({
                key: r.sku,
                title: `${r.sku} • ${r.name}`,
                meta: `OUT: ${r.outX} • OnHand(${warehouse}): ${r.onHandSelected} • Age: ${r.ageingBucket}`,
                right: inr(r.valueSelected),
              }))}
              emptyText="No fast moving items for current filters."
            />

            <RankCard
              title="Dead Stock (Idle ≥ 60 days & no movement)"
              accent={FORTUNA_RED}
              rows={deadStock.map((r) => ({
                key: r.sku,
                title: `${r.sku} • ${r.name}`,
                meta: `Idle: ${r.idleDays} days • OnHand(${warehouse}): ${r.onHandSelected} • Bucket: ${r.ageingBucket}`,
                right: inr(r.valueSelected),
              }))}
              emptyText="No dead stock for current filters."
            />
          </div>
        </div>
      </div>

      {/* Print styles for PDF */}
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
          }
          nav, aside, header, footer {
            display: none !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/** Components */
function KPI({ title, value, accent }: { title: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</div>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
      <div className="mt-2 h-1 w-full rounded-full bg-gray-100 dark:bg-white/10">
        <div className="h-1 rounded-full" style={{ width: "38%", backgroundColor: accent, opacity: 0.9 }} />
      </div>
    </div>
  );
}

function AgeChip({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function RankCard({
  title,
  accent,
  rows,
  emptyText,
}: {
  title: string;
  accent: string;
  rows: Array<{ key: string; title: string; meta: string; right: string }>;
  emptyText?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
            {emptyText ?? "No data."}
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.key} className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{r.title}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">{r.meta}</div>
                </div>
                <div className="text-sm font-semibold" style={{ color: accent }}>
                  {r.right}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
        <span className="font-semibold">Tip:</span> Dead stock list can trigger liquidation / transfer workflows.
      </div>
    </div>
  );
}
