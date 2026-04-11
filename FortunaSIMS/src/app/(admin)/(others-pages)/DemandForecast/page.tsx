"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";
import Select from "react-select";

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

export default function DemandForecastPage() {
  const router = useRouter();

  // =========================
  // STATES
  // =========================
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [item, setItem] = useState(""); // UUID
  const [warehouse, setWarehouse] = useState(""); // UUID

  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

  const [kpi, setKpi] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState(""); 


  const toggleItem = (id: string) => {
  if (selectedItems.includes(id)) {
    setSelectedItems(selectedItems.filter((i) => i !== id));
  } else {
    setSelectedItems([...selectedItems, id]);
  }
};

const removeItem = (id: string) => {
  setSelectedItems(selectedItems.filter((i) => i !== id));
};

const filteredItems = items.filter((i: any) =>
  i.name?.toLowerCase().includes(search.toLowerCase())
);


  // =========================
  // MONTH LIST
  // =========================
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

  // =========================
  // MAX VALUE (for chart)
  // =========================
  const maxValue = useMemo(() => {
    return Math.max(
      ...trend.map((t) => Math.max(t.demand || 0, t.forecast || 0)),
      1
    );
  }, [trend]);

  // =========================
  // DATE FORMAT (IMPORTANT 🔥)
  // =========================
  const formatToDate = (label: string) => {
    const date = new Date(label);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // =========================
  // VALIDATION
  // =========================
  const validateRange = () => {
    if (!fromMonth || !toMonth) return true;

    const fromIndex = months.indexOf(fromMonth);
    const toIndex = months.indexOf(toMonth);

    if (fromIndex === -1 || toIndex === -1) return false;

    if (toIndex < fromIndex) {
      alert("To Month should be after From Month");
      return false;
    }

    return true;
  };

    // =========================
  // FETCH ITEMS & WAREHOUSES
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemRes = await fetch("http://localhost:5000/api/items");
        const itemData = await itemRes.json();

        const whRes = await fetch("http://localhost:5000/api/warehouses");
        const whData = await whRes.json();

        setItems(itemData);
        setWarehouses(whData);

        // ✅ Default selections (VERY IMPORTANT)
        if (itemData.length > 0) {
          setItem(itemData[0].id);
        }

        if (whData.length > 0) {
          setWarehouse(whData[0].warehouse_id);
        }

        // ✅ Default months
        if (months.length > 0) {
          setFromMonth(months[0]);
          setToMonth(months[2] || months[0]);
        }

      } catch (err) {
        console.error("Error fetching dropdown data", err);
      }
    };

    fetchData();
  }, [months]);

  //close dropdown on outside click

  useEffect(() => {
  const close = (e: any) => {
    // only close if clicked outside dropdown
    if (!e.target.closest(".sku-dropdown")) {
      setShowDropdown(false);
    }
  };

  window.addEventListener("click", close);

  return () => window.removeEventListener("click", close);
}, []);

