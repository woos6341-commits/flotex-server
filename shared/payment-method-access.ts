export type PaymentMethodDirection = "deposit" | "withdrawal";

export type PaymentMethodAccessOverride = {
  depositEnabled: number | boolean;
  withdrawalEnabled: number | boolean;
} | null | undefined;

export function resolvePaymentMethodAccess(override: PaymentMethodAccessOverride, legacyBlocked: boolean) {
  if (!override && legacyBlocked) return { depositEnabled: false, withdrawalEnabled: false };
  return {
    depositEnabled: override ? Boolean(override.depositEnabled) : true,
    withdrawalEnabled: override ? Boolean(override.withdrawalEnabled) : true,
  };
}
