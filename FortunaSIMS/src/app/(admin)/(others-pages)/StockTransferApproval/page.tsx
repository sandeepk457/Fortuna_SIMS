"use client";

import { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  CheckCircle,
  XCircle,
  Clock3,
  Eye,
  Printer,
  AlertTriangle,
} from "lucide-react";

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

const sectionCard =
  "rounded-2xl border border-[#DCE6F2] bg-white shadow-sm";

const inputClass =
  "w-full rounded-xl border border-[#DCE6F2] bg-white px-4 py-3 text-sm outline-none";

const primaryBtn =
  "rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all";

const outlineBtn =
  "rounded-xl border border-[#DCE6F2] bg-white px-4 py-2 text-sm font-semibold";

/* =========================================================================
   TYPES
=========================================================================== */

type ApprovalStatus =
  | "Waiting"
  | "Approved"
  | "Rejected"
  | "Hold";

type TransferRow = {
  id: number;
  strNo: string;
  from: string;
  to: string;
  requestedBy: string;
  priority: string;
  qty: number;
  value: number;
  status: string;
  stage: string;
  date: string;
};

export default function StockTransferApprovalPage() {
  /* =========================================================================
     STATE
  ========================================================================== */

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [openView, setOpenView] = useState(false);

  const [selectedTransfer, setSelectedTransfer] =
    useState<TransferRow | null>(null);

  const [approvalComment, setApprovalComment] =
    useState("");

  const [decision, setDecision] =
    useState<ApprovalStatus>("Waiting");

  /* =========================================================================
     DATA
  ========================================================================== */

  const transfers: TransferRow[] = [
    {
      id: 1,
      strNo: "STR-2026-001",
      from: "Vizag Central Warehouse",
      to: "Hyderabad RDC",
      requestedBy: "Sandeep Kondapalli",
      priority: "High",
      qty: 240,
      value: 185000,
      status: "Pending",
      stage: "Warehouse Manager",
      date: "2026-05-24",
    },

    {
      id: 2,
      strNo: "STR-2026-002",
      from: "Chennai WH",
      to: "Bangalore RDC",
      requestedBy: "Ravi Kumar",
      priority: "Medium",
      qty: 120,
      value: 85000,
      status: "Pending",
      stage: "Inventory Controller",
      date: "2026-05-23",
    },

    {
      id: 3,
      strNo: "STR-2026-003",
      from: "Delhi WH",
      to: "Mumbai RDC",
      requestedBy: "Praveen",
      priority: "Critical",
      qty: 500,
      value: 420000,
      status: "In Review",
      stage: "SCM Head",
      date: "2026-05-22",
    },
  ];

  /* =========================================================================
     KPI
  ========================================================================== */

  const totalQty = useMemo(() => {
    return transfers.reduce(
      (sum, row) => sum + row.qty,
      0
    );
  }, [transfers]);

  const totalValue = useMemo(() => {
    return transfers.reduce(
      (sum, row) => sum + row.value,
      0
    );
  }, [transfers]);

  /* =========================================================================
     FUNCTIONS
  ========================================================================== */

  const toggleSelect = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(
        selectedRows.filter((x) => x !== id)
      );
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === transfers.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(
        transfers.map((x) => x.id)
      );
    }
  };

  const openViewPopup = (row: TransferRow) => {
    setSelectedTransfer(row);
    setOpenView(true);
  };

  /* =========================================================================
     RENDER
  ========================================================================== */

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: COLORS.bg,
      }}
    >
      {/* ================================================================
         BREADCRUMB
      ================================================================= */}

      <PageBreadcrumb pageTitle="Stock Transfer Approval" />

      {/* ================================================================
         HEADER
      ================================================================= */}

      <div className={`${sectionCard} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-[32px] font-bold text-[#111827]">
              Transfer Approval Workspace
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review, approve and control
              inter-warehouse transfer requests.
            </p>

            <div className="mt-5 flex flex-wrap gap-6 text-sm">
              <div>
                <div className="text-slate-400">
                  Pending Approvals
                </div>

                <div className="mt-1 text-lg font-bold text-[#111827]">
                  12
                </div>
              </div>

              <div>
                <div className="text-slate-400">
                  Approved Today
                </div>

                <div className="mt-1 text-lg font-bold text-[#111827]">
                  8
                </div>
              </div>

              <div>
                <div className="text-slate-400">
                  Critical Requests
                </div>

                <div className="mt-1 text-lg font-bold text-[#111827]">
                  3
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap gap-3">
            <button
              className={primaryBtn}
              style={{
                background: COLORS.success,
              }}
            >
              Bulk Approve
            </button>

            <button
              className={primaryBtn}
              style={{
                background: COLORS.danger,
              }}
            >
              Bulk Reject
            </button>

            <button
              className={primaryBtn}
              style={{
                background: COLORS.primary,
              }}
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
         KPI
      ================================================================= */}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Pending",
            value: "12",
            color: "#C8102E",
          },

          {
            title: "Approved Today",
            value: "08",
            color: "#005F99",
          },

          {
            title: "Critical",
            value: "03",
            color: "#F59E0B",
          },

          {
            title: "In Review",
            value: "05",
            color: "#16A34A",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="rounded-2xl p-5 text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${card.color}99 0%, ${card.color} 100%)`,
            }}
          >
            <div className="text-xs uppercase tracking-wider text-white/70">
              {card.title}
            </div>

            <div className="mt-3 text-3xl font-bold">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================================================================
         FILTERS
      ================================================================= */}

      <div className={`${sectionCard} mt-5 p-5`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <input
            placeholder="Search STR No"
            className={inputClass}
          />

          <input
            placeholder="Warehouse"
            className={inputClass}
          />

          <select className={inputClass}>
            <option>Priority</option>
          </select>

          <select className={inputClass}>
            <option>Status</option>
          </select>

          <input
            type="date"
            className={inputClass}
          />

          <button
            className={primaryBtn}
            style={{
              background: COLORS.secondary,
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* ================================================================
         GRID
      ================================================================= */}

      <div className={`${sectionCard} mt-5 overflow-hidden`}>
        <div className="overflow-auto">
          <table className="min-w-full">
            <thead className="bg-[#C8102E]">
  <tr>

    {/* SELECT ALL CHECKBOX */}

    <th className="px-4 py-4">
      <input
        type="checkbox"
        checked={
          selectedRows.length === transfers.length
        }
        onChange={toggleSelectAll}
      />
    </th>

    {[
      "STR No",
      "From WH",
      "To WH",
      "Requested By",
      "Priority",
      "Qty",
      "Status",
      "Approval Stage",
      "Requested Date",
      "Actions",
    ].map((head) => (
      <th
        key={head}
        className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white"
      >
        {head}
      </th>
    ))}
  </tr>
</thead>

            <tbody>
              {transfers.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#EEF2F7] hover:bg-[#F9FBFD]"
                >
                  {/* SELECT */}

                  <td className="px-4 py-5">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(
                        row.id
                      )}
                      onChange={() =>
                        toggleSelect(row.id)
                      }
                    />
                  </td>

                  {/* STR */}

                  <td className="px-4 py-5">
                    <div className="font-bold text-[#111827]">
                      {row.strNo}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      SLA : 12 Hours
                    </div>
                  </td>

                  <td className="px-4 py-5 text-sm font-semibold text-[#005F99]">
                    {row.from}
                  </td>

                  <td className="px-4 py-5 text-sm font-semibold text-[#005F99]">
                    {row.to}
                  </td>

                  <td className="px-4 py-5 text-sm">
                    {row.requestedBy}
                  </td>

                  {/* PRIORITY */}

                  <td className="px-4 py-5">
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        row.priority === "Critical"
                          ? "bg-red-100 text-red-700"
                          : row.priority === "High"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {row.priority}
                    </div>
                  </td>

                  {/* QTY */}

                  <td className="px-4 py-5 font-bold text-[#111827]">
                    {row.qty}
                  </td>

                  {/* STATUS */}

                  <td className="px-4 py-5">
                    <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                      {row.status}
                    </div>
                  </td>

                  {/* STAGE */}

                  <td className="px-4 py-5 text-sm font-semibold">
                    {row.stage}
                  </td>

                  {/* DATE */}

                  <td className="px-4 py-5 text-sm">
                    {row.date}
                  </td>

                  {/* ACTIONS */}

                  <td className="px-4 py-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          openViewPopup(row)
                        }
                        className="rounded-xl bg-[#005F99] px-3 py-2 text-white"
                      >
                        <Eye size={16} />
                      </button>

                      <button className="rounded-xl bg-green-600 px-3 py-2 text-white">
                        <CheckCircle size={16} />
                      </button>

                      <button className="rounded-xl bg-red-600 px-3 py-2 text-white">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================
         FOOTER BAR
      ================================================================= */}

      <div className="sticky bottom-0 mt-6">
        <div
          className={`${sectionCard} flex flex-wrap items-center justify-between gap-5 px-5 py-4`}
        >
          <div className="flex flex-wrap gap-8">
            <div>
              <div className="text-xs uppercase text-slate-400">
                Selected Requests
              </div>

              <div className="mt-1 text-xl font-bold">
                {selectedRows.length}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-slate-400">
                Total Qty
              </div>

              <div className="mt-1 text-xl font-bold">
                {totalQty}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-slate-400">
                Total Value
              </div>

              <div className="mt-1 text-xl font-bold">
                ₹₹{new Intl.NumberFormat("en-IN").format(totalValue)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className={primaryBtn}
              style={{
                background: COLORS.success,
              }}
            >
              Bulk Approve
            </button>

            <button
              className={primaryBtn}
              style={{
                background: COLORS.danger,
              }}
            >
              Bulk Reject
            </button>

            <button
              className={primaryBtn}
              style={{
                background: COLORS.primary,
              }}
            >
              Print STR
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
         VIEW POPUP
      ================================================================= */}

      {openView && selectedTransfer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[1400px] overflow-auto rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-20 border-b border-[#DCE6F2] bg-white px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[32px] font-bold text-[#111827]">
                    Approval Review
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Enterprise transfer approval
                    workspace
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpenView(false)
                  }
                  className="rounded-2xl bg-[#F3F7FB] px-4 py-3 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CONTENT */}

            <div className="grid grid-cols-1 gap-6 p-8 xl:grid-cols-3">
              {/* LEFT */}

              <div className="space-y-6 xl:col-span-2">
                {/* INFO */}

                <div
                  className={`${sectionCard} grid grid-cols-1 gap-5 p-6 md:grid-cols-2`}
                >
                  {[
                    {
                      title: "STR Number",
                      value:
                        selectedTransfer.strNo,
                    },

                    {
                      title: "Requested By",
                      value:
                        selectedTransfer.requestedBy,
                    },

                    {
                      title: "From Warehouse",
                      value:
                        selectedTransfer.from,
                    },

                    {
                      title: "To Warehouse",
                      value:
                        selectedTransfer.to,
                    },

                    {
                      title: "Priority",
                      value:
                        selectedTransfer.priority,
                    },

                    {
                      title: "Transfer Qty",
                      value:
                        selectedTransfer.qty,
                    },
                  ].map((field, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-[#DCE6F2] p-5"
                    >
                      <div className="text-xs uppercase text-slate-400">
                        {field.title}
                      </div>

                      <div className="mt-2 text-lg font-bold text-[#111827]">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ITEMS */}

                <div className={`${sectionCard} p-6`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#111827]">
                      Transfer Items
                    </h3>

                    <button
                      className={primaryBtn}
                      style={{
                        background:
                          COLORS.primary,
                      }}
                    >
                      <Printer size={16} />
                    </button>
                  </div>

                  <div className="mt-5 overflow-auto rounded-2xl border border-[#DCE6F2]">
                    <table className="min-w-full">
                      <thead className="bg-[#C8102E]">
                        <tr>
                          {[
                            "Item",
                            "Qty",
                            "Available",
                            "Bin",
                          ].map((head) => (
                            <th
                              key={head}
                              className="px-4 py-4 text-left text-xs font-bold uppercase text-white"
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b">
                          <td className="px-4 py-4 font-semibold">
                            Industrial Valve
                          </td>

                          <td className="px-4 py-4">
                            120
                          </td>

                          <td className="px-4 py-4">
                            540
                          </td>

                          <td className="px-4 py-4">
                            BIN-A01
                          </td>
                        </tr>

                        <tr>
                          <td className="px-4 py-4 font-semibold">
                            Electrical Motor
                          </td>

                          <td className="px-4 py-4">
                            80
                          </td>

                          <td className="px-4 py-4">
                            200
                          </td>

                          <td className="px-4 py-4">
                            BIN-B02
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AUDIT */}

                <div className={`${sectionCard} p-6`}>
                  <h3 className="text-xl font-bold text-[#111827]">
                    Audit Trail
                  </h3>

                  <div className="mt-6 space-y-5">
                    {[
                      "Transfer Created",
                      "Submitted For Approval",
                      "Warehouse Review Started",
                    ].map((log, index) => (
                      <div
                        key={index}
                        className="flex gap-4"
                      >
                        <div className="mt-1 h-3 w-3 rounded-full bg-[#005F99]" />

                        <div>
                          <div className="font-semibold text-[#111827]">
                            {log}
                          </div>

                          <div className="mt-1 text-sm text-slate-400">
                            25-May-2026
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL */}

              <div className="space-y-6">
                {/* APPROVAL */}

                <div className={`${sectionCard} p-6`}>
                  <h3 className="text-xl font-bold text-[#111827]">
                    Approval Decision
                  </h3>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Decision
                      </label>

                      <select
                        value={decision}
                        onChange={(e) =>
                          setDecision(
                            e.target
                              .value as ApprovalStatus
                          )
                        }
                        className={inputClass}
                      >
                        <option>
                          Waiting
                        </option>

                        <option>
                          Approved
                        </option>

                        <option>
                          Rejected
                        </option>

                        <option>
                          Hold
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Approval Comments
                      </label>

                      <textarea
                        value={
                          approvalComment
                        }
                        onChange={(e) =>
                          setApprovalComment(
                            e.target.value
                          )
                        }
                        className={`${inputClass} min-h-[140px]`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className={primaryBtn}
                        style={{
                          background:
                            COLORS.success,
                        }}
                      >
                        Approve
                      </button>

                      <button
                        className={primaryBtn}
                        style={{
                          background:
                            COLORS.danger,
                        }}
                      >
                        Reject
                      </button>

                      <button
                        className={primaryBtn}
                        style={{
                          background:
                            COLORS.warning,
                        }}
                      >
                        Hold
                      </button>

                      <button
                        className={primaryBtn}
                        style={{
                          background:
                            COLORS.primary,
                        }}
                      >
                        Send Back
                      </button>
                    </div>
                  </div>
                </div>

                {/* WORKFLOW */}

                <div className={`${sectionCard} p-6`}>
                  <h3 className="text-xl font-bold text-[#111827]">
                    Workflow
                  </h3>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        role:
                          "Warehouse Manager",
                        status: "Approved",
                      },

                      {
                        role:
                          "Inventory Controller",
                        status: "Waiting",
                      },

                      {
                        role: "SCM Head",
                        status: "Waiting",
                      },
                    ].map((flow, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border border-[#DCE6F2] p-4"
                      >
                        <div>
                          <div className="font-semibold text-[#111827]">
                            {flow.role}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            Pending Workflow
                          </div>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            flow.status ===
                            "Approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {flow.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SLA */}

                <div
                  className={`${sectionCard} flex items-center gap-4 p-6`}
                >
                  <AlertTriangle
                    className="text-orange-500"
                    size={28}
                  />

                  <div>
                    <div className="font-bold text-[#111827]">
                      SLA Alert
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Pending for 12 Hours
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 border-t border-[#DCE6F2] bg-white px-8 py-5">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-xs uppercase text-slate-400">
                      Total Qty
                    </div>

                    <div className="mt-1 text-lg font-bold">
                      {
                        selectedTransfer.qty
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-slate-400">
                      Total Value
                    </div>

                    <div className="mt-1 text-lg font-bold">
                      ₹
{new Intl.NumberFormat("en-IN").format(
  selectedTransfer.value
)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className={outlineBtn}
                    onClick={() =>
                      setOpenView(false)
                    }
                  >
                    Close
                  </button>

                  <button
                    className={primaryBtn}
                    style={{
                      background:
                        COLORS.success,
                    }}
                  >
                    Final Approve
                  </button>

                  <button
                    className={primaryBtn}
                    style={{
                      background:
                        COLORS.danger,
                    }}
                  >
                    Reject Transfer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}