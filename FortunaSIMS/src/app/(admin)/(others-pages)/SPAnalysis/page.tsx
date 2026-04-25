"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

/** Fortuna Theme Colors */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/** Types */
type SPTab = "overview" | "vendors" | "incidents";

type VendorRow = {
  vendor_id: string;
  vendor_name: string;
  category: string;
  city: string;

  // KPIs
  on_time_pct: number; // 0-100
  quality_pct: number; // 0-100
  fill_rate_pct: number; // 0-100
  avg_lead_days: number; // >= 0

  // Performance signals
  total_pos: number;
  total_grns: number;
  late_deliveries: number;
  qc_failures: number;
  returns: number;

  // Score
  score: number; // 0-100 (computed)
  grade: "A" | "B" | "C" | "D";
};

type Incident = {
  id: string;
  vendor: string;
  type: "Late Delivery" | "QC Failed" | "Short Supply" | "Returns";
  date: string; // yyyy-mm-dd
  ref: string; // PO/GRN
  remarks: string;
};

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** UI atoms */
const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "focus:border-brand-300 dark:bg-gray-900 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30";

const labelBase = "text-sm font-semibold text-gray-700 dark:text-gray-200";
const helperBase = "text-xs text-gray-500 dark:text-gray-400";

const outlineBtn =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 " +
  "shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 " +
  "active:scale-95 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/5";

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-theme-sm " +
  "focus:outline-none focus:ring-3 focus:ring-brand-500/20 active:scale-95";

