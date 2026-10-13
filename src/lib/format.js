import { format } from "date-fns";
import { id } from "date-fns/locale/id";

/**
 * Format nominal angka ke format Rupiah standar Indonesia
 * Contoh: 1250000 -> "Rp 1.250.000"
 * @param {number|string} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  })
    .format(num)
    .replace("IDR", "Rp")
    .trim();
}

/**
 * Format tanggal ke format standar Indonesia: "13 Okt 2026"
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return format(d, "d MMM yyyy", { locale: id });
  } catch (err) {
    return "-";
  }
}

/**
 * Format bulan & tahun: "Oktober 2026"
 * @param {Date|string} date
 * @returns {string}
 */
export function formatMonth(date) {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return format(d, "MMMM yyyy", { locale: id });
  } catch (err) {
    return "-";
  }
}

/**
 * Format selisih hari jatuh tempo relatif
 * @param {Date|string} dueDate
 * @param {Date} [todayRef]
 * @returns {string}
 */
export function formatRelativeDue(dueDate, todayRef) {
  if (!dueDate) return "-";
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);

  const today = todayRef ? new Date(todayRef) : new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Terlambat ${Math.abs(diffDays)} hari`;
  }
  if (diffDays === 0) {
    return "Hari ini";
  }
  if (diffDays === 1) {
    return "Besok";
  }
  return `${diffDays} hari lagi`;
}
