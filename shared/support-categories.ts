export const SUPPORT_CATEGORIES = ["account", "freeze", "external_transaction"] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  account: "مراسلات الحساب",
  freeze: "تجميد الحسابات",
  external_transaction: "المعاملات الخارجية",
};

export const ACTIVE_SUPPORT_CATEGORIES = ["account", "external_transaction"] as const;
export type ActiveSupportCategory = (typeof ACTIVE_SUPPORT_CATEGORIES)[number];
