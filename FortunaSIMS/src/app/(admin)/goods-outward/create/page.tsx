
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Package,
  ClipboardList,
  Boxes,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  History,
  CalendarDays,
  Search,
  RotateCcw,
} from "lucide-react";

const RED = "#C8102E";
const BLUE = "#005F99";

type OutwardStatus =
  | "Draft"
  | "Ready for Picking"
  | "Picking In Progress"
  | "Ready for Issue"
  | "Issued"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

type OutwardItem = {
  id: string;
  sku: string;
  description: string;
  uom: string;
  orderedQty: number;
  previouslyOutwardedQty: number;
  availableStock: number;
  outwardQty: number;
  pickedQty: number;
  packedQty: number;
  bin: string;
};

type Activity = {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  remarks: string;
};

type OutwardForm = {
  outwardNo: string;
  salesOrderNo: string;
  customer: string;
  customerCode: string;
  warehouse: string;
  outwardDate: string;
  requiredDate: string;
  priority: "Normal" | "High" | "Urgent";
  deliveryAddress: string;
  contactPerson: string;
  contactPhone: string;
  remarks: string;
  picker: string;
  packer: string;
  transporter: string;
  vehicleNo: string;
  lrNumber: string;
  trackingNumber: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  deliveryRemarks: string;
};

