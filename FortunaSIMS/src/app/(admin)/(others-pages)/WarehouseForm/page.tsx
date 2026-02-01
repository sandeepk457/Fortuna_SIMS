"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** ===== Types ===== */
type TabKey = "basic" | "inventory" | "storage" | "valuation" | "status" | "layout";

type ItemType =
  | "Raw Material"
  | "Finished Goods"
  | "Semi-Finished"
  | "Consumable"
  | "Service"
  | "";

type Status = "Active" | "Inactive" | "";

type BinStatus = "Available" | "Reserved" | "Occupied" | "Blocked";

type Bin = {
  id: string;
  code: string;
  level: number; // L01..Lxx
  position: number; // B01..Bxx
  status: BinStatus;
  meta?: {
    capacity?: string;
    maxWeightKg?: string;
    notes?: string;
  };
};

type Rack = {
  id: string;
  name: string;
  levels: number;
  binsPerLevel: number;
  bins: Bin[];
};

type Aisle = { id: string; name: string; racks: Rack[] };
type Zone = { id: string; name: string; aisles: Aisle[] };

type ValuationMethod = "" | "FIFO" | "LIFO" | "AVG";

type StorageType = "" | "Ambient" | "Cold";

type ItemMasterFormState = {
  /** BASIC */
  itemCode: string;
  itemName: string;
  shortName: string;
  itemType: ItemType;
  category: string;
  subCategory: string;
  brand: string;
  uom: string;
  altUom: string;
  conversionFactor: string;
  barcode: string;
  hsnSac: string;
  description: string;

  /** INVENTORY CONTROLS */
  inventory_controlled: boolean;
  batch_controlled: boolean;
  serial_controlled: boolean;
  expiry_controlled: boolean;
  min_stock_level: string; // keep strings for easy input
  max_stock_level: string;
  reorder_qty: string;

  /** STORAGE & HANDLING */
  storage_type: StorageType;
  hazardous: boolean;
  fragile: boolean;
  stackable: boolean;
  default_warehouse: string;
  default_zone: string;
  default_bin: string;

  /** VALUATION & ACCOUNTING */
  valuation_method: ValuationMethod; // required
  standard_cost: string;
  last_purchase_price: string; // system/read-only in real app (demo editable/readonly)
  inventory_gl_code: string;

  /** STATUS & AUDIT */
  status: Status; // required
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;

  /** Layout mapping (optional) */
  preferred_zone: string;
  preferred_aisle: string;
  preferred_rack: string;
};

/** ===== Tabs ===== */
const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Information" },
  { key: "inventory", label: "Inventory Controls" },
  { key: "storage", label: "Storage & Handling" },
  { key: "valuation", label: "Valuation & Accounting" },
  { key: "status", label: "Status & Audit" },
  { key: "layout", label: "Layout" },
];

const initialState: ItemMasterFormState = {
  /** BASIC */
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

  /** INVENTORY */
  inventory_controlled: false,
  batch_controlled: false,
  serial_controlled: false,
  expiry_controlled: false,
  min_stock_level: "",
  max_stock_level: "",
  reorder_qty: "",

  /** STORAGE */
  storage_type: "",
  hazardous: false,
  fragile: false,
  stackable: false,
  default_warehouse: "",
  default_zone: "",
  default_bin: "",

  /** VALUATION */
  valuation_method: "",
  standard_cost: "",
  last_purchase_price: "Auto updated",
  inventory_gl_code: "",

  /** STATUS */
  status: "Active",
  created_by: "System User",
  created_date: "Auto Timestamp",
  modified_by: "System User",
  modified_date: "Auto Timestamp",

  /** Layout mapping */
  preferred_zone: "",
  preferred_aisle: "",
  preferred_rack: "",
};

/** ===== UI helpers ===== */
const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase = "text-sm font-medium text-gray-700 dark:text-gray-200";
const helperBase = "text-xs text-gray-500 dark:text-gray-400";

const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 " +
  "shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white " +
  "shadow-theme-sm focus:outline-none focus:ring-3";

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

