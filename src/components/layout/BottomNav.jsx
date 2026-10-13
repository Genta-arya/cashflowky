"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  HandCoins,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebts } from "@/hooks/use-debts";

/**
 * Mobile Bottom Navigation (5 item dengan tombol (+) melayang di tengah)
 * @param {{ onQuickAdd: () => void }} props
 */
export function BottomNav({ onQuickAdd }) {
  const pathname = usePathname();
  const { stats } = useDebts();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 flex items-center justify-around z-30 shadow-lg">
      {/* 1. Dashboard */}
      <Link
        href="/dashboard"
        className={cn(
          "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors",
          pathname === "/dashboard"
            ? "text-indigo-600 font-semibold"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Beranda</span>
      </Link>

      {/* 2. Transaksi */}
      <Link
        href="/transactions"
        className={cn(
          "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors",
          pathname === "/transactions"
            ? "text-indigo-600 font-semibold"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        <ReceiptText className="w-5 h-5 mb-0.5" />
        <span>Transaksi</span>
      </Link>

      {/* 3. Floating (+) Button */}
      <div className="flex-1 flex justify-center -mt-5">
        <button
          onClick={onQuickAdd}
          aria-label="Tambah Transaksi Cepat"
          className="w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-300 ring-4 ring-white active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Utang & Piutang */}
      <Link
        href="/debts"
        className={cn(
          "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium relative transition-colors",
          pathname.startsWith("/debts")
            ? "text-indigo-600 font-semibold"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        <div className="relative">
          <HandCoins className="w-5 h-5 mb-0.5" />
          {stats.overdueCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {stats.overdueCount}
            </span>
          )}
        </div>
        <span>Utang</span>
      </Link>

      {/* 5. Pengaturan */}
      <Link
        href="/settings"
        className={cn(
          "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors",
          pathname === "/settings"
            ? "text-indigo-600 font-semibold"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span>Setelan</span>
      </Link>
    </nav>
  );
}
