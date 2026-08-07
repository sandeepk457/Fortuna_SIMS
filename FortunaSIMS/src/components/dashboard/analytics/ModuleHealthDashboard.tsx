"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL } from "@/app/utils/apiBase";

interface DashboardMetrics {
  totalCustomers: number;
  totalVendors: number;
  totalItems: number;
  totalWarehouses: number;
  totalPR: number;
  totalRFQ: number;
  totalPO: number;
  totalGRN: number;
}

interface ModuleStatus {
  name: string;
  count: number;
  status: "Live" | "Working In Progress";
  color: string;
}

export default function ModuleHealthDashboard() {

  const [metrics, setMetrics] =
    useState<DashboardMetrics>({
      totalCustomers: 0,
      totalVendors: 0,
      totalItems: 0,
      totalWarehouses: 0,
      totalPR: 0,
      totalRFQ: 0,
      totalPO: 0,
      totalGRN: 0,
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    fetchMetrics();

  }, []);

  async function fetchMetrics() {

    try {

      const res = await axios.get(
        `${API_BASE_URL}/api/ecommerce/metrics`
      );

      setMetrics(res.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  const modules: ModuleStatus[] = [

    {
      name: "Customer Master",
      count: metrics.totalCustomers,
      status: "Live",
      color: "green",
    },

    {
      name: "Vendor Master",
      count: metrics.totalVendors,
      status: "Live",
      color: "green",
    },

    {
      name: "Item Master",
      count: metrics.totalItems,
      status: "Live",
      color: "green",
    },

    {
      name: "Warehouse Master",
      count: metrics.totalWarehouses,
      status: "Live",
      color: "green",
    },

    {
      name: "Purchase Requisition",
      count: metrics.totalPR,
      status: "Live",
      color: "green",
    },

    {
      name: "RFQ Management",
      count: metrics.totalRFQ,
      status: "Live",
      color: "green",
    },

    {
      name: "Purchase Orders",
      count: metrics.totalPO,
      status: "Working In Progress",
      color: "yellow",
    },

    {
      name: "GRN Execution",
      count: metrics.totalGRN,
      status: "Working In Progress",
      color: "yellow",
    },

  ];

  const liveModules =
    modules.filter(
      m => m.status === "Live"
    ).length;

  const progress =
    Math.round(
      (liveModules / modules.length) * 100
    );

  return (

    <div className="rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-[#0F172A]">

  {/* ================= HEADER ================= */}

  <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">

    <div>

      <h2 className="text-xl font-bold text-[#C8102E]">
        Module Health Dashboard
      </h2>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Enterprise System Readiness
      </p>

    </div>

    <div className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">

      LIVE

    </div>

  </div>

  {/* ================= KPI ================= */}

  <div className="grid grid-cols-2 gap-5 border-b border-gray-200 p-6 dark:border-gray-800">

    <div className="rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#005F99] p-5 text-white">

      <p className="text-sm opacity-80">

        Implementation Progress

      </p>

      <h2 className="mt-2 text-4xl font-bold">

        {progress}%

      </h2>

    </div>

    <div className="rounded-2xl border border-dashed border-[#005F99]/30 bg-[#F8FAFC] p-5 dark:bg-[#111827]">

      <p className="text-sm text-gray-500">

        Live Modules

      </p>

      <h2 className="mt-2 text-4xl font-bold text-[#005F99]">

        {liveModules}

      </h2>

    </div>

  </div>

  {/* ================= PROGRESS ================= */}

  <div className="px-6 pt-6">

    <div className="mb-2 flex items-center justify-between">

      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">

        Overall Readiness

      </span>

      <span className="font-bold text-[#005F99]">

        {progress}%

      </span>

    </div>

    <div className="h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">

      <div
        className="h-4 rounded-full bg-gradient-to-r from-[#C8102E] to-[#005F99] transition-all duration-1000"
        style={{
          width: `${progress}%`,
        }}
      />

    </div>

  </div>

  {/* ================= MODULE LIST ================= */}

  <div className="grid gap-4 p-6">

    {loading ? (

      <div className="py-10 text-center text-gray-500">

        Loading Module Health...

      </div>

    ) : (

      modules.map((module) => (

        <div
          key={module.name}
          className="rounded-2xl border border-gray-100 p-5 transition-all hover:shadow-lg dark:border-gray-700"
        >

          <div className="flex items-center justify-between">

            <div>

              <h4 className="font-semibold text-gray-800 dark:text-white">

                {module.name}

              </h4>

              <p className="mt-1 text-sm text-gray-500">

                {module.count} Records

              </p>

            </div>

            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                module.status === "Live"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >

              {module.status}

            </span>

          </div>

        </div>

      ))

    )}

  </div>

    {/* ================= FOOTER ================= */}

  <div className="border-t border-gray-200 p-6 dark:border-gray-800">

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

      {/* Enterprise Readiness */}

      <div className="rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#005F99] p-5 text-white">

        <p className="text-sm opacity-80">

          Enterprise Readiness

        </p>

        <h3 className="mt-2 text-3xl font-bold">

          {progress}%

        </h3>

        <p className="mt-2 text-sm opacity-90">

          Fortuna SIMS implementation is progressing successfully.

        </p>

      </div>

      {/* Live Status */}

      <div className="rounded-2xl border border-dashed border-[#005F99]/30 bg-[#F8FAFC] p-5 dark:bg-[#111827]">

        <p className="text-sm text-gray-500">

          Overall Status

        </p>

        <div className="mt-3 flex items-center gap-3">

          <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse"></div>

          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">

            Healthy

          </h3>

        </div>

        <p className="mt-3 text-sm text-gray-500">

          Core business modules are operational and ready for enterprise usage.

        </p>

      </div>

    </div>

  </div>

</div>

  );

}