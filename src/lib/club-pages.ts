import { getClubBySlug, type ClubDirectoryClub } from "./club-directory";
import { fetchLiveClubPage, type ClubContentBlock, type ClubKeyFact, type LiveClubPage } from "./live-club-pages";
import { supabase } from "./supabase";

export type ClubSocialLink = {
  label: string;
  href: string;
};

export type ClubContactDetails = {
  phone: string | null;
  email: string | null;
};

export type ClubPage = {
  club: ClubDirectoryClub;
  venueName: string | null;
  summary: string | null;
  address: string | null;
  websiteUrl: string | null;
  websiteHref: string | null;
  socialLinks: ClubSocialLink[];
  tourBookingHref: string | null;
  nonMatchday: ClubContactDetails | null;
  matchday: ClubContactDetails | null;
  introductionHeading: string | null;
  introduction: string[];
  spaces: ClubContentBlock[];
  events: ClubContentBlock[];
  christmasText: string | null;
  playOnPitchText: string | null;
  toursText: string | null;
  keyFacts: ClubKeyFact[];
  mapEmbedUrl: string | null;
  heroImageUrl: string | null;
  christmasImageUrl: string | null;
  playOnPitchImageUrl: string | null;
  source: "supabase" | "live-fallback";
  sourceUrl: string | null;
};

type SupabaseClubPageRow = {
  slug: string;
  venue_name: string | null;
  summary: string | null;
  address: string | null;
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
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter((item): item is string => Boolean(item)) : [];
}

function asContentBlocks(value: unknown): ClubContentBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const title = asString((item as Record<string, unknown>).title);
      const body = asString((item as Record<string, unknown>).body);
      return title && body ? { title, body } : null;
    })
    .filter((item): item is ClubContentBlock => Boolean(item));
}

function asKeyFacts(value: unknown): ClubKeyFact[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = asString((item as Record<string, unknown>).label);
      const valueText = asString((item as Record<string, unknown>).value);
      return label && valueText ? { label, value: valueText } : null;
    })
    .filter((item): item is ClubKeyFact => Boolean(item));
}

function asSocialLinks(value: unknown): ClubSocialLink[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = asString((item as Record<string, unknown>).label);
      const href = asString((item as Record<string, unknown>).href);
      return label && href ? { label, href } : null;
    })
    .filter((item): item is ClubSocialLink => Boolean(item));
}

function mapSupabaseClubPage(row: SupabaseClubPageRow, club: ClubDirectoryClub): ClubPage {
  return {
    club,
    venueName: asString(row.venue_name),
    summary: asString(row.summary),
    address: asString(row.address),
    websiteUrl: asString(row.website_url),
    websiteHref: asString(row.website_href),
    socialLinks: asSocialLinks(row.social_links),
    tourBookingHref: asString(row.tour_booking_href),
    nonMatchday:
      row.non_matchday_phone || row.non_matchday_email
        ? { phone: asString(row.non_matchday_phone), email: asString(row.non_matchday_email) }
        : null,
    matchday:
      row.matchday_phone || row.matchday_email
        ? { phone: asString(row.matchday_phone), email: asString(row.matchday_email) }
        : null,
    introductionHeading: asString(row.introduction_heading),
    introduction: asStringArray(row.introduction_paragraphs),
    spaces: asContentBlocks(row.spaces),
    events: asContentBlocks(row.events),
    christmasText: asString(row.christmas_text),
    playOnPitchText: asString(row.play_on_pitch_text),
    toursText: asString(row.tours_text),
    keyFacts: asKeyFacts(row.key_facts),
    mapEmbedUrl: asString(row.map_embed_url),
    heroImageUrl: asString(row.hero_image_url),
    christmasImageUrl: asString(row.christmas_image_url),
    playOnPitchImageUrl: asString(row.play_on_pitch_image_url),
    source: "supabase",
    sourceUrl: null
  };
}

function mapLiveClubPage(page: LiveClubPage, club: ClubDirectoryClub): ClubPage {
  return {
    club,
    venueName: page.venueName,
    summary: null,
    address: page.address,
    websiteUrl: page.websiteUrl,
    websiteHref: page.websiteHref,
    socialLinks: page.socialLinks,
    tourBookingHref: page.tourBookingHref,
    nonMatchday: page.nonMatchday,
    matchday: page.matchday,
    introductionHeading: page.introductionHeading,
    introduction: page.introduction,
    spaces: page.spaces,
    events: page.events,
    christmasText: page.christmasText,
    playOnPitchText: page.playOnPitchText,
    toursText: page.toursText,
    keyFacts: page.keyFacts,
    mapEmbedUrl: page.mapEmbedUrl,
    heroImageUrl: page.heroImageUrl,
    christmasImageUrl: page.christmasImageUrl,
    playOnPitchImageUrl: page.playOnPitchImageUrl,
    source: "live-fallback",
    sourceUrl: page.sourceUrl
  };
}

export async function getClubPageBySlug(slug: string): Promise<ClubPage | undefined> {
  const club = await getClubBySlug(slug);

  if (!club) {
    return undefined;
  }

  if (supabase) {
    const { data, error } = await supabase
      .from("club_pages")
      .select(`
        slug,
        venue_name,
        summary,
        address,
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
        published
      `)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle<SupabaseClubPageRow>();

    if (!error && data) {
      return mapSupabaseClubPage(data, club);
    }
  }

  const livePage = await fetchLiveClubPage(club);
  return mapLiveClubPage(livePage, club);
}
