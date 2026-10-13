"use client";

import { useMockData } from "@/lib/mock-store";
import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function useDashboard(selectedDate = new Date()) {
  const { accounts, categories, transactions, debts, isLoading } = useMockData();

  const summary = useMemo(() => {
    // 1. Total balance of active accounts (live dari database)
    const totalBalance = accounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    // 2. Filter transaksi sesuai BULAN dan TAHUN yang dipilih di filter
    const targetYear = selectedDate instanceof Date ? selectedDate.getFullYear() : new Date().getFullYear();
    const targetMonth = selectedDate instanceof Date ? selectedDate.getMonth() : new Date().getMonth();

    let income = 0;
    let expense = 0;
    const monthTransactions = [];

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === targetYear && txDate.getMonth() === targetMonth) {
        monthTransactions.push(tx);
        const amt = Number(tx.amount) || 0;
        if (tx.type === "INCOME") income += amt;
        else if (tx.type === "EXPENSE") expense += amt;
      }
    });

    // 3. Utang dan Piutang Aktif
    const activePayables = debts.filter((d) => d.type === "PAYABLE" && d.status === "ACTIVE");
    const activeReceivables = debts.filter((d) => d.type === "RECEIVABLE" && d.status === "ACTIVE");

    const payableRemaining = activePayables.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
    const receivableRemaining = activeReceivables.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);

    // 4. Overdue count live
    let payableOverdueCount = 0;
    activePayables.forEach((d) => {
      if (d.installments) {
        d.installments.forEach((inst) => {
          if (inst.status !== "PAID" && new Date(inst.dueDate) < new Date()) {
            payableOverdueCount++;
          }
        });
      }
    });

    // 5. Tren 6 Bulan Terakhir dihitung mundur dari selectedDate
    const trend6m = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(selectedDate, i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthLabel = format(d, "MMM yy", { locale: localeId });

      let mIncome = 0;
      let mExpense = 0;

      transactions.forEach((tx) => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === year && txDate.getMonth() === month) {
          const amt = Number(tx.amount) || 0;
          if (tx.type === "INCOME") mIncome += amt;
          else if (tx.type === "EXPENSE") mExpense += amt;
        }
      });

      trend6m.push({
        month: monthLabel,
        income: mIncome,
        expense: mExpense,
      });
    }

    // 6. Pengeluaran per Kategori khusus untuk bulan yang dipilih
    const categoryTotals = {};
    const categoryColorMap = {};
    (categories || []).forEach((c) => {
      categoryColorMap[c.name] = c.color || "#64748b";
    });

    monthTransactions.forEach((tx) => {
      if (tx.type === "EXPENSE") {
        const catName = tx.category?.name || "Lainnya";
        categoryTotals[catName] = (categoryTotals[catName] || 0) + (Number(tx.amount) || 0);
      }
    });

    const expenseByCategory = Object.entries(categoryTotals)
      .map(([name, total]) => ({
        name,
        total,
        color: categoryColorMap[name] || "#64748b",
      }))
      .sort((a, b) => b.total - a.total);

    // 7. Jatuh tempo terdekat
    const upcomingDues = [];
    debts.forEach((d) => {
      if (d.status === "ACTIVE" && d.installments) {
        d.installments.forEach((inst) => {
          if (inst.status !== "PAID") {
            const isOverdue = new Date(inst.dueDate) < new Date();
            upcomingDues.push({
              debtId: d.id,
              installmentId: inst.id,
              title: d.title,
              contactName: d.personName || d.contact?.name || "Kontak",
              type: d.type,
              sequence: inst.sequence || inst.installmentNumber || 1,
              dueDate: inst.dueDate,
              amount: Number(inst.amount) - (Number(inst.paidAmount) || 0),
              status: isOverdue ? "OVERDUE" : "PENDING",
              relativeText: isOverdue ? "Terlambat" : "Jatuh Tempo",
            });
          }
        });
      }
    });

    upcomingDues.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return {
      totalBalance,
      income,
      expense,
      net: income - expense,
      payableRemaining,
      receivableRemaining,
      payableActiveCount: activePayables.length,
      receivableActiveCount: activeReceivables.length,
      payableOverdueCount,
      trend6m,
      expenseByCategory,
      upcomingDues: upcomingDues.slice(0, 5),
      recentTransactions: monthTransactions.slice(0, 5),
    };
  }, [accounts, categories, transactions, debts, selectedDate]);

  return {
    summary,
    isLoading,
  };
}
