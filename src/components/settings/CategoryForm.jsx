"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "@/schemas/category";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
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
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const COLOR_PRESETS = [
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Amber/Yellow
  "#10b981", // Emerald/Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

export function CategoryForm({ open, onOpenChange, onSubmit, initialData }) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "EXPENSE",
      color: "#6366f1",
    },
  });

  const currentColor = watch("color");

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type,
        color: initialData.color || "#6366f1",
      });
    } else {
      reset({
        name: "",
        type: "EXPENSE",
        color: "#6366f1",
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
      title={initialData ? "Ubah Kategori" : "Tambah Kategori Baru"}
      description="Klasifikasi pengeluaran dan pemasukan keuangan Anda"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name" className="text-xs font-semibold text-slate-700">
            Nama Kategori <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="cat-name"
            placeholder="Contoh: Makan Siang, Skincare, Bonus"
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
          <Label htmlFor="cat-type" className="text-xs font-semibold text-slate-700">
            Tipe Kategori <span className="text-rose-500">*</span>
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!!initialData}
              >
                <SelectTrigger id="cat-type" className="bg-white border-slate-200">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl">
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                  <SelectItem value="INCOME">Pemasukan</SelectItem>
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

        {/* Color Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700">
            Pilihan Warna
          </Label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue("color", color)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xs ring-offset-2 ring-slate-400",
                  currentColor === color && "ring-2 scale-110"
                )}
                style={{ backgroundColor: color }}
              >
                {currentColor === color && (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                )}
              </button>
            ))}
          </div>
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
            {initialData ? "Simpan Perubahan" : "Tambah Kategori"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
