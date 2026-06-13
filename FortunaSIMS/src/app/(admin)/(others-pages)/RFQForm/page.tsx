"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Tabs */
type TabKey =
  | "basic"
  | "vendors"
  | "items"
  | "terms"
  | "attachments"
  | "compare"
  | "approval";

/** Enums */
type RFQStatus = "Draft" | "Sent" | "Quotes Stage" | "Pending Approval" | "Approved" | "Rejected" | "Closed" | "Cancelled";
type RFQType = "Single Vendor" | "Multi Vendor";
type Currency = "INR" | "USD" | "EUR";

type InvitationStatus = "Not Sent" | "Sent" | "Responded";

type PaymentTerms = "Net 15" | "Net 30" | "Advance";
type Incoterms = "" | "EXW" | "FOB" | "CIF";

type AttachmentType = "Quotation" | "Spec" | "Brochure" | "Other";

type Priority = "Low" | "Medium" | "High" | "Urgent";



type PRLine = {
  pr_item_id: string;
  item_id: string;
  item_description: string;
  uom: string;
  requested_qty: number;
};

type ApprovedPR = {
  pr_id: string;
  pr_number: string;
  department: string;
  requested_by: string;
  estimated_pr_value: number;
  currency: Currency;
  priority: string;
};

/** Approved PRs (RFQ should come from Approved PR only) */


type VendorMaster = {
  id: string;
  vendor_code: string;
  vendor_name: string;
  contact_email: string;
  status: string;
  compliance_status: string;
};



/** RFQ Vendor mapping (as per LLD) */
type RFQVendor = {
  rfq_vendor_id: string; // system
  vendor_id: string; // required
  vendor_name: string; // system readonly
  vendor_email: string; // system readonly
  invitation_status: InvitationStatus; // system-driven
  response_received: boolean; // system-driven
  response_date: string; // system-driven
};

/** RFQ Item mapping (as per LLD) */
type QuoteCell = {
  quoted_unit_price: string; // decimal >= 0
  delivery_days: string; // integer > 0
  tax_percentage: string; // optional >= 0
  warranty_terms: string; // optional
};

type RFQItem = {
  rfq_item_id: string; // system
  pr_item_id: string; // readonly
  item_id: string; // readonly
  item_description: string; // readonly
  uom: string; // readonly
  requested_qty: number; // readonly

  /** vendor-wise quotes */
  quotes_by_vendor: Record<string, QuoteCell>;
};

/** Terms & Conditions (as per LLD) */
type RFQTerms = {
  payment_terms: PaymentTerms; // required
  incoterms: Incoterms; // optional
  freight_charges: string; // optional >=0
  validity_days: string; // required integer >0
  penalty_clause: boolean; // optional
  special_conditions: string; // optional
};

/** Attachments & Notes */
type RFQAttachment = {
  attachment_id: string;
  attachment_type: AttachmentType;

  attachment_file: File | null;

  file_name?: string;
  file_path?: string;
};

type RFQFormState = {

  rfq_id: string;
  rfq_number: string;
  rfq_date: string;

  pr_id: string;
  pr_number: string;

  department: string;
  requestor: string;
  priority: string;
  estimated_value: number;

  created_by: string;

  rfq_status: RFQStatus;

  quotation_due_date: string;

  rfq_type: RFQType;

  currency: Currency;

  remarks: string;

  /** Vendor selection */
  vendors: RFQVendor[];

  /** Items (from PR) */
  items: RFQItem[];

  /** Terms */
  terms: RFQTerms;

  /** Attachments */
  attachments: RFQAttachment[];
  internal_notes: string;

  /** Approval (simple demo) */
  approval_remarks: string;
};

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

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function isAfterOrSame(a: string, b: string) {
  // a >= b
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() >= db.getTime();
}

