import { z } from "zod";

export const CONTACT_BUTTON_TYPES = ["whatsapp", "telegram", "custom"] as const;
export const contactButtonTypeSchema = z.enum(CONTACT_BUTTON_TYPES);
export type ContactButtonType = z.infer<typeof contactButtonTypeSchema>;

export const contactButtonInputSchema = z.object({
  type: contactButtonTypeSchema,
  name: z.string().trim().min(2, "أدخل اسمًا واضحًا للزر").max(48),
  target: z.string().trim().min(3).max(500),
  visible: z.boolean(),
});

export const contactButtonSchema = contactButtonInputSchema.extend({
  id: z.string().regex(/^contact_[a-f0-9]{12}$/),
  sortOrder: z.number().int().min(0).max(9999),
});
export type ContactButton = z.infer<typeof contactButtonSchema>;

const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com", "chat.whatsapp.com", "web.whatsapp.com"]);
const TELEGRAM_HOSTS = new Set(["t.me", "telegram.me"]);

function parseHttpsLink(value: string, allowedHosts?: Set<string>): URL {
  const input = value.trim();
  if (!input || /[\u0000-\u0020\\]/.test(input)) throw new Error("تحقق من الرابط وأزل المسافات داخله.");
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input) && !/^https:\/\//i.test(input)) {
    throw new Error("الروابط الآمنة HTTPS فقط مسموحة.");
  }
  const url = new URL(/^https:\/\//i.test(input) ? input : `https://${input}`);
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new Error("أدخل رابط HTTPS صالحًا دون بيانات دخول.");
  }
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (allowedHosts && !allowedHosts.has(hostname)) throw new Error("استخدم رابطًا رسميًا صالحًا لهذه الخدمة.");
  if (!allowedHosts && (!hostname.includes(".") || hostname === "localhost")) {
    throw new Error("أدخل رابطًا عامًا صالحًا يبدأ بـ HTTPS.");
  }
  return url;
}

export function normalizeContactButtonTarget(type: ContactButtonType, value: string): string {
  const input = value.trim();
  if (input.length < 3 || input.length > 500) throw new Error("أدخل رقمًا أو رابطًا صالحًا.");

  if (type === "whatsapp") {
    if (/^[+\d\s().-]+$/.test(input)) {
      let digits = input.replace(/\D/g, "");
      if (digits.startsWith("00")) digits = digits.slice(2);
      if (digits.length === 10 || digits.length === 11) {
        if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
      }
      if (digits.length < 8 || digits.length > 15) throw new Error("أدخل رقم واتساب دوليًا صحيحًا أو رابط محادثة.");
      return `https://wa.me/${digits}`;
    }
    const url = parseHttpsLink(input, WHATSAPP_HOSTS);
    if (url.pathname === "/") throw new Error("أدخل رابط محادثة واتساب كاملًا.");
    return url.toString();
  }

  if (type === "telegram") {
    if (/^@?[A-Za-z0-9_]{5,32}$/.test(input)) {
      return `https://t.me/${input.replace(/^@/, "")}`;
    }
    const url = parseHttpsLink(input, TELEGRAM_HOSTS);
    if (url.pathname === "/") throw new Error("أدخل رابط حساب أو محادثة تليجرام كاملًا.");
    return url.toString();
  }

  return parseHttpsLink(input).toString();
}
