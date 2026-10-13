"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Format string angka ke format ribuan bertitik
 * @param {string|number} value
 * @returns {string}
 */
function formatNumberWithDots(value) {
  if (value === null || value === undefined || value === "") return "";
  const clean = String(value).replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(Number(clean));
}

/**
 * Komponen Input Nominal Rupiah dengan auto format titik ribuan
 * Nilai yang dikirimkan ke onChange adalah number
 *
 * @param {{
 *   value?: number|string,
 *   onChange: (val: number) => void,
 *   placeholder?: string,
 *   className?: string,
 *   disabled?: boolean,
 *   id?: string
 * }} props
 */
export function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  disabled = false,
  id,
  ...props
}) {
  const [displayValue, setDisplayValue] = useState(
    value !== undefined && value !== null && value !== "" ? formatNumberWithDots(value) : ""
  );

  useEffect(() => {
    if (value === 0 || value === "0") {
      setDisplayValue("0");
    } else if (value) {
      setDisplayValue(formatNumberWithDots(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const cleanNumbers = rawVal.replace(/\D/g, "");
    const numericValue = cleanNumbers === "" ? 0 : Number(cleanNumbers);

    setDisplayValue(cleanNumbers ? formatNumberWithDots(cleanNumbers) : "");
    if (onChange) {
      onChange(numericValue);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-3 text-sm font-medium text-slate-400 select-none pointer-events-none">
        Rp
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "pl-10 text-right tabular-nums font-semibold tracking-wide text-slate-800 placeholder:text-slate-300 focus-visible:ring-indigo-500",
          className
        )}
        {...props}
      />
    </div>
  );
}
