"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

export const EcommerceMetrics = () => {
  const [data, setData] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/ecommerce/metrics");
      setData(res.data);
    } catch (err) {
      console.error("Metrics API Error:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">

      {/* 🔴 CUSTOMERS CARD */}
      <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 text-white shadow-theme-lg">
        <div className="absolute inset-0 fortuna-red-layer" />
        <div className="absolute inset-0 fortuna-blue-layer" />

        <div className="fortuna-cubes">
          <div className="fortuna-cube cube1"></div>
          <div className="fortuna-cube cube2"></div>
          <div className="fortuna-cube cube3"></div>
        </div>

        <div className="absolute inset-0 pointer-events-none 
        bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_60%)]" />

        <div className="relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
            <GroupIcon className="text-white size-6" />
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <span className="text-sm text-white/80">Customers</span>

              {/* ✅ DYNAMIC VALUE */}
              <h4 className="mt-2 font-bold text-white text-title-sm">
                {data.totalCustomers.toLocaleString()}
              </h4>
            </div>

            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-sm">
              <ArrowUpIcon />
              0%
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 w-2 h-2 bg-white/80 rounded-full animate-pulse" />
      </div>

      {/* 🔵 ORDERS CARD (Future Ready) */}
      <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 text-white shadow-theme-lg">

        <div className="absolute inset-0 fortuna-blue-layer delay-2s" />
        <div className="absolute inset-0 fortuna-red-layer delay-2s" />

        <div className="fortuna-cubes">
          <div className="fortuna-cube cube1"></div>
          <div className="fortuna-cube cube2"></div>
          <div className="fortuna-cube cube3"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
            <BoxIconLine className="text-white size-6" />
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-white/80">Orders</span>

              {/* ✅ DYNAMIC VALUE */}
              <h4 className="mt-2 font-bold text-white text-title-sm">
                {data.totalOrders.toLocaleString()}
              </h4>
            </div>

            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-sm">
              <ArrowDownIcon />
              0%
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 w-2 h-2 bg-white/80 rounded-full animate-pulse" />
      </div>

    </div>
  );
};