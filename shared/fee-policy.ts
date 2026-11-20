import { formatMoneyMinorUnits, parseMoneyMinorUnits } from "./transactions";

export type WithdrawalFeeTier = {
  id: string;
  minimumAmount: string;
  maximumAmount: string | null;
  feeAmount: string;
};

export type FeePolicy = {
  withdrawalEnabled: boolean;
  transferEnabled: boolean;
  transferFeeAmount: string;
  withdrawalTiers: WithdrawalFeeTier[];
};

export const DEFAULT_FEE_POLICY: FeePolicy = {
  withdrawalEnabled: true,
  transferEnabled: true,
  transferFeeAmount: "1.00",
  withdrawalTiers: [
    { id: "withdrawal-50-1000", minimumAmount: "50.00", maximumAmount: "1000.00", feeAmount: "5.00" },
    { id: "withdrawal-1000-1500", minimumAmount: "1000.01", maximumAmount: "1500.00", feeAmount: "10.00" },
    { id: "withdrawal-over-1500", minimumAmount: "1500.01", maximumAmount: null, feeAmount: "15.00" },
  ],
};

const MAX_TIERS = 20;
const MAX_MONEY_MINOR = 10 ** 14 - 1;

function normalizedMoney(value: unknown, field: string): string {
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`قيمة ${field} غير صالحة`);
  const text = String(value).trim();
  const minor = parseMoneyMinorUnits(text);
  if (minor > MAX_MONEY_MINOR) throw new Error(`قيمة ${field} تتجاوز الحد المسموح`);
  return formatMoneyMinorUnits(minor);
}

export function validateFeePolicy(input: unknown): FeePolicy {
  if (!input || typeof input !== "object") throw new Error("إعدادات الرسوم غير صالحة");
  const candidate = input as Record<string, unknown>;
  if (typeof candidate.withdrawalEnabled !== "boolean" || typeof candidate.transferEnabled !== "boolean") {
    throw new Error("حدد حالة رسوم السحب والإرسال");
  }
  const transferFeeAmount = normalizedMoney(candidate.transferFeeAmount, "رسوم الإرسال");
  if (!Array.isArray(candidate.withdrawalTiers) || candidate.withdrawalTiers.length > MAX_TIERS) {
    throw new Error(`عدد شرائح السحب يجب ألا يتجاوز ${MAX_TIERS}`);
  }

  const ids = new Set<string>();
  const withdrawalTiers = candidate.withdrawalTiers.map((raw, index): WithdrawalFeeTier => {
    if (!raw || typeof raw !== "object") throw new Error(`شريحة السحب رقم ${index + 1} غير صالحة`);
    const tier = raw as Record<string, unknown>;
    const id = typeof tier.id === "string" ? tier.id.trim() : "";
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id) || ids.has(id)) throw new Error("معرّفات شرائح الرسوم يجب أن تكون فريدة وصالحة");
    ids.add(id);
    const minimumAmount = normalizedMoney(tier.minimumAmount, "الحد الأدنى للشريحة");
    const maximumAmount = tier.maximumAmount === null || tier.maximumAmount === "" || tier.maximumAmount === undefined
      ? null
      : normalizedMoney(tier.maximumAmount, "الحد الأعلى للشريحة");
    const feeAmount = normalizedMoney(tier.feeAmount, "رسوم الشريحة");
    if (maximumAmount !== null && parseMoneyMinorUnits(maximumAmount) < parseMoneyMinorUnits(minimumAmount)) {
      throw new Error("الحد الأعلى للشريحة لا يجوز أن يكون أقل من حدها الأدنى");
    }
    return { id, minimumAmount, maximumAmount, feeAmount };
  }).sort((a, b) => parseMoneyMinorUnits(a.minimumAmount) - parseMoneyMinorUnits(b.minimumAmount));

  if (candidate.withdrawalEnabled && withdrawalTiers.length === 0) {
    throw new Error("أضف شريحة واحدة على الأقل أو عطّل رسوم السحب");
  }
  for (let index = 1; index < withdrawalTiers.length; index += 1) {
    const previous = withdrawalTiers[index - 1];
    const current = withdrawalTiers[index];
    if (previous.maximumAmount === null) throw new Error("الشريحة المفتوحة بلا حد أعلى يجب أن تكون الأخيرة");
    const previousMaximum = parseMoneyMinorUnits(previous.maximumAmount);
    const currentMinimum = parseMoneyMinorUnits(current.minimumAmount);
    if (currentMinimum <= previousMaximum) throw new Error("شرائح السحب متداخلة؛ عدّل الحدود حتى لا تتداخل");
    if (currentMinimum !== previousMaximum + 1) throw new Error("يجب أن تكون شرائح السحب متتابعة بلا فجوات مالية");
  }
  if (candidate.withdrawalEnabled && withdrawalTiers.length > 0 && withdrawalTiers[withdrawalTiers.length - 1].maximumAmount !== null) {
    throw new Error("يجب أن تبقى الشريحة الأخيرة مفتوحة لتغطية جميع مبالغ السحب الأعلى");
  }
  return {
    withdrawalEnabled: candidate.withdrawalEnabled,
    transferEnabled: candidate.transferEnabled,
    transferFeeAmount,
    withdrawalTiers,
  };
}

export function assertWithdrawalFeeCoverage(policy: FeePolicy, minimumWithdrawalAmount: string | number) {
  if (!policy.withdrawalEnabled) return;
  const firstTier = policy.withdrawalTiers[0];
  if (!firstTier || parseMoneyMinorUnits(firstTier.minimumAmount) > parseMoneyMinorUnits(String(minimumWithdrawalAmount))) {
    throw new Error("شرائح الرسوم لا تغطي الحد الأدنى للسحب؛ عدّل أول شريحة أو حد السحب، أو أوقف رسوم السحب");
  }
}

export function parseStoredFeePolicy(value: string | null | undefined): FeePolicy {
  if (!value) return DEFAULT_FEE_POLICY;
  try {
    return validateFeePolicy(JSON.parse(value));
  } catch {
    throw new Error("تعذر قراءة إعدادات الرسوم المحفوظة؛ أعد حفظها من لوحة التحكم");
  }
}

export function getWithdrawalFeeMinorUnits(amount: string | number, policy: FeePolicy): number {
  const amountMinor = parseMoneyMinorUnits(String(amount));
  if (!policy.withdrawalEnabled) return 0;
  for (const tier of policy.withdrawalTiers) {
    const minimum = parseMoneyMinorUnits(tier.minimumAmount);
    const maximum = tier.maximumAmount === null ? null : parseMoneyMinorUnits(tier.maximumAmount);
    if (amountMinor >= minimum && (maximum === null || amountMinor <= maximum)) {
      return parseMoneyMinorUnits(tier.feeAmount);
    }
  }
  return 0;
}

export function getTransferFeeMinorUnits(policy: FeePolicy): number {
  return policy.transferEnabled ? parseMoneyMinorUnits(policy.transferFeeAmount) : 0;
}

export function calculateWithdrawalFee(amount: string | number, policy: FeePolicy): string {
  return formatMoneyMinorUnits(getWithdrawalFeeMinorUnits(amount, policy));
}

export function calculateTransferFee(policy: FeePolicy): string {
  return formatMoneyMinorUnits(getTransferFeeMinorUnits(policy));
}
