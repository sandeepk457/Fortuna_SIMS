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
    path: "/",
  },
  {
    name: "SIMS",
    icon: <BoxCubeIcon />,
    subItems: [
      { name: "Dashboard", path: "/sims" },
      {
        name: "Masters",
        subItems: [
          { name: "Item Master", path: "/sims/masters/items" },
          { name: "Warehouse Master", path: "/sims/masters/warehouses" },
          { name: "UOM Master", path: "/sims/masters/uom" },
        ],
      },
      {
        name: "Inventory",
        subItems: [
          { name: "Stock Dashboard", path: "/sims/inventory/stock-dashboard" },
          { name: "Goods Inward (GRN)", path: "/sims/inventory/grn" },
          { name: "Goods Outward (GIN)", path: "/sims/inventory/gin" },
          { name: "Stock Adjustment", path: "/sims/inventory/adjustment" },
        ],
      },
      {
        name: "Reports",
        subItems: [
          { name: "Stock Report", path: "/sims/reports/stock" },
          { name: "Movement Report", path: "/sims/reports/movement" },
        ],
      },
    ],
  },
  { icon: <CalenderIcon />, name: "Calendar", path: "/calendar" },
  { icon: <UserCircleIcon />, name: "User Profile", path: "/profile" },
];

const othersItems: NavItem[] = [
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
      onMouseLeave={() => setIsHovered(true)}
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
