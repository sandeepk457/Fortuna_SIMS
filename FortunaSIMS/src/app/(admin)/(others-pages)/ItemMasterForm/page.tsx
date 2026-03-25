"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type TabKey = "basic" | "inventory" | "storage" | "valuation" | "status";

type ItemMasterFormState = {
  // Basic Information
  itemCode: string;
  itemName: string;
  shortName: string;
  itemType:
    | "Raw Material"
    | "Finished Goods"
    | "Semi-Finished"
    | "Consumable"
    | "Service"
    | "";
  category: string;
  subCategory: string;
  brand: string;
  uom: string;
  altUom: string;
  conversionFactor: string; // keep string to avoid input issues
  barcode: string;
  hsnSac: string;
  description: string;

  // Inventory Controls (placeholder fields can be expanded later)
  // Storage & Handling
  // Valuation & Accounting
  // Status & Audit
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Information" },
  { key: "inventory", label: "Inventory Controls" },
  { key: "storage", label: "Storage & Handling" },
  { key: "valuation", label: "Valuation & Accounting" },
  { key: "status", label: "Status & Audit" },
];

const initialState: ItemMasterFormState = {
  itemCode: "",
  itemName: "",
  shortName: "",
  itemType: "",
  category: "",
  subCategory: "",
  brand: "",
  uom: "",
  altUom: "",
  conversionFactor: "",
  barcode: "",
  hsnSac: "",
  description: "",
};

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase = "text-sm font-medium text-gray-700 dark:text-gray-200";
const helperBase = "text-xs text-gray-500 dark:text-gray-400";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white " +
  "shadow-theme-sm hover:bg-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-500/20";

const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 " +
  "shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5";

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

