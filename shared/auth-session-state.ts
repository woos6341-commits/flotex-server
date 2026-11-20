export type AuthSessionSnapshot = Readonly<{
  generation: number;
  signedOut: boolean;
  registrationReceiptActive: boolean;
}>;

/** Only lifecycle flags live here. Passwords/PINs belong to their mounted screen. */
export function createAuthSessionState() {
  let snapshot: AuthSessionSnapshot = {
    generation: 0,
    signedOut: false,
    registrationReceiptActive: false,
  };
  const listeners = new Set<() => void>();
  const update = (next: AuthSessionSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    signOut() {
      update({ generation: snapshot.generation + 1, signedOut: true, registrationReceiptActive: false });
    },
    signIn() {
      update({ ...snapshot, generation: snapshot.generation + 1, signedOut: false });
    },
    setRegistrationReceiptActive(active: boolean) {
      if (active !== snapshot.registrationReceiptActive) {
        update({ ...snapshot, registrationReceiptActive: active });
      }
    },
    assertCurrent(generation: number) {
      if (generation !== snapshot.generation) {
        throw new Error("تغيّرت جلسة الحساب. أعد المحاولة من شاشة الدخول.");
      }
    },
  };
}

export const authSessionState = createAuthSessionState();
