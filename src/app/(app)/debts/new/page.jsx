"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDebtSchema } from "@/schemas/debt";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
import { MoneyInput } from "@/components/common/MoneyInput";
import { DatePicker } from "@/components/common/DatePicker";
import { ContactForm } from "@/components/settings/ContactForm";
import { useContacts } from "@/hooks/use-contacts";
import { useDebts } from "@/hooks/use-debts";
import { todayWIB, toISODateString } from "@/lib/date";
import { formatRupiah } from "@/lib/format";
import { useRouter } from "next/navigation";
import { addMonths, addWeeks } from "date-fns";
import {
  Plus,
  Trash2,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";



export default function NewDebtPage() {
  const router = useRouter();
  const { contacts, addContact } = useContacts();
  const { addDebt } = useDebts();

  // Inline Contact Modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Quick split generator states
  const [splitCount, setSplitCount] = useState(3);
  const [splitInterval, setSplitInterval] = useState("MONTHLY"); // MONTHLY | WEEKLY
  const [splitStartDate, setSplitStartDate] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDebtSchema),
    defaultValues: {
      type: "PAYABLE",
      contactId: contacts[0]?.id || "",
      title: "",
      principalAmount: 0,
      startDate: toISODateString(todayWIB()),
      note: "",
      installments: [
        {
          dueDate: toISODateString(addMonths(todayWIB(), 1)),
          amount: 0,
          note: "Cicilan 1",
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "installments",
  });

  const selectedType = watch("type");
  const principalAmount = watch("principalAmount") || 0;
  const currentInstallments = watch("installments") || [];

  // Total schedule sum
  const totalSchedule = currentInstallments.reduce(
    (sum, inst) => sum + (Number(inst.amount) || 0),
    0
  );
  const diffInterest = totalSchedule - Number(principalAmount);

  // Generator "Bagi Rata"
  const handleQuickSplit = () => {
    const count = Math.max(1, Number(splitCount));
    const total = Number(principalAmount);

    if (total <= 0) {
      toast.error("Isi pokok pinjaman terlebih dahulu sebelum bagi rata");
      return;
    }

    const baseAmount = Math.floor(total / count);
    const remainder = total - baseAmount * count;

    const baseDate = new Date(splitStartDate || todayWIB());
    const newRows = [];

    for (let i = 0; i < count; i++) {
      let dueDate;
      if (splitInterval === "MONTHLY") {
        dueDate = addMonths(baseDate, i + 1);
      } else {
        dueDate = addWeeks(baseDate, i + 1);
      }

      // Selisih pembulatan ditambahkan ke cicilan terakhir
      const amount = i === count - 1 ? baseAmount + remainder : baseAmount;

      newRows.push({
        dueDate: toISODateString(dueDate),
        amount,
        note: `Cicilan ke-${i + 1}`,
      });
    }

    replace(newRows);
    toast.success(`${count} baris cicilan berhasil di-generate secara merata!`);
  };

  const onSubmit = async (data) => {
    const res = await addDebt(data);
    if (res) {
      router.push("/debts");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/debts">
          <Button variant="ghost" size="sm" className="rounded-xl text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Daftar
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Tambah Catatan Utang / Piutang"
        description="Buat catatan pinjaman baru lengkap dengan simulasi jadwal jatuh tempo cicilan dinamis"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION 1: Informasi Utama */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            1. Informasi Pokok Pinjaman
          </h2>

          {/* Tipe Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Jenis Pinjaman <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 max-w-md">
              <button
                type="button"
                onClick={() => setValue("type", "PAYABLE")}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  selectedType === "PAYABLE"
                    ? "bg-white text-rose-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                Utang Saya (Wajib Bayar)
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "RECEIVABLE")}
                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  selectedType === "RECEIVABLE"
                    ? "bg-white text-emerald-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                Piutang Saya (Dipinjam Orang)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kontak */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="contactId" className="text-xs font-semibold text-slate-700">
                  {selectedType === "PAYABLE" ? "Pemberi Pinjaman" : "Peminjam"}{" "}
                  <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Kontak Baru
                </button>
              </div>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="contactId" className="bg-white border-slate-200">
                      <SelectValue placeholder="Pilih kontak" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl shadow-xl">
                      {contacts.map((con) => (
                        <SelectItem key={con.id} value={con.id}>
                          {con.name} {con.phone ? `(${con.phone})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.contactId && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.contactId.message}
                </p>
              )}
            </div>

            {/* Judul */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
                Judul Utang / Piutang <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Cicilan Motor Honda, Modal Usaha"
                className="bg-white border-slate-200"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Pokok Pinjaman */}
            <div className="space-y-1.5">
              <Label htmlFor="principalAmount" className="text-xs font-semibold text-slate-700">
                Pokok Pinjaman (Nominal Awal) <span className="text-rose-500">*</span>
              </Label>
              <Controller
                name="principalAmount"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    id="principalAmount"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
              {errors.principalAmount && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.principalAmount.message}
                </p>
              )}
            </div>

            {/* Tanggal Mulai */}
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold text-slate-700">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="startDate"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-semibold text-slate-700">
              Catatan Keterangan (Opsional)
            </Label>
            <Input
              id="note"
              placeholder="Catatan perjanjian atau kesepakatan cicilan..."
              className="bg-white border-slate-200"
              {...register("note")}
            />
          </div>
        </Card>

        {/* SECTION 2: Generator Cepat Bagi Rata */}
        <Card className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-white shadow-xs p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Generator Cepat Bagi Rata Cicilan
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Isi jumlah cicilan untuk membagi rata pokok pinjaman ke beberapa baris tanggal otomatis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Jumlah Cicilan
              </Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={splitCount}
                onChange={(e) => setSplitCount(Number(e.target.value))}
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Mulai Dari
              </Label>
              <DatePicker
                value={splitStartDate}
                onChange={setSplitStartDate}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Interval
              </Label>
              <Select value={splitInterval} onValueChange={setSplitInterval}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl">
                  <SelectItem value="MONTHLY">Bulanan</SelectItem>
                  <SelectItem value="WEEKLY">Mingguan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={handleQuickSplit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
            >
              Bagi Rata Otomatis
            </Button>
          </div>
        </Card>

        {/* SECTION 3: Jadwal Jatuh Tempo Dinamis */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. Jadwal Jatuh Tempo ({fields.length} Cicilan)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap baris cicilan dapat Anda ubah tanggal dan nominalnya secara bebas.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  dueDate: toISODateString(todayWIB()),
                  amount: 0,
                  note: `Cicilan ke-${fields.length + 1}`,
                })
              }
              className="rounded-xl border-slate-200 gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris
            </Button>
          </div>

          {errors.installments?.root && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.installments.root.message}
            </p>
          )}

          {/* Table / Row list */}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </div>

                {/* Tanggal Jatuh Tempo */}
                <div className="w-full sm:w-44">
                  <Controller
                    name={`installments.${index}.dueDate`}
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Jatuh tempo"
                      />
                    )}
                  />
                </div>

                {/* Nominal */}
                <div className="w-full sm:w-52">
                  <Controller
                    name={`installments.${index}.amount`}
                    control={control}
                    render={({ field }) => (
                      <MoneyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Nominal"
                      />
                    )}
                  />
                </div>

                {/* Catatan */}
                <div className="w-full sm:flex-1">
                  <Input
                    placeholder="Catatan cicilan (opsional)"
                    className="bg-white border-slate-200 text-sm"
                    {...register(`installments.${index}.note`)}
                  />
                </div>

                {/* Delete button (minimum 1 row) */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Summary of Total Schedule */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                Total Jadwal Cicilan
              </div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {formatRupiah(totalSchedule)}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500 font-medium">
                Selisih dari Pokok (Bunga / Biaya)
              </div>
              <div
                className={`text-sm font-bold tabular-nums ${
                  diffInterest > 0
                    ? "text-rose-600"
                    : diffInterest < 0
                    ? "text-emerald-600"
                    : "text-slate-600"
                }`}
              >
                {diffInterest === 0
                  ? "Sesuai pokok (Rp 0)"
                  : `${diffInterest > 0 ? "+" : "−"} ${formatRupiah(
                      Math.abs(diffInterest)
                    )}`}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pb-12">
          <Link href="/debts">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 px-6 font-semibold"
          >
            Simpan Catatan
          </Button>
        </div>
      </form>

      {/* Inline Contact Create Modal */}
      <ContactForm
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        onSubmit={(newCon) => {
          const created = addContact(newCon);
          if (created) {
            setValue("contactId", created.id);
          }
        }}
      />
    </div>
  );
}
