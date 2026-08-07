"use client";

interface InventoryItem {
  rank: number;
  itemCode: string;
  itemName: string;
  category: string;
  warehouse: string;
  stock: number;
  value: string;
  abc: string;
  percentage: number;
}

export default function TopInventoryItems() {

  const inventoryItems: InventoryItem[] = [

    {
      rank: 1,
      itemCode: "ITM-1001",
      itemName: "Steel Coil",
      category: "Raw Material",
      warehouse: "Central Warehouse",
      stock: 1245,
      value: "₹18.5 Lakhs",
      abc: "A",
      percentage: 95,
    },

    {
      rank: 2,
      itemCode: "ITM-1002",
      itemName: "SKF Bearing",
      category: "Components",
      warehouse: "North Warehouse",
      stock: 980,
      value: "₹14.2 Lakhs",
      abc: "A",
      percentage: 88,
    },

    {
      rank: 3,
      itemCode: "ITM-1003",
      itemName: "Engine Oil",
      category: "Consumables",
      warehouse: "South Warehouse",
      stock: 875,
      value: "₹11.8 Lakhs",
      abc: "B",
      percentage: 79,
    },

    {
      rank: 4,
      itemCode: "ITM-1004",
      itemName: "Industrial Bolts",
      category: "Fasteners",
      warehouse: "Central Warehouse",
      stock: 760,
      value: "₹9.4 Lakhs",
      abc: "B",
      percentage: 72,
    },

    {
      rank: 5,
      itemCode: "ITM-1005",
      itemName: "Safety Gloves",
      category: "Safety",
      warehouse: "East Warehouse",
      stock: 645,
      value: "₹7.3 Lakhs",
      abc: "C",
      percentage: 63,
    },

    {
      rank: 6,
      itemCode: "ITM-1006",
      itemName: "Hydraulic Pump",
      category: "Equipment",
      warehouse: "West Warehouse",
      stock: 520,
      value: "₹6.8 Lakhs",
      abc: "C",
      percentage: 54,
    },

  ];

  return (

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0F172A]">

      <div className="rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-[#0F172A]">

  {/* ================= HEADER ================= */}

  <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">

    <div>

      <h2 className="text-lg font-bold text-[#C8102E]">
        Top Inventory Items
      </h2>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Highest Value Inventory Across Warehouses
      </p>

    </div>

    <div className="rounded-full bg-gradient-to-r from-[#C8102E] to-[#005F99] px-5 py-2 text-xs font-bold text-white shadow-md">
      {/* Placeholder or actions could go here */}
    </div>
  </div>

  {inventoryItems.map((item) => (
    <div key={item.rank} className="rounded-[22px] bg-white p-4 dark:bg-[#0F172A]">

      <div className="mb-2 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#C8102E] to-[#005F99] text-lg font-bold text-white">

            #{item.rank}

          </div>

          <div>

            <h3 className="font-semibold text-gray-900 dark:text-white">

              {item.itemName}

            </h3>

            <p className="text-sm text-gray-500">

              {item.itemCode}

            </p>

          </div>

        </div>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">

          Class {item.abc}

        </span>

      </div>

      {/* Category */}

      <div className="mb-2">

        <p className="text-xs uppercase text-gray-400">

          Category

        </p>

        <p className="font-medium text-gray-700 dark:text-gray-300">

          {item.category}

        </p>

      </div>

      {/* Warehouse */}

      <div className="mb-2">

        <p className="text-xs uppercase text-gray-400">

          Warehouse

        </p>

        <p className="font-medium text-[#005F99]">

          {item.warehouse}

        </p>

      </div>

      {/* Progress */}

      <div className="mb-2 flex justify-between">

        <span className="text-sm text-gray-500">

          Stock Availability

        </span>

        <span className="font-bold text-green-600">

          {item.percentage}%

        </span>

      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-200">

        <div
          className="h-2 rounded-full bg-gradient-to-r from-[#C8102E] via-[#8E2C5D] to-[#005F99] transition-all duration-1000"
          style={{
            width: `${item.percentage}%`,
          }}
        />

      </div>

      {/* Bottom Statistics */}

      <div className="grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-3 text-white shadow-lg">

          <p className="text-xs uppercase text-green-100">
            Current Stock
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {item.stock}
          </h3>

          <p className="mt-1 text-xs text-green-100">
            Available Qty
          </p>

        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#005F99] to-[#3B82F6] p-5 text-white shadow-lg">

          <p className="text-xs uppercase text-blue-100">
            Inventory Value
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {item.value}
          </h3>

          <p className="mt-1 text-xs text-blue-100">
            Estimated Value
          </p>

        </div>

      </div>

    </div>
  ))}

  {/* ================= FOOTER ================= */}

  <div className="border-t border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-800 dark:bg-[#111827]">

    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">

      <div>

        <h4 className="font-semibold text-gray-800 dark:text-white">
          Inventory Overview
        </h4>

        <p className="mt-1 text-sm text-gray-500">
          Showing Top 6 inventory items based on available stock and inventory value.
        </p>

      </div>

      <div className="rounded-full bg-green-100 px-5 py-2 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">

        Enterprise Ready

      </div>

    </div>

  </div>

      </div>
    </div>
  
  );
}
