import type { HomeQuickAction } from "./home-dashboard";

// Match the original home-screen order unless an administrator explicitly changes it.
export const HOME_ACTION_ORDER_IDS = ["deposit", "transfer", "withdrawal", "savings"] as const;
export type HomeActionOrderId = (typeof HOME_ACTION_ORDER_IDS)[number];
export const DEFAULT_HOME_ACTION_ORDER: HomeActionOrderId[] = [...HOME_ACTION_ORDER_IDS];

export function isValidHomeActionOrder(value: unknown): value is HomeActionOrderId[] {
  return Array.isArray(value)
    && value.length === HOME_ACTION_ORDER_IDS.length
    && value.every((id): id is HomeActionOrderId => (HOME_ACTION_ORDER_IDS as readonly unknown[]).includes(id))
    && new Set(value).size === HOME_ACTION_ORDER_IDS.length;
}

export function normalizeHomeActionOrder(value: unknown): HomeActionOrderId[] {
  return isValidHomeActionOrder(value) ? [...value] : [...DEFAULT_HOME_ACTION_ORDER];
}

export function resolveEffectiveHomeActionOrder(userOrder: unknown, globalOrder: unknown): HomeActionOrderId[] {
  return isValidHomeActionOrder(userOrder) ? [...userOrder] : normalizeHomeActionOrder(globalOrder);
}

/**
 * Reorder only the four administrator-managed cards in the positions they occupy
 * in the original catalog. Every other original action remains in its original slot.
 */
export function reorderHomeQuickActions(
  actions: readonly HomeQuickAction[],
  value: unknown,
): HomeQuickAction[] {
  const order = normalizeHomeActionOrder(value);
  const managedIds = new Set<HomeActionOrderId>(HOME_ACTION_ORDER_IDS);
  const actionsById = new Map<HomeQuickAction["id"], HomeQuickAction>(
    actions.map((action) => [action.id, action]),
  );
  const availableOrder = order.filter((id) => actionsById.has(id));
  let managedIndex = 0;

  return actions.map((action) => {
    if (!managedIds.has(action.id as HomeActionOrderId)) return action;
    const replacementId = availableOrder[managedIndex];
    managedIndex += 1;
    return replacementId ? actionsById.get(replacementId) ?? action : action;
  });
}
