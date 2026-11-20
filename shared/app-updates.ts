export type AndroidUpdatePolicy = {
  enabled: boolean;
  version: string;
  buildNumber: number;
  downloadUrl: string;
  storageKey?: string;
  releaseNotes: string;
  mandatory: boolean;
};

export const DISABLED_ANDROID_UPDATE_POLICY: AndroidUpdatePolicy = {
  enabled: false,
  version: "",
  buildNumber: 0,
  downloadUrl: "",
  storageKey: "",
  releaseNotes: "",
  mandatory: false,
};

export function toPublicAndroidUpdatePolicy(policy: AndroidUpdatePolicy): AndroidUpdatePolicy {
  if (!policy.enabled) return { ...DISABLED_ANDROID_UPDATE_POLICY };
  return {
    ...policy,
    downloadUrl: "",
    storageKey: "",
  };
}

export function isReleaseVersion(value: string): boolean {
  if (!/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(value.trim())) return false;
  return value.split(".").every((part) => Number.isSafeInteger(Number(part)));
}

export function compareReleaseVersions(left: string, right: string): number | null {
  if (!isReleaseVersion(left) || !isReleaseVersion(right)) return null;
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] < rightParts[index]) return -1;
    if (leftParts[index] > rightParts[index]) return 1;
  }
  return 0;
}

export function hasNewerRelease(installedVersion: string, offeredVersion: string): boolean {
  return compareReleaseVersions(installedVersion, offeredVersion) === -1;
}

export function hasNewerAndroidRelease(
  installedVersion: string,
  installedBuildNumber: number,
  offeredVersion: string,
  offeredBuildNumber: number,
): boolean {
  const versionComparison = compareReleaseVersions(installedVersion, offeredVersion);
  if (versionComparison === null || !Number.isSafeInteger(offeredBuildNumber) || offeredBuildNumber < 1) return false;
  if (versionComparison < 0) return true;
  return versionComparison === 0 && Number.isSafeInteger(installedBuildNumber) && installedBuildNumber > 0 && installedBuildNumber < offeredBuildNumber;
}

export function isSafeHttpsDownloadUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return false;
    if (url.search || url.hash) return false;
    const hostname = url.hostname.toLowerCase();
    // APK links must use a stable public DNS name, never an IP literal or local host.
    if (hostname.includes(":") || hostname.startsWith("[") || !hostname.includes(".")) return false;
    if (["localhost", "local", "internal", "lan", "home.arpa", "test", "invalid", "example"]
      .some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))) return false;
    if (/^\d+(?:\.\d+){0,3}$/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export const ANDROID_APK_MIME_TYPE = "application/vnd.android.package-archive";
export const MAX_ANDROID_APK_SIZE_BYTES = 200 * 1024 * 1024;

export function isAndroidApkFileName(value: string): boolean {
  const name = value.trim();
  return name.length > 0
    && name.length <= 255
    && !/[\\/\u0000-\u001f\u007f]/.test(name)
    && /\.apk$/i.test(name);
}

export function isAndroidApkMimeType(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return [ANDROID_APK_MIME_TYPE, "application/octet-stream", "application/x-android-package-archive"]
    .includes(value.trim().toLowerCase());
}

export function isValidAndroidApkSize(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= MAX_ANDROID_APK_SIZE_BYTES;
}

export function isSafeAndroidUpdateStorageKey(value: string, version?: string): boolean {
  const match = /^flotex-egp\/android-updates\/(\d{1,5}\.\d{1,5}\.\d{1,5})\/(?:\d{1,10}-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.apk$/i.exec(value);
  return Boolean(match && isReleaseVersion(match[1]) && (!version || match[1] === version));
}

export function decideAndroidUpdate(installedVersion: string, policy: AndroidUpdatePolicy) {
  const available = policy.enabled && hasNewerAndroidRelease(installedVersion, 0, policy.version, policy.buildNumber);
  return {
    available,
    mandatory: available && policy.mandatory,
  };
}

export function decideAndroidUpdateGate(input: {
  platform: string;
  applicationIdMatches: boolean;
  policyReady: boolean;
  installedVersion: string;
  installedBuildNumber: number;
  policy?: AndroidUpdatePolicy;
  deferredVersion: string | null;
}) {
  if (input.platform !== "android" || !input.applicationIdMatches || !input.policyReady || !input.policy) {
    return { available: false, visible: false, mandatory: false };
  }
  const decision = {
    available: input.policy.enabled && hasNewerAndroidRelease(input.installedVersion, input.installedBuildNumber, input.policy.version, input.policy.buildNumber),
    mandatory: input.policy.enabled && input.policy.mandatory,
  };
  decision.mandatory = decision.available && input.policy.mandatory;
  return {
    available: decision.available,
    visible: decision.available && (decision.mandatory || input.deferredVersion !== input.policy.version),
    mandatory: decision.mandatory,
  };
}
