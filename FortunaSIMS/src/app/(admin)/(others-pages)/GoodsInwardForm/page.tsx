"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";

/** Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Routes */
const ROUTES = {
  goodsInwardList: "/goods-inward",
  grnCreate: "/GRN",   // ✅ correct
};


/** Types */
type GIStatus =
  | "Live"
  | "Inward Assigned"
  | "Inward In-Progress"
  | "Inwarded"
  | "QC Pending"
  | "QC Passed"
  | "QC Failed"
  | "Converted to GRN"
  | "Cancelled";

type ReceiptType = "Full" | "Partial";
type InwardSource = "Issued PO" | "Without PO (Manual)" | "Transfer In";
type VehicleType = "Truck" | "Tempo" | "Courier" | "Other";
type AttachmentType = "DC" | "Invoice" | "Photo" | "E-Way Bill" | "Other";
type OverAction =
  | "Quarantine"
  | "Return to Vendor"
  | "Adjust in Next PO"
  | "Accept as Free Qty";

type ReceiverRole = "Receiver" | "QC Inspector" | "Supervisor";

type Receiver = {
  id: string;
  name: string;
  role: ReceiverRole;
  phone: string;
  active: boolean;
  receivingCount: number; // demo
};

type PORef = {
  poNo: string;
  poDate?: string;
  vendorName?: string;
  vendorCode?: string;
};

type DockDoor = "D1" | "D2" | "D3" | "D4";
type InboundMode = "ASN/Pre-Receiving" | "Direct (No ASN)";
type PutawayStatus = "Not Created" | "Created" | "In Progress" | "Completed";

type InboundShipment = {
  id: string;
  shipmentNo: string;
  mode: InboundMode;
  appointmentNo?: string;

  gateEntryNo: string;
  vehicleType: VehicleType;
  vehicleNo: string;

  transporterName?: string;
  driverName?: string;
  driverMobile?: string;
  lrNo?: string;
  sealNo?: string;

  dockDoor?: DockDoor;
  stagingArea: string;

  arrivalTime?: string;

  /** One truck can carry multiple POs */
  linkedPOs: string[];

  status: "Planned" | "Arrived" | "At Dock" | "Receiving" | "Receiving Done" | "Closed";
};

type GIItem = {
  id: string;
  lineNo: number;
  sku: string;
  description: string;
  uom: string;

  poQty?: number;
  expectedQty: number;

  receivedQty: number; // final (supervisor sync)
  damageQty: number;

  shortQty: number; // computed
  overQty: number; // computed
  overAction: OverAction;

  qcRequired: boolean;
  qcStatus: "Pending" | "Passed" | "Failed";
  qcRemarks: string;

  mobileReceivedQty: number; // computed sum of logs (live)
};

type ReceivingLog = {
  id: string;
  giNo: string;

  shipmentId: string;
  shipmentNo: string;

  poNo: string;

  receiverId: string;
  receiverName: string;

  itemId: string;
  sku: string;
  qty: number;

  lpnId: string;
  lpnNo: string;

  receivedAtISO: string;
  device: "Mobile" | "Web";
};

type LPN = {
  id: string;
  lpnNo: string;

  shipmentId: string;
  shipmentNo: string;

  poNo: string;
  itemId: string;
  sku: string;
  qty: number;

  qcHold: boolean;

  fromBin: string; // staging / QC_HOLD
  toBin?: string; // target bin
  putawayStatus: PutawayStatus;
};

type PutawayTask = {
  id: string;
  lpnId: string;
  lpnNo: string;
  sku: string;
  qty: number;

  fromBin: string;
  toBin: string;

  status: "Open" | "Confirmed";
  confirmedAtISO?: string;
};

/** Tabs */
type TabKey =
  | "basic"
  | "pos"
  | "shipments"
  | "assignment"
  | "items"
  | "mobile"
  | "qc"
  | "putaway"
  | "attachments"
  | "status";

const tabs: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic" },
  { key: "pos", label: "POs" },
  { key: "shipments", label: "Shipments & Dock" },
  { key: "assignment", label: "Assignment" },
  { key: "items", label: "Item Plan" },
  { key: "mobile", label: "Mobile Receiving" },
  { key: "qc", label: "QC" },
  { key: "putaway", label: "Putaway" },
  { key: "attachments", label: "Attachments" },
  { key: "status", label: "Status & Convert" },
];

/** Helpers */
function cn(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}
function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}
function safeNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}
function formatDateISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function nowISO() {
  return new Date().toISOString();
}

/** Prefill handoff key */
const LS_PREFILL_TO_GRN_KEY = "FORTUNA_GRN_PREFILL_FROM_GI_V6";

/** UI tokens */
const inputBase =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:border-gray-800 dark:bg-gray-950 dark:text-white";

const labelBase = "text-sm font-semibold text-gray-700 dark:text-gray-200";
const helperBase = "text-xs text-gray-500 dark:text-gray-400";

type ModalState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      onConfirm: () => void;
    };

