"use client";

import { useMockData } from "@/lib/mock-store";

export function useAccounts() {
  const { accounts, isLoading, addAccount, updateAccount, toggleAccountActive, deleteAccount } = useMockData();
  return {
    accounts,
    isLoading,
    addAccount,
    updateAccount,
    toggleAccountActive,
    deleteAccount,
  };
}
