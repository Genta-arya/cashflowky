"use client";

import React, { useState, Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppProviders } from "@/components/layout/AppProviders";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useTransactions } from "@/hooks/use-transactions";



function AppContent({ children }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { addTransaction } = useTransactions();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <Suspense fallback={<aside className="hidden lg:flex w-60 shrink-0 bg-white border-r h-screen" />}>
        <Sidebar />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Mobile Topbar */}
        <Topbar />

        {/* Content Container (max 1200px) */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation with center (+) button */}
      <Suspense fallback={null}>
        <BottomNav onQuickAdd={() => setIsQuickAddOpen(true)} />
      </Suspense>

      {/* Global Quick Add Transaction Dialog */}
      <TransactionForm
        open={isQuickAddOpen}
        onOpenChange={setIsQuickAddOpen}
        onSubmit={addTransaction}
        title="Catat Transaksi Baru"
      />
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AppProviders>
      <AppContent>{children}</AppContent>
    </AppProviders>
  );
}
