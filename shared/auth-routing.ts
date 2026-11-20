export type AuthenticatedHomeRoute = "/control" | "/(tabs)";

export function authenticatedHomeRoute(role: string | null | undefined): AuthenticatedHomeRoute {
  return role === "admin" ? "/control" : "/(tabs)";
}

export function isPublicUnauthenticatedRoute(segments: readonly string[]): boolean {
  const [first, second] = segments;
  return (
    first === "index" ||
    first === "register" ||
    first === "forgot-password" ||
    first === "support-portal" ||
    first === "guest-support" ||
    // Profile may be the current route for one render while Logout replaces it with Tabs home.
    // Tabs.Protected still removes wallet/profile/activity screens as soon as the session closes.
    (first === "(tabs)" && (second === undefined || second === "index" || second === "profile"))
  );
}

export function shouldRedirectAuthenticatedUser(segments: readonly string[]): boolean {
  const first = segments[0];
  return first === "index" || first === "register" || first === "forgot-password";
}

export function isAdministrativeRoute(segments: readonly string[]): boolean {
  return segments[0] === "control" || segments[0] === "admin";
}

// Stack.Protected removes these entries from navigation history when the guard closes.
export const PROTECTED_ROOT_ROUTES = [
  "account-verification", "change-password", "change-phone", "coin-buy", "coin-sell", "coin-send", "coin-wallet",
  "delete-account", "deposit", "gold-order", "onboarding", "order/[symbol]", "phone-verification",
  "savings", "savings-history", "savings-how-to", "security-pin", "sessions", "external-transfers",
  "stock/[symbol]", "support", "frozen-support", "transfer", "withdrawal",
] as const;

export function shouldRestoreVerificationRoute(segments: readonly string[], destination: string): boolean {
  if (`/${segments[0]}` === destination) return false;
  return segments.length === 0 || segments[0] === "index" ||
    (segments[0] === "(tabs)" && (!segments[1] || segments[1] === "index"));
}
