"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme (minimal accents) */
const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

type Warehouse = "Vizag WH" | "Hyderabad WH" | "Chennai WH";
type Category = "Machinery" | "Safety" | "Packaging" | "Electrical";

type AlertItem = {
  sku: string;
  name: string;
  category: Category;
  uom: string;
  unitCost: number;
  minLevel: number;
  maxLevel: number;
  expiryDate: string; // yyyy-mm-dd
};

type StockByWH = Record<Warehouse, number>;

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

export default function StockAlertsDashboard() {
  const today = todayISO();
  const whs: Warehouse[] = ["Vizag WH", "Hyderabad WH", "Chennai WH"];

  /** Filters */
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const [warehouse, setWarehouse] = useState<Warehouse | "All">("All");
  const [expiryWindow, setExpiryWindow] = useState<30 | 60 | 90>(60);

  /** Demo master */
  const [items] = useState<AlertItem[]>([
    { sku: "ITM-001", name: "Industrial Pump", category: "Machinery", uom: "Nos", unitCost: 18000, minLevel: 4, maxLevel: 14, expiryDate: "2026-08-15" },
    { sku: "ITM-002", name: "Safety Helmet", category: "Safety", uom: "Nos", unitCost: 450, minLevel: 15, maxLevel: 60, expiryDate: "2026-03-20" },
    { sku: "ITM-003", name: "Gear Box", category: "Machinery", uom: "Nos", unitCost: 24000, minLevel: 2, maxLevel: 8, expiryDate: "2027-01-01" },
    { sku: "ITM-004", name: "Hand Gloves", category: "Safety", uom: "Pairs", unitCost: 120, minLevel: 25, maxLevel: 120, expiryDate: "2026-02-25" },
    { sku: "ITM-005", name: "Packing Tape", category: "Packaging", uom: "Nos", unitCost: 80, minLevel: 20, maxLevel: 150, expiryDate: "2026-04-10" },
    { sku: "ITM-006", name: "MCB 32A", category: "Electrical", uom: "Nos", unitCost: 220, minLevel: 10, maxLevel: 60, expiryDate: "2026-12-31" },
    { sku: "ITM-007", name: "Air Compressor", category: "Machinery", uom: "Nos", unitCost: 52000, minLevel: 1, maxLevel: 4, expiryDate: "2026-09-30" },
    { sku: "ITM-008", name: "Stretch Film Roll", category: "Packaging", uom: "Nos", unitCost: 550, minLevel: 8, maxLevel: 40, expiryDate: "2026-02-18" },
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

  /** Build rows (filtered + computed) */
  const rows = useMemo(() => {
    return items
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

        const daysToExpiry = daysDiff(today, x.expiryDate);
        const expiryFlag = daysToExpiry <= expiryWindow;
        const understock = onHandSelected < x.minLevel;
        const overstock = onHandSelected > x.maxLevel;

        return {
          ...x,
          byWh,
          onHandAll,
          onHandSelected,
          valueAll,
          valueSelected,
          daysToExpiry,
          expiryFlag,
          understock,
          overstock,
        };
      });
  }, [items, stock, whs, search, cat, warehouse, today, expiryWindow]);

  /** KPIs */
  const kpi = useMemo(() => {
    const totalSkus = rows.length;
    const totalQty = rows.reduce((s, r) => s + r.onHandSelected, 0);
    const totalValue = rows.reduce((s, r) => s + r.valueSelected, 0);
    const under = rows.filter((r) => r.understock).length;
    const over = rows.filter((r) => r.overstock).length;
    const exp = rows.filter((r) => r.expiryFlag).length;
    return { totalSkus, totalQty, totalValue, under, over, exp };
  }, [rows]);

  /** Alert buckets */
  const understockRows = useMemo(() => rows.filter((r) => r.understock), [rows]);
  const overstockRows = useMemo(() => rows.filter((r) => r.overstock), [rows]);
  const expiryRows = useMemo(() => rows.filter((r) => r.expiryFlag).sort((a, b) => a.daysToExpiry - b.daysToExpiry), [rows]);

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
      "Min Level",
      "Max Level",
      "Understock",
      "Overstock",
      "Expiry Date",
      "Days To Expiry",
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
        r.minLevel,
        r.maxLevel,
        r.understock ? "Yes" : "No",
        r.overstock ? "Yes" : "No",
        r.expiryDate,
        r.daysToExpiry,
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock-alerts-${warehouse}-${expiryWindow}d.csv`;
    link.click();
  };

  /** Export PDF (print to PDF) */
  const exportPDF = () => {
    window.print();
  };

  const badge = (s: "Under" | "Over" | "Expiry" | "OK") =>
    cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
      s === "Under" && "bg-amber-100 text-amber-800",
      s === "Over" && "bg-sky-100 text-sky-800",
      s === "Expiry" && "bg-rose-100 text-rose-700",
      s === "OK" && "bg-green-100 text-green-700"
    );

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Stock Alerts" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: FORTUNA_RED }} />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Stock Alerts Dashboard
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Module 2: Inventory & Warehouse Management (WMS) â€¢ Warehouse: {warehouse} â€¢ Expiry window: {expiryWindow} days
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

        {/* Filters */}
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Expiry Window (Days)</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[30, 60, 90].map((d) => {
                const active = expiryWindow === d;
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
                    onClick={() => setExpiryWindow(d as 30 | 60 | 90)}
                    type="button"
                  >
                    Next {d}d
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <KPI title="Total SKUs" value={kpi.totalSkus} accent={FORTUNA_RED} />
          <KPI title="Total Qty" value={kpi.totalQty} accent={FORTUNA_BLUE} />
          <KPI title="Stock Value" value={inr(kpi.totalValue)} accent={FORTUNA_RED} />
          <KPI title="Understock Alerts" value={kpi.under} accent={FORTUNA_BLUE} />
          <KPI title="Overstock Alerts" value={kpi.over} accent={FORTUNA_BLUE} />
          <KPI title="Expiry Alerts" value={kpi.exp} accent={FORTUNA_RED} />
        </div>

        {/* Alerts Summary Cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AlertCard
            title="Understock Alerts"
            accent={FORTUNA_BLUE}
            rows={understockRows.map((r) => ({
              key: r.sku,
              title: `${r.sku} â€¢ ${r.name}`,
              meta: `OnHand(${warehouse}): ${r.onHandSelected} ${r.uom} â€¢ Min: ${r.minLevel}`,
              right: inr(r.valueSelected),
            }))}
            emptyText="No understock alerts for current filters."
          />
          <AlertCard
            title="Overstock Alerts"
            accent={FORTUNA_BLUE}
            rows={overstockRows.map((r) => ({
              key: r.sku,
              title: `${r.sku} â€¢ ${r.name}`,
              meta: `OnHand(${warehouse}): ${r.onHandSelected} ${r.uom} â€¢ Max: ${r.maxLevel}`,
              right: inr(r.valueSelected),
            }))}
            emptyText="No overstock alerts for current filters."
          />
          <AlertCard
            title={`Expiry Alerts (Next ${expiryWindow}d)`}
            accent={FORTUNA_RED}
            rows={expiryRows.map((r) => ({
              key: r.sku,
              title: `${r.sku} â€¢ ${r.name}`,
              meta: `Expiry: ${r.expiryDate} â€¢ Days: ${r.daysToExpiry}`,
              right: inr(r.valueSelected),
            }))}
            emptyText="No expiry alerts for current filters."
          />
        </div>

        {/* Main Table */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Stock Alerts Matrix
            </h3>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_BLUE }} />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
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
                  <th className="px-4 py-3 text-left">Min/Max</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-left">Days To Expiry</th>
                  <th className="px-4 py-3 text-left">Alert</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody className="dark:text-gray-200">
                {rows.map((r) => {
                  const alertTag = r.understock ? "Under" : r.overstock ? "Over" : r.expiryFlag ? "Expiry" : "OK";
                  return (
                    <tr key={r.sku} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold">{r.sku}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{r.name}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                          Cost: {inr(r.unitCost)} â€¢ UOM: {r.uom}
                        </div>
                      </td>
                      <td className="px-4 py-3">{r.category}</td>

                      {whs.map((w) => (
                        <td key={w} className="px-4 py-3 font-semibold">
                          {r.byWh[w] ?? 0}
                        </td>
                      ))}

                      <td className="px-4 py-3 font-semibold">{r.onHandSelected} {r.uom}</td>
                      <td className="px-4 py-3">{r.minLevel} / {r.maxLevel}</td>
                      <td className="px-4 py-3">{r.expiryDate}</td>
                      <td className="px-4 py-3">{r.daysToExpiry}</td>
                      <td className="px-4 py-3"><span className={badge(alertTag as any)}>{alertTag}</span></td>
                      <td className="px-4 py-3">
                        {alertTag !== "OK" ? (
                          <button
                            className="font-semibold hover:underline"
                            style={{ color: FORTUNA_BLUE }}
                            onClick={() => alert(`Next: Create Alert Action for ${r.sku}`)}
                          >
                            Create Action
                          </button>
                        ) : (
                          <button className="font-semibold text-blue-600 hover:underline" onClick={() => alert(`Open SKU Details for ${r.sku}`)}>
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                      No alerts found for filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
            <span className="font-semibold">Note:</span> Understock uses Min Level, Overstock uses Max Level, Expiry uses selected window.
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

function AlertCard({
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
          rows.slice(0, 5).map((r) => (
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
        <span className="font-semibold">Insight:</span> Act early to prevent stockouts, avoid excess, and protect shelf life.
      </div>
    </div>
  );
}
