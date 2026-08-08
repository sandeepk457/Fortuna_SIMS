"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL } from "@/app/utils/apiBase";

interface Warehouse {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
}

interface Props {
  selectedWarehouseCode: string;
  setSelectedWarehouseCode: React.Dispatch<React.SetStateAction<string>>;
}

export default function WarehouseCapacityHeader({
  selectedWarehouseCode,
  setSelectedWarehouseCode,
}: Props) {

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  async function fetchWarehouses() {

    try {

      const res = await axios.get(
        `${API_BASE_URL}/api/warehouses`
      );

      setWarehouses(res.data);

if (
  res.data.length > 0 &&
  !selectedWarehouseCode
) {
  setSelectedWarehouseCode(
    res.data[0].warehouse_code
  );
}

    } catch (err) {

      console.error(err);

    }

  }

 return (

  <div className="rounded-t-3xl border-b border-gray-200 bg-white p-6 shadow-sm">

    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

      {/* Left Side */}

      <div>

        <h2 className="text-2xl font-bold text-[#C8102E]">
          Warehouse Capacity Dashboard
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Enterprise Warehouse Utilization & Capacity Monitoring
        </p>

      </div>

      {/* Right Side */}

      <div className="flex flex-wrap items-center gap-3">

        <select
          value={selectedWarehouseCode}
          onChange={(e) => setSelectedWarehouseCode(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
        >
          <option value="ALL">All Warehouses</option>

          {warehouses.map((warehouse) => (
            <option
              key={warehouse.warehouse_id}
              value={warehouse.warehouse_code}
            >
              {warehouse.warehouse_name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
        />

        <button
          className="rounded-xl bg-gradient-to-r from-[#C8102E] to-[#005F99] px-5 py-2 font-medium text-white shadow-lg transition hover:shadow-xl"
        >
          Refresh
        </button>

      </div>

    </div>

  </div>

);

}