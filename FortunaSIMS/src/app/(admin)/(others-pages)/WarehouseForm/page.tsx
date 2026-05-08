"use client";
import React, { useEffect, useRef, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axios from "axios";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type TabKey = "basic" | "inventory" | "storage" | "valuation" | "status" | "layout";



/** ====== WAREHOUSE FORM STATE ====== */
type WarehouseFormState = {
  warehouseCode: string;
  warehouseName: string;
  warehouseType: "General DC" | "Manufacturing Store" | "Cold Chain" | "Yard" | "";
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;

  allowNegativeStock: boolean;
  enableBinTracking: boolean;

  storageType: "Ambient" | "Cold" | "";
  hazardousAllowed: boolean;

  costingMethod: "FIFO" | "LIFO" | "AVG" | "";

  status: "Active" | "Inactive" | "";
};

const initialForm: WarehouseFormState = {
  warehouseCode: "",
  warehouseName: "",
  warehouseType: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",

  allowNegativeStock: false,
  enableBinTracking: true,

  storageType: "",
  hazardousAllowed: false,

  costingMethod: "",

  status: "Active",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Information" },
  { key: "inventory", label: "Inventory Controls" },
  { key: "storage", label: "Storage & Handling" },
  { key: "valuation", label: "Valuation & Accounting" },
  { key: "status", label: "Status & Audit" },
  { key: "layout", label: "Layout" },
];

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005F99]/20 focus:border-[#005F99]";

const labelBase = "text-sm font-medium text-gray-700";
const helperBase = "text-xs text-gray-500";

/** ====== VIRTUAL LAYOUT TYPES ====== */
type BinStatus = "Available" | "Occupied" | "Blocked" | "Reserved";

type BinMeta = {
  capacity?: string;
  maxWeightKg?: string;
  notes?: string;
};

type Bin = {
  id: string;
  code: string;
  level: number;
  position: number;
  status: BinStatus;
  qrCode?: string; // QR code data for the bin
  meta?: BinMeta;
};

type Rack = {
  id: string;
  name: string; // e.g. Rack-01
  levels: number; // vertical levels
  binsPerLevel: number; // positions per level
  bins: Bin[];
};

type Aisle = { id: string; name: string; racks: Rack[] };

type ZoneType = "Receiving" | "QC" | "Putaway" | "Picking" | "Packing" | "Shipping" | "Storage" | "Returns";
type Zone = { id: string; name: string; type: ZoneType; aisles: Aisle[] };

/** Standard-ish naming helpers */
function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function safeCode(s: string) {
  return (s || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9_-]/g, "");
}

/**
 * GLOBAL STANDARD NOTE (Practical):
 * Location Code = WH-ZONE-AISLE-RACK-Lxx-Byy
 * Example: WH-HYD-01-ZSHIPPING-A02-R02-L03-B07
 * (Short, consistent, ERP/WMS friendly)
 */
function buildBinCode(args: {
  warehouseCode: string;
  zoneName: string;
  aisleName: string;
  rackName: string;
  level: number;
  pos: number;
}) {
  const wh = safeCode(args.warehouseCode || "WH");
  const z = safeCode(args.zoneName || "ZONE");
  const a = safeCode(args.aisleName || "A");
  const r = safeCode(args.rackName || "R");
  return `${wh}-${z}-${a}-${r}-L${pad2(args.level)}-B${pad2(args.pos)}`;
}

function makeRackBins(params: {
  warehouseCode: string;
  zoneName: string;
  aisleName: string;
  rackName: string;
  levels: number;
  binsPerLevel: number;
}) {
  const { warehouseCode, zoneName, aisleName, rackName, levels, binsPerLevel } = params;
  const bins: Bin[] = [];

  for (let l = 1; l <= levels; l++) {
    for (let b = 1; b <= binsPerLevel; b++) {
      const binCode = buildBinCode({
        warehouseCode,
        zoneName,
        aisleName,
        rackName,
        level: l,
        pos: b,
      });
      
      bins.push({
        id: uid("bin"),
        code: binCode,
        level: l,
        position: b,
        status: "Available",
        qrCode: binCode, // Generate QR code from bin code
        meta: { capacity: "", maxWeightKg: "", notes: "" },
      });
    }
  }

  return bins;
}

function buildDefaultZones(warehouseCode: string): Zone[] {
  const zoneTypes: ZoneType[] = ["Receiving", "QC", "Putaway", "Picking", "Packing", "Shipping"];

  return zoneTypes.map((type) => {
    const zone: Zone = {
      id: uid("zone"),
      name: `Zone-${type}`,
      type,
      aisles: [],
    };

    // default 2 aisles, 2 racks each
    zone.aisles = [1, 2].map((ai) => {
      const aisle: Aisle = { id: uid("aisle"), name: `Aisle-${pad2(ai)}`, racks: [] };
      aisle.racks = [1, 2].map((ri) => {
        const rackName = `Rack-${pad2(ri)}`;
        const levels = 4;
        const binsPerLevel = 10;
        return {
          id: uid("rack"),
          name: rackName,
          levels,
          binsPerLevel,
          bins: makeRackBins({
            warehouseCode,
            zoneName: zone.name,
            aisleName: aisle.name,
            rackName,
            levels,
            binsPerLevel,
          }),
        };
      });
      return aisle;
    });

    return zone;
  });
}

/** ====== Bin Drawer selection type ====== */
type SelectedBinCtx = {
  zoneId: string;
  aisleId: string;
  rackId: string;
  binId: string;
};

const modalOverlay = "fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4";

