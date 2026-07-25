"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import  { useRouter } from "next/navigation";
import AttachmentList from "@/components/AttachmentList";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Tabs */
type TabKey = "basic" | "items" | "delivery" | "attachments" | "status";

/** Enums */
type Priority = "Low" | "Medium" | "High" | "Critical" | "";
type PRType = "Capex" | "Opex" | "Service" | "";

/** ✅ UPDATED: PR Status includes Pending Approval */
type PRStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Cancelled";

type ItemType = "Inventory" | "Non-inventory" | "Service";
type Currency = "INR" | "USD" | "EUR";
type AttachmentType = "Quotation" | "Spec" | "Drawing" | "Other";

/** Basic master sample data */
const DEPARTMENTS = ["Stores", "Maintenance", "Production", "IT", "Finance", "Admin"] as const;





/** Form Types */
type PRItemLine = {
  pr_item_id: string; // system
  item_type: ItemType; // required
  item_id: string; // conditional (if Inventory)
  item_description: string; // required
  uom: string; // required
  requested_qty: string; // required decimal > 0
  estimated_unit_price: string; // optional >= 0
  estimated_total_cost: number; // system qty * price
  required_by_date: string; // required >= today
  preferred_vendor: string; // optional
};

type PRAttachment = {
  attachment_id: string; // system
  attachment_type: AttachmentType;
  attachment_file: File | null;
};

type PRFormState = {
  /** Basic */
  pr_id: string; // system UUID
  pr_number: string; // system PR-YYYY-SEQ
  pr_date: string; // system auto
  requested_by: string; // logged in user
  department: string; // required
  project_code: string; // optional
  cost_center: string; // required
  priority: Priority; // required default Medium
  pr_type: PRType; // required
  justification: string; // required min 10
  pr_status: PRStatus; // system-driven

  /** Items (lines) */
  items: PRItemLine[];

  /** Delivery & Costing */
  delivery_location: string; // warehouse id required
  delivery_address: string; // system (read-only from warehouse)
  budget_available: boolean; // system (integration) - demo
  budget_reference: string; // optional
  currency: Currency; // required default INR
  tax_estimate: string; // optional >= 0
  estimated_pr_value: number; // system sum(items total)
  total_estimated_cost: number; // system value + tax

  /** Attachments & Notes */
  attachments: PRAttachment[];
  internal_notes: string; // optional
  audit_comments: string; // system (approval remarks)

  /** Audit */
  compliance_verified_by: string; // system
  compliance_verified_date: string; // system
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "items", label: "Item Details" },
  { key: "delivery", label: "Delivery & Costing" },
  { key: "attachments", label: "Attachments & Notes" },
  { key: "status", label: "Status & Audit" },
];

/** UI helpers */
const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase = "text-sm font-medium text-gray-700 dark:text-gray-200";
const helperBase = "text-xs text-gray-500 dark:text-gray-400";

const primaryBtn =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white " +
  "shadow-theme-sm focus:outline-none focus:ring-3 focus:ring-brand-500/20";

const outlineBtn =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 " +
  "shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5";

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function uuidLike(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Math.random().toString(16).slice(2, 8)}`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isFutureOrToday(dateStr: string) {
  if (!dateStr) return false;
  const t = new Date(todayISO());
  const d = new Date(dateStr);
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() >= t.getTime();
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function moneyINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

const initialState: PRFormState = {
  pr_id: "Auto-generated",
  pr_number: "Auto (PR-YYYY-SEQ)",
  pr_date: todayISO(),
  requested_by: "Logged-in user",
  department: "",
  project_code: "",
  cost_center: "",
  priority: "Medium",
  pr_type: "",
  justification: "",
  pr_status: "Draft",

  items: [],

  delivery_location: "",
  delivery_address: "",
  budget_available: true,
  budget_reference: "",
  currency: "INR",
  tax_estimate: "",
  estimated_pr_value: 0,
  total_estimated_cost: 0,

  attachments: [],
  internal_notes: "",
  audit_comments: "System",

  compliance_verified_by: "Auto",
  compliance_verified_date: "Auto",
};

export default function PurchaseRequisitionCreatePage() {
  const router = useRouter(); 

  const searchParams = useSearchParams();

  const prId = searchParams.get("id");
const mode = searchParams.get("mode");

const isView = mode === "view";
const isEdit = mode === "edit";


//view mode useEffect to fetch PR data and populate form//

useEffect(() => {
  console.log("🔥 VIEW MODE FETCH TRIGGERED:", prId);

  if (!prId) return;

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/${prId}`)
    .then(res => res.json())
    .then(res => {
      console.log("🔥 PR DATA:", res);

      if (!res.success) return;

      const { header, items, attachments } = res.data;

      setForm(prev => ({
        ...prev,

        pr_id: header.pr_id,
        pr_number: header.pr_number,
        pr_date: header.created_at?.split("T")[0] || "",
        requested_by: header.requested_by,

        department: header.department,
        cost_center: header.cost_center,
        project_code: header.project_code,
        priority: header.priority,
        pr_type: header.pr_type,
        justification: header.justification,
        internal_notes: header.internal_notes || "",
        pr_status: header.status,

        delivery_location: header.delivery_location,
        delivery_address: header.delivery_address,
        currency: header.currency,
        tax_estimate: String(header.tax_estimate || ""),

        estimated_pr_value: header.estimated_pr_value || 0,
        total_estimated_cost: header.total_estimated_cost || 0,



        items: items.map((it: any) => ({
          pr_item_id: it.pr_item_id,
          item_type: it.item_type,
          item_id: it.item_id,
          item_description: it.item_description,
          uom: it.uom,
          requested_qty: String(it.requested_qty),
          estimated_unit_price: String(it.estimated_unit_price),
          estimated_total_cost: it.estimated_total_cost,
          required_by_date: it.required_by_date?.split("T")[0],
          preferred_vendor: it.preferred_vendor || "" ,


        })),

        //attchments from DB//

                attachments: (attachments || []).map((a: any) => ({
                  attachment_id: a.attachment_id,
                  attachment_type: a.attachment_type || "Other",
                  attachment_file: null, // existing file → no File object
                  file_name: a.file_name,
                  file_path: a.file_path
                  })),



      }));
    })
    .catch(err => console.error("❌ FETCH ERROR:", err));

}, [prId]);

