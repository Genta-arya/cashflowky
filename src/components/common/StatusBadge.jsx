import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

/**
 * Komponen Badge status utang / cicilan
 * @param {{
 *   status: "ACTIVE"|"PAID"|"CANCELED"|"OVERDUE"|"DUE_SOON"|"UPCOMING"|"PARTIAL"|"PENDING",
 *   label?: string,
 *   className?: string
 * }} props
 */
export function StatusBadge({ status, label, className }) {
  const configs = {
    OVERDUE: {
      text: label || "Terlambat",
      icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
      style: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold",
    },
    DUE_SOON: {
      text: label || "Segera",
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
      style: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-semibold",
    },
    UPCOMING: {
      text: label || "Akan Datang",
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      style: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
    },
    ACTIVE: {
      text: label || "Aktif",
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      style: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
    },
    PAID: {
      text: label || "Lunas",
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
      style: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold",
    },
    PARTIAL: {
      text: label || "Sebagian",
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      style: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 font-semibold",
    },
    PENDING: {
      text: label || "Belum Bayar",
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      style: "bg-slate-100 text-slate-600 border-slate-200",
    },
    CANCELED: {
      text: label || "Dibatalkan",
      icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
      style: "bg-slate-100 text-slate-400 border-slate-200 line-through",
    },
  };

  const config = configs[status] || configs.ACTIVE;

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-0.5 text-xs rounded-full inline-flex items-center transition-colors shadow-2xs",
        config.style,
        className
      )}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
}
