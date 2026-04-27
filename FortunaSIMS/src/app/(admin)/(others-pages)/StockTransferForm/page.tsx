"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** 🎨 Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Tabs */
type TabKey = "basic" | "items" | "dispatch" | "attachments" | "status";

/** Enums */
type TransferStatus = "Draft" | "Pending Approval" | "Approved" | "Dispatched" | "Received" | "Closed";
type Priority = "Low" | "Medium" | "High" | "Urgent" | "";

/** Masters */
const LOCATIONS = [
  { id: "WH-001", name: "Vizag Warehouse" },
  { id: "WH-002", name: "Hyderabad Warehouse" },
  { id: "WH-003", name: "Chennai Warehouse" },
];

const TABS = [
  { key: "basic", label: "Basic Info" },
  { key: "items", label: "Transfer Items" },
  { key: "dispatch", label: "Dispatch Details" },
  { key: "attachments", label: "Attachments & Notes" },
  { key: "status", label: "Status & Audit" },
];

/** Types */
type TransferItem = {
  line_id: string;
  item_code: string;
  description: string;
  uom: string;
  qty: string;
};

type FormState = {
  str_id: string;
  str_number: string;
  str_date: string;

  from_location: string;
  to_location: string;
  priority: Priority;
  reason: string;

  items: TransferItem[];

  dispatch_date: string;
  transporter: string;
  vehicle_no: string;

  notes: string;

  status: TransferStatus;
};

/** Helpers */
const inputBase =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";

function uuid() {
  return Math.random().toString(16).slice(2);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

/** Initial */
const initialState: FormState = {
  str_id: "Auto",
  str_number: "STR-YYYY-001",
  str_date: today(),

  from_location: "",
  to_location: "",
  priority: "Medium",
  reason: "",

  items: [],

  dispatch_date: "",
  transporter: "",
  vehicle_no: "",

  notes: "",

  status: "Draft",
};

export default function StockTransferCreatePage() {
  const [tab, setTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<FormState>(initialState);

  const isLocked = form.status !== "Draft";

  /** Items */
  const addItem = () => {
    if (isLocked) return;
    setForm(p => ({
      ...p,
      items: [...p.items, {
        line_id: uuid(),
        item_code: "",
        description: "",
        uom: "Nos",
        qty: ""
      }]
    }));
  };

  const updateItem = (i: number, patch: Partial<TransferItem>) => {
    const items = [...form.items];
    items[i] = { ...items[i], ...patch };
    setForm({ ...form, items });
  };

  const removeItem = (i: number) => {
    setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  };

  /** Actions */
  const sendForApproval = () => {
    if (form.items.length === 0) {
      alert("Add items first");
      setTab("items");
      return;
    }
    setForm(p => ({ ...p, status: "Pending Approval" }));
  };

  const approve = () => setForm(p => ({ ...p, status: "Approved" }));
  const dispatch = () => setForm(p => ({ ...p, status: "Dispatched" }));
  const receive = () => setForm(p => ({ ...p, status: "Received" }));
  const close = () => setForm(p => ({ ...p, status: "Closed" }));

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Stock Transfer Request" />

      {/* Header */}
      <div className="p-4 border rounded-xl bg-white flex justify-between">
        <div>
          <h3 className="font-semibold">STR Creation</h3>
          <p className="text-xs text-gray-500">
            Draft → Approval → Dispatch → Receive → Close
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={sendForApproval} style={{ background: FORTUNA_PRIMARY_RED }} className="text-white px-3 py-2 rounded">
            Send Approval
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border rounded-xl bg-white">
        <div className="flex gap-2 p-2 border-b">
          {TABS.map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key as TabKey)}
              className={`px-3 py-2 rounded ${tab === t.key ? "text-white" : ""}`}
              style={tab === t.key ? { background: FORTUNA_PRIMARY_RED } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* BASIC */}
          {tab === "basic" && (
            <div className="grid grid-cols-2 gap-4">
              <select value={form.from_location}
                onChange={e => setForm({ ...form, from_location: e.target.value })}
                className={inputBase}>
                <option>Select From Location</option>
                {LOCATIONS.map(l => <option key={l.id}>{l.name}</option>)}
              </select>

              <select value={form.to_location}
                onChange={e => setForm({ ...form, to_location: e.target.value })}
                className={inputBase}>
                <option>Select To Location</option>
                {LOCATIONS.map(l => <option key={l.id}>{l.name}</option>)}
              </select>

              <input placeholder="Reason"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className={inputBase} />
            </div>
          )}

          {/* ITEMS */}
          {tab === "items" && (
            <div>
              <button onClick={addItem} className="mb-3 bg-blue-600 text-white px-3 py-1 rounded">
                + Add Item
              </button>

              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, i) => (
                    <tr key={it.line_id}>
                      <td>
                        <input className={inputBase}
                          value={it.description}
                          onChange={e => updateItem(i, { description: e.target.value })} />
                      </td>
                      <td>
                        <input className={inputBase}
                          value={it.qty}
                          onChange={e => updateItem(i, { qty: e.target.value })} />
                      </td>
                      <td>
                        <button onClick={() => removeItem(i)}>❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DISPATCH */}
          {tab === "dispatch" && (
            <div className="grid grid-cols-2 gap-4">
              <input type="date"
                value={form.dispatch_date}
                onChange={e => setForm({ ...form, dispatch_date: e.target.value })}
                className={inputBase} />

              <input placeholder="Transporter"
                value={form.transporter}
                onChange={e => setForm({ ...form, transporter: e.target.value })}
                className={inputBase} />

              <input placeholder="Vehicle No"
                value={form.vehicle_no}
                onChange={e => setForm({ ...form, vehicle_no: e.target.value })}
                className={inputBase} />
            </div>
          )}

          {/* STATUS */}
          {tab === "status" && (
            <div className="space-y-3">
              <div>Status: {form.status}</div>

              <div className="flex gap-2">
                <button onClick={approve}>Approve</button>
                <button onClick={dispatch}>Dispatch</button>
                <button onClick={receive}>Receive</button>
                <button onClick={close}>Close</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}