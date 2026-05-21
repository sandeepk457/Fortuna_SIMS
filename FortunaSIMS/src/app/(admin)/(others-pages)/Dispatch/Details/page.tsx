"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const COLORS = {
  primary: "#005F99",
  secondary: "#C8102E",
  bg: "#ECF5FC",
  border: "#DCE6F2",
  text: "#5A1E1E",
};

type DispatchTab =
  | "overview"
  | "items"
  | "logistics"
  | "timeline"
  | "attachments";

const sampleItems = [
  {
    id: 1,
    sku: "FG-1001",
    description: "Industrial Valve",
    plannedQty: 120,
    dispatchedQty: 120,
    uom: "Nos",
  },
  {
    id: 2,
    sku: "FG-1002",
    description: "Electrical Motor",
    plannedQty: 80,
    dispatchedQty: 78,
    uom: "Nos",
  },
];

export default function DispatchDetailsPage() {
  const [activeTab, setActiveTab] =
    useState<DispatchTab>("overview");

  const totalPlannedQty = useMemo(
    () =>
      sampleItems.reduce(
        (sum, item) => sum + item.plannedQty,
        0
      ),
    []
  );

  const totalDispatchedQty = useMemo(
    () =>
      sampleItems.reduce(
        (sum, item) => sum + item.dispatchedQty,
        0
      ),
    []
  );

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: COLORS.bg }}
    >
      <PageBreadcrumb pageTitle="Dispatch Details" />

      {/* Header */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: COLORS.text }}
            >
              Dispatch Details
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Complete shipment execution and logistics tracking.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.history.back()}
              className="rounded-2xl border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>

            <button
              className="rounded-2xl bg-[#C8102E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#a70d26]"
            >
              Save Draft
            </button>

            <button
              className="rounded-2xl bg-[#005F99] px-5 py-3 text-sm font-semibold text-white hover:bg-[#004f82]"
            >
              Mark Dispatched
            </button>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="mt-6 rounded-3xl border bg-white shadow-sm">
        {/* Tabs */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex flex-wrap gap-3">
            {[
              "overview",
              "items",
              "logistics",
              "timeline",
              "attachments",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setActiveTab(tab as DispatchTab)
                }
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-[#005F99] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() +
                  tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border bg-slate-50 p-6">
                <h2
                  className="text-xl font-bold"
                  style={{ color: COLORS.text }}
                >
                  Dispatch Information
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    label="Dispatch No"
                    value="DCH-2026-0041"
                  />

                  <InfoCard
                    label="Warehouse"
                    value="Vizag Central"
                  />

                  <InfoCard
                    label="Destination"
                    value="Hyderabad RDC"
                  />

                  <InfoCard
                    label="Vehicle"
                    value="TN-45-AB-1234"
                  />
                </div>
              </div>

              <div className="rounded-3xl border bg-slate-50 p-6">
                <h2
                  className="text-xl font-bold"
                  style={{ color: COLORS.text }}
                >
                  Shipment Metrics
                </h2>

                <div className="mt-6 space-y-5">
                  <MetricCard
                    title="Planned Quantity"
                    value={totalPlannedQty}
                  />

                  <MetricCard
                    title="Dispatched Quantity"
                    value={totalDispatchedQty}
                  />

                  <div>
                    <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
                      <span>Completion</span>

                      <span>
                        {Math.round(
                          (totalDispatchedQty /
                            totalPlannedQty) *
                            100
                        )}
                        %
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#005F99] to-[#C8102E]"
                        style={{
                          width: `${
                            (totalDispatchedQty /
                              totalPlannedQty) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "items" && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-sm text-slate-700">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">
                      Description
                    </th>
                    <th className="px-4 py-3">
                      Planned Qty
                    </th>
                    <th className="px-4 py-3">
                      Dispatched Qty
                    </th>
                    <th className="px-4 py-3">UOM</th>
                  </tr>
                </thead>

                <tbody>
                  {sampleItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b"
                    >
                      <td className="px-4 py-4 font-semibold">
                        {item.sku}
                      </td>

                      <td className="px-4 py-4">
                        {item.description}
                      </td>

                      <td className="px-4 py-4">
                        {item.plannedQty}
                      </td>

                      <td className="px-4 py-4">
                        {item.dispatchedQty}
                      </td>

                      <td className="px-4 py-4">
                        {item.uom}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "logistics" && (
            <div className="rounded-3xl border bg-slate-50 p-6">
              <h2
                className="text-xl font-bold"
                style={{ color: COLORS.text }}
              >
                Logistics Information
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Transporter"
                  value="Apex Logistics"
                />

                <InfoCard
                  label="Driver"
                  value="Rajesh Kumar"
                />

                <InfoCard
                  label="ETA"
                  value="12-May-2026"
                />

                <InfoCard
                  label="Route"
                  value="Vizag → Vijayawada → Hyderabad"
                />
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              {[
                "Dispatch Created",
                "Loading Started",
                "Vehicle Departed",
                "Checkpoint Updated",
              ].map((event, index) => (
                <div
                  key={index}
                  className="rounded-3xl border bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800">
                      {event}
                    </div>

                    <div className="text-sm text-slate-500">
                      10:30 AM
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="rounded-3xl border border-dashed bg-slate-50 p-10 text-center">
              <div className="text-5xl">📎</div>

              <h2 className="mt-4 text-2xl font-bold text-slate-800">
                Upload Attachments
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Upload invoices, POD, manifests and transport documents.
              </p>

              <button className="mt-6 rounded-2xl bg-[#005F99] px-6 py-3 text-sm font-semibold text-white hover:bg-[#004f82]">
                Upload Files
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <div className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}