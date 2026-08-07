import type { Metadata } from "next";
import React from "react";

import ExecutiveKPICards from "@/components/dashboard/executive/ExecutiveKPICards";

import InventoryAnalytics from "@/components/dashboard/analytics/InventoryAnalytics";
import RFQStatusDashboard from "@/components/dashboard/analytics/RFQStatusDashboard";
import EnterpriseDemographics from "@/components/dashboard/analytics/EnterpriseDemographics";
import ModuleHealthDashboard from "@/components/dashboard/analytics/ModuleHealthDashboard";
import TopInventoryItems from "@/components/dashboard/analytics/TopInventoryItems";

import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyProcurementTrend from "@/components/ecommerce/MonthlyProcurementTrend";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";

export const metadata: Metadata = {
  title: "Fortuna SIMS | Supply & Inventory Management System",
  description: "A Product From Fortuna Global Supply Chain Systems",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-6">

      {/* ======================================================
          Executive KPI Cards
      ====================================================== */}
      <div className="col-span-12">
        <ExecutiveKPICards />
      </div>

      {/* ======================================================
          Procurement Analytics
      ====================================================== */}
      <div className="col-span-12 xl:col-span-8">
        <MonthlyProcurementTrend />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <RFQStatusDashboard />
      </div>

      {/* ======================================================
          Operations Analytics
      ====================================================== */}
      <div className="col-span-12 xl:col-span-6">
        <InventoryAnalytics />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <StatisticsChart />
      </div>

      {/* ======================================================
          Enterprise Analytics
      ====================================================== */}
      <div className="col-span-12 xl:col-span-6">
        <EnterpriseDemographics />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <MonthlySalesChart />
      </div>

      {/* ======================================================
          Recent Orders
      ====================================================== */}
      <div className="col-span-12">
        <RecentOrders />
      </div>

      {/* ======================================================
          Module Health Dashboard
      ====================================================== */}
      <div className="col-span-12">
        <ModuleHealthDashboard />
      </div>

      {/* ======================================================
          Top Inventory Items
      ====================================================== */}
      <div className="col-span-12">
        <TopInventoryItems />
      </div>

    </div>
  );
}