"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";

import enUS from "../../../messages/en-US.json";
import zhCN from "../../../messages/zh-CN.json";

type Locale = "en-US" | "zh-CN";

const messages = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [locale, setLocale] = useState<Locale>("en-US");

  useEffect(() => {
    const storedLanguage = localStorage.getItem("fortuna-language");

    if (storedLanguage === "zh-CN") {
      setLocale("zh-CN");
    } else {
      setLocale("en-US");
    }
  }, []);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<Locale>;

      if (
        customEvent.detail === "en-US" ||
        customEvent.detail === "zh-CN"
      ) {
        setLocale(customEvent.detail);
      }
    };

    window.addEventListener(
      "fortuna-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "fortuna-language-change",
        handleLanguageChange
      );
    };
  }, []);

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

  if (!isAuthenticated) {
    return null;
  }

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
    >
      <div className="min-h-screen xl:flex">
        <AppSidebar />

        <Backdrop />

        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />

          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            {children}
          </div>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}