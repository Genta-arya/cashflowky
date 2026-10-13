"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AmountText } from "@/components/common/AmountText";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  CheckSquare,
  Square,
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



export default function ReportsPage() {
  const { allTransactions } = useTransactions();
  const { accounts } = useAccounts();

  // Filters state
  const [selectedAccount, setSelectedAccount] = useState("ALL");
  const [includeDebtPayments, setIncludeDebtPayments] = useState(true);
  const [categoryReportType, setCategoryReportType] = useState("EXPENSE"); // EXPENSE | INCOME

  // Filtered transactions for reports
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (selectedAccount !== "ALL" && tx.accountId !== selectedAccount) {
        return false;
      }
      if (!includeDebtPayments && tx.source === "DEBT_PAYMENT") {
        return false;
      }
      return true;
    });
  }, [allTransactions, selectedAccount, includeDebtPayments]);

  // Cashflow daily / period aggregation
  const cashflowData = useMemo(() => {
    const map = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!map[dateKey]) {
        map[dateKey] = { period: dateKey, income: 0, expense: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.type === "INCOME") {
        map[dateKey].income += amt;
      } else {
        map[dateKey].expense += amt;
      }
    });

    return Object.values(map)
      .sort((a, b) => new Date(a.period) - new Date(b.period))
      .map((item) => ({
        ...item,
        formattedPeriod: formatDate(item.period),
        net: item.income - item.expense,
      }));
  }, [filteredTransactions]);

  // Totals for cashflow
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "INCOME") income += amt;
      else expense += amt;
    });
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = {};
    let totalType = 0;

    filteredTransactions
      .filter((tx) => tx.type === categoryReportType)
      .forEach((tx) => {
        const catName = tx.categoryName || "Lainnya";
        const amt = Number(tx.amount) || 0;
        totalType += amt;
        if (!map[catName]) {
          map[catName] = { name: catName, total: 0 };
        }
        map[catName].total += amt;
      });

    const palette = [
      "#f43f5e",
      "#f97316",
      "#eab308",
      "#10b981",
      "#06b6d4",
      "#6366f1",
      "#8b5cf6",
      "#ec4899",
      "#64748b",
    ];

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .map((item, idx) => ({
        ...item,
        color: palette[idx % palette.length],
        percent: totalType > 0 ? Math.round((item.total / totalType) * 100) : 0,
      }));
  }, [filteredTransactions, categoryReportType]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Laporan Keuangan"
        description="Analisis visual arus kas masuk, keluar, dan distribusi pengeluaran per kategori"
      />

      {/* Filter Bar with Debt Payment Toggle */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dompet */}
            <div className="w-48">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-xs font-semibold">
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
            </div>

            {/* Toggle Sertakan Pembayaran Utang/Piutang (PRD Section 6.7) */}
            <button
              type="button"
              onClick={() => setIncludeDebtPayments(!includeDebtPayments)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {includeDebtPayments ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Sertakan Pembayaran Utang / Piutang</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filteredTransactions.length} transaksi dianalisis
          </span>
        </div>
      </Card>

      {/* 2 Main Report Tabs */}
      <Tabs defaultValue="cashflow" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl grid grid-cols-2 w-full sm:w-80">
          <TabsTrigger
            value="cashflow"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs sm:text-sm font-semibold gap-1.5"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Arus Kas (Cashflow)
          </TabsTrigger>
          <TabsTrigger
            value="category"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs sm:text-sm font-semibold gap-1.5"
          >
            <PieChartIcon className="w-4 h-4 text-emerald-600" />
            Distribusi Kategori
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: CASHFLOW ================= */}
        <TabsContent value="cashflow" className="space-y-6 focus-visible:outline-none">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Total Masuk
              </span>
              <div className="mt-1">
                <AmountText amount={totals.income} type="INCOME" showSign size="xl" />
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/20">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Total Keluar
              </span>
              <div className="mt-1">
                <AmountText amount={totals.expense} type="EXPENSE" showSign size="xl" />
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Arus Kas Bersih
              </span>
              <div className="mt-1">
                <AmountText amount={totals.net} type="NEUTRAL" showSign size="xl" />
              </div>
            </div>
          </div>

          {/* Cashflow Bar Chart */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Grafik Arus Kas Harian
            </h3>
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData}>
                  <XAxis
                    dataKey="formattedPeriod"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(val), ""]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar dataKey="income" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Table Summary per Date */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 overflow-hidden">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Tabel Rincian Arus Kas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Periode</th>
                    <th className="py-3 px-3 text-right">Pemasukan</th>
                    <th className="py-3 px-3 text-right">Pengeluaran</th>
                    <th className="py-3 px-3 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashflowData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {row.formattedPeriod}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 tabular-nums">
                        +{formatRupiah(row.income)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600 tabular-nums">
                        −{formatRupiah(row.expense)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold tabular-nums">
                        <AmountText amount={row.net} type="NEUTRAL" showSign />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ================= TAB 2: KATEGORI ================= */}
        <TabsContent value="category" className="space-y-6 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Persentase dan nominal per kategori transaksi
            </p>
            <div className="w-44">
              <Select
                value={categoryReportType}
                onValueChange={setCategoryReportType}
              >
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl">
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                  <SelectItem value="INCOME">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut Chart */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col items-center justify-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [formatRupiah(val), ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Breakdown Table */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs overflow-hidden">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Breakdown Persentase
              </h3>
              <div className="divide-y divide-slate-100">
                {categoryData.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatRupiah(item.total)}
                      </span>
                      <span className="text-xs font-extrabold text-slate-400 w-10 tabular-nums">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