const sendForecast = async () => {
  try {
    if (!selectedItems.length || !warehouse) return;

    const payload = selectedItems.map((id) => ({
      item_id: id,
      warehouse_id: warehouse,
      from_month: formatToDate(fromMonth),
      to_month: formatToDate(toMonth),

      // ✅ FLAT KPI (IMPORTANT)
      demand: kpi.demand,
      forecast: kpi.forecast,
      stock: kpi.stock,
      reorder: kpi.reorder,
      mape: kpi.mape,
      risk: kpi.risk,

      // ✅ TREND TABLE
      trend: trend.map((t) => ({
        month: formatToDate(t.month),
        demand: t.demand,
        forecast: t.forecast,
      })),

      // ✅ SKU TABLE
      sku: tableData.map((s, index) => ({
        item_id: selectedItems[index] || id,
        demand: s.demand,
        forecast: s.forecast,
        stock: s.stock,
        variance: s.variance,
      })),

      // ✅ ACTIONS TABLE
      actions: actions.map((a) => ({
        action: a,
      })),
    }));

    console.log("🔥 FINAL PAYLOAD:", payload);

    const res = await fetch("http://localhost:5000/api/demand/forecast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("✅ Saved:", data);

  } catch (err) {
    console.error("❌ Error saving forecast", err);
  }
};





/* =========================
   AI FORECAST ENGINE
========================= */
const runForecast = () => {
  // =========================
  // KPI (AI DEMAND ENGINE)
  // =========================
  if (selectedItems.length === 0) return;

  // ✅ Base from selected items count
  const baseDemand = selectedItems.length * 120;

  // ✅ Stable variation using item ids
  const variation =
    selectedItems.reduce((acc, id) => acc + id.charCodeAt(0), 0) % 50;

  const demand = baseDemand + variation;

  const forecast = Math.round(demand * 1.1);

  // ✅ Stock derived logically
  const stock = forecast - selectedItems.length * 30;

  const safetyStock = forecast * 0.2;
  const reorder = Math.max(forecast + safetyStock - stock, 0);

  const mape = 5 + (variation % 5);

  let risk = "Low";
  if (stock < forecast * 0.8) risk = "High";
  else if (stock < forecast) risk = "Medium";

  setKpi({
    demand,
    forecast,
    stock,
    reorder,
    mape,
    risk,
  });

  // =========================
  // TREND
  // =========================
  let filteredMonths = months;

  if (fromMonth && toMonth) {
    const fromIndex = months.indexOf(fromMonth);
    const toIndex = months.indexOf(toMonth);
    filteredMonths = months.slice(fromIndex, toIndex + 1);
  }

  const trendData = filteredMonths.map((m) => ({
    month: m,
    demand: Math.floor(Math.random() * 100) + 20,
    forecast: Math.floor(Math.random() * 100) + 20,
  }));

  setTrend(trendData);

  // =========================
  // TABLE (Selected Items Only)
  // =========================
  const rows = selectedItems.map((id: string) => {
    const itemObj = items.find((i: any) => i.id === id);

    const demand = Math.floor(Math.random() * 400);
    const forecast = Math.floor(Math.random() * 400);
    const stock = Math.floor(Math.random() * 300);

    return {
      item_id: id,
      sku: itemObj?.name,
      demand,
      forecast,
      stock,
      variance: forecast - demand,
    };
  });

  setTableData(rows);
};

useEffect(() => {
  if (
    tableData.length > 0 &&
    trend.length > 0 &&
    kpi?.forecast &&
    selectedItems.length > 0
  ) {
    sendForecast();
  }
}, [tableData, trend]);

  /* =========================
     RECOMMENDED ACTIONS 🔥
  ========================= */
  const actions = useMemo(() => {
  const list = [];

  if (kpi.risk === "High") {
    list.push("⚠️ Immediate replenishment required");
  }

  if (kpi.risk === "Medium") {
    list.push("⚡ Monitor stock closely");
  }

  if (kpi.stock > kpi.forecast * 1.3) {
    list.push("📦 Overstock risk – slow down procurement");
  }

  if (kpi.mape > 8) {
    list.push("📉 Forecast accuracy needs improvement");
  }

  if (list.length === 0) {
    list.push("✅ Inventory balanced based on current demand pattern");
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

{/* SKU - SINGLE SELECT SEARCH */}
<div
  className="relative w-full max-w-[320px] z-50 sku-dropdown"
  onClick={(e) => e.stopPropagation()}
>

  {/* Selected Item */}
  <div
    onClick={() => setShowDropdown(!showDropdown)}
    className="h-[56px] flex items-center px-3 border rounded-xl bg-white cursor-pointer shadow-sm"
  >
    {selectedItems.length === 0 ? (
      <span className="text-gray-400">Select Item</span>
    ) : (
      <span className="text-sm font-medium text-gray-800">
        {items.find((i: any) => i.id === selectedItems[0])?.name || "Selected"}
      </span>
    )}
  </div>

  {/* Dropdown */}
  {showDropdown && (
    <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl">

      {/* Search */}
      <input
        type="text"
        placeholder="Search item..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border-b outline-none"
      />

      {/* List */}
      <div className="max-h-52 overflow-y-auto">
        {(items || [])
          .filter((i: any) =>
            (i.name || "")
              .toLowerCase()
              .includes((search || "").toLowerCase())
          )
          .map((item: any) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedItems([item.id]); // ✅ ONLY ONE
                setShowDropdown(false);      // ✅ close dropdown
              }}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50"
            >
              {item.name}
            </div>
          ))}
      </div>
    </div>
  )}
</div>

  {/* WAREHOUSE */}
  <select
  value={warehouse}
  onChange={(e) => setWarehouse(e.target.value)}
  className="px-4 py-3 rounded-xl border bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
>
  {warehouses.map((w: any) => (
    <option key={w.warehouse_id} value={w.warehouse_id}>
      {w.warehouse_name}
    </option>
  ))}
</select>


  {/* FROM MONTH */}
  <select
  className="p-3 rounded-xl border w-full"
  value={fromMonth}
  onChange={(e) => setFromMonth(e.target.value)}
>
  {months.map((m) => (
    <option key={m} value={m}>
      {m}
    </option>
  ))}
</select>

  {/* TO MONTH */}
 <select
  className="p-3 rounded-xl border w-full"
  value={toMonth}
  onChange={(e) => setToMonth(e.target.value)}
>
  {months.map((m) => (
    <option key={m} value={m}>
      {m}
    </option>
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
        <KPI
  title="Demand"
  value={kpi.demand}
  bg="#005F99"
  confidence={95 - selectedItems.length}
/>
        <KPI title="Forecast" value={kpi.forecast} bg="#005F99" />
        <KPI title="Stock" value={kpi.stock} bg="#C8102E" />
        <KPI title="Reorder" value={kpi.reorder} bg="#C8102E" />
        <KPI title="MAPE %" value={kpi.mape} bg="#005F99" />
        <KPI title="Risk" value={kpi.risk} bg="#C8102E" />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* TREND */}
          <div className="xl:col-span-8 border rounded-2xl p-5 overflow-visible">
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
  <div className="relative h-48 pt-4 flex items-end gap-6 justify-between w-full border-l border-b border-gray-300 pl-10 pb-2">

    {/* GRID LINES ✅ */}
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-t border-gray-200 w-full" />
      ))}
    </div>

      {/* Y-AXIS LABELS */}
