"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL } from "@/app/utils/apiBase";

interface Warehouse {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_type: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
}

interface Props {
  warehouseCode: string;
}

export default function WarehouseSummaryCard({
  warehouseCode,
}: Props) {

  const [warehouse, setWarehouse] =
    useState<Warehouse | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

  if (warehouseCode) {
    fetchWarehouse();
  }

}, [warehouseCode]);

  async function fetchWarehouse() {


    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/warehouses/dashboard/${warehouseCode}`
      );

      setWarehouse(res.data.warehouse);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }

  }

  if (loading) {

    return (

      <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-lg">

        <h2 className="text-lg font-semibold text-gray-600">

          Loading Warehouse Summary...

        </h2>

      </div>

    );

  }

  if (!warehouse) {

    return (

      <div className="rounded-3xl border border-red-200 bg-red-50 p-10">

        <h2 className="text-lg font-semibold text-red-600">

          No Warehouse Found

        </h2>

      </div>

    );

  }

  return (

    <div className="rounded-3xl border border-gray-200 bg-white shadow-lg overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-[#C8102E] to-[#005F99] p-6">

        <h2 className="text-2xl font-bold text-white">

          Selected Warehouse

        </h2>

        <p className="mt-1 text-white/80">

          Real-Time Warehouse Information

        </p>

      </div>

      {/* Body starts here */}
      <div className="p-6">
              <div className="grid gap-6 lg:grid-cols-2">

        {/* Left Column */}

        <div className="space-y-5">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">

              Warehouse Name

            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-900">

              {warehouse.warehouse_name}

            </h2>

          </div>

          <div className="grid grid-cols-2 gap-5">

            <div>

              <p className="text-xs uppercase text-gray-500">

                Warehouse Code

              </p>

              <p className="mt-1 font-semibold text-[#005F99]">

                {warehouse.warehouse_code}

              </p>

            </div>

            <div>

              <p className="text-xs uppercase text-gray-500">

                Warehouse Type

              </p>

              <p className="mt-1 font-semibold text-gray-800">

                {warehouse.warehouse_type}

              </p>

            </div>

          </div>

          <div className="grid grid-cols-2 gap-5">

            <div>

              <p className="text-xs uppercase text-gray-500">

                City

              </p>

              <p className="mt-1 font-semibold">

                {warehouse.city}

              </p>

            </div>

            <div>

              <p className="text-xs uppercase text-gray-500">

                State

              </p>

              <p className="mt-1 font-semibold">

                {warehouse.state}

              </p>

            </div>

          </div>

        </div>

        {/* Right Column */}

        <div className="rounded-3xl bg-gradient-to-br from-[#C8102E] via-[#9A2743] to-[#005F99] p-6 text-white shadow-xl">

          <h3 className="text-xl font-bold">

            Warehouse Status

          </h3>

          <div className="mt-6 space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-white/80">

                Current Status

              </span>

              <span
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  warehouse.status?.toLowerCase() === "active"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              >

                {warehouse.status}

              </span>

            </div>

            <div className="flex items-center justify-between">

  <span className="text-white/80">
    Location
  </span>

  <span className="font-semibold text-right">
    {warehouse.city}, {warehouse.state}
  </span>

</div>

            <div className="flex items-center justify-between">

              <span className="text-white/80">

                Created On

              </span>

              <span className="font-semibold">

                {new Date(
                  warehouse.created_at
                ).toLocaleDateString()}

              </span>

            </div>

          </div>

        </div>

      </div>

            {/* ======================================================
          Enterprise Information Ribbon
      ====================================================== */}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-[#C8102E]/20 bg-[#C8102E]/5 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">

            Inventory Integration

          </p>

          <h4 className="mt-2 text-lg font-bold text-[#C8102E]">

            Pending

          </h4>

          <p className="mt-2 text-sm text-gray-600">

            Live warehouse utilization will automatically appear after
            Inventory & Bin Stock integration.

          </p>

        </div>

        <div className="rounded-2xl border border-[#005F99]/20 bg-[#005F99]/5 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">

            Warehouse Structure

          </p>

          <h4 className="mt-2 text-lg font-bold text-[#005F99]">

            Enterprise Ready

          </h4>

          <p className="mt-2 text-sm text-gray-600">

            Zones, Aisles, Racks and Bins are already configured in the
            warehouse master.

          </p>

        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

          <p className="text-xs uppercase tracking-wider text-gray-500">

            Operational Health

          </p>

          <h4 className="mt-2 text-lg font-bold text-green-600">

            Healthy

          </h4>

          <p className="mt-2 text-sm text-gray-600">

            Warehouse is active and available for future inventory
            operations.

          </p>

        </div>

      </div>

      {/* ======================================================
          Footer
      ====================================================== */}

      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 md:flex-row">

        <div>

          <h3 className="font-semibold text-gray-800">

            Fortuna Enterprise Warehouse Management

          </h3>

          <p className="mt-1 text-sm text-gray-500">

            This dashboard automatically synchronizes with Warehouse Master.
            Future releases will include live capacity, utilization,
            inventory occupancy and warehouse health analytics.

          </p>

        </div>

       

      </div>

    </div>

  </div>

  );

}

      