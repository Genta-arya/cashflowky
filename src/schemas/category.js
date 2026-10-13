import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(100, "Maksimal 100 karakter"),
  type: z.enum(["INCOME", "EXPENSE"], {
    errorMap: () => ({ message: "Pilih tipe kategori yang valid" }),
  }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format warna harus hex (contoh: #10b981)")
    .default("#64748b"),
});
