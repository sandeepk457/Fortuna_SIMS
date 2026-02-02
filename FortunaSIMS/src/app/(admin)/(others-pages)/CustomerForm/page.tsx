"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

type TabKey = "basic" | "commercial" | "compliance" | "status";

/** Customer Enums */
type CustomerType = "Retail" | "Wholesale" | "Distributor" | "Institutional" | "Other" | "";
type CustomerTier = "Tier 1" | "Tier 2" | "Tier 3" | "";
type CustomerStatus = "Active" | "Inactive" | "Blocked" | "";

type Currency = "INR" | "USD" | "EUR" | "";
type PaymentTerms = "Advance" | "Net 15" | "Net 30" | "Net 45" | "";

type ComplianceStatus = "Pending" | "Verified" | "Rejected" | "";

/** Customer Form State (Vendor style) */
type CustomerFormState = {
  /** Basic */
  customer_id: string; // System (auto)
  customer_code: string; // required unique
  customer_name: string; // required min 3
  customer_type: CustomerType; // required
  customer_tier: CustomerTier; // optional
  contact_person_name: string; // required alphabets only
  contact_phone: string; // 9999999999
  contact_email: string; // required email
  alternate_phone: string; // optional

  billing_address: string; // required
  shipping_address_same_as_billing: boolean; // optional
  shipping_address: string; // conditional required
  city: string; // required
  state: string; // required
  country: string; // required default India
  postal_code: string; // required numeric

  status: CustomerStatus; // required default Active
  onboarded_date: string; // System (auto)

  /** Commercial */
  currency: Currency; // required
  payment_terms: PaymentTerms; // required
  credit_limit: string; // optional decimal >=0
  price_list_ref: string; // optional
  credit_days: string; // required integer >= 0
  tax_applicable: boolean; // required (yes/no)
  gst_percentage: string; // conditional (if tax_applicable true)
  discount_percentage: string; // optional 0-100

  /** Compliance */
  gstin: string; // conditional required when tax_applicable true (15 chars)
  pan: string; // required PAN regex (most orgs keep mandatory)
  msme_registered: boolean; // optional
  msme_number: string; // conditional
  bank_account_name: string; // optional (if bank section used -> required)
  bank_account_number: string; // optional numeric
  bank_name: string; // optional
  ifsc_code: string; // optional IFSC regex
  cancelled_cheque_file: File | null; // optional PDF/JPG
  compliance_status: ComplianceStatus; // default Pending
  compliance_verified_by: string; // System
  compliance_verified_date: string; // System
};

const initialState: CustomerFormState = {
  customer_id: "Auto-generated",
  customer_code: "",
  customer_name: "",
  customer_type: "",
  customer_tier: "",
  contact_person_name: "",
  contact_phone: "",
  contact_email: "",
  alternate_phone: "",

  billing_address: "",
  shipping_address_same_as_billing: true,
  shipping_address: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",

  status: "Active",
  onboarded_date: "Auto-set",

  currency: "INR",
  payment_terms: "",
  credit_limit: "",
  price_list_ref: "",
  credit_days: "",
  tax_applicable: true,
  gst_percentage: "",
  discount_percentage: "",

  gstin: "",
  pan: "",
  msme_registered: false,
  msme_number: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_name: "",
  ifsc_code: "",
  cancelled_cheque_file: null,
  compliance_status: "Pending",
  compliance_verified_by: "Auto",
  compliance_verified_date: "Auto",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "commercial", label: "Commercial Terms" },
  { key: "compliance", label: "Compliance" },
  { key: "status", label: "Status & Audit" },
];

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

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function isPhone10to15(v: string) {
  return /^[0-9]{10,15}$/.test(v.trim());
}
function isPostal(v: string) {
  return /^[0-9]{4,10}$/.test(v.trim());
}
function isPAN(v: string) {
  // PAN: 5 letters + 4 digits + 1 letter
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.trim().toUpperCase());
}
function isGSTIN15(v: string) {
  return v.trim().length === 15;
}
function isIFSC(v: string) {
  // IFSC: 4 letters + 0 + 6 alphanumeric
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.trim().toUpperCase());
}
function isAlphaSpaces(v: string) {
  return /^[A-Za-z\s]+$/.test(v.trim());
}

