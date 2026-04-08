"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/* =========================
   FORTUNA THEME
========================= */
const RED = "#C8102E";
const BLUE = "#005F99";

/* =========================
   INPUT STYLE (REUSED ✅)
========================= */
const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "shadow-sm focus:outline-none focus:ring-4 focus:ring-[rgba(0,95,153,0.12)] focus:border-[rgba(0,95,153,0.45)]";

/* =========================
   MOCK DATA
========================= */
const ITEMS = ["Industrial Pump", "Safety Helmet", "Gear Box"];
const WAREHOUSES = ["Vizag WH", "Hyderabad WH", "Chennai WH"];



/* =========================
   MAIN COMPONENT
========================= */
export default function DemandForecastPage() {
  const [item, setItem] = useState("Industrial Pump");
  const [warehouse, setWarehouse] = useState("Vizag WH");

  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");


  const [kpi, setKpi] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);

  const months = useMemo(() => {
  const list: string[] = [];
  const today = new Date();

  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);

    const label = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    list.push(label);
  }

  return list;
}, []);


//date range validation//

const validateRange = () => {
  if (!fromMonth || !toMonth) return true;

  const fromIndex = months.indexOf(fromMonth);
  const toIndex = months.indexOf(toMonth);

  if (toIndex < fromIndex) {
    alert("To Month should be after From Month");
    return false;
  }

  return true;
};

  /* =========================
     AI FORECAST ENGINE
  ========================= */
  const runForecast = () => {
    const demand = Math.floor(Math.random() * 800) + 400;
    const forecast = demand * 1.1;
    const stock = Math.floor(Math.random() * 700) + 200;
    const reorder = Math.max(forecast - stock, 0);
    const mape = Math.floor(Math.random() * 20) + 5;

    const risk =
      stock < forecast ? "High" : stock < forecast * 1.2 ? "Medium" : "Low";

    setKpi({ demand, forecast, stock, reorder, mape, risk });

    /* TREND */
    const data = Array.from({ length: 10 }).map((_, i) => ({
      demand: Math.random() * 100,
      forecast: Math.random() * 100,
    }));
    setTrend(data);

    /* TABLE */
    setTableData(
      ITEMS.map((i) => ({
        sku: i,
        demand: Math.floor(Math.random() * 400),
        forecast: Math.floor(Math.random() * 400),
        stock: Math.floor(Math.random() * 300),
        variance: Math.floor(Math.random() * 50),
      }))
    );
  };

  useEffect(() => {
    runForecast();
  }, [item, warehouse]);

  /* =========================
     RECOMMENDED ACTIONS 🔥
  ========================= */
  const actions = useMemo(() => {
    const list = [];

    if (kpi.risk === "High") {
      list.push("⚠️ Immediate replenishment required");
    }
    if (kpi.mape > 15) {
      list.push("📉 Forecast accuracy low – review model");
    }
    if (kpi.stock > kpi.forecast * 1.3) {
      list.push("📦 Overstock risk – slow down procurement");
    }
    if (list.length === 0) {
      list.push("✅ Inventory balanced");
    }

    return list;
  }, [kpi]);

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Demand Forecasting" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6">

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: RED }}>
            Demand Planning Cockpit
          </h2>
          <p className="text-sm text-gray-500">
            AI-driven Demand Forecast & Inventory Optimization
          </p>
        </div>

        {/* FILTER BAR */}
        {/* FILTER BAR */}
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5 mb-6">

  {/* SKU */}
  <select
    className={inputBase}
    value={item}
    onChange={(e) => setItem(e.target.value)}
  >
    {ITEMS.map((i) => (
      <option key={i}>{i}</option>
    ))}
  </select>

  {/* WAREHOUSE */}
  <select
    className={inputBase}
    value={warehouse}
    onChange={(e) => setWarehouse(e.target.value)}
  >
    {WAREHOUSES.map((w) => (
      <option key={w}>{w}</option>
    ))}
  </select>

  {/* FROM MONTH */}
  <select
    className={inputBase}
    value={fromMonth}
    onChange={(e) => setFromMonth(e.target.value)}
  >
    <option value="">From Month</option>
    {months.map((m) => (
      <option key={m}>{m}</option>
    ))}
  </select>

  {/* TO MONTH */}
  <select
    className={inputBase}
    value={toMonth}
    onChange={(e) => setToMonth(e.target.value)}
  >
    <option value="">To Month</option>
    {months.map((m) => (
      <option key={m}>{m}</option>
    ))}
  </select>

  {/* BUTTON */}
  <button
  onClick={() => {
    if (!validateRange()) return;
    runForecast();
  }}
  className="rounded-xl text-white font-semibold"
  style={{ backgroundColor: "#005F99" }}
