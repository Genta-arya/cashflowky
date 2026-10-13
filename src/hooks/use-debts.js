"use client";

import { useMockData } from "@/lib/mock-store";
import { useMemo } from "react";

export function useDebts(typeFilter) {
  const { debts, isLoading, addDebt, payInstallment, deletePayment, deleteDebt, cancelDebt } = useMockData();

  const filtered = useMemo(() => {
    if (!typeFilter) return debts;
    return debts.filter((d) => d.type === typeFilter);
  }, [debts, typeFilter]);

  const stats = useMemo(() => {
    const payable = debts.filter((d) => d.type === "PAYABLE" && d.status === "ACTIVE");
    const receivable = debts.filter((d) => d.type === "RECEIVABLE" && d.status === "ACTIVE");

    const totalPayableRemaining = payable.reduce((acc, d) => acc + d.remainingAmount, 0);
    const totalReceivableRemaining = receivable.reduce((acc, d) => acc + d.remainingAmount, 0);

    // Overdue count
    let overdueCount = 0;
    debts.forEach((d) => {
      if (d.status === "ACTIVE") {
        d.installments.forEach((inst) => {
          if (inst.status !== "PAID" && new Date(inst.dueDate) < new Date()) {
            overdueCount++;
          }
        });
      }
    });

    return {
      payableCount: payable.length,
      receivableCount: receivable.length,
      totalPayableRemaining,
      totalReceivableRemaining,
      overdueCount,
    };
  }, [debts]);

  return {
    debts: filtered,
    allDebts: debts,
    stats,
    isLoading,
    addDebt,
    payInstallment,
    deletePayment,
    deleteDebt,
    cancelDebt,
  };
}

export function useDebtDetail(debtId) {
  const { debts, isLoading, payInstallment, deletePayment, deleteDebt, cancelDebt } = useMockData();
  const debt = useMemo(() => debts.find((d) => d.id === debtId), [debts, debtId]);

  return {
    debt,
    isLoading,
    payInstallment: (installmentId, data) => payInstallment(debtId, installmentId, data),
    deletePayment: (paymentId) => deletePayment(debtId, paymentId),
    deleteDebt: () => deleteDebt(debtId),
    cancelDebt: () => cancelDebt(debtId),
  };
}
