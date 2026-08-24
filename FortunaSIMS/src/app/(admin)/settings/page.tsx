"use client";

import { useEffect, useState } from "react";
import { Check, Globe2, Languages, Save } from "lucide-react";
import { useTranslations } from "next-intl";

const LANGUAGES = [
  {
    code: "en-US",
    name: "English (US)",
    nativeName: "English",
  },
  {
    code: "zh-CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
  },
];

export default function SettingsPage() {
  const t = useTranslations("settings");

  const [language, setLanguage] = useState("en-US");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("fortuna-language");

    if (savedLanguage === "en-US" || savedLanguage === "zh-CN") {
      setLanguage(savedLanguage);
    }
  }, []);

  function handleSave() {
    localStorage.setItem("fortuna-language", language);

    window.dispatchEvent(
      new CustomEvent("fortuna-language-change", {
        detail: language,
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {t("title")}
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>

      {/* Language Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-200 px-5 py-5 dark:border-gray-800 lg:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C8102E]/10">
            <Globe2 className="h-5 w-5 text-[#C8102E]" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("languageRegion")}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("languageDescription")}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-6 lg:px-6">
          <div className="max-w-xl">
            <label
              htmlFor="language"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("selectLanguage")}
            </label>

            <div className="relative">
              <Languages className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <select
                id="language"
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  setSaved(false);
                }}
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-10 text-sm text-gray-800 outline-none transition focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} — {item.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t("saveDescription")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-2 text-sm">
            {saved ? (
              <>
                <Check className="h-4 w-4 text-green-600" />

                <span className="font-medium text-green-700 dark:text-green-400">
                  {t("saved")}
                </span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {t("chooseLanguage")}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8102E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A80D26] focus:outline-none focus:ring-2 focus:ring-[#C8102E]/30"
          >
            <Save className="h-4 w-4" />
            {t("saveChanges")}
          </button>
        </div>
      </div>

      {/* Information Card */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 dark:border-blue-900/30 dark:bg-blue-900/10 lg:px-6">
        <div className="flex gap-3">
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-[#005F99]" />

          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("multilingualSupport")}
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {t("multilingualDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}