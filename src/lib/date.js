/**
 * Mendapatkan objek Date untuk hari ini di zona waktu Asia/Jakarta (WIB) tanpa jam.
 * @returns {Date}
 */
export function todayWIB() {
  const now = new Date();
  const wibString = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const wibDate = new Date(wibString);
  return new Date(wibDate.getFullYear(), wibDate.getMonth(), wibDate.getDate(), 0, 0, 0, 0);
}

/**
 * Mendapatkan awal bulan di WIB (tanggal 1 pukul 00:00:00)
 * @param {Date|string} [date]
 * @returns {Date}
 */
export function startOfMonthWIB(date) {
  const d = date ? new Date(date) : todayWIB();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Mendapatkan akhir bulan di WIB (tanggal terakhir pukul 23:59:59)
 * @param {Date|string} [date]
 * @returns {Date}
 */
export function endOfMonthWIB(date) {
  const d = date ? new Date(date) : todayWIB();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Format date object ke string "YYYY-MM-DD"
 * @param {Date|string} date
 * @returns {string}
 */
export function toISODateString(date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
