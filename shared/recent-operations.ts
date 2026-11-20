export type RecentOperationSection = "requests" | "savings" | "gold" | "coin" | "externalTransfers" | "gameTopup" | "accountVerification" | "phoneChange" | "phoneVerification";

export const PENDING_RECENT_OPERATION_STATUSES: Record<RecentOperationSection, readonly string[]> = {
  requests: ["pending"],
  savings: ["pending_approval"],
  gold: ["pending_review"],
  coin: ["pending"],
  externalTransfers: ["new", "under_review", "awaiting_details"],
  gameTopup: ["new", "under_review", "approved", "processing"],
  accountVerification: ["pending"],
  phoneChange: ["pending"],
  phoneVerification: ["pending"],
};

export function getPendingRecentOperationStatuses(section: RecentOperationSection): string[] {
  return [...PENDING_RECENT_OPERATION_STATUSES[section]];
}

export function isPendingRecentOperation(section: RecentOperationSection, status: string): boolean {
  return PENDING_RECENT_OPERATION_STATUSES[section].includes(status);
}