console.log("PR ID:", prId);
console.log("MODE:", mode);


  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<PRFormState>(initialState);

const [itemsMaster, setItemsMaster] = useState<any[]>([]);
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`)
    .then(res => res.json())
    .then(data => {
      setItemsMaster(data);
    })
    .catch(err => console.error(err));
}, []);


// useEffect(() => {
//   if (!prId) return;

//   fetch(`http://localhost:5000/api/pr/${prId}`)
//     .then(res => res.json())
//     .then(res => {
//       if (!res.success) return;

//       const { header, items } = res.data;

//       setForm(prev => ({
//         ...prev,

//         pr_id: header.pr_id,
//         pr_number: header.pr_number,
//         pr_date: header.created_at?.split("T")[0] || "",
//         requested_by: header.requested_by,

//         department: header.department || "",
//         cost_center: header.cost_center || "",
//         project_code: header.project_code || "",
//         priority: header.priority || "",
//         pr_type: header.pr_type || "",
//         justification: header.justification || "",
//         pr_status: header.status || "Draft",

//         delivery_location: header.delivery_location || "",
//         delivery_address: header.delivery_address || "",
//         currency: header.currency || "INR",
//         tax_estimate: String(header.tax_estimate || ""),

//         estimated_pr_value: header.estimated_pr_value || 0,
//         total_estimated_cost: header.total_estimated_cost || 0,

//         items: items.map((it: any) => ({
//           pr_item_id: it.pr_item_id,
//           item_type: it.item_type,
//           item_id: it.item_id || "",
//           item_description: it.item_description || "",
//           uom: it.uom || "",
//           requested_qty: String(it.requested_qty || ""),
//           estimated_unit_price: String(it.estimated_unit_price || ""),
//           estimated_total_cost: it.estimated_total_cost || 0,
//           required_by_date: it.required_by_date?.split("T")[0] || "",
//           preferred_vendor: it.preferred_vendor || "",
//         }))
//       }));
//     });
// }, [prId]);


const [vendors, setVendors] = useState<Array<{ id?: string; vendor_id?: string; name: string }>>([]);

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors`)
    .then(res => res.json())
    .then(data => {
      console.log("VENDORS API:", data);
      setVendors(data);
    })
    .catch(err => console.error(err));
}, []);

const [warehouses, setWarehouses] = useState<any[]>([]);

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/warehouses`)
    .then(res => res.json())
    .then(data => {
      console.log("WAREHOUSE OBJECT:", warehouses[0]);
      setWarehouses(data.data || data);
    })
    .catch(err => console.error(err));
}, []);

//  //(Search dropdown states)//
//   const [showItemDropdown, setShowItemDropdown] = useState<Record<number, boolean>>({});
//   const [itemSearch, setItemSearch] = useState<Record<number, string>>({});

//   useEffect(() => {
//   const close = (e) => {
//     if (!e.target.closest(".item-dropdown")) {
//       setShowItemDropdown({});
//     }
//   };

//   window.addEventListener("click", close);
//   return () => window.removeEventListener("click", close);
// }, []);

//item search popup states
const [showItemModal, setShowItemModal] = useState(false);
const [activeIndex, setActiveIndex] = useState<number | null>(null);
const [itemSearch, setItemSearch] = useState("");

const [showVendorModal, setShowVendorModal] = useState(false);
const [activeVendorIndex, setActiveVendorIndex] = useState<number | null>(null);
const [vendorSearch, setVendorSearch] = useState("");

const [showWarehouseModal, setShowWarehouseModal] = useState(false);
const [warehouseSearch, setWarehouseSearch] = useState("");


  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** ✅ Lock editing after leaving Draft */
