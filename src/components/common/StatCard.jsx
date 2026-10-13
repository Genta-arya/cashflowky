import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Kartu Ringkasan Metrik
 *
 * @param {{
 *   title: string,
 *   value: React.ReactNode,
 *   icon?: React.ReactNode,
 *   subtitle?: string|React.ReactNode,
 *   variant?: "default"|"income"|"expense"|"warning"|"info",
 *   className?: string
 * }} props
 */
export function StatCard({
  title,
  value,
  icon,
  subtitle,
  variant = "default",
  className,
}) {
  const variantStyles = {
    default: {
      border: "border-slate-200/80",
      iconBg: "bg-indigo-50 text-indigo-600",
      accent: "hover:border-indigo-300",
    },
    income: {
      border: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20",
      iconBg: "bg-emerald-100 text-emerald-700",
      accent: "hover:border-emerald-300",
    },
    expense: {
      border: "border-rose-100 bg-gradient-to-br from-white to-rose-50/20",
      iconBg: "bg-rose-100 text-rose-700",
      accent: "hover:border-rose-300",
    },
    warning: {
      border: "border-amber-100 bg-gradient-to-br from-white to-amber-50/20",
      iconBg: "bg-amber-100 text-amber-700",
      accent: "hover:border-amber-300",
    },
    info: {
      border: "border-sky-100 bg-gradient-to-br from-white to-sky-50/20",
      iconBg: "bg-sky-100 text-sky-700",
      accent: "hover:border-sky-300",
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <Card
      className={cn(
        "rounded-2xl border bg-white shadow-xs transition-all duration-200 hover:shadow-md",
        style.border,
        style.accent,
        className
      )}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {icon && (
            <div
              className={cn(
                "p-2 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                style.iconBg
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1 font-medium">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
