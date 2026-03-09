"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  subItems?: NavItem[];
};

/** Fortuna Theme */
const FORTUNA_PRIMARY_RED = "#C8102E";
const FORTUNA_SECONDARY_BLUE = "#005F99";

/* ===========================
   NAVIGATION STRUCTURE (YOUR FULL DATA)
=========================== */
const navItems: NavItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    subItems: [{ name: "Ecommerce", path: "/" }],
  },
  {
    name: "SIMS Modules",
    icon: <BoxCubeIcon />,
    subItems: [
      {
        name: "Masters",
        subItems: [
          { name: "Item Master", path: "/ItemMaster" },
          { name: "Warehouse Master", path: "/WarehouseMaster" },
          { name: "UOM Master", path: "/UOMmaster" },
          { name: "Vendor Master", path: "/VendorMaster" },
          { name: "Customer Master", path: "/CustomerMaster" },
        ],
      },

      {
        name: "Procurement",
        subItems: [
          { name: "Purchase Requisition", path: "/PurchaseRequisitionList" },
          { name: "Request For Quote", path: "/RFQ" },
          { name: "Purchase Order", path: "/PurchaseOrderList" },
          { name: "Goods Receipt (GRN)", path: "/GRNList" },
          { name: "Supplier Performance", path: "/SPAnalysis" },
        ],
      },

      {
        name: "Inventory & (WMS)",
        subItems: [
          { name: "Goods Inward / Receive", path: "/GoodsInwardList" },
          { name: "Goods Outward / Issue", path: "sims/inventory/issue" },
          {
            name: "Returns",
            subItems: [
              { name: "Supplier Returns", path: "/SupplierReturns" },
              { name: "Customer Returns", path: "/CustomerReturns" },
            ],
          },
          { name: "Stock Transfer", path: "sims/inventory/transfer" },
          { name: "Warehouse Layout", path: "/WarehouseLayout" },
          { name: "Batch & Serial Tracking", path: "sims/inventory/batch-tracking" },
          {
            name: "Cycle Count & Audit",
            subItems: [
              { name: "CCP List", path: "/CycleCountList" },
              { name: "CCP Assignment", path: "/CCPAssignment" },
              { name: "Count Execution", path: "/countexecution" },
              { name: "Recount Queue", path: "/RecountQueue" },
              { name: "Reconciliation & Variance", path: "/Reconciliation&Variance" },
              { name: "CCP Approvals", path: "/CCPApprovals" },
              { name: "Stock Adjustment Posting", path: "/StockAdjustmentPosting" },
            ],
          },
          { name: "Smart Alerts", path: "/SmartAlerts" },
          { name: "Stock Dashboard", path: "/StockDashboard" },
        ],
      },

      {
        name: "Fleet & Logistics",
        subItems: [
          { name: "Vehicle Master", path: "sims/logistics/vehicles" },
          { name: "Driver Master", path: "sims/logistics/drivers" },
          { name: "Dispatch Planning", path: "sims/logistics/dispatch" },
          { name: "Live Tracking", path: "sims/logistics/tracking" },
          { name: "Trip Sheet Management", path: "sims/logistics/trip-sheet" },
          { name: "Fuel & Maintenance Logs", path: "sims/logistics/maintenance" },
        ],
      },

      {
        name: "Sales & Orders",
        subItems: [
          { name: "Sales Quotation", path: "/sales/quotation" },
          { name: "Sales Order (SO)", path: "/sales/orders" },
          { name: "Dispatch Planning", path: "/sales/dispatch" },
          { name: "Invoicing", path: "/sales/invoice" },
        ],
      },

      {
        name: "AI Forecasting",
        subItems: [
          { name: "Demand Forecast", path: "sims/ai/forecast" },
          { name: "Auto Replenishment", path: "sims/ai/replenishment" },
          { name: "Trend Analytics", path: "sims/ai/trends" },
          { name: "Multi-Warehouse Balancing", path: "sims/ai/balancing" },
        ],
      },

      {
        name: "Analytics & BI",
        subItems: [
          { name: "Executive Dashboard", path: "sims/bi/executive-dashboard" },
          { name: "Procurement Dashboard", path: "sims/bi/procurement-dashboard" },
          { name: "Inventory Dashboard", path: "sims/bi/inventory-dashboard" },
          { name: "Sales Dashboard", path: "sims/bi/sales-dashboard" },
          { name: "Logistics Dashboard", path: "sims/bi/logistics-dashboard" },
          { name: "KPI Monitoring", path: "sims/bi/kpi-monitoring" },
          { name: "AI Predictive Insights", path: "sims/bi/predictive-insights" },
          { name: "Custom Report Builder", path: "sims/bi/report-builder" },
          { name: "Data Visualization", path: "sims/bi/data-visualization" },
          { name: "Export & Integration", path: "sims/bi/export-integration" },
        ],
      },

      {
        name: "Reports",
        subItems: [
          { name: "Stock Movement Reports", path: "/sims/reports/stock" },
          { name: "Procurement Reports", path: "sims/reports/procurement" },
          { name: "Inventory Reports", path: "sims/reports/inventory" },
          { name: "Sales Reports", path: "sims/reports/sales" },
          { name: "Logistics Reports", path: "sims/reports/logistics" },
          { name: "Executive MIS Dashboard", path: "sims/reports/mis" },
          { name: "Cycle Count Reports", path: "/sims/inventory/cycle-count/reports" },
        ],
      },
    ],
  },
  { icon: <CalenderIcon />, name: "Calendar", path: "/calendar" },
];

