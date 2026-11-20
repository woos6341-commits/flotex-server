export type PushRegistrationStage = "device" | "token" | "server" | "storage";
export type PushRegistrationReason = "session" | "network" | "unknown";

export class PushRegistrationError extends Error {
  constructor(
    readonly stage: PushRegistrationStage,
    readonly reason: PushRegistrationReason = "unknown",
  ) {
    super("Push registration failed");
    this.name = "PushRegistrationError";
  }
}

export function classifyPushRegistrationError(
  stage: PushRegistrationStage,
  error: unknown,
): PushRegistrationError {
  if (stage !== "server") return new PushRegistrationError(stage);

  const details = error && typeof error === "object"
    ? error as { message?: unknown; data?: { code?: unknown } }
    : {};
  const message = typeof details.message === "string" ? details.message : "";
  const code = typeof details.data?.code === "string" ? details.data.code : "";

  if (/UNAUTHORIZED|UNAUTHENTICATED|\b401\b/i.test(`${code} ${message}`)) {
    return new PushRegistrationError(stage, "session");
  }
  if (/failed to fetch|network request failed|networkerror|fetch failed|timed? out|timeout/i.test(message)) {
    return new PushRegistrationError(stage, "network");
  }
  return new PushRegistrationError(stage, "unknown");
}

export function getPushRegistrationFailureMessage(error: unknown): string {
  if (!(error instanceof PushRegistrationError)) {
    return "تعذر إكمال تسجيل الإشعارات. لم يتأثر حسابك أو محفظتك؛ تحقق من الاتصال ثم حاول مرة أخرى.";
  }

  if (error.stage === "device") {
    return "تعذر تهيئة إشعارات الهاتف. على Android استخدم Development Build؛ Expo Go لا يدعم الإشعارات البعيدة منذ SDK 53.";
  }
  if (error.stage === "token") {
    return "لم يتمكن الهاتف من إصدار رمز Push. يلزم ملف google-services.json المطابق لمعرّف الحزمة واعتماد FCM V1 في Expo/EAS ثم Development Build. Expo Go على Android لا يدعم Push البعيد مع SDK 53 وما بعده.";
  }
  if (error.stage === "storage") {
    return "تعذر حفظ تسجيل الجهاز على الهاتف بأمان. لم يتأثر حسابك أو محفظتك؛ أعد المحاولة.";
  }
  if (error.reason === "session") {
    return "تعذر ربط الجهاز لأن جلسة الدخول غير صالحة. سجّل الخروج ثم الدخول وأعد المحاولة؛ لم تتأثر المحفظة.";
  }
  if (error.reason === "network") {
    return "تعذر الاتصال بخادم Flotex لإكمال تسجيل الجهاز. تحقق من الإنترنت وحاول لاحقًا؛ المحفظة تعمل كالمعتاد.";
  }
  return "تعذر ربط رمز الجهاز بحسابك على خادم Flotex. تحقق من تسجيل الدخول والاتصال ثم حاول مرة أخرى؛ لم تتأثر المحفظة.";
}
