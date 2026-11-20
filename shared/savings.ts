import { z } from "zod";
import { formatMoneyMinorUnits, parseMoneyMinorUnits, tryParseMoneyMinorUnits } from "./transactions";

export const SAVINGS_FREQUENCIES = ["daily", "monthly", "yearly"] as const;
export type SavingsFrequency = (typeof SAVINGS_FREQUENCIES)[number];
export const savingsFrequencySchema = z.enum(SAVINGS_FREQUENCIES);

/** Rates are percentages. The ppm value is the same rate as a fraction of one. */
export const SAVINGS_PRODUCTS: Record<SavingsFrequency, {
  label: string;
  ratePercent: string;
  ratePpm: number;
  periodLabel: string;
  maturityLabel: string;
}> = {
  daily: {
    label: "يومي",
    ratePercent: "0.0548",
    ratePpm: 548,
    periodLabel: "كل 24 ساعة كاملة من تاريخ بدء الإدخار",
    maturityLabel: "تستحق أول دفعة بعد مرور 24 ساعة كاملة، ثم مرة كل 24 ساعة.",
  },
  monthly: {
    label: "شهري",
    ratePercent: "1.6667",
    ratePpm: 16_667,
    periodLabel: "كل شهر كامل من تاريخ بدء الإدخار",
    maturityLabel: "تستحق أول دفعة بعد مرور شهر كامل، ثم مرة كل شهر.",
  },
  yearly: {
    label: "سنوي",
    ratePercent: "20.0000",
    ratePpm: 200_000,
    periodLabel: "كل 12 شهرًا كاملة من تاريخ بدء الإدخار",
    maturityLabel: "تستحق أول دفعة بعد مرور 12 شهرًا كاملة، ثم مرة كل 12 شهرًا.",
  },
};

export const savingsAmountSchema = z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "أدخل مبلغًا صحيحًا بالجنيه المصري");
export const savingsClientOperationIdSchema = z.string().trim().min(12).max(80);

export function getSavingsProduct(frequency: SavingsFrequency) {
  return SAVINGS_PRODUCTS[frequency];
}

export function calculateExpectedInterest(amount: string, frequency: SavingsFrequency): string {
  return calculateExpectedInterestAtRate(amount, getSavingsProduct(frequency).ratePpm);
}

export function calculateExpectedInterestAtRate(amount: string, ratePpm: number): string {
  const principal = Number(amount);
  if (!Number.isFinite(principal) || principal <= 0) return "0.0000";
  if (!Number.isFinite(ratePpm) || ratePpm < 0) return "0.0000";
  return (principal * ratePpm / 1_000_000).toFixed(4);
}

export function roundInterestToWallet(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "0.00";
  return formatMoneyMinorUnits(Math.round(value * 100));
}

/** Display expected savings interest with the same wallet-cent rounding, without trailing zeroes. */
export function formatExpectedSavingsInterest(amount: string): string {
  return roundInterestToWallet(amount).replace(/\.?0+$/, "");
}

export function addSavingsPeriod(date: Date, frequency: SavingsFrequency, anchorDate = date): Date {
  const result = new Date(date.getTime());
  if (frequency === "daily") {
    result.setUTCDate(result.getUTCDate() + 1);
  } else if (frequency === "monthly") {
    const day = anchorDate.getUTCDate();
    const targetMonth = result.getUTCMonth() + 1;
    result.setUTCDate(1);
    result.setUTCMonth(targetMonth);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDay));
  } else {
    const day = anchorDate.getUTCDate();
    const month = anchorDate.getUTCMonth();
    const targetYear = result.getUTCFullYear() + 1;
    result.setUTCDate(1);
    result.setUTCFullYear(targetYear);
    result.setUTCMonth(month);
    const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDay));
  }
  return result;
}

export function getNextSavingsPayoutAt(periodStart: Date, frequency: SavingsFrequency, anchorDate = periodStart): Date {
  return addSavingsPeriod(periodStart, frequency, anchorDate);
}

/** Refund eligibility is always 48 hours after the submitted request for every plan. */
export function addSavingsRefundPeriod(date: Date, _frequency: SavingsFrequency): Date {
  const result = new Date(date.getTime());
  result.setUTCHours(result.getUTCHours() + 48);
  return result;
}

export function savingsPeriodKey(frequency: SavingsFrequency, periodStart: Date): string {
  const date = periodStart.toISOString();
  if (frequency === "daily") return `daily:${date.slice(0, 10)}`;
  if (frequency === "monthly") return `monthly:${date.slice(0, 7)}`;
  return `yearly:${date.slice(0, 4)}`;
}

export function getSavingsPayoutCountdown(nextPayoutAt: Date | string | null | undefined, now = Date.now()) {
  const dueAt = nextPayoutAt instanceof Date ? nextPayoutAt.getTime() : nextPayoutAt ? new Date(nextPayoutAt).getTime() : Number.NaN;
  if (!Number.isFinite(dueAt)) return { isDue: false, remainingMs: null as number | null };
  const remainingMs = Math.max(0, dueAt - now);
  return { isDue: remainingMs === 0, remainingMs };
}

export const SAVINGS_AUTO_PAYOUT_GRACE_MS = 5 * 60 * 1000;

export function isSavingsAutoPayoutDue(nextPayoutAt: Date | string | null | undefined, now = Date.now()): boolean {
  const payoutAt = nextPayoutAt instanceof Date ? nextPayoutAt.getTime() : nextPayoutAt ? new Date(nextPayoutAt).getTime() : Number.NaN;
  return Number.isFinite(payoutAt) && now >= payoutAt + SAVINGS_AUTO_PAYOUT_GRACE_MS;
}

export function getSavingsReservationReleaseAmount(principalAmount: string, feeAmount: string, reservedAmount: string): string {
  const principal = parseMoneyMinorUnits(principalAmount);
  const fullReservation = principal + parseMoneyMinorUnits(feeAmount);
  const reserved = parseMoneyMinorUnits(reservedAmount);
  if (principal <= 0 || reserved < principal) throw new Error("تعذر تحرير مبلغ الإدخار المحجوز");
  return formatMoneyMinorUnits(reserved >= fullReservation ? fullReservation : principal);
}

export function formatSavingsCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "حان موعد الاستحقاق";
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    days > 0 ? `${days} يوم` : "",
    `${hours} ساعة`,
    `${minutes} دقيقة`,
    `${seconds} ثانية`,
  ].filter(Boolean);
  return parts.join(" و ");
}

/** Returns the additional wallet balance needed for the minimum principal plus its fee. */
export function getSavingsMinimumFundingShortfallMinor(minimumAmount: string, feeAmount: string, availableAmount: string | null): number | null {
  const minimum = tryParseMoneyMinorUnits(minimumAmount);
  const fee = tryParseMoneyMinorUnits(feeAmount);
  const available = availableAmount === null ? null : tryParseMoneyMinorUnits(availableAmount);
  if (minimum === null || fee === null || available === null) return null;
  return Math.max(0, minimum + fee - available);
}

export function validateSavingsAmount(amount: string, minimumAmount = "0.00"): string {
  const minor = parseMoneyMinorUnits(amount);
  if (minor <= 0) throw new Error("يجب أن يكون مبلغ الإدخار أكبر من صفر");
  if (minor < parseMoneyMinorUnits(minimumAmount)) throw new Error(`الحد الأدنى للإدخار هو ${formatMoneyMinorUnits(parseMoneyMinorUnits(minimumAmount))} جنيه`);
  return formatMoneyMinorUnits(minor);
}
