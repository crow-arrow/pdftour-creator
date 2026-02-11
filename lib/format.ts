import type { Locale } from "@/lib/types";

export function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}
