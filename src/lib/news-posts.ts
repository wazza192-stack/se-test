import type { SeoMeta } from "../data/site";

type GenericRecord = Record<string, unknown>;

function asTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function slugifyNewsPostTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normaliseNewsBody(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function buildNewsBodyText(paragraphs: string[]): string {
  return paragraphs
    .map((paragraph) => String(paragraph ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function normaliseNewsSeo(value: unknown): SeoMeta | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as GenericRecord;
  const seo: SeoMeta = {
    metaTitle: asTrimmedString(row.metaTitle),
    metaDescription: asTrimmedString(row.metaDescription),
    canonicalUrl: asTrimmedString(row.canonicalUrl),
    canonicalPath: asTrimmedString(row.canonicalPath),
    ogTitle: asTrimmedString(row.ogTitle),
    ogDescription: asTrimmedString(row.ogDescription),
    ogImage: asTrimmedString(row.ogImage),
    socialImage: asTrimmedString(row.socialImage),
    noindex: row.noindex === true
  };

  return Object.values(seo).some((entry) => entry !== null && entry !== undefined && entry !== false)
    ? seo
    : null;
}