export default function CustomerMasterCreatePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [form, setForm] = useState<CustomerFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    /** BASIC REQUIRED */
    if (!form.customer_code.trim()) e.customer_code = "Customer Code is required";
    if (!form.customer_name.trim()) e.customer_name = "Customer Name is required";
    else if (form.customer_name.trim().length < 3) e.customer_name = "Min 3 characters";

    if (!form.customer_type) e.customer_type = "Customer Type is required";

    if (!form.contact_person_name.trim()) e.contact_person_name = "Contact Person Name is required";
    else if (!isAlphaSpaces(form.contact_person_name)) e.contact_person_name = "Alphabets only";

    if (!form.contact_phone.trim()) e.contact_phone = "Contact Phone is required";
    else if (!isPhone10to15(form.contact_phone)) e.contact_phone = "99XXXXXXXX";

    if (!form.contact_email.trim()) e.contact_email = "Email is required";
    else if (!isEmail(form.contact_email)) e.contact_email = "Invalid email format";

    if (form.alternate_phone.trim() && !isPhone10to15(form.alternate_phone)) {
      e.alternate_phone = "Alternate phone must be 10–15 digits";
    }

    if (!form.billing_address.trim()) e.billing_address = "Billing Address is required";

    if (!form.shipping_address_same_as_billing) {
      if (!form.shipping_address.trim()) e.shipping_address = "Shipping Address is required";
    }

    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    if (!form.country.trim()) e.country = "Country is required";

    if (!form.postal_code.trim()) e.postal_code = "PIN/ZIP is required";
    else if (!isPostal(form.postal_code)) e.postal_code = "PIN must be numeric";

    if (!form.status) e.status = "Status is required";

    /** COMMERCIAL REQUIRED */
    if (!form.currency) e.currency = "Currency is required";
    if (!form.payment_terms) e.payment_terms = "Payment Terms is required";

    if (!form.credit_days.trim()) e.credit_days = "Credit Days is required";
    else {
      const n = Number(form.credit_days);
      if (!Number.isInteger(n) || n < 0) e.credit_days = "Credit Days must be integer >= 0";
    }

    if (form.credit_limit.trim()) {
      const n = Number(form.credit_limit);
      if (Number.isNaN(n) || n < 0) e.credit_limit = "Credit Limit must be >= 0";
    }

    if (form.discount_percentage.trim()) {
      const n = Number(form.discount_percentage);
      if (Number.isNaN(n) || n < 0 || n > 100) e.discount_percentage = "Discount must be 0–100";
    }

    // GST% conditional
    if (form.tax_applicable) {
      if (!form.gst_percentage.trim()) e.gst_percentage = "GST % is required when tax applicable";
      else {
        const n = Number(form.gst_percentage);
        if (Number.isNaN(n) || n < 0 || n > 100) e.gst_percentage = "GST % must be 0–100";
      }

      if (!form.gstin.trim()) e.gstin = "GSTIN is required when tax applicable";
      else if (!isGSTIN15(form.gstin)) e.gstin = "GSTIN must be 15 characters";
    }

    /** COMPLIANCE */
    if (!form.pan.trim()) e.pan = "PAN is required";
    else if (!isPAN(form.pan)) e.pan = "Invalid PAN format";

    if (form.msme_registered) {
      if (!form.msme_number.trim()) e.msme_number = "MSME/Udyam number is required";
    }

    // Bank fields: optional, but if any filled -> enforce required
    const anyBank =
      form.bank_account_name.trim() ||
      form.bank_account_number.trim() ||
      form.bank_name.trim() ||
      form.ifsc_code.trim() ||
      Boolean(form.cancelled_cheque_file);

    if (anyBank) {
      if (!form.bank_account_name.trim()) e.bank_account_name = "Bank A/C Name is required";
      if (!form.bank_account_number.trim()) e.bank_account_number = "Bank A/C Number is required";
      else if (!/^[0-9]{6,18}$/.test(form.bank_account_number.trim()))
        e.bank_account_number = "A/C Number must be numeric (6–18 digits)";

      if (!form.bank_name.trim()) e.bank_name = "Bank Name is required";

      if (!form.ifsc_code.trim()) e.ifsc_code = "IFSC is required";
      else if (!isIFSC(form.ifsc_code)) e.ifsc_code = "Invalid IFSC format";
    }

    if (form.cancelled_cheque_file) {
      const ok =
        form.cancelled_cheque_file.type === "application/pdf" ||
        form.cancelled_cheque_file.type === "image/jpeg" ||
        form.cancelled_cheque_file.type === "image/jpg" ||
        form.cancelled_cheque_file.type === "image/png";
      if (!ok) e.cancelled_cheque_file = "Upload PDF/JPG/PNG only";
    }

    if (!form.compliance_status) e.compliance_status = "Compliance Status is required";

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;

  const setField = <K extends keyof CustomerFormState>(key: K, value: CustomerFormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const markTouched = (key: keyof CustomerFormState) => {
    setTouched((p) => ({ ...p, [key as string]: true }));
  };

  const showError = (key: keyof CustomerFormState) =>
    Boolean(touched[key as string] && errors[key as string]);

  const firstErrorTab = () => {
    const order: TabKey[] = ["basic", "commercial", "compliance", "status"];
    const tabFields: Record<TabKey, Array<keyof CustomerFormState>> = {
      basic: [
        "customer_code",
        "customer_name",
        "customer_type",
        "contact_person_name",
        "contact_phone",
        "contact_email",
        "alternate_phone",
        "billing_address",
        "shipping_address",
        "city",
        "state",
        "country",
        "postal_code",
        "status",
      ],
      commercial: ["currency", "payment_terms", "credit_limit", "credit_days", "gst_percentage", "discount_percentage"],
      compliance: [
        "gstin",
        "pan",
        "msme_number",
        "bank_account_name",
        "bank_account_number",
        "bank_name",
        "ifsc_code",
        "cancelled_cheque_file",
        "compliance_status",
      ],
      status: ["status"],
    };

    for (const t of order) {
      if (tabFields[t].some((f) => errors[f as string])) return t;
    }
    return "basic";
  };

  const onSave = () => {
    const allKeys = Object.keys(initialState) as Array<keyof CustomerFormState>;
    setTouched((p) => {
      const next = { ...p };
      allKeys.forEach((k) => (next[k as string] = true));
      return next;
    });

    if (hasErrors) {
      setActiveTab(firstErrorTab());
      return;
    }

    const payload = {
      ...form,
      shipping_address: form.shipping_address_same_as_billing ? form.billing_address : form.shipping_address,
    };

    console.log("Customer Saved:", payload);
    alert("Saved (demo). Next step: connect API.");
  };

  const onReset = () => {
    setForm(initialState);
    setTouched({});
    setActiveTab("basic");
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Customer Master" />

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Creation</h3>
          <p className={helperBase}>Capture customer profile, credit terms & compliance details.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineBtn} onClick={onReset}>
            Reset
          </button>
          <button type="button" className={primaryBtn} onClick={onSave}>
            Save Customer
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

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* BASIC TAB */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left */}
              <div className="space-y-5">
                <div>
                  <label className={labelBase}>
                    Customer ID <span className="text-xs text-gray-400">(System)</span>
                  </label>
                  <input
                    readOnly
                    value={form.customer_id}
                    className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                  />
                </div>

                <div>
                  <label className={labelBase}>
                    Customer Code <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.customer_code}
                    onChange={(e) => setField("customer_code", e.target.value)}
                    onBlur={() => markTouched("customer_code")}
                    placeholder="Ex: CUS-000123"
                    className={classNames(inputBase, showError("customer_code") && "border-brand-500")}
                  />
                  {showError("customer_code") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.customer_code}</p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>
                    Customer Name <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.customer_name}
                    onChange={(e) => setField("customer_name", e.target.value)}
                    onBlur={() => markTouched("customer_name")}
                    placeholder="Legal customer name"
                    className={classNames(inputBase, showError("customer_name") && "border-brand-500")}
                  />
                  {showError("customer_name") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.customer_name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      Customer Type <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.customer_type}
                      onChange={(e) => setField("customer_type", e.target.value as CustomerType)}
                      onBlur={() => markTouched("customer_type")}
                      className={classNames(inputBase, showError("customer_type") && "border-brand-500")}
                    >
                      <option value="">Select</option>
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Institutional">Institutional</option>
                      <option value="Other">Other</option>
                    </select>
                    {showError("customer_type") && (
                      <p className="mt-1 text-xs text-brand-500">{errors.customer_type}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelBase}>Customer Tier <span className={helperBase}>(Optional)</span></label>
                    <select
                      value={form.customer_tier}
                      onChange={(e) => setField("customer_tier", e.target.value as CustomerTier)}
                      className={inputBase}
                    >
                      <option value="">Select</option>
                      <option value="Tier 1">Tier 1</option>
                      <option value="Tier 2">Tier 2</option>
                      <option value="Tier 3">Tier 3</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Contact Person Name <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.contact_person_name}
                    onChange={(e) => setField("contact_person_name", e.target.value)}
                    onBlur={() => markTouched("contact_person_name")}
                    placeholder="Primary contact name"
                    className={classNames(inputBase, showError("contact_person_name") && "border-brand-500")}
                  />
                  {showError("contact_person_name") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.contact_person_name}</p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>
                    Billing Address <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <textarea
                    value={form.billing_address}
                    onChange={(e) => setField("billing_address", e.target.value)}
                    onBlur={() => markTouched("billing_address")}
                    placeholder="Billing address"
                    className={classNames(
                      inputBase,
                      "min-h-[110px] resize-y",
                      showError("billing_address") && "border-brand-500"
                    )}
                  />
                  {showError("billing_address") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.billing_address}</p>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={form.shipping_address_same_as_billing}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((p) => ({
                        ...p,
                        shipping_address_same_as_billing: checked,
                        shipping_address: checked ? "" : p.shipping_address,
                      }));
                    }}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Shipping Address Same as Billing
                    </p>
                    <p className={helperBase}>Uncheck if separate shipping address needed.</p>
                  </div>
                </label>

                {!form.shipping_address_same_as_billing && (
                  <div>
                    <label className={labelBase}>
                      Shipping Address <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <textarea
                      value={form.shipping_address}
                      onChange={(e) => setField("shipping_address", e.target.value)}
                      onBlur={() => markTouched("shipping_address")}
                      placeholder="Shipping address"
                      className={classNames(
                        inputBase,
                        "min-h-[110px] resize-y",
                        showError("shipping_address") && "border-brand-500"
                      )}
                    />
                    {showError("shipping_address") && (
                      <p className="mt-1 text-xs text-brand-500">{errors.shipping_address}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      Contact Phone <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      value={form.contact_phone}
                      onChange={(e) => setField("contact_phone", e.target.value.replace(/[^\d]/g, ""))}
                      onBlur={() => markTouched("contact_phone")}
                      placeholder="10-15 digits"
                      className={classNames(inputBase, showError("contact_phone") && "border-brand-500")}
                    />
                    {showError("contact_phone") && (
                      <p className="mt-1 text-xs text-brand-500">{errors.contact_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelBase}>Alternate Phone <span className={helperBase}>(Optional)</span></label>
                    <input
                      value={form.alternate_phone}
                      onChange={(e) => setField("alternate_phone", e.target.value.replace(/[^\d]/g, ""))}
                      onBlur={() => markTouched("alternate_phone")}
                      placeholder="Backup contact"
                      className={classNames(inputBase, showError("alternate_phone") && "border-brand-500")}
                    />
                    {showError("alternate_phone") && (
                      <p className="mt-1 text-xs text-brand-500">{errors.alternate_phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Contact Email <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.contact_email}
                    onChange={(e) => setField("contact_email", e.target.value)}
                    onBlur={() => markTouched("contact_email")}
                    placeholder="Email address"
                    className={classNames(inputBase, showError("contact_email") && "border-brand-500")}
                  />
                  {showError("contact_email") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.contact_email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      City <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      onBlur={() => markTouched("city")}
                      className={classNames(inputBase, showError("city") && "border-brand-500")}
                    />
                    {showError("city") && <p className="mt-1 text-xs text-brand-500">{errors.city}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      State <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                      onBlur={() => markTouched("state")}
                      className={classNames(inputBase, showError("state") && "border-brand-500")}
                    />
                    {showError("state") && <p className="mt-1 text-xs text-brand-500">{errors.state}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className={labelBase}>
                      Country <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      onBlur={() => markTouched("country")}
                      className={classNames(inputBase, showError("country") && "border-brand-500")}
                    />
                    {showError("country") && <p className="mt-1 text-xs text-brand-500">{errors.country}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelBase}>
                      Postal Code (PIN) <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <input
                      value={form.postal_code}
                      onChange={(e) => setField("postal_code", e.target.value.replace(/[^\d]/g, ""))}
                      onBlur={() => markTouched("postal_code")}
                      placeholder="Numeric"
                      className={classNames(inputBase, showError("postal_code") && "border-brand-500")}
                    />
                    {showError("postal_code") && (
                      <p className="mt-1 text-xs text-brand-500">{errors.postal_code}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMMERCIAL TAB */}
          {activeTab === "commercial" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>
                      Currency <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => setField("currency", e.target.value as Currency)}
                      onBlur={() => markTouched("currency")}
                      className={classNames(inputBase, showError("currency") && "border-brand-500")}
                    >
                      <option value="">Select</option>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    {showError("currency") && <p className="mt-1 text-xs text-brand-500">{errors.currency}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>
                      Payment Terms <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.payment_terms}
                      onChange={(e) => setField("payment_terms", e.target.value as PaymentTerms)}
                      onBlur={() => markTouched("payment_terms")}
                      className={classNames(inputBase, showError("payment_terms") && "border-brand-500")}
                    >
                      <option value="">Select</option>
                      <option value="Advance">Advance</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                    </select>
                    {showError("payment_terms") && (
                      <p className="mt-1 text-xs text-brand-500">{errors.payment_terms}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Credit Limit <span className={helperBase}>(Optional)</span></label>
                    <input
                      value={form.credit_limit}
                      onChange={(e) => setField("credit_limit", e.target.value)}
                      onBlur={() => markTouched("credit_limit")}
                      placeholder=">= 0"
                      className={classNames(inputBase, showError("credit_limit") && "border-brand-500")}
                    />
                    {showError("credit_limit") && (
                      <p className="mt-1 text-xs text-brand-500">{errors.credit_limit}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelBase}>Price List Ref <span className={helperBase}>(Optional)</span></label>
                    <input
                      value={form.price_list_ref}
                      onChange={(e) => setField("price_list_ref", e.target.value)}
                      placeholder="Linked price list ID"
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Credit Days <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.credit_days}
                    onChange={(e) => setField("credit_days", e.target.value.replace(/[^\d]/g, ""))}
                    onBlur={() => markTouched("credit_days")}
                    placeholder="Integer >= 0"
                    className={classNames(inputBase, showError("credit_days") && "border-brand-500")}
                  />
                  {showError("credit_days") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.credit_days}</p>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Tax & Discount</h4>
                  <p className={helperBase}>GST% is mandatory when Tax Applicable is Yes.</p>

                  <div className="mt-4 space-y-4">
                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={form.tax_applicable}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((p) => ({
                            ...p,
                            tax_applicable: checked,
                            gst_percentage: checked ? p.gst_percentage : "",
                            gstin: checked ? p.gstin : "",
                          }));
                        }}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Tax Applicable <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                        </p>
                        <p className={helperBase}>Yes / No</p>
                      </div>
                    </label>

                    <div>
                      <label className={labelBase}>
                        GST Percentage {form.tax_applicable && <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>}
                      </label>
                      <input
                        value={form.gst_percentage}
                        onChange={(e) => setField("gst_percentage", e.target.value)}
                        onBlur={() => markTouched("gst_percentage")}
                        placeholder="0 - 100"
                        disabled={!form.tax_applicable}
                        className={classNames(
                          inputBase,
                          !form.tax_applicable && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                          showError("gst_percentage") && "border-brand-500"
                        )}
                      />
                      {showError("gst_percentage") && (
                        <p className="mt-1 text-xs text-brand-500">{errors.gst_percentage}</p>
                      )}
                    </div>

                    <div>
                      <label className={labelBase}>Discount Percentage <span className={helperBase}>(Optional)</span></label>
                      <input
                        value={form.discount_percentage}
                        onChange={(e) => setField("discount_percentage", e.target.value)}
                        onBlur={() => markTouched("discount_percentage")}
                        placeholder="0 - 100"
                        className={classNames(inputBase, showError("discount_percentage") && "border-brand-500")}
                      />
                      {showError("discount_percentage") && (
                        <p className="mt-1 text-xs text-brand-500">{errors.discount_percentage}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                  <span className="font-semibold">Note:</span> Credit Days helps control overdue sales orders.
                </div>
              </div>
            </div>
          )}

          {/* COMPLIANCE TAB */}
          {activeTab === "compliance" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <label className={labelBase}>
                    GSTIN {form.tax_applicable && <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>}
                  </label>
                  <input
                    value={form.gstin}
                    onChange={(e) => setField("gstin", e.target.value.toUpperCase())}
                    onBlur={() => markTouched("gstin")}
                    placeholder="15-char GSTIN"
                    disabled={!form.tax_applicable}
                    className={classNames(
                      inputBase,
                      !form.tax_applicable && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("gstin") && "border-brand-500"
                    )}
                  />
                  {showError("gstin") && <p className="mt-1 text-xs text-brand-500">{errors.gstin}</p>}
                </div>

                <div>
                  <label className={labelBase}>
                    PAN <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <input
                    value={form.pan}
                    onChange={(e) => setField("pan", e.target.value.toUpperCase())}
                    onBlur={() => markTouched("pan")}
                    placeholder="ABCDE1234F"
                    className={classNames(inputBase, showError("pan") && "border-brand-500")}
                  />
                  {showError("pan") && <p className="mt-1 text-xs text-brand-500">{errors.pan}</p>}
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={form.msme_registered}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((p) => ({
                        ...p,
                        msme_registered: checked,
                        msme_number: checked ? p.msme_number : "",
                      }));
                    }}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      MSME Registered <span className={helperBase}>(Optional)</span>
                    </p>
                    <p className={helperBase}>Yes/No</p>
                  </div>
                </label>

                <div>
                  <label className={labelBase}>
                    MSME/Udyam Number {form.msme_registered && <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>}
                  </label>
                  <input
                    value={form.msme_number}
                    onChange={(e) => setField("msme_number", e.target.value)}
                    onBlur={() => markTouched("msme_number")}
                    disabled={!form.msme_registered}
                    className={classNames(
                      inputBase,
                      !form.msme_registered && "cursor-not-allowed bg-gray-50 dark:bg-white/5",
                      showError("msme_number") && "border-brand-500"
                    )}
                  />
                  {showError("msme_number") && <p className="mt-1 text-xs text-brand-500">{errors.msme_number}</p>}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelBase}>
                    Bank Account Name {/** required only if bank section used */}
                  </label>
                  <input
                    value={form.bank_account_name}
                    onChange={(e) => setField("bank_account_name", e.target.value)}
                    onBlur={() => markTouched("bank_account_name")}
                    className={classNames(inputBase, showError("bank_account_name") && "border-brand-500")}
                  />
                  {showError("bank_account_name") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.bank_account_name}</p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>Bank Account Number</label>
                  <input
                    value={form.bank_account_number}
                    onChange={(e) => setField("bank_account_number", e.target.value.replace(/[^\d]/g, ""))}
                    onBlur={() => markTouched("bank_account_number")}
                    className={classNames(inputBase, showError("bank_account_number") && "border-brand-500")}
                  />
                  {showError("bank_account_number") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.bank_account_number}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Bank Name</label>
                    <input
                      value={form.bank_name}
                      onChange={(e) => setField("bank_name", e.target.value)}
                      onBlur={() => markTouched("bank_name")}
                      className={classNames(inputBase, showError("bank_name") && "border-brand-500")}
                    />
                    {showError("bank_name") && <p className="mt-1 text-xs text-brand-500">{errors.bank_name}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>IFSC Code</label>
                    <input
                      value={form.ifsc_code}
                      onChange={(e) => setField("ifsc_code", e.target.value.toUpperCase())}
                      onBlur={() => markTouched("ifsc_code")}
                      placeholder="ABCD0XXXXXX"
                      className={classNames(inputBase, showError("ifsc_code") && "border-brand-500")}
                    />
                    {showError("ifsc_code") && <p className="mt-1 text-xs text-brand-500">{errors.ifsc_code}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>
                    Cancelled Cheque <span className={helperBase}>(Optional PDF/JPG/PNG)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setField("cancelled_cheque_file", e.target.files?.[0] ?? null)}
                    onBlur={() => markTouched("cancelled_cheque_file")}
                    className={classNames(
                      inputBase,
                      "px-2 py-2",
                      showError("cancelled_cheque_file") && "border-brand-500"
                    )}
                  />
                  {showError("cancelled_cheque_file") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.cancelled_cheque_file}</p>
                  )}
                </div>

                <div>
                  <label className={labelBase}>
                    Compliance Status <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                  </label>
                  <select
                    value={form.compliance_status}
                    onChange={(e) => setField("compliance_status", e.target.value as ComplianceStatus)}
                    onBlur={() => markTouched("compliance_status")}
                    className={classNames(inputBase, showError("compliance_status") && "border-brand-500")}
                  >
                    <option value="">Select</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  {showError("compliance_status") && (
                    <p className="mt-1 text-xs text-brand-500">{errors.compliance_status}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STATUS TAB */}
          {activeTab === "status" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Customer Status</h4>
                  <p className={helperBase}>Active / Inactive / Blocked</p>

                  <div className="mt-4">
                    <label className={labelBase}>
                      Status <span style={{ color: FORTUNA_PRIMARY_RED }}>*</span>
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value as CustomerStatus)}
                      onBlur={() => markTouched("status")}
                      className={classNames(inputBase, showError("status") && "border-brand-500")}
                    >
                      <option value="">Select</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                    {showError("status") && <p className="mt-1 text-xs text-brand-500">{errors.status}</p>}
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Blocked customers can be restricted from SO/Invoice.
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
                        Onboarded Date <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.onboarded_date}
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
                    <div>
                      <label className={labelBase}>
                        Customer ID <span className="text-xs text-gray-400">(System)</span>
                      </label>
                      <input
                        readOnly
                        value={form.customer_id}
                        className={classNames(inputBase, "cursor-not-allowed bg-gray-50 dark:bg-white/5")}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
                    <span className="font-semibold">Note:</span> Customer details will be audit-ready for compliance.
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
        <button type="button" className={primaryBtn} onClick={onSave}>
          Save Customer
        </button>
      </div>
    </div>
  );
}
