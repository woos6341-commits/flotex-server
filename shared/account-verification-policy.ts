export type AccountVerificationStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type MoneyRequestAccessState = "checking" | "unavailable" | "verification_required" | "allowed";

export const ACCOUNT_VERIFICATION_REQUIRED_MESSAGE = "يرجى توثيق حسابك أولًا لإتمام العملية";
export const ACCOUNT_VERIFICATION_ACTION_LABEL = "توثيق الحساب";
export const ACCOUNT_VERIFICATION_ROUTE = "/account-verification" as const;

export function isMoneyRequestAllowedByVerification(
  requiredBeforeMoney: boolean,
  status: AccountVerificationStatus | null | undefined,
): boolean {
  return !requiredBeforeMoney || status === "approved";
}

export function getMoneyRequestVerificationPrompt(
  requiredBeforeMoney: boolean,
  status: AccountVerificationStatus | null | undefined,
) {
  if (isMoneyRequestAllowedByVerification(requiredBeforeMoney, status)) return null;
  return {
    message: ACCOUNT_VERIFICATION_REQUIRED_MESSAGE,
    actionLabel: ACCOUNT_VERIFICATION_ACTION_LABEL,
    route: ACCOUNT_VERIFICATION_ROUTE,
  } as const;
}

export function getMoneyRequestAccessState(input: {
  checking: boolean;
  unavailable: boolean;
  requiredBeforeMoney: boolean;
  status: AccountVerificationStatus | null | undefined;
  serverBlocked?: boolean;
}): MoneyRequestAccessState {
  if (input.checking) return "checking";
  if (input.unavailable) return "unavailable";
  if (input.serverBlocked || !isMoneyRequestAllowedByVerification(input.requiredBeforeMoney, input.status)) {
    return "verification_required";
  }
  return "allowed";
}