const othersItems: NavItem[] = [
  {
    name: "Administration",
    icon: <UserCircleIcon />,
    subItems: [
      { name: "User Management", path: "/usermanagement" },
      { name: "Role & Permissions", path: "sims/admin/roles" },
      { name: "Workflow Configuration", path: "sims/admin/workflows" },
      { name: "Master Configuration", path: "sims/admin/config" },
      { name: "Audit Logs", path: "sims/admin/audit-logs" },
    ],
  },
  { icon: <UserCircleIcon />, name: "User Profile", path: "/profile" },
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart" },
      { name: "Bar Chart", path: "/bar-chart" },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin" },
      { name: "Sign Up", path: "/signup" },
    ],
  },
];

/* ===========================
   SIDEBAR COMPONENT
=========================== */
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // ✅ Only user-click should open menus (no auto expand on refresh)
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const showText = isExpanded || isHovered || isMobileOpen;

  const isActive = useCallback((path?: string) => !!path && pathname === path, [pathname]);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // unique stable key
  const buildKey = (parentKey: string, index: number, name: string) => `${parentKey}::${index}::${name}`;

  const btnBase =
    "flex items-center w-full rounded-xl transition px-3 py-2.5 text-[15px] leading-tight select-none";

  const parentBtn = "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800";

  const parentBtnOpen = "bg-[#005F99]/10 border border-[#005F99]/20";

  const linkBase = "flex items-center w-full rounded-xl transition px-3 py-2.5 text-[15px] leading-tight";

  const inactiveLink = "text-[#C8102E] hover:bg-gray-50 dark:hover:bg-gray-800";

  const renderItems = (items: NavItem[], parentKey = "root", level = 0) => {
    return (
      <ul className={level === 0 ? "space-y-2" : "space-y-2"}>
        {items.map((item, idx) => {
          const key = buildKey(parentKey, idx, item.name);
          const isOpen = openMenus.includes(key);

          const padLeft = level === 0 ? "pl-1" : level === 1 ? "pl-2" : "pl-3";

          if (item.subItems) {
            return (
              <li key={key} className="min-w-0">
                <button
                  type="button"
                  onClick={() => toggleMenu(key)}
                  className={[btnBase, padLeft, parentBtn, isOpen ? parentBtnOpen : ""].join(" ")}
                  style={{ color: FORTUNA_PRIMARY_RED }}
                >
                  {item.icon ? <span className="mr-3 shrink-0">{item.icon}</span> : null}

                  {showText ? (
                    <>
                      <span className="flex-1 text-left truncate">{item.name}</span>
                      <ChevronDownIcon
                        className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        style={{ color: FORTUNA_PRIMARY_RED }}
                      />
                    </>
                  ) : null}
                </button>

                {isOpen && showText ? (
                  <div className="mt-2 pl-2 pr-2">
                    <div
                      className="w-full rounded-2xl border overflow-hidden"
                      style={{
                        borderColor: "rgba(0,95,153,0.25)",
                        backgroundColor: "rgba(0,95,153,0.06)",
                      }}
                    >
                      <div className="p-2">{renderItems(item.subItems, key, level + 1)}</div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          }

          if (!item.path) return null;

          const active = isActive(item.path);

          return (
            <li key={key} className="min-w-0">
              <Link
                href={item.path}
                className={[linkBase, padLeft, active ? "text-white shadow-sm" : inactiveLink].join(" ")}
                style={active ? { backgroundColor: FORTUNA_PRIMARY_RED } : undefined}
              >
                {item.icon ? <span className="mr-3 shrink-0">{item.icon}</span> : null}
                {showText ? <span className="truncate">{item.name}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 border-r border-gray-200 
        bg-white dark:bg-gray-900 transition-all duration-300
        ${isExpanded || isHovered || isMobileOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <Link href="/">
          <Image src="/images/logo/logo.svg" alt="Logo" width={175} height={60} />
        </Link>
      </div>

      <div className="px-4 overflow-y-auto h-[calc(100vh-100px)]">
        <h2 className="text-xs uppercase text-gray-400 mb-3">{showText ? "Menu" : <HorizontaLDots />}</h2>
        {renderItems(navItems, "menu", 0)}

        <h2 className="text-xs uppercase text-gray-400 mt-6 mb-3">{showText ? "Others" : <HorizontaLDots />}</h2>
        {renderItems(othersItems, "others", 0)}

        {showText ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;