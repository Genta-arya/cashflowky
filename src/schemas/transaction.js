import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], {
    errorMap: () => ({ message: "Pilih tipe transaksi" }),
  }),
  amount: z.coerce
    .number()
    .positive("Nominal transaksi harus lebih dari 0"),
  date: z.string().min(1, "Tanggal transaksi wajib diisi"),
  accountId: z.string().min(1, "Dompet wajib dipilih"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
});
