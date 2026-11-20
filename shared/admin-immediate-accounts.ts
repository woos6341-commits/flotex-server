import { z } from "zod";
import { isDateOnlyNotFuture } from "./date-only";
import { emailAddressSchema, governorateSchema, passwordSchema, phoneNumberSchema } from "./registration";

export const adminImmediateCreateSchema = z.object({
  name: z.string().trim().transform(value => value.replace(/\s+/g, " ")).pipe(
    z.string().min(2, "أدخل الاسم بالكامل").max(120).regex(/^[\p{L}\p{M} '\-]+$/u, "استخدم حروفًا صحيحة في الاسم")
      .refine(value => value.split(/\s+/).length >= 2, "أدخل اسمين على الأقل")
      .refine(value => value.split(" ")[0].length <= 100 && value.split(" ").slice(1).join(" ").length <= 100, "أحد أجزاء الاسم أطول من المسموح")),
  email: emailAddressSchema,
  phoneNumber: phoneNumberSchema,
  birthDate: z.string().refine(isDateOnlyNotFuture, "اختر تاريخ ميلاد صحيحًا لا يتجاوز اليوم"),
  governorate: governorateSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).strict().refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "كلمتا المرور غير متطابقتين" });

export const adminImmediatePasswordSchema = z.object({
  challengeToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: passwordSchema,
  confirmPassword: z.string(),
}).strict().refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "كلمتا المرور غير متطابقتين" });

export type AdminImmediateCreateInput = z.input<typeof adminImmediateCreateSchema>;
export type AdminImmediateState = "unused" | "first_login" | "password_changed";
export type AdminImmediateAccountView = {
  id: string; customerId: string; name: string; email: string; phoneNumber: string;
  createdByName: string; createdAt: Date | string; firstLoginAt: Date | string | null;
  passwordChangedAt: Date | string | null; state: AdminImmediateState;
};
export function adminImmediateState(firstLoginAt: Date | string | null, passwordChangedAt: Date | string | null): AdminImmediateState {
  return passwordChangedAt ? "password_changed" : firstLoginAt ? "first_login" : "unused";
}
export const adminImmediateStateLabel: Record<AdminImmediateState, string> = {
  unused: "لم يُستخدم", first_login: "أول دخول", password_changed: "تغيرت كلمة المرور",
};
