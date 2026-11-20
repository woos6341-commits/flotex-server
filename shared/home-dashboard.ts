export const HOME_QUICK_ACTIONS = [
  { id: "deposit", label: "إيداع", icon: "add-circle-outline", route: "/deposit" },
  { id: "transfer", label: "تحويل", icon: "swap-horizontal-outline", route: "/transfer" },
  { id: "externalTransfers", label: "معاملات خارجية", icon: "globe-outline", route: "/external-transfers" },
  { id: "withdrawal", label: "سحب", icon: "arrow-up-circle-outline", route: "/withdrawal" },
  { id: "savings", label: "الإدخار", icon: "pie-chart-outline", route: "/savings" },
  { id: "gameTopup", label: "شحن ألعاب", icon: "game-controller-outline", route: "/game-topup" },
  { id: "coin", label: "كوين فولتكس", icon: "cash-outline", route: "/coin-wallet" },
  { id: "transactions", label: "سجل المعاملات", icon: "reader-outline", route: "/(tabs)/activity" },
  { id: "paymentMethods", label: "وسائل الدفع", icon: "wallet-outline", route: "/(tabs)/wallet" },
] as const;

export type HomeQuickAction = (typeof HOME_QUICK_ACTIONS)[number];

export type HomeIdentity = {
  name?: string | null;
  givenName?: string | null;
  fatherName?: string | null;
};

export function getHomeDisplayName(user: HomeIdentity): string {
  const registeredName = user.name?.trim().replace(/\s+/g, " ");
  const fallbackName = [user.givenName, user.fatherName].filter(Boolean).join(" ").trim();
  return registeredName || fallbackName || "مستثمر";
}

export type HomeVerificationNotice = {
  title: string;
  message: string;
  tone: "gold" | "red" | "muted";
  action: "submit" | "reapply" | null;
};

export function getHomeVerificationNotice(status: string | undefined, rejectionReason?: string | null): HomeVerificationNotice | null {
  if (status === "approved") return null;
  if (status === "pending") {
    return {
      title: "طلب التوثيق قيد المراجعة",
      message: "وصل طلبك إلى المدير؛ لا حاجة لإرسال طلب آخر أثناء المراجعة.",
      tone: "muted",
      action: null,
    };
  }
  if (status === "rejected") {
    const reason = rejectionReason?.trim() || "راجع بياناتك ومستنداتك قبل إعادة التقديم.";
    return {
      title: "طلب التوثيق يحتاج إلى مراجعة",
      message: `سبب الرفض: ${reason}`,
      tone: "red",
      action: "reapply",
    };
  }
  if (status === "not_submitted") {
    return {
      title: "توثيق الحساب",
      message: "أرسل المستندات المطلوبة ليتمكن المدير من مراجعة طلبك.",
      tone: "gold",
      action: "submit",
    };
  }
  return null;
}
