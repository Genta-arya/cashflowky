"use client";

import React from "react";
import { Wallet, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Topbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.info("Anda telah keluar");
      router.push("/login");
      router.refresh();
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <header className="lg:hidden h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <Wallet className="w-4 h-4" />
        </div>
        <span className="font-bold text-slate-900 tracking-tight text-base">
          DuitKu
        </span>
      </div>

      <button
        onClick={handleLogout}
        title="Keluar"
        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}
