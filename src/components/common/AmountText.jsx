import React from "react";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Komponen tampilan nominal uang dengan warna (+ / -) dan font tabular
 *
 * @param {{
 *   amount: number|string,
 *   type?: "INCOME"|"EXPENSE"|"NEUTRAL",
 *   showSign?: boolean,
 *   className?: string,
 *   size?: "sm"|"base"|"lg"|"xl"|"2xl"
 * }} props
 */
export function AmountText({
  amount,
  type = "NEUTRAL",
  showSign = false,
  className,
  size = "base",
}) {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  const isPositive = num > 0;
  const isNegative = num < 0;

  // Tentukan warna
  let colorClass = "text-slate-800";
  let sign = "";

  if (type === "INCOME") {
    colorClass = "text-emerald-600";
    if (showSign) sign = "+ ";
  } else if (type === "EXPENSE") {
    colorClass = "text-rose-600";
    if (showSign) sign = "− ";
  } else if (type === "NEUTRAL") {
    if (showSign) {
      if (isPositive) {
        colorClass = "text-emerald-600";
        sign = "+ ";
      } else if (isNegative) {
        colorClass = "text-rose-600";
        sign = "− ";
      }
    }
  }

  const sizeClasses = {
    sm: "text-sm font-medium",
    base: "text-base font-semibold",
    lg: "text-lg font-bold",
    xl: "text-xl font-bold tracking-tight",
    "2xl": "text-2xl font-extrabold tracking-tight",
  };

  return (
    <span
      className={cn(
        "tabular-nums inline-block",
        sizeClasses[size] || sizeClasses.base,
        colorClass,
        className
      )}
    >
      {sign}
      {formatRupiah(Math.abs(num))}
    </span>
  );
}
