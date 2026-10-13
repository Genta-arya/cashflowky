"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { DatePicker } from "@/components/common/DatePicker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebtDetail } from "@/hooks/use-debts";
import { useAccounts } from "@/hooks/use-accounts";
import { formatRupiah, formatDate, formatRelativeDue } from "@/lib/format";
import { todayWIB, toISODateString } from "@/lib/date";
import {
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  Trash2,
  Ban,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";



function DebtDetailContent({ params }) {
  const unwrappedParams = use(params);
  const debtId = unwrappedParams.id;
  const router = useRouter();

  const {
    debt,
    isLoading,
    payInstallment,
    deletePayment,
    deleteDebt,
    cancelDebt,
  } = useDebtDetail(debtId);

  const { accounts } = useAccounts();
  const activeAccounts = accounts.filter((a) => a.isActive);

  // Payment Modal state
  const [payModal, setPayModal] = useState({
    open: false,
    installment: null,
    amount: 0,
    accountId: "",
    paidDate: "",
    note: "",
  });

  // Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  if (!debt) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">
          Data Utang / Piutang Tidak Ditemukan
        </h2>
        <Link href="/debts">
          <Button variant="outline" className="rounded-xl">
            Kembali ke Daftar
          </Button>
        </Link>
      </div>
    );
  }

  const isPayable = debt.type === "PAYABLE";
  const percentPaid = Math.min(
    100,
    Math.round((debt.paidAmount / (debt.totalAmount || 1)) * 100)
  );

  const handleOpenPayModal = (installment) => {
    const sisa = installment.amount - installment.paidAmount;
    setPayModal({
      open: true,
      installment,
      amount: sisa,
      accountId: activeAccounts[0]?.id || "",
      paidDate: toISODateString(todayWIB()),
      note: "",
    });
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!payModal.installment) return;

    if (payModal.amount <= 0) {
      toast.error("Nominal pembayaran harus lebih dari 0");
      return;
    }

    if (!payModal.accountId) {
      toast.error("Pilih dompet pembayaran");
      return;
    }

    payInstallment(payModal.installment.id, {
      installmentId: payModal.installment.id,
      amount: payModal.amount,
      accountId: payModal.accountId,
      paidDate: payModal.paidDate,
      note: payModal.note,
    });

    setPayModal({ ...payModal, open: false });
  };

  const handleDeleteDebt = () => {
    setConfirmDialog({
      open: true,
      title: "Hapus Catatan Utang / Piutang?",
      description:
        "Catatan ini hanya bisa dihapus karena belum memiliki riwayat pembayaran sama sekali.",
      onConfirm: async () => {
        const success = await deleteDebt();
        if (success) router.push("/debts");
      },
    });
  };

  const handleCancelDebt = () => {
    setConfirmDialog({
      open: true,
      title: "Batalkan Utang / Piutang Ini?",
      description:
        "Status utang akan diubah menjadi Dibatalkan. Riwayat pembayaran sebelumnya tetap tersimpan.",
      confirmLabel: "Ya, Batalkan",
      variant: "destructive",
      onConfirm: async () => {
        await cancelDebt();
      },
    });
  };

  const handleDeletePayment = (paymentId) => {
    setConfirmDialog({
      open: true,
      title: "Batalkan Pembayaran Ini?",
      description:
        "Saldo dompet akan dikembalikan dan status cicilan akan disesuaikan kembali.",
      confirmLabel: "Ya, Batalkan",
      variant: "destructive",
      onConfirm: () => deletePayment(paymentId),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Back Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link href="/debts">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Daftar
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {debt.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelDebt}
              className="rounded-xl border-slate-200 text-slate-600 hover:text-rose-600 gap-1.5 text-xs font-semibold"
            >
              <Ban className="w-3.5 h-3.5" />
              Batalkan
            </Button>
          )}

          {debt.paidAmount === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteDebt}
              className="rounded-xl border-slate-200 text-rose-600 hover:bg-rose-50 gap-1.5 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      {/* Main Header Information Card */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isPayable
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {isPayable ? "Utang Saya" : "Piutang Saya"}
              </span>
              <StatusBadge status={debt.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {debt.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <User className="w-4 h-4 text-slate-400" />
                {debt.contact?.name || "Kontak"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Mulai: {formatDate(debt.startDate)}
              </span>
            </div>
          </div>
        </div>

        {debt.note && (
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
            "{debt.note}"
          </p>
        )}

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Kewajiban
            </span>
            <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">
              {formatRupiah(debt.totalAmount)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Sudah Terbayar
            </span>
            <div className="text-xl font-extrabold text-emerald-700 tabular-nums mt-1">
              {formatRupiah(debt.paidAmount)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Sisa yang Harus Dibayar
            </span>
            <div className="text-xl font-extrabold text-rose-700 tabular-nums mt-1">
              {formatRupiah(debt.remainingAmount)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Progress Pelunasan</span>
            <span>{percentPaid}%</span>
          </div>
          <Progress value={percentPaid} className="h-2.5 rounded-full bg-slate-100" />
        </div>
      </Card>

      {/* SECTION 2: Tabel Jadwal Cicilan */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Jadwal Cicilan Jatuh Tempo ({debt.installments?.length || 0})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rincian setiap tahap cicilan dan status pembayarannya
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-3 text-right">Nominal</th>
                <th className="py-3 px-3 text-right">Terbayar</th>
                <th className="py-3 px-3 text-right">Sisa</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debt.installments?.map((inst) => {
                const sisa = inst.amount - inst.paidAmount;
                const isPaidFull = inst.status === "PAID";
                const isOverdue =
                  !isPaidFull && new Date(inst.dueDate) < new Date();

                return (
                  <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-600">
                      {inst.sequence}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">
                        {formatDate(inst.dueDate)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatRelativeDue(inst.dueDate)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-slate-800 tabular-nums">
                      {formatRupiah(inst.amount)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-semibold text-emerald-600 tabular-nums">
                      {formatRupiah(inst.paidAmount)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-slate-800 tabular-nums">
                      {formatRupiah(sisa)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {isPaidFull ? (
                        <StatusBadge status="PAID" />
                      ) : isOverdue ? (
                        <StatusBadge status="OVERDUE" />
                      ) : inst.status === "PARTIAL" ? (
                        <StatusBadge status="PARTIAL" />
                      ) : (
                        <StatusBadge status="PENDING" />
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {!isPaidFull && debt.status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPayModal(inst)}
                          className={`rounded-xl shadow-xs text-xs font-bold px-3 ${
                            isPayable
                              ? "bg-rose-600 hover:bg-rose-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          {isPayable ? "Bayar" : "Terima"}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 3: Riwayat Pembayaran */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Pembayaran ({debt.payments?.length || 0})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar transaksi kas yang telah dicatat untuk utang ini
          </p>
        </div>

        {debt.payments?.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            Belum ada catatan pembayaran.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {debt.payments?.map((payment) => (
              <div
                key={payment.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Cicilan ke-{payment.sequence}
                    </span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {payment.accountName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(payment.paidDate)}{" "}
                    {payment.note && `(${payment.note})`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatRupiah(payment.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePayment(payment.id)}
                    title="Batalkan pembayaran ini"
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Bayar Cicilan */}
      <ResponsiveDialog
        open={payModal.open}
        onOpenChange={(open) => setPayModal({ ...payModal, open })}
        title={`${isPayable ? "Bayar" : "Terima"} Cicilan ke-${
          payModal.installment?.sequence || ""
        }`}
        description={`Catat arus kas untuk pelunasan cicilan ${debt.title}`}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Nominal {isPayable ? "Pembayaran" : "Penerimaan"} <span className="text-rose-500">*</span>
            </Label>
            <MoneyInput
              value={payModal.amount}
              onChange={(val) => setPayModal({ ...payModal, amount: val })}
              placeholder="0"
              className="text-lg py-2.5 font-bold"
            />
            {payModal.installment && (
              <p className="text-[11px] text-slate-400">
                Sisa tagihan cicilan ini:{" "}
                <strong>
                  {formatRupiah(
                    payModal.installment.amount - payModal.installment.paidAmount
                  )}
                </strong>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Dompet / Rekening {isPayable ? "Sumber Dana" : "Tujuan"} <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={payModal.accountId}
              onValueChange={(val) => setPayModal({ ...payModal, accountId: val })}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Pilih dompet" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl shadow-xl">
                {activeAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} (Saldo: {formatRupiah(acc.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Tanggal Pembayaran <span className="text-rose-500">*</span>
            </Label>
            <DatePicker
              value={payModal.paidDate}
              onChange={(val) => setPayModal({ ...payModal, paidDate: val })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Catatan Bukti (Opsional)
            </Label>
            <Input
              placeholder="Contoh: Transfer via BCA Mobile, Bukti ref 8829"
              value={payModal.note}
              onChange={(e) => setPayModal({ ...payModal, note: e.target.value })}
              className="bg-white border-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayModal({ ...payModal, open: false })}
              className="rounded-xl border-slate-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className={`rounded-xl shadow-xs font-semibold text-white ${
                isPayable
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              Konfirmasi {isPayable ? "Bayar" : "Terima"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}

export default function DebtDetailPage({ params }) {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat rincian utang...</div>}>
      <DebtDetailContent params={params} />
    </React.Suspense>
  );
}