type SalesOrderOption = {
  orderNo: string;
  customer: string;
  customerCode: string;
  warehouse: string;
  deliveryAddress: string;
  contactPerson: string;
  contactPhone: string;
  items: OutwardItem[];
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const DEMO_ORDERS: SalesOrderOption[] = [
  {
    orderNo: "SO-2026-0142",
    customer: "Sri Lakshmi Electronics",
    customerCode: "CUST-001",
    warehouse: "Vizag Central Warehouse",
    deliveryAddress: "Dwaraka Nagar, Visakhapatnam, Andhra Pradesh",
    contactPerson: "Ramesh Kumar",
    contactPhone: "9876543210",
    items: [
      {
        id: "item-1",
        sku: "TV-LED-43",
        description: "43-inch LED Television",
        uom: "Nos",
        orderedQty: 30,
        previouslyOutwardedQty: 0,
        availableStock: 45,
        outwardQty: 30,
        pickedQty: 0,
        packedQty: 0,
        bin: "A-01-01",
      },
      {
        id: "item-2",
        sku: "HDMI-CABLE",
        description: "HDMI Cable 2m",
        uom: "Nos",
        orderedQty: 40,
        previouslyOutwardedQty: 0,
        availableStock: 100,
        outwardQty: 40,
        pickedQty: 0,
        packedQty: 0,
        bin: "A-02-04",
      },
      {
        id: "item-3",
        sku: "REMOTE-UNIV",
        description: "Universal Remote",
        uom: "Nos",
        orderedQty: 16,
        previouslyOutwardedQty: 0,
        availableStock: 20,
        outwardQty: 16,
        pickedQty: 0,
        packedQty: 0,
        bin: "B-01-02",
      },
    ],
  },
  {
    orderNo: "SO-2026-0139",
    customer: "Coastal Digital Stores",
    customerCode: "CUST-002",
    warehouse: "Gajuwaka Warehouse",
    deliveryAddress: "Gajuwaka, Visakhapatnam, Andhra Pradesh",
    contactPerson: "Suresh",
    contactPhone: "9876501234",
    items: [
      {
        id: "item-4",
        sku: "WASH-7KG",
        description: "7kg Washing Machine",
        uom: "Nos",
        orderedQty: 12,
        previouslyOutwardedQty: 0,
        availableStock: 18,
        outwardQty: 12,
        pickedQty: 0,
        packedQty: 0,
        bin: "C-01-01",
      },
      {
        id: "item-5",
        sku: "STAB-4KVA",
        description: "4KVA Voltage Stabilizer",
        uom: "Nos",
        orderedQty: 12,
        previouslyOutwardedQty: 0,
        availableStock: 10,
        outwardQty: 0,
        pickedQty: 0,
        packedQty: 0,
        bin: "C-02-01",
      },
    ],
  },
];

const STORAGE_KEY = "FORTUNA_GOODS_OUTWARD_DEMO_V1";

const STATUS_STYLES: Record<OutwardStatus, string> = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "Ready for Picking":
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Picking In Progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Ready for Issue":
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Issued: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  Dispatched:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  Delivered:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const tabs = [
  { id: "basic", label: "Basic Details", icon: ClipboardList },
  { id: "items", label: "Item Plan", icon: Package },
  { id: "picking", label: "Picking & Packing", icon: Boxes },
  { id: "dispatch", label: "Transport & Dispatch", icon: Truck },
  { id: "history", label: "Status & History", icon: History },
] as const;

type TabId = (typeof tabs)[number]["id"];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  options,
  min,
  max,
  hint,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  options?: string[];
  min?: string | number;
  max?: string | number;
  hint?: string;
}) {
  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:disabled:bg-gray-800";

  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      {options ? (
        <select
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={inputClass}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={inputClass}
        />
      ) : (
        <input
          required={required}
          disabled={disabled}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className={inputClass}
        />
      )}
      {hint && (
        <span className="block text-[11px] text-gray-500 dark:text-gray-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function Kpi({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  tone?: "red" | "blue" | "dark" | "teal";
}) {
  const color =
    tone === "red"
      ? RED
      : tone === "blue"
      ? BLUE
      : tone === "teal"
      ? "#0F766E"
      : "#374151";

  return (
    <div
      className="rounded-xl p-4 text-white"
      style={{ backgroundColor: color }}
    >
      <p className="text-xs font-medium text-white/80">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: OutwardStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
        STATUS_STYLES[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function createBlankForm(): OutwardForm {
  return {
    outwardNo: `GO-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 9000) + 1000
    )}`,
    salesOrderNo: "",
    customer: "",
    customerCode: "",
    warehouse: "",
    outwardDate: today(),
    requiredDate: "",
    priority: "Normal",
    deliveryAddress: "",
    contactPerson: "",
    contactPhone: "",
    remarks: "",
    picker: "",
    packer: "",
    transporter: "",
    vehicleNo: "",
    lrNumber: "",
    trackingNumber: "",
    dispatchDate: "",
    expectedDeliveryDate: "",
    deliveryRemarks: "",
  };
}

export default function GoodsOutwardCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedSO =
    searchParams.get("so") ||
    searchParams.get("sales_order") ||
    searchParams.get("order_id") ||
    "";

  const requestedOutwardId = searchParams.get("outwardId") || "";

  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [form, setForm] = useState<OutwardForm>(createBlankForm);
  const [items, setItems] = useState<OutwardItem[]>([]);
  const [status, setStatus] = useState<OutwardStatus>("Draft");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIssueConfirm, setShowIssueConfirm] = useState(false);
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [showOrderPicker, setShowOrderPicker] = useState(false);

  const locked = ["Issued", "Dispatched", "Delivered", "Cancelled"].includes(
    status
  );

  const orderOptions = useMemo(
    () =>
      DEMO_ORDERS.filter((order) => {
        const query = orderSearch.toLowerCase().trim();
        return (
          !query ||
          order.orderNo.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query)
        );
      }),
    [orderSearch]
  );

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.lines += 1;
        acc.ordered += item.orderedQty;
        acc.outward += item.outwardQty;
        acc.picked += item.pickedQty;
        acc.packed += item.packedQty;
        acc.available += item.availableStock;
        return acc;
      },
      {
        lines: 0,
        ordered: 0,
        outward: 0,
        picked: 0,
        packed: 0,
        available: 0,
      }
    );
  }, [items]);

  const updateForm = <K extends keyof OutwardForm>(
    key: K,
    value: OutwardForm[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const addActivity = (action: string, remarks = "") => {
    const entry: Activity = {
      id: uid(),
      action,
      user: "Current User",
      timestamp: new Date().toLocaleString("en-IN"),
      remarks,
    };
    setActivities((previous) => [entry, ...previous]);
  };

  const selectOrder = (order: SalesOrderOption) => {
    setForm((previous) => ({
      ...previous,
      salesOrderNo: order.orderNo,
      customer: order.customer,
      customerCode: order.customerCode,
      warehouse: order.warehouse,
      deliveryAddress: order.deliveryAddress,
      contactPerson: order.contactPerson,
      contactPhone: order.contactPhone,
    }));

    setItems(order.items.map((item) => ({ ...item })));
    setShowOrderPicker(false);
    setOrderSearch("");
    setErrors({});
    addActivity("Sales Order Selected", order.orderNo);
    setNotice(`Loaded ${order.orderNo} into the outward form.`);
  };

  useEffect(() => {
    if (!requestedSO) return;

    const normalized = requestedSO.trim().toLowerCase();
    const order = DEMO_ORDERS.find(
      (item) => item.orderNo.toLowerCase() === normalized
    );

    if (order) selectOrder(order);
    else {
      setForm((previous) => ({
        ...previous,
        salesOrderNo: requestedSO,
      }));
      setNotice(
        `Sales Order ${requestedSO} was passed in the URL, but is not present in the demo order list. Select an available demo order to load sample items.`
      );
    }
    // Initial URL prefill only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSO]);

  useEffect(() => {
    if (!requestedOutwardId) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const records = JSON.parse(saved) as Array<{
        id: string;
        form: OutwardForm;
        items: OutwardItem[];
        status: OutwardStatus;
        activities: Activity[];
      }>;

      const existing = records.find((record) => record.id === requestedOutwardId);
      if (!existing) return;

      setForm(existing.form);
      setItems(existing.items);
      setStatus(existing.status);
      setActivities(existing.activities || []);
      setNotice(`Loaded saved demo outward ${existing.form.outwardNo}.`);
    } catch {
      setNotice("Unable to load the saved demo outward record.");
    }
  }, [requestedOutwardId]);

  const validateBasic = () => {
    const next: Record<string, string> = {};

    if (!form.salesOrderNo.trim()) next.salesOrderNo = "Select a Sales Order.";
    if (!form.customer.trim()) next.customer = "Customer is required.";
    if (!form.warehouse.trim()) next.warehouse = "Warehouse is required.";
    if (!form.outwardDate) next.outwardDate = "Outward date is required.";
    if (!items.length) next.items = "Add items from a Sales Order first.";

    setErrors(next);

    if (Object.keys(next).length) {
      setActiveTab(next.items ? "items" : "basic");
      setNotice("Please fix the highlighted fields before continuing.");
      return false;
    }

    return true;
  };

  const validateItemPlan = () => {
    if (!items.length) {
      setActiveTab("items");
      setNotice("Select a Sales Order before continuing.");
      return false;
    }

    const invalid = items.some(
      (item) =>
        item.outwardQty < 0 ||
        item.outwardQty > item.orderedQty - item.previouslyOutwardedQty ||
        item.outwardQty > item.availableStock
    );

    if (invalid) {
      setActiveTab("items");
      setNotice(
        "Check outward quantities. They cannot exceed order balance or available stock."
      );
      return false;
    }

    if (!items.some((item) => item.outwardQty > 0)) {
      setActiveTab("items");
      setNotice("At least one item must have an outward quantity greater than zero.");
      return false;
    }

    return true;
  };

  const saveRecord = (nextStatus: OutwardStatus) => {
    if (!validateBasic()) return;
    if (nextStatus !== "Draft" && !validateItemPlan()) return;

    setSaving(true);

    try {
      const existingRecords = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      ) as Array<{
        id: string;
        form: OutwardForm;
        items: OutwardItem[];
        status: OutwardStatus;
        activities: Activity[];
      }>;

      const id = requestedOutwardId || form.outwardNo;
      const nextRecord = {
        id,
        form,
        items,
        status: nextStatus,
        activities: [
          {
            id: uid(),
            action: nextStatus === "Draft" ? "Draft Saved" : "Outward Updated",
            user: "Current User",
            timestamp: new Date().toLocaleString("en-IN"),
            remarks: `Status: ${nextStatus}`,
          },
          ...activities,
        ],
      };

      const withoutCurrent = existingRecords.filter((record) => record.id !== id);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([nextRecord, ...withoutCurrent])
      );

      setStatus(nextStatus);
      addActivity(
        nextStatus === "Draft" ? "Draft Saved" : "Outward Saved",
        `Status: ${nextStatus}`
      );
      setNotice(
        `Outward ${form.outwardNo} saved in demo mode with status "${nextStatus}".`
      );
    } catch {
      setNotice("Unable to save demo record in browser storage.");
    } finally {
      setSaving(false);
    }
  };

  const startPicking = () => {
    if (!validateBasic() || !validateItemPlan()) return;

    setStatus("Picking In Progress");
    addActivity("Picking Started");
    setActiveTab("picking");
    setNotice("Picking started. Record picked and packed quantities.");
  };

  const markReadyForIssue = () => {
    if (!validateItemPlan()) return;

    const incomplete = items.some(
      (item) =>
        item.outwardQty > 0 &&
        (item.pickedQty !== item.outwardQty ||
          item.packedQty !== item.outwardQty)
    );

    if (incomplete) {
      setActiveTab("picking");
      setNotice(
        "Picking and packing must match the outward quantity for every selected item."
      );
      return;
    }

    setStatus("Ready for Issue");
    addActivity("Ready for Goods Issue");
    setNotice("Picking and packing verified. Ready for Goods Issue.");
  };

  const confirmGoodsIssue = () => {
    if (status !== "Ready for Issue") {
      setNotice("Complete picking and packing before Goods Issue.");
      setShowIssueConfirm(false);
      return;
    }

    if (!validateItemPlan()) {
      setShowIssueConfirm(false);
      return;
    }

    // Demo only: no real stock ledger or backend is updated here.
    setStatus("Issued");
    addActivity(
      "Goods Issue Confirmed",
      "Demo confirmation only; no inventory stock was deducted."
    );
    setShowIssueConfirm(false);
    setNotice(
      "Goods Issue marked in demo mode. Real stock deduction requires a backend inventory transaction."
    );
    setActiveTab("dispatch");
  };

  const confirmDispatch = () => {
    if (status !== "Issued") {
      setNotice("Confirm Goods Issue before dispatch.");
      setShowDispatchConfirm(false);
      return;
    }

    if (!form.transporter.trim()) {
      setNotice("Enter the transporter before dispatch.");
      setShowDispatchConfirm(false);
      setActiveTab("dispatch");
      return;
    }

    if (!form.dispatchDate) {
      setNotice("Enter the dispatch date before dispatch.");
      setShowDispatchConfirm(false);
      setActiveTab("dispatch");
      return;
    }

    setStatus("Dispatched");
    addActivity(
      "Dispatched",
      [form.transporter, form.vehicleNo, form.lrNumber]
        .filter(Boolean)
        .join(" | ")
    );
    setShowDispatchConfirm(false);
    setNotice("Outward marked as dispatched in demo mode.");
  };

  const markDelivered = () => {
    if (status !== "Dispatched") {
      setNotice("Only dispatched outward records can be marked delivered.");
      return;
    }

    setStatus("Delivered");
    addActivity("Delivery Confirmed", form.deliveryRemarks);
    setNotice("Delivery marked complete in demo mode.");
    setActiveTab("history");
  };

  const cancelOutward = () => {
    if (status === "Issued" || status === "Dispatched" || status === "Delivered") {
      setNotice(
        "This outward has passed Goods Issue. Use a backend-authorized reversal or return workflow instead of cancelling it here."
      );
      return;
    }

    if (!window.confirm("Cancel this Goods Outward document?")) return;

    setStatus("Cancelled");
    addActivity("Outward Cancelled", "Cancelled by user in demo mode.");
    setNotice("Outward cancelled in demo mode.");
  };

  const updateItem = (
    id: string,
    field: keyof OutwardItem,
    value: string | number
  ) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "outwardQty") {
          const qty = Number(value);
          updated.outwardQty = Number.isFinite(qty) ? Math.max(0, qty) : 0;
          updated.pickedQty = Math.min(updated.pickedQty, updated.outwardQty);
          updated.packedQty = Math.min(updated.packedQty, updated.outwardQty);
        }

        if (field === "pickedQty") {
          const qty = Number(value);
          updated.pickedQty = Number.isFinite(qty)
            ? Math.max(0, Math.min(qty, updated.outwardQty))
            : 0;
          updated.packedQty = Math.min(updated.packedQty, updated.pickedQty);
        }

        if (field === "packedQty") {
          const qty = Number(value);
          updated.packedQty = Number.isFinite(qty)
            ? Math.max(0, Math.min(qty, updated.pickedQty))
            : 0;
        }

        return updated;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    if (!window.confirm("Reset this form? Unsaved changes will be lost.")) return;

    setForm(createBlankForm());
    setItems([]);
    setStatus("Draft");
    setActivities([]);
    setErrors({});
    setActiveTab("basic");
    setNotice("Form reset.");
  };

  
