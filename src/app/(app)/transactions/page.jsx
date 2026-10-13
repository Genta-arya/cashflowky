"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { AmountText } from "@/components/common/AmountText";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";



export default function TransactionsPage() {
  const { accounts } = useAccounts();
  const { allCategories } = useCategories();

  // Filters state
  const [filterType, setFilterType] = useState("ALL");
  const [filterAccount, setFilterAccount] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const {
    transactions,
    summary,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions({
    type: filterType === "ALL" ? null : filterType,
    accountId: filterAccount === "ALL" ? null : filterAccount,
    categoryId: filterCategory === "ALL" ? null : filterCategory,
    q: searchQuery,
  });

  // Modal form state
  const [formModal, setFormModal] = useState({ open: false, data: null });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    // Pagination slice
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = transactions.slice(startIndex, startIndex + pageSize);

    const groups = {};
    paginated.forEach((tx) => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    return Object.entries(groups).sort(
      ([dateA], [dateB]) => new Date(dateB) - new Date(dateA)
    );
  }, [transactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));

  const handleEditClick = (tx) => {
    if (tx.source === "DEBT_PAYMENT") {
      toast.info(
        "Transaksi ini terkait pembayaran utang/piutang. Kelola melalui menu Utang & Piutang."
      );
      return;
    }
    setFormModal({ open: true, data: tx });
  };

  const handleDeleteClick = (tx) => {
    if (tx.source === "DEBT_PAYMENT") {
      toast.error(
        "Transaksi pembayaran utang tidak dapat dihapus di sini. Silakan batalkan pembayaran di menu Utang & Piutang."
      );
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Hapus Transaksi?",
      description: `Apakah Anda yakin ingin menghapus transaksi "${tx.categoryName} (${tx.note || ""})"? Saldo dompet akan disesuaikan kembali.`,
      onConfirm: () => deleteTransaction(tx.id),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi"
        description="Kelola dan pantau seluruh catatan arus kas masuk dan keluar"
        action={
          <Button
            onClick={() => setFormModal({ open: true, data: null })}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Tambah Transaksi
          </Button>
        }
      />

      {/* Summary Cards Top Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Total Pemasukan
            </span>
            <div className="mt-1">
              <AmountText
                amount={summary.income}
                type="INCOME"
                showSign
                size="xl"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/20 shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Total Pengeluaran
            </span>
            <div className="mt-1">
              <AmountText
                amount={summary.expense}
                type="EXPENSE"
                showSign
                size="xl"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Selisih Bersih
            </span>
            <div className="mt-1">
              <AmountText
                amount={summary.net}
                type="NEUTRAL"
                showSign
                size="xl"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari catatan transaksi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-slate-50/50 border-slate-200 rounded-xl text-sm"
            />
          </div>

          {/* 2. Filter Tipe */}
          <Select
            value={filterType}
            onValueChange={(val) => {
              setFilterType(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-sm">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl shadow-xl">
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="EXPENSE">Hanya Pengeluaran</SelectItem>
              <SelectItem value="INCOME">Hanya Pemasukan</SelectItem>
            </SelectContent>
          </Select>

          {/* 3. Filter Dompet */}
          <Select
            value={filterAccount}
            onValueChange={(val) => {
              setFilterAccount(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-sm">
              <SelectValue placeholder="Semua Dompet" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl shadow-xl">
              <SelectItem value="ALL">Semua Dompet</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 4. Filter Kategori */}
          <Select
            value={filterCategory}
            onValueChange={(val) => {
              setFilterCategory(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-sm">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl shadow-xl">
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Transaction List Grouped by Date */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="w-8 h-8" />}
          title="Tidak ada transaksi yang cocok"
          description="Coba ubah kriteria filter pencarian Anda atau catat transaksi baru."
          actionLabel="Tambah Transaksi"
          onAction={() => setFormModal({ open: true, data: null })}
        />
      ) : (
        <div className="space-y-5">
          {groupedTransactions.map(([dateString, items]) => (
            <div key={dateString} className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                {formatDate(dateString)}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
                {items.map((tx) => {
                  const isExpense = tx.type === "EXPENSE";
                  const isLocked = tx.source === "DEBT_PAYMENT";

                  return (
                    <div
                      key={tx.id}
                      onClick={() => handleEditClick(tx)}
                      className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Left: Icon & Category info */}
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isExpense
                              ? "bg-rose-50 text-rose-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {isExpense ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {tx.categoryName}
                            </span>
                            {isLocked && (
                              <span
                                title="Otomatis dari pembayaran utang/piutang (Terkunci)"
                                className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium"
                              >
                                <Lock className="w-3 h-3 text-slate-400" />
                                Cicilan
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-medium text-slate-600">
                              {tx.accountName}
                            </span>
                            {tx.note && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate">{tx.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <AmountText
                          amount={tx.amount}
                          type={tx.type}
                          showSign
                          size="base"
                        />

                        {!isLocked && (
                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(tx);
                              }}
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-lg"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(tx);
                              }}
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border-slate-200 text-xs font-semibold gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </Button>
              <span className="text-xs font-medium text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border-slate-200 text-xs font-semibold gap-1"
              >
                Berikutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionForm
        open={formModal.open}
        onOpenChange={(open) => setFormModal({ ...formModal, open })}
        initialData={formModal.data}
        onSubmit={(data) => {
          if (formModal.data) {
            updateTransaction(formModal.data.id, data);
          } else {
            addTransaction(data);
          }
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
