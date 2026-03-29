import {
  latestNewsPageContent,
  newsPosts,
  supplierFeatures,
  suppliersPageContent,
  venues,
  jobListings,
  type MarketingPageContent,
  type NewsPost,
  type JobListing,
  type PlanningFact,
  type SupplierFeature,
  type Venue
} from "../data/site";
import { getPublishedClubDirectory } from "./club-directory";
import { normaliseJobSections } from "./job-section-content";
import { stripLegacyImageUrl } from "./media";
import { normaliseNewsBody, normaliseNewsSeo } from "./news-posts";
import { slugifyClubName } from "./club-slugs";
import { supabase } from "./supabase";

type GenericRow = Record<string, unknown>;

export type ResolvedNewsPost = {
  post: NewsPost;
};

type SupabaseVenueRow = {
  slug: string;
  name: string;
  city: string;
  region: string;
  summary: string | null;
  hero_copy: string | null;
  guest_capacity_min: number | null;
  guest_capacity_max: number | null;
  enquiry_email: string | null;
};

type SupabaseClubPageAddressRow = {
  slug: string;
  club_name: string | null;
  crest_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  summary: string | null;
  key_facts: unknown;
  hero_image_url: string | null;
  published: boolean;
  archived?: boolean;
};

type SupabaseJobRow = {
  slug: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  summary: string | null;
  description: string | null;
  content_sections: unknown;
  salary: string | null;
  hours: string | null;
  job_location: string | null;
  closing_date: string | null;
  application_url: string | null;
  contact_email: string | null;
  published: boolean;
};

type SupabaseNewsRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  seo: unknown;
  published: boolean;
  published_at: string | null;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asMultilineString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\r\n/g, "\n");
  return normalized.trim() ? normalized : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
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

