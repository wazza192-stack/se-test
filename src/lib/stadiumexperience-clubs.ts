import type { SupabaseClient } from "@supabase/supabase-js";
import { slugifyClubName } from "./club-slugs";

type GenericRow = Record<string, unknown>;

export type ClubSizeRecord = {
  id: string | number | null;
  slug: string | null;
  clubName: string | null;
  size: string | null;
  raw: GenericRow;
};

const slugKeys = ["slug"] as const;
const clubNameKeys = ["club_name"] as const;
const idKeys = ["id"] as const;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeClubIdentity(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return slugifyClubName(value)
    .replace(/\bfootball\b/g, "")
    .replace(/\bcricket\b/g, "")
    .replace(/\brugby\b/g, "")
    .replace(/\bstadium\b/g, "")
    .replace(/\bclub\b/g, "")
    .replace(/\bfc\b/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSize(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toLowerCase();

    if (normalized === "small") return "Small";
    if (normalized === "medium") return "Medium";
    if (normalized === "large") return "Large";
  }

  if (typeof value === "number") {
    if (value === 1) return "Small";
    if (value === 2) return "Medium";
    if (value === 3) return "Large";
  }

  return null;
}

function serializeSize(value: unknown): string | null {
  const normalized = normalizeSize(value);

  if (!normalized) {
    return null;
  }

  return normalized.toLowerCase();
}

function getField(row: GenericRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(row[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeClubRow(row: GenericRow): ClubSizeRecord {
  const idValue = idKeys
    .map((key) => row[key])
    .find((value) => typeof value === "string" || typeof value === "number");

  return {
    id: (typeof idValue === "string" || typeof idValue === "number") ? idValue : null,
    slug: getField(row, [...slugKeys]),
    clubName: getField(row, [...clubNameKeys]),
    size: normalizeSize(row.club_size) ?? null,
    raw: row
  };
}

function normalizeSlug(value: string | null): string | null {
  return value ? slugifyClubName(value) : null;
}

export async function getStadiumExperienceClubs(client: SupabaseClient): Promise<ClubSizeRecord[]> {
  const { data, error } = await client
    .from("club_pages")
    .select("id, slug, club_name, club_size");

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) ? data.map((row) => normalizeClubRow((row ?? {}) as GenericRow)) : [];
}

export function getClubSizeForClub(
  rows: ClubSizeRecord[],
  club: { slug?: string | null; club_name?: string | null; name?: string | null }
): string | null {
  const slug = normalizeSlug(asString(club.slug));
  const clubName = asString(club.club_name) ?? asString(club.name);
  const identity = normalizeClubIdentity(clubName);

  return (
    rows.find((row) => normalizeSlug(row.slug) && slug && normalizeSlug(row.slug) === slug)?.size ??
    rows.find((row) => row.clubName && clubName && slugifyClubName(row.clubName) === slugifyClubName(clubName))?.size ??
    rows.find((row) => normalizeClubIdentity(row.clubName) && identity && normalizeClubIdentity(row.clubName) === identity)?.size ??
    null
  );
}

export async function saveClubSizeToDirectory(
  client: SupabaseClient,
  club: { slug: string; clubName: string; size: string | null }
): Promise<void> {
  const normalizedSize = serializeSize(club.size);

  const { data: existing, error: lookupError } = await client
    .from("club_pages")
    .select("id, slug, club_name")
    .or(`slug.eq.${club.slug},club_name.eq.${club.clubName}`)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Unable to find the club page before saving club size. ${lookupError.message}`);
  }

  if (!existing) {
    throw new Error("Unable to save club size because no matching club page was found.");
  }

  const matcherKey = typeof existing.id === "string" ? "id" : (existing.slug ? "slug" : "club_name");
  const matcherValue = typeof existing.id === "string"
    ? existing.id
    : (existing.slug ?? existing.club_name ?? null);

  if (!matcherValue) {
    throw new Error("Unable to save club size because the matching club page has no usable identifier.");
  }

  const { error } = await client
    .from("club_pages")
    .update({ club_size: normalizedSize })
    .eq(matcherKey, matcherValue);

  if (error) {
    throw new Error(`Unable to save club size to club_pages. ${error.message}`);
  }
}
