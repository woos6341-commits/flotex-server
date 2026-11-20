import { z } from "zod";

export const PAYMENT_METHOD_FIELD_KINDS = ["text", "number", "phone", "reference", "note"] as const;
export type PaymentMethodFieldKind = (typeof PAYMENT_METHOD_FIELD_KINDS)[number];

export const paymentMethodFieldSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{0,23}$/, "معرّف الحقل غير صالح"),
  label: z.string().trim().min(2).max(48),
  kind: z.enum(PAYMENT_METHOD_FIELD_KINDS),
  required: z.boolean(),
  placeholder: z.string().trim().max(80).optional(),
  // Missing means visible, preserving configs saved before this option existed.
  enabled: z.boolean().optional(),
});

export const paymentMethodFieldsSchema = z.array(paymentMethodFieldSchema).max(8, "يمكن إضافة 8 حقول مخصصة كحد أقصى").superRefine((fields, context) => {
  const keys = new Set<string>();
  fields.forEach((field, index) => {
    if (keys.has(field.key)) context.addIssue({ code: "custom", path: [index, "key"], message: "معرّف الحقل مكرر" });
    keys.add(field.key);
  });
});

export type PaymentMethodField = z.infer<typeof paymentMethodFieldSchema>;

const reservedKeys = new Set(["amount", "sender_reference", "recipient_account", "receipt", "note"]);

export function validateMethodFields(value: unknown): PaymentMethodField[] {
  const fields = paymentMethodFieldsSchema.parse(value);
  if (fields.some((field) => reservedKeys.has(field.key))) throw new Error("معرّف الحقل محجوز لحقل مالي أساسي");
  return fields;
}

export function getVisiblePaymentMethodFields(rawFields: PaymentMethodField[] | null | undefined): PaymentMethodField[] {
  return validateMethodFields(rawFields ?? []).filter((field) => field.enabled !== false);
}

export function validateCustomFieldValues(rawFields: PaymentMethodField[] | null | undefined, values: unknown): Record<string, string> {
  // Older method records had no custom-field property. Missing means no custom fields,
  // not a malformed configured schema; the latter still fails closed.
  const fields = getVisiblePaymentMethodFields(rawFields);
  if (values === undefined || values === null) values = {};
  if (typeof values !== "object" || Array.isArray(values)) throw new Error("بيانات الحقول الإضافية غير صالحة");
  const supplied = values as Record<string, unknown>;
  const known = new Map(fields.map((field) => [field.key, field]));
  for (const key of Object.keys(supplied)) if (!known.has(key)) throw new Error("تتضمن البيانات حقلًا غير معتمد لهذه الوسيلة");
  const normalized: Record<string, string> = {};
  for (const field of fields) {
    const raw = supplied[field.key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !value) throw new Error(`الحقل «${field.label}» مطلوب`);
    if (value.length > 500) throw new Error(`الحقل «${field.label}» أطول من المسموح`);
    if (field.kind === "number" && value && !/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error(`أدخل قيمة رقمية صحيحة في «${field.label}»`);
    if (field.kind === "phone" && value && !/^[+\d][\d\s()\-]{5,24}$/.test(value)) throw new Error(`أدخل رقم هاتف صحيحًا في «${field.label}»`);
    normalized[field.key] = value;
  }
  if (JSON.stringify(normalized).length > 8_000) throw new Error("بيانات الحقول الإضافية أكبر من المسموح");
  return normalized;
}
