import { z } from "zod";
import { isDateOnlyNotFuture } from "./date-only";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhoneNumber(value: string): string {
  let phone = value
    .trim()
    .replace(/[٠-٩]/g, (char) => String(char.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (char) => String(char.charCodeAt(0) - 0x06f0))
    .replace(/[\s()\-]/g, "");
  if (/^\+?201[0125]\d{8}$/.test(phone)) phone = `0${phone.replace(/^\+?20/, "")}`;
  return phone;
}

const personName = z.string().transform(normalizeName).pipe(
  z.string().min(2, "أدخل الاسم من حرفين على الأقل").max(100, "الاسم أطول من المسموح").regex(/^[\p{L}\p{M} '\-]+$/u, "استخدم حروفًا صحيحة في الاسم"),
);

export const EGYPTIAN_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "البحيرة", "مطروح", "دمياط", "الدقهلية", "كفر الشيخ", "الغربية", "المنوفية", "الشرقية", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "بني سويف", "الفيوم", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد",
] as const;

export const governorateSchema = z.enum(EGYPTIAN_GOVERNORATES, { message: "اختر محافظة صحيحة من القائمة" });
export const securityPinSchema = z.string().regex(/^\d{4}$/, "رمز الأمان يجب أن يتكون من 4 أرقام");
export const emailAddressSchema = z.string().trim().max(320, "البريد الإلكتروني أطول من المسموح").email("أدخل بريدًا إلكترونيًا صحيحًا").transform(normalizeEmail);
export const passwordSchema = z.string().min(12, "كلمة المرور يجب ألا تقل عن 12 حرفًا").max(128, "كلمة المرور أطول من المسموح");
export const phoneNumberSchema = z.string().transform(normalizePhoneNumber).pipe(z.string().refine((value) => /^01[0125]\d{8}$/.test(value) || /^\+[1-9]\d{7,14}$/.test(value), "أدخل رقم هاتف صحيحًا، مثل 01012345678 أو رقم دولي يبدأ بـ +"));

const registrationFields = z.object({
  fullName: personName,
  email: emailAddressSchema,
  phoneNumber: phoneNumberSchema,
  birthDate: z.string().refine(isDateOnlyNotFuture, "اختر تاريخ ميلاد صحيحًا لا يتجاوز اليوم"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "أكد كلمة المرور"),
  governorate: governorateSchema.optional(),
  securityPin: securityPinSchema.optional(),
});

const registrationDetailsFields = z.object({
  fullName: personName,
  email: emailAddressSchema,
  phoneNumber: phoneNumberSchema,
  birthDate: z.string().refine(isDateOnlyNotFuture, "اختر تاريخ ميلاد صحيحًا لا يتجاوز اليوم"),
  governorate: governorateSchema,
}).strict();

function validateRegistration(input: z.infer<typeof registrationFields>, ctx: z.RefinementCtx) {
  if (input.fullName.trim().split(/\s+/).length < 2) ctx.addIssue({ code: "custom", path: ["fullName"], message: "أدخل الاسم الكامل بذكر اسمين على الأقل" });
  if (input.password !== input.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "كلمتا المرور غير متطابقتين" });
}

function validateRegistrationDetails(input: z.infer<typeof registrationDetailsFields>, ctx: z.RefinementCtx) {
  if (input.fullName.trim().split(/\s+/).length < 2) ctx.addIssue({ code: "custom", path: ["fullName"], message: "أدخل الاسم الكامل بذكر اسمين على الأقل" });
}

/** Optional new fields preserve direct compatibility for legacy internal callers; the public route uses completeManualRegistrationSchema. */
export const registrationDetailsSchema = registrationDetailsFields.superRefine(validateRegistrationDetails);
export const manualRegistrationSchema = registrationFields.strict().superRefine(validateRegistration);
export const completeManualRegistrationSchema = registrationFields.extend({ governorate: governorateSchema, securityPin: securityPinSchema }).strict().superRefine(validateRegistration);
export type ManualRegistrationInput = z.input<typeof manualRegistrationSchema>;
export type ParsedManualRegistration = z.output<typeof manualRegistrationSchema>;
export type CompleteManualRegistrationInput = z.input<typeof completeManualRegistrationSchema>;
export type ParsedCompleteManualRegistration = z.output<typeof completeManualRegistrationSchema>;

export const loginSchema = z.object({ email: emailAddressSchema, password: passwordSchema }).strict();
export const otpCodeSchema = z.string().regex(/^\d{6}$/, "أدخل رمزًا مكوّنًا من 6 أرقام");

/** Legacy profile completion remains available for existing accounts without complete profiles. */
export const registrationSchema = z.object({
  givenName: personName,
  fatherName: personName,
  phoneNumber: phoneNumberSchema,
  birthDate: z.string().refine(isDateOnlyNotFuture, "اختر تاريخ ميلاد صحيحًا لا يتجاوز اليوم"),
  governorate: governorateSchema.optional(),
}).strict();
export type RegistrationInput = z.input<typeof registrationSchema>;

export function needsProfileCompletion(user: { profileCompletedAt?: Date | string | null } | null | undefined): boolean {
  return Boolean(user && !user.profileCompletedAt);
}