<div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-500">
  {[...Array(5)].map((_, i) => {
    const value = Math.round((maxValue / 4) * (4 - i));
    return <span key={i}>{value}</span>;
  })}
</div>


  {/* BARS */}
{trend.map((t, i) => {
  return (
    <div
      key={i}
      className="flex flex-col items-center justify-end h-full gap-1 relative group cursor-pointer"
    >

      {/* TOOLTIP */}
      <div className="absolute -top-12 z-50 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow">
        <div>Demand: {t.demand}</div>
        <div>Forecast: {t.forecast}</div>
      </div>

      {/* DEMAND */}
      <div
        className="w-4 md:w-5 rounded"
        style={{
          height: `${(t.demand / maxValue) * 100}%`,
          background: "#C8102E",
        }}
      />

      {/* FORECAST */}
      <div
        className="w-4 md:w-5 rounded mt-1"
        style={{
          height: `${(t.forecast / maxValue) * 100}%`,
          background: "#005F99",
        }}
      />

      {/* MONTH */}
      <span className="text-[10px] text-gray-500 mt-1">
        {t?.month?.split(" ")[0]}
      </span>

    </div>
  );
})}
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

{/* QUICK ACTIONS */}
<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

  <h3 className="text-base font-semibold mb-4" style={{ color: "#005F99" }}>
    Quick Actions
  </h3>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

    {/* RFQ */}
    <button
  className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition text-left w-full"
  onClick={() => {
    localStorage.setItem(
      "FORTUNA_RFQ_FROM_DEMAND",
      JSON.stringify({
        items: tableData, // your demand table data
      })
    );

    router.push("/RFQForm");
  }}
>
  <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
    📄 Raise RFQ
  </div>
  <div className="text-xs text-gray-500">Request vendor quotes</div>
</button>

    {/* PO */}
    <button
      className="p-4 rounded-xl border hover:shadow-md transition text-left"
      onClick={() => {
        const filteredItems = tableData.filter((i) => i.variance > 50);
        const finalItems = filteredItems.length > 0 ? filteredItems : tableData;
    localStorage.setItem(
      "FORTUNA_PO_FROM_DEMAND",
      JSON.stringify({
        items: tableData,
      })
    );

    router.push("/PurchaseOrderForm"); // 🔥 update based on your route
  }}
>
    
      <div className="text-sm font-semibold text-gray-700">🛒 Create PO</div>
      <div className="text-xs text-gray-500">Convert to purchase order</div>
    </button>

    {/* TRANSFER */}
    <button
      className="p-4 rounded-xl border hover:shadow-md transition text-left"
      onClick={() => console.log("Stock Transfer")}
    >
      <div className="text-sm font-semibold text-gray-700">🔄 Stock Transfer</div>
      <div className="text-xs text-gray-500">Move between warehouses</div>
    </button>

    {/* REPLENISH */}
    <button
      className="p-4 rounded-xl border hover:shadow-md transition text-left"
      onClick={() => console.log("Auto Replenishment")}
    >
      <div className="text-sm font-semibold text-gray-700">📦 Replenish</div>
      <div className="text-xs text-gray-500">Trigger stock refill</div>
    </button>

  </div>

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
  confidence,
}: {
  title: string;
  value: string | number;
  bg: string;
  confidence?: number;
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


<div className="mt-1 text-[10px] opacity-80">
  AI Confidence: {confidence || 90}%
</div>
    </div>
  );
}