>
  Apply Filters
</button>

</div>

        {/* KPI */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6 mb-6">
        <KPI title="Demand" value={kpi.demand} bg="#005F99" />
        <KPI title="Forecast" value={kpi.forecast} bg="#005F99" />
        <KPI title="Stock" value={kpi.stock} bg="#C8102E" />
        <KPI title="Reorder" value={kpi.reorder} bg="#C8102E" />
        <KPI title="MAPE %" value={kpi.mape} bg="#005F99" />
        <KPI title="Risk" value={kpi.risk} bg="#C8102E" />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* TREND */}
          <div className="xl:col-span-8 border rounded-2xl p-5">
            <h3 className="text-base font-semibold" style={{ color: "#005F99" }}>
             Demand vs Forecast Trend
            </h3>

            <div className="xl:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
  
  {/* HEADER */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-semibold" style={{ color: "#005F99" }}>
      
    </h3> 

    {/* LEGEND ✅ */}
    <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ background: "#C8102E" }} />
        Demand
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ background: "#005F99" }} />
        Forecast
      </span>
    </div>
  </div>

  {/* CHART AREA */}
  <div className="relative h-44 flex items-end gap-3 border-l border-b border-gray-300 pl-4 pb-2">

    {/* GRID LINES ✅ */}
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-t border-gray-200 w-full" />
      ))}
    </div>

    {/* BARS */}
    {trend.map((t, i) => (
      <div key={i} className="flex flex-col items-center gap-1 z-10">
        
        {/* DEMAND */}
        <div
          className="w-2 rounded"
          style={{
            height: `${t.demand * 1.2}px`,
            background: "#C8102E",
          }}
        />

        {/* FORECAST */}
        <div
          className="w-2 rounded"
          style={{
            height: `${t.forecast * 1.2}px`,
            background: "#005F99",
          }}
        />
      </div>
    ))}
  </div>
</div>
          </div>

          {/* RECOMMENDED ACTIONS */}
          <div className="xl:col-span-4 border rounded-2xl p-5 bg-gray-50">
            <h3 className="font-semibold mb-3" style={{ color: BLUE }}>
              Recommended Actions
            </h3>

            <ul className="text-sm space-y-2">
              {actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* TABLE */}
       <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
  <h3 className="text-base font-semibold mb-4" style={{ color: "#005F99" }}>
    SKU Level Planning
  </h3>

  <div className="overflow-x-auto rounded-xl border border-gray-200">
    <table className="min-w-full text-sm border-collapse">
      
      {/* HEADER */}
      <thead>
        <tr style={{ backgroundColor: "#C8102E", color: "white" }}>
          <th className="px-4 py-3 text-left font-semibold">SKU</th>
          <th className="px-4 py-3 text-right font-semibold">Demand</th>
          <th className="px-4 py-3 text-right font-semibold">Forecast</th>
          <th className="px-4 py-3 text-right font-semibold">Stock</th>
          <th className="px-4 py-3 text-right font-semibold">Variance</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody>
        {tableData.map((r, i) => (
          <tr
            key={i}
            className="border-b hover:bg-gray-50 transition"
          >
            <td className="px-4 py-3 font-medium text-gray-900">
              {r.sku}
            </td>

            <td className="px-4 py-3 text-right font-semibold text-gray-700">
              {r.demand}
            </td>

            <td className="px-4 py-3 text-right font-semibold text-gray-700">
              {r.forecast}
            </td>

            <td className="px-4 py-3 text-right font-semibold text-gray-900">
              {r.stock}
            </td>

            <td
              className={`px-4 py-3 text-right font-bold ${
                r.variance > 20
                  ? "text-red-600"
                  : r.variance > 10
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {r.variance}
            </td>
          </tr>
        ))}

        {tableData.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center py-8 text-gray-500">
              No data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

      </div>
    </div>
  );
}

/* =========================
   KPI CARD (MATCHED STYLE ✅)
========================= */
function KPI({
  title,
  value,
  bg,
}: {
  title: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 shadow-md border transition-all hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${bg}CC 100%)`,
        color: "white",
        border: "none",
      }}
    >
      <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-white/10 blur-xl" />

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold opacity-90">{title}</div>
        <span className="h-2 w-2 rounded-full bg-white/80" />
      </div>

      <div className="mt-2 text-3xl font-bold tracking-wide">
        {value}
      </div>
    </div>
  );
}