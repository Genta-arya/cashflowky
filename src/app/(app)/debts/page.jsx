"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebts } from "@/hooks/use-debts";
import { formatRupiah, formatDate, formatRelativeDue } from "@/lib/format";
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";



export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState("PAYABLE"); // PAYABLE | RECEIVABLE
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("DUE_DATE");

  const { debts, allDebts } = useDebts(activeTab);

  const filteredDebts = debts.filter((d) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "OVERDUE") {
      return (
        d.status === "ACTIVE" &&
        d.installments.some(
          (i) => i.status !== "PAID" && new Date(i.dueDate) < new Date()
        )
      );
    }
    return d.status === statusFilter;
  });

  const payableCount = (allDebts || []).filter((d) => d.type === "PAYABLE").length;
  const receivableCount = (allDebts || []).filter((d) => d.type === "RECEIVABLE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utang & Piutang"
        description="Kelola kewajiban pembayaran utang dan tagihan piutang dengan cicilan terjadwal"
        action={
          <Link href="/debts/new">
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-xs">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Tambah Catatan
            </Button>
          </Link>
        }
      />

      {/* Tabs Switcher: Utang Saya vs Piutang Saya */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-slate-100 p-1 rounded-2xl grid grid-cols-2 w-full sm:w-80">
            <TabsTrigger
              value="PAYABLE"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs sm:text-sm font-semibold gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4 text-rose-500" />
              Utang Saya ({payableCount})
            </TabsTrigger>
            <TabsTrigger
              value="RECEIVABLE"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs sm:text-sm font-semibold gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              Piutang Saya ({receivableCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2.5">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white border-slate-200 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl shadow-xl">
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="OVERDUE">Terlambat</SelectItem>
              <SelectItem value="PAID">Lunas</SelectItem>
              <SelectItem value="CANCELED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debt List Cards */}
      {filteredDebts.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="w-8 h-8" />}
          title={`Belum ada data ${activeTab === "PAYABLE" ? "utang" : "piutang"}`}
          description={`Mulai catat ${activeTab === "PAYABLE" ? "kewajiban utang" : "piutang yang dipinjam orang lain"
            } dengan jadwal jatuh tempo yang fleksibel.`}
          actionLabel="Tambah Catatan Baru"
          onAction={() => {
            window.location.href = "/debts/new";
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map((item) => {
            const isPayable = item.type === "PAYABLE";
            const percentPaid = Math.min(
              100,
              Math.round((item.paidAmount / (item.totalAmount || 1)) * 100)
            );

            const hasOverdue =
              item.status === "ACTIVE" &&
              item.installments.some(
                (i) => i.status !== "PAID" && new Date(i.dueDate) < new Date()
              );

            return (
              <Link key={item.id} href={`/debts/${item.id}`}>
                <Card className="rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-md transition-all h-full cursor-pointer group">
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    {/* Header: Title, Contact, and Status */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-700">
                              {item.contact?.name || "Kontak"}
                            </span>
                          </div>
                        </div>

                        {hasOverdue ? (
                          <StatusBadge status="OVERDUE" />
                        ) : (
                          <StatusBadge status={item.status} />
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Amount Numbers */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Total:{" "}
                          <strong className="text-slate-900 font-bold">
                            {formatRupiah(item.totalAmount)}
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          Sisa:{" "}
                          <strong
                            className={
                              isPayable ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"
                            }
                          >
                            {formatRupiah(item.remainingAmount)}
                          </strong>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <Progress
                          value={percentPaid}
                          className="h-2 rounded-full bg-slate-100"
                        />
                        <div className="flex justify-end text-[11px] font-semibold text-slate-400">
                          {percentPaid}% terbayar
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Next Due Date info */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {item.nextDue && item.status === "ACTIVE" ? (
                        <div className="flex items-center gap-1.5">
                          {hasOverdue ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span
                            className={
                              hasOverdue
                                ? "text-rose-600 font-semibold"
                                : "text-slate-600 font-medium"
                            }
                          >
                            Jatuh tempo: {formatRelativeDue(item.nextDue.dueDate)} (
                            {formatRupiah(item.nextDue.amount)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          {item.status === "PAID"
                            ? "Semua cicilan lunas"
                            : "Tidak ada jadwal"}
                        </span>
                      )}

                      <div className="flex items-center text-indigo-600 font-semibold text-xs gap-1 group-hover:translate-x-1 transition-transform">
                        Detail
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
