import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number, currencyCode = "USD") {
  const normalizedCurrency = currencyCode.toUpperCase();
  return new Intl.NumberFormat(normalizedCurrency === "VND" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: 0
  }).format(value);
}
