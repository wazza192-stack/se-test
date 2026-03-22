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

const slugKeys = ["slug", "club_slug", "team_slug", "name_slug", "clubslug"] as const;
const clubNameKeys = ["club_name", "name", "title", "club", "team_name", "member_name", "venue_name", "clubname"] as const;
const sizeKeys = ["club_size", "size", "clubsize", "venue_size", "size_label"] as const;
const idKeys = ["id", "club_id", "clubid"] as const;

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

function serializeSizeForColumn(column: string, value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalized = normalizeSize(value);

  if (!normalized) {
    return null;
  }

  if (column === "club_size" || column === "clubsize" || column === "size_label") {
    return normalized.toLowerCase();
  }

  return normalized;
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
    size:
      normalizeSize(row.club_size) ??
      normalizeSize(row.size) ??
      normalizeSize(row.clubsize) ??
      normalizeSize(row.venue_size) ??
      normalizeSize(row.size_label) ??
      null,
    raw: row
  };
}

function normalizeSlug(value: string | null): string | null {
  return value ? slugifyClubName(value) : null;
}

export async function getStadiumExperienceClubs(client: SupabaseClient): Promise<ClubSizeRecord[]> {
  const { data, error } = await client.from("stadiumexperience_clubs").select("*");

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
  const rows = await getStadiumExperienceClubs(client);
  const existing =
    rows.find((row) => normalizeSlug(row.slug) && normalizeSlug(row.slug) === normalizeSlug(club.slug)) ??
    rows.find((row) => row.clubName && slugifyClubName(row.clubName) === slugifyClubName(club.clubName));

  const matchedSizeKeys = existing
    ? sizeKeys.filter((key) => Object.prototype.hasOwnProperty.call(existing.raw, key))
    : [];
  const preferredSizeKeys = matchedSizeKeys.length ? matchedSizeKeys : ["club_size", "size"];
  const sizePayloads = preferredSizeKeys.map((key) => ({ [key]: serializeSizeForColumn(key, club.size) }));

  if (existing) {
    const errors: string[] = [];
    const identifierMatchers: Array<{ key: string; value: string | number }> = [];

    idKeys.forEach((key) => {
      const value = existing.raw[key];
      if (typeof value === "string" || typeof value === "number") {
        identifierMatchers.push({ key, value });
      }
    });

    slugKeys.forEach((key) => {
      const value = asString(existing.raw[key]);
      if (value) {
        identifierMatchers.push({ key, value });
      }
    });

    clubNameKeys.forEach((key) => {
      const value = asString(existing.raw[key]);
      if (value) {
        identifierMatchers.push({ key, value });
      }
    });

    if (!identifierMatchers.length) {
      throw new Error("Found a matching club in stadiumexperience_clubs, but could not find a usable id, slug or name column to update.");
    }

    for (const payload of sizePayloads) {
      for (const matcher of identifierMatchers) {
        const { error } = await client.from("stadiumexperience_clubs").update(payload).eq(matcher.key, matcher.value);

        if (!error) {
          return;
        }

        const payloadKey = Object.keys(payload)[0] ?? "unknown";
        errors.push(`${payloadKey} via ${matcher.key}: ${error.message}`);
      }
    }

    throw new Error(`Unable to save club size to stadiumexperience_clubs. ${errors.join(" | ")}`);
  }

  const insertPayloads = preferredSizeKeys.flatMap((sizeKey) => [
    { slug: club.slug, club_name: club.clubName, [sizeKey]: serializeSizeForColumn(sizeKey, club.size) },
    { slug: club.slug, name: club.clubName, [sizeKey]: serializeSizeForColumn(sizeKey, club.size) },
    { club_slug: club.slug, club_name: club.clubName, [sizeKey]: serializeSizeForColumn(sizeKey, club.size) },
    { club_slug: club.slug, name: club.clubName, [sizeKey]: serializeSizeForColumn(sizeKey, club.size) }
  ]);
  const insertErrors: string[] = [];

  for (const payload of insertPayloads) {
    const { error } = await client.from("stadiumexperience_clubs").insert(payload);

    if (!error) {
      return;
    }

    const payloadKeys = Object.keys(payload).join(", ");
    insertErrors.push(`${payloadKeys}: ${error.message}`);
  }

  throw new Error(`Unable to create a size record in stadiumexperience_clubs. ${insertErrors.join(" | ")}`);
}
