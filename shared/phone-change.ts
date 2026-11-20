import { z } from "zod";
import { phoneNumberSchema, normalizePhoneNumber } from "./registration";

export const phoneChangeImageSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png"]),
  data: z.string().min(16).max(2_800_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();

export const phoneChangeRequestInputSchema = z.object({
  newPhoneNumber: phoneNumberSchema,
  idFront: phoneChangeImageSchema,
  idBack: phoneChangeImageSchema,
  selfie: phoneChangeImageSchema,
  walletProfile: phoneChangeImageSchema,
}).strict();

export type PhoneChangeRequestInput = z.infer<typeof phoneChangeRequestInputSchema>;
export { normalizePhoneNumber };
