"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/schemas/transaction";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { DatePicker } from "@/components/common/DatePicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { todayWIB, toISODateString } from "@/lib/date";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

/**
 * Dialog Form Tambah / Edit Transaksi
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onSubmit: (data: any) => void,
 *   initialData?: any,
 *   title?: string
 * }} props
 */
export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title = "Tambah Transaksi",
}) {
  const { accounts } = useAccounts();
  const activeAccounts = accounts.filter((a) => a.isActive);

  const [activeType, setActiveType] = useState(
    initialData?.type || "EXPENSE"
  );

  const { categories } = useCategories(activeType);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      date: "",
      accountId: "",
      categoryId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setActiveType(initialData.type);
      reset({
        type: initialData.type,
        amount: initialData.amount,
        date: initialData.date,
        accountId: initialData.accountId,
        categoryId: initialData.categoryId,
        note: initialData.note || "",
      });
    } else {
      setActiveType("EXPENSE");
      reset({
        type: "EXPENSE",
        amount: 0,
        date: toISODateString(todayWIB()),
        accountId: activeAccounts[0]?.id || "",
        categoryId: "",
        note: "",
      });
    }
  }, [initialData, open, reset]);

  const handleTypeToggle = (type) => {
    setActiveType(type);
    setValue("type", type);
    setValue("categoryId", ""); // Reset category when switching type
  };

  const handleFormSubmit = (data) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? "Ubah Transaksi" : title}
      description="Catat detail pengeluaran atau pemasukan baru"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
        {/* 1. Segmented Toggle Tipe Transaksi */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => handleTypeToggle("EXPENSE")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all",
              activeType === "EXPENSE"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => handleTypeToggle("INCOME")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all",
              activeType === "INCOME"
                ? "bg-white text-emerald-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            Pemasukan
          </button>
        </div>

        {/* 2. Nominal */}
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
            Nominal <span className="text-rose-500">*</span>
          </Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="amount"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
                className="text-lg py-2.5"
              />
            )}
          />
          {errors.amount && (
            <p className="text-xs font-medium text-rose-500 mt-1">
              {errors.amount.message}
            </p>
          )}
        </div>

        {/* 3. Tanggal */}
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs font-semibold text-slate-700">
            Tanggal <span className="text-rose-500">*</span>
          </Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="date"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.date && (
            <p className="text-xs font-medium text-rose-500 mt-1">
              {errors.date.message}
            </p>
          )}
        </div>

        {/* 4. Dompet / Rekening */}
        <div className="space-y-1.5">
          <Label htmlFor="accountId" className="text-xs font-semibold text-slate-700">
            Dompet / Rekening <span className="text-rose-500">*</span>
          </Label>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="accountId" className="w-full bg-white border-slate-200">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl">
                  {activeAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.accountId && (
            <p className="text-xs font-medium text-rose-500 mt-1">
              {errors.accountId.message}
            </p>
          )}
        </div>

        {/* 5. Kategori */}
        <div className="space-y-1.5">
          <Label htmlFor="categoryId" className="text-xs font-semibold text-slate-700">
            Kategori <span className="text-rose-500">*</span>
          </Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="categoryId" className="w-full bg-white border-slate-200">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.name}</span>
                        {cat.isSystem && (
                          <span className="text-[10px] text-slate-400">(Sistem)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="text-xs font-medium text-rose-500 mt-1">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* 6. Catatan */}
        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs font-semibold text-slate-700">
            Catatan (Opsional)
          </Label>
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <Input
                id="note"
                placeholder="Contoh: Makan siang nasi padang"
                className="bg-white border-slate-200"
                {...field}
                value={field.value || ""}
              />
            )}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200"
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            Simpan Transaksi
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
