"use client";

import { useMockData } from "@/lib/mock-store";
import { useMemo } from "react";

export function useTransactions(filters = {}) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useMockData();

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.type && tx.type !== filters.type) return false;
      if (filters.accountId && tx.accountId !== filters.accountId) return false;
      if (filters.categoryId && tx.categoryId !== filters.categoryId) return false;
      if (filters.q && !tx.note?.toLowerCase().includes(filters.q.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filters]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "INCOME") income += amt;
      else expense += amt;
    });
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [filtered]);

  return {
    transactions: filtered,
    allTransactions: transactions,
    summary,
    isLoading: false,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