export default function GoodsInwardCreatePage() {
  const router = useRouter();

  /** Workflow */
  const [status, setStatus] = useState<GIStatus>("Live");
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  /** Toast */
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  /** Modal (for unlink confirm + others) */
  const [modal, setModal] = useState<ModalState>({ open: false });

  /** Basic */
  const [giNo, setGiNo] = useState("GI-2026-0010");
  const [giDate, setGiDate] = useState(formatDateISO());
  const [inwardSource, setInwardSource] = useState<InwardSource>("Issued PO");
  const [receiptType, setReceiptType] = useState<ReceiptType>("Full");
  const [warehouse, setWarehouse] = useState("WH-002");
  const [gateEntryNo, setGateEntryNo] = useState("GE-2026-0501");
  const [receivedBy] = useState("Store User");

  /** Header vehicle (reference only; shipments hold actual) */
  const [vehicleType, setVehicleType] = useState<VehicleType>("Truck");
  const [vehicleNo, setVehicleNo] = useState("AP39NN9197");
  const [arrivalTime, setArrivalTime] = useState("10:45");

  /** Multi-PO */
  const [poRefs, setPoRefs] = useState<PORef[]>([
    {
      poNo: "PO-2026-0121",
      poDate: "2026-02-10",
      vendorName: "Sri Lakshmi Suppliers",
      vendorCode: "V-001",
    },
  ]);

  /** Common docs */
  const [dcNo, setDcNo] = useState("DC-8871");
  const [invoiceRef, setInvoiceRef] = useState("INV-5521");
  const [ewayBill, setEwayBill] = useState("");

  /** Shipments */
  const [shipments, setShipments] = useState<InboundShipment[]>([
    {
      id: uid("shp"),
      shipmentNo: "SHP-2026-0001",
      mode: "Direct (No ASN)",
      appointmentNo: "",
      gateEntryNo: "GE-2026-0501",
      vehicleType: "Truck",
      vehicleNo: "AP39NN9197",
      dockDoor: "D1",
      stagingArea: "STG-D1",
      arrivalTime: "10:45",
      linkedPOs: ["PO-2026-0121"],
      status: "Arrived",
    },
  ]);

  /** Receivers */
  const [receivers, setReceivers] = useState<Receiver[]>([
    { id: "U-101", name: "Ravi", role: "Receiver", phone: "9000000001", active: true, receivingCount: 12 },
    { id: "U-102", name: "Aparna", role: "Supervisor", phone: "9000000002", active: true, receivingCount: 7 },
    { id: "U-103", name: "Kiran", role: "Receiver", phone: "9000000003", active: true, receivingCount: 3 },
    { id: "U-104", name: "Divya", role: "QC Inspector", phone: "9000000004", active: true, receivingCount: 15 },
    { id: "U-105", name: "Nikhil", role: "Receiver", phone: "9000000005", active: true, receivingCount: 6 },
    { id: "U-106", name: "Meena", role: "Receiver", phone: "9000000006", active: true, receivingCount: 4 },
    { id: "U-107", name: "Suresh", role: "Supervisor", phone: "9000000007", active: true, receivingCount: 9 },
    { id: "U-108", name: "Pooja", role: "Receiver", phone: "9000000008", active: true, receivingCount: 2 },
  ]);
  const [assignedReceiverIds, setAssignedReceiverIds] = useState<string[]>(["U-101", "U-103"]);

  const assignedReceivers = useMemo(
    () => receivers.filter((r) => assignedReceiverIds.includes(r.id)),
    [receivers, assignedReceiverIds]
  );

  /** Items */
  const [items, setItems] = useState<GIItem[]>([
    {
      id: uid("it"),
      lineNo: 1,
      sku: "SKU-BOX-5PLY",
      description: "Corrugated Box (5-ply)",
      uom: "Nos",
      poQty: 200,
      expectedQty: 200,
      receivedQty: 0,
      damageQty: 0,
      shortQty: 0,
      overQty: 0,
      overAction: "Quarantine",
      qcRequired: true,
      qcStatus: "Pending",
      qcRemarks: "",
      mobileReceivedQty: 0,
    },
    {
      id: uid("it"),
      lineNo: 2,
      sku: "SKU-BUBBLE-L",
      description: "Bubble Wrap Roll (Large)",
      uom: "Box",
      poQty: 20,
      expectedQty: 20,
      receivedQty: 0,
      damageQty: 0,
      shortQty: 0,
      overQty: 0,
      overAction: "Quarantine",
      qcRequired: false,
      qcStatus: "Pending",
      qcRemarks: "",
      mobileReceivedQty: 0,
    },
  ]);

  /** Live logs, LPNs, Putaway */
  const [receivingLogs, setReceivingLogs] = useState<ReceivingLog[]>([]);
  const [lpns, setLpns] = useState<LPN[]>([]);
  const [putawayTasks, setPutawayTasks] = useState<PutawayTask[]>([]);

  /** Mobile UI */
  const [mobileSelectedReceiverId, setMobileSelectedReceiverId] = useState("U-101");
  const [mobileShipmentId, setMobileShipmentId] = useState<string>(() => shipments[0]?.id ?? "");
  const [mobilePoNo, setMobilePoNo] = useState<string>(() => poRefs[0]?.poNo ?? "");
  const [mobileItemId, setMobileItemId] = useState<string>(() => items[0]?.id ?? "");
  const [mobileQty, setMobileQty] = useState<number>(0);

  /** Attachments + remarks */
  const [attachments, setAttachments] = useState<{ id: string; type: AttachmentType; fileName: string }[]>([
    { id: uid("att"), type: "DC", fileName: "dc_scan.pdf" },
    { id: uid("att"), type: "Photo", fileName: "truck_unload.jpg" },
  ]);
  const [internalRemarks, setInternalRemarks] = useState("");

  /** QC */
  const [qcFailReason, setQcFailReason] = useState("");

  /** UI */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Locks */
  const lockedAfterInward = status !== "Live" && status !== "Inward Assigned" && status !== "Inward In-Progress";
  const isConverted = status === "Converted to GRN";

  /** Live mobile qty per item from logs */
  useEffect(() => {
    const byItem: Record<string, number> = {};
    receivingLogs.forEach((l) => {
      byItem[l.itemId] = (byItem[l.itemId] ?? 0) + safeNum(l.qty);
    });
    setItems((prev) => prev.map((x) => ({ ...x, mobileReceivedQty: byItem[x.id] ?? 0 })));
  }, [receivingLogs]);

  /** Totals */
  const totals = useMemo(() => {
    const expected = items.reduce((s, x) => s + safeNum(x.expectedQty), 0);
    const finalReceived = items.reduce((s, x) => s + safeNum(x.receivedQty), 0);
    const mobile = items.reduce((s, x) => s + safeNum(x.mobileReceivedQty), 0);
    const qcRequired = items.filter((x) => x.qcRequired).length;
    return { expected, finalReceived, mobile, qcRequired };
  }, [items]);

  /** Suggested bin (demo rule) */
  const suggestBin = (sku: string) => {
    const s = (sku || "").toUpperCase();
    if (s.includes("COLD")) return "Z-COLD-01-01";
    if (s.includes("HAZ")) return "Z-HAZ-01-01";
    return "Z-A-01-01";
  };

  /** Validation */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!giDate) e.giDate = "GI Date required";
    if (!warehouse) e.warehouse = "Warehouse required";
    if (!gateEntryNo.trim()) e.gateEntryNo = "Gate Entry required";

    if (!vehicleNo.trim()) e.vehicleNo = "Vehicle No required (header)";
    if (!vehicleType) e.vehicleType = "Vehicle type required";

    if (!assignedReceiverIds.length) e.assignment = "Assign at least 1 receiver";

    if (inwardSource === "Issued PO") {
      const hasPo = poRefs.some((p) => (p.poNo || "").trim());
      if (!hasPo) e.poNo = "At least 1 PO is required";
    }

    if (!shipments.length) e.shipments = "At least 1 shipment required";
    shipments.forEach((s) => {
      if (!s.gateEntryNo.trim()) e[`shp_gate_${s.id}`] = "Gate Entry required";
      if (!s.vehicleNo.trim()) e[`shp_vehicle_${s.id}`] = "Vehicle No required";
      if (!s.dockDoor) e[`shp_dock_${s.id}`] = "Dock required";
      if (!s.stagingArea.trim()) e[`shp_stage_${s.id}`] = "Staging area required";
      if (inwardSource === "Issued PO" && (!s.linkedPOs || s.linkedPOs.length === 0))
        e[`shp_pos_${s.id}`] = "Link at least 1 PO to this shipment";
    });

    if (!items.length) e.items = "At least 1 item required";
    items.forEach((it) => {
      if (!it.sku.trim()) e[`sku_${it.id}`] = "SKU required";
      if (safeNum(it.expectedQty) < 0) e[`expected_${it.id}`] = "Expected qty invalid";
      if (safeNum(it.receivedQty) < 0) e[`received_${it.id}`] = "Received qty invalid";
      if (it.overQty > 0 && !it.overAction) e[`overAction_${it.id}`] = "Select over action";
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** CRUD */
  const updateItem = (id: string, patch: Partial<GIItem>) => {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const next: GIItem = { ...x, ...patch };
        const expected = safeNum(next.expectedQty);
        const received = safeNum(next.receivedQty);
        next.overQty = Math.max(0, received - expected);
        next.shortQty = Math.max(0, expected - received);
        const damage = safeNum(next.damageQty);
        next.damageQty = Math.max(0, Math.min(damage, received));
        if (!next.qcRequired) {
          next.qcStatus = "Pending";
          next.qcRemarks = "";
        }
        return next;
      })
    );
  };

  const addItemRow = () => {
    if (lockedAfterInward) return;
    setItems((p) => [
      ...p,
      {
        id: uid("it"),
        lineNo: p.length + 1,
        sku: "",
        description: "",
        uom: "Nos",
        poQty: inwardSource === "Issued PO" ? 0 : undefined,
        expectedQty: 0,
        receivedQty: 0,
        damageQty: 0,
        shortQty: 0,
        overQty: 0,
        overAction: "Quarantine",
        qcRequired: false,
        qcStatus: "Pending",
        qcRemarks: "",
        mobileReceivedQty: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (lockedAfterInward) return;
    setModal({
      open: true,
      title: "Remove item line?",
      message: "This will delete the item line from the plan.",
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: () => {
        setModal({ open: false });
        setItems((p) => p.filter((x) => x.id !== id).map((x, idx) => ({ ...x, lineNo: idx + 1 })));
        showToast("Item line removed");
      },
    });
  };

  const addPO = () => {
    if (inwardSource !== "Issued PO") {
      showToast("POs are optional for this Inward Source.");
      return;
    }
    if (lockedAfterInward) return;
    setPoRefs((p) => [...p, { poNo: "", poDate: "", vendorName: "", vendorCode: "" }]);
    showToast("New PO row added");
  };
  const updatePO = (idx: number, patch: Partial<PORef>) =>
    setPoRefs((p) => p.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const removePO = (idx: number) => {
    if (lockedAfterInward) return;

    const poNo = (poRefs[idx]?.poNo || "").trim();
    if (!poNo) {
      setPoRefs((p) => p.filter((_, i) => i !== idx));
      showToast("PO row removed");
      return;
    }

    // Prevent removing if linked to any shipment
    const linkedInAnyShipment = shipments.some((s) => s.linkedPOs.includes(poNo));
    if (linkedInAnyShipment) {
      showToast(`Cannot remove ${poNo}. Unlink it from Shipments first.`);
      return;
    }

    setModal({
      open: true,
      title: "Remove PO?",
      message: `Remove ${poNo} from this GI?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: () => {
        setModal({ open: false });
        setPoRefs((p) => p.filter((_, i) => i !== idx));
        showToast(`${poNo} removed`);
      },
    });
  };

  const addShipment = () => {
    if (lockedAfterInward) return;
    setShipments((p) => [
      ...p,
      {
        id: uid("shp"),
        shipmentNo: `SHP-2026-${String(p.length + 1).padStart(4, "0")}`,
        mode: "Direct (No ASN)",
        appointmentNo: "",
        gateEntryNo,
        vehicleType,
        vehicleNo: "",
        dockDoor: "D1",
        stagingArea: "STG-D1",
        arrivalTime: "",
        linkedPOs: [],
        status: "Planned",
      },
    ]);
    showToast("New shipment created");
  };

  const updateShipment = (id: string, patch: Partial<InboundShipment>) => {
    setShipments((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeShipment = (id: string) => {
    if (lockedAfterInward) return;
    if (shipments.length === 1) return showToast("At least 1 shipment is required");
    setModal({
      open: true,
      title: "Remove shipment?",
      message: "This will remove the shipment record from this GI.",
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: () => {
        setModal({ open: false });
        setShipments((p) => p.filter((s) => s.id !== id));
        showToast("Shipment removed");
      },
    });
  };

  const toggleReceiverAssign = (id: string) => {
    setAssignedReceiverIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  /** NEXT-LEVEL: Shipment ↔ PO Linking Rules + Actions */
  const canEditPoLinksForShipment = (s: InboundShipment) => {
    if (lockedAfterInward) return { ok: false, reason: "Inbound locked (already inwarded/QC/etc)." };
    if (inwardSource !== "Issued PO") return { ok: false, reason: "Inward Source is not Issued PO." };

    // allow linking only in Planned / Arrived (before dock ops)
    if (s.status !== "Planned" && s.status !== "Arrived") {
      return { ok: false, reason: `Cannot change PO links when shipment status is "${s.status}".` };
    }
    return { ok: true as const, reason: "" };
  };

  const linkPoToShipment = (shipmentId: string, poNo: string) => {
    const s = shipments.find((x) => x.id === shipmentId);
    if (!s) return;

    const rule = canEditPoLinksForShipment(s);
    if (!rule.ok) return showToast(rule.reason);

    if (s.linkedPOs.includes(poNo)) return;

    updateShipment(s.id, { linkedPOs: [...s.linkedPOs, poNo] });
    showToast(`${poNo} linked to ${s.shipmentNo}`);
  };

  const unlinkPoFromShipment = (shipmentId: string, poNo: string) => {
    const s = shipments.find((x) => x.id === shipmentId);
    if (!s) return;

    const rule = canEditPoLinksForShipment(s);
    if (!rule.ok) return showToast(rule.reason);

    // extra realistic check: prevent unlink if logs exist for this shipment+PO
    const hasReceivingForPo = receivingLogs.some(
      (l) => l.shipmentId === s.id && (l.poNo || "").trim() === poNo
    );
    if (hasReceivingForPo) {
      return showToast(`Cannot unlink ${poNo}. Receiving logs already exist for this shipment.`);
    }

    setModal({
      open: true,
      title: "Unlink PO?",
      message: `Unlink ${poNo} from ${s.shipmentNo}?`,
      confirmText: "Unlink",
      cancelText: "Cancel",
      onConfirm: () => {
        setModal({ open: false });
        const next = s.linkedPOs.filter((x) => x !== poNo);
        updateShipment(s.id, { linkedPOs: next });
        showToast(`${poNo} unlinked from ${s.shipmentNo}`);
      },
    });
  };

  const handleTogglePoLink = (shipmentId: string, poNo: string) => {
    const s = shipments.find((x) => x.id === shipmentId);
    if (!s) return;
    const checked = s.linkedPOs.includes(poNo);
    if (checked) unlinkPoFromShipment(shipmentId, poNo);
    else linkPoToShipment(shipmentId, poNo);
  };

  /** Start live inbound */
  const assignAndStartInward = () => {
    if (!validate()) {
      setActiveTab("basic");
      showToast("Fix errors (PO/Shipment/Vehicle/Assignment) before starting inbound.");
      return;
    }
    setStatus("Inward Assigned");
    setActiveTab("mobile");
    showToast("Inbound assigned. Go to Mobile Receiving.");
  };

  /** Mobile receive: creates LPN + log (live) */
  const mobileReceive = () => {
    if (!assignedReceiverIds.includes(mobileSelectedReceiverId)) return showToast("Receiver not assigned.");

    const shp = shipments.find((x) => x.id === mobileShipmentId);
    if (!shp) return showToast("Select shipment.");

    const poNo = inwardSource === "Issued PO" ? (mobilePoNo || "").trim() : "";
    if (inwardSource === "Issued PO") {
      if (!poNo) return showToast("Select PO.");
      if (!shp.linkedPOs.includes(poNo)) return showToast("Selected PO is not linked to this shipment.");
      // realistic: do not receive if shipment not at dock or receiving
      if (shp.status !== "Arrived" && shp.status !== "At Dock" && shp.status !== "Receiving") {
        return showToast(`Cannot receive. Shipment status is "${shp.status}". Move it to Arrived/At Dock/Receiving.`);
      }
    }

    const it = items.find((x) => x.id === mobileItemId);
    const r = receivers.find((x) => x.id === mobileSelectedReceiverId);
    if (!it || !r) return;

    const qty = safeNum(mobileQty);
    if (qty <= 0) return showToast("Enter valid qty.");

    const lpnId = uid("lpn");
    const lpnNo = `LPN-${new Date().getFullYear()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

    const qcHold = Boolean(it.qcRequired);
    const fromBin = qcHold ? "QC_HOLD" : shp.stagingArea || "STG-GEN";
    const toBin = qcHold ? "QC_HOLD" : suggestBin(it.sku);

    const newLpn: LPN = {
      id: lpnId,
      lpnNo,
      shipmentId: shp.id,
      shipmentNo: shp.shipmentNo,
      poNo,
      itemId: it.id,
      sku: it.sku,
      qty,
      qcHold,
      fromBin,
      toBin,
      putawayStatus: "Not Created",
    };

    const log: ReceivingLog = {
      id: uid("log"),
      giNo,
      shipmentId: shp.id,
      shipmentNo: shp.shipmentNo,
      poNo,
      receiverId: r.id,
      receiverName: r.name,
      itemId: it.id,
      sku: it.sku,
      qty,
      lpnId,
      lpnNo,
      receivedAtISO: nowISO(),
      device: "Mobile",
    };

    setLpns((p) => [newLpn, ...p]);
    setReceivingLogs((p) => [log, ...p]);

    setReceivers((p) => p.map((x) => (x.id === r.id ? { ...x, receivingCount: x.receivingCount + 1 } : x)));

    // next-level: auto move shipment status to "Receiving"
    if (shp.status !== "Receiving") updateShipment(shp.id, { status: "Receiving" });

    setStatus((s) => (s === "Live" || s === "Inward Assigned" ? "Inward In-Progress" : s));

    setMobileQty(0);
    showToast(`Received ${qty} • ${it.sku} • ${lpnNo}`);
  };

  /** Supervisor finalize: sync mobile totals into final received */
  const syncMobileToFinal = () => {
    setModal({
      open: true,
      title: "Supervisor Sync?",
      message: "Sync live mobile totals to Final Received Qty (demo supervisor action).",
      confirmText: "Sync",
      cancelText: "Cancel",
      onConfirm: () => {
        setModal({ open: false });
        const byItem: Record<string, number> = {};
        receivingLogs.forEach((l) => {
          byItem[l.itemId] = (byItem[l.itemId] ?? 0) + safeNum(l.qty);
        });

        setItems((p) =>
          p.map((x) => {
            const received = byItem[x.id] ?? 0;
            const expected = safeNum(x.expectedQty);
            return {
              ...x,
              receivedQty: received,
              overQty: Math.max(0, received - expected),
              shortQty: Math.max(0, expected - received),
            };
          })
        );

        setShipments((p) =>
          p.map((s) => (s.status === "Receiving" ? { ...s, status: "Receiving Done" } : s))
        );

        showToast("Final received updated ✅");
      },
    });
  };

  const markInwarded = () => {
    if (!validate()) {
      setActiveTab("basic");
      showToast("Fix validation errors before Mark Inwarded.");
      return;
    }
    setModal({
      open: true,
      title: "Mark Inwarded?",
      message: "Confirm inwarded? (Gate receipt completed)",
      confirmText: "Confirm",
      cancelText: "Cancel",
      onConfirm: () => {
        setModal({ open: false });
        setStatus("Inwarded");
        setActiveTab("items");
        showToast("Status updated: Inwarded");
      },
    });
  };

  /** QC */
  const sendToQC = () => {
    if (status === "Live") return showToast("Start receiving first.");
    const hasQC = items.some((x) => x.qcRequired);
    if (!hasQC) return showToast("No QC required lines. You can convert to GRN.");
    setStatus("QC Pending");
    setActiveTab("qc");
    showToast("QC started");
  };

  const qcDecision = (decision: "Passed" | "Failed") => {
    const hasQC = items.some((x) => x.qcRequired);
    if (!hasQC) return showToast("No QC required lines.");

    const remark = decision === "Failed" ? (qcFailReason.trim() || "QC Failed") : "QC Passed";
    setItems((p) => p.map((x) => (x.qcRequired ? { ...x, qcStatus: decision, qcRemarks: remark } : x)));
    setStatus(decision === "Passed" ? "QC Passed" : "QC Failed");
    setActiveTab("status");
    showToast(`QC ${decision}`);
  };

  /** Putaway */
  const generatePutawayTasks = () => {
    const pending = lpns.filter((l) => l.putawayStatus === "Not Created" && !l.qcHold);
    if (!pending.length) {
      return showToast("No LPNs pending for putaway (QC-hold LPNs are excluded).");
    }

    const tasks: PutawayTask[] = pending.map((l) => ({
      id: uid("pt"),
      lpnId: l.id,
      lpnNo: l.lpnNo,
      sku: l.sku,
      qty: l.qty,
      fromBin: l.fromBin,
      toBin: l.toBin || suggestBin(l.sku),
      status: "Open",
    }));

    setPutawayTasks((p) => [...tasks, ...p]);
    setLpns((p) =>
      p.map((l) =>
        l.putawayStatus === "Not Created" && !l.qcHold ? { ...l, putawayStatus: "Created" } : l
      )
    );
    showToast(`Putaway tasks created ✅ (${tasks.length})`);
  };

  const confirmPutaway = (taskId: string) => {
    const t = putawayTasks.find((x) => x.id === taskId);
    if (!t) return;

    setModal({
      open: true,
      title: "Confirm Putaway?",
      message: `Confirm ${t.lpnNo} moved to ${t.toBin}?`,
      confirmText: "Confirm",
      cancelText: "Cancel",
      onConfirm: () => {
        setModal({ open: false });
        setPutawayTasks((p) =>
          p.map((x) => (x.id === taskId ? { ...x, status: "Confirmed", confirmedAtISO: nowISO() } : x))
        );
        setLpns((p) =>
          p.map((l) => (l.id === t.lpnId ? { ...l, fromBin: t.toBin, putawayStatus: "Completed" } : l))
        );
        showToast("Putaway confirmed ✅");
      },
    });
  };

  /** Convert gating */
  const canConvertToGRN = useMemo(() => {
    if (status === "Converted to GRN") return false;
    if (status !== "Inwarded" && status !== "QC Passed") return false;

    const qcOk = items.every((x) => (x.qcRequired ? x.qcStatus === "Passed" : true));
    const overOk = items.every((x) => (x.overQty > 0 ? Boolean(x.overAction) : true));
    return qcOk && overOk;
  }, [status, items]);

  const convertToGRN = () => {
    if (!canConvertToGRN) {
      showToast("Cannot convert. Ensure: Inwarded + QC Passed(if required) + Over action selected.");
      return;
    }

    const payload = {
      source: "GOODS_INWARD",
      giNo,
      giDate,
      inwardSource,
      receiptType,
      warehouse,
      gateEntryNo,
      headerVehicle: { vehicleType, vehicleNo, arrivalTime },
      pos: inwardSource === "Issued PO" ? poRefs : [],
      docs: { dcNo, invoiceRef, ewayBill },
      shipments,
      assignedReceivers: assignedReceivers.map((r) => ({ id: r.id, name: r.name, role: r.role, phone: r.phone })),
      items,
      receivingLogs,
      lpns,
      putawayTasks,
      attachments,
      internalRemarks,
      convertedOn: nowISO(),
    };

    localStorage.setItem(LS_PREFILL_TO_GRN_KEY, JSON.stringify(payload));
    setStatus("Converted to GRN");
    showToast("Converted ✅ Redirecting to GRN Create...");
    setTimeout(() => router.push(ROUTES.grnCreate), 600);
  };

  const cancelGI = () => {
    setModal({
      open: true,
      title: "Cancel this Goods Inward?",
      message: "This will mark the GI as Cancelled.",
      confirmText: "Cancel GI",
      cancelText: "Back",
      onConfirm: () => {
        setModal({ open: false });
        setStatus("Cancelled");
        setActiveTab("status");
        showToast("GI Cancelled");
      },
    });
  };

  /** CSV export logs */
  const exportLogsCSV = () => {
    if (!receivingLogs.length) return showToast("No logs to export.");
    const header = ["GI", "Shipment", "PO", "Receiver", "SKU", "Qty", "LPN", "ReceivedAt"];
    const rows = receivingLogs.map((l) =>
      [l.giNo, l.shipmentNo, l.poNo || "-", l.receiverName, l.sku, l.qty, l.lpnNo, l.receivedAtISO]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gi_logs_${giNo}.csv`;
    a.click();
    showToast("Logs exported ✅");
  };

  /** Status pill */
  const statusPill = (s: GIStatus) => {
    const map: Record<GIStatus, string> = {
      Live: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      "Inward Assigned": "bg-blue-100 text-blue-700",
      "Inward In-Progress": "bg-amber-100 text-amber-800",
      Inwarded: "bg-blue-100 text-blue-700",
      "QC Pending": "bg-amber-100 text-amber-800",
      "QC Passed": "bg-green-100 text-green-700",
      "QC Failed": "bg-rose-100 text-rose-700",
      "Converted to GRN": "bg-purple-100 text-purple-700",
      Cancelled: "bg-gray-200 text-gray-700",
    };
    return cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", map[s]);
  };

  const tabBtn = (isActive: boolean) =>
    cn(
      "relative rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95",
      isActive
        ? "text-white shadow"
        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
    );

  const topActionBtn =
    "rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-95 transition";

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Goods Inward" />

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Goods Inward (Live Receiving)
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Live inbound: receivers scan → logs/LPNs update instantly. No draft.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={statusPill(status)}>{status}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                GI: <span className="font-semibold">{giNo}</span> • Gate:{" "}
                <span className="font-semibold">{gateEntryNo}</span> • Vehicle:{" "}
                <span className="font-semibold">{vehicleNo}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={assignAndStartInward}
              className={cn(topActionBtn, isConverted && "opacity-60 cursor-not-allowed")}
              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
              disabled={isConverted}
            >
              Assign & Start
            </button>

            <button
              onClick={markInwarded}
              className={cn(topActionBtn, lockedAfterInward && "opacity-60 cursor-not-allowed")}
              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
              disabled={lockedAfterInward || isConverted}
            >
              Mark Inwarded
            </button>

            <button
              onClick={cancelGI}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold border shadow-sm active:scale-95 transition",
                "border-rose-200 text-rose-700 bg-white hover:bg-rose-50"
              )}
              disabled={isConverted}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <KpiCard label="Expected Qty" value={totals.expected} />
          <KpiCard label="Live Mobile Qty" value={totals.mobile} tone="blue" />
          <KpiCard label="Final Received" value={totals.finalReceived} tone="blue" />
          <KpiCard label="QC Lines" value={totals.qcRequired} tone="blue" />
        </div>

        {(errors.poNo || errors.shipments || errors.assignment) && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 space-y-1">
            {errors.poNo && <div>• {errors.poNo}</div>}
            {errors.shipments && <div>• {errors.shipments}</div>}
            {errors.assignment && <div>• {errors.assignment}</div>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={tabBtn(isActive)}
                style={isActive ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
              >
                {t.label}
                {isActive && (
                  <span
                    className="absolute -bottom-[7px] left-4 right-4 h-[3px] rounded-full"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* BASIC */}
          {activeTab === "basic" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelBase}>GI Number</label>
                  <input
                    value={giNo}
                    onChange={(e) => setGiNo(e.target.value)}
                    disabled={lockedAfterInward}
                    className={cn(inputBase, "mt-2", lockedAfterInward && "opacity-70")}
                  />
                </div>

                <div>
                  <label className={labelBase}>GI Date</label>
                  <input
                    type="date"
                    value={giDate}
                    onChange={(e) => setGiDate(e.target.value)}
                    disabled={lockedAfterInward}
                    className={cn(
                      inputBase,
                      "mt-2",
                      lockedAfterInward && "opacity-70",
                      errors.giDate && "border-rose-400"
                    )}
                  />
                  {errors.giDate && <p className="mt-1 text-xs text-rose-600">{errors.giDate}</p>}
                </div>

                <div>
                  <label className={labelBase}>Receipt Type</label>
                  <select
                    value={receiptType}
                    onChange={(e) => setReceiptType(e.target.value as ReceiptType)}
                    disabled={lockedAfterInward}
                    className={cn(inputBase, "mt-2", lockedAfterInward && "opacity-70")}
                  >
                    <option value="Full">Full</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelBase}>Inward Source</label>
                  <select
                    value={inwardSource}
                    onChange={(e) => setInwardSource(e.target.value as InwardSource)}
                    disabled={lockedAfterInward}
                    className={cn(inputBase, "mt-2", lockedAfterInward && "opacity-70")}
                  >
                    <option value="Issued PO">Issued PO</option>
                    <option value="Without PO (Manual)">Without PO (Manual)</option>
                    <option value="Transfer In">Transfer In</option>
                  </select>
                </div>

                <div>
                  <label className={labelBase}>Warehouse</label>
                  <select
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    disabled={lockedAfterInward}
                    className={cn(
                      inputBase,
                      "mt-2",
                      lockedAfterInward && "opacity-70",
                      errors.warehouse && "border-rose-400"
                    )}
                  >
                    <option value="">Select</option>
                    <option value="WH-001">WH-001</option>
                    <option value="WH-002">WH-002</option>
                    <option value="WH-003">WH-003</option>
                  </select>
                  {errors.warehouse && <p className="mt-1 text-xs text-rose-600">{errors.warehouse}</p>}
                </div>

                <div>
                  <label className={labelBase}>Received By</label>
                  <input value={receivedBy} disabled className={cn(inputBase, "mt-2 opacity-80")} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Gate Entry & Header Vehicle
                </h3>
                <p className={cn(helperBase, "mt-1")}>
                  Shipments tab holds actual dock/vehicle operations. This is header reference.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className={labelBase}>Gate Entry No</label>
                    <input
                      value={gateEntryNo}
                      onChange={(e) => setGateEntryNo(e.target.value)}
                      disabled={lockedAfterInward}
                      className={cn(
                        inputBase,
                        "mt-2",
                        lockedAfterInward && "opacity-70",
                        errors.gateEntryNo && "border-rose-400"
                      )}
                    />
                    {errors.gateEntryNo && <p className="mt-1 text-xs text-rose-600">{errors.gateEntryNo}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      disabled={lockedAfterInward}
                      className={cn(
                        inputBase,
                        "mt-2",
                        lockedAfterInward && "opacity-70",
                        errors.vehicleType && "border-rose-400"
                      )}
                    >
                      <option value="Truck">Truck</option>
                      <option value="Tempo">Tempo</option>
                      <option value="Courier">Courier</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.vehicleType && <p className="mt-1 text-xs text-rose-600">{errors.vehicleType}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>Vehicle No</label>
                    <input
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      disabled={lockedAfterInward}
                      className={cn(
                        inputBase,
                        "mt-2",
                        lockedAfterInward && "opacity-70",
                        errors.vehicleNo && "border-rose-400"
                      )}
                    />
                    {errors.vehicleNo && <p className="mt-1 text-xs text-rose-600">{errors.vehicleNo}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>Arrival Time</label>
                    <input
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      disabled={lockedAfterInward}
                      className={cn(inputBase, "mt-2", lockedAfterInward && "opacity-70")}
                      placeholder="HH:MM"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POS */}
          {activeTab === "pos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">POs</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    One truck → multiple POs, and one PO → multiple trucks.
                  </p>
                </div>

                <button
                  onClick={addPO}
                  disabled={lockedAfterInward || inwardSource !== "Issued PO"}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95",
                    (lockedAfterInward || inwardSource !== "Issued PO") && "opacity-60 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                >
                  + Add PO
                </button>
              </div>

              {inwardSource !== "Issued PO" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Inward source is <b>{inwardSource}</b>. POs are optional.
                </div>
              )}

              <div className="space-y-3">
                {poRefs.map((p, idx) => (
                  <div key={`${idx}`} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900 dark:text-white">PO #{idx + 1}</div>

                      <button
                        onClick={() => removePO(idx)}
                        disabled={lockedAfterInward || poRefs.length === 1 || inwardSource !== "Issued PO"}
                        className={cn(
                          "text-sm font-semibold text-rose-600 hover:underline",
                          (lockedAfterInward || poRefs.length === 1 || inwardSource !== "Issued PO") &&
                            "opacity-60 cursor-not-allowed"
                        )}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <label className={labelBase}>PO No</label>
                        <input
                          value={p.poNo}
                          onChange={(e) => updatePO(idx, { poNo: e.target.value })}
                          disabled={lockedAfterInward || inwardSource !== "Issued PO"}
                          className={cn(
                            inputBase,
                            "mt-2",
                            (lockedAfterInward || inwardSource !== "Issued PO") && "opacity-70"
                          )}
                        />
                      </div>

                      <div>
                        <label className={labelBase}>PO Date</label>
                        <input
                          value={p.poDate || ""}
                          onChange={(e) => updatePO(idx, { poDate: e.target.value })}
                          disabled={lockedAfterInward || inwardSource !== "Issued PO"}
                          className={cn(
                            inputBase,
                            "mt-2",
                            (lockedAfterInward || inwardSource !== "Issued PO") && "opacity-70"
                          )}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>

                      <div>
                        <label className={labelBase}>Vendor Name</label>
                        <input
                          value={p.vendorName || ""}
                          onChange={(e) => updatePO(idx, { vendorName: e.target.value })}
                          disabled={lockedAfterInward || inwardSource !== "Issued PO"}
                          className={cn(
                            inputBase,
                            "mt-2",
                            (lockedAfterInward || inwardSource !== "Issued PO") && "opacity-70"
                          )}
                        />
                      </div>

                      <div>
                        <label className={labelBase}>Vendor Code</label>
                        <input
                          value={p.vendorCode || ""}
                          onChange={(e) => updatePO(idx, { vendorCode: e.target.value })}
                          disabled={lockedAfterInward || inwardSource !== "Issued PO"}
                          className={cn(
                            inputBase,
                            "mt-2",
                            (lockedAfterInward || inwardSource !== "Issued PO") && "opacity-70"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Common Documents</h4>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className={labelBase}>DC No</label>
                    <input
                      value={dcNo}
                      onChange={(e) => setDcNo(e.target.value)}
                      disabled={lockedAfterInward}
                      className={cn(inputBase, "mt-2", lockedAfterInward && "opacity-70")}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>Invoice Ref</label>
                    <input
                      value={invoiceRef}
                      onChange={(e) => setInvoiceRef(e.target.value)}
                      disabled={lockedAfterInward}
                      className={cn(inputBase, "mt-2", lockedAfterInward && "opacity-70")}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>E-Way Bill</label>
                    <input
                      value={ewayBill}
                      onChange={(e) => setEwayBill(e.target.value)}
                      disabled={lockedAfterInward}
                      className={cn(inputBase, "mt-2", lockedAfterInward && "opacity-70")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHIPMENTS */}
          {activeTab === "shipments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Shipments & Dock</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Shipment = truck/consignment unit. Link POs accordingly. (Next-level rules enabled)
                  </p>
                </div>

                <button
                  onClick={addShipment}
                  disabled={lockedAfterInward}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95",
                    lockedAfterInward && "opacity-60 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                >
                  + Add Shipment
                </button>
              </div>

              <div className="space-y-3">
                {shipments.map((s) => {
                  const rule = canEditPoLinksForShipment(s);
                  return (
                    <div key={s.id} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900 dark:text-white">{s.shipmentNo}</div>

                          {s.linkedPOs.length > 0 && (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {s.linkedPOs.length} PO Linked
                            </span>
                          )}

                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                            {s.status}
                          </span>
                        </div>

                        <button
                          onClick={() => removeShipment(s.id)}
                          disabled={lockedAfterInward || shipments.length === 1}
                          className={cn(
                            "text-sm font-semibold text-rose-600 hover:underline",
                            (lockedAfterInward || shipments.length === 1) && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          Remove
                        </button>
                      </div>

                      {!rule.ok && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                          PO linking locked: <b>{rule.reason}</b>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                          <label className={labelBase}>Gate Entry</label>
                          <input
                            value={s.gateEntryNo}
                            onChange={(e) => updateShipment(s.id, { gateEntryNo: e.target.value })}
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2", errors[`shp_gate_${s.id}`] && "border-rose-400")}
                          />
                          {errors[`shp_gate_${s.id}`] && (
                            <p className="mt-1 text-xs text-rose-600">{errors[`shp_gate_${s.id}`]}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelBase}>Vehicle Type</label>
                          <select
                            value={s.vehicleType}
                            onChange={(e) => updateShipment(s.id, { vehicleType: e.target.value as VehicleType })}
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2")}
                          >
                            <option value="Truck">Truck</option>
                            <option value="Tempo">Tempo</option>
                            <option value="Courier">Courier</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className={labelBase}>Vehicle No</label>
                          <input
                            value={s.vehicleNo}
                            onChange={(e) => updateShipment(s.id, { vehicleNo: e.target.value })}
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2", errors[`shp_vehicle_${s.id}`] && "border-rose-400")}
                          />
                          {errors[`shp_vehicle_${s.id}`] && (
                            <p className="mt-1 text-xs text-rose-600">{errors[`shp_vehicle_${s.id}`]}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelBase}>Mode</label>
                          <select
                            value={s.mode}
                            onChange={(e) => updateShipment(s.id, { mode: e.target.value as InboundMode })}
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2")}
                          >
                            <option value="ASN/Pre-Receiving">ASN/Pre-Receiving</option>
                            <option value="Direct (No ASN)">Direct (No ASN)</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                          <label className={labelBase}>Dock Door</label>
                          <select
                            value={s.dockDoor}
                            onChange={(e) =>
                              updateShipment(s.id, {
                                dockDoor: e.target.value as DockDoor,
                                stagingArea: `STG-${e.target.value}`,
                              })
                            }
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2", errors[`shp_dock_${s.id}`] && "border-rose-400")}
                          >
                            <option value="D1">D1</option>
                            <option value="D2">D2</option>
                            <option value="D3">D3</option>
                            <option value="D4">D4</option>
                          </select>
                          {errors[`shp_dock_${s.id}`] && (
                            <p className="mt-1 text-xs text-rose-600">{errors[`shp_dock_${s.id}`]}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelBase}>Staging Area</label>
                          <input
                            value={s.stagingArea}
                            onChange={(e) => updateShipment(s.id, { stagingArea: e.target.value })}
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2", errors[`shp_stage_${s.id}`] && "border-rose-400")}
                          />
                          {errors[`shp_stage_${s.id}`] && (
                            <p className="mt-1 text-xs text-rose-600">{errors[`shp_stage_${s.id}`]}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelBase}>Arrival Time</label>
                          <input
                            value={s.arrivalTime || ""}
                            onChange={(e) => updateShipment(s.id, { arrivalTime: e.target.value })}
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2")}
                            placeholder="HH:MM"
                          />
                        </div>

                        <div>
                          <label className={labelBase}>Status</label>
                          <select
                            value={s.status}
                            onChange={(e) => updateShipment(s.id, { status: e.target.value as InboundShipment["status"] })}
                            disabled={lockedAfterInward}
                            className={cn(inputBase, "mt-2")}
                          >
                            <option value="Planned">Planned</option>
                            <option value="Arrived">Arrived</option>
                            <option value="At Dock">At Dock</option>
                            <option value="Receiving">Receiving</option>
                            <option value="Receiving Done">Receiving Done</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className={labelBase}>Link POs to Shipment</label>
                        <p className={cn(helperBase, "mt-1")}>
                          Click PO to link/unlink. Unlink requires confirmation. Unlink blocked if receiving logs exist.
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {poRefs
                            .filter((p) => (p.poNo || "").trim())
                            .map((p) => {
                              const checked = s.linkedPOs.includes(p.poNo);
                              const disabled = lockedAfterInward || inwardSource !== "Issued PO" || !rule.ok;

                              return (
                                <button
                                  key={p.poNo}
                                  type="button"
                                  onClick={() => handleTogglePoLink(s.id, p.poNo)}
                                  disabled={disabled}
                                  className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold border transition active:scale-95",
                                    checked
                                      ? "text-white shadow"
                                      : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5",
                                    disabled && "opacity-60 cursor-not-allowed"
                                  )}
                                  style={
                                    checked
                                      ? { backgroundColor: FORTUNA_PRIMARY_RED, borderColor: FORTUNA_PRIMARY_RED }
                                      : undefined
                                  }
                                  title={
                                    disabled
                                      ? rule.ok
                                        ? "Linking disabled"
                                        : rule.reason
                                      : checked
                                      ? "Click to unlink"
                                      : "Click to link"
                                  }
                                >
                                  {p.poNo}
                                </button>
                              );
                            })}
                        </div>

                        {errors[`shp_pos_${s.id}`] && (
                          <p className="mt-2 text-xs text-rose-600">{errors[`shp_pos_${s.id}`]}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ASSIGNMENT */}
          {activeTab === "assignment" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Receiver Assignment</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Assigned users can receive in Mobile tab.</p>
                  </div>

                  <button
                    onClick={() => {
                      if (!validate()) {
                        setActiveTab("basic");
                        showToast("Fix errors first.");
                        return;
                      }
                      setStatus("Inward Assigned");
                      setActiveTab("mobile");
                      showToast("Assignment saved ✅");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                  >
                    Save Assignment
                  </button>
                </div>

                {errors.assignment && <p className="mt-2 text-xs text-rose-600">{errors.assignment}</p>}

                <div className="mt-4 max-h-[430px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {receivers.map((r) => {
                      const checked = assignedReceiverIds.includes(r.id);

                      // ✅ FIX: use border + ring instead of outline (outline sometimes looks clipped on first cards)
                      const selectedStyle = checked
                        ? {
                            borderColor: FORTUNA_SECONDARY_BLUE,
                            boxShadow: `0 0 0 2px ${FORTUNA_SECONDARY_BLUE}33`,
                          }
                        : undefined;

                      return (
                        <label
                          key={r.id}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition",
                            checked ? "bg-blue-50/30" : "bg-white",
                            "border-gray-200 dark:border-gray-800"
                          )}
                          style={selectedStyle}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReceiverAssign(r.id)}
                            className="mt-1 h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-900 dark:text-white">{r.name}</div>
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                                {r.role}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                              {r.phone} • Active: {r.active ? "Yes" : "No"}
                            </div>
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                              Receiving Count (demo): <span className="font-semibold">{r.receivingCount}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS */}
          {activeTab === "items" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Item Plan</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      Expected vs Final Received. Final updates by Supervisor sync.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={addItemRow}
                      disabled={lockedAfterInward}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95",
                        lockedAfterInward && "opacity-60 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                    >
                      + Add Item
                    </button>

                    <button
                      onClick={sendToQC}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                    >
                      Send to QC
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Line</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">Expected</th>
                      <th className="px-4 py-3 text-left">Final</th>
                      <th className="px-4 py-3 text-left">Live</th>
                      <th className="px-4 py-3 text-left">Over</th>
                      <th className="px-4 py-3 text-left">Over Action</th>
                      <th className="px-4 py-3 text-left">QC?</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="dark:text-gray-200">
                    {items.map((it) => (
                      <tr key={it.id} className="border-t hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold">{it.lineNo}</td>

                        <td className="px-4 py-3">
                          <input
                            value={it.sku}
                            disabled={lockedAfterInward}
                            onChange={(e) => updateItem(it.id, { sku: e.target.value })}
                            className={cn(
                              inputBase,
                              "min-w-[180px]",
                              lockedAfterInward && "opacity-70",
                              errors[`sku_${it.id}`] && "border-rose-400"
                            )}
                          />
                          {errors[`sku_${it.id}`] && <p className="mt-1 text-xs text-rose-600">{errors[`sku_${it.id}`]}</p>}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={it.expectedQty}
                            disabled={lockedAfterInward}
                            onChange={(e) => updateItem(it.id, { expectedQty: safeNum(e.target.value) })}
                            className={cn(inputBase, "max-w-[120px]", lockedAfterInward && "opacity-70")}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={it.receivedQty}
                            disabled={lockedAfterInward}
                            onChange={(e) => updateItem(it.id, { receivedQty: safeNum(e.target.value) })}
                            className={cn(inputBase, "max-w-[120px]", lockedAfterInward && "opacity-70")}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {it.mobileReceivedQty}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {it.overQty}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={it.overAction}
                            disabled={lockedAfterInward || it.overQty === 0}
                            onChange={(e) => updateItem(it.id, { overAction: e.target.value as OverAction })}
                            className={cn(
                              inputBase,
                              "min-w-[220px]",
                              (lockedAfterInward || it.overQty === 0) && "opacity-70"
                            )}
                          >
                            <option value="Quarantine">Quarantine</option>
                            <option value="Return to Vendor">Return to Vendor</option>
                            <option value="Adjust in Next PO">Adjust in Next PO</option>
                            <option value="Accept as Free Qty">Accept as Free Qty</option>
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={it.qcRequired}
                              disabled={lockedAfterInward}
                              onChange={(e) => updateItem(it.id, { qcRequired: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <span>QC Required</span>
                          </label>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeItemRow(it.id)}
                            disabled={lockedAfterInward}
                            className={cn(
                              "text-sm font-semibold text-rose-600 hover:underline",
                              lockedAfterInward && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!items.length && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("mobile")}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                >
                  Go to Mobile
                </button>
                <button
                  onClick={syncMobileToFinal}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                  style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                >
                  Supervisor Sync Live → Final
                </button>
              </div>
            </div>
          )}

          {/* MOBILE */}
          {activeTab === "mobile" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Live Receiving (Simulation)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      Receive = scan + qty → creates LPN + log. (Replace with real scan later)
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={syncMobileToFinal}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                    >
                      Supervisor Sync
                    </button>
                    <button
                      onClick={exportLogsCSV}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                    >
                      Export Logs CSV
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
                  <div>
                    <label className={labelBase}>Receiver</label>
                    <select
                      value={mobileSelectedReceiverId}
                      onChange={(e) => setMobileSelectedReceiverId(e.target.value)}
                      className={cn(inputBase, "mt-2")}
                    >
                      {assignedReceivers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelBase}>Shipment</label>
                    <select
                      value={mobileShipmentId}
                      onChange={(e) => setMobileShipmentId(e.target.value)}
                      className={cn(inputBase, "mt-2")}
                    >
                      {shipments.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shipmentNo} • {s.vehicleNo || "Vehicle?"} • {s.dockDoor || "Dock?"} • {s.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelBase}>PO</label>
                    <select
                      value={mobilePoNo}
                      onChange={(e) => setMobilePoNo(e.target.value)}
                      disabled={inwardSource !== "Issued PO"}
                      className={cn(inputBase, "mt-2", inwardSource !== "Issued PO" && "opacity-70")}
                    >
                      {poRefs.filter((p) => (p.poNo || "").trim()).map((p) => (
                        <option key={p.poNo} value={p.poNo}>
                          {p.poNo}
                        </option>
                      ))}
                    </select>
                    {inwardSource !== "Issued PO" && <p className={cn(helperBase, "mt-1")}>PO not required.</p>}
                  </div>

                  <div>
                    <label className={labelBase}>Item</label>
                    <select value={mobileItemId} onChange={(e) => setMobileItemId(e.target.value)} className={cn(inputBase, "mt-2")}>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.sku || "SKU"} — Exp:{it.expectedQty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelBase}>Qty</label>
                    <input
                      type="number"
                      value={mobileQty}
                      onChange={(e) => setMobileQty(safeNum(e.target.value))}
                      className={cn(inputBase, "mt-2")}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={mobileReceive}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                  >
                    Receive (Create LPN)
                  </button>
                </div>
              </div>

              {/* Logs */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Shipment</th>
                      <th className="px-4 py-3 text-left">PO</th>
                      <th className="px-4 py-3 text-left">Receiver</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">Qty</th>
                      <th className="px-4 py-3 text-left">LPN</th>
                    </tr>
                  </thead>
                  <tbody className="dark:text-gray-200">
                    {receivingLogs.map((l) => (
                      <tr key={l.id} className="border-t dark:border-gray-800">
                        <td className="px-4 py-3">{new Date(l.receivedAtISO).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold">{l.shipmentNo}</td>
                        <td className="px-4 py-3">{l.poNo || "-"}</td>
                        <td className="px-4 py-3">{l.receiverName}</td>
                        <td className="px-4 py-3">{l.sku}</td>
                        <td className="px-4 py-3 font-semibold">{l.qty}</td>
                        <td className="px-4 py-3 font-semibold">{l.lpnNo}</td>
                      </tr>
                    ))}

                    {!receivingLogs.length && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No logs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* LPNs */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">LPN</th>
                      <th className="px-4 py-3 text-left">Shipment</th>
                      <th className="px-4 py-3 text-left">PO</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">Qty</th>
                      <th className="px-4 py-3 text-left">From</th>
                      <th className="px-4 py-3 text-left">To</th>
                      <th className="px-4 py-3 text-left">Putaway</th>
                    </tr>
                  </thead>
                  <tbody className="dark:text-gray-200">
                    {lpns.map((l) => (
                      <tr key={l.id} className="border-t dark:border-gray-800">
                        <td className="px-4 py-3 font-semibold">{l.lpnNo}</td>
                        <td className="px-4 py-3">{l.shipmentNo}</td>
                        <td className="px-4 py-3">{l.poNo || "-"}</td>
                        <td className="px-4 py-3">{l.sku}</td>
                        <td className="px-4 py-3 font-semibold">{l.qty}</td>
                        <td className="px-4 py-3">{l.fromBin}</td>
                        <td className="px-4 py-3">{l.toBin || "-"}</td>
                        <td className="px-4 py-3">{l.putawayStatus}</td>
                      </tr>
                    ))}

                    {!lpns.length && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No LPNs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* QC */}
          {activeTab === "qc" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quality Check (QC)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Demo: applies to all QC required lines.</p>
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    QC Lines: {items.filter((x) => x.qcRequired).length}
                  </span>
                </div>

                <div className="mt-4">
                  <label className={labelBase}>QC Fail Reason</label>
                  <textarea
                    value={qcFailReason}
                    onChange={(e) => setQcFailReason(e.target.value)}
                    className={cn(inputBase, "mt-2 min-h-[110px] resize-y")}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => qcDecision("Failed")}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                  >
                    QC Failed
                  </button>
                  <button
                    onClick={() => qcDecision("Passed")}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                  >
                    QC Passed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PUTAWAY */}
          {activeTab === "putaway" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Putaway</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Generate tasks from LPNs and confirm bin placement. (QC-hold excluded)
                  </p>
                </div>

                <button
                  onClick={generatePutawayTasks}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                  style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                >
                  Generate Tasks
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">LPN</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">Qty</th>
                      <th className="px-4 py-3 text-left">From</th>
                      <th className="px-4 py-3 text-left">To</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="dark:text-gray-200">
                    {putawayTasks.map((t) => (
                      <tr key={t.id} className="border-t dark:border-gray-800">
                        <td className="px-4 py-3 font-semibold">{t.lpnNo}</td>
                        <td className="px-4 py-3">{t.sku}</td>
                        <td className="px-4 py-3 font-semibold">{t.qty}</td>
                        <td className="px-4 py-3">{t.fromBin}</td>
                        <td className="px-4 py-3">{t.toBin}</td>
                        <td className="px-4 py-3">{t.status}</td>
                        <td className="px-4 py-3">
                          <button
                            disabled={t.status === "Confirmed"}
                            onClick={() => confirmPutaway(t.id)}
                            className={cn(
                              "text-sm font-semibold",
                              t.status === "Confirmed" ? "opacity-60" : "text-blue-700 hover:underline"
                            )}
                          >
                            Confirm Putaway
                          </button>
                          {t.confirmedAtISO && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                              {new Date(t.confirmedAtISO).toLocaleString()}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {!putawayTasks.length && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No tasks yet. Create LPNs in Mobile tab first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Attachments</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Demo list. Connect upload later.</p>
                  </div>

                  <button
                    onClick={() => {
                      setAttachments((p) => [
                        ...p,
                        { id: uid("att"), type: "Other", fileName: `attachment_${p.length + 1}.pdf` },
                      ]);
                      showToast("Attachment added");
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                  >
                    + Add Attachment
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">File</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="dark:text-gray-200">
                      {attachments.map((a) => (
                        <tr key={a.id} className="border-t dark:border-gray-800">
                          <td className="px-4 py-3">{a.type}</td>
                          <td className="px-4 py-3 font-semibold">{a.fileName}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setAttachments((p) => p.filter((x) => x.id !== a.id));
                                showToast("Attachment removed");
                              }}
                              className="text-sm font-semibold text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!attachments.length && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-300">
                            No attachments
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <label className={labelBase}>Internal Remarks</label>
                  <textarea
                    value={internalRemarks}
                    onChange={(e) => setInternalRemarks(e.target.value)}
                    className={cn(inputBase, "mt-2 min-h-[110px] resize-y")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STATUS */}
          {activeTab === "status" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Status & Convert</h3>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoCard title="Current Status" value={status} />
                  <InfoCard title="Trail" value={`Logs: ${receivingLogs.length} • LPNs: ${lpns.length}`} />
                  <InfoCard
                    title="Putaway"
                    value={`Tasks: ${putawayTasks.length} • Done: ${putawayTasks.filter((x) => x.status === "Confirmed").length}`}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (!validate()) {
                        setActiveTab("basic");
                        showToast("Fix errors first.");
                        return;
                      }
                      sendToQC();
                    }}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                    disabled={isConverted}
                  >
                    QC Flow
                  </button>

                  <button
                    onClick={() => {
                      if (!validate()) {
                        setActiveTab("basic");
                        showToast("Fix errors first.");
                        return;
                      }
                      convertToGRN();
                    }}
                    className={cn(
                      "rounded-xl px-5 py-2.5 text-sm font-semibold text-white active:scale-95",
                      !canConvertToGRN && "opacity-60 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                    disabled={!canConvertToGRN}
                  >
                    Convert to GRN
                  </button>

                  <button
                    onClick={() => setActiveTab("putaway")}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white active:scale-95"
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                  >
                    Review Putaway
                  </button>
                </div>

                {!canConvertToGRN && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Convert disabled until: <b>Mark Inwarded</b> + <b>QC Passed</b> (if required) + Over action selected.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => router.push(ROUTES.goodsInwardList)}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
        >
          Back to GI List
        </button>

        <button
          onClick={() => {
            if (!validate()) {
              showToast("Fix validation errors first.");
              setActiveTab("basic");
              return;
            }
            convertToGRN();
          }}
          className={cn(
            "rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-95",
            !canConvertToGRN && "opacity-60 cursor-not-allowed"
          )}
          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
          disabled={!canConvertToGRN}
        >
          Convert to GRN
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
        >
          {toastMsg}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          onCancel={() => setModal({ open: false })}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}

/** Small components */
function KpiCard({ label, value, tone }: { label: string; value: number; tone?: "blue" }) {
  const cls =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : "border-gray-200 bg-gray-50 text-gray-900";
  return (
    <div className={cn("rounded-2xl border p-4 dark:border-gray-800 dark:bg-white/5 dark:text-white", cls)}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/5">
      <div className="text-xs text-gray-500 dark:text-gray-300">{title}</div>
      <div className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">{title}</div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
