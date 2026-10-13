import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Nama dompet wajib diisi").max(100, "Maksimal 100 karakter"),
  type: z.enum(["CASH", "BANK", "EWALLET"], {
    errorMap: () => ({ message: "Pilih tipe dompet yang valid" }),
  }),
  initialBalance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif"),
  isActive: z.boolean().default(true),
});
