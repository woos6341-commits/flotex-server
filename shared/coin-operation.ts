export type CoinOperationAttempt = { busy: boolean; signature: string; key: string };
export function newCoinOperationAttempt(): CoinOperationAttempt {
  return { busy: false, signature: "", key: "" };
}
/** Same payload retry retains its key, including after an ambiguous network failure. */
export function beginCoinOperation(attempt: CoinOperationAttempt, signature: string, prefix: string): string | null {
  if (attempt.busy) return null;
  if (attempt.signature !== signature || !attempt.key) {
    attempt.signature = signature;
    attempt.key = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
  attempt.busy = true;
  return attempt.key;
}
export function finishCoinOperation(attempt: CoinOperationAttempt, success: boolean): void {
  attempt.busy = false;
  if (success) { attempt.key = ""; attempt.signature = ""; }
}
