import { z } from "zod";
import { normalizeTelegramUsername } from "./customer-support";
import { isDateOnlyNotFuture } from "./date-only";
import { normalizeEgyptianNationalId } from "./national-id";
import { emailAddressSchema, governorateSchema, registrationSchema, normalizePhoneNumber, phoneNumberSchema } from "./registration";

export type PhoneVerificationContacts = {
  email: string;
  telegramUsername: string;
};

export const EMPTY_PHONE_VERIFICATION_CONTACTS: PhoneVerificationContacts = {
  email: "",
  telegramUsername: "",
};

const optionalContactEmail = z
  .string()
  .trim()
  .max(320, "البريد الإلكتروني أطول من المسموح")
  .refine((value) => value === "" || z.string().email().safeParse(value).success, "أدخل بريدًا صحيحًا أو اترك الحقل فارغًا")
  .transform((value) => value.toLowerCase());

const optionalTelegramUsername = z
  .string()
  .trim()
  .max(320, "اسم مستخدم Telegram أطول من المسموح")
  .transform(normalizeTelegramUsername)
  .refine((value) => value !== null, "أدخل اسم مستخدم Telegram صحيحًا أو اترك الحقل فارغًا")
  .transform((value) => value ?? "");

export const phoneVerificationContactsSchema = z.object({
  email: optionalContactEmail,
  telegramUsername: optionalTelegramUsername,
}).strict();

export function parseStoredPhoneVerificationContacts(value: string | null | undefined): PhoneVerificationContacts {
  if (!value) return { ...EMPTY_PHONE_VERIFICATION_CONTACTS };
  try {
    const parsed: unknown = JSON.parse(value);
    const result = phoneVerificationContactsSchema.safeParse(parsed);
    return result.success ? result.data : { ...EMPTY_PHONE_VERIFICATION_CONTACTS };
  } catch {
    return { ...EMPTY_PHONE_VERIFICATION_CONTACTS };
  }
}

export function buildPhoneVerificationTelegramUrl(value: string): string | null {
  const username = normalizeTelegramUsername(value);
  return username ? `https://t.me/${username}` : null;
}

export function buildPhoneVerificationEmailUrl(
  email: string,
  details: { customerId?: string | null; name?: string | null; phoneNumber?: string | null },
): string | null {
  const parsed = optionalContactEmail.safeParse(email);
  if (!parsed.success || !parsed.data) return null;
  const customerId = details.customerId?.replace(/[^0-9]/g, "").slice(0, 10) || "غير متوفر";
  const name = details.name?.trim().slice(0, 120) || "غير متوفر";
  const phone = details.phoneNumber?.trim().slice(0, 20) || "غير متوفر";
  const subject = "طلب توثيق رقم الهاتف - Flotex EGP";
  const body = [
    `رقم العميل: ${customerId}`,
    `الاسم المسجل: ${name}`,
    `رقم الهاتف المطلوب توثيقه: ${phone}`,
    "أرجو مراجعة طلب توثيق رقم الهاتف والتحقق من ملكيته.",
  ].join("\n");
  return `mailto:${parsed.data}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const phoneVerificationRequestInputSchema = z.object({
  message: z.string().trim().max(500, "الملاحظة أطول من المسموح").default(""),
}).strict();

export const phoneVerificationSearchSchema = z.object({
  search: z.string().trim().max(100).default(""),
}).strict();

export const adminCustomerProfileSchema = z.object({
  userId: z.number().int().positive(),
  fullName: z.string().trim().min(3).max(120).optional(),
  givenName: registrationSchema.shape.givenName.optional(),
  fatherName: registrationSchema.shape.fatherName.optional(),
  phoneNumber: registrationSchema.shape.phoneNumber.optional(),
  email: emailAddressSchema.optional(),
  birthDate: z.string().refine(isDateOnlyNotFuture, "اختر تاريخ ميلاد صحيحًا لا يتجاوز اليوم").optional(),
  governorate: governorateSchema.optional(),
  nationalId: z.string().trim().max(32).transform(normalizeEgyptianNationalId)
    .pipe(z.string().regex(/^\d{14}$/, "الرقم القومي المصري يجب أن يتكون من 14 رقمًا")).optional(),
}).strict().superRefine((input, context) => {
  const fields = [input.fullName, input.givenName, input.fatherName, input.phoneNumber, input.email, input.birthDate, input.governorate, input.nationalId];
  if (fields.every((value) => value === undefined)) {
    context.addIssue({ code: "custom", path: [], message: "اختر بيانًا واحدًا على الأقل لتعديله" });
  }
});

export const phoneVerificationReviewSchema = z.object({
  requestId: z.number().int().positive(),
  status: z.enum(["approved", "rejected"]),
  ownershipConfirmed: z.boolean().default(false),
  note: z.string().trim().max(500).default(""),
}).strict().superRefine((input, context) => {
  if (input.status === "approved" && !input.ownershipConfirmed) {
    context.addIssue({ code: "custom", path: ["ownershipConfirmed"], message: "أكد مراجعة ملكية الرقم قبل التوثيق" });
  }
  if (input.status === "rejected" && input.note.length < 3) {
    context.addIssue({ code: "custom", path: ["note"], message: "اذكر سببًا واضحًا لرفض طلب التوثيق" });
  }
});

export function isPhoneVerified(value: Date | string | null | undefined): boolean {
  return value !== null && value !== undefined && value !== "";
}

export function canUserEditPhone(value: Date | string | null | undefined): boolean {
  return !isPhoneVerified(value);
}

export function phoneRequestMatchesCurrentNumber(
  request: { phoneNormalized?: string | null } | null | undefined,
  currentPhone: string | null | undefined,
): boolean {
  if (!request?.phoneNormalized || !currentPhone) return false;
  return request.phoneNormalized === normalizePhoneNumber(currentPhone);
}

export { phoneNumberSchema };
