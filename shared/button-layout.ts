import { HOME_QUICK_ACTIONS } from "./home-dashboard";
import { reorderHomeQuickActions } from "./home-action-order";

// These are navigation shortcuts, not the conditional form/confirmation controls elsewhere in the app.
export const WALLET_LAYOUT_ACTIONS = [
  { id: "deposit", label: "إيداع", route: "/deposit", icon: "arrow-down-circle-outline" },
  { id: "transfer", label: "إرسال أموال", route: "/transfer", icon: "swap-horizontal-outline" },
  { id: "externalTransfers", label: "معاملات خارجية", route: "/external-transfers", icon: "globe-outline" },
  { id: "withdrawal", label: "سحب", route: "/withdrawal", icon: "arrow-up-circle-outline" },
  { id: "savings", label: "الإدخار", route: "/savings", icon: "pie-chart-outline" },
  { id: "transactions", label: "سجل المعاملات", route: "/(tabs)/activity", icon: "list-outline" },
] as const;
export const SUPPORT_LAYOUT_ACTION = { id: "support", label: "الدعم", route: "/support", icon: "headset-outline" } as const;
export const LAYOUT_ACTIONS = {
  home: [...HOME_QUICK_ACTIONS, SUPPORT_LAYOUT_ACTION],
  wallet: [...WALLET_LAYOUT_ACTIONS, SUPPORT_LAYOUT_ACTION],
} as const;
export type LayoutSurface = keyof typeof LAYOUT_ACTIONS;
export type LayoutAction = (typeof LAYOUT_ACTIONS)[LayoutSurface][number];
export type ButtonPosition = { id: string; x: number; y: number };
export type ButtonLayout = { version: 1; positions: ButtonPosition[] };

// All coordinates are fractions of the available travel, so the same layout scales to phone widths.
export const BUTTON_HEIGHT = 92;
export const BUTTON_WIDTH_FRACTION = 0.30;
export const canvasHeight = (surface: LayoutSurface) => surface === "home" ? 500 : 398;
export function defaultButtonLayout(surface: LayoutSurface, legacyHomeOrder?: unknown): ButtonLayout {
  const actions = surface === "home"
    ? [...reorderHomeQuickActions(HOME_QUICK_ACTIONS, legacyHomeOrder), SUPPORT_LAYOUT_ACTION]
    : LAYOUT_ACTIONS.wallet;
  const travelY = canvasHeight(surface) - BUTTON_HEIGHT;
  return { version: 1, positions: actions.map((action, index) => ({
    id: action.id, x: (index % 3) / 2, y: Math.floor(index / 3) * 102 / travelY,
  })) };
}
export function positionsOverlap(surface: LayoutSurface, a: ButtonPosition, b: ButtonPosition): boolean {
  const minDx = BUTTON_WIDTH_FRACTION / (1 - BUTTON_WIDTH_FRACTION);
  const minDy = BUTTON_HEIGHT / (canvasHeight(surface) - BUTTON_HEIGHT);
  // A tiny tolerance allows adjacent edges after JSON rounding.
  return Math.abs(a.x - b.x) < minDx - 0.00001 && Math.abs(a.y - b.y) < minDy - 0.00001;
}
export function isValidButtonLayout(surface: LayoutSurface, value: unknown): value is ButtonLayout {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as { version?: unknown; positions?: unknown };
  if (candidate.version !== 1 || !Array.isArray(candidate.positions)) return false;
  const positions: ButtonPosition[] = candidate.positions;
  const ids = LAYOUT_ACTIONS[surface].map((item) => item.id as string);
  if (positions.length !== ids.length) return false;
  const seen = new Set<string>();
  for (const position of positions) {
    if (!position || typeof position !== "object" || typeof position.id !== "string" || !ids.includes(position.id) || seen.has(position.id)) return false;
    if (typeof position.x !== "number" || typeof position.y !== "number" || !Number.isFinite(position.x) || !Number.isFinite(position.y) || position.x < 0 || position.x > 1 || position.y < 0 || position.y > 1) return false;
    seen.add(position.id);
  }
  return positions.every((a, i) => positions.slice(i + 1).every((b) => !positionsOverlap(surface, a, b)));
}
export function moveButton(layout: ButtonLayout, id: string, x: number, y: number): ButtonLayout {
  const bounded = (n: number) => Math.max(0, Math.min(1, n));
  return { version: 1, positions: layout.positions.map((position) => position.id === id ? { id, x: bounded(x), y: bounded(y) } : position) };
}
