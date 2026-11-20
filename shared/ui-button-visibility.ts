export const UI_BUTTONS = {
  home: [
    { id: "deposit", label: "إيداع" },
    { id: "transfer", label: "تحويل" },
    { id: "externalTransfers", label: "معاملات خارجية" },
    { id: "withdrawal", label: "سحب" },
    { id: "savings", label: "الإدخار" },
    { id: "gameTopup", label: "شحن ألعاب" },
    { id: "coin", label: "كوين فولتكس" },
    { id: "transactions", label: "سجل المعاملات" },
    { id: "paymentMethods", label: "وسائل الدفع" },
    { id: "verifyAccount", label: "توثيق الحساب" },
    { id: "support", label: "فتح دردشة خدمة العملاء" },
    { id: "refreshPortfolio", label: "إعادة محاولة تحديث الرصيد" },
    { id: "viewActivity", label: "عرض جميع النشاطات" },
  ],
  wallet: [
    { id: "deposit", label: "الإيداع" },
    { id: "transfer", label: "إرسال الأموال" },
    { id: "externalTransfers", label: "المعاملات الخارجية" },
    { id: "withdrawal", label: "السحب" },
    { id: "savings", label: "الادخار" },
    { id: "transactions", label: "سجل المعاملات" },
    { id: "support", label: "فتح دردشة خدمة العملاء" },
    { id: "viewActivity", label: "عرض السجل الكامل" },
  ],
} as const;
export type UiSurface = keyof typeof UI_BUTTONS;
export type UiButtonId = (typeof UI_BUTTONS)[UiSurface][number]["id"];
export type UiButtonOverrideMode = "inherit" | "visible" | "hidden";
export type EffectiveUiButtonConfig = Partial<Record<UiSurface, Record<string, { visible: boolean }>>> & { homeActionOrder?: string[] };
export function isUiSurface(value: string): value is UiSurface {
  return value === "home" || value === "wallet";
}
export function isUiButtonId(surface: UiSurface, buttonId: string): boolean {
  return (UI_BUTTONS[surface] as readonly { id: string; label: string }[]).some((button) => button.id === buttonId);
}
export function resolveUiButtonVisibility(globalVisible: boolean, override: UiButtonOverrideMode): boolean {
  if (override === "visible") return true;
  if (override === "hidden") return false;
  return globalVisible;
}
export function isUiButtonVisible(config: EffectiveUiButtonConfig | undefined, surface: UiSurface, buttonId: string): boolean {
  return config?.[surface]?.[buttonId]?.visible ?? true;
}
export function formatEgyptDateTime(value: string | Date | null | undefined, fallback = "لم يسجل أي نشاط بعد"): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
