"use client";

import { useState } from "react";

import WarehouseCapacityHeader from "./WarehouseCapacityHeader";
import WarehouseKPICards from "./WarehouseKPICards";
import WarehouseSummaryCard from "./WarehouseSummaryCard";
import WarehouseStructureAnalytics from "./WarehouseStructureAnalytics";

export default function WarehouseCapacityDashboard() {

  const [selectedWarehouseCode, setSelectedWarehouseCode] =
  useState("");

  return (

  <div className="overflow-hidden rounded-3xl bg-white shadow-xl">

    <WarehouseCapacityHeader
      selectedWarehouseCode={selectedWarehouseCode}
      setSelectedWarehouseCode={setSelectedWarehouseCode}
    />

    <WarehouseKPICards
      warehouseCode={selectedWarehouseCode}
    />

    <WarehouseSummaryCard
      warehouseCode={selectedWarehouseCode}
    />

    <WarehouseStructureAnalytics
      warehouseCode={selectedWarehouseCode}
    />

  </div>

);
}