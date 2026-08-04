"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function RFQStatusDashboard() {
  const [isOpen, setIsOpen] = useState(false);

  const series = [18, 2, 1, 1, 1];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },

    labels: [
      "Draft",
      "Submitted",
      "Pending Approval",
      "Approved",
      "Rejected",
    ],

    colors: [
      "#005F99",
      "#7C3AED",
      "#F59E0B",
      "#16A34A",
      "#C8102E",
    ],

    legend: {
      position: "bottom",
      fontSize: "13px",
    },

    dataLabels: {
      enabled: false,
    },

    stroke: {
      colors: ["#fff"],
    },

    plotOptions: {
      pie: {
        donut: {
          size: "72%",

          labels: {
            show: true,

            total: {
              show: true,
              label: "Total RFQs",

              formatter: () => "26",
            },
          },
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

        <div>

          <h3 className="text-xl font-bold text-[#C8102E]">
            RFQ Status Dashboard
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Live Procurement Workflow
          </p>

        </div>

        <div className="relative">

          <button onClick={() => setIsOpen(!isOpen)}>
            <MoreDotIcon className="text-gray-400 hover:text-[#C8102E]" />
          </button>

          <Dropdown
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            className="w-40 p-2"
          >
            <DropdownItem
              tag="button"
              onItemClick={() => setIsOpen(false)}
            >
              Refresh
            </DropdownItem>

            <DropdownItem
              tag="button"
              onItemClick={() => setIsOpen(false)}
            >
              Open RFQ Module
            </DropdownItem>

          </Dropdown>

        </div>

      </div>

      {/* Donut */}

      <div className="px-6 pt-4">

        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          height={320}
        />

      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-5">

        <div className="rounded-xl bg-[#005F99]/10 p-3">
          <p className="text-xs text-[#005F99]">Draft</p>
          <h4 className="text-2xl font-bold text-[#005F99]">18</h4>
        </div>

        <div className="rounded-xl bg-violet-100 p-3">
          <p className="text-xs text-violet-700">Submitted</p>
          <h4 className="text-2xl font-bold text-violet-700">2</h4>
        </div>

        <div className="rounded-xl bg-amber-100 p-3">
          <p className="text-xs text-amber-700">Pending</p>
          <h4 className="text-2xl font-bold text-amber-700">1</h4>
        </div>

        <div className="rounded-xl bg-green-100 p-3">
          <p className="text-xs text-green-700">Approved</p>
          <h4 className="text-2xl font-bold text-green-700">1</h4>
        </div>

      </div>

    </div>
  );
}