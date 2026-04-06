"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme (minimal accents) */
const FORTUNA_RED = "#C8102E";
const FORTUNA_BLUE = "#005F99";

type Warehouse = "Vizag WH" | "Hyderabad WH" | "Chennai WH";
type Zone = "Zone-Receiving" | "Zone-Storage" | "Zone-QC";
type Aisle = "Aisle-01" | "Aisle-02" | "Aisle-03";
type Rack = "Rack-01" | "Rack-02" | "Rack-03";

type BinStatus = "Available" | "Reserved" | "Occupied" | "Blocked";

type BinItem = {
  sku: string;
  name: string;
  uom: string;
  qty: number;
  batch?: string;
  expiry?: string;
  receivedDate?: string;
};

type Bin = {
  code: string;
  level: number; // 1..4
  position: number; // 1..10
  status: BinStatus;
  capacityUnits: number;
  usedUnits: number;
  items: BinItem[];
  warehouse: Warehouse;
};

type StockRow = {
  sku: string;
  name: string;
  uom: string;
  qty: number;
  bin: string;
  status: BinStatus;
  receivedDate: string;
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

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-[rgba(0,95,153,0.12)] " +
  "focus:border-[rgba(0,95,153,0.45)] dark:bg-gray-950 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const statusChip = (s: BinStatus) =>
  cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
    s === "Available" && "bg-green-100 text-green-700",
    s === "Reserved" && "bg-blue-100 text-blue-700",
    s === "Occupied" && "bg-amber-100 text-amber-800",
    s === "Blocked" && "bg-rose-100 text-rose-700"
  );

const statusColor: Record<BinStatus, string> = {
  Available: "#E7F7ED",
  Reserved: "#E8F0FF",
  Occupied: "#FFF3E0",
  Blocked: "#FDEAEA",
};

const statusBorder: Record<BinStatus, string> = {
  Available: "#6ACB8B",
  Reserved: "#6FA1FF",
  Occupied: "#F3B865",
  Blocked: "#E07A7A",
};

