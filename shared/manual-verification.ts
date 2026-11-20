import { z } from "zod";
import { emailAddressSchema, otpCodeSchema, phoneNumberSchema } from "./registration";

export const manualVerificationPurpose = z.enum(["register", "password_reset"]);
export const issueManualVerificationSchema = z.object({
  email: emailAddressSchema,
  purpose: manualVerificationPurpose,
  phoneNumber: phoneNumberSchema.optional(),
  validityMinutes: z.number().int().min(1).max(15),
  maxAttempts: z.number().int().min(1).max(5),
  ownershipConfirmed: z.literal(true),
  ownershipMethod: z.enum(["in_person", "approved_review"]),
  ownershipCaseRef: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{2,79}$/, "أدخل مرجع قضية المراجعة فقط، دون بيانات سرية."),
}).strict().superRefine((input, ctx) => {
  if (input.purpose === "register" && !input.phoneNumber) ctx.addIssue({ code: "custom", path: ["phoneNumber"], message: "رقم الهاتف مطلوب للتسجيل." });
  if (input.purpose !== "register" && input.phoneNumber) ctx.addIssue({ code: "custom", path: ["phoneNumber"], message: "رقم الهاتف مخصص للتسجيل فقط." });
});
export const redeemManualVerificationSchema = z.object({
  /** id remains optional for compatibility; the user-facing flow redeems by email, purpose and code only. */
  id: z.string().uuid().optional(), email: emailAddressSchema, purpose: manualVerificationPurpose, code: otpCodeSchema,
}).strict();
export const revokeManualVerificationSchema = z.object({ id: z.string().uuid() }).strict();
export type IssueManualVerificationInput = z.input<typeof issueManualVerificationSchema>;
