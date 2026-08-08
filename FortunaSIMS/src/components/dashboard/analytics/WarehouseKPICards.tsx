"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL } from "@/app/utils/apiBase";

interface DashboardData {

  statistics:{

    zones:number;

    aisles:number;

    racks:number;

    bins:number;

  };

  capacity:{

    totalBins:number;

    availableBins:number;

    occupiedBins:number;

    occupancyPercentage:number;

    rackUtilization:number;

  };

}

interface Props {
  warehouseCode: string;
}

export default function WarehouseKPICards({
  warehouseCode,
}: Props) {
  const [dashboard, setDashboard] =
useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

if(warehouseCode){

setLoading(true);

fetchDashboard();

}

}, [warehouseCode]);

  async function fetchDashboard() {
    try {
      const res = await axios.get(

`${API_BASE_URL}/api/warehouses/dashboard/${warehouseCode}`

);

setDashboard(res.data);
console.log("========== KPI ==========");
console.log("Warehouse Code :", warehouseCode);
console.log("API Response :", res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {

    return (
      <div className="p-6 text-center text-gray-500">
        Loading Warehouse Statistics...
      </div>
    );

  }

 
console.log("Dashboard State :", dashboard);
const cards = [

  {
    title: "Total Bins",
    value: dashboard?.capacity?.totalBins ?? 0,
    unit: "Storage Bins",
    color: "text-[#C8102E]",
    border: "border-[#C8102E]",
  },

  {
    title: "Available Bins",
    value: dashboard?.capacity?.availableBins ?? 0,
    unit: "Available",
    color: "text-green-600",
    border: "border-green-500",
  },

  {
    title: "Occupied Bins",
    value: dashboard?.capacity?.occupiedBins ?? 0,
    unit: "Occupied",
    color: "text-orange-600",
    border: "border-orange-500",
  },

  {
    title: "Occupancy %",
    value: `${dashboard?.capacity?.occupancyPercentage ?? 0}%`,
    unit: "Warehouse Usage",
    color: "text-[#005F99]",
    border: "border-[#005F99]",
  },

  {
    title: "Rack Utilization",
    value: `${dashboard?.capacity?.rackUtilization ?? 0}%`,
    unit: "Rack Usage",
    color: "text-purple-600",
    border: "border-purple-600",
  },

];

  return (

    <div className="border-t border-[#005F99]/20 bg-gradient-to-b from-[#F4FAFE] to-[#E6F3FC] dark:border-gray-800 dark:bg-[#111827]">

      <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 xl:grid-cols-5">

        {cards.map((card) => (

          <div
            key={card.title}
            className={`rounded-2xl border-l-4 ${card.border} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-[#1F2937]`}
          >

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">

              {card.title}

            </p>

            <h2
              className={`mt-4 text-4xl font-bold ${card.color}`}
            >

              {card.value}

            </h2>

            <p className="mt-2 text-sm text-gray-500">

              {card.unit}

            </p>

            <div className="mt-5 h-1 rounded-full bg-gray-200">

              <div
                className={`h-1 w-1/2 rounded-full ${
                  card.border.replace("border", "bg")
                }`}
              />

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}