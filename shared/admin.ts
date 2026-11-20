export const ADMIN_EMAIL = "dyblhwyty@gmail.com";

export type AccountRole = "admin" | "user";

/**
 * A missing email means this is a session refresh, not an identity change.
 * Preserve the current role in that case; explicit email changes are always re-evaluated.
 */
export function roleForUserUpsert(email: string | null | undefined, currentRole: AccountRole = "user"): AccountRole {
  if (email == null) return currentRole;
  return email?.trim().toLowerCase() === ADMIN_EMAIL ? "admin" : "user";
}
