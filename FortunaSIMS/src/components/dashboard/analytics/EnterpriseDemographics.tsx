"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import CountryMap from "@/components/ecommerce/CountryMap";

import { API_BASE_URL } from "@/app/utils/apiBase";

import { MoreDotIcon } from "@/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

interface CountryStat {
  country: string;
  total: number;
}

export default function EnterpriseDemographics() {
  const [selectedType, setSelectedType] =
    useState("customer");

  const [isOpen, setIsOpen] = useState(false);

  const [countries, setCountries] =
  useState<CountryStat[]>([]);

const [loading, setLoading] =
  useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

    useEffect(() => {
    fetchDemographics();
  }, [selectedType]);

    const fetchDemographics = async () => {

  try {

    setLoading(true);

    const res = await axios.get(
      `${API_BASE_URL}/api/ecommerce/demographics?type=${selectedType}`
    );

    if (res.data.success) {
      setCountries(res.data.data);
    }

  } catch (err) {

    console.error("Demographic API Error:", err);

    setCountries([]);

  } finally {

    setLoading(false);

  }

};

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-[#0F172A]">

      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">

        <div>

          <h2 className="text-xl font-bold text-[#C8102E]">
            Demographic Analytics
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Global Customer & Vendor Distribution
          </p>

        </div>

        <div className="flex items-center gap-3">

          {/* Selector */}

          <select
            value={selectedType}
            onChange={(e) =>
              setSelectedType(e.target.value)
            }
            className="rounded-xl border border-[#C8102E]/20 bg-white px-4 py-2 text-sm font-semibold text-[#C8102E] shadow-sm outline-none transition focus:border-[#005F99] dark:bg-gray-900 dark:text-white"
          >
            <option value="customer">
              Customers
            </option>

            <option value="vendor">
              Vendors
            </option>

          </select>

          {/* Menu */}

          <div className="relative">

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
                Export
              </DropdownItem>

              <DropdownItem onItemClick={closeDropdown}>
                Refresh
              </DropdownItem>

            </Dropdown>

          </div>

        </div>

      </div>

      {/* ================= KPI ================= */}

      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 p-6 dark:border-gray-800">

        <div className="rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#005F99] p-5 text-white">

          <p className="text-sm opacity-80">
            Total Countries
          </p>

         <h2 className="mt-2 text-4xl font-bold">
            {countries.length}
        </h2>

        </div>

        <div className="rounded-2xl border border-[#005F99]/20 bg-[#F8FAFC] p-5 dark:bg-[#111827]">

  <p className="text-sm text-gray-500">
    Selected Dataset
  </p>

  <h2 className="mt-2 text-2xl font-bold capitalize text-[#005F99] dark:text-white">
    {selectedType}
  </h2>

  <div className="mt-4 space-y-2">

    <div className="flex justify-between text-sm">

      <span className="text-gray-500">
        Countries
      </span>

      <span className="font-semibold">
        {countries.length}
      </span>

    </div>

    <div className="flex justify-between text-sm">

      <span className="text-gray-500">
        Records
      </span>

      <span className="font-semibold">

        {countries.reduce(
          (sum, item) => sum + item.total,
          0
        )}

      </span>

    </div>

    <div className="flex justify-between text-sm">

      <span className="text-gray-500">
        Status
      </span>

      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">

        LIVE

      </span>

    </div>

  </div>

</div>

      </div>

      {/* ================= WORLD MAP ================= */}

      <div className="p-6">

        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-inner dark:border-gray-800 dark:bg-[#111827]">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h3 className="font-semibold text-gray-800 dark:text-white">
                Global Presence
              </h3>

              <p className="text-sm text-gray-500">
                Interactive World Map
              </p>

            </div>

            <div className="rounded-full bg-[#C8102E]/10 px-4 py-2 text-xs font-semibold text-[#C8102E]">
              LIVE
            </div>

          </div>

          <div className="flex justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#0F172A]">

            <div
              className="w-full"
              style={{
                height: 320,
              }}
            >
              <CountryMap />
            </div>

          </div>

        </div>

      </div>

      {/* ================= COUNTRY LIST ================= */}

      <div className="border-t border-gray-200 p-6 dark:border-gray-800">

        <div className="mb-4 flex items-center justify-between">

          <h3 className="font-semibold text-gray-800 dark:text-white">
            Country Distribution
          </h3>

          <span className="text-sm text-gray-500">
            Live Analytics
          </span>

        </div>

        <div className="space-y-5">

  {loading && (

    <div className="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-900">

      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#C8102E] border-t-transparent"></div>

      <p className="mt-3 text-gray-500">
        Loading Demographic Analytics...
      </p>

    </div>

  )}

  {!loading && countries.length === 0 && (

    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">

      <div className="text-5xl">
        🌍
      </div>

      <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-white">
        No Country Data Found
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        Customer / Vendor countries will appear here after integration.
      </p>

    </div>

  )}

  {!loading &&

    countries.map((item, index) => {

      const max =
        countries[0]?.total || 1;

      const percentage =
        Math.round(
          (item.total / max) * 100
        );

      return (

        <div
          key={item.country}
          className="rounded-2xl border border-gray-100 p-4 transition-all hover:shadow-md dark:border-gray-700"
        >

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">


            <div className="relative">

  {/* Ranking Badge */}

  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#005F99] text-[11px] font-bold text-white shadow-md">

    {index + 1}

  </div>

  {/* Country Badge */}

  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#C8102E] to-[#005F99] text-sm font-bold tracking-wider text-white shadow-lg">

    {item.country
      .substring(0, 2)
      .toUpperCase()}

  </div>

</div>

            

              <div>

                <h4 className="font-semibold text-gray-800 dark:text-white">

                  {item.country}

                </h4>

                <p className="text-sm text-gray-500">

                  {item.total} {selectedType === "customer"
                    ? "Customers"
                    : "Vendors"}

                </p>

              </div>

            </div>

            <div className="text-right">

              <div className="font-bold text-[#C8102E]">

                {percentage}%

              </div>

            </div>

          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">

            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#C8102E] to-[#005F99] transition-all duration-700"
              style={{
                width: `${percentage}%`,
              }}
            />

          </div>

        </div>

      );

    })}

</div>

      </div>

    </div>
  );
}