export default function WarehouseLayoutPage() {
  const [warehouse, setWarehouse] = useState<Warehouse>("Vizag WH");
  const [zone, setZone] = useState<Zone>("Zone-Receiving");
  const [aisle, setAisle] = useState<Aisle>("Aisle-01");
  const [rack, setRack] = useState<Rack>("Rack-01");
  const [search, setSearch] = useState("");
  const [skuSearch, setSkuSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BinStatus | "All">("All");
  const [activeTab, setActiveTab] = useState<"layout" | "stock">("layout");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);

  /** Demo bins */
  const [bins] = useState<Bin[]>(() => {
    const data: Bin[] = [];
    for (let level = 1; level <= 6; level++) {
      for (let pos = 1; pos <= 20; pos++) {
        const wh: Warehouse =
          pos <= 7 ? "Vizag WH" : pos <= 14 ? "Hyderabad WH" : "Chennai WH";
        const status: BinStatus =
          level === 1 && pos <= 2 ? "Blocked" :
          level === 2 && pos <= 3 ? "Reserved" :
          level === 3 && pos <= 5 ? "Occupied" :
          "Available";

        const used = status === "Available" ? 0 : status === "Reserved" ? 30 : status === "Occupied" ? 80 : 0;
        const items: BinItem[] =
          status === "Occupied"
            ? [
                { sku: "ITM-002", name: "Safety Helmet", uom: "Nos", qty: 40, batch: "B-2402", expiry: "2026-03-20", receivedDate: "2026-02-05" },
                { sku: "ITM-005", name: "Packing Tape", uom: "Nos", qty: 120, batch: "B-2401", expiry: "2026-04-10", receivedDate: "2026-02-03" },
              ]
            : status === "Reserved"
            ? [{ sku: "ITM-008", name: "Stretch Film Roll", uom: "Nos", qty: 60, batch: "B-2312", expiry: "2026-02-18", receivedDate: "2026-01-25" }]
            : [];

        data.push({
          code: `L${String(level).padStart(2, "0")}/B${String(pos).padStart(2, "0")}`,
          level,
          position: pos,
          status,
          capacityUnits: 100,
          usedUnits: used,
          items,
          warehouse: wh,
        });
      }
    }
    return data;
  });

  const binsByWarehouse = useMemo(
    () => bins.filter((b) => b.warehouse === warehouse),
    [bins, warehouse]
  );

  const filteredBins = useMemo(() => {
    return binsByWarehouse.filter((b) => {
      const matchCode = b.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" ? true : b.status === statusFilter;
      return matchCode && matchStatus;
    });
  }, [binsByWarehouse, search, statusFilter]);

  const [selected, setSelected] = useState<Bin | null>(filteredBins[0] ?? null);
  const selectedBin = selected ?? filteredBins[0] ?? null;

  const totals = useMemo(() => {
    const total = filteredBins.length;
    const occupied = filteredBins.filter((b) => b.status === "Occupied").length;
    const reserved = filteredBins.filter((b) => b.status === "Reserved").length;
    const blocked = filteredBins.filter((b) => b.status === "Blocked").length;
    const available = filteredBins.filter((b) => b.status === "Available").length;
    return { total, occupied, reserved, blocked, available };
  }, [filteredBins]);

  const stockRows = useMemo<StockRow[]>(() => {
    const rows: StockRow[] = [];
    binsByWarehouse.forEach((b) => {
      b.items.forEach((it) => {
        rows.push({
          sku: it.sku,
          name: it.name,
          uom: it.uom,
          qty: it.qty,
          bin: b.code,
          status: b.status,
          receivedDate: it.receivedDate || "-",
        });
      });
    });
    return rows;
  }, [binsByWarehouse]);

  const filteredStock = useMemo(() => {
    const q = skuSearch.toLowerCase();
    setPage(1);
    return stockRows.filter((r) => {
      const matchSku = (r.sku + " " + r.name).toLowerCase().includes(q);
      const matchBin = r.bin.toLowerCase().includes(q);
      return matchSku || matchBin;
    });
  }, [stockRows, skuSearch]);

  const skuCount = filteredStock.reduce((sum, r) => sum + r.qty, 0);
  const totalPages = Math.max(1, Math.ceil(filteredStock.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedStock = useMemo(
    () => filteredStock.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredStock, safePage, pageSize]
  );

  const exportStockCSV = () => {
    const header = ["SKU", "Item", "Bin Location", "Qty", "UOM", "Received Date", "Status"];
    const lines = filteredStock.map((r) =>
      [r.sku, r.name, r.bin, r.qty, r.uom, r.receivedDate, r.status]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `warehouse-stock-${warehouse}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Warehouse Layout" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: FORTUNA_RED }} />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Warehouse Layout (Virtual Stock View)
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Zones → Aisles → Racks → Bins • Click any bin to view stock details.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-semibold transition",
              activeTab === "layout"
                ? "text-white shadow-md"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
            )}
            style={activeTab === "layout" ? { backgroundColor: FORTUNA_BLUE, borderColor: FORTUNA_BLUE } : undefined}
            onClick={() => setActiveTab("layout")}
            type="button"
          >
            Warehouse Layout
          </button>
          <button
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-semibold transition",
              activeTab === "stock"
                ? "text-white shadow-md"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
            )}
            style={activeTab === "stock" ? { backgroundColor: FORTUNA_RED, borderColor: FORTUNA_RED } : undefined}
            onClick={() => setActiveTab("stock")}
            type="button"
          >
            Warehouse Stock View
          </button>
        </div>

        {activeTab === "layout" && (
          <>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Warehouse</label>
                <select className={cn(inputBase, "mt-2")} value={warehouse} onChange={(e) => setWarehouse(e.target.value as Warehouse)}>
                  <option value="Vizag WH">Vizag WH</option>
                  <option value="Hyderabad WH">Hyderabad WH</option>
                  <option value="Chennai WH">Chennai WH</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Zone</label>
                <select className={cn(inputBase, "mt-2")} value={zone} onChange={(e) => setZone(e.target.value as Zone)}>
                  <option value="Zone-Receiving">Zone-Receiving</option>
                  <option value="Zone-Storage">Zone-Storage</option>
                  <option value="Zone-QC">Zone-QC</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Aisle</label>
                <select className={cn(inputBase, "mt-2")} value={aisle} onChange={(e) => setAisle(e.target.value as Aisle)}>
                  <option value="Aisle-01">Aisle-01</option>
                  <option value="Aisle-02">Aisle-02</option>
                  <option value="Aisle-03">Aisle-03</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Rack</label>
                <select className={cn(inputBase, "mt-2")} value={rack} onChange={(e) => setRack(e.target.value as Rack)}>
                  <option value="Rack-01">Rack-01</option>
                  <option value="Rack-02">Rack-02</option>
                  <option value="Rack-03">Rack-03</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Bin Search</label>
                <input className={cn(inputBase, "mt-2")} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ex: L02/B07" />
              </div>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <KPI title="Total Bins" value={totals.total} variant="red" />
              <KPI title="Available" value={totals.available} variant="blue" />
              <KPI title="Reserved" value={totals.reserved} variant="blue" />
              <KPI title="Occupied" value={totals.occupied} variant="red" />
              <KPI title="Blocked" value={totals.blocked} variant="red" />
            </div>

            {/* Main grid */}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* Bin Matrix */}
              <div className="xl:col-span-8">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {zone} → {aisle} → {rack}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                        Showing bins: {filteredBins.length}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className={cn(inputBase, "h-9")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                        <option value="All">All Status</option>
                        <option value="Available">Available</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="min-w-[900px] p-4">
                  {[6, 5, 4, 3, 2, 1].map((lvl) => (
                    <div key={lvl} className="mb-3 flex items-center gap-2">
                      <div className="w-10 text-xs font-semibold text-gray-500 dark:text-gray-300">L{String(lvl).padStart(2, "0")}</div>
                      <div className="grid grid-cols-20 gap-2 flex-1">
                            {filteredBins.filter((b) => b.level === lvl).map((b) => {
                              const isActive = selectedBin?.code === b.code;
                              return (
                                <button
                                  key={b.code}
                                  type="button"
                                  onClick={() => setSelected(b)}
                                  className={cn(
                                    "h-10 rounded-lg border text-xs font-semibold transition",
                                    isActive && "ring-2 ring-offset-1 ring-[rgba(0,95,153,0.35)]"
                                  )}
                                  style={{
                                    backgroundColor: statusColor[b.status],
                                    borderColor: statusBorder[b.status],
                                  }}
                                  title={`${b.code} • ${b.status}`}
                                >
                                  {b.position}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Legend:</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusBorder.Available }} />Available</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusBorder.Reserved }} />Reserved</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusBorder.Occupied }} />Occupied</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusBorder.Blocked }} />Blocked</span>
                  </div>
                </div>
              </div>

              {/* Bin Details */}
              <div className="xl:col-span-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Bin Details</h3>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_BLUE }} />
                  </div>

                  {!selectedBin ? (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                      Select a bin to view details.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Info label="Warehouse" value={warehouse} />
                        <Info label="Zone" value={zone} />
                        <Info label="Aisle" value={aisle} />
                        <Info label="Rack" value={rack} />
                        <Info label="Bin" value={selectedBin.code} />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-300">Status</div>
                          <div className="mt-1"><span className={statusChip(selectedBin.status)}>{selectedBin.status}</span></div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Capacity</span>
                          <span>{selectedBin.usedUnits}/{selectedBin.capacityUnits} units</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round((selectedBin.usedUnits / selectedBin.capacityUnits) * 100))}%`,
                              backgroundColor: FORTUNA_BLUE,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Stock in Bin</div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            SKU Count: {selectedBin.items.length}
                          </div>
                        </div>
                        <div className="mt-2 space-y-2">
                          {selectedBin.items.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                              No stock in this bin.
                            </div>
                          ) : (
                            selectedBin.items.map((it) => (
                              <div key={it.sku} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{it.sku} • {it.name}</div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                                      Qty: {it.qty} {it.uom}{it.batch ? ` • Batch: ${it.batch}` : ""}{it.expiry ? ` • Exp: ${it.expiry}` : ""}{it.receivedDate ? ` • Recv: ${it.receivedDate}` : ""}
                                    </div>
                                  </div>
                                  <div className="text-xs font-semibold" style={{ color: FORTUNA_BLUE }}>
                                    {inr(it.qty * 120)}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "stock" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Warehouse Stock View</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  Search by SKU, Item Name, or Bin Location.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className={cn(inputBase, "h-9")}
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value as Warehouse)}
                >
                  <option value="Vizag WH">Vizag WH</option>
                  <option value="Hyderabad WH">Hyderabad WH</option>
                  <option value="Chennai WH">Chennai WH</option>
                </select>
                <input
                  className={cn(inputBase, "h-9 w-60")}
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  placeholder="Search SKU / Bin"
                />
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  SKU Qty Total: <span style={{ color: FORTUNA_BLUE }}>{skuCount}</span>
                </div>
                <button
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-all"
                  style={{ backgroundColor: FORTUNA_BLUE }}
                  onClick={exportStockCSV}
                  type="button"
                >
                  Export Excel
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-[1000px] w-full border-collapse text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Bin Location</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left">UOM</th>
                    <th className="px-4 py-3 text-left">Received Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="dark:text-gray-200">
                  {pagedStock.map((r) => (
                    <tr key={`${r.sku}-${r.bin}`} className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold">{r.sku}</td>
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3">{r.bin}</td>
                      <td className="px-4 py-3 font-semibold">{r.qty}</td>
                      <td className="px-4 py-3">{r.uom}</td>
                      <td className="px-4 py-3">{r.receivedDate}</td>
                      <td className="px-4 py-3"><span className={statusChip(r.status)}>{r.status}</span></td>
                    </tr>
                  ))}

                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                        No SKU records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="text-gray-600 dark:text-gray-300">
                Showing {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredStock.length)} of {filteredStock.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className={cn(inputBase, "h-9 w-24")}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) as 10 | 20 | 50)}
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  Prev
                </button>
                <div className="text-gray-700 dark:text-gray-200">
                  Page {safePage} / {totalPages}
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({
  title,
  value,
  variant,
}: {
  title: string;
  value: string | number;
  variant: "red" | "blue";
}) {
  const isRed = variant === "red";

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 shadow-md border transition-all hover:scale-[1.02]"
      style={{
        background: isRed
          ? "linear-gradient(135deg, #C8102E 0%, #a50d26 100%)"
          : "linear-gradient(135deg, #005F99 0%, #004b7a 100%)",
        color: "white",
        border: "none",
      }}
    >
      {/* Glow effect */}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-300">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}
