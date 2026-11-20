
export type ApiPlatform = "web" | "native";

export interface ApiLocation {
  protocol: string;
  hostname: string;
  origin?: string;
  port?: string;
}

export interface ApiBaseUrlOptions {
  platform: ApiPlatform;
  isDevelopment: boolean;
  configuredBaseUrl?: string | null;
  location?: ApiLocation | null;
}

function normalizeBaseUrl(value?: string | null): string {
  return value?.trim().replace(/\/+$/, "") ?? "";
}


function originFromLocation(location: ApiLocation): string {
  if (location.origin) return normalizeBaseUrl(location.origin);
  const port = location.port ? `:${location.port}` : "";
  return `${location.protocol}//${location.hostname}${port}`;
}

export function resolveApiBaseUrl(options: ApiBaseUrlOptions): string {
  const configured = normalizeBaseUrl(options.configuredBaseUrl);
  const location = options.location;

  if (options.platform === "web" && location) {
    // A managed Preview can render the web bundle from an internal localhost host while
    // exposing the API through a paired public endpoint. Prefer that injected endpoint
    // during development so the screenshot/device runtime does not call its own localhost.
    if (options.isDevelopment && configured) return configured;
    const previewHost = location.hostname.match(/^(?:8081|8328)-(.+)$/);
    if (previewHost) {
      return `${location.protocol}//3000-${previewHost[1]}`;
    }

    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      return `${location.protocol}//${location.hostname}:3000`;
    }

    // The published web bundle and API are served by the same origin.
    if (!options.isDevelopment) return originFromLocation(location);
    if (configured) return configured;
    return originFromLocation(location);
  }

  if (options.platform === "native") {
    // Only use an explicit stable API URL supplied by the owner.
    return configured;
  }

  return configured;
}
