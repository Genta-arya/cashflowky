import React from "react";
import { cn } from "@/lib/utils";

/**
 * Komponen Header Halaman
 * @param {{
 *   title: string,
 *   description?: string,
 *   action?: React.ReactNode,
 *   className?: string
 * }} props
 */
export function PageHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-2",
        className
      )}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 font-normal">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}