function getNumberField(row: GenericRow, keys: string[]): number | null {
  for (const key of keys) {
    const value = asNumber(row[key]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function getBooleanField(row: GenericRow, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = asBoolean(row[key]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

const planningFactLabelPriority = [
  "theatre capacity",
  "banquet capacity",
  "total sqm exhibition space",
  "event spaces",
  "boxes",
  "distance to nearest hotel"
];

function sortPlanningFacts(facts: PlanningFact[]): PlanningFact[] {
  return [...facts].sort((left, right) => {
    const leftLabel = left.label.trim().toLowerCase();
    const rightLabel = right.label.trim().toLowerCase();
    const leftIndex = planningFactLabelPriority.indexOf(leftLabel);
    const rightIndex = planningFactLabelPriority.indexOf(rightLabel);

    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }

    return leftLabel.localeCompare(rightLabel, "en");
  });
}

function asPlanningFacts(value: unknown): PlanningFact[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsedFacts = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const label = asString((item as GenericRow).label);
      const factValue = asString((item as GenericRow).value);

      return label && factValue ? { label, value: factValue } : null;
    })
    .filter((item): item is PlanningFact => Boolean(item));

  return sortPlanningFacts(parsedFacts);
}

function asJobSections(value: unknown): JobListing["sections"] {
  return normaliseJobSections(value);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function capacityLabel(min: number | null, max: number | null, fallback: string | null = null) {
  if (max && min) return `${min}-${max} guests`;
  if (max) return `Up to ${max} guests`;
  if (fallback) return fallback;
  return "Capacity on request";
}

function joinFactValues(values: string[]): string {
  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
}

function buildPlanningFacts({
  guestCapacityLabel,
  eventTypes,
  features,
  spaces
}: {
  guestCapacityLabel: string;
  eventTypes: string[];
  features: string[];
  spaces: Venue["spaces"];
}): PlanningFact[] {
  const facts: PlanningFact[] = [];

  if (eventTypes.length) {
    facts.push({
      label: "Best for",
      value: joinFactValues(eventTypes.slice(0, 2))
    });
  }

  if (spaces.length) {
    facts.push({
      label: "Spaces",
      value: `${spaces.length} event spaces`
    });
  }

  if (features.length) {
    facts.push({
      label: "Highlights",
      value: joinFactValues(features.slice(0, 2))
    });
  }

  if (!facts.length && guestCapacityLabel) {
    facts.push({
      label: "Capacity",
      value: guestCapacityLabel
    });
  }

  return sortPlanningFacts(facts);
}

function isLikelyLogoImage(url: string | null): boolean {
  if (!url) {
    return false;
  }

  return /(?:crest|logo|badge|icon|emblem)/i.test(url);
}

function getVenueCardImage(heroImageUrl: string | null): string {
  const safeHeroImageUrl = stripLegacyImageUrl(heroImageUrl);

  if (safeHeroImageUrl && !isLikelyLogoImage(safeHeroImageUrl)) {
    return safeHeroImageUrl;
  }

  return "/assets/stadium-experience/hero-team-shot.jpg";
}

function mapVenueRow(row: SupabaseVenueRow): Venue {
  const eventTypes = ["Meetings", "Conferences"];
  const features = ["Direct venue enquiries", "Stadium Experience member"];
  const spaces: Venue["spaces"] = [];
  const guestCapacity = capacityLabel(row.guest_capacity_min, row.guest_capacity_max);

  return {
    slug: row.slug,
    name: row.name,
    city: row.city,
    region: row.region,
    heroImage: "/assets/stadium-experience/hero-team-shot.jpg",
    summary: row.summary ?? "Flexible event venue in the Stadium Experience network.",
    description:
      row.hero_copy ??
      "Discover a flexible event venue within the Stadium Experience network, with direct enquiry routes and practical planning information for event buyers.",
    guestCapacityLabel: guestCapacity,
    planningFacts: buildPlanningFacts({
      guestCapacityLabel: guestCapacity,
      eventTypes,
      features,
      spaces
    }),
    eventTypes,
    features,
    spaces,
    contactEmail: row.enquiry_email ?? "office@stadiumexperience.com"
  };
}

function mapJobRow(row: SupabaseJobRow): JobListing {
  const description = asMultilineString(row.description)
    ?.split(/\r?\n\r?\n/g)
    .map((paragraph) => asMultilineString(paragraph))
    .filter((paragraph): paragraph is string => Boolean(paragraph)) ?? [];
  const sections = asJobSections(row.content_sections);

  return {
    slug: row.slug,
    title: row.title,
    location: asString(row.location) ?? "Club to be confirmed",
    type: asString(row.employment_type) ?? "Role type on request",
    summary: asString(row.summary) ?? "Explore this opportunity across the Stadium Experience network.",
    sections:
      sections.length
        ? sections
        : [{
            heading: "Role description",
            content: description.length ? description.join("\n\n") : asString(row.summary) ?? "Explore this opportunity across the Stadium Experience network.",
            body: description.length ? description : [asString(row.summary) ?? "Explore this opportunity across the Stadium Experience network."],
            bullets: []
          }],
    salary: asString(row.salary),
    hours: asString(row.hours),
    jobLocation: asString(row.job_location),
    closingDate: asString(row.closing_date),
    applicationUrl: asString(row.application_url),
    contactEmail: asString(row.contact_email) ?? "office@stadiumexperience.com"
  };
}

function mapNewsRow(row: SupabaseNewsRow): NewsPost {
  const body = normaliseNewsBody(row.body);

  return {
    slug: row.slug,
    title: row.title,
    publishedAt: asString(row.published_at) ?? new Date().toISOString().slice(0, 10),
    excerpt: asString(row.excerpt) ?? "Latest update from Stadium Experience.",
    body: body.length ? body : [asString(row.excerpt) ?? "Latest update from Stadium Experience."],
    coverImage: stripLegacyImageUrl(asString(row.cover_image_url)),
    seo: normaliseNewsSeo(row.seo)
  };
}

async function enrichJobsWithCrests(jobs: JobListing[]): Promise<JobListing[]> {
  if (!jobs.length) {
    return jobs;
  }

  try {
    const clubs = await getPublishedClubDirectory();
    const crestMap = new Map(
      clubs.map((club) => [slugifyClubName(club.name), club.crestUrl ?? null])
    );

    return jobs.map((job) => ({
      ...job,
      crestUrl: crestMap.get(slugifyClubName(job.location)) ?? job.crestUrl ?? null
    }));
  } catch {
    return jobs;
  }
}

async function getVenuesFromPublishedClubPages(): Promise<Venue[]> {
  if (!supabase) {
    return [];
  }

  const primaryQuery = await supabase
    .from("club_pages")
    .select("slug, club_name, crest_url, address, latitude, longitude, summary, key_facts, hero_image_url, published, archived")
    .eq("published", true)
    .eq("archived", false)
    .order("club_name") as { data: SupabaseClubPageAddressRow[] | null; error: unknown };

  let data = primaryQuery.data;
  let error = primaryQuery.error;

  if (error) {
    const fallbackQuery = await supabase
      .from("club_pages")
      .select("slug, club_name, crest_url, address, latitude, longitude, summary, key_facts, hero_image_url, published")
      .eq("published", true)
      .order("club_name") as { data: SupabaseClubPageAddressRow[] | null; error: unknown };

    data = fallbackQuery.data;
    error = fallbackQuery.error;
  }

  if (error || !Array.isArray(data) || !data.length) {
    return [];
  }

  const venues = data.flatMap((row) => {
    const slug = asString(row.slug);
    const name = asString(row.club_name);
    const address = asString(row.address);
    const summary = asString(row.summary);
    const heroImage = getVenueCardImage(asString(row.hero_image_url));
    const crestImage = stripLegacyImageUrl(asString(row.crest_url));
    const eventTypes = ["Meetings", "Conferences"];
    const features = ["Direct venue enquiries", "Published venue details"];
    const spaces: Venue["spaces"] = [];
    const guestCapacity = "Capacity on request";
    const planningFacts = asPlanningFacts(row.key_facts);

    if (!slug || !name) {
      return [];
    }

    const cityMatch = address?.match(/\b([A-Za-z][A-Za-z .'-]+)\s+[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/);
    const city = cityMatch?.[1]?.trim() ?? "UK venue";

    return [{
      slug,
      name,
      city,
      region: "Stadium Experience",
      address: address ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      crestImage: crestImage ?? undefined,
      heroImage,
      summary: summary ?? `Venue details for ${name}.`,
      description:
        `This venue is part of the Stadium Experience network. Browse the venue details and enquire directly for up-to-date event information.`,
      guestCapacityLabel: guestCapacity,
      planningFacts:
        planningFacts.length
          ? planningFacts
          : buildPlanningFacts({
              guestCapacityLabel: guestCapacity,
              eventTypes,
              features,
              spaces
            }),
      eventTypes,
      features,
      spaces,
      contactEmail: "office@stadiumexperience.com"
    } satisfies Venue];
  });

  return venues;
}

function mergeVenueLists(...lists: Venue[][]): Venue[] {
  const merged = new Map<string, Venue>();

  lists.flat().forEach((venue) => {
    const key = venue.slug || slugify(venue.name);

    if (!merged.has(key)) {
      merged.set(key, venue);
      return;
    }

    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, venue);
      return;
    }

    merged.set(key, {
      ...existing,
      ...venue,
      planningFacts: venue.planningFacts?.length ? venue.planningFacts : existing.planningFacts,
      eventTypes: venue.eventTypes?.length ? venue.eventTypes : existing.eventTypes,
      features: venue.features?.length ? venue.features : existing.features,
      spaces: venue.spaces?.length ? venue.spaces : existing.spaces
    });
  });

  return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name, "en"));
}

export async function getVenues(): Promise<Venue[]> {
  if (!supabase) {
    return venues;
  }

  const { data, error } = await supabase
    .from("venues")
    .select("slug, name, city, region, summary, hero_copy, guest_capacity_min, guest_capacity_max, enquiry_email, published")
    .order("name");

  const venueTableRows =
    !error && Array.isArray(data) && data.length
      ? data.filter((row) => getBooleanField(row as GenericRow, ["published"]) !== false).map((row) => mapVenueRow(row as SupabaseVenueRow))
      : [];
  const clubPageVenues = await getVenuesFromPublishedClubPages();
  const mergedVenues = mergeVenueLists(clubPageVenues, venueTableRows);

  if (mergedVenues.length) {
    return mergedVenues;
  }

  return venues;
}

export async function getVenueBySlug(slug: string): Promise<Venue | undefined> {
  const allVenues = await getVenues();
  return allVenues.find((venue) => venue.slug === slug);
}

export async function getLatestNewsPageContent(): Promise<MarketingPageContent> {
  return latestNewsPageContent;
}

export async function getNewsPosts(): Promise<NewsPost[]> {
  if (!supabase) {
    return newsPosts;
  }

  const { data, error } = await supabase
    .from("news_posts")
    .select("slug, title, excerpt, body, cover_image_url, seo, published, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .order("updated_at", { ascending: false });

  if (!error && Array.isArray(data) && data.length) {
    return data.map((row) => mapNewsRow(row as SupabaseNewsRow));
  }

  return newsPosts;
}

export async function resolveNewsPostBySlug(slug: string): Promise<ResolvedNewsPost | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from("news_posts")
      .select("slug, title, excerpt, body, cover_image_url, seo, published, published_at")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (!error && data) {
      return { post: mapNewsRow(data as SupabaseNewsRow) };
    }
  }

  const fallbackPost = newsPosts.find((post) => post.slug === slug);
  return fallbackPost ? { post: fallbackPost } : undefined;
}

export async function getNewsPostBySlug(slug: string): Promise<NewsPost | undefined> {
  return (await resolveNewsPostBySlug(slug))?.post;
}

export async function getJobListings(): Promise<JobListing[]> {
  if (!supabase) {
    return enrichJobsWithCrests(jobListings);
  }

  const { data, error } = await supabase
    .from("stadium_jobs")
    .select("slug, title, location, employment_type, summary, description, content_sections, salary, hours, job_location, closing_date, application_url, contact_email, published")
    .eq("published", true)
    .order("title");

  if (!error && Array.isArray(data) && data.length) {
    return enrichJobsWithCrests(data.map((row) => mapJobRow(row as SupabaseJobRow)));
  }

  return enrichJobsWithCrests(jobListings);
}

export async function getJobBySlug(slug: string): Promise<JobListing | undefined> {
  const jobs = await getJobListings();
  return jobs.find((job) => job.slug === slug);
}

export async function getSuppliersPageContent(): Promise<MarketingPageContent> {
  return suppliersPageContent;
}

export async function getSupplierFeatures(): Promise<SupplierFeature[]> {
  return supplierFeatures;
}
