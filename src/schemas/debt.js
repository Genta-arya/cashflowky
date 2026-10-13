import { z } from "zod";

export const installmentItemSchema = z.object({
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  amount: z.coerce.number().positive("Nominal cicilan harus lebih dari 0"),
  note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
});

export const createDebtSchema = z
  .object({
    type: z.enum(["PAYABLE", "RECEIVABLE"], {
      errorMap: () => ({ message: "Pilih jenis (Utang / Piutang)" }),
    }),
    contactId: z.string().min(1, "Kontak wajib dipilih"),
    title: z.string().trim().min(1, "Judul utang/piutang wajib diisi").max(150, "Maksimal 150 karakter"),
    principalAmount: z.coerce.number().positive("Pokok pinjaman harus lebih dari 0"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    note: z.string().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
    installments: z
      .array(installmentItemSchema)
      .min(1, "Minimal harus ada 1 baris jadwal jatuh tempo"),
  });

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Nominal pembayaran harus lebih dari 0"),
  accountId: z.string().min(1, "Dompet pembayaran wajib dipilih"),
  paidDate: z.string().min(1, "Tanggal bayar wajib diisi"),
  note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
});
