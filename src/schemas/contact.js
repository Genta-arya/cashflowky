import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Nama kontak wajib diisi").max(100, "Maksimal 100 karakter"),
  phone: z.string().max(30, "Nomor telepon maksimal 30 karakter").optional().nullable(),
  note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
});
