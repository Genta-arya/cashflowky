"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const StoreContext = createContext(null);

export function MockDataProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from MySQL backend
  const fetchAllData = useCallback(async () => {
    try {
      const [accRes, catRes, txRes, debtRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/categories"),
        fetch("/api/transactions?limit=100"),
        fetch("/api/debts"),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        // Map account balance for compatibility with existing UI
        const mappedAccs = (accData.data || []).map((a) => ({
          ...a,
          balance: Number(a.currentBalance),
          isActive: true,
        }));
        setAccounts(mappedAccs);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.data || []);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.data || []);
      }

      if (debtRes.ok) {
        const debtData = await debtRes.json();
        const mappedDebts = (debtData.data || []).map((d) => {
          const totalAmt = Number(d.totalAmount || d.amount || 0);
          const remAmt = Number(d.remainingAmount || 0);
          const paidAmt = Number(d.paidAmount || (totalAmt - remAmt) || 0);
          return {
            ...d,
            totalAmount: totalAmt,
            remainingAmount: remAmt,
            paidAmount: paidAmt,
            installments: (d.installments && d.installments.length > 0)
              ? d.installments.map((inst) => ({
                  ...inst,
                  amount: Number(inst.amount),
                  paidAmount: Number(inst.paidAmount),
                }))
              : [],
          };
        });
        setDebts(mappedDebts);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data dari backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ACCOUNTS
  const addAccount = async (newAcc) => {
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAcc),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat dompet");
      
      const created = {
        ...data.data,
        balance: Number(data.data.currentBalance),
        isActive: true,
      };
      setAccounts((prev) => [...prev, created]);
      toast.success(`Dompet "${created.name}" berhasil ditambahkan`);
      return created;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const updateAccount = async (id, updated) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update dompet");
      
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== id) return acc;
          const newBal = data.data.currentBalance !== undefined ? Number(data.data.currentBalance) : acc.balance;
          return {
            ...acc,
            ...data.data,
            balance: isNaN(newBal) ? (acc.balance || 0) : newBal,
          };
        })
      );
      toast.success("Dompet berhasil diperbarui");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleAccountActive = (id) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const nextState = !acc.isActive;
          toast.info(`Dompet "${acc.name}" ${nextState ? "diaktifkan" : "dinonaktifkan"}`);
          return { ...acc, isActive: nextState };
        }
        return acc;
      })
    );
  };

  const deleteAccount = async (id) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus dompet");
      
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      toast.success("Dompet berhasil dihapus");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // CATEGORIES
  const addCategory = async (newCat) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kategori");
      
      setCategories((prev) => [...prev, data.data]);
      toast.success(`Kategori "${data.data.name}" berhasil ditambahkan`);
      return data.data;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const updateCategory = async (id, updated) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update kategori");
      
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data.data } : c))
      );
      toast.success("Kategori berhasil diperbarui");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus kategori");
      
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      toast.success("Kategori berhasil dihapus");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // TRANSACTIONS
  const addTransaction = async (newTx) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTx),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan transaksi");
      
      toast.success("Transaksi berhasil disimpan");
      fetchAllData(); // Refresh balances and list
      return data.data;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const updateTransaction = async (id, updatedTx) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTx),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui transaksi");
      
      toast.success("Transaksi berhasil diperbarui");
      fetchAllData();
      return data.data;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus transaksi");
      
      toast.success("Transaksi berhasil dihapus");
      fetchAllData();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // DEBTS & RECEIVABLES
  const addDebt = async (newDebt) => {
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDebt),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat utang/piutang");
      
      toast.success("Data utang/piutang berhasil disimpan");
      fetchAllData();
      return data.data;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const payInstallment = async (debtId, installmentId, paymentData) => {
    try {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses pembayaran");
      
      toast.success("Pembayaran cicilan berhasil dicatat!");
      fetchAllData();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const deleteDebt = async (debtId) => {
    try {
      const res = await fetch(`/api/debts/${debtId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus utang/piutang");
      
      toast.success("Utang/piutang berhasil dihapus");
      fetchAllData();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const cancelDebt = async (debtId) => {
    try {
      const res = await fetch(`/api/debts/${debtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membatalkan");
      
      toast.info("Status utang/piutang diubah menjadi Dibatalkan");
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Contacts
  const addContact = (contact) => {
    const c = { ...contact, id: `c-${Date.now()}` };
    setContacts((prev) => [...prev, c]);
    return c;
  };

  const updateContact = (id, updated) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteContact = (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        accounts,
        categories,
        contacts,
        transactions,
        debts,
        isLoading,
        fetchAllData,
        // Accounts actions
        addAccount,
        updateAccount,
        toggleAccountActive,
        deleteAccount,
        // Categories actions
        addCategory,
        updateCategory,
        deleteCategory,
        // Contacts actions
        addContact,
        updateContact,
        deleteContact,
        // Transactions actions
        addTransaction,
        updateTransaction,
        deleteTransaction,
        // Debts actions
        addDebt,
        payInstallment,
        deleteDebt,
        cancelDebt,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
}