const isLocked = isView;

  /** Derived totals */
  const totals = useMemo(() => {
    const value = form.items.reduce((sum, line) => sum + (line.estimated_total_cost || 0), 0);
    const tax = form.tax_estimate.trim() ? toNum(form.tax_estimate) : 0;
    const taxOk = Number.isFinite(tax) && tax >= 0 ? tax : 0;
    return {
      estimated_pr_value: value,
      total_estimated_cost: value + taxOk,
    };
  }, [form.items, form.tax_estimate]);

  /** Keep totals in state */
  useEffect(() => {
    setForm((p) => ({
      ...p,
      estimated_pr_value: totals.estimated_pr_value,
      total_estimated_cost: totals.total_estimated_cost,
    }));
  }, [totals.estimated_pr_value, totals.total_estimated_cost]);

  /** Auto-PR from Smart Alerts */
  useEffect(() => {
    const flag = searchParams.get("autopr");
    if (!flag) return;

    try {
      const raw = sessionStorage.getItem("auto_pr_draft");
      if (!raw) return;
      const data = JSON.parse(raw);

      if (!data?.items?.length) return;

      const autoItems: PRItemLine[] = data.items.map((it: any) => {
        const requested_qty = String(it.requested_qty ?? "");
        const estimated_unit_price = String(it.estimated_unit_price ?? "");
        const q = toNum(requested_qty);
        const p = toNum(estimated_unit_price);
        const qty = Number.isFinite(q) && q > 0 ? q : 0;
        const price = Number.isFinite(p) && p >= 0 ? p : 0;
        return {
          pr_item_id: uuidLike("PRITEM"),
          item_type: "Inventory",
          item_id: String(it.item_id ?? ""),
          item_description: String(it.item_description ?? ""),
          uom: String(it.uom ?? ""),
          requested_qty,
          estimated_unit_price,
          estimated_total_cost: qty * price,
          required_by_date: todayISO(),
          preferred_vendor: "",
        };
      });

      setForm((p) => ({
        ...p,
        justification: p.justification || "Auto PR from Smart Alerts.",
        items: autoItems,
      }));
      setActiveTab("items");
      sessionStorage.removeItem("auto_pr_draft");
    } catch {
      // ignore malformed payload
    }
  }, [searchParams]);

  /** Validations */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // BASIC
    if (!form.department.trim()) e.department = "Department is required";
    if (!form.cost_center.trim()) e.cost_center = "Cost Center is required";
    if (!form.priority) e.priority = "Priority is required";
    if (!form.pr_type) e.pr_type = "PR Type is required";

    if (!form.justification.trim()) e.justification = "Justification is required";
    else if (form.justification.trim().length < 10) e.justification = "Min 10 characters";

    // Delivery & Costing
    if (!form.delivery_location) e.delivery_location = "Delivery Location is required";
    if (!form.currency) e.currency = "Currency is required";

    if (form.tax_estimate.trim()) {
      const n = toNum(form.tax_estimate);
      if (!Number.isFinite(n) || n < 0) e.tax_estimate = "Tax estimate must be >= 0";
    }

    // Item lines validations
    form.items.forEach((line, idx) => {
      const prefix = `item_${idx}_`;

      // if (!line.item_type) e[prefix + "item_type"] = "Item Type is required";

      if (line.item_type === "Inventory" && !line.item_id.trim()) {
        e[prefix + "item_id"] = "Item ID required for Inventory";
      }

      if (!line.item_description.trim()) e[prefix + "item_description"] = "Description is required";
      if (!line.uom.trim()) e[prefix + "uom"] = "UOM is required";

      if (!line.requested_qty.trim()) e[prefix + "requested_qty"] = "Qty is required";
      else {
        const q = toNum(line.requested_qty);
        if (!Number.isFinite(q) || q <= 0) e[prefix + "requested_qty"] = "Qty must be > 0";
      }

      if (line.estimated_unit_price.trim()) {
        const p = toNum(line.estimated_unit_price);
        if (!Number.isFinite(p) || p < 0) e[prefix + "estimated_unit_price"] = "Unit Price must be >= 0";
      }

      if (!line.required_by_date) e[prefix + "required_by_date"] = "Required By date is required";
      else if (!isFutureOrToday(line.required_by_date)) e[prefix + "required_by_date"] = "Date must be today or future";
    });

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof PRFormState>(key: K, value: PRFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const markTouched = (key: string) => {
    setTouched((p) => ({ ...p, [key]: true }));
  };

  const showError = (key: string) => Boolean(touched[key] && errors[key]);

  const firstErrorTab = () => {
    const order: TabKey[] = ["basic", "items", "delivery", "attachments", "status"];
    const basicKeys = ["department", "cost_center", "priority", "pr_type", "justification"];
    const deliveryKeys = ["delivery_location", "currency", "tax_estimate"];
    const itemErr = Object.keys(errors).some((k) => k.startsWith("item_"));

    for (const t of order) {
      if (t === "basic" && basicKeys.some((k) => errors[k])) return "basic";
      if (t === "items" && itemErr) return "items";
      if (t === "delivery" && deliveryKeys.some((k) => errors[k])) return "delivery";
    }
    return "basic";
  };

  /** Items helpers */
  const recalcLineTotal = (line: PRItemLine) => {
    const q = toNum(line.requested_qty);
    const p = line.estimated_unit_price.trim() ? toNum(line.estimated_unit_price) : 0;
    const qty = Number.isFinite(q) && q > 0 ? q : 0;
    const price = Number.isFinite(p) && p >= 0 ? p : 0;
    return qty * price;
  };

  const addItem = () => {
    if (isLocked) return;

    const newLine: PRItemLine = {
      pr_item_id: uuidLike("PRITEM"),
      item_type: "Inventory",
      item_id: "",
      item_description: "",
      uom: "",
      requested_qty: "",
      estimated_unit_price: "",
      estimated_total_cost: 0,
      required_by_date: todayISO(),
      preferred_vendor: "",
    };

    setForm((p) => ({ ...p, items: [...p.items, newLine] }));
    setActiveTab("items");
  };

  const updateItem = (idx: number, patch: Partial<PRItemLine>) => {
    if (isLocked) return;



    setForm((p) => {
      const next = [...p.items];
      const merged = { ...next[idx], ...patch };
      merged.estimated_total_cost = recalcLineTotal(merged);
      next[idx] = merged;
      return { ...p, items: next };
    });
  };


const removeItem = (idx: number) => {
  if (isLocked) return;
  setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
};

const handleItemSelect = (idx: number, itemCode: string) => {
  if (isLocked) return;
  const selectedItem = itemsMaster.find((it: any) => it.code === itemCode);
  if (selectedItem) {
    updateItem(idx, { 
      item_id: itemCode,
      item_description: selectedItem.name,
      uom: selectedItem.uom || ""
    });
  }
};

  /** Delivery location -> address auto */
  const onSelectWarehouse = (warehouseId: string) => {
    if (isLocked) return;
    const wh = warehouses.find((w) => (w.warehouse_id || w.id) === warehouseId);
    setForm((p) => ({
      ...p,
      delivery_location: warehouseId,
      delivery_address: wh?.address ?? "",
    }));
  };

  /** Attachments */
  const addAttachment = () => {
    if (isLocked) return;
    setForm((p) => ({
      ...p,
      attachments: [
        ...p.attachments,
        { attachment_id: uuidLike("ATT"), attachment_type: "Quotation", attachment_file: null },
      ],
    }));
  };

  const updateAttachment = (idx: number, patch: Partial<PRAttachment>) => {
    if (isLocked) return;
    setForm((p) => {
      const next = [...p.attachments];
      next[idx] = { ...next[idx], ...patch };
      return { ...p, attachments: next };
    });
  };

  const removeAttachment = (idx: number) => {
    if (isLocked) return;
    setForm((p) => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }));
  };

  /** Save actions */
  const touchAll = () => {
    const next: Record<string, boolean> = { ...touched };

    ["department", "cost_center", "priority", "pr_type", "justification", "delivery_location", "currency", "tax_estimate"].forEach(
      (k) => (next[k] = true)
    );

    form.items.forEach((_, idx) => {
      next[`item_${idx}_item_type`] = true;
      next[`item_${idx}_item_id`] = true;
      next[`item_${idx}_item_description`] = true;
      next[`item_${idx}_uom`] = true;
      next[`item_${idx}_requested_qty`] = true;
      next[`item_${idx}_estimated_unit_price`] = true;
      next[`item_${idx}_required_by_date`] = true;
    });

    setTouched(next);
  };

  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  const onSaveDraft = async () => {
    console.log("🔥 INTERNAL NOTES:", form.internal_notes); 

  try {

    console.log("FORM ATTACHMENTS:", form.attachments);
    
    // 🔴 VALIDATION
    if (form.items.length === 0) {
      alert("Add at least one item");
      setActiveTab("items");
      return;
    }

    // 🔥 PREPARE PAYLOAD
   const payload = {

  requested_by: form.requested_by,
  department: form.department || null,
  cost_center: form.cost_center || null,
  project_code: form.project_code || null,
  priority: form.priority || null,
  pr_type: form.pr_type || null,
  justification: form.justification || null,
  internal_notes: form.internal_notes || null,
  delivery_location: form.delivery_location,
  delivery_address: form.delivery_address,
  currency: form.currency,
  tax_estimate: form.tax_estimate,

  // 🔥 ITEMS
  items: form.items.map((item) => ({
    item_type: item.item_type,
    item_id: item.item_id,
    item_description: item.item_description,
    uom: item.uom,
    requested_qty: item.requested_qty,
    estimated_unit_price: item.estimated_unit_price,
    required_by_date: item.required_by_date,
    preferred_vendor: String(item.preferred_vendor || ""),
  })),

  
 



  // 🔥 ADD THIS (IMPORTANT)
  attachments: form.attachments.map((a) => ({
    file_name: a.attachment_file?.name || "",
    file_url: "" // later we handle file upload
  }))
};

    console.log("FINAL PAYLOAD:", payload);

    //formdata is needed to send files

    // 🔥 CREATE FORMDATA
const formData = new FormData();



// 🔹 Add normal fields
Object.keys(payload).forEach((key) => {
  if (key !== "attachments" && key !== "items") {
    formData.append(key, String((payload as Record<string, any>)[key] ?? ""));
  }
});

formData.append("items", JSON.stringify(payload.items || []));
// 🔹 Add files
form.attachments.forEach((a) => {
  if (a.attachment_file) {
    formData.append("attachments", a.attachment_file);
  }
});

const url = isEdit
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/pr/update/${prId}`
  : `${process.env.NEXT_PUBLIC_API_URL}/api/pr/create`;
const method = isEdit ? "PUT" : "POST";

const res = await fetch(url, {
  method,
  body: formData,
});

    // // 🔥 API CALL
    // const res = await fetch("http://localhost:5000/api/pr/create", {
    //   method: "POST",
      
    //   body: formData,
    // });

    const data = await res.json();

    if (data.success) {
      alert("PR Saved Successfully");

       

      // 🔥 RESET FORM
      setForm(initialState);

      // 🔥 REDIRECT TO LIST
    router.push("/PurchaseRequisitionList");
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error saving PR");
  }
};

  /** ✅ NEW: Send for Approval (does validations) */
  const onSendForApproval = async () => {
  if (!prId) {
    alert("Save PR before submitting");
    return;
  }

try {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pr_id: prId }),
    }
  );

    const data = await res.json();

    if (data.success) {
      alert("PR Sent for Approval");
      router.push("/PurchaseRequisitionList");
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error submitting PR");
  }
};

  /** OPTIONAL: Keep old function name if you use it in other places */
  const onSubmitForApproval = onSendForApproval;

  return (
    /** ✅ FIX: Force this page to never create viewport horizontal scroll */
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="Purchase Requisition (PR)" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PR Creation</h3>
          <p className={helperBase}>Step 1: Items → Step 2: Qty & Required Date → Step 3: Send for Approval.</p>

          {isLocked && (
            <p className="mt-1 text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
              Locked: PR cannot be edited after sending for approval.
            </p>
          )}
        </div>

        {!isView && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineBtn} onClick={onReset} disabled={isLocked}>
            Reset
          </button>

          <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSaveDraft}
            disabled={isLocked}
          >
            Save Draft
          </button>

          {/* ✅ CHANGED: Send for Approval */}
          <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSendForApproval}
            disabled={isLocked}
          >
            Send for Approval
          </button>
        </div>
        )}
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
                  isActive ? "text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
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

        {/* Content */}
        <div className="p-4 sm:p-6 min-w-0">
          {/* BASIC */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    PR ID <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input
                    readOnly
                    value={form.pr_id}
                    className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      PR Number <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input
                      readOnly
                      value={form.pr_number}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                  <div>
                    <label className={labelBase}>
                      PR Date <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input
                      readOnly
                      value={form.pr_date}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Requested By <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input
                    readOnly
                    value={form.requested_by}
                    className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      Department <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.department}
                      disabled={isLocked}
                      onChange={(e) => setField("department", e.target.value)}
                      onBlur={() => markTouched("department")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("department") && "border-brand-500"
                      )}
                    >
                      <option value="">Select</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {showError("department") && <p className="mt-1 text-xs text-brand-500">{errors.department}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      Cost Center <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      value={form.cost_center}
                      disabled={isLocked}
                      onChange={(e) => setField("cost_center", e.target.value)}
                      onBlur={() => markTouched("cost_center")}
                      placeholder="Example: CC-001"
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("cost_center") && "border-brand-500"
                      )}
                    />
                    {showError("cost_center") && <p className="mt-1 text-xs text-brand-500">{errors.cost_center}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Project Code <span className={helperBase}>(Optional)</span>
                  </label>
                  <input
                    value={form.project_code || ""}
                    disabled={isLocked}
                    onChange={(e) => setField("project_code", e.target.value)}
                    placeholder="Example: PRJ-ALPHA"
                    className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      Priority <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.priority}
                      disabled={isLocked}
                      onChange={(e) => setField("priority", e.target.value as Priority)}
                      onBlur={() => markTouched("priority")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("priority") && "border-brand-500"
                      )}
                    >
                      <option value="">Select</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    {showError("priority") && <p className="mt-1 text-xs text-brand-500">{errors.priority}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      PR Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.pr_type}
                      disabled={isLocked}
                      onChange={(e) => setField("pr_type", e.target.value as PRType)}
                      onBlur={() => markTouched("pr_type")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("pr_type") && "border-brand-500"
                      )}
                    >
                      <option value="">Select</option>
                      <option value="Capex">Capex</option>
                      <option value="Opex">Opex</option>
                      <option value="Service">Service</option>
                    </select>
                    {showError("pr_type") && <p className="mt-1 text-xs text-brand-500">{errors.pr_type}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Justification <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <textarea
                    value={form.justification}
                    disabled={isLocked}
                    onChange={(e) => setField("justification", e.target.value)}
                    onBlur={() => markTouched("justification")}
                    placeholder="Business justification (min 10 chars)"
                    className={classNames(
                      inputBase,
                      "min-h-[120px] resize-y",
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("justification") && "border-brand-500"
                    )}
                  />
                  {showError("justification") && <p className="mt-1 text-xs text-brand-500">{errors.justification}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> PR will feed into RFQ → PO after approval.
                </div>

                {!isView && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={classNames(primaryBtn, "active:scale-95")}
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                    onClick={addItem}
                    disabled={isLocked}
                  >
                    + Add Item
                  </button>

                  <button
                    type="button"
                    className={classNames(outlineBtn, "active:scale-95")}
                    onClick={() => setActiveTab("items")}
                  >
                    Go to Item Details →
                  </button>
                </div>
                )}
              </div>
            </div>
          )}

          {/* ITEMS */}
          {activeTab === "items" && (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item Grid</h4>
                  <p className={helperBase}>Add multiple lines. Inline edit supported.</p>
                </div>
                {!isView && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={classNames(primaryBtn, "active:scale-95")}
                    style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                    onClick={addItem}
                    disabled={isLocked}
                  >
                    + Add Item
                  </button>
                </div>
                )}

              </div>

              {/* ✅ H-scroll ONLY inside this box (bottom scrollbar) */}
              <div className="w-full overflow-x-auto overflow-visible relative">
                <table className="w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      {/* <th className="px-4 py-3 text-left">Item Type *</th> */}
                      <th className="px-4 py-3 text-left w-[180px]">Item Code *</th>
                      <th className="px-4 py-3 text-left w-[260px]">Description *</th>
                      <th className="px-4 py-3 text-left w-[120px]">UOM *</th>
                      <th className="px-4 py-3 text-left w-[100px]">Qty *</th>
                      <th className="px-4 py-3 text-left w-[120px]">Unit Price</th>
                      <th className="px-4 py-3 text-left w-[120px]">Total</th>
                      <th className="px-4 py-3 text-left w-[160px]">Required By *</th>
                      <th className="px-4 py-3 text-left w-[200px]">Preferred Vendor</th>
                      <th className="px-4 py-3 text-left w-[100px]">Action</th>
                    </tr>
                  </thead>

                  <tbody className="dark:text-gray-200">
                    {form.items.map((line, idx) => {
                      const k = (name: string) => `item_${idx}_${name}`;

                      return (
                        <tr
                          key={line.pr_item_id}
                          className="border-b hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                        >
                          {/* <td className="px-4 py-3">
                            <select
                              value={line.item_type || ""}
                              disabled={isLocked}
                              onChange={(e) =>
                                updateItem(idx, { item_type: e.target.value as ItemType })
                              }
                              onBlur={() => markTouched(k("item_type"))}
                              className={classNames(
                                inputBase,
                                "min-w-[160px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                  showError(k("item_type")) && "border-brand-500"
                              )}
                              >
                              <option value="">Select type</option>
                              <option value="Raw Material">Raw Material</option>
                              <option value="Finished Goods">Finished Goods</option>
                              <option value="Semi-Finished">Semi-Finished</option>
                              <option value="Consumable">Consumable</option>
                              <option value="Service">Service</option>
                            </select>
                            {showError(k("item_type")) && (
                              <p className="mt-1 text-xs text-brand-500">{errors[k("item_type")]}</p>
                            )}
                          </td> */}

                   

                        <td className="px-4 py-3">
  <div
    onClick={() => {
      setShowItemModal(true);
      setActiveIndex(idx);
    }}
    className={classNames(
      inputBase,
      "cursor-pointer flex items-center"
    )}
  >
    {itemsMaster.find((i) => i.code === line.item_id)?.name || (
      <span className="text-gray-400">Select Item</span>
    )}
  </div>
</td>


                          <td className="px-4 py-3">
                            <input
                              value={line.item_description}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { item_description: e.target.value })}
                              onBlur={() => markTouched(k("item_description"))}
                              placeholder="Item/service description"
                              className={classNames(
                                inputBase,
                                "min-w-[260px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("item_description")) && "border-brand-500"
                              )}
                            />
                            {showError(k("item_description")) && (
                              <p className="mt-1 text-xs text-brand-500">{errors[k("item_description")]}</p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.uom}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { uom: e.target.value })}
                              onBlur={() => markTouched(k("uom"))}
                              placeholder="Nos/Kg"
                              className={classNames(
                                inputBase,
                                "min-w-[120px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("uom")) && "border-brand-500"
                              )}
                            />
                            {showError(k("uom")) && <p className="mt-1 text-xs text-brand-500">{errors[k("uom")]}</p>}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.requested_qty}
                              disabled={isLocked}
                              onChange={(e) =>
                                updateItem(idx, { requested_qty: e.target.value.replace(/[^\d.]/g, "") })
                              }
                              onBlur={() => markTouched(k("requested_qty"))}
                              placeholder="> 0"
                              className={classNames(
                                inputBase,
                                "min-w-[100px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("requested_qty")) && "border-brand-500"
                              )}
                            />
                            {showError(k("requested_qty")) && (
                              <p className="mt-1 text-xs text-brand-500">{errors[k("requested_qty")]}</p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              value={line.estimated_unit_price}
                              disabled={isLocked}
                              onChange={(e) =>
                                updateItem(idx, { estimated_unit_price: e.target.value.replace(/[^\d.]/g, "") })
                              }
                              onBlur={() => markTouched(k("estimated_unit_price"))}
                              placeholder=">= 0"
                              className={classNames(
                                inputBase,
                                "min-w-[120px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("estimated_unit_price")) && "border-brand-500"
                              )}
                            />
                            {showError(k("estimated_unit_price")) && (
                              <p className="mt-1 text-xs text-brand-500">{errors[k("estimated_unit_price")]}</p>
                            )}
                          </td>

                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {line.estimated_total_cost ? line.estimated_total_cost.toLocaleString("en-IN") : 0}
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={line.required_by_date}
                              disabled={isLocked}
                              onChange={(e) => updateItem(idx, { required_by_date: e.target.value })}
                              onBlur={() => markTouched(k("required_by_date"))}
                              className={classNames(
                                inputBase,
                                "min-w-[160px]",
                                isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                                showError(k("required_by_date")) && "border-brand-500"
                              )}
                            />
                            {showError(k("required_by_date")) && (
                              <p className="mt-1 text-xs text-brand-500">{errors[k("required_by_date")]}</p>
                            )}
                          </td>

                         <td className="px-4 py-3">
  <div
    onClick={() => {
      setShowVendorModal(true);
      setActiveVendorIndex(idx);
    }}
    className={classNames(
      inputBase,
      "cursor-pointer flex items-center"
    )}
  >
    {vendors.find((v: any) => (v.id || v.vendor_id) === line.preferred_vendor)?.name || (
      <span className="text-gray-400">Select Vendor</span>
    )}
  </div>
</td>
                          {!isView && (
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className={classNames(
                                "text-sm font-semibold text-rose-600 hover:underline",
                                isLocked && "opacity-50 cursor-not-allowed"
                              )}
                              onClick={() => removeItem(idx)}
                              disabled={isLocked}
                            >
                              Remove
                            </button>
                          </td>
                          )}
                        </tr>
                      );
                    })}

                    {form.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300"
                        >
                          No items added. Click “+ Add Item” to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                

              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Rule:</span> PR cannot be submitted without at least one item.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Estimated PR Value: <span className="font-semibold">{moneyINR(form.estimated_pr_value)}</span>
                </div>
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("delivery")}>
                  Next: Delivery & Costing →
                </button>
              </div>
            </div>
          )}

          {/* DELIVERY & COSTING */}
          {activeTab === "delivery" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Delivery Location <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <div
  onClick={() => setShowWarehouseModal(true)}
  className={classNames(inputBase, "cursor-pointer flex items-center")}
>
  {warehouses.find(w => (w.warehouse_id || w.id) === form.delivery_location)?.warehouse_name || (
    <span className="text-gray-400">Select</span>
  )}
</div>
                  {showError("delivery_location") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.delivery_location}</p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>
                    Delivery Address <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <textarea
                    readOnly
                    value={form.delivery_address || ""}
                    className={classNames(
                      inputBase,
                      "min-h-[100px] cursor-not-allowed bg-gray-50 dark:bg-white/5"
                    )}
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Budget</h4>
                  <p className={helperBase}>Budget check flag is system/integration (demo).</p>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Budget Available</span>
                    <span
                      className={classNames(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        form.budget_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      )}
                    >
                      {form.budget_available ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <label className={labelBase}>
                      Budget Reference <span className={helperBase}>(Optional)</span>
                    </label>
                    <input
                      value={form.budget_reference}
                      disabled={isLocked}
                      onChange={(e) => setField("budget_reference", e.target.value)}
                      placeholder="Budget ID"
                      className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Costing Summary</h4>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                    <div>
                      <label className={labelBase}>
                        Currency <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                      </label>
                      <select
                        value={form.currency}
                        disabled={isLocked}
                        onChange={(e) => setField("currency", e.target.value as Currency)}
                        onBlur={() => markTouched("currency")}
                        className={classNames(
                          inputBase,
                          isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("currency") && "border-brand-500"
                        )}
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      {showError("currency") && <p className="mt-1 text-xs text-brand-500">{errors.currency}</p>}
                    </div>

                    <div>
                      <label className={labelBase}>
                        Tax Estimate <span className={helperBase}>(Optional)</span>
                      </label>
                      <input
                        value={form.tax_estimate}
                        disabled={isLocked}
                        onChange={(e) => setField("tax_estimate", e.target.value.replace(/[^\d.]/g, ""))}
                        onBlur={() => markTouched("tax_estimate")}
                        placeholder=">= 0"
                        className={classNames(
                          inputBase,
                          isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("tax_estimate") && "border-brand-500"
                        )}
                      />
                      {showError("tax_estimate") && (
                        <p className="mt-1 text-xs text-brand-500">{errors.tax_estimate}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Estimated PR Value</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{moneyINR(form.estimated_pr_value)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Estimated Cost</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{moneyINR(form.total_estimated_cost)}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Tip:</span> Estimated PR Value comes from Item Grid totals.
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("attachments")}>
                    Next: Attachments & Notes →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Attachments & Notes</h4>
                 
                  <p className={helperBase}>Supporting documents for approvals & audit.</p>
                </div>
                {!isView && (
                <button
                  type="button"
                  className={classNames(primaryBtn, "active:scale-95")}
                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                  onClick={addAttachment}
                  disabled={isLocked}
                >
                  + Add Attachment
                </button> 
                )}

              </div>
               
              <div className="space-y-3">
                {form.attachments.map((a, idx) => (
                  <div
                    key={a.attachment_id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:grid-cols-12 min-w-0"
                  >
                    <div className="sm:col-span-3 min-w-0">
                      <label className={labelBase}>Attachment Type</label>
                      <select
                        value={a.attachment_type}
                        disabled={isLocked}
                        onChange={(e) => updateAttachment(idx, { attachment_type: e.target.value as AttachmentType })}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      >
                        <option value="Quotation">Quotation</option>
                        <option value="Spec">Spec</option>
                        <option value="Drawing">Drawing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-7 min-w-0">
                      <label className={labelBase}>
                        Attachment File <span className={helperBase}>(Optional PDF/DOC/XLS)</span>
                      </label>
                      <input
                        type="file"
                        disabled={isLocked}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={(e) => updateAttachment(idx, { attachment_file: e.target.files?.[0] ?? null })}
                        className={classNames(inputBase, "px-2 py-2", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>
                   
                    <div className="sm:col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        className={classNames("text-sm font-semibold text-rose-600 hover:underline", isLocked && "opacity-50")}
                        onClick={() => removeAttachment(idx)}
                        disabled={isLocked}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {form.attachments.length === 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    No attachments added.
                  </div>
                )}

             {form.attachments.length > 0 && (
    <div className="mt-4">
      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Uploaded Files
      </h5>

      <AttachmentList attachments={form.attachments} />
    </div>
  )}




              </div>





              <div>
                <label className={labelBase}>
                  Internal Notes <span className={helperBase}>(Optional)</span>
                </label>
                <textarea
  value={form.internal_notes || ""}
  disabled={isLocked}
  onChange={(e) => setField("internal_notes", e.target.value)}
  className={classNames(
    inputBase,
    "min-h-[120px] resize-y",
    isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5"
  )}
  placeholder="Notes for approvers"
/>
              </div>

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("status")}>
                  Next: Status & Audit →
                </button>
              </div>
            </div>
          )}

          {/* STATUS */}
          {activeTab === "status" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">PR Status</h4>
                  <p className={helperBase}>Draft / Pending Approval / Approved / Rejected / Cancelled</p>

                  <div className="mt-4">
                    <label className={labelBase}>Status</label>
                    <input
                      readOnly
                      value={form.pr_status}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Approved PR auto-locks. Rejected PR can be resubmitted (future).
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Audit Details</h4>
                  <p className={helperBase}>System generated fields (read-only).</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelBase}>
                        PR Date <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.pr_date}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Requested By <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.requested_by}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Compliance Verified By <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.compliance_verified_by}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>

                    <div>
                      <label className={labelBase}>
                        Compliance Verified Date <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.compliance_verified_date}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> PR details will be audit-ready for compliance.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      {!isView && (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={outlineBtn} onClick={onReset} disabled={isLocked}>
          Reset
        </button>

        <button
          type="button"
          className={classNames(primaryBtn, "active:scale-95")}
          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSaveDraft}
          disabled={isLocked}
        >
          Save Draft
        </button>

        {/* ✅ Send for Approval button (instead of Submit) */}
        <button
          type="button"
          className={classNames(primaryBtn, "active:scale-95")}
          style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSendForApproval}
          disabled={isLocked}
        >
          Send for Approval
        </button>
      </div>
      )}
          {/* 🔥 ADD ITEM MODAL HERE */}
      {showItemModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    
    <div className="bg-white w-[500px] rounded-xl shadow-lg overflow-hidden">

      {/* 🔴 HEADER */}
      <div
        className="px-4 py-3 text-white font-semibold text-lg"
        style={{ backgroundColor: "#C8102E" }}
      >
        Select Item
      </div>

      {/* ⚪ BODY */}
      <div className="p-4">

        <input
          type="text"
          placeholder="Search item..."
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />

        <div className="max-h-[300px] overflow-y-auto border rounded">
          {itemsMaster
            .filter((i) =>
              (i.name || "")
                .toLowerCase()
                .includes(itemSearch.toLowerCase())
            )
            .map((i) => (
              <div
                key={i.code}
                onClick={() => {
                  if (activeIndex !== null) {
                    handleItemSelect(activeIndex, i.code);
                    setShowItemModal(false);
                    setItemSearch("");
                  }
                }}
                className="px-3 py-2 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition"
              >
                {i.name}
              </div>
            ))}
        </div>
      </div>

      {/* 🔵 FOOTER */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
        <button
          onClick={() => setShowItemModal(false)}
          className="px-4 py-2 text-white rounded-lg font-semibold"
          style={{ backgroundColor: "#005F99" }}
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}


    {showVendorModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    
    <div className="bg-white w-[500px] rounded-xl shadow-lg overflow-hidden">

      {/* 🔴 HEADER */}
      <div
        className="px-4 py-3 text-white font-semibold text-lg"
        style={{ backgroundColor: "#C8102E" }}
      >
        Select Vendor
      </div>

      {/* ⚪ BODY */}
      <div className="p-4">

        <input
          type="text"
          placeholder="Search vendor..."
          value={vendorSearch}
          onChange={(e) => setVendorSearch(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />

        <div className="max-h-[300px] overflow-y-auto border rounded">
          {vendors
            .filter((v) =>
              (v.name || "")
                .toLowerCase()
                .includes(vendorSearch.toLowerCase())
            )
            .map((v) => (
              <div
                key={v.vendor_id || v.id}
                onClick={() => {
                  if (activeVendorIndex !== null) {
                    updateItem(activeVendorIndex, {
                      preferred_vendor: v.vendor_id || v.id,
                    });
                  }
                  setShowVendorModal(false);
                  setVendorSearch("");
                }}
                className="px-3 py-2 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition"
              >
                {v.name}
              </div>
            ))}
        </div>
      </div>

      {/* 🔵 FOOTER */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
        <button
          onClick={() => setShowVendorModal(false)}
          className="px-4 py-2 text-white rounded-lg font-semibold"
          style={{ backgroundColor: "#005F99" }}
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

{showWarehouseModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    
    <div className="bg-white w-[500px] rounded-xl shadow-lg overflow-hidden">

      {/* 🔴 HEADER */}
      <div
        className="px-4 py-3 text-white font-semibold text-lg"
        style={{ backgroundColor: "#C8102E" }}
      >
        Select Warehouse
      </div>

      {/* ⚪ BODY */}
      <div className="p-4">

        <input
          type="text"
          placeholder="Search warehouse..."
          value={warehouseSearch}
          onChange={(e) => setWarehouseSearch(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />

        <div className="max-h-[300px] overflow-y-auto border rounded">
          {warehouses
            .filter((w) =>
              (w.warehouse_name || "")
                .toLowerCase()
                .includes(warehouseSearch.toLowerCase())
            )
            .map((w) => (
              <div
                key={w.warehouse_id || w.id}
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    delivery_location: w.warehouse_id || w.id,
                    delivery_address: w.address || "",
                  }));
                  setShowWarehouseModal(false);
                  setWarehouseSearch("");
                }}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              >
                {w.warehouse_name}
              </div>
            ))}
        </div>
      </div>

      {/* 🔵 FOOTER */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
        <button
          onClick={() => setShowWarehouseModal(false)}
          className="px-4 py-2 text-white rounded-lg font-semibold"
          style={{ backgroundColor: "#005F99" }}
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}


    </div>
  );
}
