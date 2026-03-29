const DEFAULT_SITE_URL = "https://stadiumexperience.com";
const DEFAULT_OWNED_IMAGE_HOSTS = ["imagedelivery.net"];
const DEFAULT_OWNED_IMAGE_PREFIXES: string[] = [];

export type ImageUrlKind =
  | "empty"
  | "invalid"
  | "local"
  | "site-managed"
  | "owned-remote"
  | "legacy-wordpress"
  | "external";

export type ImageUrlAssessment = {
  input: string | null;
  url: string | null;
  kind: ImageUrlKind;
  host: string | null;
  pathname: string | null;
  isOwned: boolean;
  isLegacy: boolean;
  guidance: string;
};

function asTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function uniqueHosts(hosts: string[]): string[] {
  return uniqueStrings(hosts.map((host) => host.toLowerCase()));
}

function normalizeUrlPrefix(value: string): string | null {
  try {
    return new URL(value).toString().replace(/\/+$/, "").toLowerCase();
  } catch {
    return null;
  }
}

function getSiteUrl(siteUrl = import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL): URL | null {
  try {
    return new URL(siteUrl);
  } catch {
    return null;
  }
}

function getOwnedImageHosts(ownedHosts = import.meta.env.PUBLIC_OWNED_IMAGE_HOSTS): string[] {
  return uniqueHosts([...DEFAULT_OWNED_IMAGE_HOSTS, ...parseList(ownedHosts)]);
}

function getOwnedImagePrefixes(
  ownedPrefixes = import.meta.env.PUBLIC_OWNED_IMAGE_PREFIXES,
  imageKitUrlEndpoint = import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT,
  mediaBaseUrl = import.meta.env.PUBLIC_MEDIA_BASE_URL
): string[] {
  return uniqueStrings(
    [...DEFAULT_OWNED_IMAGE_PREFIXES, ...parseList(ownedPrefixes), imageKitUrlEndpoint, mediaBaseUrl]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => normalizeUrlPrefix(value))
      .filter((value): value is string => Boolean(value))
  );
}

function matchesHost(host: string, expectedHost: string): boolean {
  return host === expectedHost || host.endsWith(`.${expectedHost}`);
}

function isLegacyWordPressPath(pathname: string): boolean {
  return /^\/wp-content\/uploads\//i.test(pathname) || /\.pagespeed\./i.test(pathname);
}

export function resolveImageUrl(
  value: string | null | undefined,
  baseSiteUrl = import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL
): string | null {
  const trimmed = asTrimmedString(value);

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (/^\/\//.test(trimmed)) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  try {
    return new URL(trimmed, baseSiteUrl).toString();
  } catch {
    return null;
  }
}

export function assessImageUrl(
  value: string | null | undefined,
  options?: {
    baseSiteUrl?: string;
    ownedHosts?: string;
    ownedPrefixes?: string;
  }
): ImageUrlAssessment {
  const input = asTrimmedString(value);

  if (!input) {
    return {
      input: null,
      url: null,
      kind: "empty",
      host: null,
      pathname: null,
      isOwned: false,
      isLegacy: false,
      guidance: "Add an owned image URL or a local /assets/... path."
    };
  }

  if (input.startsWith("/")) {
    return {
      input,
      url: input,
      kind: "local",
      host: null,
      pathname: input,
      isOwned: true,
      isLegacy: false,
      guidance: "Local repo-managed asset."
    };
  }

  const resolvedUrl = resolveImageUrl(input, options?.baseSiteUrl);

  if (!resolvedUrl) {
    return {
      input,
      url: null,
      kind: "invalid",
      host: null,
      pathname: null,
      isOwned: false,
      isLegacy: false,
      guidance: "This image URL is not valid."
    };
  }

  try {
    const parsed = new URL(resolvedUrl);
    const host = parsed.host.toLowerCase();
    const pathname = parsed.pathname;
    const resolvedUrlLower = parsed.toString().toLowerCase();
    const siteHost = getSiteUrl(options?.baseSiteUrl)?.host.toLowerCase() ?? null;
    const ownedHosts = getOwnedImageHosts(options?.ownedHosts);
    const ownedPrefixes = getOwnedImagePrefixes(options?.ownedPrefixes);

    if (siteHost && matchesHost(host, siteHost)) {
      if (isLegacyWordPressPath(pathname)) {
        return {
          input,
          url: resolvedUrl,
          kind: "legacy-wordpress",
          host,
          pathname,
          isOwned: false,
          isLegacy: true,
          guidance: "Legacy WordPress image. Move it into owned storage and replace this URL."
        };
      }

      return {
        input,
        url: resolvedUrl,
        kind: "site-managed",
        host,
        pathname,
        isOwned: true,
        isLegacy: false,
        guidance: "Site-managed image on the Stadium Experience domain."
      };
    }

    if (ownedHosts.some((ownedHost) => matchesHost(host, ownedHost))) {
      return {
        input,
        url: resolvedUrl,
        kind: "owned-remote",
        host,
        pathname,
        isOwned: true,
        isLegacy: false,
        guidance: "Owned remote image host."
      };
    }

    if (ownedPrefixes.some((ownedPrefix) => resolvedUrlLower.startsWith(ownedPrefix))) {
      return {
        input,
        url: resolvedUrl,
        kind: "owned-remote",
        host,
        pathname,
        isOwned: true,
        isLegacy: false,
        guidance: "Owned remote image URL."
      };
    }

    return {
      input,
      url: resolvedUrl,
      kind: "external",
      host,
      pathname,
      isOwned: false,
      isLegacy: false,
      guidance: "External host. Prefer owned storage so this image is under our control."
    };
  } catch {
    return {
      input,
      url: null,
      kind: "invalid",
      host: null,
      pathname: null,
      isOwned: false,
      isLegacy: false,
      guidance: "This image URL is not valid."
    };
  }
}

export function stripLegacyImageUrl(
  value: string | null | undefined,
  options?: {
    baseSiteUrl?: string;
    ownedHosts?: string;
    ownedPrefixes?: string;
  }
): string | null {
  const assessment = assessImageUrl(value, options);
  return assessment.kind === "legacy-wordpress" ? null : assessment.url;
}