/** ===== Utils ===== */
function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}
function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function zoneCodeFromIndex(idx1: number) {
  return `Z${pad2(idx1)}`;
}
function statusBg(s: BinStatus) {
  switch (s) {
    case "Available":
      return "bg-white";
    case "Reserved":
      return "bg-blue-50";
    case "Occupied":
      return "bg-red-50";
    case "Blocked":
      return "bg-gray-100";
    default:
      return "bg-white";
  }
}
function statusBorder(s: BinStatus) {
  switch (s) {
    case "Available":
      return "border-gray-200 hover:border-gray-300";
    case "Reserved":
      return "border-blue-200 hover:border-blue-300";
    case "Occupied":
      return "border-red-200 hover:border-red-300";
    case "Blocked":
      return "border-gray-300 hover:border-gray-400";
    default:
      return "border-gray-200 hover:border-gray-300";
  }
}
function statusText(s: BinStatus) {
  switch (s) {
    case "Available":
      return "text-gray-800";
    case "Reserved":
      return "text-blue-700";
    case "Occupied":
      return "text-red-700";
    case "Blocked":
      return "text-gray-700";
    default:
      return "text-gray-800";
  }
}

/** ===== Seed layout ===== */
function createRack(
  zoneCode: string,
  aisleIndex1: number,
  rackIndex1: number,
  levels: number,
  binsPerLevel: number
): Rack {
  const bins: Bin[] = [];

  for (let lv = 1; lv <= levels; lv++) {
    for (let pos = 1; pos <= binsPerLevel; pos++) {
      const code = `${zoneCode}-A${pad2(aisleIndex1)}-R${pad2(rackIndex1)}-L${pad2(
        lv
      )}-B${pad2(pos)}`;

      let status: BinStatus = "Available";
      const rnd = (lv * 100 + pos * 7 + rackIndex1 * 13 + aisleIndex1 * 17) % 100;
      if (rnd > 82) status = "Occupied";
      else if (rnd > 72) status = "Reserved";
      else if (rnd > 68) status = "Blocked";

      bins.push({
        id: uid("bin"),
        code,
        level: lv,
        position: pos,
        status,
        meta: { capacity: "", maxWeightKg: "", notes: "" },
      });
    }
  }

  return {
    id: uid("rack"),
    name: `Rack ${pad2(rackIndex1)}`,
    levels,
    binsPerLevel,
    bins,
  };
}

function seedZones(): Zone[] {
  // Option-C: Zones → Aisles → Racks → Bins
  const zonesCount = 2;
  const aislesPerZone = 2;
  const racksPerAisle = 3;
  const levels = 4;
  const binsPerLevel = 8;

  const zones: Zone[] = [];
  for (let zi = 1; zi <= zonesCount; zi++) {
    const zoneCode = zoneCodeFromIndex(zi);

    const aisles: Aisle[] = [];
    for (let ai = 1; ai <= aislesPerZone; ai++) {
      const racks: Rack[] = [];
      for (let ri = 1; ri <= racksPerAisle; ri++) {
        racks.push(createRack(zoneCode, ai, ri, levels, binsPerLevel));
      }
      aisles.push({ id: uid("aisle"), name: `Aisle ${pad2(ai)}`, racks });
    }

    zones.push({ id: uid("zone"), name: `Zone ${zoneCode}`, aisles });
  }

  return zones;
}

