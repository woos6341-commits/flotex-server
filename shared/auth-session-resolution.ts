/**
 * Resolve the visible identity without treating a network error as a logout.
 * A successful `null` response is the only server signal that clears the
 * cached identity; an explicit local sign-out always wins.
 */
export function resolveSessionUser<T>(input: {
  signedOut: boolean;
  serverSettled: boolean;
  serverUser: T | null;
  storedUser: T | null;
}): T | null {
  if (input.signedOut) return null;
  if (input.serverSettled) return input.serverUser;
  return input.storedUser;
}

/**
 * Keep the app shell responsive if secure storage or session verification stalls.
 * Timing out only releases the loading UI; it never clears a stored token.
 */
export function shouldBlockForAuthState(input: {
  sessionReady: boolean;
  hasSessionToken: boolean;
  hasCachedUser: boolean;
  serverQueryLoading: boolean;
  serverVerificationTimedOut: boolean;
}): boolean {
  if (!input.sessionReady) return true;
  return Boolean(
    input.hasSessionToken &&
      !input.hasCachedUser &&
      input.serverQueryLoading &&
      !input.serverVerificationTimedOut,
  );
}
