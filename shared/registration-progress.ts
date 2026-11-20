export type RegistrationProgress = "idle" | "registering" | "waiting";
export const REGISTRATION_SPINNER_LIMIT_MS = 3000;

/** Changes presentation only: never aborts, retries, or invents a server result. */
export function startRegistrationProgress(onChange: (progress: RegistrationProgress) => void) {
  onChange("registering");
  const timeout = setTimeout(() => onChange("waiting"), REGISTRATION_SPINNER_LIMIT_MS);
  return () => {
    clearTimeout(timeout);
    onChange("idle");
  };
}

export type RegistrationReceipt = {
  customerId: string;
};

export function registrationReceiptText(receipt: RegistrationReceipt) {
  return `رقم الحساب: ${receipt.customerId}`;
}
