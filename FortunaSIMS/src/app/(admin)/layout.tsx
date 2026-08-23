"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("sims_user");

    if (!storedUser) {
      router.replace("/signin");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (!user) {
        localStorage.removeItem("sims_user");
        router.replace("/signin");
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Invalid authentication data:", error);

      localStorage.removeItem("sims_user");
      router.replace("/signin");
      return;
    } finally {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // Authentication check in progress
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#C8102E]" />

          <p className="text-sm text-gray-500">
            Loading Fortuna SIMS...
          </p>
        </div>
      </div>
    );
  }

  // User is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />

        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}