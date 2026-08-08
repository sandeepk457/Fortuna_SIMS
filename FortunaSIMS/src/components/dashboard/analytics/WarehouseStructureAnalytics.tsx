"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE_URL } from "@/app/utils/apiBase";

interface WarehouseStructureData {
  warehouse: {
    warehouse_name: string;
    warehouse_code: string;
  };

  statistics: {
    zones: number;
    aisles: number;
    racks: number;
    bins: number;
  };

  zones: any[];
}

interface Props {
  warehouseCode: string;
}

export default function WarehouseStructureAnalytics({
  warehouseCode,
}: Props) {

  const selectedWarehouseCode = warehouseCode;

  const [data, setData] =
    useState<WarehouseStructureData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

  if (warehouseCode) {
    fetchStructure();
  }

}, [warehouseCode]);

  async function fetchStructure() {

    try {

      // Change warehouse code later based on dropdown selection
        const selectedWarehouseCode = warehouseCode;
            const res = await axios.get(
  `${API_BASE_URL}/api/warehouses/dashboard/${warehouseCode}`
);

      setData(res.data);

    } catch (err) {

      console.error("Warehouse Structure API Error", err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (

      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">

        <h2 className="text-lg font-semibold text-gray-600">

          Loading Warehouse Structure...

        </h2>

      </div>

    );

  }

  if (!data) {

    return (

      <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

        <h2 className="text-lg font-semibold text-red-600">

          Unable to load warehouse structure.

        </h2>

      </div>

    );

  }

  return (

    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">

      {/* ==========================================
          Header
      =========================================== */}

      <div className="border-b border-gray-200 bg-gradient-to-r from-[#C8102E] to-[#005F99] p-6">

        <h2 className="text-2xl font-bold text-white">

          Warehouse Structure Analytics

        </h2>

        <p className="mt-2 text-white/80">

          Real-Time Warehouse Layout Overview

        </p>

      </div>

      {/* KPI Cards Start Here */}

      <div className="p-6">

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* Zones */}

        <div className="rounded-2xl border-l-4 border-[#C8102E] bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">

            Total Zones

          </p>

          <h2 className="mt-4 text-4xl font-bold text-[#C8102E]">

            {data?.statistics?.zones ?? 0}

          </h2>

          <p className="mt-2 text-sm text-gray-500">

            Storage Zones

          </p>

          <div className="mt-5 h-1 rounded-full bg-gray-200">

            <div className="h-1 w-1/2 rounded-full bg-[#C8102E]" />

          </div>

        </div>

        {/* Aisles */}

        <div className="rounded-2xl border-l-4 border-[#005F99] bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">

            Total Aisles

          </p>

          <h2 className="mt-4 text-4xl font-bold text-[#005F99]">

            {data?.statistics?.aisles ?? 0}

          </h2>

          <p className="mt-2 text-sm text-gray-500">

            Warehouse Aisles

          </p>

          <div className="mt-5 h-1 rounded-full bg-gray-200">

            <div className="h-1 w-1/2 rounded-full bg-[#005F99]" />

          </div>

        </div>

        {/* Racks */}

        <div className="rounded-2xl border-l-4 border-green-500 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">

            Total Racks

          </p>

          <h2 className="mt-4 text-4xl font-bold text-green-600">

            {data?.statistics?.racks ?? 0}

          </h2>

          <p className="mt-2 text-sm text-gray-500">

            Storage Racks

          </p>

          <div className="mt-5 h-1 rounded-full bg-gray-200">

            <div className="h-1 w-1/2 rounded-full bg-green-500" />

          </div>

        </div>

        {/* Bins */}

        <div className="rounded-2xl border-l-4 border-purple-500 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">

            Total Bins

          </p>

          <h2 className="mt-4 text-4xl font-bold text-purple-600">

            {data?.statistics?.bins ?? 0}

          </h2>

          <p className="mt-2 text-sm text-gray-500">

            Bin Locations

          </p>

          <div className="mt-5 h-1 rounded-full bg-gray-200">

            <div className="h-1 w-1/2 rounded-full bg-purple-500" />

          </div>

        </div>

      </div>

      {/* ======================================================
          Zone Analytics Section Starts Here
      ====================================================== */}

      <div className="mt-8">

                <div className="overflow-hidden rounded-2xl border border-gray-200">

          {/* Table Header */}

          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">

            <h3 className="text-xl font-bold text-[#C8102E]">

              Zone Structure Overview

            </h3>

            <p className="mt-1 text-sm text-gray-500">

              Real-time warehouse layout hierarchy

            </p>

          </div>

          {/* Table */}

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-[#F8FAFC]">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">

                    Zone

                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">

                    Type

                  </th>

                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">

                    Aisles

                  </th>

                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">

                    Racks

                  </th>

                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">

                    Bins

                  </th>

                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">

                    Status

                  </th>

                </tr>

              </thead>

              <tbody>

                {data?.zones?.map((zone:any)=>( 

                  <tr
                    key={zone.zone_id}
                    className="border-t border-gray-100 transition hover:bg-blue-50"
                  >

                    <td className="px-6 py-4 font-semibold text-gray-800">

                      {zone.zone_name}

                    </td>

                    <td className="px-6 py-4">

                      {zone.zone_type}

                    </td>

                    <td className="px-6 py-4 text-center font-semibold">

                      {zone.aisles}

                    </td>

                    <td className="px-6 py-4 text-center font-semibold">

                      {zone.racks}

                    </td>

                    <td className="px-6 py-4 text-center font-semibold">

                      {zone.bins}

                    </td>

                    <td className="px-6 py-4 text-center">

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">

                        Active

                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

            {/* ======================================================
          Enterprise Summary Footer
      ====================================================== */}

      <div className="mt-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-[#F8FAFC] to-white p-6">

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Left */}

          <div>

            <h3 className="text-xl font-bold text-[#C8102E]">

              Warehouse Structure Summary

            </h3>

            <p className="mt-3 text-gray-600 leading-7">

              This warehouse structure has been configured using Fortuna SIMS
              Enterprise Warehouse Management System. The hierarchy includes
              warehouse zones, aisles, racks and storage bins which will be
              automatically utilized during Inventory, GRN, Putaway,
              Picking, Transfers and Cycle Count operations.

            </p>

          </div>

          {/* Right */}

          <div className="grid grid-cols-2 gap-5">

            <div className="rounded-xl bg-white p-5 shadow">

              <p className="text-xs uppercase tracking-wider text-gray-500">

                Warehouse Health

              </p>

              <h2 className="mt-3 text-3xl font-bold text-green-600">

                Excellent

              </h2>

              <p className="mt-2 text-sm text-gray-500">

                Structure Verified

              </p>

            </div>

            <div className="rounded-xl bg-white p-5 shadow">

              <p className="text-xs uppercase tracking-wider text-gray-500">

                Integration

              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#005F99]">

                Ready

              </h2>

              <p className="mt-2 text-sm text-gray-500">

                Inventory Module

              </p>

            </div>

            <div className="rounded-xl bg-white p-5 shadow">

              <p className="text-xs uppercase tracking-wider text-gray-500">

                Configuration

              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#C8102E]">

                Complete

              </h2>

              <p className="mt-2 text-sm text-gray-500">

                Warehouse Setup

              </p>

            </div>

            <div className="rounded-xl bg-white p-5 shadow">

              <p className="text-xs uppercase tracking-wider text-gray-500">

                Enterprise Grade

              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#005F99]">

                Ready

              </h2>

              <p className="mt-2 text-sm text-gray-500">

                Fortuna SIMS WMS

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

);

}