const tabAllowed = (tab: TabId) => {
  if (tab === "basic" || tab === "items" || tab === "history") {
    return true;
  }

  if (tab === "picking") {
    return items.length > 0;
  }

  if (tab === "dispatch") {
    return (
      items.length > 0 &&
      status !== "Draft" &&
      status !== "Cancelled"
    );
  }

  return true;
};


  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 text-gray-800 dark:bg-gray-950 dark:text-gray-100 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <button
            type="button"
            onClick={() => router.push("/goods-outward")}
            className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to Goods Outward
          </button>

          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
            <span>Inventory &amp; WMS</span>
            <ArrowRight size={13} />
            <span>Goods Outward</span>
            <ArrowRight size={13} />
            <span>Create</span>
          </div>

          <h1 className="text-2xl font-extrabold sm:text-3xl" style={{ color: RED }}>
            {requestedOutwardId ? "Edit Goods Outward" : "Create Goods Outward"}
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            Prepare sales order items, complete picking and packing, confirm
            goods issue, and record dispatch details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            type="button"
            disabled={saving || locked}
            onClick={() => saveRecord("Draft")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p>{notice}</p>
          </div>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Item Lines" value={totals.lines} tone="red" />
        <Kpi label="Planned Outward Qty" value={totals.outward} tone="blue" />
        <Kpi label="Picked Qty" value={totals.picked} tone="teal" />
        <Kpi label="Packed Qty" value={totals.packed} tone="dark" />
      </div>

      {/* Workflow progress */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold">Outward Process</h2>
          <span className="text-xs text-gray-500">Follow each operational stage</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Sales Order", done: Boolean(form.salesOrderNo), icon: ClipboardList },
            { label: "Item Plan", done: items.length > 0, icon: Package },
            { label: "Picking & Packing", done: status === "Ready for Issue" || ["Issued", "Dispatched", "Delivered"].includes(status), icon: Boxes },
            { label: "Goods Issue", done: ["Issued", "Dispatched", "Delivered"].includes(status), icon: CheckCircle2 },
            { label: "Dispatch", done: ["Dispatched", "Delivered"].includes(status), icon: Truck },
            { label: "Delivered", done: status === "Delivered", icon: CheckCircle2 },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: step.done ? BLUE : index % 2 === 0 ? RED : "#9CA3AF" }}
                >
                  <Icon size={17} />
                </span>
                <span className="text-xs font-bold">{step.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabs */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 p-2 dark:border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const disabled = !tabAllowed(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition",
                  activeTab === tab.id
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  disabled && "cursor-not-allowed opacity-40"
                )}
                style={activeTab === tab.id ? { backgroundColor: RED } : undefined}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {/* BASIC */}
          {activeTab === "basic" && (
            <>
              <Panel
                title="Outward Header"
                description="Select the sales order and verify the customer, warehouse and delivery details."
              >
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label="Outward Number" value={form.outwardNo} disabled required />
                  <Field
                    label="Outward Date"
                    type="date"
                    value={form.outwardDate}
                    onChange={(value) => updateForm("outwardDate", value)}
                    required
                  />
                  <Field
                    label="Required Delivery Date"
                    type="date"
                    value={form.requiredDate}
                    min={form.outwardDate}
                    onChange={(value) => updateForm("requiredDate", value)}
                  />
                </div>

                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-extrabold text-blue-900 dark:text-blue-200">
                        Sales Order Selection
                      </p>
                      <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                        Choose a confirmed Sales Order to load its customer, warehouse and items.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => setShowOrderPicker((value) => !value)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: BLUE }}
                    >
                      <Search size={15} />
                      {form.salesOrderNo ? "Change Sales Order" : "Select Sales Order"}
                    </button>
                  </div>

                  {showOrderPicker && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-white p-3 dark:border-blue-900 dark:bg-gray-900">
                      <input
                        value={orderSearch}
                        onChange={(event) => setOrderSearch(event.target.value)}
                        placeholder="Search by SO number or customer..."
                        className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-950"
                      />
                      <div className="space-y-2">
                        {orderOptions.map((order) => (
                          <button
                            type="button"
                            key={order.orderNo}
                            onClick={() => selectOrder(order)}
                            className="flex w-full flex-col justify-between gap-2 rounded-lg border border-gray-100 p-3 text-left hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:hover:bg-blue-950/30 sm:flex-row sm:items-center"
                          >
                            <span>
                              <span className="block text-sm font-bold">{order.orderNo}</span>
                              <span className="mt-1 block text-xs text-gray-500">{order.customer}</span>
                            </span>
                            <span className="text-xs font-semibold" style={{ color: BLUE }}>
                              {order.warehouse}
                            </span>
                          </button>
                        ))}
                        {orderOptions.length === 0 && (
                          <p className="p-3 text-sm text-gray-500">No matching demo orders.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {errors.salesOrderNo && (
                    <p className="mt-2 text-xs font-semibold text-red-600">{errors.salesOrderNo}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Field
                    label="Sales Order Number"
                    value={form.salesOrderNo}
                    disabled
                    required
                    hint="Select an order above to load its details."
                  />
                  <Field label="Customer Name" value={form.customer} disabled required />
                  <Field label="Customer Code" value={form.customerCode} disabled />
                  <Field
                    label="Warehouse"
                    value={form.warehouse}
                    disabled
                    required
                  />
                  <Field
                    label="Priority"
                    value={form.priority}
                    onChange={(value) => updateForm("priority", value as OutwardForm["priority"])}
                    options={["Normal", "High", "Urgent"]}
                    disabled={locked}
                  />
                  <Field
                    label="Contact Person"
                    value={form.contactPerson}
                    onChange={(value) => updateForm("contactPerson", value)}
                    disabled={locked}
                  />
                  <Field
                    label="Contact Phone"
                    value={form.contactPhone}
                    onChange={(value) => updateForm("contactPhone", value)}
                    disabled={locked}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Delivery Address"
                      value={form.deliveryAddress}
                      onChange={(value) => updateForm("deliveryAddress", value)}
                      type="textarea"
                      disabled={locked}
                    />
                  </div>
                  <div className="sm:col-span-2 xl:col-span-3">
                    <Field
                      label="Outward Remarks"
                      value={form.remarks}
                      onChange={(value) => updateForm("remarks", value)}
                      type="textarea"
                      placeholder="Enter special handling or delivery instructions..."
                      disabled={locked}
                    />
                  </div>
                </div>
              </Panel>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => saveRecord("Draft")}
                  disabled={saving || locked}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold disabled:opacity-50 dark:border-gray-700"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("items")}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                  style={{ backgroundColor: RED }}
                >
                  Continue to Item Plan <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ITEM PLAN */}
          {activeTab === "items" && (
            <>
              <Panel
                title="Sales Order Item Plan"
                description="Review order balance and available stock before deciding how much to include in this outward. Multiple outward documents may be created for partial fulfilment."
              >
                {errors.items && (
                  <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.items}</p>
                )}

                {!form.salesOrderNo && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Select a Sales Order in Basic Details before editing the item plan.
                    <button
                      type="button"
                      onClick={() => setActiveTab("basic")}
                      className="ml-2 font-bold underline"
                    >
                      Go to Basic Details
                    </button>
                  </div>
                )}

                <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <Kpi label="Order Qty" value={totals.ordered} tone="blue" />
                  <Kpi label="Outward Qty" value={totals.outward} tone="red" />
                  <Kpi label="Picked Qty" value={totals.picked} tone="teal" />
                  <Kpi label="Available Stock" value={totals.available} tone="dark" />
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full min-w-[1200px] text-left">
                    <thead>
                      <tr style={{ backgroundColor: RED }}>
                        {[
                          "SKU / Description",
                          "UOM",
                          "Order Qty",
                          "Previously Outwarded",
                          "Order Balance",
                          "Available Stock",
                          "Outward Qty",
                          "Bin",
                          "Action",
                        ].map((heading) => (
                          <th key={heading} className="whitespace-nowrap px-3 py-3 text-xs font-bold text-white">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {items.map((item) => {
                        const balance = Math.max(0, item.orderedQty - item.previouslyOutwardedQty);
                        const invalid = item.outwardQty > balance || item.outwardQty > item.availableStock;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                            <td className="px-3 py-3">
                              <p className="text-sm font-bold">{item.sku}</p>
                              <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                            </td>
                            <td className="px-3 py-3 text-sm">{item.uom}</td>
                            <td className="px-3 py-3 text-sm font-semibold">{item.orderedQty}</td>
                            <td className="px-3 py-3 text-sm">{item.previouslyOutwardedQty}</td>
                            <td className="px-3 py-3 text-sm font-bold">{balance}</td>
                            <td className="px-3 py-3">
                              <span className={cn("text-sm font-bold", item.availableStock < item.outwardQty ? "text-red-600" : "text-green-700")}>
                                {item.availableStock}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min={0}
                                max={Math.min(balance, item.availableStock)}
                                disabled={locked}
                                value={item.outwardQty}
                                onChange={(event) => updateItem(item.id, "outwardQty", Number(event.target.value))}
                                className={cn(
                                  "w-24 rounded-lg border px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-red-100 dark:bg-gray-950",
                                  invalid ? "border-red-400" : "border-gray-200 dark:border-gray-700"
                                )}
                              />
                              {invalid && (
                                <p className="mt-1 max-w-32 text-[10px] text-red-600">
                                  Exceeds stock or order balance
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                value={item.bin}
                                disabled={locked}
                                onChange={(event) => updateItem(item.id, "bin", event.target.value)}
                                className="w-28 rounded-lg border border-gray-200 px-2 py-2 text-xs dark:border-gray-700 dark:bg-gray-950"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                disabled={locked}
                                onClick={() => removeItem(item.id)}
                                title="Remove item line"
                                className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                            No items loaded. Select a Sales Order in Basic Details.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                  <strong>Business rule:</strong> Outward quantity must not exceed the remaining Sales Order quantity or the stock available in the selected warehouse. Stock availability shown here is sample data until the inventory API is connected.
                </div>
              </Panel>

              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold dark:border-gray-700"
                >
                  Back
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving || locked}
                    onClick={() => saveRecord("Draft")}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold disabled:opacity-50 dark:border-gray-700"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={locked || items.length === 0}
                    onClick={startPicking}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: RED }}
                  >
                    Start Picking <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PICKING & PACKING */}
          {activeTab === "picking" && (
            <>
              <Panel
                title="Picking & Packing"
                description="Record the actual picked quantity and packed quantity for each planned line. Quantities cannot exceed the outward quantity."
              >
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Assigned Picker" value={form.picker} onChange={(value) => updateForm("picker", value)} placeholder="Enter picker name" disabled={locked} />
                  <Field label="Assigned Packer" value={form.packer} onChange={(value) => updateForm("packer", value)} placeholder="Enter packer name" disabled={locked} />
                  <div className="flex items-end">
                    <div className="w-full rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                      <p className="text-xs text-blue-800 dark:text-blue-200">Picking Status</p>
                      <p className="mt-1 text-sm font-extrabold">{status}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr style={{ backgroundColor: RED }}>
                        {["SKU", "Description", "Bin", "Outward Qty", "Picked Qty", "Packed Qty", "Progress"].map((heading) => (
                          <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-bold text-white">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {items.map((item) => {
                        const complete = item.outwardQty > 0 && item.pickedQty === item.outwardQty && item.packedQty === item.outwardQty;
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-4 text-sm font-bold">{item.sku}</td>
                            <td className="px-4 py-4 text-sm">{item.description}</td>
                            <td className="px-4 py-4 text-sm">{item.bin || "—"}</td>
                            <td className="px-4 py-4 text-sm font-bold">{item.outwardQty}</td>
                            <td className="px-4 py-4">
                              <input
                                type="number"
                                min={0}
                                max={item.outwardQty}
                                value={item.pickedQty}
                                disabled={locked}
                                onChange={(event) => updateItem(item.id, "pickedQty", Number(event.target.value))}
                                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="number"
                                min={0}
                                max={item.pickedQty}
                                value={item.packedQty}
                                disabled={locked}
                                onChange={(event) => updateItem(item.id, "packedQty", Number(event.target.value))}
                                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", complete ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300")}>
                                {complete ? "Complete" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {!items.length && (
                        <tr>
                          <td colSpan={7} className="p-10 text-center text-sm text-gray-500">Select a Sales Order first.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" onClick={() => setActiveTab("items")} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold dark:border-gray-700">Back to Item Plan</button>
                <button
                  type="button"
                  disabled={locked || !items.length}
                  onClick={markReadyForIssue}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: RED }}
                >
                  <CheckCircle2 size={16} /> Mark Ready for Issue
                </button>
              </div>
            </>
          )}

          {/* DISPATCH */}
          {activeTab === "dispatch" && (
            <>
              <Panel
                title="Goods Issue & Transport Details"
                description="Confirm issue after picking and packing are complete. Enter transport information before dispatch."
              >
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold">Goods Issue Status</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        Stock must only be deducted by a successful backend inventory issue transaction.
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  {status === "Ready for Issue" && (
                    <button
                      type="button"
                      onClick={() => setShowIssueConfirm(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                      style={{ backgroundColor: RED }}
                    >
                      <CheckCircle2 size={16} /> Confirm Goods Issue
                    </button>
                  )}

                  {status === "Issued" && (
                    <p className="mt-3 text-xs font-semibold text-green-700 dark:text-green-300">
                      Goods Issue is marked in demo mode. Complete the transport details below to dispatch.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label="Transporter" value={form.transporter} onChange={(value) => updateForm("transporter", value)} placeholder="Transport company name" required={status === "Issued"} disabled={locked && status !== "Issued"} />
                  <Field label="Vehicle Number" value={form.vehicleNo} onChange={(value) => updateForm("vehicleNo", value)} placeholder="e.g. AP31AB1234" disabled={locked} />
                  <Field label="LR / Consignment Number" value={form.lrNumber} onChange={(value) => updateForm("lrNumber", value)} placeholder="Enter LR number" disabled={locked} />
                  <Field label="Tracking / AWB Number" value={form.trackingNumber} onChange={(value) => updateForm("trackingNumber", value)} placeholder="Enter tracking number" disabled={locked} />
                  <Field label="Dispatch Date" type="date" value={form.dispatchDate} onChange={(value) => updateForm("dispatchDate", value)} required={status === "Issued"} disabled={locked} />
                  <Field label="Expected Delivery Date" type="date" value={form.expectedDeliveryDate} onChange={(value) => updateForm("expectedDeliveryDate", value)} min={form.dispatchDate || undefined} disabled={locked} />
                  <div className="sm:col-span-2 xl:col-span-3">
                    <Field label="Delivery Remarks" type="textarea" value={form.deliveryRemarks} onChange={(value) => updateForm("deliveryRemarks", value)} placeholder="Delivery instructions, proof of delivery remarks..." disabled={locked} />
                  </div>
                </div>
              </Panel>

              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" onClick={() => setActiveTab("picking")} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold dark:border-gray-700">Back to Picking</button>
                <div className="flex flex-wrap gap-2">
                  {status === "Issued" && (
                    <button
                      type="button"
                      onClick={() => setShowDispatchConfirm(true)}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                      style={{ backgroundColor: RED }}
                    >
                      <Truck size={16} /> Confirm Dispatch
                    </button>
                  )}
                  {status === "Dispatched" && (
                    <button
                      type="button"
                      onClick={markDelivered}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                      style={{ backgroundColor: BLUE }}
                    >
                      <CheckCircle2 size={16} /> Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* HISTORY */}
          {activeTab === "history" && (
            <>
              <Panel title="Current Status" description="Review the current stage and the completed operational steps.">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Outward Number</p>
                    <p className="mt-1 text-lg font-extrabold" style={{ color: RED }}>{form.outwardNo}</p>
                    <p className="mt-1 text-xs text-gray-500">Sales Order: {form.salesOrderNo || "Not selected"}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Customer", form.customer || "—"],
                    ["Warehouse", form.warehouse || "—"],
                    ["Planned Quantity", String(totals.outward)],
                    ["Picked Quantity", String(totals.picked)],
                    ["Packed Quantity", String(totals.packed)],
                    ["Transporter", form.transporter || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                      <p className="text-xs font-semibold text-gray-500">{label}</p>
                      <p className="mt-2 break-words text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Activity History" description="Actions recorded during this browser demo session.">
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: index === 0 ? RED : BLUE }}>
                          <History size={16} />
                        </span>
                        {index !== activities.length - 1 && <span className="mt-1 min-h-6 w-px flex-1 bg-gray-200 dark:bg-gray-700" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-4">
                        <p className="text-sm font-extrabold">{activity.action}</p>
                        <p className="mt-1 text-xs text-gray-500">{activity.user} · {activity.timestamp}</p>
                        {activity.remarks && <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-300">{activity.remarks}</p>}
                      </div>
                    </div>
                  ))}
                  {!activities.length && (
                    <div className="py-10 text-center">
                      <History size={28} className="mx-auto text-gray-400" />
                      <p className="mt-3 text-sm font-bold">No activity recorded yet</p>
                      <p className="mt-1 text-xs text-gray-500">Select a Sales Order or perform an action to start the history.</p>
                    </div>
                  )}
                </div>
              </Panel>

              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" onClick={() => setActiveTab("basic")} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold dark:border-gray-700">Back to Basic Details</button>
                <button
                  type="button"
                  onClick={() => saveRecord(status)}
                  disabled={saving || locked}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: RED }}
                >
                  <Save size={16} /> Save Current Record
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer actions */}
      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:p-5">
        <div>
          <p className="text-sm font-extrabold">Document Actions</p>
          <p className="mt-1 text-xs text-gray-500">
            Current status: {status}. Saving and status changes are local demo operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "Draft" && (
            <button
              type="button"
              disabled={locked}
              onClick={() => saveRecord("Ready for Picking")}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: BLUE }}
            >
              Submit for Picking
            </button>
          )}
          {status !== "Issued" &&
            status !== "Dispatched" &&
            status !== "Delivered" &&
            status !== "Cancelled" && (
              <button
                type="button"
                onClick={cancelOutward}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
              >
                Cancel Outward
              </button>
            )}
          <button
            type="button"
            onClick={() => router.push("/goods-outward")}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold dark:border-gray-700"
          >
            Close
          </button>
        </div>
      </section>

      {/* Goods Issue Confirmation Modal */}
      {showIssueConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <Boxes size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold">Confirm Goods Issue?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  You are confirming issue for {totals.outward} planned units across {totals.lines} item lines.
                  Ensure picking and packing are complete.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Demo warning: this confirmation changes only the page status. It does not deduct stock. A real production issue must be validated and posted by the backend.
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowIssueConfirm(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold dark:border-gray-700">Go Back</button>
              <button type="button" onClick={confirmGoodsIssue} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: RED }}>Confirm Issue (Demo)</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Confirmation Modal */}
      {showDispatchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Truck size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold">Confirm Dispatch?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Confirm that the goods have been handed over to the transporter.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Transporter: {form.transporter || "Not entered"} · Vehicle: {form.vehicleNo || "Not entered"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDispatchConfirm(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold dark:border-gray-700">Go Back</button>
              <button type="button" onClick={confirmDispatch} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: BLUE }}>Confirm Dispatch</button>
            </div>
          </div>
        </div>
      )}

      {/* Demo disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <strong>Demo mode:</strong> Sales Orders, item quantities, and stock values in this page are sample data. Records are saved in browser local storage. The real application still needs Sales Order, warehouse stock, reservation, stock ledger, Goods Issue, dispatch, and delivery APIs. Do not treat a demo status change as an actual inventory transaction.
      </div>
    </div>
  );
}
