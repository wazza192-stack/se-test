import {
  fallbackAwardsCategories,
  fallbackAwardsPages,
  fallbackAwardsProgrammes,
  type AwardsCategory,
  type AwardsPage,
  type AwardsProgramme
} from "../data/awards";
import {
  mapAwardsCategory,
  mapAwardsPage,
  mapAwardsProgramme
} from "./awards-shared";
import { supabase } from "./supabase";

type AwardsProgrammeRow = Record<string, unknown>;
type AwardsPageRow = Record<string, unknown>;
type AwardsCategoryRow = Record<string, unknown>;

export async function getAwardsProgrammes(): Promise<AwardsProgramme[]> {
  if (!supabase) {
    return fallbackAwardsProgrammes
      .filter((programme) => programme.published !== false)
      .sort((left, right) => (right.sortOrder ?? 0) - (left.sortOrder ?? 0));
  }

  try {
    const { data, error } = await supabase
      .from("awards_programmes")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: false })
      .order("year_label", { ascending: false });

    if (!error && Array.isArray(data) && data.length) {
      return data.map((row) => mapAwardsProgramme(row as AwardsProgrammeRow));
    }
  } catch {
    // Fall back to seeded awards content when Supabase is unavailable.
  }

  return fallbackAwardsProgrammes
    .filter((programme) => programme.published !== false)
    .sort((left, right) => (right.sortOrder ?? 0) - (left.sortOrder ?? 0));
}

export async function getAwardsProgrammeBySlug(slug: string): Promise<AwardsProgramme | undefined> {
  const programmes = await getAwardsProgrammes();
  return programmes.find((programme) => programme.slug === slug);
}

export async function getAwardsPages(): Promise<AwardsPage[]> {
  if (!supabase) {
    return fallbackAwardsPages
      .filter((page) => page.published !== false)
      .sort((left, right) => (right.sortOrder ?? 0) - (left.sortOrder ?? 0));
  }

  try {
    const { data, error } = await supabase
      .from("awards_pages")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: false })
      .order("title");

    if (!error && Array.isArray(data) && data.length) {
      return data.map((row) => mapAwardsPage(row as AwardsPageRow));
    }
  } catch {
    // Fall back to seeded awards content when Supabase is unavailable.
  }

  return fallbackAwardsPages
    .filter((page) => page.published !== false)
    .sort((left, right) => (right.sortOrder ?? 0) - (left.sortOrder ?? 0));
}

export async function getAwardsPageBySlug(slug: string): Promise<AwardsPage | undefined> {
  const pages = await getAwardsPages();
  return pages.find((page) => page.slug === slug);
}

export async function getAwardsCategories(programmeSlug?: string): Promise<AwardsCategory[]> {
  const fallback = programmeSlug
    ? fallbackAwardsCategories.filter((category) => category.programmeSlug === programmeSlug && category.published !== false)
    : fallbackAwardsCategories.filter((category) => category.published !== false);

  if (!supabase) {
    return fallback.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  }

  try {
    let query = supabase
      .from("awards_categories")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .order("title");

    if (programmeSlug) {
      query = query.eq("programme_slug", programmeSlug);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data) && data.length) {
      return data.map((row) => mapAwardsCategory(row as AwardsCategoryRow));
    }
  } catch {
    // Fall back to seeded awards content when Supabase is unavailable.
  }

  return fallback.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

export async function getAwardsCategoryBySlug(slug: string): Promise<AwardsCategory | undefined> {
  const categories = await getAwardsCategories();
  return categories.find((category) => category.slug === slug);
}

export async function getAwardsLandingPage(): Promise<AwardsPage> {
  return (await getAwardsPageBySlug("awards")) ?? fallbackAwardsPages[0];
}

export type AwardsRouteData =
  | { kind: "page"; page: AwardsPage }
  | { kind: "programme"; programme: AwardsProgramme }
  | { kind: "category"; category: AwardsCategory };

export async function getAwardsRouteData(slug: string): Promise<AwardsRouteData | undefined> {
  const page = await getAwardsPageBySlug(slug);

  if (page) {
    return { kind: "page", page };
  }

  const programme = await getAwardsProgrammeBySlug(slug);

  if (programme) {
    return { kind: "programme", programme };
  }

  const category = await getAwardsCategoryBySlug(slug);

  if (category) {
    return { kind: "category", category };
  }

  return undefined;
}
