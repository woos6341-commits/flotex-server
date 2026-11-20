import type { SupportCategory } from "./support-categories";

/** A stable source-qualified key, never a cross-table reference lookup. */
export type AdminRequestKind = "payment" | "transfer" | "savings" | "game" | "external" | "gold" | "coin-order" | "coin-transfer" | "account-verification" | "phone-change" | "phone-verification" | "support" | "guest";
export type AdminRequestSelection = { kind: AdminRequestKind; id: number; category?: SupportCategory };
export type AdminRequestReviewTarget = {
  section: "requests" | "savings" | "gameTopup" | "externalTransfers" | "gold" | "coin" | "accountVerification" | "phoneChange" | "phoneVerification" | "supportMessaging" | "guestSupport";
  key: string;
  id: number;
  reference: string;
  tab?: "payments" | "transfers";
  userId?: number;
  category?: SupportCategory;
  guestTicketId?: number;
};
export type AdminRequestField = { label: string; value: string };
export type AdminRequestHistoryEntry = { label: string; at: string | null; actor: string | null; detail?: string };
export type AdminRequestAttachment = { label: string; access: "payment-receipt" | "specialist" };
export type AdminRequestDetailsData = {
  key: string;
  reference: string;
  title: string;
  customerName: string;
  customerId: string | null;
  status: string;
  createdAt: string | null;
  amount: string | null;
  currency: string | null;
  fields: AdminRequestField[];
  attachments: AdminRequestAttachment[];
  history: AdminRequestHistoryEntry[];
  limitations: string[];
  review: AdminRequestReviewTarget;
};
