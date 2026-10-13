"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/schemas/contact";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm({ open, onOpenChange, onSubmit, initialData }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      note: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        phone: initialData.phone || "",
        note: initialData.note || "",
      });
    } else {
      reset({
        name: "",
        phone: "",
        note: "",
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
      title={initialData ? "Ubah Kontak" : "Tambah Kontak Baru"}
      description="Simpan kontak rekan, peminjam, atau pemberi pinjaman"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="con-name" className="text-xs font-semibold text-slate-700">
            Nama Kontak <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="con-name"
            placeholder="Contoh: Budi Santoso, Toko Berkah"
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
          <Label htmlFor="con-phone" className="text-xs font-semibold text-slate-700">
            Nomor Telepon / WhatsApp
          </Label>
          <Input
            id="con-phone"
            type="tel"
            placeholder="Contoh: 081234567890"
            className="bg-white border-slate-200"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="con-note" className="text-xs font-semibold text-slate-700">
            Catatan (Opsional)
          </Label>
          <Input
            id="con-note"
            placeholder="Contoh: Teman kantor divisi IT"
            className="bg-white border-slate-200"
            {...register("note")}
          />
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
            {initialData ? "Simpan Perubahan" : "Tambah Kontak"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
