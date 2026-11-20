import { z } from "zod";
import { formatMoneyMinorUnits, parseMoneyMinorUnits } from "./transactions";

export const SAVINGS_SETTINGS_DEFAULTS = {
  minimumAmount: "1000.00",
  feeAmount: "1.00",
  dailyRatePercent: "0.0548",
  monthlyRatePercent: "1.6667",
  yearlyRatePercent: "20.0000",
} as const;

const rate = z.string().trim().regex(/^\d+(?:\.\d{1,4})?$/, "أدخل نسبة صحيحة حتى 4 منازل عشرية").refine((value) => Number(value) <= 100, "النسبة لا يمكن أن تتجاوز 100%");
const fee = z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "أدخل رسومًا صحيحة حتى منزلتين عشريتين").refine((value) => parseMoneyMinorUnits(value) >= 0, "الرسوم لا يمكن أن تكون سالبة");

export const savingsSettingsInputSchema = z.object({
  minimumAmount: z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "أدخل الحد الأدنى بصيغة صحيحة حتى منزلتين عشريتين").refine((value) => parseMoneyMinorUnits(value) >= 1000_00, "الحد الأدنى للإدخار لا يمكن أن يقل عن 1000 جنيه"),
  feeAmount: fee,
  dailyRatePercent: rate,
  monthlyRatePercent: rate,
  yearlyRatePercent: rate,
}).strict();

export type SavingsSettings = z.infer<typeof savingsSettingsInputSchema> & {
  updatedBy: number | null;
  updatedAt: Date;
};

export function ratePercentToPpm(value: string): number {
  return Math.round(Number(value) * 10_000);
}

export function normalizeSavingsSettings(input: z.input<typeof savingsSettingsInputSchema>) {
  const parsed = savingsSettingsInputSchema.parse(input);
  return {
    minimumAmount: formatMoneyMinorUnits(parseMoneyMinorUnits(parsed.minimumAmount)),
    feeAmount: formatMoneyMinorUnits(parseMoneyMinorUnits(parsed.feeAmount)),
    dailyRatePercent: Number(parsed.dailyRatePercent).toFixed(4),
    monthlyRatePercent: Number(parsed.monthlyRatePercent).toFixed(4),
    yearlyRatePercent: Number(parsed.yearlyRatePercent).toFixed(4),
  };
}