function money(value: number, currency: Currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value)}`;
  }
}

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

/** ✅ Fixed layout helpers for Items & Pricing */
const miniLabel = "text-[11px] font-semibold text-gray-600 dark:text-gray-300";
const cellWrap = "min-w-[380px] max-w-[420px]";
const cellCard =
  "rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs " +
  "dark:border-gray-800 dark:bg-gray-950";
const inputSm = classNames(inputBase, "py-2", "text-sm");

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "RFQ Basic Info" },
  { key: "vendors", label: "Vendor Selection" },
  { key: "items", label: "Item & Pricing Details" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "attachments", label: "Attachments & Notes" },
  { key: "compare", label: "Quote Comparison" },
  { key: "approval", label: "Approval & Closures" },
];

const initialState: RFQFormState = {
  rfq_id: "Auto-generated",
  rfq_number: "Auto (RFQ-YYYY-SEQ)",
  rfq_date: todayISO(),
  pr_id: "",
  pr_number: "Auto",
  department: "",
  requestor: "",
  priority: "Medium",
  estimated_value: 0,
  created_by: "",
  rfq_status: "Draft",
  quotation_due_date: todayISO(),
  rfq_type: "Multi Vendor",
  currency: "INR",
  remarks: "",

  vendors: [],
  items: [],

  terms: {
    payment_terms: "Net 15",
    incoterms: "",
    freight_charges: "",
    validity_days: "15",
    penalty_clause: false,
    special_conditions: "",
  },

  attachments: [],
  internal_notes: "",

  approval_remarks: "",
};

export default function RFQCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<RFQFormState>(initialState);
  const [approvedPRs, setApprovedPRs] = useState<ApprovedPR[]>([]);
  const [vendorMaster, setVendorMaster] = useState<VendorMaster[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const rfqId = searchParams.get("rfqId");
  const mode = searchParams.get("mode");

  const isViewMode = mode === "view";



const loadRFQById = async (id: string) => {

  console.log("STEP-1 RFQ ID =", id);

  try {

    const res = await fetch(
      `http://localhost:5000/api/rfq/${id}`
    );
    console.log("STEP-2 RESPONSE STATUS =", res.status);

    const result = await res.json();

    console.log("STEP-3 API RESULT =", result);

    console.log("RFQ VIEW =", result);

    if (result.success) {

      const rfq = result.header;

      console.log("ITEMS =", result.items);
      console.log("VENDORS =", result.vendors);
      console.log("TERMS =", result.terms);

      setForm({

  rfq_id: rfq.rfq_id,
  rfq_number: rfq.rfq_number,
  rfq_date: rfq.rfq_date?.split("T")[0],

  pr_id: rfq.pr_id,
  pr_number: rfq.pr_number,

  department: rfq.department || "",
  requestor: rfq.requestor || "",

  priority: rfq.priority || "Medium",

  estimated_value:
    Number(rfq.estimated_value || 0),

  created_by: rfq.created_by || "",

  rfq_status: rfq.status,

  quotation_due_date:
    rfq.quotation_due_date?.split("T")[0],

  rfq_type: rfq.rfq_type,

  currency: rfq.currency,

  remarks: rfq.remarks || "",

  vendors: result.vendors || [],

  items: (result.items || []).map((item: any) => ({
  ...item,
  quotes_by_vendor: {},
})),

  terms: result.terms || {
    payment_terms: "Net 15",
    incoterms: "",
    freight_charges: "",
    validity_days: "15",
    penalty_clause: false,
    special_conditions: "",
  },

  attachments: [],

  internal_notes:
    rfq.internal_notes || "",

  approval_remarks: ""
});

    }

  } catch (error) {

    console.error(error);

  }

};

  useEffect(() => {
  loadApprovedPRs();
  loadVendors();
}, []);

useEffect(() => {
  if (!rfqId) return;
  loadRFQById(rfqId);
}, [rfqId]);




const loadApprovedPRs = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/rfq/approved-prs"
    );

    const data = await res.json();

    if (data.success) {
      setApprovedPRs(data.data);
    }
  } catch (err) {
    console.error(err);
  }
};

