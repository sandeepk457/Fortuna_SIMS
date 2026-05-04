"use client";

/* =========================================================================
   🚀 FORTUNA SIMS — STOCK TRANSFER REQUEST
   =========================================================================
   MODULE        : Inventory & WMS
   SCREEN        : Create Transfer
   PURPOSE       : Warehouse → Warehouse Stock Transfer
   DESIGN STYLE  : Enterprise Operational Workspace
   UI PRINCIPLE  : Transaction First (NOT Dashboard First)

   IMPORTANT:
   -------------------------------------------------------------------------
   ✔ Clean enterprise operational UI
   ✔ Minimal gradients
   ✔ SAP / Oracle inspired layout
   ✔ Grid-first architecture
   ✔ Compact WMS density
   ✔ Workflow-oriented
   ✔ Separate Dispatch/Receive/Approval modules
   ✔ Fortuna design system aligned

=========================================================================== */

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/* =========================================================================
   🎨 FORTUNA DESIGN TOKENS
=========================================================================== */

const COLORS = {
  primary: "#005F99",
  secondary: "#C8102E",

  bg: "#ECF5FC",
  card: "#FFFFFF",

  border: "#DCE6F2",

  text: "#0F172A",
  muted: "#64748B",

  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
};

/* =========================================================================
   🧠 TYPES
=========================================================================== */

type TabType =
  | "basic"
  | "items"
  | "reservation"
  | "logistics"
  | "attachments"
  | "approval";

type StatusType =
  | "Draft"
  | "Pending Approval"
  | "Approved";

type PriorityType =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

type ItemLine = {
  id: number;

  itemCode: string;
  itemName: string;
  category: string;

  availableQty: number;
  reservedQty: number;

  transferQty: number;

  uom: string;

  batch: string;

  sourceBin: string;
  destinationBin: string;

  remarks: string;
};

type TransferForm = {
  strNo: string;

  transferDate: string;

  fromWarehouse: string;
  toWarehouse: string;

  requestedBy: string;
  department: string;

  priority: PriorityType;

  requiredDate: string;

  transferReason: string;

  transporter: string;
  vehicleType: string;

  expectedTransit: string;

  approvalRequired: boolean;

  status: StatusType;

  notes: string;

  items: ItemLine[];
};

/* =========================================================================
   📦 MASTER DATA
=========================================================================== */

const warehouses = [
  "Vizag Central Warehouse",
  "Hyderabad RDC",
  "Chennai Distribution Hub",
  "Bangalore Fulfillment Center",
];

const departments = [
  "Supply Chain",
  "Warehouse Operations",
  "Procurement",
  "Production",
  "Quality Control",
];

const priorities = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const demoItems = [
  {
    code: "FG-1001",
    name: "Industrial Valve",
    category: "Mechanical",
    stock: 540,
    uom: "Nos",
  },
  {
    code: "FG-1002",
    name: "Electrical Motor",
    category: "Electrical",
    stock: 86,
    uom: "Nos",
  },
];

/* =========================================================================
   🎨 COMMON UI
=========================================================================== */

const sectionCard =
  "rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:ring-3 " +
  "focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 " +
  "dark:border-gray-800 dark:text-white/90";

const labelClass =
  "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold text-white " +
  "shadow-theme-sm focus:outline-none focus:ring-3 focus:ring-brand-500/20 active:scale-95 transition-all";

const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 " +
  "shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10";

/* =========================================================================
   🚀 PAGE
=========================================================================== */

