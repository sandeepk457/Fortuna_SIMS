"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import DispatchDetailModal from "@/components/dispatch/DispatchDetailModal";

const COLORS = {
  primary: "#005F99",
  secondary: "#C8102E",
  bg: "#ECF5FC",
  card: "#FFFFFF",
  border: "#DCE6F2",
  text: "#5A1E1E",
  muted: "#64748B",
  success: "#16A34A",
  warning: "#F59E0B",
};

type DispatchTab = "overview" | "items" | "logistics" | "timeline" | "attachments";

type DispatchStatus = "Ready" | "Dispatched" | "In Transit" | "Delivered";

type DispatchItem = {
  id: number;
  sku: string;
  description: string;
  plannedQty: number;
  dispatchedQty: number;
  uom: string;
  sourceBin: string;
  destinationBin: string;
};

type DispatchSummary = {
  dispatchNo: string;
  transferDate: string;
  fromWarehouse: string;
  toWarehouse: string;
  transporter: string;
  vehicle: string;
  driver: string;
  expectedArrival: string;
  status: DispatchStatus;
  route: string;
  remarks: string;
};

const overviewCards = [
  { title: "Pending Dispatch", value: 12, color: "#C8102E" },
  { title: "In Transit", value: 5, color: "#005F99" },
  { title: "Delivered", value: 28, color: "#C8102E" },
  { title: "Exceptions", value: 2, color: "#005F99" },
];

const sampleSummary: DispatchSummary = {
  dispatchNo: "DCH-2026-0041",
  transferDate: "2026-05-10",
  fromWarehouse: "Vizag Central Warehouse",
  toWarehouse: "Hyderabad RDC",
  transporter: "Apex Logistics",
  vehicle: "TN-45-AB-1234",
  driver: "Rajesh Kumar",
  expectedArrival: "2026-05-12",
  status: "Ready",
  route: "Vizag → Vijayawada → Hyderabad",
  remarks: "Load with care. Maintain ambient temperature."
};

const sampleItems: DispatchItem[] = [
  {
    id: 1,
    sku: "FG-1001",
    description: "Industrial Valve",
    plannedQty: 120,
    dispatchedQty: 120,
    uom: "Nos",
    sourceBin: "A1-12",
    destinationBin: "D1-03",
  },
  {
    id: 2,
    sku: "FG-1002",
    description: "Electrical Motor",
    plannedQty: 80,
    dispatchedQty: 78,
    uom: "Nos",
    sourceBin: "B3-05",
    destinationBin: "D1-08",
  },
  {
    id: 3,
    sku: "RM-5024",
    description: "Packaging Film Roll",
    plannedQty: 60,
    dispatchedQty: 60,
    uom: "Rolls",
    sourceBin: "C2-01",
    destinationBin: "D2-04",
  },
];

const eventTimeline = [
  { time: "08:10", event: "Dispatch order created", owner: "Operations" },
  { time: "09:30", event: "Loading started", owner: "Warehouse" },
  { time: "11:00", event: "Vehicle departed", owner: "Transport" },
  { time: "16:45", event: "Checkpoint update received", owner: "TMS" },
];

