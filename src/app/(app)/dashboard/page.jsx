"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmountText } from "@/components/common/AmountText";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  ReceiptText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";



export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState("Oktober 2026");
  const { summary } = useDashboard(selectedMonth);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Ringkasan arus kas, saldo dompet, dan jadwal jatuh tempo utang piutang
          </p>
        </div>

        {/* Month Selector Carousel */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2 py-1.5 rounded-2xl shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedMonth("September 2026")}
            className="h-8 w-8 rounded-xl text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-2 text-xs sm:text-sm font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>{selectedMonth}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedMonth("November 2026")}
            className="h-8 w-8 rounded-xl text-slate-600 hover:text-slate-900"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 4 Main Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Saldo"
          value={formatRupiah(summary.totalBalance)}
          icon={<Wallet className="w-5 h-5" />}
          subtitle="Semua dompet aktif"
          variant="default"
        />

        <StatCard
          title="Pemasukan"
          value={<AmountText amount={summary.income} type="INCOME" showSign size="xl" />}
          icon={<ArrowUpRight className="w-5 h-5" />}
          subtitle="Bulan berjalan"
          variant="income"
        />

        <StatCard
          title="Pengeluaran"
          value={<AmountText amount={summary.expense} type="EXPENSE" showSign size="xl" />}
          icon={<ArrowDownLeft className="w-5 h-5" />}
          subtitle="Termasuk cicilan"
          variant="expense"
        />

        <StatCard
          title="Selisih Bersih"
          value={<AmountText amount={summary.net} type="NEUTRAL" showSign size="xl" />}
          icon={<Scale className="w-5 h-5" />}
          subtitle={summary.net >= 0 ? "Surplus kas" : "Defisit kas"}
          variant={summary.net >= 0 ? "income" : "expense"}
        />
      </div>

      {/* Utang & Piutang Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Utang Saya */}
        <Card className="rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/20 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Utang Saya (Sisa Kewajiban)
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                {formatRupiah(summary.payableRemaining)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1.5">
                <span>{summary.payableActiveCount} utang aktif</span>
                {summary.payableOverdueCount > 0 && (
                  <>
                    <span>&bull;</span>
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {summary.payableOverdueCount} terlambat
                    </span>
                  </>
                )}
              </div>
            </div>
            <Link href="/debts">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
              >
                Lihat Utang
              </Button>
            </Link>
          </div>
        </Card>

        {/* Piutang Saya */}
        <Card className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Piutang Saya (Sisa Hak Tagih)
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                {formatRupiah(summary.receivableRemaining)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1.5">
                <span>{summary.receivableActiveCount} piutang aktif</span>
                <span>&bull;</span>
                <span className="text-emerald-700 font-semibold">Siap ditagih</span>
              </div>
            </div>
            <Link href="/debts">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
              >
                Lihat Piutang
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Tren 6 Bulan (Bar Chart) */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tren Arus Kas 6 Bulan Terakhir
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan nominal pemasukan vs pengeluaran bulanan
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={summary.trend6m}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(value) => [formatRupiah(value), ""]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="income"
                name="Pemasukan"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Pengeluaran"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 2 Columns: Pengeluaran per Kategori + Jatuh Tempo Terdekat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart: Pengeluaran per Kategori */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pengeluaran per Kategori
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi pengeluaran bulan ini
            </p>
          </div>

          {summary.expenseByCategory.length > 0 ? (
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.expenseByCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {summary.expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatRupiah(value), ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
              Belum ada data pengeluaran
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {summary.expenseByCategory.map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 hover:bg-slate-50 px-2 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-slate-700">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(cat.total)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Widget: Jatuh Tempo Terdekat */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">
                Pengingat Jatuh Tempo
              </h3>
              <Link
                href="/debts"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              Cicilan 30 hari ke depan dan yang sudah terlambat
            </p>
          </div>

          <div className="space-y-3 flex-1 pt-2">
            {summary.upcomingDues?.map((due, idx) => {
              const isOverdue = due.status === "OVERDUE";
              return (
                <Link
                  key={idx}
                  href={`/debts/${due.debtId}`}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all flex items-center justify-between group block"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isOverdue
                          ? "bg-rose-50 text-rose-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {isOverdue ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {due.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {due.contactName} &bull; Cicilan ke-{due.sequence}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(due.amount)}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        isOverdue ? "text-rose-600" : "text-amber-600"
                      }`}
                    >
                      {due.relativeText}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Transaksi Terbaru (5) */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Transaksi Terbaru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              5 catatan transaksi terakhir yang tercatat di sistem
            </p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {summary.recentTransactions?.map((tx) => (
            <div
              key={tx.id}
              className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "EXPENSE"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {tx.type === "EXPENSE" ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block leading-tight">
                    {tx.categoryName}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5 block leading-tight">
                    {formatDate(tx.date)} &bull; {tx.accountName}{" "}
                    {tx.note && `(${tx.note})`}
                  </span>
                </div>
              </div>

              <AmountText
                amount={tx.amount}
                type={tx.type}
                showSign
                size="base"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
