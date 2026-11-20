export type TransactionDirection = "credit" | "debit";
export type TransactionMetadataInput = {
  type: string;
  amount: string | number;
  status?: string;
  direction?: TransactionDirection | null;
  source?: string | null;
  customerTitle?: string | null;
  customerDescription?: string | null;
};

/** Only completed customer-facing cash-flow, savings, and game-top-up entries belong in the success bell. */
export function isBellEligibleSuccessfulTransaction(item: Pick<TransactionMetadataInput, "type" | "source" | "status">): boolean {
  if (item.status !== "approved") return false;
  return item.type === "deposit"
    || item.type === "withdrawal"
    || item.type === "transfer"
    || item.source === "game_topup"
    || item.source === "savings_principal"
    || item.source === "savings_refund"
    || item.source === "savings_profit";
}

const MAX_MINOR_UNITS = 10 ** 14 - 1;

/** Decimal text is parsed to integer piastres; no hidden rounding is allowed. */
export function parseMoneyMinorUnits(value: string, allowNegative = false): number {
  const normalized = value.trim();
  if (!(allowNegative ? /^[+-]?\d+(?:\.\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/).test(normalized)) {
    throw new Error("أدخل مبلغًا صحيحًا بالجنيه المصري حتى منزلتين عشريتين");
  }
  const negative = normalized.startsWith("-");
  const [whole, fraction = ""] = normalized.replace(/^[+-]/, "").split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor > MAX_MINOR_UNITS) throw new Error("المبلغ يتجاوز الحد المسموح به");
  return negative ? -minor : minor;
}

/** Use while rendering editable forms, where empty or partial text is expected. */
export function tryParseMoneyMinorUnits(value: string, allowNegative = false): number | null {
  try {
    return parseMoneyMinorUnits(value, allowNegative);
  } catch {
    return null;
  }
}

export function formatMoneyMinorUnits(minor: number): string {
  if (!Number.isSafeInteger(minor)) throw new Error("المبلغ غير صالح");
  const absolute = Math.abs(minor);
  return `${minor < 0 ? "-" : ""}${Math.trunc(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

/** Original operation type and administrative note remain unchanged in storage. */
export function resolveTransactionMetadata(item: TransactionMetadataInput) {
  const amount = Number(item.amount);
  const direction: TransactionDirection = item.direction ?? (amount < 0 || item.type === "withdrawal" || item.type === "loss" || item.type === "fee" ? "debit" : "credit");
  const defaultTitle = item.type === "fee" ? "رسوم العملية" : item.type === "transfer" ? (direction === "credit" ? "استلام أموال" : "إرسال أموال") : item.type === "withdrawal" ? "سحب" : item.type === "profit" || item.type === "loss" ? (direction === "credit" ? "أرباح" : "خسائر") : direction === "credit" ? "إيداع" : "خصم";
  const defaultDescription = item.status === "pending" ? "العملية قيد المراجعة" : item.status === "rejected" ? "تم رفض العملية ولم يتغير الرصيد" : item.status === "cancelled" ? "أُلغيت العملية وأُعيد المبلغ المحجوز" : item.type === "fee" ? "رسوم خدمة منفصلة عن أصل العملية" : item.type === "transfer" ? (direction === "credit" ? "تم استلام الأموال" : "تم إرسال الأموال") : item.type === "withdrawal" ? "تم سحب الأموال" : direction === "credit" ? "تمت إضافة الأموال" : "تم خصم الأموال";
  const finalStatus = item.status !== "pending" && item.status !== "rejected" && item.status !== "cancelled";
  const savingsEntry = item.source?.startsWith("savings_") === true;
  const savingsPrincipal = item.source === "savings_principal";
  const savingsDebit = savingsPrincipal && direction === "debit" && finalStatus;
  const refundEntry = item.source === "savings_refund";
  const gameTopupEntry = item.source === "game_topup";
  const title = refundEntry ? "استرداد الأموال" : savingsDebit ? "خصم للادخار" : gameTopupEntry || savingsEntry || item.type !== "adjustment" ? item.customerTitle?.trim() || defaultTitle : defaultTitle;
  const description = refundEntry ? "تم استرداد الأموال" : savingsDebit ? "تم خصم المبلغ بنجاح وتحويله إلى حساب الادخار الخاص بك" : gameTopupEntry || savingsEntry ? item.customerDescription?.trim() || defaultDescription : !finalStatus || item.type === "adjustment" ? defaultDescription : item.customerDescription?.trim() || defaultDescription;
  // Source-of-truth semantics outrank legacy labels; a negative amount never renders as '+-'.
  const displayAmount = Number.isFinite(amount) ? Math.abs(amount).toFixed(2) : "0.00";
  return { direction, customerTitle: title, customerDescription: description, displayAmount, signedAmount: `${direction === "debit" ? "-" : ""}${displayAmount}` };
}
