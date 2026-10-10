"use client";
import React, { useMemo, useState } from "react";

import { CalendarDays, X } from "lucide-react";

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function DateField({
  label,
  value,
  onChange,
  min,
  required = false,
  disabled = false,
}: DateFieldProps) {
  const clearDate = () => onChange("");

  return (
    <div className="w-full space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label}
        {required && (
          <span className="ml-1 text-[#C8102E]">*</span>
        )}
      </label>

      <div
        className={`relative flex h-11 w-full items-center rounded-lg border border-gray-300 bg-white transition-all focus-within:border-[#C8102E] focus-within:ring-2 focus-within:ring-[#C8102E]/10 dark:border-gray-700 dark:bg-gray-900 ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        <CalendarDays
          size={18}
          className="ml-3 shrink-0 text-[#C8102E]"
        />

        <input
          type="date"
          value={value || ""}
          min={min || undefined}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 cursor-pointer bg-transparent px-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed dark:text-gray-100"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={clearDate}
            aria-label={`Clear ${label}`}
            title="Clear date"
            className="mr-2 rounded-md p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-[#C8102E] dark:hover:bg-white/10"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
