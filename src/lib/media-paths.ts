function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normaliseExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "jpg";
}

export function buildClubMediaObjectKey(options: {
  clubSlug: string;
  slot: "crest" | "hero" | "christmas" | "play-on-pitch";
  fileName: string;
}): string {
  const extension = normaliseExtension(options.fileName);
  return `clubs/${slugifySegment(options.clubSlug)}/${options.slot}.${extension}`;
}

export function buildNewsMediaObjectKey(options: {
  slug: string;
  fileName: string;
  publishedAt?: string | null;
}): string {
  const extension = normaliseExtension(options.fileName);
  const year = options.publishedAt?.slice(0, 4) && /^\d{4}$/.test(options.publishedAt.slice(0, 4))
    ? options.publishedAt.slice(0, 4)
    : "drafts";

  return `news/${year}/${slugifySegment(options.slug)}/cover.${extension}`;
}

export function buildAwardsMediaObjectKey(options: {
  slug: string;
  fileName: string;
  type: "programme" | "page" | "category";
}): string {
  const extension = normaliseExtension(options.fileName);
  return `awards/${options.type}/${slugifySegment(options.slug)}/hero.${extension}`;
}
