import type { SeoMeta } from "../data/site";
import { getClubBySlug, type ClubDirectoryClub } from "./club-directory";
import {
  fetchLiveClubPage,
  type ClubContentBlock,
  type ClubKeyFact,
  type LiveClubPage
} from "./live-club-pages";
import { stripLegacyImageUrl } from "./media";
import { supabase } from "./supabase";

export type ClubPageClub = ClubDirectoryClub & {
  slug: string;
};

export type ClubSocialLink = {
  label: string;
  href: string;
};

export type ClubContactDetails = {
  phone: string | null;
  email: string | null;
};

export type ClubPageSectionItem = ClubContentBlock & {
  imageUrl: string | null;
  imageAlt: string | null;
  cta: ClubSocialLink | null;
};

export type ClubPageContentSection = {
  sectionKey: "spaces" | "events" | "custom";
  eyebrow: string | null;
  heading: string;
  intro: string | null;
  items: ClubPageSectionItem[];
};

export type ClubPageSpecialExperience = {
  experienceKey: "christmas" | "play-on-pitch" | "tours" | "custom";
  eyebrow: string | null;
  title: string;
  summary: string | null;
  body: string[];
  imageUrl: string | null;
  imageAlt: string | null;
  ctas: ClubSocialLink[];
};

export type ClubPage = {
  club: ClubPageClub;
  clubName: string;
  summary: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  websiteHref: string | null;
  socialLinks: ClubSocialLink[];
  primaryCtas: ClubSocialLink[];
  tourBookingHref: string | null;
  nonMatchday: ClubContactDetails | null;
  matchday: ClubContactDetails | null;
  introductionHeading: string | null;
  introduction: string[];
  spaces: ClubContentBlock[];
  events: ClubContentBlock[];
  contentSections: ClubPageContentSection[];
  customSections: ClubPageContentSection[];
  specialExperiences: ClubPageSpecialExperience[];
  christmasText: string | null;
  playOnPitchText: string | null;
  toursText: string | null;
  keyFacts: ClubKeyFact[];
  mapEmbedUrl: string | null;
  heroEyebrow: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  heroCaption: string | null;
  christmasImageUrl: string | null;
  playOnPitchImageUrl: string | null;
  seo: SeoMeta | null;
  source: "supabase" | "live-fallback";
  editorialSource: "supabase-legacy" | "live-fallback";
  sourceUrl: string | null;
};

type SupabaseClubPageRow = {
  slug: string;
  club_name: string | null;
  crest_url: string | null;
  summary: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  website_href: string | null;
  social_links: unknown;
  tour_booking_href: string | null;
  non_matchday_phone: string | null;
  non_matchday_email: string | null;
  matchday_phone: string | null;
  matchday_email: string | null;
  introduction_heading: string | null;
  introduction_paragraphs: unknown;
  spaces: unknown;
  events: unknown;
  christmas_text: string | null;
  play_on_pitch_text: string | null;
  tours_text: string | null;
  key_facts: unknown;
  map_embed_url: string | null;
  hero_image_url: string | null;
  christmas_image_url: string | null;
  play_on_pitch_image_url: string | null;
  published: boolean;
  archived?: boolean;
};

type LegacyClubEditorial = {
  summary: string | null;
  websiteUrl: string | null;
  websiteHref: string | null;
  socialLinks: ClubSocialLink[];
  tourBookingHref: string | null;
  introductionHeading: string | null;
  introduction: string[];
  spaces: ClubContentBlock[];
  events: ClubContentBlock[];
  contentSections: ClubPageContentSection[];
  specialExperiences: ClubPageSpecialExperience[];
  christmasText: string | null;
  playOnPitchText: string | null;
  toursText: string | null;
  mapEmbedUrl: string | null;
  heroImageUrl: string | null;
  christmasImageUrl: string | null;
  playOnPitchImageUrl: string | null;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => asString(item)).filter((item): item is string => Boolean(item))
    : [];
}

function asContentBlocks(value: unknown): ClubContentBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const title = asString(record.title);
      const body = asString(record.body);

      return title && body ? { title, body } : null;
    })
    .filter((item): item is ClubContentBlock => Boolean(item));
}

function asKeyFacts(value: unknown): ClubKeyFact[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const label = asString(record.label);
      const valueText = asString(record.value);

      return label && valueText ? { label, value: valueText } : null;
    })
    .filter((item): item is ClubKeyFact => Boolean(item));
}

