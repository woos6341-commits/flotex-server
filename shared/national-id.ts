import { isValidDateOnly } from "./date-only";

function toAsciiDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (char) => String(char.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (char) => String(char.charCodeAt(0) - 0x06f0));
}

export function normalizeEgyptianNationalId(value: string): string {
  return toAsciiDigits(value).replace(/[\s-]/g, "").trim();
}

export function isValidEgyptianNationalId(value: string): boolean {
  const id = normalizeEgyptianNationalId(value);
  if (!/^\d{14}$/.test(id) || !/^[23]/.test(id)) return false;

  const century = id[0] === "2" ? 1900 : 2000;
  const birthDate = `${century + Number(id.slice(1, 3))}-${id.slice(3, 5)}-${id.slice(5, 7)}`;
  if (!isValidDateOnly(birthDate)) return false;

  // Egyptian governorate codes are 01–35; 88 is reserved for non-Egyptian
  // residents and is accepted here only because it is part of the official
  // national-ID format.
  const governorate = Number(id.slice(7, 9));
  if (!((governorate >= 1 && governorate <= 35) || governorate === 88)) return false;

  const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(id[index]) * weight, 0);
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === Number(id[13]);
}

export function parseEgyptianNationalId(value: string): string {
  const normalized = normalizeEgyptianNationalId(value);
  if (!isValidEgyptianNationalId(normalized)) {
    throw new Error("الرقم القومي المصري يجب أن يكون صحيحًا ومكوّنًا من 14 رقمًا");
  }
  return normalized;
}
