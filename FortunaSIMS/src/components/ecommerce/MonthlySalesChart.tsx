"use client";

import { useState } from "react";

import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface SalesRegion {
  region: string;
  percentage: number;
  revenue: string;
}

export default function MonthlySalesChart() {

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const salesData: SalesRegion[] = [

    {
      region: "North Region",
      percentage: 92,
      revenue: "₹12.8 Cr",
    },

    {
      region: "South Region",
      percentage: 84,
      revenue: "₹10.6 Cr",
    },

    {
      region: "East Region",
      percentage: 73,
      revenue: "₹8.1 Cr",
    },

    {
      region: "West Region",
      percentage: 66,
      revenue: "₹6.7 Cr",
    },

    {
      region: "Export",
      percentage: 51,
      revenue: "₹4.2 Cr",
    },

  ];

  const getBarColor = (value: number) => {

    if (value >= 85)
      return "from-[#005F99] to-[#2F80ED]";

    if (value >= 70)
      return "from-[#C8102E] to-[#E63946]";

    return "from-gray-400 to-gray-500";

  };

  return (
    

<div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0F172A]">

  {/* ================= HEADER ================= */}

  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">

    <div>

      <h3 className="text-xl font-bold text-[#C8102E]">

        Sales Performance

      </h3>

      <p className="mt-1 text-sm text-gray-500">

        Regional Sales Achievement

      </p>

    </div>

    <div className="relative inline-block">

      <button
        onClick={toggleDropdown}
        className="rounded-xl border border-gray-200 p-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
      >

        <MoreDotIcon />

      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="w-44 p-2"
      >

        <DropdownItem onItemClick={closeDropdown}>
          Export Report
        </DropdownItem>

        <DropdownItem onItemClick={closeDropdown}>
          Refresh
        </DropdownItem>

      </Dropdown>

    </div>

  </div>

  {/* ================= KPI ================= */}

  <div className="grid grid-cols-2 gap-4 border-b border-gray-200 p-6 dark:border-gray-800">

    <div className="rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#005F99] p-5 text-white">

      <p className="text-sm opacity-80">

        Total Revenue

      </p>

      <h2 className="mt-2 text-4xl font-bold">

        ₹42.4 Cr

      </h2>

    </div>

    <div className="rounded-2xl border border-dashed border-[#005F99]/30 bg-[#F8FAFC] p-5 dark:bg-[#111827]">

      <p className="text-sm text-gray-500">

        Growth

      </p>

      <h2 className="mt-2 text-3xl font-bold text-[#005F99]">

        +18%

      </h2>

    </div>

  </div>

  {/* ================= SALES LIST ================= */}

  <div className="space-y-6 p-6">

    {salesData.map((item, index) => (

      <div key={item.region}>

        <div className="mb-2 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#C8102E] to-[#005F99] font-bold text-white">

              {index + 1}

            </div>

            <div>

              <h4 className="font-semibold text-gray-800 dark:text-white">

                {item.region}

              </h4>

              <p className="text-sm text-gray-500">

                {item.revenue}

              </p>

            </div>

          </div>

          <div className="text-right">

            <div className="text-xl font-bold text-[#005F99]">

              {item.percentage}%

            </div>

          </div>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">

          <div
            className={`h-3 rounded-full bg-gradient-to-r ${getBarColor(item.percentage)} transition-all duration-1000`}
            style={{
              width: `${item.percentage}%`,
            }}
          />

        </div>

      </div>

    ))}

  </div>
        {/* ================= FOOTER ================= */}

      <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-800">

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#111827]">

            <p className="text-sm text-gray-500">
              Best Performing Region
            </p>

            <h3 className="mt-2 text-lg font-bold text-[#005F99]">
              North Region
            </h3>

            <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              92% Achievement
            </span>

          </div>

          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#111827]">

            <p className="text-sm text-gray-500">
              Overall Target
            </p>

            <h3 className="mt-2 text-lg font-bold text-[#C8102E]">
              78% Achieved
            </h3>

            <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-[#005F99] dark:bg-blue-900/30">
              FY 2026
            </span>

          </div>

        </div>

      </div>

    </div>

  );

}