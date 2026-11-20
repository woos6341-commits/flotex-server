export type LogoutActions = {
  captureToken: () => Promise<string | null>;
  signOut: () => void;
  cancelQueries: () => Promise<unknown>;
  clearCache: () => void;
  clearLocal: () => Promise<unknown>;
  revoke: (token: string | null) => Promise<unknown>;
};

/** Visibility/history close synchronously; request and storage completion stay truthful. */
export function performLogout(actions: LogoutActions): Promise<void> {
  const token = actions.captureToken();
  actions.signOut();
  const cancellation = actions.cancelQueries();
  actions.clearCache();
  const cleanup = actions.clearLocal();
  const revocation = token.then(actions.revoke);
  // Attach rejection handlers immediately, even when storage/server finish out of order.
  return Promise.allSettled([cancellation, cleanup, revocation]).then((results) => {
    if (results[1].status === "rejected") {
      throw new Error("تم إغلاق صفحات الحساب، لكن تعذر مسح التخزين المحلي. أغلق التطبيق وحاول مجددًا.");
    }
    if (results[2].status === "rejected") {
      throw new Error("تم تسجيل الخروج من هذا الجهاز، لكن تعذر تأكيد إبطال الجلسة على الخادم. تحقق من الاتصال.");
    }
  });
}