export default function ItemMasterForm() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<ItemMasterFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // Required validations for Basic Info
    // if (!form.itemCode.trim()) e.itemCode = "Item Code is required";
    if (!form.itemName.trim()) e.itemName = "Item Name is required";
    if (!form.itemType) e.itemType = "Item Type is required";
    if (!form.uom.trim()) e.uom = "UOM is required";

    // Conversion factor validation (only if alt uom is filled)
    if (form.altUom.trim()) {
      const num = Number(form.conversionFactor);
      if (!form.conversionFactor.trim()) {
        e.conversionFactor =
          "Conversion Factor is required when Alt UOM is provided";
      } else if (Number.isNaN(num) || num <= 0) {
        e.conversionFactor = "Conversion Factor must be a number > 0";
      }
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof ItemMasterFormState>(
    key: K,
    value: ItemMasterFormState[K]
  ) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const markTouched = (key: keyof ItemMasterFormState) => {
    setTouched((p) => ({ ...p, [key as string]: true }));
  };

  const showError = (key: keyof ItemMasterFormState) =>
    Boolean(touched[key as string] && errors[key as string]);

  // const onSave = () => {
  //   // mark all as touched for basic fields (later we can include other tabs)
  //   const toTouch: Array<keyof ItemMasterFormState> = [
  //     "itemCode",
  //     "itemName",
  //     "itemType",
  //     "uom",
  //     "altUom",
  //     "conversionFactor",
  //   ];
  //   setTouched((p) => {
  //     const next = { ...p };
  //     toTouch.forEach((k) => (next[k as string] = true));
  //     return next;
  //   });

  //   if (hasErrors) {
  //     setActiveTab("basic");
  //     return;
  //   }

  //   // TODO: API call / state store
  //   console.log("Item Master Saved:", form);
  //   alert("Saved (demo). Next step: connect API.");
  // };

  //   // onSave function with API call
const onSave = async () => {
  const toTouch = [
    "itemCode",
    "itemName",
    "itemType",
    "uom",
    "altUom",
    "conversionFactor",
  ];

  setTouched((p) => {
    const next = { ...p };
    toTouch.forEach((k) => (next[k] = true));
    return next;
  });

  if (hasErrors) {
    setActiveTab("basic");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ Item Created: ${data.item_code}`);

      // 🔥 redirect to list page
      window.location.href = "/ItemMaster";
    } else {
      alert(data.error || "Failed to save item");
    }

  } catch (err) {
    console.error(err);
    alert("Error saving item");
  }
};


  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Item Master" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Item Master Creation
          </h3>
          <p className={helperBase}>
            Create & maintain items centrally.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineBtn} onClick={onReset}>
            Reset
          </button>
          <button type="button" className={primaryBtn} onClick={onSave}>
            Save Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2 dark:border-gray-800">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={classNames(
                  "relative rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: FORTUNA_PRIMARY_RED,
                      }
                    : undefined
                }
              >
                {t.label}

                {/* Active indicator (Fortuna Secondary Blue underline) */}
                {isActive && (
                  <span
                    className="absolute -bottom-[6px] left-3 right-3 h-[3px] rounded-full"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left */}
              <div className="space-y-5">
                <div>
                  <label className={labelBase}>
                    Item Code{" "}
                    <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                  value="Auto Generated"
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
                  
                </div>

                <div>
                  <label className={labelBase}>
                    Item Name{" "}
                    <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.itemName}
                    onChange={(e) => setField("itemName", e.target.value)}
                    onBlur={() => markTouched("itemName")}
                    placeholder="Ex: 10mm Steel Bolt"
                    className={classNames(
                      inputBase,
                      showError("itemName") && "border-brand-500"
                    )}
                  />
                  {showError("itemName") && (
                    <p className="mt-1 text-xs text-brand-500">
                      {errors.itemName}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>Short Name</label>
                  <input
                    value={form.shortName}
                    onChange={(e) => setField("shortName", e.target.value)}
                    placeholder="Ex: Bolt 10mm"
                    className={inputBase}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      Item Type{" "}
                      <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.itemType}
                      onChange={(e) =>
                        setField(
                          "itemType",
                          e.target.value as ItemMasterFormState["itemType"]
                        )
                      }
                      onBlur={() => markTouched("itemType")}
                      className={classNames(
                        inputBase,
                        showError("itemType") && "border-brand-500"
                      )}
                    >
                      <option value="">Select type</option>
                      <option value="Raw Material">Raw Material</option>
                      <option value="Finished Goods">Finished Goods</option>
                      <option value="Semi-Finished">Semi-Finished</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Service">Service</option>
                    </select>
                    {showError("itemType") && (
                      <p className="mt-1 text-xs text-brand-500">
                        {errors.itemType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelBase}>Brand</label>
                    <input
                      value={form.brand}
                      onChange={(e) => setField("brand", e.target.value)}
                      placeholder="Ex: Fortuna"
                      className={inputBase}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Category</label>
                    <input
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      placeholder="Ex: Fasteners"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>Sub Category</label>
                    <input
                      value={form.subCategory}
                      onChange={(e) => setField("subCategory", e.target.value)}
                      placeholder="Ex: Bolts"
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      UOM <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      value={form.uom}
                      onChange={(e) => setField("uom", e.target.value)}
                      onBlur={() => markTouched("uom")}
                      placeholder="Ex: Nos / Kg"
                      className={classNames(
                        inputBase,
                        showError("uom") && "border-brand-500"
                      )}
                    />
                    {showError("uom") && (
                      <p className="mt-1 text-xs text-brand-500">
                        {errors.uom}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelBase}>Alt UOM</label>
                    <input
                      value={form.altUom}
                      onChange={(e) => setField("altUom", e.target.value)}
                      onBlur={() => markTouched("altUom")}
                      placeholder="Ex: Box"
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Conversion Factor</label>
                  <input
                    value={form.conversionFactor}
                    onChange={(e) => setField("conversionFactor", e.target.value)}
                    onBlur={() => markTouched("conversionFactor")}
                    placeholder="Ex: 1 Box = 10 Nos (enter 10)"
                    className={classNames(
                      inputBase,
                      showError("conversionFactor") && "border-brand-500"
                    )}
                  />
                  <p className={classNames("mt-1", helperBase)}>
                    Fill only if Alt UOM exists.
                  </p>
                  {showError("conversionFactor") && (
                    <p className="mt-1 text-xs text-brand-500">
                      {errors.conversionFactor}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Barcode</label>
                    <input
                      value={form.barcode}
                      onChange={(e) => setField("barcode", e.target.value)}
                      placeholder="Ex: 8901234567890"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>HSN/SAC</label>
                    <input
                      value={form.hsnSac}
                      onChange={(e) => setField("hsnSac", e.target.value)}
                      placeholder="Ex: 7318"
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Add item description / notes..."
                    className={classNames(inputBase, "min-h-[110px] resize-y")}
                  />
                </div>
              </div>
            </div>
          )}


          {/* Inventory Tab */}

          {activeTab === "inventory" && (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {/* Left Column - Controls */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Inventory Controls
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Configure how this item is tracked in inventory.
        </p>

        <div className="mt-4 space-y-4">
          {/* inventory_controlled */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={(form as any).inventory_controlled ?? false}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  inventory_controlled: e.target.checked,
                  // If stock tracking is OFF, related controls should be disabled/cleared
                  batch_controlled: e.target.checked ? p.batch_controlled : false,
                  serial_controlled: e.target.checked ? p.serial_controlled : false,
                  expiry_controlled: e.target.checked ? p.expiry_controlled : false,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Inventory Controlled <span className="text-red-600">*</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track stock for this item (on-hand, inward/outward).
              </p>
            </div>
          </label>

          {/* batch_controlled */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={(form as any).batch_controlled ?? false}
              disabled={!((form as any).inventory_controlled ?? false)}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  batch_controlled: e.target.checked,
                  // If batch is ON, serial generally OFF (common rule). You can allow both if needed.
                  serial_controlled: e.target.checked ? false : p.serial_controlled,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Batch Controlled <span className="text-red-600">*</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enable batch tracking for this item.
              </p>
            </div>
          </label>

          {/* serial_controlled */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={(form as any).serial_controlled ?? false}
              disabled={!((form as any).inventory_controlled ?? false)}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  serial_controlled: e.target.checked,
                  // If serial ON, batch OFF (common rule)
                  batch_controlled: e.target.checked ? false : p.batch_controlled,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Serial Controlled <span className="text-red-600">*</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track unique serial number for each unit.
              </p>
            </div>
          </label>

          {/* expiry_controlled */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={(form as any).expiry_controlled ?? false}
              disabled={!((form as any).inventory_controlled ?? false)}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  expiry_controlled: e.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Expiry Controlled <span className="text-red-600">*</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enable expiry date tracking.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>

    {/* Right Column - Levels */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Stock Level Controls
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Optional thresholds used for alerts & replenishment suggestions.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* min_stock_level */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Min Stock Level
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={(form as any).min_stock_level ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  min_stock_level: e.target.value,
                }))
              }
              placeholder="Ex: 10"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Reorder threshold (optional).
            </p>
          </div>

          {/* max_stock_level */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Max Stock Level
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={(form as any).max_stock_level ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  max_stock_level: e.target.value,
                }))
              }
              placeholder="Ex: 500"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Max allowed (optional).
            </p>
          </div>

          {/* reorder_qty */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Reorder Quantity
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={(form as any).reorder_qty ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  reorder_qty: e.target.value,
                }))
              }
              placeholder="Ex: 50"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Suggested reorder quantity (optional).
            </p>
          </div>
        </div>

        {/* Optional: quick info */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
          <span className="font-semibold">Note:</span> Stock-level fields are optional.
          Inventory tracking must be enabled to apply batch/serial/expiry controls.
        </div>
      </div>
    </div>
  </div>
)}

          {/* storage & Handling tab*/}

         {activeTab === "storage" && (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {/* Left Column - Storage Settings */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Storage Settings
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Configure preferred storage type and handling flags.
        </p>

        <div className="mt-4 space-y-4">
          {/* storage_type */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Storage Type
            </label>
            <select
              value={(form as any).storage_type ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, storage_type: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            >
              <option value="">Select storage type</option>
              <option value="Ambient">Ambient</option>
              <option value="Cold">Cold</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ambient / Cold (optional).
            </p>
          </div>

          {/* hazardous */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={(form as any).hazardous ?? false}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, hazardous: e.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Hazardous
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mark item as hazardous for special storage/handling.
              </p>
            </div>
          </label>

          {/* fragile */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={(form as any).fragile ?? false}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, fragile: e.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Fragile
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Requires extra handling care (optional).
              </p>
            </div>
          </label>

          {/* stackable */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={(form as any).stackable ?? false}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, stackable: e.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Stackable
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Item can be stacked (helps space planning).
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>

    {/* Right Column - Preferred Location Mapping */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Preferred Warehouse Mapping
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Optional default storage preference for faster putaway.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* default_warehouse */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Default Warehouse
            </label>
            <input
              value={(form as any).default_warehouse ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({
                  ...p,
                  default_warehouse: e.target.value,
                }))
              }
              placeholder="Ex: WH-HYD-01"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Preferred warehouse code/name (optional).
            </p>
          </div>

          {/* default_zone */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Default Zone
            </label>
            <input
              value={(form as any).default_zone ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, default_zone: e.target.value }))
              }
              placeholder="Ex: ZONE-A"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Zone mapping (optional).
            </p>
          </div>

          {/* default_bin */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Default Bin
            </label>
            <input
              value={(form as any).default_bin ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, default_bin: e.target.value }))
              }
              placeholder="Ex: BIN-12"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Bin mapping (optional).
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
          <span className="font-semibold">Tip:</span> If warehouse/zone/bin are
          filled, system can auto-suggest putaway locations.
        </div>
      </div>
    </div>
  </div>
)}

{/* Valuation & accounting tab */}
          {activeTab === "valuation" && (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {/* Left Column - Valuation */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Valuation Method
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Choose how inventory cost should be calculated for this item.
        </p>

        <div className="mt-4 space-y-4">
          {/* valuation_method (Required) */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Valuation Method <span className="text-red-600">*</span>
            </label>
            <select
              value={(form as any).valuation_method ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, valuation_method: e.target.value }))
              }
              onBlur={() =>
                setTouched((p) => ({ ...p, valuation_method: true }))
              }
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            >
              <option value="">Select method</option>
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="AVG">Average</option>
            </select>

            {/* Simple required error (uses touched + basic check) */}
            {((touched as any)?.valuation_method && !((form as any).valuation_method ?? "").trim()) && (
              <p className="mt-1 text-xs text-brand-500">
                Valuation Method is required
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              FIFO / LIFO / Average (configurable).
            </p>
          </div>

          {/* Business Rule Notice */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
            <span className="font-semibold">Business Rule:</span>{" "}
            FIFO will be default for <span className="font-semibold">batch-controlled</span>{" "}
            items.
          </div>
        </div>
      </div>
    </div>

    {/* Right Column - Accounting / Costs */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Accounting & Costs
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Optional cost fields and ERP mapping.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* standard_cost */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Standard Cost
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={(form as any).standard_cost ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, standard_cost: e.target.value }))
              }
              placeholder="Ex: 250.00"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Standard price (optional).
            </p>
          </div>

          {/* last_purchase_price (System / Read-only) */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Last Purchase Price <span className="text-xs text-gray-400">(System)</span>
            </label>
            <input
              type="text"
              value={(form as any).last_purchase_price ?? "Auto updated"}
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Auto updated from latest procurement.
            </p>
          </div>

          {/* inventory_gl_code */}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Inventory GL Code
            </label>
            <input
              value={(form as any).inventory_gl_code ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, inventory_gl_code: e.target.value }))
              }
              placeholder="Ex: INV-GL-1001"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used for ERP integration / accounting mapping (optional).
            </p>
          </div>
        </div>

        {/* Business Rule Apply (Optional helper) */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
          <span className="font-semibold">Note:</span> For batch-controlled items,
          system will suggest FIFO as default valuation method.
        </div>
      </div>
    </div>
  </div>
)}

{/* Status & Audit Tab */}

          {activeTab === "status" && (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {/* Left - Status */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Item Status
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Control whether this item is available for transactions.
        </p>

        <div className="mt-4 space-y-4">
          {/* status (Required) */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Status <span className="text-red-600">*</span>
            </label>
            <select
              value={(form as any).status ?? ""}
              onChange={(e) =>
                setForm((p: any) => ({ ...p, status: e.target.value }))
              }
              onBlur={() => setTouched((p) => ({ ...p, status: true }))}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90"
            >
              <option value="">Select status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {((touched as any)?.status && !((form as any).status ?? "").trim()) && (
              <p className="mt-1 text-xs text-brand-500">Status is required</p>
            )}

            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
              <span className="font-semibold">Note:</span> Inactive items can be
              restricted from GRN/GIN and sales transactions based on policy.
            </div>
          </div>

          {/* Optional quick flag info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Status</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {(form as any).status ? (form as any).status : "Not set"}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Visibility</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {(form as any).status === "Inactive" ? "Restricted" : "Allowed"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Right - Audit */}
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Audit Details
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          System generated fields (read-only).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* created_by */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Created By <span className="text-xs text-gray-400">(System)</span>
            </label>
            <input
              value={(form as any).created_by ?? "System User"}
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
            />
          </div>

          {/* created_date */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Created Date <span className="text-xs text-gray-400">(System)</span>
            </label>
            <input
              value={(form as any).created_date ?? "Auto Timestamp"}
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
            />
          </div>

          {/* modified_by */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Modified By <span className="text-xs text-gray-400">(System)</span>
            </label>
            <input
              value={(form as any).modified_by ?? "System User"}
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
            />
          </div>

          {/* modified_date */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Modified Date <span className="text-xs text-gray-400">(System)</span>
            </label>
            <input
              value={(form as any).modified_date ?? "Auto Timestamp"}
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
          <span className="font-semibold">Note:</span> Current Status of Item Master & Its Details.
        </div>
      </div>
    </div>
  </div>
)}

        </div>
      </div>

      {/* Footer actions for convenience */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={outlineBtn} onClick={onReset}>
          Reset
        </button>
        <button type="button" className={primaryBtn} onClick={onSave}>
          Save Item
        </button>
      </div>
    </div>
  );
}
