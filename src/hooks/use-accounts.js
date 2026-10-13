"use client";

import { useMockData } from "@/lib/mock-store";

export function useAccounts() {
  const { accounts, addAccount, updateAccount, toggleAccountActive, deleteAccount } = useMockData();
  return {
    accounts,
    isLoading: false,
    addAccount,
    updateAccount,
    toggleAccountActive,
    deleteAccount,
  };
}
