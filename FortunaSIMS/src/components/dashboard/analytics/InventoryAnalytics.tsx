"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

// ApexCharts
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function InventoryAnalytics() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const closeDropdown = () => setIsOpen(false);

  // ------------------------------------
  // Dummy Data
  // Later Replace with API
  // ------------------------------------

  const series = [
    {
      name: "Inventory Value",
      data: [165, 172, 181, 194, 206, 221, 236, 242, 251, 264, 276, 284],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 340,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      fontFamily: "Outfit, sans-serif",
    },

    colors: ["#005F99"],

    stroke: {
      curve: "smooth",
      width: 4,
    },

    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.8,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: "#E4E7EC",
      strokeDashArray: 5,
    },

    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],

      labels: {
        style: {
          colors: "#667085",
          fontSize: "12px",
        },
      },

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },
    },

    yaxis: {
      labels: {
        formatter(value) {
          return "₹" + value + "L";
        },

        style: {
          colors: "#667085",
          fontSize: "12px",
        },
      },
    },

    tooltip: {
      theme: "light",

      y: {
        formatter(value) {
          return "₹ " + value + " Lakhs";
        },
      },
    },

    markers: {
      size: 5,

      hover: {
        size: 8,
      },
    },

    legend: {
      show: false,
    },
  };

    return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-800 dark:bg-[#0F172A]">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">

        <div>
          <div className="flex items-center gap-3">

            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005F99] opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#005F99]"></span>
            </div>

            <h3 className="bg-gradient-to-r from-[#005F99] to-[#3B82F6] bg-clip-text text-xl font-bold text-transparent">
              Inventory Analytics
            </h3>

          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enterprise Inventory Performance Dashboard
          </p>
        </div>

        <div className="relative">

          <button onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-500 hover:text-[#005F99]" />
          </button>

          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-44 p-2"
          >
            <DropdownItem
              tag="button"
              onItemClick={closeDropdown}
              className="rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              View Analytics
            </DropdownItem>

            <DropdownItem
              tag="button"
              onItemClick={closeDropdown}
              className="rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              Export Report
            </DropdownItem>

          </Dropdown>

        </div>

      </div>

      {/* Inventory KPI */}

      <div className="grid grid-cols-1 gap-5 px-6 pt-6 lg:grid-cols-3">

        <div>

          <p className="text-sm text-gray-500">
            Current Inventory Value
          </p>

          <h2 className="mt-2 text-5xl font-bold text-[#005F99]">
            ₹2.84 Cr
          </h2>

          <p className="mt-3 text-sm font-semibold text-green-600">
            ▲ +8.4% from last month
          </p>

        </div>

        <div className="lg:col-span-2">

          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={320}
          />

        </div>

      </div>

      {/* Inventory Summary */}

      <div className="grid grid-cols-1 gap-4 px-6 pb-6 pt-4 md:grid-cols-3">

        <div className="rounded-2xl border border-[#005F99]/20 bg-[#005F99]/10 p-5 transition-all duration-300 hover:bg-[#005F99]/15 hover:shadow-lg">

          <p className="text-xs font-semibold uppercase tracking-widest text-[#005F99]">
            Raw Material
          </p>

          <h3 className="mt-2 text-3xl font-bold text-[#005F99]">
            ₹1.25 Cr
          </h3>

          <p className="mt-2 text-xs text-[#005F99]/80">
            44% of Total Inventory
          </p>

        </div>

        <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-5 transition-all duration-300 hover:bg-[#F59E0B]/15 hover:shadow-lg">

          <p className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B]">
            Work In Progress
          </p>

          <h3 className="mt-2 text-3xl font-bold text-[#F59E0B]">
            ₹62 L
          </h3>

          <p className="mt-2 text-xs text-[#F59E0B]/80">
            22% of Total Inventory
          </p>

        </div>

        <div className="rounded-2xl border border-[#16A34A]/20 bg-[#16A34A]/10 p-5 transition-all duration-300 hover:bg-[#16A34A]/15 hover:shadow-lg">

          <p className="text-xs font-semibold uppercase tracking-widest text-[#16A34A]">
            Finished Goods
          </p>

          <h3 className="mt-2 text-3xl font-bold text-[#16A34A]">
            ₹97 L
          </h3>

          <p className="mt-2 text-xs text-[#16A34A]/80">
            34% of Total Inventory
          </p>

        </div>

      </div>

      {/* Executive KPIs */}

      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 px-6 py-5 dark:border-gray-800">

        <div className="text-center">

          <p className="text-xs uppercase text-gray-500">
            Accuracy
          </p>

          <h4 className="mt-2 text-3xl font-bold text-[#005F99]">
            98.7%
          </h4>

        </div>

        <div className="text-center">

          <p className="text-xs uppercase text-gray-500">
            Turnover
          </p>

          <h4 className="mt-2 text-3xl font-bold text-[#16A34A]">
            6.2x
          </h4>

        </div>

        <div className="text-center">

          <p className="text-xs uppercase text-gray-500">
            Utilization
          </p>

          <h4 className="mt-2 text-3xl font-bold text-[#C8102E]">
            82%
          </h4>

        </div>

      </div>

    </div>
  );
}