const loadVendors = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/rfq/vendors"
    );

    const data = await res.json();

    if (data.success) {
      setVendorMaster(data.data);
    }
  } catch (err) {
    console.error(err);
  }
};

  /** Lock after leaving Draft (you can tweak) */
  const isLocked = useMemo(() => {
    return form.rfq_status !== "Draft";
  }, [form.rfq_status]);

  const markTouched = (key: string) => setTouched((p) => ({ ...p, [key]: true }));
  const showError = (key: string) => Boolean(touched[key] && errors[key]);

  /** Derived validations */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // Basic
    if (!form.pr_id) e.pr_id = "Approved PR is required";
    if (!form.quotation_due_date) e.quotation_due_date = "Quotation due date is required";
    else if (!isAfterOrSame(form.quotation_due_date, form.rfq_date))
      e.quotation_due_date = "Due date must be same or after RFQ date";

    if (!form.rfq_type) e.rfq_type = "RFQ Type is required";
    if (!form.currency) e.currency = "Currency is required";

    // Vendors
    if (form.vendors.length === 0) e.vendors = "Minimum 1 vendor is mandatory";

    // Terms
    if (!form.terms.payment_terms) e.payment_terms = "Payment terms is required";

    if (!String(form.terms.validity_days).trim()) e.validity_days = "Validity days is required";
    else {
      const n = toNum(form.terms.validity_days);
      if (!Number.isFinite(n) || n <= 0) e.validity_days = "Validity days must be > 0";
    }

    if (String(form.terms.freight_charges).trim()) {
      const n = toNum(form.terms.freight_charges);
      if (!Number.isFinite(n) || n < 0) e.freight_charges = "Freight charges must be >= 0";
    }

    // Items quote validations (only if vendors exist)
    if (form.vendors.length > 0) {
      form.items.forEach((it, idx) => {
        form.vendors.forEach((v) => {
          const cell = it.quotes_by_vendor[v.vendor_id];
          const keyPrefix = `item_${idx}_${v.vendor_id}_`;

          // Unit price >= 0 required in phase-1 manual (you can relax later)
          if (!cell?.quoted_unit_price?.trim()) e[keyPrefix + "quoted_unit_price"] = "Unit price required";
          else {
            const n = toNum(cell.quoted_unit_price);
            if (!Number.isFinite(n) || n < 0) e[keyPrefix + "quoted_unit_price"] = "Unit price must be >= 0";
          }

          // Delivery days > 0 required
          if (!cell?.delivery_days?.trim()) e[keyPrefix + "delivery_days"] = "Delivery days required";
          else {
            const n = toNum(cell.delivery_days);
            if (!Number.isFinite(n) || n <= 0) e[keyPrefix + "delivery_days"] = "Delivery days must be > 0";
          }

          // Tax optional but must be >=0
          if (cell?.tax_percentage?.trim()) {
            const n = toNum(cell.tax_percentage);
            if (!Number.isFinite(n) || n < 0) e[keyPrefix + "tax_percentage"] = "Tax must be >= 0";
          }
        });
      });
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof RFQFormState>(key: K, value: RFQFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

 const onSelectApprovedPR = async (pr_id: string) => {
  if (isLocked) return;

  try {

   const selectedPR = approvedPRs.find(
  (p) => p.pr_id === pr_id
);

if (!selectedPR) {
  alert("PR not found");
  return;
}

setForm((prev) => ({
  ...prev,
  pr_id: selectedPR.pr_id,
  pr_number: selectedPR.pr_number,
  department: selectedPR.department,
  requestor: selectedPR.requested_by,
created_by:
  localStorage.getItem("userName") || "Unknown User",
estimated_value: selectedPR.estimated_pr_value
}));



    if (!selectedPR) return;

    const itemRes = await fetch(
      `http://localhost:5000/api/rfq/pr/${pr_id}/items`
    );

    const itemData = await itemRes.json();

    const rfqItems = itemData?.data?.map((line: any) => ({
      rfq_item_id: uuidLike("RFQI"),
      pr_item_id: line.pr_item_id,
      item_id: line.item_id,
      item_description: line.item_description,
      uom: line.uom,
      requested_qty: Number(line.requested_qty),
      quotes_by_vendor: {},
    }));

    setForm((prev) => ({
      ...prev,
      pr_id,
      pr_number: selectedPR.pr_number,
      currency: selectedPR.currency,
      items: rfqItems,
    }));

  } catch (err) {
    console.error(err);
  }
};


const addVendorFromMaster = (vendorId: string) => {
  if (isLocked) return;

  const vm = vendorMaster.find(
    (v) => v.id === vendorId
  );

  if (!vm) return;

  if (vm.status !== "Active") {
    alert("Vendor must be Active");
    return;
  }

  if (vm.compliance_status !== "Verified") {
    alert("Vendor compliance must be Verified");
    return;
  }

  setForm((p) => {

    if (
      p.vendors.some(
        (x) => x.vendor_id === vm.id
      )
    ) {
      alert("Vendor already added");
      return p;
    }

    const newVendor: RFQVendor = {
      rfq_vendor_id: uuidLike("RFQV"),
      vendor_id: vm.id,
      vendor_name: vm.vendor_name,
      vendor_email: vm.contact_email,
      invitation_status: "Not Sent",
      response_received: false,
      response_date: "",
    };

    const nextItems = p.items.map((it) => ({
      ...it,
      quotes_by_vendor: {
        ...it.quotes_by_vendor,
        [vm.id]: {
          quoted_unit_price: "",
          delivery_days: "",
          tax_percentage: "",
          warranty_terms: "",
        },
      },
    }));

    return {
      ...p,
      vendors: [...p.vendors, newVendor],
      items: nextItems,
    };
  });
};
  
    

  const removeVendor = (vendorId: string) => {
    if (isLocked) return;

    setForm((p) => ({
      ...p,
      vendors: p.vendors.filter((v) => v.vendor_id !== vendorId),
      items: p.items.map((it) => {
        const next = { ...it.quotes_by_vendor };
        delete next[vendorId];
        return { ...it, quotes_by_vendor: next };
      }),
    }));
  };

  /** ✅ Item & Pricing: update quote cell cleanly */
  const updateQuoteCell = (rfq_item_id: string, vendor_id: string, patch: Partial<QuoteCell>) => {
    if (isLocked) return;

    setForm((p) => ({
      ...p,
      items: p.items.map((it) => {
        if (it.rfq_item_id !== rfq_item_id) return it;
        const existing = it.quotes_by_vendor[vendor_id] ?? {
          quoted_unit_price: "",
          delivery_days: "",
          tax_percentage: "",
          warranty_terms: "",
        };

        return {
          ...it,
          quotes_by_vendor: {
            ...it.quotes_by_vendor,
            [vendor_id]: { ...existing, ...patch },
          },
        };
      }),
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

  const updateAttachment = (idx: number, patch: Partial<RFQAttachment>) => {
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

  /** Quote totals for comparison */
  const vendorTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    form.vendors.forEach((v) => (totals[v.vendor_id] = 0));

    form.items.forEach((it) => {
      form.vendors.forEach((v) => {
        const cell = it.quotes_by_vendor[v.vendor_id];
        const price = cell?.quoted_unit_price?.trim() ? toNum(cell.quoted_unit_price) : NaN;
        const pOk = Number.isFinite(price) && price >= 0 ? price : 0;
        totals[v.vendor_id] += it.requested_qty * pOk;
      });
    });

    return totals;
  }, [form.items, form.vendors]);

  const cheapestVendorId = useMemo(() => {
    if (form.vendors.length === 0) return "";
    let best = form.vendors[0]?.vendor_id ?? "";
    let bestVal = vendorTotals[best] ?? Number.POSITIVE_INFINITY;

    for (const v of form.vendors) {
      const val = vendorTotals[v.vendor_id] ?? Number.POSITIVE_INFINITY;
      if (val < bestVal) {
        bestVal = val;
        best = v.vendor_id;
      }
    }
    return best;
  }, [form.vendors, vendorTotals]);

  /** Save / Send actions */
  const touchAll = () => {
    const next: Record<string, boolean> = { ...touched };
    ["pr_id", "quotation_due_date", "rfq_type", "currency", "vendors", "payment_terms", "validity_days", "freight_charges"].forEach(
      (k) => (next[k] = true)
    );

    // mark all quote fields touched
    form.items.forEach((it, idx) => {
      form.vendors.forEach((v) => {
        next[`item_${idx}_${v.vendor_id}_quoted_unit_price`] = true;
        next[`item_${idx}_${v.vendor_id}_delivery_days`] = true;
        next[`item_${idx}_${v.vendor_id}_tax_percentage`] = true;
      });
    });

    setTouched(next);
  };

  const firstErrorTab = (): TabKey => {
    if (errors.pr_id || errors.quotation_due_date || errors.rfq_type || errors.currency) return "basic";
    if (errors.vendors) return "vendors";
    if (Object.keys(errors).some((k) => k.startsWith("item_"))) return "items";
    if (errors.payment_terms || errors.validity_days || errors.freight_charges) return "terms";
    return "basic";
  };

  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

 const onSaveDraft = async () => {

  console.log("RFQ SAVE PAYLOAD =", form);

  try {
    touchAll();

    const payload = {
  ...form,

  attachments: form.attachments.map(
    (a) => ({
      attachment_type:
        a.attachment_type,

      file_name:
        a.file_name,

      file_path:
        a.file_path
    })
  )
};

console.log(
  "Estimated Value Before Save =",
  payload.estimated_value
);

console.log(
  "FULL PAYLOAD =",
  JSON.stringify(payload, null, 2)
);

    const response = await fetch(
  "http://localhost:5000/api/rfq/create",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
);

const result = await response.json();

console.log("API RESPONSE =", result);

if (!response.ok || !result.success) {

  console.log("BACKEND ERROR =", result);

  throw new Error(
    result.message || "Failed to save RFQ"
  );
}

    setForm((p) => ({
      ...p,
      rfq_id: result.rfqId || p.rfq_id,
      rfq_number: result.rfqNumber || p.rfq_number,
    }));

    alert(
      result.message ||
      "RFQ Saved Successfully"
    );

    router.push("/RFQ");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("CREATE RFQ ERROR FULL =", error);

    alert(errorMessage);
  }
};

  /**
   * "Send RFQ" – internal action:
   * Phase-1: procurement team sends email/portal link externally later.
   * Here we only mark invitation_status = Sent and status = Sent.
   */
  const onSendRFQ = async () => {
    if (isLocked) return;
    touchAll();

    if (!form.pr_id) {
      setActiveTab("basic");
      alert("Select Approved PR first.");
      return;
    }
    if (form.vendors.length === 0) {
      setActiveTab("vendors");
      alert("Select at least 1 verified vendor.");
      return;
    }
    if (form.items.length === 0) {
      setActiveTab("basic");
      alert("PR has no items to quote.");
      return;
    }
    if (hasErrors) {
      setActiveTab(firstErrorTab());
      alert("Please fix validation errors before sending RFQ.");
      return;
    }

  const payload = {
  ...form,

  status: "Submitted",
  rfq_status: "Submitted",

  vendors: form.vendors.map((v) => ({
    ...v,
    invitation_status: "Sent",
  })),

  attachments: form.attachments.map((a) => ({
    attachment_type: a.attachment_type,

    file_name:
      a.attachment_file?.name || "",

    file_path:
      a.file_path || "",
  })),
};

try {

  const response = await fetch(
    "http://localhost:5000/api/rfq/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  alert(
    `RFQ Submitted Successfully\n${result.rfqNumber}`
  );

  router.push("/RFQ");

} catch (error: any) {

  alert(error.message || "Failed to submit RFQ");

}
  };

  /** Move to Pending Approval (internal approval before convert to PO) */
  const onSendForApproval = () => {
    if (form.rfq_status !== "Sent" && form.rfq_status !== "Quotes Stage") {
      alert("RFQ must be Sent / Quotes Stage before Approval.");
      return;
    }
    setForm((p) => ({ ...p, rfq_status: "Pending Approval" }));
    setActiveTab("approval");
  };

  /** Approve / Reject / Close */
  const onApprove = () => {
    if (form.rfq_status !== "Pending Approval") return;
    setForm((p) => ({ ...p, rfq_status: "Approved" }));
    alert("RFQ Approved (demo). Next: Convert to PO.");
  };

  const onReject = () => {
    if (form.rfq_status !== "Pending Approval") return;
    setForm((p) => ({ ...p, rfq_status: "Rejected" }));
    alert("RFQ Rejected (demo).");
  };

  const onClose = () => {
    if (form.rfq_status !== "Approved") {
      alert("Only Approved RFQ can be Closed.");
      return;
    }
    setForm((p) => ({ ...p, rfq_status: "Closed" }));
    alert("RFQ Closed (demo).");
  };

  const statusPill = (s: RFQStatus) =>
    classNames(
      "rounded-full px-3 py-1 text-xs font-semibold",
      s === "Draft" && "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      s === "Sent" && "bg-blue-100 text-blue-700",
      s === "Quotes Stage" && "bg-violet-100 text-violet-700",
      s === "Pending Approval" && "bg-amber-100 text-amber-800",
      s === "Approved" && "bg-green-100 text-green-700",
      s === "Rejected" && "bg-red-100 text-red-600",
      s === "Closed" && "bg-purple-100 text-purple-700",
      s === "Cancelled" && "bg-rose-100 text-rose-700"
    );

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-hidden space-y-6">
      <PageBreadcrumb pageTitle="RFQ Management" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">RFQ Creation</h3>
          <p className={helperBase}>
            Step 1: Select Approved PR → Step 2: Vendors → Step 3: Quotes → Step 4: Compare → Step 5: Approval → Convert to PO.
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className={statusPill(form.rfq_status)}>{form.rfq_status}</span>
            {isLocked && (
              <span className="text-xs font-semibold" style={{ color: FORTUNA_PRIMARY_RED }}>
                Locked: RFQ cannot be edited after Send RFQ
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineBtn} onClick={onReset} disabled={isLocked || isViewMode}>
            Reset
          </button>

          <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSaveDraft}
            disabled={isLocked || isViewMode}
          >
            Save Draft
          </button>

          <button
            type="button"
            className={classNames(primaryBtn, "active:scale-95")}
            style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
            onClick={onSendRFQ}
            disabled={isLocked || isViewMode}
          >
            Send RFQ
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
          {/* 1) BASIC */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    RFQ ID <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.rfq_id} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      RFQ Number <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.rfq_number} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                  <div>
                    <label className={labelBase}>
                      RFQ Date <span className="text-xs text-gray-400">(System)</span>
                    </label>
                    <input readOnly value={form.rfq_date} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Created By <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.created_by} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>

                <div>
                  <label className={labelBase}>
                    Source PR <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.pr_id}
                    disabled={isLocked || isViewMode}
                    onChange={(e) => onSelectApprovedPR(e.target.value)}
                    onBlur={() => markTouched("pr_id")}
                    className={classNames(
                      inputBase,
                      isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("pr_id") && "border-brand-500"
                    )}
                  >
                    <option value="">Select Approved PR</option>
                    {approvedPRs.map((p) => (
                      <option key={p.pr_id} value={p.pr_id}>
                        {p.pr_number} • {p.department} • {p.requested_by}
                      </option>
                    ))}
                  </select>
                  {showError("pr_id") && <p className="mt-1 text-xs text-brand-500">{errors.pr_id}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    PR Number <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input readOnly value={form.pr_number} className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")} />
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                  <div>
                    <label className={labelBase}>
                      Quotation Due Date <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={form.quotation_due_date}
                      disabled={isLocked || isViewMode}
                      onChange={(e) => setField("quotation_due_date", e.target.value)}
                      onBlur={() => markTouched("quotation_due_date")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("quotation_due_date") && "border-brand-500"
                      )}
                    />
                    {showError("quotation_due_date") && <p className="mt-1 text-xs text-brand-500">{errors.quotation_due_date}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      RFQ Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.rfq_type}
                      disabled={isLocked || isViewMode}
                      onChange={(e) => setField("rfq_type", e.target.value as RFQType)}
                      onBlur={() => markTouched("rfq_type")}
                      className={classNames(
                        inputBase,
                        isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                        showError("rfq_type") && "border-brand-500"
                      )}
                    >
                      <option value="Multi Vendor">Multi Vendor</option>
                      <option value="Single Vendor">Single Vendor</option>
                    </select>
                    {showError("rfq_type") && <p className="mt-1 text-xs text-brand-500">{errors.rfq_type}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Currency <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>{" "}
                    <span className={helperBase}>(Default from PR)</span>
                  </label>
                  <select
                    value={form.currency}
                    disabled={isLocked || isViewMode}
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
                    Remarks <span className={helperBase}>(Optional, internal)</span>
                  </label>
                  <textarea
                    value={form.remarks}
                    disabled={isLocked || isViewMode}
                    onChange={(e) => setField("remarks", e.target.value)}
                    className={classNames(inputBase, "min-h-[110px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Internal remarks..."
                  />
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("vendors")}>
                    Next: Vendor Selection →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2) VENDORS */}
          {activeTab === "vendors" && (
            <div className="space-y-5 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Select Vendors</h4>
                  <p className={helperBase}>
                    Business Rule: Minimum 1 vendor mandatory. Vendor must be Active + Compliance Verified.
                  </p>
                  {showError("vendors") && <p className="mt-1 text-xs text-brand-500">{errors.vendors}</p>}
                </div>

                <div className="flex gap-2">
                  <select
                    className={classNames(inputBase, "min-w-[260px]", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    disabled={isLocked || isViewMode}
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      addVendorFromMaster(e.target.value);
                      e.currentTarget.value = "";
                    }}
                  >
                    <option value="">+ Add Vendor</option>
                    {vendorMaster.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendor_name} ({v.vendor_code}) • {v.compliance_status}
                      </option>
                    ))}
                  </select>

                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("items")}>
                    Go to Items →
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Invitation Status</th>
                      <th className="px-4 py-3 text-left">Response</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="dark:text-gray-200">
                    {form.vendors.map((v) => (
                      <tr key={v.rfq_vendor_id} className="border-t dark:border-gray-800">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {v.vendor_name} <span className="text-xs text-gray-500">({v.vendor_id})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{v.vendor_email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                            {v.invitation_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {v.response_received ? (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                              Received • {v.response_date}
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className={classNames("text-sm font-semibold text-rose-600 hover:underline", isLocked && "opacity-50")}
                            onClick={() => removeVendor(v.vendor_id)}
                            disabled={isLocked || isViewMode}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {form.vendors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                          No vendors selected.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("items")}>
                  Next: Item & Pricing →
                </button>
              </div>
            </div>
          )}

          {/* 3) ITEMS & PRICING ✅ FIXED */}
          {activeTab === "items" && (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item & Pricing Details</h4>
                  <p className={helperBase}>
                    Item rows are from PR (qty read-only). Vendor-wise columns allow quote entry (Phase-1 manual).
                  </p>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Vendors: <span className="font-semibold">{form.vendors.length}</span> • Items:{" "}
                  <span className="font-semibold">{form.items.length}</span>
                </div>
              </div>

              {!form.pr_id ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  Select an Approved PR in Basic Info to load items.
                </div>
              ) : form.vendors.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Select at least 1 verified vendor first. Then vendor-wise quote columns will appear.
                </div>
              ) : (
                <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="min-w-[1400px] w-full border-collapse text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left w-[380px]">
                          <span className="font-semibold text-gray-900 dark:text-white">Item (From PR)</span>
                        </th>
                        <th className="px-4 py-3 text-left w-[110px]">Qty</th>
                        <th className="px-4 py-3 text-left w-[110px]">UOM</th>

                        {form.vendors.map((v) => (
                          <th key={v.vendor_id} className={classNames("px-4 py-3 text-left", cellWrap)}>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white">{v.vendor_name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-300">{v.vendor_id}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="dark:text-gray-200">
                      {form.items.map((it, rowIdx) => (
                        <tr key={it.rfq_item_id} className="border-t align-top dark:border-gray-800">
                          {/* Item */}
                          <td className="px-4 py-4 align-top">
                            <div className="font-semibold text-gray-900 dark:text-white">{it.item_description}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                              <span className="font-semibold">{it.item_id}</span> • PR Item:{" "}
                              <span className="font-semibold">{it.pr_item_id}</span>
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="px-4 py-4 align-top">
                            <span className="font-semibold text-gray-900 dark:text-white">{it.requested_qty}</span>
                          </td>

                          {/* UOM */}
                          <td className="px-4 py-4 align-top">{it.uom}</td>

                          {/* Vendor columns */}
                          {form.vendors.map((v) => {
                            const cell = it.quotes_by_vendor[v.vendor_id];
                            const errPrefix = `item_${rowIdx}_${v.vendor_id}_`;

                            return (
                              <td key={v.vendor_id} className={classNames("px-4 py-4 align-top", cellWrap)}>
                                <div className={cellCard}>
                                  {/* Row-1: Unit price */}
                                  <div>
                                    <label className={miniLabel}>Unit Price ({form.currency})</label>
                                    <input
                                      value={cell?.quoted_unit_price ?? ""}
                                      disabled={isLocked || isViewMode}
                                      onChange={(e) =>
                                        updateQuoteCell(it.rfq_item_id, v.vendor_id, {
                                          quoted_unit_price: e.target.value.replace(/[^\d.]/g, ""),
                                        })
                                      }
                                      onBlur={() => markTouched(errPrefix + "quoted_unit_price")}
                                      className={classNames(inputSm, showError(errPrefix + "quoted_unit_price") && "border-brand-500")}
                                      placeholder=">= 0"
                                    />
                                    {showError(errPrefix + "quoted_unit_price") && (
                                      <p className="mt-1 text-xs text-brand-500">{errors[errPrefix + "quoted_unit_price"]}</p>
                                    )}
                                  </div>

                                  {/* Row-2: Delivery + Tax */}
                                  <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className={miniLabel}>Delivery Days</label>
                                      <input
                                        value={cell?.delivery_days ?? ""}
                                        disabled={isLocked || isViewMode}
                                        onChange={(e) =>
                                          updateQuoteCell(it.rfq_item_id, v.vendor_id, {
                                            delivery_days: e.target.value.replace(/[^\d]/g, ""),
                                          })
                                        }
                                        onBlur={() => markTouched(errPrefix + "delivery_days")}
                                        className={classNames(inputSm, showError(errPrefix + "delivery_days") && "border-brand-500")}
                                        placeholder="> 0"
                                      />
                                      {showError(errPrefix + "delivery_days") && (
                                        <p className="mt-1 text-xs text-brand-500">{errors[errPrefix + "delivery_days"]}</p>
                                      )}
                                    </div>

                                    <div>
                                      <label className={miniLabel}>Tax %</label>
                                      <input
                                        value={cell?.tax_percentage ?? ""}
                                        disabled={isLocked || isViewMode}
                                        onChange={(e) =>
                                          updateQuoteCell(it.rfq_item_id, v.vendor_id, {
                                            tax_percentage: e.target.value.replace(/[^\d.]/g, ""),
                                          })
                                        }
                                        onBlur={() => markTouched(errPrefix + "tax_percentage")}
                                        className={classNames(inputSm, showError(errPrefix + "tax_percentage") && "border-brand-500")}
                                        placeholder="Optional"
                                      />
                                      {showError(errPrefix + "tax_percentage") && (
                                        <p className="mt-1 text-xs text-brand-500">{errors[errPrefix + "tax_percentage"]}</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Row-3: Warranty */}
                                  <div className="mt-3">
                                    <label className={miniLabel}>Warranty Terms</label>
                                    <input
                                      value={cell?.warranty_terms ?? ""}
                                      disabled={isLocked || isViewMode}
                                      onChange={(e) =>
                                        updateQuoteCell(it.rfq_item_id, v.vendor_id, {
                                          warranty_terms: e.target.value,
                                        })
                                      }
                                      className={inputSm}
                                      placeholder="Optional"
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {form.items.length === 0 && (
                        <tr>
                          <td colSpan={3 + form.vendors.length} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                            No items found from PR.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("terms")}>
                  Next: Terms & Conditions →
                </button>
              </div>
            </div>
          )}

          {/* 4) TERMS */}
          {activeTab === "terms" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Payment Terms <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.terms.payment_terms}
                    disabled={isLocked || isViewMode}
                    onChange={(e) => setForm((p) => ({ ...p, terms: { ...p.terms, payment_terms: e.target.value as PaymentTerms } }))}
                    onBlur={() => markTouched("payment_terms")}
                    className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5", showError("payment_terms") && "border-brand-500")}
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Advance">Advance</option>
                  </select>
                  {showError("payment_terms") && <p className="mt-1 text-xs text-brand-500">{errors.payment_terms}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    Incoterms <span className={helperBase}>(Optional)</span>
                  </label>
                  <select
                    value={form.terms.incoterms}
                    disabled={isLocked || isViewMode}
                    onChange={(e) => setForm((p) => ({ ...p, terms: { ...p.terms, incoterms: e.target.value as Incoterms } }))}
                    className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  >
                    <option value="">Select</option>
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                  </select>
                </div>

                <div>
                  <label className={labelBase}>
                    Freight Charges <span className={helperBase}>(Optional)</span>
                  </label>
                  <input
                    value={form.terms.freight_charges}
                    disabled={isLocked || isViewMode}
                    onChange={(e) => setForm((p) => ({ ...p, terms: { ...p.terms, freight_charges: e.target.value.replace(/[^\d.]/g, "") } }))}
                    onBlur={() => markTouched("freight_charges")}
                    placeholder=">= 0"
                    className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5", showError("freight_charges") && "border-brand-500")}
                  />
                  {showError("freight_charges") && <p className="mt-1 text-xs text-brand-500">{errors.freight_charges}</p>}
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div>
                  <label className={labelBase}>
                    Validity Days <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.terms.validity_days}
                    disabled={isLocked || isViewMode}
                    onChange={(e) => setForm((p) => ({ ...p, terms: { ...p.terms, validity_days: e.target.value.replace(/[^\d]/g, "") } }))}
                    onBlur={() => markTouched("validity_days")}
                    placeholder="> 0"
                    className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5", showError("validity_days") && "border-brand-500")}
                  />
                  {showError("validity_days") && <p className="mt-1 text-xs text-brand-500">{errors.validity_days}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Penalty Clause</h4>
                      <p className={helperBase}>Optional. Enable if delay penalty applies.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.terms.penalty_clause}
                      disabled={isLocked || isViewMode}
                      onChange={(e) => setForm((p) => ({ ...p, terms: { ...p.terms, penalty_clause: e.target.checked } }))}
                      className="h-5 w-5"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Special Conditions <span className={helperBase}>(Optional)</span>
                  </label>
                  <textarea
                    value={form.terms.special_conditions}
                    disabled={isLocked || isViewMode}
                    onChange={(e) => setForm((p) => ({ ...p, terms: { ...p.terms, special_conditions: e.target.value } }))}
                    className={classNames(inputBase, "min-h-[120px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    placeholder="Additional clauses..."
                  />
                </div>

                <div className="flex justify-end">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("attachments")}>
                    Next: Attachments →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5) ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Attachments & Notes</h4>
                  <p className={helperBase}>Upload RFQ supporting files (PDF/DOC).</p>
                </div>

                <button
                  type="button"
                  className={classNames(primaryBtn, "active:scale-95")}
                  style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
                  onClick={addAttachment}
                  disabled={isLocked || isViewMode}
                >
                  + Add Attachment
                </button>
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
                        disabled={isLocked || isViewMode}
                        onChange={(e) => updateAttachment(idx, { attachment_type: e.target.value as AttachmentType })}
                        className={classNames(inputBase, isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      >
                        <option value="Quotation">Quotation</option>
                        <option value="Spec">Spec</option>
                        <option value="Brochure">Brochure</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-7 min-w-0">
                      <label className={labelBase}>
                        Attachment File <span className={helperBase}>(Optional PDF/DOC)</span>
                      </label>
                      <input
                        type="file"
                        disabled={isLocked || isViewMode}
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {

  const file =
    e.target.files?.[0] || null;

  updateAttachment(idx, {

    attachment_file: file,

    file_name: file?.name || "",

    file_path:
      file ? `/uploads/rfq/${file.name}` : ""

  });

}}
                        className={classNames(inputBase, "px-2 py-2", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        className={classNames("text-sm font-semibold text-rose-600 hover:underline", isLocked && "opacity-50")}
                        onClick={() => removeAttachment(idx)}
                        disabled={isLocked || isViewMode}
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
              </div>

              <div>
                <label className={labelBase}>
                  Internal Notes <span className={helperBase}>(Optional)</span>
                </label>
                <textarea
                  value={form.internal_notes}
                  disabled={isLocked || isViewMode}
                  onChange={(e) => setField("internal_notes", e.target.value)}
                  className={classNames(inputBase, "min-h-[120px] resize-y", isLocked && "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  placeholder="Notes for internal users / approvers..."
                />
              </div>

              <div className="flex justify-end">
                <button type="button" className={outlineBtn} onClick={() => setActiveTab("compare")}>
                  Next: Quote Comparison →
                </button>
              </div>
            </div>
          )}

          {/* 6) COMPARISON */}
          {activeTab === "compare" && (
            <div className="space-y-5 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Vendor Quote Comparison</h4>
                  <p className={helperBase}>Phase-1: compare based on price totals (qty × unit price). Next: weighted scoring.</p>
                </div>

                <div className="flex gap-2">
                  <button type="button" className={outlineBtn} onClick={() => setActiveTab("items")}>
                    ← Back to Quotes
                  </button>

                  <button
                    type="button"
                    className={classNames(primaryBtn, "active:scale-95")}
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                    onClick={onSendForApproval}
                  >
                    Send for Approval
                  </button>
                </div>
              </div>

              {form.vendors.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  Select vendors first.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left">Vendor</th>
                        <th className="px-4 py-3 text-left">Total (Sum of line totals)</th>
                        <th className="px-4 py-3 text-left">Rank</th>
                      </tr>
                    </thead>
                    <tbody className="dark:text-gray-200">
                      {form.vendors.map((v) => {
                        const t = vendorTotals[v.vendor_id] ?? 0;
                        const isBest = v.vendor_id === cheapestVendorId;
                        return (
                          <tr key={v.vendor_id} className="border-t dark:border-gray-800">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 dark:text-white">{v.vendor_name}</div>
                              <div className="text-xs text-gray-500">{v.vendor_id}</div>
                            </td>
                            <td className="px-4 py-3 font-semibold">{money(t, form.currency)}</td>
                            <td className="px-4 py-3">
                              {isBest ? (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Best</span>
                              ) : (
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                <span className="font-semibold">Next:</span> Approved RFQ → Convert to PO (will be in PO module).
              </div>
            </div>
          )}

          {/* 7) APPROVAL & CLOSURE */}
          {activeTab === "approval" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Approval Status</h4>
                  <p className={helperBase}>Draft → Sent → Pending Approval → Approved/Rejected → Closed</p>

                  <div className="mt-3">
                    <label className={labelBase}>RFQ Status</label>
                    <input
                      readOnly
                      value={form.rfq_status}
                      className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                    />
                  </div>

                  <div className="mt-4">
                    <label className={labelBase}>Approval Remarks (Optional)</label>
                    <textarea
                      value={form.approval_remarks}
                      onChange={(e) => setField("approval_remarks", e.target.value)}
                      className={classNames(inputBase, "min-h-[110px] resize-y")}
                      placeholder="Approver notes..."
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: form.rfq_status === "Pending Approval" ? 1 : 0.6 }}
                      disabled={form.rfq_status !== "Pending Approval"}
                      onClick={onReject}
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      className={classNames(primaryBtn, "active:scale-95")}
                      style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: form.rfq_status === "Pending Approval" ? 1 : 0.6 }}
                      disabled={form.rfq_status !== "Pending Approval"}
                      onClick={onApprove}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Closure</h4>
                  <p className={helperBase}>After Approved → Convert to PO → Close RFQ</p>

                  <button
                    type="button"
                    className={classNames(primaryBtn, "w-full active:scale-95")}
                    style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: form.rfq_status === "Approved" ? 1 : 0.6 }}
                    disabled={form.rfq_status !== "Approved"}
                    onClick={onClose}
                  >
                    Close RFQ
                  </button>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Convert RFQ → PO button will be in PO Create screen (next module).
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={outlineBtn} onClick={onReset} disabled={isLocked || isViewMode}>
          Reset
        </button>

        <button
          type="button"
          className={classNames(primaryBtn, "active:scale-95")}
          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSaveDraft}
          disabled={isLocked || isViewMode}
        >
          Save Draft
        </button>

        <button
          type="button"
          className={classNames(primaryBtn, "active:scale-95")}
          style={{ backgroundColor: FORTUNA_PRIMARY_RED, opacity: isLocked ? 0.6 : 1 }}
          onClick={onSendRFQ}
          disabled={isLocked || isViewMode}
        >
          Send RFQ
        </button>
      </div>
    </div>
  );
  
}
