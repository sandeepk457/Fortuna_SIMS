import type { Metadata } from "next";
import React from "react";

import ExecutiveKPICards from "@/components/dashboard/executive/ExecutiveKPICards";
import InventoryAnalytics from "@/components/dashboard/analytics/InventoryAnalytics";
import RFQStatusDashboard from "@/components/dashboard/analytics/RFQStatusDashboard";

import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyProcurementTrend from "@/components/ecommerce/MonthlyProcurementTrend";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";

export const metadata: Metadata = {
  title: "Fortuna SIMS | Supply & Inventory Management System",
  description: "A Product From Fortuna Global Supply Chain Systems",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-6">

      {/* =========================
          Executive KPI Cards
      ========================== */}
      <div className="col-span-12">
        <ExecutiveKPICards />
      </div>

      {/* =========================
          Procurement Analytics Row
      ========================== */}
      <div className="col-span-12 xl:col-span-7">
        <MonthlyProcurementTrend />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <RFQStatusDashboard />
      </div>

      {/* =========================
          Inventory & Sales Row
      ========================== */}
      <div className="col-span-12 xl:col-span-6">
        <InventoryAnalytics />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <MonthlySalesChart />
      </div>

      {/* =========================
          Statistics
      ========================== */}
      <div className="col-span-12">
        <StatisticsChart />
      </div>

      {/* =========================
          Bottom Widgets
      ========================== */}
      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>

    </div>
  );
}