export default function WarehouseMasterForm() {
const router = useRouter();

const searchParams = useSearchParams();
const code = searchParams.get("code");

const isEdit = !!code;
const mode = searchParams.get("mode");
const isView = mode === "view"; // View mode if mode=view in query   //
const isDisabled = isView;

// 🔥 GLOBAL VIEW GUARD (REUSABLE)
const allowAction = (fn?: () => void) => {
  if (isView) return;
  fn && fn();
};
const hasFetched = useRef(false);

  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<WarehouseFormState>(initialForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** ====== Layout State ====== */
  const [zones, setZones] = useState<Zone[]>(() => buildDefaultZones(initialForm.warehouseCode || "WH"));
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => zones[0]?.id ?? "");
  const [selectedAisleId, setSelectedAisleId] = useState<string>(() => zones[0]?.aisles[0]?.id ?? "");
  const [selectedRackId, setSelectedRackId] = useState<string>(() => zones[0]?.aisles[0]?.racks[0]?.id ?? "");

  const [searchBin, setSearchBin] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"" | BinStatus>("");

  /** ====== Drawer State ====== */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBinCtx, setSelectedBinCtx] = useState<SelectedBinCtx | null>(null);
  const [drawerStatus, setDrawerStatus] = useState<BinStatus>("Available");
  const [drawerCapacity, setDrawerCapacity] = useState("");
  const [drawerMaxWeightKg, setDrawerMaxWeightKg] = useState("");
  const [drawerNotes, setDrawerNotes] = useState("");

  /** ====== Builder Modals ====== */
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [addAisleOpen, setAddAisleOpen] = useState(false);
  const [addRackOpen, setAddRackOpen] = useState(false);

  const [renameOpen, setRenameOpen] = useState<null | { kind: "zone" | "aisle" | "rack"; id: string; value: string }>(
    null
  );

  const [newZoneType, setNewZoneType] = useState<ZoneType>("Storage");
  const [newZoneName, setNewZoneName] = useState("Zone-Storage");

  const [newAisleName, setNewAisleName] = useState("Aisle-01");

  const [newRackName, setNewRackName] = useState("Rack-01");
  const [newRackLevels, setNewRackLevels] = useState<number>(4);
  const [newRackBinsPerLevel, setNewRackBinsPerLevel] = useState<number>(10);

  /** ====== Validations ====== */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.warehouseCode.trim()) e.warehouseCode = "Warehouse Code is required";
    if (!form.warehouseName.trim()) e.warehouseName = "Warehouse Name is required";
    if (!form.warehouseType) e.warehouseType = "Warehouse Type is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    if (form.pincode.trim() && form.pincode.trim().length !== 6) e.pincode = "Pincode must be 6 digits";
    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof WarehouseFormState>(key: K, value: WarehouseFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };
  const markTouched = (key: keyof WarehouseFormState) => setTouched((p) => ({ ...p, [key as string]: true }));
  const showError = (key: keyof WarehouseFormState) => Boolean(touched[key as string] && errors[key as string]);

  const onReset = () => {
    setForm(initialForm);
    setTouched({});
    setActiveTab("basic");
    setDrawerOpen(false);
    setSelectedBinCtx(null);

    const freshZones = buildDefaultZones("WH");
    setZones(freshZones);
    setSelectedZoneId(freshZones[0]?.id ?? "");
    setSelectedAisleId(freshZones[0]?.aisles[0]?.id ?? "");
    setSelectedRackId(freshZones[0]?.aisles[0]?.racks[0]?.id ?? "");
  };
//edit: Fetch existing warehouse details if in edit mode//

const fetchWarehouseByCode = async () => {
  try {
    const res = await axios.get(
  `http://localhost:5000/api/warehouses/full/${code}`
  );

    const { warehouse, settings, zones, aisles, racks, bins } = res.data;

    // 🟦 BASIC TAB
    setForm((prev) => ({
      ...prev,
      warehouseCode: warehouse.warehouse_code,
      warehouseName: warehouse.warehouse_name,
      warehouseType: warehouse.warehouse_type,
      addressLine1: warehouse.address_line1 || "",
      city: warehouse.city,
      state: warehouse.state,
      pincode: warehouse.pincode || "",
      status: warehouse.status,

      // 🟩 INVENTORY TAB
      allowNegativeStock: settings?.allow_negative_stock || false,
      enableBinTracking: settings?.enable_bin_tracking || false,

      // 🟨 STORAGE TAB
      storageType: settings?.storage_type || "",
      hazardousAllowed: settings?.hazardous_allowed || false,

      // 🟪 VALUATION TAB
      costingMethod: settings?.costing_method || "",
    }));

    // 🟥 LAYOUT (IMPORTANT)
    const transformedZones = transformDBToUI(zones, aisles, racks, bins);
    setZones(transformedZones);

  } catch (err) {
    console.error("Fetch error:", err);
  }
};

// Trigger fetch on mount if edit mode//
useEffect(() => {
  if (isEdit && code && !hasFetched.current) {
    fetchWarehouseByCode();
    hasFetched.current = true;
  }
}, [code]);

//transform backend data to UI format//

const transformDBToUI = (zones, aisles, racks, bins) => {
  return zones.map((zone) => {
    const zoneAisles = aisles
      .filter((a) => a.zone_id === zone.zone_id)
      .map((aisle) => {
        const aisleRacks = racks
          .filter((r) => r.aisle_id === aisle.aisle_id)
          .map((rack) => {
            const rackBins = bins.filter((b) => b.rack_id === rack.rack_id);

            return {
              id: rack.rack_id,
              name: rack.rack_name,
              levels: rack.levels,
              binsPerLevel: rack.bins_per_level,
              bins: rackBins.map((b) => ({
                id: b.bin_id,
                code: b.bin_code,
                level: b.level,
                position: b.position,
                status: b.status,
                qrCode: b.bin_code, // Generate QR code from bin code
              })),
            };
          });

        return {
          id: aisle.aisle_id,
          name: aisle.aisle_name,
          racks: aisleRacks,
        };
      });

    return {
      id: zone.zone_id,
      name: zone.zone_name,
      type: zone.zone_type,
      aisles: zoneAisles,
    };
  });
};


// =========================
// 🔥 FORMAT LAYOUT FUNCTION
// =========================
const formatLayout = (zones: Zone[]) => {
  if (!zones || zones.length === 0) return [];

  return zones.map((zone, zIndex) => ({
    zone_name: zone?.name || `Zone-${zIndex + 1}`,
    zone_type: zone?.type || "Storage",

    aisles: (zone?.aisles || []).map((aisle, aIndex) => ({
      aisle_name: aisle?.name || `Aisle-${aIndex + 1}`,

      racks: (aisle?.racks || []).map((rack, rIndex) => ({
        rack_name: rack?.name || `Rack-${rIndex + 1}`,

        // 🔥 SP expects numbers
        levels: Number(rack?.levels ?? 1),
        bins_per_level: Number(rack?.binsPerLevel ?? 1),
      })),
    })),
  }));
};


