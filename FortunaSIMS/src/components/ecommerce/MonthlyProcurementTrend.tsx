"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

// Apex Chart
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function MonthlyProcurementTrend() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const closeDropdown = () => setIsOpen(false);

  // -----------------------------
  // Dummy Procurement Data
  // Later replace with API
  // -----------------------------
  const series = [
    {
      name: "Purchase Requisitions",
      data: [18, 22, 28, 34, 31, 42, 45, 52, 58, 61, 67, 74],
    },
    {
      name: "RFQs",
      data: [12, 15, 18, 24, 22, 29, 35, 39, 43, 48, 52, 58],
    },
    {
      name: "Purchase Orders",
      data: [8, 10, 12, 18, 16, 22, 27, 31, 35, 39, 42, 47],
    },
    {
      name: "GRNs",
      data: [5, 7, 9, 12, 15, 18, 21, 26, 29, 34, 38, 44],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 360,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      fontFamily: "Outfit, sans-serif",
    },

    colors: [
      "#C8102E", // Fortuna Red
      "#005F99", // Fortuna Blue
      "#C8102E", // Fortuna Red
      "#005F99", // Fortuna Blue
    ],

    stroke: {
      width: 0,
    },

    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadius: 8,
        borderRadiusApplication: "end",
      },
    },
    markers: {
      size: 5,
      hover: {
        size: 7,
      },
    },

    grid: {
      borderColor: "#E4E7EC",
      strokeDashArray: 4,
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
        style: {
          colors: "#667085",
          fontSize: "12px",
        },
      },
    },

    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "13px",
      labels: {
        colors: "#344054",
      },
    },

    tooltip: {
      theme: "light",
    },

    dataLabels: {
      enabled: false,
    },

    fill: {
      type: "solid",
    },
  };

    return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
            </div>

            <h3 className="bg-gradient-to-r from-[#C8102E] to-[#8B0E22] bg-clip-text text-xl font-bold tracking-tight text-transparent">
  Monthly Procurement Trend
</h3>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last 12 Months Procurement Analytics
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
              className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100"
            >
              View Report
            </DropdownItem>

            <DropdownItem
              tag="button"
              onItemClick={closeDropdown}
              className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-100"
            >
              Export Excel
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Chart */}

      <div className="px-4 pt-6">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={360}
        />
      </div>

      {/* Bottom Summary */}

      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 px-6 py-5 md:grid-cols-4 dark:border-gray-800">

        <div className="rounded-2xl border border-[#C8102E]/20 bg-[#C8102E]/10 p-4 transition-all duration-300 hover:bg-[#C8102E]/15 hover:shadow-lg">
  <p className="text-xs font-semibold uppercase tracking-widest text-[#C8102E] dark:text-[#FCA5A5]">
    PR's
  </p>

  <h4 className="mt-2 text-3xl font-bold text-[#C8102E] dark:text-white">
    74
  </h4>

  <p className="mt-1 flex items-center gap-1 text-xs text-[#C8102E]/80 dark:text-[#FCA5A5]">
    ▲ +18% vs Last Month
  </p>
</div>

        <div className="rounded-2xl border border-[#005F99]/20 bg-[#005F99]/10 p-4 transition-all duration-300 hover:bg-[#005F99]/15 hover:shadow-lg">
  <p className="text-xs font-semibold uppercase tracking-widest text-[#005F99] dark:text-[#66B3E0]">
    RFQ's
  </p>

  <h4 className="mt-2 text-3xl font-bold text-[#005F99] dark:text-white">
    58
  </h4>

  <p className="mt-1 flex items-center gap-1 text-xs text-[#005F99]/80 dark:text-[#66B3E0]">
    ▲ +12% vs Last Month
  </p>
</div>

       <div className="rounded-2xl border border-[#C8102E]/20 bg-[#C8102E]/10 p-4 transition-all duration-300 hover:bg-[#C8102E]/15 hover:shadow-lg">
  <p className="text-xs font-semibold uppercase tracking-widest text-[#C8102E] dark:text-[#FCA5A5]">
    PO's
  </p>

  <h4 className="mt-2 text-3xl font-bold text-[#C8102E] dark:text-white">
    47
  </h4>

  <p className="mt-1 flex items-center gap-1 text-xs text-[#C8102E]/80 dark:text-[#FCA5A5]">
    ▲ +9% vs Last Month
  </p>
</div>

        <div className="rounded-2xl border border-[#16A34A]/20 bg-[#16A34A]/10 p-4 transition-all duration-300 hover:bg-[#16A34A]/15 hover:shadow-lg">
  <p className="text-xs font-semibold uppercase tracking-widest text-[#16A34A] dark:text-[#86EFAC]">
    GRN's
  </p>

  <h4 className="mt-2 text-3xl font-bold text-[#16A34A] dark:text-white">
    44
  </h4>

  <p className="mt-1 flex items-center gap-1 text-xs text-[#16A34A]/80 dark:text-[#86EFAC]">
    ▲ +11% vs Last Month
  </p>
</div>

      </div>
    </div>
  );
}