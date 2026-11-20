import { z } from "zod";

export type SupportOperation = "deposit" | "withdrawal" | "general";
export const supportLinkIcons = ["link-outline", "logo-whatsapp", "paper-plane-outline", "call-outline", "mail-outline"] as const;
export type CustomerSupportLink = { id: string; label: string; url: string; icon: (typeof supportLinkIcons)[number]; enabled: boolean };
export type CustomerSupportSettings = { email: string; telegramUsername: string; links: CustomerSupportLink[] };

export const EMPTY_CUSTOMER_SUPPORT_SETTINGS: CustomerSupportSettings = {
  email: "",
  telegramUsername: "",
  links: [],
};

export function normalizeTelegramUsername(input: string): string | null {
  const raw = input.trim();
  if (!raw) return "";

  let username = raw;
  if (raw.includes("://") || /^t\.me\//i.test(raw)) {
    const candidate = raw.includes("://") ? raw : `https://${raw}`;
    try {
      const url = new URL(candidate);
      if (
        url.protocol !== "https:" ||
        url.hostname.toLowerCase() !== "t.me" ||
        url.username ||
        url.password ||
        url.port ||
        url.search ||
        url.hash
      ) return null;
      const match = url.pathname.match(/^\/([A-Za-z0-9_]{5,32})\/?$/);
      if (!match) return null;
      username = match[1];
    } catch {
      return null;
    }
  } else if (raw.startsWith("@")) {
    username = raw.slice(1);
  }

  return /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : null;
}

const emailShape = z.string().trim().max(320).email();
const customerSupportEmailSchema = z
  .string()
  .trim()
  .max(320, "البريد الإلكتروني أطول من المسموح")
  .refine((value) => value === "" || emailShape.safeParse(value).success, "أدخل بريدًا إلكترونيًا صحيحًا أو اترك الحقل فارغًا")
  .transform((value) => value.toLowerCase());

const customerSupportTelegramSchema = z
  .string()
  .trim()
  .max(320, "اسم المستخدم أو الرابط أطول من المسموح")
  .transform(normalizeTelegramUsername)
  .refine((value) => value !== null, "أدخل اسم مستخدم من 5 إلى 32 حرفًا/رقمًا/شرطة سفلية أو رابطًا صحيحًا من t.me")
  .transform((value) => value ?? "");

const safeSupportUrlSchema = z.string().trim().max(600).refine((value) => {
  if (!value) return false;
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    } catch { return false; }
  }
  if (/^mailto:/i.test(value)) return /^mailto:[^\s@?]+@[^\s@?]+\.[^\s@?]+$/i.test(value);
  if (/^tel:/i.test(value)) return /^tel:\+?[0-9 ()-]{6,24}$/i.test(value);
  return false;
}, "استخدم رابط HTTPS صحيحًا أو mailto: أو tel: فقط");

const customerSupportLinkSchema = z.object({
  id: z.string().trim().regex(/^link_[a-z0-9_]{4,32}$/),
  label: z.string().trim().min(2).max(48),
  url: safeSupportUrlSchema,
  icon: z.enum(supportLinkIcons),
  enabled: z.boolean(),
});

export const customerSupportSettingsSchema = z.object({
  email: customerSupportEmailSchema,
  telegramUsername: customerSupportTelegramSchema,
  links: z.array(customerSupportLinkSchema).max(12).default([]),
}).strict();

export function parseStoredCustomerSupportSettings(value: string | null | undefined): CustomerSupportSettings {
  if (!value) return { ...EMPTY_CUSTOMER_SUPPORT_SETTINGS };
  try {
    const parsed: unknown = JSON.parse(value);
    const result = customerSupportSettingsSchema.safeParse(parsed);
    return result.success ? result.data : { ...EMPTY_CUSTOMER_SUPPORT_SETTINGS };
  } catch {
    return { ...EMPTY_CUSTOMER_SUPPORT_SETTINGS };
  }
}

const operationLabels: Record<SupportOperation, string> = {
  deposit: "إيداع",
  withdrawal: "سحب",
  general: "استفسار عام",
};

export function buildSupportEmailUri(
  email: string,
  details: { customerId?: string | null; operation: SupportOperation; requestId?: string | null },
): string | null {
  const parsedEmail = customerSupportEmailSchema.safeParse(email);
  if (!parsedEmail.success || !parsedEmail.data) return null;

  const customerId = details.customerId?.replace(/[^0-9]/g, "").slice(0, 10) || "غير متوفر";
  const requestId = details.requestId?.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || "غير متوفر";
  const operation = operationLabels[details.operation];
  const subject = `طلب دعم Flotex EGP - ${operation}`;
  const body = [
    `رقم العميل: ${customerId}`,
    `نوع العملية: ${operation}`,
    `رقم الطلب: ${requestId}`,
  ].join("\n");

  return `mailto:${parsedEmail.data}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildTelegramUrl(value: string): string | null {
  const username = normalizeTelegramUsername(value);
  return username ? `https://t.me/${username}` : null;
}