// =========================
// 🔥 SAVE WAREHOUSE
// =========================
const onSave = async () => {

  const toTouch = [
    "warehouseCode",
    "warehouseName",
    "warehouseType",
    "city",
    "state",
    "pincode",
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

    const payload = {
      warehouse: {
        warehouse_code: form.warehouseCode,
        warehouse_name: form.warehouseName,
        warehouse_type: form.warehouseType,
        address_line1: form.addressLine1,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        status: form.status || "Active",
      },

      settings: {
        allow_negative_stock: form.allowNegativeStock,
        enable_bin_tracking: form.enableBinTracking,
        storage_type: form.storageType || "Ambient",
        hazardous_allowed: form.hazardousAllowed,
        costing_method: form.costingMethod || "FIFO",
      },

      layout: formatLayout(zones), // 🔥 important
    };

    console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    let res;

if (isEdit) {
  // 🔥 UPDATE
  res = await axios.put(
    `http://localhost:5000/api/warehouses/full-update/${code}`,
    payload
  );
} else {
  // 🔥 CREATE
  res = await axios.post(
    "http://localhost:5000/api/warehouses/full-create",
    payload
  );
}

    console.log("API RESPONSE:", res.data);

    // ✅ SUCCESS CHECK
    if (res.data?.success) {

      alert("Warehouse Created/updated Successfully  ✅");

      // 🔥 CORRECT ROUTE
      router.push("/WarehouseMaster");

    } else {
      throw new Error("API returned failure");
    }

  } catch (err: any) {

    console.error("Save error FULL:", err);

    if (err.response) {
      console.error("Backend Error:", err.response.data);
      alert(err.response.data?.error || "Backend error ❌");
    } else {
      alert("Something went wrong ❌");
    }
  }
};
  /** ====== Selected references ====== */
  const selectedZone = useMemo(() => zones.find((z) => z.id === selectedZoneId) ?? zones[0], [zones, selectedZoneId]);

  const selectedAisle = useMemo(() => {
    if (!selectedZone) return undefined;
    return selectedZone.aisles.find((a) => a.id === selectedAisleId) ?? selectedZone.aisles[0];
  }, [selectedZone, selectedAisleId]);

  const selectedRack = useMemo(() => {
    if (!selectedAisle) return undefined;
    return selectedAisle.racks.find((r) => r.id === selectedRackId) ?? selectedAisle.racks[0];
  }, [selectedAisle, selectedRackId]);

  /** ====== Status visuals ====== */
  const nextStatus = (s: BinStatus): BinStatus => {
    if (s === "Available") return "Reserved";
    if (s === "Reserved") return "Occupied";
    if (s === "Occupied") return "Blocked";
    return "Available";
  };

  const statusStyle = (status: BinStatus) => {
    switch (status) {
      case "Available":
        return "bg-white border border-gray-300 hover:border-[#005F99]";
      case "Occupied":
        return "bg-red-100 border border-red-300";
      case "Blocked":
        return "bg-gray-200 border border-gray-300";
      case "Reserved":
        return "bg-blue-100 border border-blue-300";
    }
  };

  const rackGrid = useMemo(() => {
    if (!selectedRack) return [];
    const byLevel: Record<number, Bin[]> = {};
    selectedRack.bins.forEach((b) => {
      byLevel[b.level] = byLevel[b.level] ?? [];
      byLevel[b.level].push(b);
    });
    Object.keys(byLevel).forEach((k) => byLevel[Number(k)].sort((a, c) => a.position - c.position));
    const levels = Array.from({ length: selectedRack.levels }, (_, i) => selectedRack.levels - i);
    return levels.map((lv) => byLevel[lv] ?? []);
  }, [selectedRack]);

  const filteredCount = useMemo(() => {
    const bins = selectedRack?.bins ?? [];
    const q = searchBin.trim().toLowerCase();
    return bins.filter((b) => {
      const okSearch = q ? b.code.toLowerCase().includes(q) : true;
      const okStatus = activeStatusFilter ? b.status === activeStatusFilter : true;
      return okSearch && okStatus;
    }).length;
  }, [selectedRack, searchBin, activeStatusFilter]);

  /** ====== Drawer open ====== */
  const openBinDrawer = (ctx: SelectedBinCtx) => {
    const z = zones.find((zz) => zz.id === ctx.zoneId);
    const a = z?.aisles.find((aa) => aa.id === ctx.aisleId);
    const r = a?.racks.find((rr) => rr.id === ctx.rackId);
    const b = r?.bins.find((bb) => bb.id === ctx.binId);
    if (!z || !a || !r || !b) return;

    setSelectedBinCtx(ctx);
    setDrawerStatus(b.status);
    setDrawerCapacity(b.meta?.capacity ?? "");
    setDrawerMaxWeightKg(b.meta?.maxWeightKg ?? "");
    setDrawerNotes(b.meta?.notes ?? "");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedBinCtx(null);
  };

  const saveDrawerChanges = () => {
    if (!selectedBinCtx) return;

    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedBinCtx.zoneId) return z;
        return {
          ...z,
          aisles: z.aisles.map((a) => {
            if (a.id !== selectedBinCtx.aisleId) return a;
            return {
              ...a,
              racks: a.racks.map((r) => {
                if (r.id !== selectedBinCtx.rackId) return r;
                return {
                  ...r,
                  bins: r.bins.map((b) => {
                    if (b.id !== selectedBinCtx.binId) return b;
                    return {
                      ...b,
                      status: drawerStatus,
                      meta: {
                        ...(b.meta ?? {}),
                        capacity: drawerCapacity,
                        maxWeightKg: drawerMaxWeightKg,
                        notes: drawerNotes,
                      },
                    };
                  }),
                };
              }),
            };
          }),
        };
      })
    );

    alert("Bin saved (demo).");
  };

  const quickToggleBin = (ctx: SelectedBinCtx) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== ctx.zoneId) return z;
        return {
          ...z,
          aisles: z.aisles.map((a) => {
            if (a.id !== ctx.aisleId) return a;
            return {
              ...a,
              racks: a.racks.map((r) => {
                if (r.id !== ctx.rackId) return r;
                return {
                  ...r,
                  bins: r.bins.map((b) => (b.id === ctx.binId ? { ...b, status: nextStatus(b.status) } : b)),
                };
              }),
            };
          }),
        };
      })
    );
  };

  const drawerData = useMemo(() => {
    if (!selectedBinCtx) return null;
    const z = zones.find((zz) => zz.id === selectedBinCtx.zoneId);
    const a = z?.aisles.find((aa) => aa.id === selectedBinCtx.aisleId);
    const r = a?.racks.find((rr) => rr.id === selectedBinCtx.rackId);
    const b = r?.bins.find((bb) => bb.id === selectedBinCtx.binId);
    if (!z || !a || !r || !b) return null;
    return { z, a, r, b };
  }, [selectedBinCtx, zones]);

  /** ================================
   *  LAYOUT BUILDER ACTIONS
   *  ================================ */

  const ensureSelectionAfterZoneChange = (nextZones: Zone[]) => {
    const z = nextZones[0];
    setSelectedZoneId(z?.id ?? "");
    setSelectedAisleId(z?.aisles[0]?.id ?? "");
    setSelectedRackId(z?.aisles[0]?.racks[0]?.id ?? "");
  };

  const addZone = () => {
    const wh = form.warehouseCode.trim() || "WH";
    const name = newZoneName.trim() || `Zone-${newZoneType}`;
    const z: Zone = { id: uid("zone"), name, type: newZoneType, aisles: [] };

    // OPTIONAL: create one default aisle + rack to avoid empty states
    const aisle: Aisle = { id: uid("aisle"), name: "Aisle-01", racks: [] };
    const rackName = "Rack-01";
    const levels = 4;
    const binsPerLevel = 10;

    aisle.racks.push({
      id: uid("rack"),
      name: rackName,
      levels,
      binsPerLevel,
      bins: makeRackBins({
        warehouseCode: wh,
        zoneName: z.name,
        aisleName: aisle.name,
        rackName,
        levels,
        binsPerLevel,
      }),
    });

    z.aisles.push(aisle);

    setZones((prev) => {
      const next = [...prev, z];
      return next;
    });

    setSelectedZoneId(z.id);
    setSelectedAisleId(aisle.id);
    setSelectedRackId(aisle.racks[0].id);

    setAddZoneOpen(false);
  };

  const addAisle = () => {
    if (!selectedZone) return;
    const name = newAisleName.trim() || `Aisle-${pad2((selectedZone.aisles?.length ?? 0) + 1)}`;
    const aisle: Aisle = { id: uid("aisle"), name, racks: [] };

    // optional: create a default rack
    const wh = form.warehouseCode.trim() || "WH";
    const rackName = "Rack-01";
    const levels = 4;
    const binsPerLevel = 10;

    aisle.racks.push({
      id: uid("rack"),
      name: rackName,
      levels,
      binsPerLevel,
      bins: makeRackBins({
        warehouseCode: wh,
        zoneName: selectedZone.name,
        aisleName: aisle.name,
        rackName,
        levels,
        binsPerLevel,
      }),
    });

    setZones((prev) =>
      prev.map((z) => (z.id === selectedZone.id ? { ...z, aisles: [...z.aisles, aisle] } : z))
    );

    setSelectedAisleId(aisle.id);
    setSelectedRackId(aisle.racks[0].id);
    setAddAisleOpen(false);
  };

  const addRack = () => {
    if (!selectedZone || !selectedAisle) return;

    const wh = form.warehouseCode.trim() || "WH";
    const rackName = newRackName.trim() || `Rack-${pad2((selectedAisle.racks?.length ?? 0) + 1)}`;
    const levels = Math.max(1, Math.min(20, Number(newRackLevels) || 1));
    const binsPerLevel = Math.max(1, Math.min(50, Number(newRackBinsPerLevel) || 1));

    const rack: Rack = {
      id: uid("rack"),
      name: rackName,
      levels,
      binsPerLevel,
      bins: makeRackBins({
        warehouseCode: wh,
        zoneName: selectedZone.name,
        aisleName: selectedAisle.name,
        rackName,
        levels,
        binsPerLevel,
      }),
    };

    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZone.id) return z;
        return {
          ...z,
          aisles: z.aisles.map((a) => (a.id === selectedAisle.id ? { ...a, racks: [...a.racks, rack] } : a)),
        };
      })
    );

    setSelectedRackId(rack.id);
    setAddRackOpen(false);
  };

  const deleteZone = (zoneId: string) => {
    const ok = confirm("Delete this Zone? All aisles/racks/bins under it will be removed.");
    if (!ok) return;

    setZones((prev) => {
      const next = prev.filter((z) => z.id !== zoneId);
      if (next.length === 0) {
        const rebuilt = buildDefaultZones(form.warehouseCode.trim() || "WH");
        ensureSelectionAfterZoneChange(rebuilt);
        return rebuilt;
      }
      // selection fix
      setTimeout(() => ensureSelectionAfterZoneChange(next), 0);
      return next;
    });
  };

  const deleteAisle = (aisleId: string) => {
    if (!selectedZone) return;
    const ok = confirm("Delete this Aisle? All racks/bins under it will be removed.");
    if (!ok) return;

    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZone.id) return z;
        const nextAisles = z.aisles.filter((a) => a.id !== aisleId);
        const fixed = nextAisles.length ? nextAisles : [];
        const newZ = { ...z, aisles: fixed };
        return newZ;
      })
    );

    // re-select safely
    setTimeout(() => {
      const z = zones.find((x) => x.id === selectedZone.id);
      const a = z?.aisles?.find((aa) => aa.id !== aisleId) ?? z?.aisles?.[0];
      setSelectedAisleId(a?.id ?? "");
      setSelectedRackId(a?.racks?.[0]?.id ?? "");
    }, 0);
  };

  const deleteRack = (rackId: string) => {
    if (!selectedZone || !selectedAisle) return;
    const ok = confirm("Delete this Rack? All bins under it will be removed.");
    if (!ok) return;

    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZone.id) return z;
        return {
          ...z,
          aisles: z.aisles.map((a) => {
            if (a.id !== selectedAisle.id) return a;
            const nextRacks = a.racks.filter((r) => r.id !== rackId);
            return { ...a, racks: nextRacks };
          }),
        };
      })
    );

    setTimeout(() => {
      const z = zones.find((x) => x.id === selectedZone.id);
      const a = z?.aisles?.find((x) => x.id === selectedAisle.id);
      const r = a?.racks?.find((rr) => rr.id !== rackId) ?? a?.racks?.[0];
      setSelectedRackId(r?.id ?? "");
    }, 0);
  };

  const renameEntity = () => {
    if (!renameOpen) return;
    const newName = renameOpen.value.trim();
    if (!newName) return;

    const wh = form.warehouseCode.trim() || "WH";

    setZones((prev) =>
      prev.map((z) => {
        if (renameOpen.kind === "zone" && z.id === renameOpen.id) {
          const updatedZone = { ...z, name: newName };
          // IMPORTANT: Rebuild bin codes because zone name is part of code
          updatedZone.aisles = updatedZone.aisles.map((a) => ({
            ...a,
            racks: a.racks.map((r) => ({
              ...r,
              bins: r.bins.map((b) => ({
                ...b,
                code: buildBinCode({
                  warehouseCode: wh,
                  zoneName: updatedZone.name,
                  aisleName: a.name,
                  rackName: r.name,
                  level: b.level,
                  pos: b.position,
                }),
              })),
            })),
          }));
          return updatedZone;
        }

        if (renameOpen.kind === "aisle") {
          const updated = {
            ...z,
            aisles: z.aisles.map((a) => {
              if (a.id !== renameOpen.id) return a;
              const updatedAisle = { ...a, name: newName };
              // rebuild bin codes
              updatedAisle.racks = updatedAisle.racks.map((r) => ({
                ...r,
                bins: r.bins.map((b) => ({
                  ...b,
                  code: buildBinCode({
                    warehouseCode: wh,
                    zoneName: z.name,
                    aisleName: updatedAisle.name,
                    rackName: r.name,
                    level: b.level,
                    pos: b.position,
                  }),
                })),
              }));
              return updatedAisle;
            }),
          };
          return updated;
        }

        if (renameOpen.kind === "rack") {
          const updated = {
            ...z,
            aisles: z.aisles.map((a) => ({
              ...a,
              racks: a.racks.map((r) => {
                if (r.id !== renameOpen.id) return r;
                const updatedRack = { ...r, name: newName };
                updatedRack.bins = updatedRack.bins.map((b) => ({
                  ...b,
                  code: buildBinCode({
                    warehouseCode: wh,
                    zoneName: z.name,
                    aisleName: a.name,
                    rackName: updatedRack.name,
                    level: b.level,
                    pos: b.position,
                  }),
                }));
                return updatedRack;
              }),
            })),
          };
          return updated;
        }

        return z;
      })
    );

    setRenameOpen(null);
  };

  const regenerateRackBins = (rackId: string, levels: number, binsPerLevel: number) => {
    if (!selectedZone || !selectedAisle) return;

    const ok = confirm("Regenerate bins for this rack? Existing bin statuses/notes will be RESET.");
    if (!ok) return;

    const wh = form.warehouseCode.trim() || "WH";

    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZone.id) return z;
        return {
          ...z,
          aisles: z.aisles.map((a) => {
            if (a.id !== selectedAisle.id) return a;
            return {
              ...a,
              racks: a.racks.map((r) => {
                if (r.id !== rackId) return r;
                return {
                  ...r,
                  levels,
                  binsPerLevel,
                  bins: makeRackBins({
                    warehouseCode: wh,
                    zoneName: selectedZone.name,
                    aisleName: selectedAisle.name,
                    rackName: r.name,
                    levels,
                    binsPerLevel,
                  }),
                };
              }),
            };
          }),
        };
      })
    );
  };

  /** ====== Buttons style ====== */
  const primaryBtn =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition active:scale-95";
  const outlineBtn =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition active:scale-95";

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Warehouse Master" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Warehouse Master</h3>
          <p className={helperBase}>
            Tabs + Virtual Layout (Zones → Aisles → Racks → Bins). Codes follow a consistent standard.
          </p>
        </div>

        {!isView && (
  <div className="flex flex-wrap gap-2">
    <button type="button" className={outlineBtn} onClick={onReset}>
      Reset
    </button>

    <button
      type="button"
      className={primaryBtn}
      style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
      onClick={onSave}
    >
      Save Warehouse
    </button>
  </div>
)}

      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={classNames(
                  "relative rounded-xl px-3 py-2 text-sm font-semibold transition active:scale-95",
                  isActive ? "text-white shadow" : "text-gray-700 hover:bg-gray-50"
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
          {/* BASIC */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <label className={labelBase}>
                    Warehouse Code <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.warehouseCode}
                    onChange={(e) => setField("warehouseCode", e.target.value)}
                    onBlur={() => markTouched("warehouseCode")}
                    placeholder="Ex: WH-HYD-01"
                    className={classNames(inputBase, showError("warehouseCode") && "border-red-400")}
                  />
                  {showError("warehouseCode") && <p className="mt-1 text-xs text-red-600">{errors.warehouseCode}</p>}
                  <p className="mt-2 text-xs text-gray-500">
                    Location codes will start with this (ex: <span className="font-semibold">WH-HYD-01</span>).
                  </p>
                </div>

                <div>
                  <label className={labelBase}>
                    Warehouse Name <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.warehouseName}
                    onChange={(e) => setField("warehouseName", e.target.value)}
                    onBlur={() => markTouched("warehouseName")}
                    placeholder="Ex: Hyderabad Central DC"
                    className={classNames(inputBase, showError("warehouseName") && "border-red-400")}
                  />
                  {showError("warehouseName") && <p className="mt-1 text-xs text-red-600">{errors.warehouseName}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    Warehouse Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.warehouseType}
                    onChange={(e) => setField("warehouseType", e.target.value as WarehouseFormState["warehouseType"])}
                    onBlur={() => markTouched("warehouseType")}
                    className={classNames(inputBase, showError("warehouseType") && "border-red-400")}
                  >
                    <option value="">Select type</option>
                    <option value="General DC">General DC</option>
                    <option value="Manufacturing Store">Manufacturing Store</option>
                    <option value="Cold Chain">Cold Chain</option>
                    <option value="Yard">Yard</option>
                  </select>
                  {showError("warehouseType") && <p className="mt-1 text-xs text-red-600">{errors.warehouseType}</p>}
                </div>

                <div>
                  <label className={labelBase}>Address Line 1</label>
                  <input
                    value={form.addressLine1}
                    onChange={(e) => setField("addressLine1", e.target.value)}
                    placeholder="Street / Area"
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelBase}>
                    City <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    onBlur={() => markTouched("city")}
                    placeholder="Ex: Hyderabad"
                    className={classNames(inputBase, showError("city") && "border-red-400")}
                  />
                  {showError("city") && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    State <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    onBlur={() => markTouched("state")}
                    placeholder="Ex: Telangana"
                    className={classNames(inputBase, showError("state") && "border-red-400")}
                  />
                  {showError("state") && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
                </div>

                <div>
                  <label className={labelBase}>Pincode</label>
                  <input
                    value={form.pincode}
                    onChange={(e) => setField("pincode", e.target.value)}
                    onBlur={() => markTouched("pincode")}
                    placeholder="6 digits"
                    className={classNames(inputBase, showError("pincode") && "border-red-400")}
                  />
                  {showError("pincode") && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  <span className="font-semibold">Tip:</span> Layout tab lo Zones/Aisles/Racks create chesi bins manage cheyyandi.
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY */}
          {activeTab === "inventory" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-base font-semibold text-gray-900">Inventory Controls</h4>
                <p className="mt-1 text-xs text-gray-500">Basic controls (extend later).</p>

                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.enableBinTracking}
                      onChange={(e) => setField("enableBinTracking", e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Enable Bin Tracking</p>
                      <p className="text-xs text-gray-500">Track inventory at bin level.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.allowNegativeStock}
                      onChange={(e) => setField("allowNegativeStock", e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Allow Negative Stock</p>
                      <p className="text-xs text-gray-500">Enable only if business allows.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold">Note</p>
                <p className="mt-1 text-xs text-gray-600">Later: Reorder rules, safety stock, cycle count, bin rules.</p>
              </div>
            </div>
          )}

          {/* STORAGE */}
          {activeTab === "storage" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-base font-semibold text-gray-900">Storage & Handling</h4>
                <p className="mt-1 text-xs text-gray-500">Basic controls (extend later).</p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className={labelBase}>Storage Type</label>
                    <select
                      value={form.storageType}
                      onChange={(e) => setField("storageType", e.target.value as WarehouseFormState["storageType"])}
                      className={classNames(inputBase, "mt-2")}
                    >
                      <option value="">Select</option>
                      <option value="Ambient">Ambient</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.hazardousAllowed}
                      onChange={(e) => setField("hazardousAllowed", e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Hazardous Allowed</p>
                      <p className="text-xs text-gray-500">Special handling zone needed.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold">Next</p>
                <p className="mt-1 text-xs text-gray-600">Temperature range, humidity, rack constraints, putaway rules.</p>
              </div>
            </div>
          )}

          {/* VALUATION */}
          {activeTab === "valuation" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-base font-semibold text-gray-900">Valuation & Accounting</h4>
                <p className="mt-1 text-xs text-gray-500">Choose costing method (demo).</p>

                <div className="mt-4">
                  <label className={labelBase}>Costing Method</label>
                  <select
                    value={form.costingMethod}
                    onChange={(e) => setField("costingMethod", e.target.value as WarehouseFormState["costingMethod"])}
                    className={classNames(inputBase, "mt-2")}
                  >
                    <option value="">Select</option>
                    <option value="FIFO">FIFO</option>
                    <option value="LIFO">LIFO</option>
                    <option value="AVG">Average</option>
                  </select>

                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                    <span className="font-semibold">Business Rule:</span> Most FMCG warehouses use FIFO.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold">Note</p>
                <p className="mt-1 text-xs text-gray-600">Later: GL mapping, cost center, valuation posting rules.</p>
              </div>
            </div>
          )}

          {/* STATUS */}
          {activeTab === "status" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-base font-semibold text-gray-900">Status</h4>
                <div className="mt-4">
                  <label className={labelBase}>Warehouse Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as WarehouseFormState["status"])}
                    className={classNames(inputBase, "mt-2")}
                  >
                    <option value="">Select</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                    <span className="font-semibold">Note:</span> Inactive warehouses should be blocked in transactions.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold">Audit (Demo)</p>
                <p className="mt-1 text-xs text-gray-600">Created By / Modified By / timestamps → system fields.</p>
              </div>
            </div>
          )}

          {/* LAYOUT */}
          {activeTab === "layout" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-base font-semibold text-gray-900">Virtual Layout</h4>
                <p className="mt-1 text-xs text-gray-600">
                  Bin click → drawer opens. Double click → quick status toggle. Builder allows Zones/Aisles/Racks creation.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left: Zone tree + builder */}
                <div className="lg:col-span-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Structure Builder</h3>
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1 text-xs font-semibold text-white shadow active:scale-95"
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                      onClick={() => {
                        setNewZoneType("Storage");
                        setNewZoneName("Zone-Storage");
                        setAddZoneOpen(true);
                      }}
                    >
                      + Add Zone
                    </button>
                  </div>

                  <div className="space-y-3">
                    {zones.map((z) => {
                      const isZ = z.id === selectedZoneId;
                      return (
                        <div key={z.id} className="rounded-2xl border border-gray-200">
                          <div className="flex items-stretch">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedZoneId(z.id);
                                setSelectedAisleId(z.aisles[0]?.id ?? "");
                                setSelectedRackId(z.aisles[0]?.racks[0]?.id ?? "");
                              }}
                              className={classNames(
                                "flex-1 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition",
                                isZ ? "text-white shadow" : "text-gray-700 hover:bg-gray-50"
                              )}
                              style={isZ ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
                            >
                              {z.name}
                              <span className="ml-2 text-xs font-normal opacity-90">• {z.type}</span>
                              <div className="mt-1 text-[11px] opacity-90">{z.aisles.length} aisles</div>
                            </button>

                            <div className="flex flex-col gap-1 p-2">
                              <button
                                type="button"
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-gray-50"
                                onClick={() => setRenameOpen({ kind: "zone", id: z.id, value: z.name })}
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                                onClick={() => deleteZone(z.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {isZ && (
                            <div className="px-3 pb-3 pt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold text-gray-700">Aisles</div>
                                <button
                                  type="button"
                                  className="rounded-lg px-3 py-1 text-xs font-semibold text-white shadow active:scale-95"
                                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                                  onClick={() => {
                                    setNewAisleName(`Aisle-${pad2((z.aisles?.length ?? 0) + 1)}`);
                                    setAddAisleOpen(true);
                                  }}
                                >
                                  + Add Aisle
                                </button>
                              </div>

                              {z.aisles.map((a) => {
                                const isA = a.id === selectedAisleId;
                                return (
                                  <div key={a.id} className="rounded-xl border border-gray-200">
                                    <div className="flex items-stretch">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedAisleId(a.id);
                                          setSelectedRackId(a.racks[0]?.id ?? "");
                                        }}
                                        className={classNames(
                                          "flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                                          isA ? "text-white shadow" : "text-gray-700 hover:bg-gray-50"
                                        )}
                                        style={isA ? { backgroundColor: FORTUNA_SECONDARY_BLUE } : undefined}
                                      >
                                        {a.name}
                                        <span className="ml-2 text-xs font-normal opacity-90">• {a.racks.length} racks</span>
                                      </button>

                                      <div className="flex flex-col gap-1 p-2">
                                        <button
                                          type="button"
                                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-gray-50"
                                          onClick={() => setRenameOpen({ kind: "aisle", id: a.id, value: a.name })}
                                        >
                                          Rename
                                        </button>
                                        <button
                                          type="button"
                                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                                          onClick={() => deleteAisle(a.id)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>

                                    {isA && (
                                      <div className="px-3 pb-3 pt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="text-xs font-semibold text-gray-700">Racks</div>
                                          <button
                                            type="button"
                                            className="rounded-lg px-3 py-1 text-xs font-semibold text-white shadow active:scale-95"
                                            style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                                            onClick={() => {
                                              setNewRackName(`Rack-${pad2((a.racks?.length ?? 0) + 1)}`);
                                              setNewRackLevels(4);
                                              setNewRackBinsPerLevel(10);
                                              setAddRackOpen(true);
                                            }}
                                          >
                                            + Add Rack
                                          </button>
                                        </div>

                                        {a.racks.map((r) => {
                                          const isR = r.id === selectedRackId;
                                          return (
                                            <div key={r.id} className="flex items-stretch gap-2">
                                              <button
                                                type="button"
                                                onClick={() => setSelectedRackId(r.id)}
                                                className={classNames(
                                                  "flex-1 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                                                  isR
                                                    ? "border-transparent text-white shadow"
                                                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                                )}
                                                style={isR ? { backgroundColor: "#111827" } : undefined}
                                              >
                                                {r.name}
                                                <span className="ml-2 text-xs font-normal opacity-70">
                                                  ({r.levels}L × {r.binsPerLevel}B)
                                                </span>
                                              </button>

                                              <div className="flex flex-col gap-1">
                                                <button
                                                  type="button"
                                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-gray-50"
                                                  onClick={() => setRenameOpen({ kind: "rack", id: r.id, value: r.name })}
                                                >
                                                  Rename
                                                </button>

                                                <button
                                                  type="button"
                                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold hover:bg-gray-50"
                                                  onClick={() => regenerateRackBins(r.id, r.levels, r.binsPerLevel)}
                                                  title="Regenerate bins (resets statuses)"
                                                >
                                                  Rebuild
                                                </button>

                                                <button
                                                  type="button"
                                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                                                  onClick={() => deleteRack(r.id)}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                    <div className="font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      Standard Code Format
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold">WH-ZONE-AISLE-RACK-Lxx-Byy</span>
                      <div className="mt-1 text-[11px] text-gray-600">
                        Example: <span className="font-semibold">WH-HYD-01-ZONE-SHIPPING-AISLE-02-RACK-02-L03-B07</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Seat map */}
                <div className="lg:col-span-8 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {selectedZone?.name ?? "—"} → {selectedAisle?.name ?? "—"} → {selectedRack?.name ?? "—"}
                      </h3>
                      <p className="text-xs text-gray-500">Click bin for drawer • Double click for quick status toggle</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={searchBin}
                        onChange={(e) => setSearchBin(e.target.value)}
                        placeholder="Search Bin code..."
                        className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                      <select
                        value={activeStatusFilter}
                        onChange={(e) => setActiveStatusFilter(e.target.value as any)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      >
                        <option value="">All Status</option>
                        <option value="Available">Available</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">Showing bins: {filteredCount}</div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    {!selectedRack ? (
                      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
                        No rack selected. Create/select a rack to view bins.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rackGrid.map((rowBins, idx) => {
                          const q = searchBin.trim().toLowerCase();
                          const filteredRow = rowBins.filter((b) => {
                            const okSearch = q ? b.code.toLowerCase().includes(q) : true;
                            const okStatus = activeStatusFilter ? b.status === activeStatusFilter : true;
                            return okSearch && okStatus;
                          });
                          if (filteredRow.length === 0) return null;

                          const rackLevels = selectedRack.levels;
                          const level = rackLevels - idx;

                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-10 text-xs font-semibold text-gray-600">L{pad2(level)}</div>

                              <div className="flex flex-wrap gap-2">
                                {filteredRow.map((b) => {
                                  const ctx: SelectedBinCtx = {
                                    zoneId: selectedZoneId,
                                    aisleId: selectedAisleId,
                                    rackId: selectedRackId,
                                    binId: b.id,
                                  };

                                  return (
                                    <button
                                      key={b.id}
                                      type="button"
                                      title={`${b.code} • ${b.status}`}
                                      onClick={() => openBinDrawer(ctx)}
                                      onDoubleClick={() => quickToggleBin(ctx)}
                                      className={classNames(
                                        "h-10 w-10 rounded-xl text-[10px] font-semibold text-gray-700 shadow-sm transition active:scale-95",
                                        statusStyle(b.status)
                                      )}
                                    >
                                      {b.position}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
                      <span className="font-semibold">Legend:</span>{" "}
                      <span className="ml-2 inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded border border-gray-300 bg-white" /> Available
                      </span>
                      <span className="ml-3 inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded border border-blue-300 bg-blue-100" /> Reserved
                      </span>
                      <span className="ml-3 inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded border border-red-300 bg-red-100" /> Occupied
                      </span>
                      <span className="ml-3 inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded border border-gray-300 bg-gray-200" /> Blocked
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BIN DRAWER */}
              {drawerOpen && (
                <div className="fixed inset-0 z-[999]">
                  <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
                  <div className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-white shadow-2xl">
                    <div
                      className="flex items-center justify-between px-4 py-3 text-white"
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                    >
                      <div>
                        <p className="text-sm font-semibold">Bin Details</p>
                        <p className="text-xs opacity-90">{drawerData?.b?.code ?? "—"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="rounded-lg bg-white/15 px-3 py-1 text-sm font-semibold hover:bg-white/25"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="h-[calc(100%-56px)] overflow-y-auto p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Ctx label="Zone" value={drawerData?.z?.name ?? "—"} />
                        <Ctx label="Aisle" value={drawerData?.a?.name ?? "—"} />
                        <Ctx label="Rack" value={drawerData?.r?.name ?? "—"} />
                        <Ctx
                          label="Level / Position"
                          value={`L${pad2(drawerData?.b?.level ?? 0)} / B${pad2(drawerData?.b?.position ?? 0)}`}
                        />
                      </div>

                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-900">QR Code</h4>
                        <p className="mt-1 text-xs text-gray-500">Scan to identify bin location.</p>
                        
                        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-4">
                          {drawerData?.b?.qrCode && (
                            <QRCodeCanvas
                              id={`qr-${drawerData.b.id}`}
                              value={drawerData.b.qrCode}
                              size={200}
                              level="H"
                              includeMargin={true}
                            />
                          )}
                          <p className="mt-2 text-xs text-gray-600 font-semibold">{drawerData?.b?.code}</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const qrElement = document.getElementById(`qr-${drawerData?.b?.id}`);
                            if (qrElement instanceof HTMLCanvasElement) {
                              const url = qrElement.toDataURL("image/png");
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `${drawerData?.b?.code}-qr.png`;
                              link.click();
                            }
                          }}
                          className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Download QR Code
                        </button>
                      </div>

                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-900">Status</h4>
                        <p className="mt-1 text-xs text-gray-500">Set current bin usage state.</p>

                        <div className="mt-3">
                          <label className={labelBase}>Bin Status</label>
                          <select
                            value={drawerStatus}
                            onChange={(e) => setDrawerStatus(e.target.value as BinStatus)}
                            className={classNames(inputBase, "mt-2")}
                          >
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Blocked">Blocked</option>
                          </select>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <MiniBtn onClick={() => setDrawerStatus("Available")} label="Mark Available" />
                            <MiniBtn onClick={() => setDrawerStatus("Reserved")} label="Reserve" />
                            <MiniBtn onClick={() => setDrawerStatus("Occupied")} label="Occupy" />
                            <MiniBtn onClick={() => setDrawerStatus("Blocked")} label="Block" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-900">Capacity</h4>
                        <p className="mt-1 text-xs text-gray-500">Optional planning fields.</p>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={labelBase}>Capacity (Units)</label>
                            <input
                              value={drawerCapacity}
                              onChange={(e) => setDrawerCapacity(e.target.value)}
                              placeholder="Ex: 100"
                              className={classNames(inputBase, "mt-2")}
                            />
                          </div>
                          <div>
                            <label className={labelBase}>Max Weight (Kg)</label>
                            <input
                              value={drawerMaxWeightKg}
                              onChange={(e) => setDrawerMaxWeightKg(e.target.value)}
                              placeholder="Ex: 500"
                              className={classNames(inputBase, "mt-2")}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-900">Notes</h4>
                        <textarea
                          value={drawerNotes}
                          onChange={(e) => setDrawerNotes(e.target.value)}
                          placeholder="Ex: Near emergency exit. Keep clear space."
                          className={classNames(inputBase, "mt-2 min-h-[110px] resize-y")}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pb-2">
                        <button
                          type="button"
                          onClick={closeDrawer}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={saveDrawerChanges}
                          className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow"
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                        >
                          Save Bin
                        </button>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                        <span className="font-semibold">Next upgrade:</span> SKU mapping, current stock qty, last movement logs.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADD ZONE MODAL */}
              {addZoneOpen && (
                <div className={modalOverlay}>
                  <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">Add Zone</div>
                        <div className="text-xs text-gray-500">Zone defines operational area: Receiving/QC/Shipping/Storage etc.</div>
                      </div>
                      <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setAddZoneOpen(false)}>
                        Close
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className={labelBase}>Zone Type</label>
                        <select
                          className={classNames(inputBase, "mt-2")}
                          value={newZoneType}
                          onChange={(e) => {
                            const t = e.target.value as ZoneType;
                            setNewZoneType(t);
                            setNewZoneName(`Zone-${t}`);
                          }}
                        >
                          <option value="Receiving">Receiving</option>
                          <option value="QC">QC</option>
                          <option value="Putaway">Putaway</option>
                          <option value="Picking">Picking</option>
                          <option value="Packing">Packing</option>
                          <option value="Shipping">Shipping</option>
                          <option value="Storage">Storage</option>
                          <option value="Returns">Returns</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelBase}>Zone Name</label>
                        <input className={classNames(inputBase, "mt-2")} value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} />
                        <div className="mt-1 text-xs text-gray-500">Tip: Name is used inside bin code.</div>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button className={outlineBtn} onClick={() => setAddZoneOpen(false)}>
                          Cancel
                        </button>
                        <button className={primaryBtn} style={{ backgroundColor: FORTUNA_PRIMARY_RED }} onClick={addZone}>
                          Create Zone
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADD AISLE MODAL */}
              {addAisleOpen && (
                <div className={modalOverlay}>
                  <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">Add Aisle</div>
                        <div className="text-xs text-gray-500">Aisle is a physical row/corridor inside a Zone.</div>
                      </div>
                      <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setAddAisleOpen(false)}>
                        Close
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className={labelBase}>Aisle Name</label>
                        <input className={classNames(inputBase, "mt-2")} value={newAisleName} onChange={(e) => setNewAisleName(e.target.value)} />
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button className={outlineBtn} onClick={() => setAddAisleOpen(false)}>
                          Cancel
                        </button>
                        <button className={primaryBtn} style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} onClick={addAisle}>
                          Create Aisle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADD RACK MODAL */}
              {addRackOpen && (
                <div className={modalOverlay}>
                  <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">Add Rack</div>
                        <div className="text-xs text-gray-500">Define levels and bins per level. System auto-generates bin codes.</div>
                      </div>
                      <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setAddRackOpen(false)}>
                        Close
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className={labelBase}>Rack Name</label>
                        <input className={classNames(inputBase, "mt-2")} value={newRackName} onChange={(e) => setNewRackName(e.target.value)} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelBase}>Levels (L)</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            className={classNames(inputBase, "mt-2")}
                            value={newRackLevels}
                            onChange={(e) => setNewRackLevels(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className={labelBase}>Bins per Level (B)</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            className={classNames(inputBase, "mt-2")}
                            value={newRackBinsPerLevel}
                            onChange={(e) => setNewRackBinsPerLevel(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                        <span className="font-semibold">Will create:</span>{" "}
                        {Math.max(1, Number(newRackLevels) || 1) * Math.max(1, Number(newRackBinsPerLevel) || 1)} bins
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button className={outlineBtn} onClick={() => setAddRackOpen(false)}>
                          Cancel
                        </button>
                        <button className={primaryBtn} style={{ backgroundColor: FORTUNA_PRIMARY_RED }} onClick={addRack}>
                          Create Rack
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RENAME MODAL */}
              {renameOpen && (
                <div className={modalOverlay}>
                  <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">Rename {renameOpen.kind}</div>
                        <div className="text-xs text-gray-500">Renaming updates bin codes for consistency.</div>
                      </div>
                      <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setRenameOpen(null)}>
                        Close
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className={labelBase}>New Name</label>
                        <input
                          className={classNames(inputBase, "mt-2")}
                          value={renameOpen.value}
                          onChange={(e) => setRenameOpen({ ...renameOpen, value: e.target.value })}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button className={outlineBtn} onClick={() => setRenameOpen(null)}>
                          Cancel
                        </button>
                        <button className={primaryBtn} style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} onClick={renameEntity}>
                          Save Name
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      {!isView && (
  <div className="flex flex-wrap items-center justify-end gap-2">
    <button type="button" className={outlineBtn} onClick={onReset}>
      Reset
    </button>

    <button
      type="button"
      className={primaryBtn}
      style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
      onClick={onSave}
    >
      Save Warehouse
    </button>
  </div>
)}
    </div>
  );
}

/** Small UI helpers */
function Ctx({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function MiniBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95"
    >
      {label}
    </button>
  );
}
