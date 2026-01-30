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
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  subItems?: NavItem[];
};

/* ===========================
   NAVIGATION STRUCTURE
=========================== */

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
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
          { name: "Item Master", path: "/sims/masters/items" },
          { name: "Warehouse Master", path: "/sims/masters/warehouses" },
          { name: "UOM Master", path: "/sims/masters/uom" },
          { name: "Vendor Master", path: "/sims/masters/Vendors" },
          { name: "Customer Master", path: "/sims/masters/Vendors" },
        ],
      },
      /***SIMS Modules Menu Links */
{
        name: "Procurement",
        subItems: [
          
          { name: "Purchase Requisition (PR)", path: "sims/procurement/pr" },
          { name: "RFQ Management", path: "sims/procurement/rfq" },
          { name: "Purchase Order (PO)", path: "sims/procurement/po" },
          { name: "Goods Receipt (GRN)", path: "sims/procurement/grn" },
          { name: "Supplier Performance", path: "sims/procurement/vendor-performance" },
        ],
      },
      
      {
        name: "Inventory & (WMS)",
        subItems: [
          { name: "Goods Inward", path: "sims/inventory/inward" },
          { name: "Goods Outward / Issue", path: "sims/inventory/issue" },
          { name: "Stock Transfer", path: "sims/inventory/transfer" },
          { name: "Warehouse Layout", path: "sims/inventory/layout" },
          { name: "Batch & Serial Tracking", path: "sims/inventory/batch-tracking" },
          { name: "Cycle Count & Audit", path: "sims/inventory/audit" },
          { name: "Stock Reservation", path: "sims/inventory/reservation" },
          { name: "Smart Alerts", path: "sims/inventory/alerts" },
          { name: "Stock Dashboard", path: "sims/inventory/stock-dashboard" },
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
  ]
},

      {
        name: "Sales & Orders",
        subItems: [
          { name: "Sales Quotation", path: "/sales/quotation" },
          { name: "Sales Order (SO)", path: "/sales/orders" },
          { name: "Dispatch Planning", path: "/sales/dispatch" },
          { name: "Invoicing", path: "/sales/invoice" },
          { name: "Returns Management", path: "/sales/returns" },
  ]
},

{
  name: "AI Forecasting",
  subItems: [
    { name: "Demand Forecast", path: "sims/ai/forecast" },
    { name: "Auto Replenishment", path: "sims/ai/replenishment" },
    { name: "Trend Analytics", path: "sims/ai/trends" },
    { name: "Multi-Warehouse Balancing", path: "sims/ai/balancing" },
  ]
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
  ]
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
        ],
      },
    ],
  },
  { icon: <CalenderIcon />, name: "Calendar", path: "/calendar" },
  
{
    name: "Forms",
    icon: <ListIcon />,
    subItems: [
      { name: "Form Elements", path: "/form-elements" },
    ],
  },
{
    name: "Tables",
    icon: <TableIcon />,
    subItems: [{ name: "Basic Tables", path: "/basic-tables" }],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    subItems: [
      { name: "Blank Page", path: "/blank" },
      { name: "404 Error", path: "/error-404" },
    ]
    }
];



const othersItems: NavItem[] = [
  {
  name: "Administration",
  icon: <UserCircleIcon/>,
  subItems: [
    { name: "User Management", path: "sims/admin/users" },
    { name: "Role & Permissions", path: "sims/admin/roles" },
    { name: "Workflow Configuration", path: "sims/admin/workflows" },
    { name: "Master Configuration", path: "sims/admin/config" },
    { name: "Audit Logs", path: "sims/admin/audit-logs" },
  ]
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
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const isActive = useCallback(
    (path?: string) => path && pathname === path,
    [pathname]
  );

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  /* ===========================
     RECURSIVE RENDER FUNCTION
  =========================== */

  const renderItems = (
    items: NavItem[],
    parentKey = "",
    level = 0
  ) => {
    return (
      <ul className={`${level === 0 ? "space-y-2" : "ml-6 mt-2 space-y-1"}`}>
        {items.map((item, index) => {
          const key = `${parentKey}-${index}`;
          const isOpen = openMenus.includes(key);

          return (
            <li key={key}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleMenu(key)}
                    className={`flex items-center w-full p-2 rounded-lg transition
                      ${isOpen ? "bg-gray-200 dark:bg-gray-700" : ""}
                    `}
                  >
                    {item.icon && (
                      <span className="mr-3">{item.icon}</span>
                    )}
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <>
                        <span className="flex-1 text-left">
                          {item.name}
                        </span>
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {isOpen &&
                    (isExpanded || isHovered || isMobileOpen) &&
                    renderItems(item.subItems, key, level + 1)}
                </>
              ) : (
                item.path && (
                  <Link
                    href={item.path}
                    className={`flex items-center p-2 rounded-lg transition
                      ${
                        isActive(item.path)
                          ? "bg-brand-500 text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {item.icon && (
                      <span className="mr-3">{item.icon}</span>
                    )}
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span>{item.name}</span>
                    )}
                  </Link>
                )
              )}
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
        ${
          isExpanded || isHovered || isMobileOpen
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <Link href="/">
          <Image
            src="/images/logo/logo.svg"
            alt="Logo"
            width={150}
            height={40}
          />
        </Link>
      </div>

      <div className="px-4 overflow-y-auto h-[calc(100vh-100px)]">
        <h2 className="text-xs uppercase text-gray-400 mb-3">
          {isExpanded || isHovered ? "Menu" : <HorizontaLDots />}
        </h2>

        {renderItems(navItems)}

        <h2 className="text-xs uppercase text-gray-400 mt-6 mb-3">
          {isExpanded || isHovered ? "Others" : <HorizontaLDots />}
        </h2>

        {renderItems(othersItems)}

        {(isExpanded || isHovered || isMobileOpen) && (
          <SidebarWidget />
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