function asSocialLinks(value: unknown): ClubSocialLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const label = asString(record.label);
      const href = asString(record.href);

      return label && href ? { label, href } : null;
    })
    .filter((item): item is ClubSocialLink => Boolean(item));
}

function buildContactDetails(phone: unknown, email: unknown): ClubContactDetails | null {
  const contactPhone = asString(phone);
  const contactEmail = asString(email);

  if (!contactPhone && !contactEmail) {
    return null;
  }

  return {
    phone: contactPhone,
    email: contactEmail
  };
}

function normalizeWebsiteHref(websiteUrl: string | null, websiteHref: string | null): string | null {
  if (websiteHref) {
    return websiteHref;
  }

  if (!websiteUrl) {
    return null;
  }

  return /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl.replace(/^https?:\/\//i, "")}`;
}

function buildMapEmbedUrl(address: string | null): string | null {
  if (!address) {
    return null;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function mapBlocksToSectionItems(blocks: ClubContentBlock[]): ClubPageSectionItem[] {
  return blocks.map((block) => ({
    ...block,
    imageUrl: null,
    imageAlt: null,
    cta: null
  }));
}

function findSpecialExperience(
  experiences: ClubPageSpecialExperience[],
  key: ClubPageSpecialExperience["experienceKey"]
): ClubPageSpecialExperience | undefined {
  return experiences.find((experience) => experience.experienceKey === key);
}

function getExperienceText(experience: ClubPageSpecialExperience | undefined): string | null {
  if (!experience) {
    return null;
  }

  return experience.summary ?? experience.body[0] ?? null;
}

function deriveTourBookingHref(ctas: ClubSocialLink[]): string | null {
  return ctas.find((cta) => /tour|book/i.test(cta.label))?.href ?? null;
}

function buildLegacyExperience(
  experienceKey: ClubPageSpecialExperience["experienceKey"],
  title: string,
  summary: string | null,
  imageUrl: string | null,
  ctas: ClubSocialLink[] = []
): ClubPageSpecialExperience | null {
  if (!summary) {
    return null;
  }

  return {
    experienceKey,
    eyebrow:
      experienceKey === "play-on-pitch"
        ? "Play on the pitch"
        : experienceKey === "tours"
          ? "Stadium tours"
          : "Christmas",
    title,
    summary,
    body: [summary],
    imageUrl,
    imageAlt: null,
    ctas
  };
}

function mapLegacySupabaseEditorial(row: SupabaseClubPageRow): LegacyClubEditorial {
  const websiteUrl = asString(row.website_url);
  const websiteHref = normalizeWebsiteHref(websiteUrl, asString(row.website_href));
  const spaces = asContentBlocks(row.spaces);
  const events = asContentBlocks(row.events);
  const tourBookingHref = asString(row.tour_booking_href);
  const specialExperiences = [
    buildLegacyExperience("christmas", "Festive events", asString(row.christmas_text), stripLegacyImageUrl(asString(row.christmas_image_url))),
    buildLegacyExperience(
      "play-on-pitch",
      "Experiences and hospitality",
      asString(row.play_on_pitch_text),
      stripLegacyImageUrl(asString(row.play_on_pitch_image_url))
    ),
    buildLegacyExperience("tours", "Take a tour", asString(row.tours_text), null, tourBookingHref ? [{
      label: "Book a Tour",
      href: tourBookingHref
    }] : [])
  ].filter((item): item is ClubPageSpecialExperience => Boolean(item));

  return {
    summary: asString(row.summary),
    websiteUrl,
    websiteHref,
    socialLinks: asSocialLinks(row.social_links),
    tourBookingHref,
    introductionHeading: asString(row.introduction_heading),
    introduction: asStringArray(row.introduction_paragraphs),
    spaces,
    events,
    contentSections: [
      ...(spaces.length
        ? [{
            sectionKey: "spaces" as const,
            eyebrow: "Spaces for hire",
            heading: "Spaces available",
            intro: null,
            items: mapBlocksToSectionItems(spaces)
          }]
        : []),
      ...(events.length
        ? [{
            sectionKey: "events" as const,
            eyebrow: "Events",
            heading: "Popular event types",
            intro: null,
            items: mapBlocksToSectionItems(events)
          }]
        : [])
    ],
    specialExperiences,
    christmasText: asString(row.christmas_text),
    playOnPitchText: asString(row.play_on_pitch_text),
    toursText: asString(row.tours_text),
    mapEmbedUrl: asString(row.map_embed_url),
    heroImageUrl: stripLegacyImageUrl(asString(row.hero_image_url)),
    christmasImageUrl: stripLegacyImageUrl(asString(row.christmas_image_url)),
    playOnPitchImageUrl: stripLegacyImageUrl(asString(row.play_on_pitch_image_url))
  };
}

function mapLiveEditorial(page: LiveClubPage): LegacyClubEditorial {
  const spaces = page.spaces;
  const events = page.events;

  return {
    summary: null,
    websiteUrl: page.websiteUrl,
    websiteHref: normalizeWebsiteHref(page.websiteUrl, page.websiteHref),
    socialLinks: page.socialLinks,
    tourBookingHref: page.tourBookingHref,
    introductionHeading: page.introductionHeading,
    introduction: page.introduction,
    spaces,
    events,
    contentSections: [
      ...(spaces.length
        ? [{
            sectionKey: "spaces" as const,
            eyebrow: "Spaces for hire",
            heading: "Spaces available",
            intro: null,
            items: mapBlocksToSectionItems(spaces)
          }]
        : []),
      ...(events.length
        ? [{
            sectionKey: "events" as const,
            eyebrow: "Events",
            heading: "Popular event types",
            intro: null,
            items: mapBlocksToSectionItems(events)
          }]
        : [])
    ],
    specialExperiences: [
      buildLegacyExperience("christmas", "Festive events", page.christmasText, page.christmasImageUrl),
      buildLegacyExperience("play-on-pitch", "Experiences and hospitality", page.playOnPitchText, page.playOnPitchImageUrl),
      buildLegacyExperience("tours", "Take a tour", page.toursText, null, page.tourBookingHref ? [{
        label: "Book a Tour",
        href: page.tourBookingHref
      }] : [])
    ].filter((item): item is ClubPageSpecialExperience => Boolean(item)),
    christmasText: page.christmasText,
    playOnPitchText: page.playOnPitchText,
    toursText: page.toursText,
    mapEmbedUrl: page.mapEmbedUrl,
    heroImageUrl: page.heroImageUrl,
    christmasImageUrl: page.christmasImageUrl,
    playOnPitchImageUrl: page.playOnPitchImageUrl
  };
}

function buildClub(slug: string, directoryClub: ClubDirectoryClub | undefined, row: SupabaseClubPageRow | null): ClubPageClub | null {
  const name = asString(row?.club_name) ?? directoryClub?.name ?? null;

  if (!name) {
    return null;
  }

  return {
    slug,
    name,
    crestUrl: stripLegacyImageUrl(asString(row?.crest_url)) ?? directoryClub?.crestUrl ?? null
  };
}

function composeClubPage(options: {
  slug: string;
  club: ClubPageClub;
  supabaseRow: SupabaseClubPageRow | null;
  livePage: LiveClubPage | null;
}): ClubPage {
  const { slug, club, supabaseRow, livePage } = options;
  const legacyEditorial = supabaseRow ? mapLegacySupabaseEditorial(supabaseRow) : null;
  const liveEditorial = livePage ? mapLiveEditorial(livePage) : null;
  const fallbackEditorial = legacyEditorial ?? liveEditorial;
  const specialExperiences = fallbackEditorial?.specialExperiences ?? [];
  const christmasExperience = findSpecialExperience(specialExperiences, "christmas");
  const playOnPitchExperience = findSpecialExperience(specialExperiences, "play-on-pitch");
  const toursExperience = findSpecialExperience(specialExperiences, "tours");
  const websiteUrl = fallbackEditorial?.websiteUrl ?? null;
  const websiteHref = normalizeWebsiteHref(websiteUrl, fallbackEditorial?.websiteHref ?? null);
  const primaryCtas: ClubSocialLink[] = [];
  const socialLinks = fallbackEditorial?.socialLinks ?? [];
  const address = asString(supabaseRow?.address) ?? livePage?.address ?? null;
  const keyFacts = supabaseRow ? asKeyFacts(supabaseRow.key_facts) : (livePage?.keyFacts ?? []);

  return {
    club,
    clubName: club.name,
    summary: fallbackEditorial?.summary ?? null,
    address,
    latitude: asNumber(supabaseRow?.latitude) ?? null,
    longitude: asNumber(supabaseRow?.longitude) ?? null,
    websiteUrl,
    websiteHref,
    socialLinks,
    primaryCtas,
    tourBookingHref: deriveTourBookingHref(primaryCtas) ?? fallbackEditorial?.tourBookingHref ?? null,
    nonMatchday: buildContactDetails(supabaseRow?.non_matchday_phone, supabaseRow?.non_matchday_email) ?? livePage?.nonMatchday ?? null,
    matchday: buildContactDetails(supabaseRow?.matchday_phone, supabaseRow?.matchday_email) ?? livePage?.matchday ?? null,
    introductionHeading: fallbackEditorial?.introductionHeading ?? `Why planners choose ${club.name}`,
    introduction:
      fallbackEditorial?.introduction.length ? fallbackEditorial.introduction : [],
    spaces: fallbackEditorial?.spaces ?? [],
    events: fallbackEditorial?.events ?? [],
    contentSections: fallbackEditorial?.contentSections ?? [],
    customSections: [],
    specialExperiences,
    christmasText: getExperienceText(christmasExperience) ?? fallbackEditorial?.christmasText ?? null,
    playOnPitchText: getExperienceText(playOnPitchExperience) ?? fallbackEditorial?.playOnPitchText ?? null,
    toursText: getExperienceText(toursExperience) ?? fallbackEditorial?.toursText ?? null,
    keyFacts,
    mapEmbedUrl: fallbackEditorial?.mapEmbedUrl ?? buildMapEmbedUrl(address),
    heroEyebrow: null,
    heroImageUrl: fallbackEditorial?.heroImageUrl ?? null,
    heroImageAlt: null,
    heroCaption: null,
    christmasImageUrl: christmasExperience?.imageUrl ?? fallbackEditorial?.christmasImageUrl ?? null,
    playOnPitchImageUrl: playOnPitchExperience?.imageUrl ?? fallbackEditorial?.playOnPitchImageUrl ?? null,
    seo: null,
    source: supabaseRow ? "supabase" : "live-fallback",
    editorialSource: supabaseRow ? "supabase-legacy" : "live-fallback",
    sourceUrl: livePage?.sourceUrl ?? null
  };
}

async function getPublishedSupabaseClubPageRow(slug: string): Promise<SupabaseClubPageRow | null> {
  if (!supabase) {
    return null;
  }

  const selectFields = `
    slug,
    club_name,
    crest_url,
    summary,
    address,
    latitude,
    longitude,
    website_url,
    website_href,
    social_links,
    tour_booking_href,
    non_matchday_phone,
    non_matchday_email,
    matchday_phone,
    matchday_email,
    introduction_heading,
    introduction_paragraphs,
    spaces,
    events,
    christmas_text,
    play_on_pitch_text,
    tours_text,
    key_facts,
    map_embed_url,
    hero_image_url,
    christmas_image_url,
    play_on_pitch_image_url,
    published,
    archived
  `;

  const primaryQuery = await supabase
    .from("club_pages")
    .select(selectFields)
    .eq("slug", slug)
    .eq("published", true)
    .eq("archived", false)
    .maybeSingle<SupabaseClubPageRow>();

  if (!primaryQuery.error) {
    return primaryQuery.data ?? null;
  }

  const fallbackQuery = await supabase
    .from("club_pages")
    .select(selectFields.replace(",\n    archived", ""))
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle<SupabaseClubPageRow>();

  return fallbackQuery.error ? null : (fallbackQuery.data ?? null);
}

export async function getClubPageBySlug(slug: string): Promise<ClubPage | undefined> {
  const [clubResult, supabaseResult] = await Promise.allSettled([
    getClubBySlug(slug),
    getPublishedSupabaseClubPageRow(slug)
  ]);

  const directoryClub = clubResult.status === "fulfilled" ? clubResult.value : undefined;
  const supabaseRow = supabaseResult.status === "fulfilled" ? supabaseResult.value : null;

  if (clubResult.status === "rejected") {
    console.error(`Unable to load club directory data for "${slug}"`, clubResult.reason);
  }

  if (supabaseResult.status === "rejected") {
    console.error(`Unable to load Supabase club page data for "${slug}"`, supabaseResult.reason);
  }

  const club = buildClub(slug, directoryClub, supabaseRow);

  if (!club) {
    return undefined;
  }

  if (supabaseRow) {
    return composeClubPage({
      slug,
      club,
      supabaseRow,
      livePage: null
    });
  }

  const livePage = await fetchLiveClubPage(club);

  return composeClubPage({
    slug,
    club,
    supabaseRow: null,
    livePage
  });
}