export default function StockTransferRequestPage() {

  /* =======================================================================
     STATE
  ======================================================================= */

  const [activeTab, setActiveTab] =
    useState<TabType>("basic");

  const [form, setForm] =
    useState<TransferForm>({
      strNo: "STR-2026-000145",

      transferDate: "2026-04-28",

      fromWarehouse: "",
      toWarehouse: "",

      requestedBy: "Sandeep Kondapalli",
      department: "Supply Chain",

      priority: "Medium",

      requiredDate: "",

      transferReason: "",

      transporter: "",
      vehicleType: "",

      expectedTransit: "",

      approvalRequired: true,

      status: "Draft",

      notes: "",

      items: [],
    });

  /* =======================================================================
     KPI
  ======================================================================= */

  const totalLines =
    form.items.length;

  const totalQty = useMemo(() => {
    return form.items.reduce(
      (sum, item) =>
        sum + Number(item.transferQty || 0),
      0
    );
  }, [form.items]);

  /* =======================================================================
     ITEM FUNCTIONS
  ======================================================================= */

  const addItem = () => {

    const sample = demoItems[0];

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),

          itemCode: sample.code,
          itemName: sample.name,
          category: sample.category,

          availableQty: sample.stock,
          reservedQty: 0,

          transferQty: 0,

          uom: sample.uom,

          batch: "",

          sourceBin: "",
          destinationBin: "",

          remarks: "",
        },
      ],
    }));
  };

  const updateItem = (
    index: number,
    field: keyof ItemLine,
    value: any
  ) => {

    const cloned =
      [...form.items];

    cloned[index] = {
      ...cloned[index],
      [field]: value,
    };

    setForm({
      ...form,
      items: cloned,
    });
  };

  const removeItem = (
    index: number
  ) => {

    setForm({
      ...form,
      items: form.items.filter(
        (_, i) => i !== index
      ),
    });
  };

  /* =======================================================================
     SAVE
  ======================================================================= */

  const saveDraft = () => {
    alert("Draft Saved");
  };

  const sendApproval = () => {

    setForm((prev) => ({
      ...prev,
      status: "Pending Approval",
    }));

    alert("Approval Sent");
  };

  /* =======================================================================
     RENDER
  ======================================================================= */

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: COLORS.bg,
      }}
    >

      {/* ===================================================================
         BREADCRUMB
      =================================================================== */}

      <PageBreadcrumb pageTitle="Create Transfer" />

      {/* ===================================================================
         HEADER
      =================================================================== */}

      <div
        className={`${sectionCard} p-4`}
      >

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

          {/* LEFT */}
          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-[32px] leading-none font-semibold tracking-[-0.5px] text-[#111827]">
                Stock Transfer Request
              <p className="mt-3 text-sm text-[#7C2D12]">
              Flow: Draft → Approval → Reservation → Dispatch → Receive → Close
              </p>

              </h1>
            
              <div
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{
                  background:
                    form.status === "Draft"
                      ? COLORS.primary
                      : COLORS.warning,
                }}
              >
                {form.status}
              </div>

            </div>

            {/* INFO STRIP */}
            <div className="mt-5 flex flex-wrap gap-8 text-sm">

              <div>
                <span className="text-slate-500">
                  STR No
                </span>

                <div className="mt-1 font-semibold text-slate-800">
                  {form.strNo}
                </div>
              </div>

              <div>
                <span className="text-slate-500">
                  Transfer Date
                </span>

                <div className="mt-1 font-semibold text-slate-800">
                  {form.transferDate}
                </div>
              </div>

              <div>
                <span className="text-slate-500">
                  Department
                </span>

                <div className="mt-1 font-semibold text-slate-800">
                  {form.department}
                </div>
              </div>

            </div>

            {/* WORKFLOW */}
            <div className="mt-8 flex flex-wrap items-center gap-4">

              {[
                "Draft",
                "Pending Approval",
                "Approved",
              ].map((step, index) => {

                const active =
                  step === form.status;

                return (
                  <React.Fragment
                    key={step}
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold"
                        style={{
                          borderColor: active
                            ? COLORS.primary
                            : COLORS.border,

                          background: active
                            ? COLORS.primary
                            : "white",

                          color: active
                            ? "white"
                            : COLORS.text,
                        }}
                      >
                        {index + 1}
                      </div>

                      <span
                        className={`text-sm font-semibold ${
                          active
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {step}
                      </span>

                    </div>

                    {index !== 2 && (
                      <div className="h-[2px] w-10 bg-slate-200" />
                    )}

                  </React.Fragment>
                );
              })}

            </div>

          </div>

          {/* RIGHT ACTIONS */}
         <div className="flex flex-wrap items-center gap-2">

            <button
              className={outlineBtn}
            >
              Cancel
            </button>

            <button
              className={primaryBtn}
              style={{
                background:
                  COLORS.primary,
              }}
              onClick={saveDraft}
            >
              Save Draft
            </button>

            <button
              className={primaryBtn}
              style={{
                background:
                  COLORS.secondary,
              }}
              onClick={sendApproval}
            >
              Send Approval
            </button>

          </div>

        </div>

      </div>

      {/* ===================================================================
         SUMMARY STRIP
      =================================================================== */}

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">

        {[
          {
            title: "Total Lines",
            value: totalLines,
          },
          {
            title: "Transfer Qty",
            value: totalQty,
          },
          {
            title: "Priority",
            value: form.priority,
          },
          {
            title: "Approval",
            value:
              form.approvalRequired
                ? "Required"
                : "Not Required",
          },
        ].map((card, index) => (
          <div
            key={index}
            className={`${sectionCard} p-3`}
          >

            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.title}
            </div>

            <div className="mt-3 text-lg font-bold text-slate-800">
              {card.value}
            </div>

          </div>
        ))}

      </div>

      {/* ===================================================================
         WORKSPACE
      =================================================================== */}

      <div
        className={`${sectionCard} mt-5`}
      >

        {/* ================================================================
           TABS
        ================================================================ */}

        <div className="border-b border-[#DCE6F2] bg-white px-5 py-4">

          <div className="flex flex-wrap gap-3">

            {[
              {
                key: "basic",
                label: "Basic Info",
              },
              {
                key: "items",
                label: "Transfer Items",
              },
              {
                key: "reservation",
                label: "Reservation",
              },
              {
                key: "logistics",
                label: "Logistics",
              },
              {
                key: "attachments",
                label: "Attachments",
              },
              {
                key: "approval",
                label: "Approval Trail",
              },
            ].map((tab) => {

              const active =
                activeTab === tab.key;

              return (
                <button
  key={tab.key}
  onClick={() =>
    setActiveTab(
      tab.key as TabType
    )
  }
  className="relative rounded-lg px-3 py-2 text-sm font-semibold transition"
  style={{
    backgroundColor: active
      ? "#C8102E"
      : undefined,

    color: active
      ? "white"
      : "#C8102E",
  }}
>
  {tab.label}

  {active && (
    <span
      className="absolute -bottom-[6px] left-3 right-3 h-[3px] rounded-full"
      style={{
        backgroundColor: "#005F99",
      }}
    />
  )}
</button>
              );
            })}

          </div>

        </div>

        {/* ================================================================
           TAB CONTENT
        ================================================================ */}

        <div className="p-6">

          {/* ==============================================================
             BASIC INFO
          ============================================================== */}

          {activeTab === "basic" && (

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

              {/* LEFT */}
              <div className={`${sectionCard} p-5`}>

                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Transfer Information
                </h3>

                <div className="space-y-5">

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div>
                      <label className={labelClass}>
                        From Warehouse
                      </label>

                      <select
                        value={
                          form.fromWarehouse
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            fromWarehouse:
                              e.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Select Warehouse
                        </option>

                        {warehouses.map(
                          (wh) => (
                            <option
                              key={wh}
                            >
                              {wh}
                            </option>
                          )
                        )}

                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        To Warehouse
                      </label>

                      <select
                        value={
                          form.toWarehouse
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            toWarehouse:
                              e.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Select Warehouse
                        </option>

                        {warehouses.map(
                          (wh) => (
                            <option
                              key={wh}
                            >
                              {wh}
                            </option>
                          )
                        )}

                      </select>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div>
                      <label className={labelClass}>
                        Priority
                      </label>

                      <select
                        value={form.priority}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            priority:
                              e.target
                                .value as PriorityType,
                          })
                        }
                        className={inputClass}
                      >

                        {priorities.map(
                          (priority) => (
                            <option
                              key={
                                priority
                              }
                            >
                              {priority}
                            </option>
                          )
                        )}

                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Required Date
                      </label>

                      <input
                        type="date"
                        value={
                          form.requiredDate
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            requiredDate:
                              e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                  </div>

                  <div>
                    <label className={labelClass}>
                      Transfer Reason
                    </label>

                    <textarea
                      value={
                        form.transferReason
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          transferReason:
                            e.target.value,
                        })
                      }
                      className={`${inputClass} min-h-[140px]`}
                    />
                  </div>

                </div>

              </div>

              {/* RIGHT */}
              <div className={`${sectionCard} p-5`}>

                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Request Details
                </h3>

                <div className="space-y-5">

                  <div>
                    <label className={labelClass}>
                      Requested By
                    </label>

                    <input
                      value={
                        form.requestedBy
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requestedBy:
                            e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
  <label className={labelClass}>
    Department
  </label>

  <select
    value={form.department}
    onChange={(e) =>
      setForm({
        ...form,
        department: e.target.value,
      })
    }
    className={inputClass}
  >
    <option value="">Select Department</option>

    {departments.map((dept) => (
      <option key={dept} value={dept}>
        {dept}
      </option>
    ))}
  </select>
</div>

                  <div>
                    <label className={labelClass}>
                      Notes
                    </label>

                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          notes:
                            e.target.value,
                        })
                      }
                      className={`${inputClass} min-h-[140px]`}
                    />
                  </div>

                </div>

              </div>

            </div>

          )}

          {/* ==============================================================
             ITEMS
          ============================================================== */}

          {activeTab === "items" && (

            <div className="space-y-5">

              {/* TOOLBAR */}
              <div
                className={`${sectionCard} flex flex-wrap items-center justify-between gap-4 p-4`}
              >

                <div>

                  <h3 className="text-lg font-bold text-slate-800">
                    Transfer Items
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Warehouse transfer operational grid
                  </p>

                </div>

                <div className="flex flex-wrap gap-3">

                  <button
                    className={outlineBtn}
                  >
                    Import Excel
                  </button>

                  <button
                    className={outlineBtn}
                  >
                    Check Availability
                  </button>

                  <button
                    className={primaryBtn}
                    style={{
                      background:
                        COLORS.primary,
                    }}
                    onClick={addItem}
                  >
                    + Add Item
                  </button>

                </div>

              </div>

              {/* GRID */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">

                <div className="fortuna-scrollbar max-h-[520px] w-full overflow-auto">

                  <table className="min-w-[1900px] w-full border-collapse">

                    <thead className="sticky top-0 z-20 bg-[#C8102E]">

                      <tr className="border-b border-[#DCE6F2]">

                        {[
                          "Item Code",
                          "Item Name",
                          "Category",
                          "Available",
                          "Reserved",
                          "Transfer Qty",
                          "UOM",
                          "Batch",
                          "Source Bin",
                          "Destination Bin",
                          "Remarks",
                          "Action",
                        ].map((head) => (
                          <th
                            key={head}
                            className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white"
                          >
                            {head}
                          </th>
                        ))}

                      </tr>

                    </thead>

                    <tbody>

                      {form.items.map(
                        (item, index) => (

                          <tr
                            key={item.id}
                            className="border-b border-[#EEF2F7] hover:bg-[#FAFCFF]"
                          >

                            <td className="px-3 py-2">
                              <input
                                value={
                                  item.itemCode
                                }
                                className={inputClass}
                                readOnly
                              />
                            </td>

                            <td className="px-3 py-2">
                              <input
                                value={
                                  item.itemName
                                }
                                className={`${inputClass} min-w-[220px]`}
                                readOnly
                              />
                            </td>

                            <td className="px-3 py-2">
                              <input
                                value={
                                  item.category
                                }
                                className={inputClass}
                                readOnly
                              />
                            </td>

                            <td className="px-3 py-2">

                              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700">
                                {
                                  item.availableQty
                                }
                              </div>

                            </td>

                            <td className="px-3 py-2">

                              <div className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-700">
                                {
                                  item.reservedQty
                                }
                              </div>

                            </td>

                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={
                                  item.transferQty
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "transferQty",
                                    Number(
                                      e.target
                                        .value
                                    )
                                  )
                                }
                                className={`${inputClass} w-[120px]`}
                              />
                            </td>

                            <td className="px-3 py-2">
                              <input
                                value={item.uom}
                                className={`${inputClass} w-[90px]`}
                                readOnly
                              />
                            </td>

                            <td className="px-3 py-2">
                              <input
                                value={
                                  item.batch
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "batch",
                                    e.target
                                      .value
                                  )
                                }
                                className={inputClass}
                              />
                            </td>

                            <td className="px-3 py-2">
                              <input
                                value={
                                  item.sourceBin
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "sourceBin",
                                    e.target
                                      .value
                                  )
                                }
                                className={inputClass}
                              />
                            </td>

                            <td className="px-3 py-2">
                              <input
                                value={
                                  item.destinationBin
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "destinationBin",
                                    e.target
                                      .value
                                  )
                                }
                                className={inputClass}
                              />
                            </td>

                            <td className="px-3 py-2">
                              <input
                                value={
                                  item.remarks
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "remarks",
                                    e.target
                                      .value
                                  )
                                }
                                className={`${inputClass} min-w-[180px]`}
                              />
                            </td>

                            <td className="px-3 py-2">

                              <button
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                              >
                                Remove
                              </button>

                            </td>

                          </tr>
                        )
                      )}

                      {form.items.length ===
                        0 && (

                        <tr>

                          <td
                            colSpan={12}
                            className="px-10 py-16 text-center"
                          >

                            <div className="text-lg font-semibold text-slate-600">
                              No transfer items added
                            </div>

                            {/* <button
                              className={`${primaryBtn} mt-5`}
                              style={{
                                background:
                                  COLORS.primary,
                              }}
                              onClick={addItem}
                            >
                              Add First Item
                            </button> */}

                          </td>

                        </tr>
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

          )}

          {/* ==============================================================
             RESERVATION
          ============================================================== */}

          {activeTab === "reservation" && (

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

              {[
                {
                  title:
                    "Stock Availability",
                  value: "Available",
                  color:
                    COLORS.success,
                },
                {
                  title:
                    "Reservation Status",
                  value: "Pending",
                  color:
                    COLORS.warning,
                },
                {
                  title:
                    "Bin Allocation",
                  value: "Not Allocated",
                  color:
                    COLORS.primary,
                },
              ].map((card, index) => (
                <div
                  key={index}
                  className={`${sectionCard} p-5`}
                >

                  <div className="text-sm font-semibold text-slate-500">
                    {card.title}
                  </div>

                  <div
                    className="mt-4 text-lg font-bold"
                    style={{
                      color: card.color,
                    }}
                  >
                    {card.value}
                  </div>

                </div>
              ))}

            </div>

          )}

          {/* ==============================================================
             LOGISTICS
          ============================================================== */}

          {activeTab === "logistics" && (

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

              <div className={`${sectionCard} p-5`}>

                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Logistics Planning
                </h3>

                <div className="space-y-5">

                  <div>
                    <label className={labelClass}>
                      Transporter
                    </label>

                    <input
                      value={
                        form.transporter
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          transporter:
                            e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Vehicle Type
                    </label>

                    <input
                      value={
                        form.vehicleType
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          vehicleType:
                            e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Expected Transit
                    </label>

                    <input
                      value={
                        form.expectedTransit
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          expectedTransit:
                            e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                </div>

              </div>

              <div className={`${sectionCard} p-5 xl:col-span-2`}>

  <div className="flex items-center justify-between">

    <h3 className="text-lg font-semibold text-[#111827]">
      Dispatch Planning Notes
    </h3>

    <span className="text-xs text-slate-400">
      Operational Instructions
    </span>

  </div>

  <div className="mt-4">

    <textarea
  placeholder="Enter dispatch instructions, loading notes, handling instructions..."
  className="
    w-full
    h-[140px]
    rounded-xl
    border border-gray-200
    bg-white
    px-4 py-3
    text-sm text-gray-800
    placeholder:text-gray-400
    focus:outline-none
    focus:ring-2 focus:ring-[#005F99]/20
    resize-y
  "
/>

  </div>

</div>

            </div>

          )}

          {/* ==============================================================
             ATTACHMENTS
          ============================================================== */}

          {activeTab === "attachments" && (

            <div
              className={`${sectionCard} p-10 text-center`}
            >

              <div className="text-5xl">
                📎
              </div>

              <div className="mt-5 text-xl font-semibold text-slate-700">
                Upload Attachments
              </div>

              <div className="mt-2 text-sm text-slate-500">
                Upload supporting documents for transfer request
              </div>

              <button
                className={`${primaryBtn} mt-6`}
                style={{
                  background:
                    COLORS.primary,
                }}
              >
                Browse Files
              </button>

            </div>

          )}

          {/* ==============================================================
             APPROVAL
          ============================================================== */}

          {activeTab === "approval" && (

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

              {/* MATRIX */}
              <div className={`${sectionCard} p-5`}>

                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Approval Workflow
                </h3>

                <div className="space-y-4">

                  {[
                    "Warehouse Manager",
                    "Inventory Controller",
                    "SCM Head",
                  ].map((role, index) => (

                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-[#DCE6F2] p-4"
                    >

                      <div>

                        <div className="font-semibold text-slate-800">
                          {role}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Pending Approval
                        </div>

                      </div>

                      <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Waiting
                      </div>

                    </div>
                  ))}

                </div>

              </div>

              {/* AUDIT */}
              <div className={`${sectionCard} p-5`}>

                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  Audit Trail
                </h3>

                <div className="space-y-5">

                  {[
                    {
                      action:
                        "Transfer Created",
                      user:
                        "Sandeep Kondapalli",
                    },
                    {
                      action:
                        "Draft Saved",
                      user:
                        "Sandeep Kondapalli",
                    },
                  ].map((log, index) => (

                    <div
                      key={index}
                      className="flex gap-4"
                    >

                      <div className="mt-1 h-3 w-3 rounded-full bg-[#005F99]" />

                      <div>

                        <div className="font-semibold text-slate-800">
                          {log.action}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {log.user}
                        </div>

                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

      {/* ===================================================================
         STICKY FOOTER
      =================================================================== */}

      <div className="sticky bottom-0 mt-6">

        <div
          className={`${sectionCard} flex flex-wrap items-center justify-between gap-5 border px-5 py-4`}
        >

          <div className="flex flex-wrap gap-8">

            <div>

              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </div>

              <div className="mt-1 text-lg font-bold text-slate-800">
                {form.status}
              </div>

            </div>

            <div>

              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Qty
              </div>

              <div className="mt-1 text-lg font-bold text-slate-800">
                {totalQty}
              </div>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              className={outlineBtn}
            >
              Cancel
            </button>

            <button
              className={primaryBtn}
              style={{
                background:
                  COLORS.primary,
              }}
              onClick={saveDraft}
            >
              Save Draft
            </button>

            <button
              className={primaryBtn}
              style={{
                background:
                  COLORS.secondary,
              }}
              onClick={sendApproval}
            >
              Send Approval
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}