function badgeClass(status: DispatchStatus) {
  switch (status) {
    case "Ready":
      return "bg-blue-100 text-blue-700";
    case "Dispatched":
      return "bg-amber-100 text-amber-700";
    case "In Transit":
      return "bg-indigo-100 text-indigo-700";
    case "Delivered":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function StockTransferDispatchPage() {



  const [activeTab, setActiveTab] = useState<DispatchTab>("overview");

  const totalPlannedQty = useMemo(
    () => sampleItems.reduce((sum, item) => sum + item.plannedQty, 0),
    []
  );

  const totalDispatchedQty = useMemo(
    () => sampleItems.reduce((sum, item) => sum + item.dispatchedQty, 0),
    []
  );

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.bg }}>
      <PageBreadcrumb pageTitle="Dispatch" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" style={{ borderColor: COLORS.border }}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Dispatch Control</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Track and manage the active dispatch cycle for warehouse transfers. Review shipment details,
              logistics, exceptions and timelines in a single operational workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:shadow-lg"
              style={{ border: `1px solid ${COLORS.border}` }}
            >
              Reset View
            </button>
            <button
  onClick={() => window.location.href = "/Dispatch/details"}
  className="inline-flex items-center justify-center rounded-2xl bg-[#005F99] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#004f82]"
>
  Open Dispatch Details
</button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {overviewCards.map((card, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${card.color} 10%, ${card.color}99 95%)`,
              }}
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  {card.title}
                </div>
                <div className="mt-4 text-4xl font-bold">{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-slate-50 shadow-sm" style={{ borderColor: COLORS.border }}>
          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { key: "overview", label: "Overview" },
                { key: "items", label: "Items" },
                { key: "logistics", label: "Logistics" },
                { key: "timeline", label: "Timeline" },
                { key: "attachments", label: "Attachments" },
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as DispatchTab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[#C8102E] text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Dispatch summary</div>
                      <h2
  className="mt-2 text-2xl font-semibold"
  style={{ color: COLORS.text }}
>Current shipment details</h2>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${badgeClass(sampleSummary.status)}`}>
                      {sampleSummary.status}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Dispatch No", value: sampleSummary.dispatchNo },
                      { label: "Transfer Date", value: sampleSummary.transferDate },
                      { label: "From Warehouse", value: sampleSummary.fromWarehouse },
                      { label: "To Warehouse", value: sampleSummary.toWarehouse },
                    ].map((field) => (
                      <div key={field.label} className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                        <p
  className="text-xs font-semibold"
  style={{ color: COLORS.text }}
>
  {field.label}
</p>
                        <p
  className="mt-2 text-sm font-semibold"
  style={{ color: "#111827" }}
>{field.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Transporter", value: sampleSummary.transporter },
                      { label: "Vehicle", value: sampleSummary.vehicle },
                      { label: "Driver", value: sampleSummary.driver },
                      { label: "ETA", value: sampleSummary.expectedArrival },
                    ].map((field) => (
                      <div key={field.label} className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                        <p
  className="text-xs font-semibold"
  style={{ color: COLORS.text }}
>
  {field.label}
</p>
                        <p
  className="mt-2 text-sm font-semibold"
  style={{ color: "#111827" }}
>
  {field.value}
</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-3xl border border-gray-100 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Route</p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: "#111827" }}>
                      {sampleSummary.route}
                    </p>
                  </div>

                  <div className="mt-4 rounded-3xl border border-gray-100 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Dispatch notes</p>
                    <p className="mt-2 text-sm text-slate-700">{sampleSummary.remarks}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-[#F7F9FC] p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
  className="text-xs uppercase tracking-[0.24em]"
  style={{ color: COLORS.text, opacity: 0.6 }}
>
  Key metrics
</p>

<h3
  className="mt-2 text-xl font-semibold"
  style={{ color: COLORS.text }}
>
  Shipment health
</h3>
                    </div>
                    <div className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700">Live</div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p
                      className="text-sm font-semibold"
                      style={{ color: COLORS.text }}
                      >
                       Planned quantity
                      </p>

                    <div className="mt-2 text-3xl font-bold text-[#111827]">
                    </div>
                    </div>
                    <div>
                       <p
  className="text-sm font-semibold"
  style={{ color: COLORS.text }}>Dispatched quantity</p>
                      <div className="mt-2 text-3xl font-bold text-slate-900">{totalDispatchedQty}</div>
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Dispatch completion</span>
                        <span>{Math.round((totalDispatchedQty / totalPlannedQty) * 100)}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
                          style={{ width: `${(totalDispatchedQty / totalPlannedQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "items" && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dispatch items</p>
                    <h2 className="mt-2 text-2xl font-semibold" style={{ color: COLORS.text }}>
                      Items ready for shipment
                    </h2>
                  </div>
                  <button
                    className="rounded-2xl bg-[#005F99] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#004f82]"
                  >
                    Export Manifest
                  </button>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Planned</th>
                        <th className="px-4 py-3">Dispatched</th>
                        <th className="px-4 py-3">UOM</th>
                        <th className="px-4 py-3">Source Bin</th>
                        <th className="px-4 py-3">Dest Bin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleItems.map((item) => (
                        <tr key={item.id} className="rounded-3xl bg-slate-50 shadow-sm">
                          <td className="px-4 py-4 font-semibold text-slate-900">{item.sku}</td>
                          <td className="px-4 py-4 text-slate-600">{item.description}</td>
                          <td className="px-4 py-4 text-slate-900">{item.plannedQty}</td>
                          <td className="px-4 py-4 text-slate-900">{item.dispatchedQty}</td>
                          <td className="px-4 py-4 text-slate-700">{item.uom}</td>
                          <td className="px-4 py-4 text-slate-700">{item.sourceBin}</td>
                          <td className="px-4 py-4 text-slate-700">{item.destinationBin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "logistics" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div
  className="text-xs uppercase tracking-[0.24em]"
  style={{ color: COLORS.text, opacity: 0.6 }}
>Transport plan</div>
                  <h2 className="mt-2 text-2xl font-semibold" style={{ color: COLORS.text }}>
                    Carrier & routing
                  </h2>

                  <div className="mt-6 space-y-4 text-sm text-slate-700">
                    {[
                      { label: "Transporter", value: sampleSummary.transporter },
                      { label: "Vehicle number", value: sampleSummary.vehicle },
                      { label: "Driver", value: sampleSummary.driver },
                      { label: "ETA", value: sampleSummary.expectedArrival },
                      { label: "Route", value: sampleSummary.route },
                    ].map((field) => (
                      <div key={field.label} className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold" style={{ color: COLORS.text }}>
                          {field.label}
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div
  className="text-xs uppercase tracking-[0.24em]"
  style={{ color: COLORS.text, opacity: 0.6 }}
>
                    Operational notes
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold" style={{ color: COLORS.text }}>
                    Dispatch instructions
                  </h2>

                  <div className="mt-6 space-y-4 text-sm text-slate-700">
                    <div className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Loading priority</p>
                      <p className="mt-2">Load fragile items first, keep paperwork with driver, verify pallet labels before departure.</p>
                    </div>
                    <div className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Compliance checks</p>
                      <p className="mt-2">Ensure temperature control is validated and load weights do not exceed vehicle capacity.</p>
                    </div>
                    <div className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Communication</p>
                      <p className="mt-2">Share ETAs with receiving warehouse and monitor the first checkpoint from the transport partner.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dispatch timeline</p>
                    <h2 className="mt-2 text-2xl font-semibold" style={{ color: COLORS.text }}>
                      Event history
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Live tracking</span>
                </div>

                <div className="mt-6 space-y-4">
                  {eventTimeline.map((event, index) => (
                    <div key={index} className="flex flex-col rounded-3xl border border-gray-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{event.event}</p>
                        <p className="mt-1 text-xs text-slate-500">{event.owner}</p>
                      </div>
                      <div className="mt-3 rounded-3xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 sm:mt-0">{event.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F4F7FB] text-3xl text-[#005F99]">
                  📎
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-slate-900">Supporting documents</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Upload proofs of dispatch, shipment manifests, quality certificates and transporter paperwork.
                </p>
                <button
                  className="mt-6 rounded-2xl bg-[#005F99] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#004f82]"
                >
                  Upload Documents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
