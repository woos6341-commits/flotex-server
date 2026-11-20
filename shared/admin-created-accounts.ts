import { z } from "zod";
import { emailAddressSchema, passwordSchema, phoneNumberSchema } from "./registration";

export const adminCreatedAccountCreateSchema = z.object({
  name: z.string().trim().transform(value => value.replace(/\s+/g, " ")).pipe(
    z.string().min(2, "أدخل الاسم الكامل").max(120).regex(/^[\p{L}\p{M} '\-]+$/u, "استخدم حروفًا صحيحة في الاسم")),
  email: emailAddressSchema,
  phoneNumber: phoneNumberSchema.optional(),
}).strict();

export const adminCreatedAccountIdSchema = z.object({ id: z.string().uuid() }).strict();
/** This is a reference to an offline case record, never the identity document or national ID itself. */
export const adminCreatedIdentitySchema = adminCreatedAccountIdSchema.extend({
  evidenceRef: z.string().trim().min(4).max(120).regex(/^[a-zA-Z0-9_\-/]+$/, "استخدم مرجع ملف المراجعة فقط، دون بيانات شخصية").refine(value => !/\d{10,}/.test(value), "لا تضع رقم هوية أو هاتف في المرجع"),
}).strict();
export const adminCreatedSuspendSchema = adminCreatedAccountIdSchema.extend({
  suspended: z.boolean(), reason: z.string().trim().min(3).max(250),
}).strict();
export const adminCreatedClaimSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: passwordSchema,
  confirmPassword: z.string(),
}).strict().refine(x => x.password === x.confirmPassword, { path: ["confirmPassword"], message: "كلمتا المرور غير متطابقتين" });

export type AdminCreatedAccountCreateInput = z.input<typeof adminCreatedAccountCreateSchema>;
export type AdminCreatedAccountState = "draft" | "verification_required" | "active" | "suspended";
export type AdminCreatedAccountView = {
  id: string; name: string; email: string; phoneNumber: string | null;
  state: AdminCreatedAccountState; createdByName: string; createdAt: Date | string;
  identityEvidenceRef: string | null; identityReviewedByName: string | null;
  identityReviewedAt: Date | string | null; emailVerifiedAt: Date | string | null;
  customerId: string | null;
};
export const adminCreatedAccountStateLabel: Record<AdminCreatedAccountState, string> = {
  draft: "قيد الإنشاء", verification_required: "يحتاج إلى التحقق", active: "نشط", suspended: "موقوف",
};
