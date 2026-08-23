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
}

export default function WarehouseCapacityCards() {

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      console.error("Warehouse fetch failed", err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (

      <div className="p-10 text-center text-gray-500">

        Loading Warehouse Master...

      </div>

    );

  }

  return (

    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
              {warehouses.map((warehouse) => (

        <div
          key={warehouse.warehouse_id}
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700 dark:bg-[#111827]"
        >

          {/* ==========================================
              Card Header
          =========================================== */}

          <div className="bg-gradient-to-r from-[#C8102E] to-[#005F99] px-6 py-5">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-lg font-bold text-white">

                  {warehouse.warehouse_name}

                </h3>

                <p className="mt-1 text-sm text-white/80">

                  {warehouse.warehouse_code}

                </p>

              </div>

              <span
                className={`rounded-full px-4 py-1 text-xs font-semibold ${
                  warehouse.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >

                {warehouse.status}

              </span>

            </div>

          </div>

          {/* ==========================================
              Warehouse Details
          =========================================== */}

          <div className="space-y-4 p-6">

            <div className="grid grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-gray-400">

                  Warehouse Type

                </p>

                <h4 className="mt-1 font-semibold text-gray-800 dark:text-white">

                  {warehouse.warehouse_type}

                </h4>

              </div>

              <div>

                <p className="text-xs uppercase text-gray-400">

                  Location

                </p>

                <h4 className="mt-1 font-semibold text-gray-800 dark:text-white">

                  {warehouse.city}, {warehouse.state}

                </h4>

              </div>

            </div>

            {/* Future Capacity Section */}

            <div className="rounded-2xl border border-dashed border-[#005F99]/30 bg-[#005F99]/5 p-5">

              <p className="text-sm font-semibold text-[#005F99]">

                Capacity Analytics

              </p>

              <p className="mt-2 text-sm text-gray-500">

                Live warehouse capacity, occupied space,
                available storage and utilization will
                automatically appear here after Inventory
                & Bin Stock integration.

              </p>

            </div>
                        <div className="flex items-center justify-between border-t border-gray-200 pt-5 dark:border-gray-700">

              <div>

                <p className="text-xs uppercase text-gray-400">

                  Future Integration

                </p>

                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">

                  Inventory • GRN • Putaway • Bin Stock

                </p>

              </div>

              <div className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">

                Enterprise Ready

              </div>

            </div>

          </div>

        </div>

      ))}

      {warehouses.length === 0 && (

        <div className="col-span-full rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-[#111827]">

          <h3 className="text-xl font-semibold text-gray-700 dark:text-white">

            No Warehouses Found

          </h3>

          <p className="mt-3 text-gray-500">

            Create your first warehouse from Warehouse Master.
            Once created, it will automatically appear here.

          </p>

        </div>

      )}

    </div>

  );

}