export default function ItemMasterForm() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<ItemMasterFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** Layout state */
  const [zones, setZones] = useState<Zone[]>(seedZones());
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id ?? "");
  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? zones[0],
    [zones, selectedZoneId]
  );

  const [selectedAisleId, setSelectedAisleId] = useState<string>(
    selectedZone?.aisles?.[0]?.id ?? ""
  );
  const selectedAisle = useMemo(() => {
    const z = selectedZone;
    if (!z) return undefined;
    return z.aisles.find((a) => a.id === selectedAisleId) ?? z.aisles[0];
  }, [selectedZone, selectedAisleId]);

  const [selectedRackId, setSelectedRackId] = useState<string>(
    selectedAisle?.racks?.[0]?.id ?? ""
  );
  const selectedRack = useMemo(() => {
    const a = selectedAisle;
    if (!a) return undefined;
    return a.racks.find((r) => r.id === selectedRackId) ?? a.racks[0];
  }, [selectedAisle, selectedRackId]);

  /** Bin drawer */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

  const selectedBin = useMemo(() => {
    if (!selectedRack || !selectedBinId) return undefined;
    return selectedRack.bins.find((b) => b.id === selectedBinId);
  }, [selectedRack, selectedBinId]);

  /** Seat map filters */
  const [binQuery, setBinQuery] = useState("");
  const [binStatusFilter, setBinStatusFilter] = useState<"" | BinStatus>("");

  /** ===== Validations ===== */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // Basic required
    if (!form.itemCode.trim()) e.itemCode = "Item Code is required";
    if (!form.itemName.trim()) e.itemName = "Item Name is required";
    if (form.itemName.trim() && form.itemName.trim().length < 3)
      e.itemName = "Item Name must be at least 3 characters";
    if (!form.itemType) e.itemType = "Item Type is required";
    if (!form.uom.trim()) e.uom = "UOM is required";

    // Alt UOM -> conversion factor required and >0
    if (form.altUom.trim()) {
      const num = Number(form.conversionFactor);
      if (!form.conversionFactor.trim()) {
        e.conversionFactor = "Conversion Factor is required when Alt UOM is provided";
      } else if (Number.isNaN(num) || num <= 0) {
        e.conversionFactor = "Conversion Factor must be a number > 0";
      }
    }

    // Inventory Controlled required (as per your screenshot fields with *)
    if (!form.inventory_controlled) {
      e.inventory_controlled = "Inventory Controlled is required";
    }

    // Valuation required
    if (!form.valuation_method) e.valuation_method = "Valuation Method is required";

    // Status required
    if (!form.status) e.status = "Status is required";

    return e;
  }, [form]);

  const setField = <K extends keyof ItemMasterFormState>(key: K, value: ItemMasterFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const markTouched = (key: keyof ItemMasterFormState) => {
    setTouched((p) => ({ ...p, [key as string]: true }));
  };

  const showError = (key: keyof ItemMasterFormState) =>
    Boolean(touched[key as string] && errors[key as string]);

  /** Decide which tab to open when errors exist */
  const firstErrorTab = useMemo((): TabKey => {
    const keys = Object.keys(errors);
    if (!keys.length) return "basic";

    const basicKeys = new Set([
      "itemCode",
      "itemName",
      "itemType",
      "uom",
      "altUom",
      "conversionFactor",
    ]);
    const inventoryKeys = new Set(["inventory_controlled"]);
    const valuationKeys = new Set(["valuation_method"]);
    const statusKeys = new Set(["status"]);

    if (keys.some((k) => basicKeys.has(k))) return "basic";
    if (keys.some((k) => inventoryKeys.has(k))) return "inventory";
    if (keys.some((k) => valuationKeys.has(k))) return "valuation";
    if (keys.some((k) => statusKeys.has(k))) return "status";
    return "basic";
  }, [errors]);

  const onSave = () => {
    // mark required fields touched
    const toTouch: Array<keyof ItemMasterFormState> = [
      "itemCode",
      "itemName",
      "itemType",
      "uom",
      "altUom",
      "conversionFactor",
      "inventory_controlled",
      "valuation_method",
      "status",
    ];

    setTouched((p) => {
      const next = { ...p };
      toTouch.forEach((k) => (next[k as string] = true));
      return next;
    });

    if (Object.keys(errors).length > 0) {
      setActiveTab(firstErrorTab);
      return;
    }

    console.log("Item Master Saved:", form);
    console.log("Layout Zones (demo):", zones);
    alert("Saved (demo). Next step: connect API.");
  };

  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  /** ===== Layout: mini chart stats ===== */
  const rackStats = useMemo(() => {
    const bins = selectedRack?.bins ?? [];
    const total = bins.length || 0;

    const counts = bins.reduce(
      (acc, b) => {
        acc[b.status] = (acc[b.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<BinStatus, number>
    );

    const available = counts["Available"] ?? 0;
    const reserved = counts["Reserved"] ?? 0;
    const occupied = counts["Occupied"] ?? 0;
    const blocked = counts["Blocked"] ?? 0;

    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

    return {
      total,
      counts: { available, reserved, occupied, blocked },
      pct: {
        available: pct(available),
        reserved: pct(reserved),
        occupied: pct(occupied),
        blocked: pct(blocked),
      },
    };
  }, [selectedRack]);

  /** ===== Layout: Add Bin Column ===== */
  const addBinColumn = () => {
    if (!selectedZoneId || !selectedAisleId || !selectedRackId) return;

    setZones((prev) =>
      prev.map((z, zi) => {
        if (z.id !== selectedZoneId) return z;

        const zoneIndex1Based = zi + 1;
        const zoneCode = zoneCodeFromIndex(zoneIndex1Based);

        return {
          ...z,
          aisles: z.aisles.map((a, ai) => {
            if (a.id !== selectedAisleId) return a;

            const aisleIndex1Based = ai + 1;

            return {
              ...a,
              racks: a.racks.map((r, ri) => {
                if (r.id !== selectedRackId) return r;

                const rackIndex1Based = ri + 1;
                const newPos = (r.binsPerLevel ?? 0) + 1;

                const newBins: Bin[] = [];
                for (let lv = 1; lv <= r.levels; lv++) {
                  const code = `${zoneCode}-A${pad2(aisleIndex1Based)}-R${pad2(
                    rackIndex1Based
                  )}-L${pad2(lv)}-B${pad2(newPos)}`;

                  newBins.push({
                    id: uid("bin"),
                    code,
                    level: lv,
                    position: newPos,
                    status: "Available",
                    meta: { capacity: "", maxWeightKg: "", notes: "" },
                  });
                }

                return {
                  ...r,
                  binsPerLevel: newPos,
                  bins: [...r.bins, ...newBins],
                };
              }),
            };
          }),
        };
      })
    );
  };

  /** ===== Layout: update bin ===== */
  const updateBin = (binId: string, patch: Partial<Bin>) => {
    if (!selectedZoneId || !selectedAisleId || !selectedRackId) return;

    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZoneId) return z;
        return {
          ...z,
          aisles: z.aisles.map((a) => {
            if (a.id !== selectedAisleId) return a;
            return {
              ...a,
              racks: a.racks.map((r) => {
                if (r.id !== selectedRackId) return r;
                return {
                  ...r,
                  bins: r.bins.map((b) => (b.id === binId ? { ...b, ...patch } : b)),
                };
              }),
            };
          }),
        };
      })
    );
  };

  const openBinDrawer = (binId: string) => {
    setSelectedBinId(binId);
    setDrawerOpen(true);
  };

  /** ===== Layout: visible bins ===== */
  const visibleBins = useMemo(() => {
    const bins = selectedRack?.bins ?? [];
    const q = binQuery.trim().toLowerCase();
    return bins.filter((b) => {
      const passText = q ? b.code.toLowerCase().includes(q) : true;
      const passStatus = binStatusFilter ? b.status === binStatusFilter : true;
      return passText && passStatus;
    });
  }, [selectedRack, binQuery, binStatusFilter]);

  const binsMatrix = useMemo(() => {
    if (!selectedRack) return [];
    const levels = selectedRack.levels;
    const cols = selectedRack.binsPerLevel;

    const map = new Map<string, Bin>();
    visibleBins.forEach((b) => map.set(`${b.level}-${b.position}`, b));

    const rows: Array<Array<Bin | null>> = [];
    for (let lv = levels; lv >= 1; lv--) {
      const row: Array<Bin | null> = [];
      for (let pos = 1; pos <= cols; pos++) {
        row.push(map.get(`${lv}-${pos}`) ?? null);
      }
      rows.push(row);
    }

    return rows;
  }, [selectedRack, visibleBins]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Item Master" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Item Master Creation
          </h3>
          <p className={helperBase}>Create & maintain items centrally.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineBtn} onClick={onReset}>
            Reset
          </button>
          <button
            type="button"
            className={classNames(primaryBtn)}
            style={{
              backgroundColor: FORTUNA_PRIMARY_RED,
              boxShadow: "0 8px 20px rgba(200,16,46,0.25)",
            }}
            onClick={onSave}
          >
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
                style={isActive ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
              >
                {t.label}
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
          {/* ===================== BASIC ===================== */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left */}
              <div className="space-y-5">
                <div>
                  <label className={labelBase}>
                    Item Code <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.itemCode}
                    onChange={(e) => setField("itemCode", e.target.value)}
                    onBlur={() => markTouched("itemCode")}
                    placeholder="Ex: ITM-000123"
                    className={classNames(inputBase, showError("itemCode") && "border-red-500")}
                  />
                  {showError("itemCode") && (
                    <p className="mt-1 text-xs text-red-600">{errors.itemCode}</p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>
                    Item Name <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.itemName}
                    onChange={(e) => setField("itemName", e.target.value)}
                    onBlur={() => markTouched("itemName")}
                    placeholder="Ex: 10mm Steel Bolt"
                    className={classNames(inputBase, showError("itemName") && "border-red-500")}
                  />
                  {showError("itemName") && (
                    <p className="mt-1 text-xs text-red-600">{errors.itemName}</p>
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
                      Item Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.itemType}
                      onChange={(e) => setField("itemType", e.target.value as ItemType)}
                      onBlur={() => markTouched("itemType")}
                      className={classNames(inputBase, showError("itemType") && "border-red-500")}
                    >
                      <option value="">Select type</option>
                      <option value="Raw Material">Raw Material</option>
                      <option value="Finished Goods">Finished Goods</option>
                      <option value="Semi-Finished">Semi-Finished</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Service">Service</option>
                    </select>
                    {showError("itemType") && (
                      <p className="mt-1 text-xs text-red-600">{errors.itemType}</p>
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
                      className={classNames(inputBase, showError("uom") && "border-red-500")}
                    />
                    {showError("uom") && <p className="mt-1 text-xs text-red-600">{errors.uom}</p>}
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
                      showError("conversionFactor") && "border-red-500"
                    )}
                  />
                  <p className={classNames("mt-1", helperBase)}>Fill only if Alt UOM exists.</p>
                  {showError("conversionFactor") && (
                    <p className="mt-1 text-xs text-red-600">{errors.conversionFactor}</p>
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

          {/* ===================== INVENTORY ===================== */}
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
                        checked={form.inventory_controlled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((p) => ({
                            ...p,
                            inventory_controlled: checked,
                            batch_controlled: checked ? p.batch_controlled : false,
                            serial_controlled: checked ? p.serial_controlled : false,
                            expiry_controlled: checked ? p.expiry_controlled : false,
                          }));
                          markTouched("inventory_controlled");
                        }}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Inventory Controlled{" "}
                          <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Track stock for this item (on-hand, inward/outward).
                        </p>
                        {showError("inventory_controlled") && (
                          <p className="mt-1 text-xs text-red-600">{errors.inventory_controlled}</p>
                        )}
                      </div>
                    </label>

                    {/* batch_controlled */}
                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={form.batch_controlled}
                        disabled={!form.inventory_controlled}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            batch_controlled: e.target.checked,
                            serial_controlled: e.target.checked ? false : p.serial_controlled,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Batch Controlled
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
                        checked={form.serial_controlled}
                        disabled={!form.inventory_controlled}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            serial_controlled: e.target.checked,
                            batch_controlled: e.target.checked ? false : p.batch_controlled,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Serial Controlled
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
                        checked={form.expiry_controlled}
                        disabled={!form.inventory_controlled}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            expiry_controlled: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Expiry Controlled
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
                    <div>
                      <label className={labelBase}>Min Stock Level</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.min_stock_level}
                        onChange={(e) => setField("min_stock_level", e.target.value)}
                        placeholder="Ex: 10"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>Reorder threshold (optional).</p>
                    </div>

                    <div>
                      <label className={labelBase}>Max Stock Level</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.max_stock_level}
                        onChange={(e) => setField("max_stock_level", e.target.value)}
                        placeholder="Ex: 500"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>Max allowed (optional).</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>Reorder Quantity</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.reorder_qty}
                        onChange={(e) => setField("reorder_qty", e.target.value)}
                        placeholder="Ex: 50"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>
                        Suggested reorder quantity (optional).
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Stock-level fields are optional.
                    Inventory tracking must be enabled to apply batch/serial/expiry controls.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== STORAGE ===================== */}
          {activeTab === "storage" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Storage Settings
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Configure preferred storage type and handling flags.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelBase}>Storage Type</label>
                      <select
                        value={form.storage_type}
                        onChange={(e) => setField("storage_type", e.target.value as StorageType)}
                        className={classNames(inputBase, "mt-2")}
                      >
                        <option value="">Select storage type</option>
                        <option value="Ambient">Ambient</option>
                        <option value="Cold">Cold</option>
                      </select>
                      <p className={classNames("mt-1", helperBase)}>Ambient / Cold (optional).</p>
                    </div>

                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={form.hazardous}
                        onChange={(e) => setField("hazardous", e.target.checked)}
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

                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={form.fragile}
                        onChange={(e) => setField("fragile", e.target.checked)}
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

                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={form.stackable}
                        onChange={(e) => setField("stackable", e.target.checked)}
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

              {/* Right Column */}
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Preferred Warehouse Mapping
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional default storage preference for faster putaway.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelBase}>Default Warehouse</label>
                      <input
                        value={form.default_warehouse}
                        onChange={(e) => setField("default_warehouse", e.target.value)}
                        placeholder="Ex: WH-HYD-01"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>
                        Preferred warehouse code/name (optional).
                      </p>
                    </div>

                    <div>
                      <label className={labelBase}>Default Zone</label>
                      <input
                        value={form.default_zone}
                        onChange={(e) => setField("default_zone", e.target.value)}
                        placeholder="Ex: ZONE-A"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>Zone mapping (optional).</p>
                    </div>

                    <div>
                      <label className={labelBase}>Default Bin</label>
                      <input
                        value={form.default_bin}
                        onChange={(e) => setField("default_bin", e.target.value)}
                        placeholder="Ex: BIN-12"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>Bin mapping (optional).</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Tip:</span> If warehouse/zone/bin are filled,
                    system can auto-suggest putaway locations.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== VALUATION ===================== */}
          {activeTab === "valuation" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left */}
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Valuation Method
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose how inventory cost should be calculated for this item.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelBase}>
                        Valuation Method <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <select
                        value={form.valuation_method}
                        onChange={(e) => setField("valuation_method", e.target.value as ValuationMethod)}
                        onBlur={() => markTouched("valuation_method")}
                        className={classNames(
                          inputBase,
                          "mt-2",
                          showError("valuation_method") && "border-red-500"
                        )}
                      >
                        <option value="">Select method</option>
                        <option value="FIFO">FIFO</option>
                        <option value="LIFO">LIFO</option>
                        <option value="AVG">Average</option>
                      </select>

                      {showError("valuation_method") && (
                        <p className="mt-1 text-xs text-red-600">{errors.valuation_method}</p>
                      )}

                      <p className={classNames("mt-1", helperBase)}>
                        FIFO / LIFO / Average (configurable).
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                      <span className="font-semibold">Business Rule:</span> FIFO will be default for{" "}
                      <span className="font-semibold">batch-controlled</span> items.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Accounting & Costs
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optional cost fields and ERP mapping.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>Standard Cost</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.standard_cost}
                        onChange={(e) => setField("standard_cost", e.target.value)}
                        placeholder="Ex: 250.00"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>Standard price (optional).</p>
                    </div>

                    <div>
                      <label className={labelBase}>
                        Last Purchase Price <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        type="text"
                        value={form.last_purchase_price}
                        readOnly
                        className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
                      />
                      <p className={classNames("mt-1", helperBase)}>
                        Auto updated from latest procurement.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>Inventory GL Code</label>
                      <input
                        value={form.inventory_gl_code}
                        onChange={(e) => setField("inventory_gl_code", e.target.value)}
                        placeholder="Ex: INV-GL-1001"
                        className={classNames(inputBase, "mt-2")}
                      />
                      <p className={classNames("mt-1", helperBase)}>
                        Used for ERP integration / accounting mapping (optional).
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> For batch-controlled items, system
                    will suggest FIFO as default valuation method.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== STATUS ===================== */}
          {activeTab === "status" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left */}
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Item Status
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Control whether this item is available for transactions.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelBase}>
                        Status <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setField("status", e.target.value as Status)}
                        onBlur={() => markTouched("status")}
                        className={classNames(inputBase, "mt-2", showError("status") && "border-red-500")}
                      >
                        <option value="">Select status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>

                      {showError("status") && (
                        <p className="mt-1 text-xs text-red-600">{errors.status}</p>
                      )}

                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                        <span className="font-semibold">Note:</span> Inactive items can be restricted
                        from GRN/GIN and sales transactions based on policy.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Status</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {form.status ? form.status : "Not set"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Visibility</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {form.status === "Inactive" ? "Restricted" : "Allowed"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Audit Details
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    System generated fields (read-only).
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        Created By <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        value={form.created_by}
                        readOnly
                        className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Created Date <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        value={form.created_date}
                        readOnly
                        className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Modified By <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        value={form.modified_by}
                        readOnly
                        className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Modified Date <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        value={form.modified_date}
                        readOnly
                        className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Audit fields are system-generated.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== LAYOUT ===================== */}
          {activeTab === "layout" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left: selectors */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Virtual Layout Selection
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select Zone → Aisle → Rack to view the seat-map style bin grid.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelBase}>Zone</label>
                      <select
                        value={selectedZoneId}
                        onChange={(e) => {
                          const zid = e.target.value;
                          setSelectedZoneId(zid);

                          const z = zones.find((zz) => zz.id === zid) ?? zones[0];
                          const firstAisle = z?.aisles?.[0];
                          setSelectedAisleId(firstAisle?.id ?? "");
                          setSelectedRackId(firstAisle?.racks?.[0]?.id ?? "");
                        }}
                        className={inputBase}
                      >
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelBase}>Aisle</label>
                      <select
                        value={selectedAisleId}
                        onChange={(e) => {
                          const aid = e.target.value;
                          setSelectedAisleId(aid);

                          const a =
                            selectedZone?.aisles.find((aa) => aa.id === aid) ??
                            selectedZone?.aisles[0];
                          setSelectedRackId(a?.racks?.[0]?.id ?? "");
                        }}
                        className={inputBase}
                      >
                        {(selectedZone?.aisles ?? []).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelBase}>Rack</label>
                      <select
                        value={selectedRackId}
                        onChange={(e) => setSelectedRackId(e.target.value)}
                        className={inputBase}
                      >
                        {(selectedAisle?.racks ?? []).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} (L{r.levels} × B{r.binsPerLevel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                      <p className="font-semibold">Save as Preferred</p>
                      <p className="mt-1">This stores selected Zone/Aisle/Rack into item master.</p>
                      <button
                        type="button"
                        className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition"
                        style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                        onClick={() => {
                          setField("preferred_zone", selectedZone?.name ?? "");
                          setField("preferred_aisle", selectedAisle?.name ?? "");
                          setField("preferred_rack", selectedRack?.name ?? "");
                        }}
                      >
                        Save Preferred Mapping
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Preferred Mapping (Item)
                  </h4>
                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                      <p className="text-xs text-gray-500">Preferred Zone</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {form.preferred_zone || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                      <p className="text-xs text-gray-500">Preferred Aisle</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {form.preferred_aisle || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                      <p className="text-xs text-gray-500">Preferred Rack</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {form.preferred_rack || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: seat-map */}
              <div className="lg:col-span-8 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        Seat-map Style Bin Grid
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Click any bin to open drawer (capacity/weight/notes/status).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={binQuery}
                        onChange={(e) => setBinQuery(e.target.value)}
                        placeholder="Search bin code..."
                        className="w-56 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none"
                      />

                      <select
                        value={binStatusFilter}
                        onChange={(e) => setBinStatusFilter(e.target.value as "" | BinStatus)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:outline-none"
                      >
                        <option value="">All Status</option>
                        <option value="Available">Available</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Blocked">Blocked</option>
                      </select>

                      {/* Add Bin Button */}
                      <button
                        type="button"
                        onClick={addBinColumn}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition"
                        style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                        title="Adds 1 new bin column for all levels in selected rack"
                      >
                        + Add Bin
                      </button>
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Rack Utilization</p>
                        <p className="text-sm font-semibold text-gray-900">
                          Total Bins: {rackStats.total}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded bg-white border border-gray-300" />
                          Available: {rackStats.counts.available} ({rackStats.pct.available}%)
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded bg-blue-100 border border-blue-300" />
                          Reserved: {rackStats.counts.reserved} ({rackStats.pct.reserved}%)
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded bg-red-100 border border-red-300" />
                          Occupied: {rackStats.counts.occupied} ({rackStats.pct.occupied}%)
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded bg-gray-200 border border-gray-300" />
                          Blocked: {rackStats.counts.blocked} ({rackStats.pct.blocked}%)
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                      <div className="flex h-full w-full">
                        <div className="h-full bg-white" style={{ width: `${rackStats.pct.available}%` }} />
                        <div className="h-full bg-blue-200" style={{ width: `${rackStats.pct.reserved}%` }} />
                        <div className="h-full bg-red-200" style={{ width: `${rackStats.pct.occupied}%` }} />
                        <div className="h-full bg-gray-300" style={{ width: `${rackStats.pct.blocked}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="mt-4 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="inline-block min-w-full">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          {selectedZone?.name} → {selectedAisle?.name} → {selectedRack?.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Levels: {selectedRack?.levels ?? 0}, Bins/Level: {selectedRack?.binsPerLevel ?? 0}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {binsMatrix.map((row, rowIndex) => {
                          const levelLabel = (selectedRack?.levels ?? 0) - rowIndex;
                          return (
                            <div key={`row-${rowIndex}`} className="flex items-center gap-3">
                              <div className="w-12 text-xs font-semibold text-gray-700">
                                L{pad2(levelLabel)}
                              </div>

                              <div
                                className="grid gap-2"
                                style={{
                                  gridTemplateColumns: `repeat(${selectedRack?.binsPerLevel ?? 1}, minmax(64px, 64px))`,
                                }}
                              >
                                {row.map((cell, idx) => {
                                  if (!cell) {
                                    return (
                                      <div
                                        key={`empty-${rowIndex}-${idx}`}
                                        className="h-12 w-16 rounded-lg border border-dashed border-gray-200 bg-transparent"
                                        title="No bin (filtered)"
                                      />
                                    );
                                  }

                                  return (
                                    <button
                                      key={cell.id}
                                      type="button"
                                      onClick={() => openBinDrawer(cell.id)}
                                      className={classNames(
                                        "h-12 w-16 rounded-lg border text-[10px] font-semibold shadow-sm transition",
                                        statusBg(cell.status),
                                        statusBorder(cell.status),
                                        statusText(cell.status)
                                      )}
                                      title={cell.code}
                                    >
                                      <div className="truncate px-1">B{pad2(cell.position)}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="w-12" />
                        <div
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${selectedRack?.binsPerLevel ?? 1}, minmax(64px, 64px))`,
                          }}
                        >
                          {Array.from({ length: selectedRack?.binsPerLevel ?? 0 }).map((_, i) => (
                            <div key={`col-${i}`} className="text-center text-[10px] font-semibold text-gray-600">
                              B{pad2(i + 1)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bin Drawer */}
                <div className={classNames("fixed inset-0 z-[60] transition", drawerOpen ? "pointer-events-auto" : "pointer-events-none")}>
                  <div
                    className={classNames("absolute inset-0 bg-black/30 transition-opacity", drawerOpen ? "opacity-100" : "opacity-0")}
                    onClick={() => setDrawerOpen(false)}
                  />

                  <div
                    className={classNames(
                      "absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-2xl transition-transform",
                      drawerOpen ? "translate-x-0" : "translate-x-full"
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                      <div>
                        <p className="text-xs text-gray-500">Bin Details</p>
                        <h5 className="text-sm font-semibold text-gray-900">{selectedBin?.code ?? "—"}</h5>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={() => setDrawerOpen(false)}
                      >
                        Close
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      {!selectedBin ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-600">
                          Select a bin from the grid.
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-gray-200 p-3">
                              <p className="text-xs text-gray-500">Level</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">L{pad2(selectedBin.level)}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-3">
                              <p className="text-xs text-gray-500">Position</p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">B{pad2(selectedBin.position)}</p>
                            </div>
                          </div>

                          <div>
                            <label className={labelBase}>Status</label>
                            <select
                              value={selectedBin.status}
                              onChange={(e) =>
                                updateBin(selectedBin.id, { status: e.target.value as BinStatus })
                              }
                              className={classNames(inputBase, "mt-2")}
                            >
                              <option value="Available">Available</option>
                              <option value="Reserved">Reserved</option>
                              <option value="Occupied">Occupied</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className={labelBase}>Capacity</label>
                              <input
                                value={selectedBin.meta?.capacity ?? ""}
                                onChange={(e) =>
                                  updateBin(selectedBin.id, {
                                    meta: { ...(selectedBin.meta ?? {}), capacity: e.target.value },
                                  })
                                }
                                placeholder="Ex: 50 boxes"
                                className={classNames(inputBase, "mt-2")}
                              />
                            </div>

                            <div>
                              <label className={labelBase}>Max Weight (Kg)</label>
                              <input
                                value={selectedBin.meta?.maxWeightKg ?? ""}
                                onChange={(e) =>
                                  updateBin(selectedBin.id, {
                                    meta: { ...(selectedBin.meta ?? {}), maxWeightKg: e.target.value },
                                  })
                                }
                                placeholder="Ex: 200"
                                className={classNames(inputBase, "mt-2")}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={labelBase}>Notes</label>
                            <textarea
                              value={selectedBin.meta?.notes ?? ""}
                              onChange={(e) =>
                                updateBin(selectedBin.id, {
                                  meta: { ...(selectedBin.meta ?? {}), notes: e.target.value },
                                })
                              }
                              placeholder="Any notes about this bin..."
                              className={classNames(inputBase, "mt-2 min-h-[110px]")}
                            />
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                            <span className="font-semibold">Tip:</span> Use <b>Reserved</b> for inbound holds and{" "}
                            <b>Blocked</b> for damaged/maintenance bins.
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={outlineBtn} onClick={onReset}>
          Reset
        </button>
        <button
          type="button"
          className={classNames(primaryBtn)}
          style={{ backgroundColor: FORTUNA_PRIMARY_RED, boxShadow: "0 8px 20px rgba(200,16,46,0.25)" }}
          onClick={onSave}
        >
          Save Item
        </button>
      </div>
    </div>
  );
}
