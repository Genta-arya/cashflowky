"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/schemas/account";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { MoneyInput } from "@/components/common/MoneyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AccountForm({ open, onOpenChange, onSubmit, initialData }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CASH",
      initialBalance: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type,
        initialBalance: initialData.initialBalance,
        isActive: initialData.isActive,
      });
    } else {
      reset({
        name: "",
        type: "CASH",
        initialBalance: 0,
        isActive: true,
      });
    }
  }, [initialData, open, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? "Ubah Dompet" : "Tambah Dompet Baru"}
      description="Kelola akun kas, rekening bank, atau e-wallet Anda"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="acc-name" className="text-xs font-semibold text-slate-700">
            Nama Dompet <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="acc-name"
            placeholder="Contoh: BCA, Tunai Dompet, GoPay"
            className="bg-white border-slate-200"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="acc-type" className="text-xs font-semibold text-slate-700">
            Tipe Dompet <span className="text-rose-500">*</span>
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="acc-type" className="bg-white border-slate-200">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl">
                  <SelectItem value="CASH">💵 Uang Tunai (CASH)</SelectItem>
                  <SelectItem value="BANK">🏦 Rekening Bank (BANK)</SelectItem>
                  <SelectItem value="EWALLET">📱 Dompet Digital (EWALLET)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.type.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="acc-init" className="text-xs font-semibold text-slate-700">
            Saldo Awal
          </Label>
          <Controller
            name="initialBalance"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="acc-init"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
                disabled={!!initialData}
              />
            )}
          />
          {initialData && (
            <p className="text-[11px] text-slate-400">
              Saldo awal tidak dapat diubah setelah dompet dibuat.
            </p>
          )}
          {errors.initialBalance && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.initialBalance.message}
            </p>
          )}
        </div>

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
            {initialData ? "Simpan Perubahan" : "Tambah Dompet"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
