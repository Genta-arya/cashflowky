import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge classnames with tailwind-merge and clsx
 * @param  {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Konversi nilai Decimal / string / number ke number aman
 * @param {any} val
 * @returns {number}
 */
export function toNumber(val) {
  if (val === null || val === undefined || val === "") return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}