function Pill({ text, tone }: { text: string; tone: "red" | "blue" | "green" | "amber" | "gray" }) {
  const cls =
    tone === "red"
      ? "bg-rose-100 text-rose-700"
      : tone === "blue"
      ? "bg-blue-100 text-blue-700"
      : tone === "green"
      ? "bg-green-100 text-green-700"
      : tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200";

  return <span className={classNames("rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>{text}</span>;
}

function ProgressBar({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "primary" | "secondary";
}) {
  const v = clamp(value);
  const fill = color === "primary" ? FORTUNA_PRIMARY_RED : FORTUNA_SECONDARY_BLUE;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
          {label}
        </span>
        <span className="font-bold" style={{ color: FORTUNA_PRIMARY_RED }}>
          {v.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/10">
        <div className="h-2 rounded-full" style={{ width: `${v}%`, backgroundColor: fill }} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  accent = "red",
}: {
  title: string;
  value: string;
  sub?: string;
  accent?: "red" | "blue";
}) {
  const isRed = accent === "red";

  return (
    <div
      className="rounded-2xl p-4 shadow-sm text-white"
      style={{
        background: isRed
          ? "linear-gradient(135deg, #C8102E, #005F99)"
          : "linear-gradient(135deg, #005F99, #C8102E)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          
          {/* Title */}
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {title}
          </p>

          {/* Value */}
          <p className="mt-1 text-3xl font-extrabold text-white">
            {value}
          </p>

          {/* Sub text */}
          {sub && (
            <p className="mt-1 text-xs text-white/80">
              {sub}
            </p>
          )}
        </div>

        {/* Dot */}
        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white/80" />
      </div>
    </div>
  );
}

function MiniTrend({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  return (
    <div className="flex h-10 items-end gap-1">
      {points.map((p, i) => {
        const h = Math.round((p / max) * 40);
        return (
          <div
            key={i}
            className="w-2 rounded"
            style={{
              height: `${h}px`,
              backgroundColor: i === points.length - 1 ? FORTUNA_PRIMARY_RED : `${FORTUNA_SECONDARY_BLUE}AA`,
            }}
            title={String(p)}
          />
        );
      })}
    </div>
  );
}

function calcScore(v: Omit<VendorRow, "score" | "grade">) {
  // Weighted scoring:
  // On-time 35%, Quality 35%, Fill 20%, Lead time 10% (inverse)
  const onTime = clamp(v.on_time_pct);
  const quality = clamp(v.quality_pct);
  const fill = clamp(v.fill_rate_pct);

  // lead time inverse mapping: 2 days => 100, 20 days => 20
  const lead = clamp(110 - v.avg_lead_days * 5, 0, 100);

  const score = onTime * 0.35 + quality * 0.35 + fill * 0.2 + lead * 0.1;
  return Math.round(score);
}

function gradeFromScore(score: number): VendorRow["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function downloadCSV(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [
    header.join(","),
    ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function SupplierPerformanceAnalysisPage() {
  const [activeTab, setActiveTab] = useState<SPTab>("overview");

  /** Sample data (replace with API later) */
  const [vendors] = useState<VendorRow[]>(() => {
    const raw: Omit<VendorRow, "score" | "grade">[] = [
      {
        vendor_id: "V-001",
        vendor_name: "Sri Lakshmi Suppliers",
        category: "Packaging",
        city: "Visakhapatnam",
        on_time_pct: 92,
        quality_pct: 88,
        fill_rate_pct: 96,
        avg_lead_days: 5,
        total_pos: 18,
        total_grns: 22,
        late_deliveries: 2,
        qc_failures: 1,
        returns: 1,
      },
      {
        vendor_id: "V-002",
        vendor_name: "Aparna Packaging",
        category: "Packaging",
        city: "Hyderabad",
        on_time_pct: 84,
        quality_pct: 91,
        fill_rate_pct: 90,
        avg_lead_days: 7,
        total_pos: 14,
        total_grns: 16,
        late_deliveries: 3,
        qc_failures: 0,
        returns: 0,
      },
      {
        vendor_id: "V-003",
        vendor_name: "Prime 3PL",
        category: "Services",
        city: "Chennai",
        on_time_pct: 78,
        quality_pct: 80,
        fill_rate_pct: 86,
        avg_lead_days: 9,
        total_pos: 10,
        total_grns: 12,
        late_deliveries: 4,
        qc_failures: 1,
        returns: 2,
      },
      {
        vendor_id: "V-004",
        vendor_name: "FastLine Transport",
        category: "Logistics",
        city: "Vizag",
        on_time_pct: 70,
        quality_pct: 74,
        fill_rate_pct: 82,
        avg_lead_days: 12,
        total_pos: 9,
        total_grns: 11,
        late_deliveries: 5,
        qc_failures: 2,
        returns: 1,
      },
    ];

    return raw.map((r) => {
      const score = calcScore(r);
      return { ...r, score, grade: gradeFromScore(score) };
    });
  });

  const [incidents] = useState<Incident[]>([
    {
      id: "INC-001",
      vendor: "Sri Lakshmi Suppliers",
      type: "Late Delivery",
      date: "2026-02-02",
      ref: "PO-2026-014",
      remarks: "Delay due to transport strike",
    },
    {
      id: "INC-002",
      vendor: "FastLine Transport",
      type: "QC Failed",
      date: "2026-02-01",
      ref: "GRN-2026-022",
      remarks: "Damage observed in packaging",
    },
    { id: "INC-003", vendor: "Prime 3PL", type: "Short Supply", date: "2026-01-28", ref: "GRN-2026-018", remarks: "Short by 5 units" },
    { id: "INC-004", vendor: "FastLine Transport", type: "Returns", date: "2026-01-26", ref: "SR-2026-004", remarks: "Returned due to mismatch" },
  ]);

  /** Filters */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [minScore, setMinScore] = useState<string>("");
  const [grade, setGrade] = useState<VendorRow["grade"] | "">("");
  const [city, setCity] = useState<string>("");

  const categories = useMemo(() => Array.from(new Set(vendors.map((v) => v.category))).sort(), [vendors]);
  const cities = useMemo(() => Array.from(new Set(vendors.map((v) => v.city))).sort(), [vendors]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const min = minScore.trim() ? toNum(minScore, NaN) : NaN;

    return vendors
      .filter((v) => (s ? v.vendor_name.toLowerCase().includes(s) || v.vendor_id.toLowerCase().includes(s) : true))
      .filter((v) => (category ? v.category === category : true))
      .filter((v) => (city ? v.city === city : true))
      .filter((v) => (grade ? v.grade === grade : true))
      .filter((v) => (Number.isFinite(min) ? v.score >= min : true))
      .sort((a, b) => b.score - a.score);
  }, [vendors, search, category, city, grade, minScore]);

  /** Overview stats */
  const stats = useMemo(() => {
    const total = vendors.length;
    const avgScore = total ? Math.round(vendors.reduce((s, x) => s + x.score, 0) / total) : 0;

    const a = vendors.filter((x) => x.grade === "A").length;
    const b = vendors.filter((x) => x.grade === "B").length;
    const c = vendors.filter((x) => x.grade === "C").length;
    const d = vendors.filter((x) => x.grade === "D").length;

    const late = vendors.reduce((s, x) => s + x.late_deliveries, 0);
    const qcFail = vendors.reduce((s, x) => s + x.qc_failures, 0);
    const returns = vendors.reduce((s, x) => s + x.returns, 0);

    const top = [...vendors].sort((a, b) => b.score - a.score)[0];
    const worst = [...vendors].sort((a, b) => a.score - b.score)[0];

    return { total, avgScore, a, b, c, d, late, qcFail, returns, top, worst };
  }, [vendors]);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setCity("");
    setGrade("");
    setMinScore("");
  };

  const exportVendorsCSV = () => {
    downloadCSV(
      "supplier-performance-vendors.csv",
      [
        "Vendor ID",
        "Vendor Name",
        "Category",
        "City",
        "Score",
        "Grade",
        "On Time %",
        "Quality %",
        "Fill Rate %",
        "Avg Lead Days",
        "Total POs",
        "Total GRNs",
        "Late Deliveries",
        "QC Failures",
        "Returns",
      ],
      filtered.map((v) => [
        v.vendor_id,
        v.vendor_name,
        v.category,
        v.city,
        v.score,
        v.grade,
        v.on_time_pct,
        v.quality_pct,
        v.fill_rate_pct,
        v.avg_lead_days,
        v.total_pos,
        v.total_grns,
        v.late_deliveries,
        v.qc_failures,
        v.returns,
      ])
    );
  };

  /** Modal (drilldown) */
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  const selectedVendor = useMemo(() => vendors.find((v) => v.vendor_id === selectedVendorId), [vendors, selectedVendorId]);

  const vendorIncidents = useMemo(() => {
    if (!selectedVendor) return [];
    return incidents
      .filter((x) => x.vendor === selectedVendor.vendor_name)
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [incidents, selectedVendor]);

  const openVendor = (id: string) => {
    setSelectedVendorId(id);
    setModalOpen(true);
  };

  const incidentTone = (t: Incident["type"]): "red" | "amber" | "blue" | "green" | "gray" => {
    if (t === "QC Failed") return "red";
    if (t === "Late Delivery") return "amber";
    if (t === "Short Supply") return "blue";
    if (t === "Returns") return "red";
    return "gray";
  };

  /** Simple trend mock */
  const trend = useMemo(() => {
    const base = stats.avgScore || 70;
    return Array.from({ length: 10 }, (_, i) =>
      Math.max(40, Math.round(base + (i - 5) * 1.2 + (i % 2 ? 3 : -2)))
    );
  }, [stats.avgScore]);

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Supplier Performance Analysis" />

      <div
        className="min-h-screen rounded-2xl border bg-white p-6 dark:bg-gray-900"
        style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}
      >
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                Supplier Performance Analysis
              </h2>
              <span className="hidden h-2 w-2 rounded-full md:inline-block" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
            </div>
            <p className="mt-1 text-sm font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
              KPI Dashboard • Quality • On-time • Fill Rate • Lead Time
            </p>
            <div className="mt-3 h-[3px] w-24 rounded-full" style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={outlineBtn} onClick={resetFilters}>
              Reset Filters
            </button>

            <button
              type="button"
              className={classNames(primaryBtn)}
              style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
              onClick={exportVendorsCSV}
            >
              Export Vendors CSV
            </button>

            <button
              type="button"
              className={classNames(primaryBtn)}
              style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
              onClick={() => alert("Next (Phase-2): scoring weights config, SLA rules, alerts.")}
            >
              Configure Scoring
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { key: "overview", label: "Overview" },
            { key: "vendors", label: "Vendors" },
            { key: "incidents", label: "Incidents" },
          ].map((t) => {
            const isActive = activeTab === (t.key as SPTab);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as SPTab)}
                className={classNames(
                  "rounded-xl px-4 py-2 text-sm font-bold transition active:scale-95",
                  isActive
                    ? "text-white shadow"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                )}
                style={isActive ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Main */}
          <div className="xl:col-span-9 space-y-6">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard title="Total Vendors" value={String(stats.total)} sub="Active suppliers in system" accent="blue" />
                  <StatCard title="Avg Score" value={`${stats.avgScore}/100`} sub="Overall performance" accent="red" />
                  <StatCard title="Late Deliveries" value={String(stats.late)} sub="Across all suppliers" accent="red" />
                  <StatCard title="QC Failures" value={String(stats.qcFail)} sub="Inspection failed counts" accent="blue" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div
                    className="lg:col-span-7 rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-950"
                    style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}
                  >
                    <div className="fortuna-card-header">
  <h3 className="fortuna-card-title">
    Grade Distribution
  </h3>
  <span className="fortuna-card-dot-blue" />
</div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { k: "A", v: stats.a },
                        { k: "B", v: stats.b },
                        { k: "C", v: stats.c },
                        { k: "D", v: stats.d },
                      ].map((x) => (
                        <div key={x.k} className="rounded-xl border p-3" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                          <p className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                            Grade {x.k}
                          </p>
                          <p className="mt-1 text-xl font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                            {x.v}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-xl border bg-gray-50 p-4 text-xs dark:bg-white/5" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                      <span className="font-bold" style={{ color: FORTUNA_PRIMARY_RED }}>
                        Scoring:
                      </span>{" "}
                      On-time (35%) + Quality (35%) + Fill Rate (20%) + Lead Time (10% inverse). (Demo)
                    </div>
                  </div>

                  <div
                    className="lg:col-span-5 rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-950"
                    style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                        Score Trend (Mock)
                      </h3>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
                    </div>

                    <p className="mt-1 text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                      Last 10 periods (spark trend)
                    </p>

                    <div className="mt-4">
                      <MiniTrend points={trend} />
                    </div>

                    <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-xs dark:bg-white/5" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                      Tip: Next phase lo actual trend = GRN/PO timeline based.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-6 rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-950" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <h3 className="text-base font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      Top Supplier
                    </h3>

                    {stats.top ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white">{stats.top.vendor_name}</div>
                            <div className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                              {stats.top.vendor_id} • {stats.top.category} • {stats.top.city}
                            </div>
                          </div>
                          <Pill text={`Score ${stats.top.score}`} tone="green" />
                        </div>

                        <ProgressBar value={stats.top.on_time_pct} label="On-time" color="secondary" />
                        <ProgressBar value={stats.top.quality_pct} label="Quality" color="primary" />
                        <ProgressBar value={stats.top.fill_rate_pct} label="Fill Rate" color="secondary" />

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-full")}
                          style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }}
                          onClick={() => openVendor(stats.top.vendor_id)}
                        >
                          View Details
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">No data</p>
                    )}
                  </div>

                  <div className="lg:col-span-6 rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-950" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <h3 className="text-base font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      Needs Attention
                    </h3>

                    {stats.worst ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white">{stats.worst.vendor_name}</div>
                            <div className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                              {stats.worst.vendor_id} • {stats.worst.category} • {stats.worst.city}
                            </div>
                          </div>
                          <Pill text={`Score ${stats.worst.score}`} tone="amber" />
                        </div>

                        <ProgressBar value={stats.worst.on_time_pct} label="On-time" color="secondary" />
                        <ProgressBar value={stats.worst.quality_pct} label="Quality" color="primary" />
                        <ProgressBar value={stats.worst.fill_rate_pct} label="Fill Rate" color="secondary" />

                        <button
                          type="button"
                          className={classNames(primaryBtn, "w-full")}
                          style={{ backgroundColor: FORTUNA_PRIMARY_RED }}
                          onClick={() => openVendor(stats.worst.vendor_id)}
                        >
                          View Details
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">No data</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* VENDORS */}
            {activeTab === "vendors" && (
              <div className="space-y-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-gray-950" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 w-full">
                      <div>
                        <label className={labelBase} style={{ color: FORTUNA_SECONDARY_BLUE }}>
                          Search (Name/ID)
                        </label>
                        <input className={inputBase} placeholder="Example: V-001 / Sri..." value={search} onChange={(e) => setSearch(e.target.value)} />
                      </div>

                      <div>
                        <label className={labelBase} style={{ color: FORTUNA_SECONDARY_BLUE }}>
                          Category
                        </label>
                        <select className={inputBase} value={category} onChange={(e) => setCategory(e.target.value)}>
                          <option value="">All</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelBase} style={{ color: FORTUNA_SECONDARY_BLUE }}>
                          City
                        </label>
                        <select className={inputBase} value={city} onChange={(e) => setCity(e.target.value)}>
                          <option value="">All</option>
                          {cities.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelBase} style={{ color: FORTUNA_SECONDARY_BLUE }}>
                          Min Score
                        </label>
                        <input className={inputBase} placeholder="0-100" value={minScore} onChange={(e) => setMinScore(e.target.value.replace(/[^\d]/g, ""))} />
                        <p className={helperBase}>Example: 75</p>
                      </div>

                      <div>
                        <label className={labelBase} style={{ color: FORTUNA_SECONDARY_BLUE }}>
                          Grade
                        </label>
                        <select className={inputBase} value={grade} onChange={(e) => setGrade(e.target.value as any)}>
                          <option value="">All</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" className={outlineBtn} onClick={resetFilters}>
                        Clear
                      </button>
                      <button type="button" className={classNames(primaryBtn)} style={{ backgroundColor: FORTUNA_SECONDARY_BLUE }} onClick={exportVendorsCSV}>
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border shadow-sm dark:border-gray-800" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                  <table className="min-w-[1100px] w-full border-collapse text-sm">
                    <thead style={{ backgroundColor: `${FORTUNA_SECONDARY_BLUE}10` }}>
                      <tr>
                        <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                          Vendor
                        </th>
                        <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                          Category
                        </th>
                        <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                          City
                        </th>
                        <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                          KPIs
                        </th>
                        <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                          Lead Time
                        </th>
                        <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                          Score
                        </th>
                        <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="dark:text-gray-200">
                      {filtered.map((v) => (
                        <tr key={v.vendor_id} className="border-b hover:bg-red-50/40 dark:border-gray-800 dark:hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-gray-900 dark:text-white">{v.vendor_name}</div>
                            <div className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                              {v.vendor_id}
                            </div>
                          </td>

                          <td className="px-4 py-3 font-semibold">{v.category}</td>
                          <td className="px-4 py-3 font-semibold">{v.city}</td>

                          <td className="px-4 py-3">
                            <div className="grid grid-cols-1 gap-2 min-w-[260px]">
                              <ProgressBar value={v.on_time_pct} label="On-time" color="secondary" />
                              <ProgressBar value={v.quality_pct} label="Quality" color="primary" />
                              <ProgressBar value={v.fill_rate_pct} label="Fill Rate" color="secondary" />
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-extrabold text-gray-900 dark:text-white">{v.avg_lead_days} days</div>
                            <div className="text-xs text-gray-500">Avg lead time</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                                {v.score}
                              </span>
                              <Pill
                                text={`Grade ${v.grade}`}
                                tone={v.grade === "A" ? "green" : v.grade === "B" ? "blue" : v.grade === "C" ? "amber" : "red"}
                              />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Late: <span className="font-semibold">{v.late_deliveries}</span> • QC Fail:{" "}
                              <span className="font-semibold">{v.qc_failures}</span> • Returns:{" "}
                              <span className="font-semibold">{v.returns}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <button type="button" className="font-extrabold hover:underline" style={{ color: FORTUNA_SECONDARY_BLUE }} onClick={() => openVendor(v.vendor_id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                            No vendors found for current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl border bg-gray-50 p-4 text-xs dark:bg-white/5" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                  Tip: Phase-2 lo “score weights config”, “SLA rules”, “alerts”, “vendor compliance gating” add cheddam.
                </div>
              </div>
            )}

            {/* INCIDENTS */}
            {activeTab === "incidents" && (
              <div className="space-y-4">
                <div className="fortuna-card p-5" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                        Incident Register
                      </h3>
                      <p className="mt-1 text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                        Based on GRN QC / delivery delays / returns (demo data)
                      </p>
                    </div>

                    <button type="button" className={classNames(primaryBtn)} style={{ backgroundColor: FORTUNA_PRIMARY_RED }} onClick={() => alert("Next: Create Incident + link to GRN/PO + CAPA workflow")}>
                      + Raise Incident
                    </button>
                  </div>

                  <div className="mt-4 overflow-x-auto rounded-xl border dark:border-gray-800" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <table className="min-w-[900px] w-full border-collapse text-sm">
                      <thead style={{ backgroundColor: `${FORTUNA_SECONDARY_BLUE}10` }}>
                        <tr>
                          <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                            Vendor
                          </th>
                          <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                            Type
                          </th>
                          <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                            Reference
                          </th>
                          <th className="px-4 py-3 text-left font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                            Remarks
                          </th>
                        </tr>
                      </thead>

                      <tbody className="dark:text-gray-200">
                        {incidents
                          .slice()
                          .sort((a, b) => (a.date < b.date ? 1 : -1))
                          .map((x) => (
                            <tr key={x.id} className="border-b hover:bg-red-50/40 dark:border-gray-800 dark:hover:bg-white/5">
                              <td className="px-4 py-3 font-semibold">{x.date}</td>
                              <td className="px-4 py-3 font-extrabold text-gray-900 dark:text-white">{x.vendor}</td>
                              <td className="px-4 py-3">
                                <Pill text={x.type} tone={incidentTone(x.type)} />
                              </td>
                              <td className="px-4 py-3 font-semibold">{x.ref}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{x.remarks}</td>
                            </tr>
                          ))}

                        {incidents.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-300">
                              No incidents.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-xs dark:bg-white/5" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    Next: Incident → CAPA → supplier corrective action → score impact.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Quick Stats */}
          <div className="xl:col-span-3">
            <div className="fortuna-card p-5" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                  Quick Stats
                </h3>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FORTUNA_PRIMARY_RED }} />
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Total Vendors
                  </span>
                  <Pill text={String(stats.total)} tone="blue" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Avg Score
                  </span>
                  <Pill text={`${stats.avgScore}/100`} tone="green" />
                </div>

                <div className="my-2 border-t dark:border-gray-800" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Grade A
                  </span>
                  <Pill text={String(stats.a)} tone="green" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Grade B
                  </span>
                  <Pill text={String(stats.b)} tone="blue" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Grade C
                  </span>
                  <Pill text={String(stats.c)} tone="amber" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Grade D
                  </span>
                  <Pill text={String(stats.d)} tone="red" />
                </div>

                <div className="my-2 border-t dark:border-gray-800" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Late Deliveries
                  </span>
                  <Pill text={String(stats.late)} tone="amber" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    QC Failures
                  </span>
                  <Pill text={String(stats.qcFail)} tone="red" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                    Returns
                  </span>
                  <Pill text={String(stats.returns)} tone="red" />
                </div>
              </div>

              <div className="mt-5 rounded-xl border bg-gray-50 p-3 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-300" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                <span className="font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                  Tip:
                </span>{" "}
                Filters apply only in Vendors tab. Export takes filtered list.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Drilldown Modal */}
      {modalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                  Vendor Details
                </h3>
                <p className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                  {selectedVendor.vendor_name} • {selectedVendor.vendor_id} • {selectedVendor.category} • {selectedVendor.city}
                </p>
              </div>

              <button type="button" className={outlineBtn} onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border p-4" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-3" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <p className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                      Score
                    </p>
                    <p className="mt-1 text-2xl font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      {selectedVendor.score}/100
                    </p>
                    <div className="mt-2">
                      <Pill
                        text={`Grade ${selectedVendor.grade}`}
                        tone={selectedVendor.grade === "A" ? "green" : selectedVendor.grade === "B" ? "blue" : selectedVendor.grade === "C" ? "amber" : "red"}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border p-3" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <p className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                      Lead Time
                    </p>
                    <p className="mt-1 text-2xl font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      {selectedVendor.avg_lead_days} days
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Average lead time</p>
                  </div>

                  <div className="sm:col-span-2 space-y-3">
                    <ProgressBar value={selectedVendor.on_time_pct} label="On-time %" color="secondary" />
                    <ProgressBar value={selectedVendor.quality_pct} label="Quality %" color="primary" />
                    <ProgressBar value={selectedVendor.fill_rate_pct} label="Fill Rate %" color="secondary" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border p-3" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <p className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                      Total POs
                    </p>
                    <p className="mt-1 text-xl font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      {selectedVendor.total_pos}
                    </p>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <p className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                      Total GRNs
                    </p>
                    <p className="mt-1 text-xl font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      {selectedVendor.total_grns}
                    </p>
                  </div>
                  <div className="rounded-xl border p-3" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                    <p className="text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                      Returns
                    </p>
                    <p className="mt-1 text-xl font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                      {selectedVendor.returns}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                <h4 className="text-sm font-extrabold" style={{ color: FORTUNA_PRIMARY_RED }}>
                  Recent Incidents
                </h4>
                <p className="mt-1 text-xs font-semibold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                  Linked to GRN/PO references (demo)
                </p>

                <div className="mt-3 space-y-2">
                  {vendorIncidents.slice(0, 6).map((x) => (
                    <div key={x.id} className="rounded-xl border p-3" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                      <div className="flex items-center justify-between">
                        <Pill text={x.type} tone={incidentTone(x.type)} />
                        <span className="text-xs font-semibold text-gray-500">{x.date}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-700 dark:text-gray-200">
                        <span className="font-extrabold" style={{ color: FORTUNA_SECONDARY_BLUE }}>
                          Ref:
                        </span>{" "}
                        {x.ref}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{x.remarks}</div>
                    </div>
                  ))}

                  {vendorIncidents.length === 0 && (
                    <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                      No incidents for this vendor.
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-300" style={{ borderColor: `${FORTUNA_SECONDARY_BLUE}22` }}>
                  Next: Auto “supplier risk badge” + CAPA workflow.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
