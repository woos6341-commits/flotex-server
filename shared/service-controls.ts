export const SERVICE_UNAVAILABLE_MESSAGE = "هذه الخدمة غير متاحة حالياً، يرجى المحاولة لاحقاً";

export const SERVICE_CONTROL_IDS = [
  "deposit",
  "withdrawal",
  "transfer",
  "savings",
  "game_topup",
  "external_transfer",
  "gold",
  "coin",
  "trading",
  "support",
] as const;

export type ServiceControlId = (typeof SERVICE_CONTROL_IDS)[number];

export type ServiceControlState = Record<ServiceControlId, boolean>;

export const SERVICE_CONTROL_LABELS: Record<ServiceControlId, string> = {
  deposit: "الإيداع",
  withdrawal: "السحب",
  transfer: "إرسال الأموال",
  savings: "الإدخار",
  game_topup: "شحن الألعاب",
  external_transfer: "التحويلات الخارجية",
  gold: "الذهب",
  coin: "كوين فولتكس",
  trading: "التداول",
  support: "المراسلة والدعم",
};

export const DEFAULT_SERVICE_CONTROL_STATE: ServiceControlState = Object.fromEntries(
  SERVICE_CONTROL_IDS.map((id) => [id, true]),
) as ServiceControlState;
