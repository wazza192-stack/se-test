import { supabase } from "./supabase";
import { slugifyClubName } from "./club-slugs";

export type ClubDirectoryApiItem = {
  name?: unknown;
  crest_url?: unknown;
};

export type ClubDirectoryApiResponse = {
  clubs?: unknown;
};

export type ClubDirectoryClub = {
  name: string;
  crestUrl: string | null;
};

type SupabaseClubDirectoryRow = {
  slug: string;
  club_name: string;
  crest_url: string | null;
  published: boolean;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeClubDirectoryClub(input: ClubDirectoryApiItem): ClubDirectoryClub | null {
  if (!isNonEmptyString(input.name)) {
    return null;
  }

  return {
    name: input.name.trim(),
    crestUrl: isNonEmptyString(input.crest_url) ? input.crest_url.trim() : null
  };
}

export function normalizeClubDirectoryResponse(input: ClubDirectoryApiResponse): ClubDirectoryClub[] {
  const rawClubs = Array.isArray(input.clubs) ? input.clubs : [];

  return rawClubs
    .map((club) => normalizeClubDirectoryClub((club ?? {}) as ClubDirectoryApiItem))
    .filter((club): club is ClubDirectoryClub => Boolean(club))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

function dedupeClubs(clubs: ClubDirectoryClub[]): ClubDirectoryClub[] {
  const map = new Map<string, ClubDirectoryClub>();

  for (const club of clubs) {
    const key = slugifyClubName(club.name);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, club);
      continue;
    }

    map.set(key, {
      name: existing.name,
      crestUrl: existing.crestUrl ?? club.crestUrl
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export async function getClubBySlug(
  slug: string,
  endpoint = import.meta.env.PUBLIC_CLUB_DIRECTORY_URL,
  fetchImpl: typeof fetch = fetch
): Promise<ClubDirectoryClub | undefined> {
  const clubs = await getPublishedClubDirectory(endpoint, fetchImpl);
  return clubs.find((club) => slugifyClubName(club.name) === slug);
}

export async function getPublishedSupabaseClubs(): Promise<ClubDirectoryClub[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("club_pages")
    .select("slug, club_name, crest_url, published")
    .eq("published", true)
    .order("club_name") as { data: SupabaseClubDirectoryRow[] | null; error: unknown };

  if (error || !data?.length) {
    return [];
  }

  return data.map((row) => ({
    name: row.club_name,
    crestUrl: row.crest_url
  }));
}

export async function getPublishedClubDirectory(
  endpoint = import.meta.env.PUBLIC_CLUB_DIRECTORY_URL,
  fetchImpl: typeof fetch = fetch
): Promise<ClubDirectoryClub[]> {
  const [externalClubs, supabaseClubs] = await Promise.allSettled([
    fetchClubDirectory(endpoint, fetchImpl),
    getPublishedSupabaseClubs()
  ]);

  const merged = [
    ...(externalClubs.status === "fulfilled" ? externalClubs.value : []),
    ...(supabaseClubs.status === "fulfilled" ? supabaseClubs.value : [])
  ];

  return dedupeClubs(merged);
}

export async function fetchClubDirectory(
  endpoint = import.meta.env.PUBLIC_CLUB_DIRECTORY_URL,
  fetchImpl: typeof fetch = fetch
): Promise<ClubDirectoryClub[]> {
  if (!endpoint) {
    throw new Error("Club directory endpoint is not configured.");
  }

  const response = await fetchImpl(endpoint, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Club directory request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as ClubDirectoryApiResponse;
  return normalizeClubDirectoryResponse(data);
}
