export const EXTERNAL_TRANSFER_COUNTRIES = [
  { code: "LY", name: "ليبيا", currencyName: "الدينار الليبي", currencyCode: "LYD", flag: "🇱🇾" },
  { code: "SD", name: "السودان", currencyName: "الجنيه السوداني", currencyCode: "SDG", flag: "🇸🇩" },
  { code: "KW", name: "الكويت", currencyName: "الدينار الكويتي", currencyCode: "KWD", flag: "🇰🇼" },
  { code: "AE", name: "الإمارات", currencyName: "الدرهم الإماراتي", currencyCode: "AED", flag: "🇦🇪" },
  { code: "SA", name: "السعودية", currencyName: "الريال السعودي", currencyCode: "SAR", flag: "🇸🇦" },
  { code: "IT", name: "إيطاليا", currencyName: "اليورو", currencyCode: "EUR", flag: "🇮🇹" },
  { code: "DE", name: "ألمانيا", currencyName: "اليورو", currencyCode: "EUR", flag: "🇩🇪" },
] as const;

export type ExternalTransferCountry = (typeof EXTERNAL_TRANSFER_COUNTRIES)[number];
export type ExternalTransferStatus = "new" | "under_review" | "awaiting_details" | "approved" | "completed" | "rejected";
export const EXTERNAL_TRANSFER_CURRENCIES = [...new Set(EXTERNAL_TRANSFER_COUNTRIES.map((country) => country.currencyCode))];
export type ExternalTransferCurrency = (typeof EXTERNAL_TRANSFER_CURRENCIES)[number];
export type ExternalTransferPrice = { currencyCode: ExternalTransferCurrency; rate: string | null; feeEgp: string; updatedAt: string | Date | null };

export const EXTERNAL_TRANSFER_STATUS_LABELS: Record<ExternalTransferStatus, string> = {
  new: "جديد",
  under_review: "قيد المراجعة",
  awaiting_details: "بانتظار استكمال البيانات",
  approved: "تمت الموافقة",
  completed: "مكتمل",
  rejected: "مرفوض",
};

export function getExternalTransferCountry(code: string): ExternalTransferCountry | undefined {
  return EXTERNAL_TRANSFER_COUNTRIES.find((country) => country.code === code);
}

export function getExternalTransferTotalEgp(egpEquivalent: string | number, feeEgp: string | number): number {
  return Math.round((Number(egpEquivalent) + Number(feeEgp)) * 100) / 100;
}
