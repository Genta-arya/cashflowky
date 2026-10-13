"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  HandCoins,
  PieChart,
  Settings,
  LogOut,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebts } from "@/hooks/use-debts";
import { toast } from "sonner";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { stats } = useDebts();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Transaksi",
      href: "/transactions",
      icon: ReceiptText,
    },
    {
      title: "Utang & Piutang",
      href: "/debts",
      icon: HandCoins,
      badge: stats.overdueCount > 0 ? stats.overdueCount : null,
    },
    {
      title: "Laporan",
      href: "/reports",
      icon: PieChart,
    },
    {
      title: "Pengaturan",
      href: "/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.info("Anda telah keluar dari aplikasi");
      router.push("/login");
      router.refresh();
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200/80 bg-white h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
            DuitKu
          </span>
          <span className="text-[11px] font-medium text-slate-400 block leading-none">
            Keuangan Pribadi
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge ? (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white shadow-2xs">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
