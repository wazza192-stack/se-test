import { slugifyClubName } from "./club-slugs";

export type ClubPageEditorField =
  | "club_name"
  | "crest_url"
  | "summary"
  | "address"
  | "website_url"
  | "website_href"
  | "tour_booking_href"
  | "non_matchday_phone"
  | "non_matchday_email"
  | "matchday_phone"
  | "matchday_email"
  | "introduction_heading"
  | "christmas_text"
  | "play_on_pitch_text"
  | "tours_text"
  | "map_embed_url"
  | "hero_image_url"
  | "christmas_image_url"
  | "play_on_pitch_image_url";

export type ClubPageEditorRecord = {
  slug: string;
  club_name: string;
  crest_url: string | null;
  summary: string | null;
  address: string | null;
  website_url: string | null;
  website_href: string | null;
  social_links: { label: string; href: string }[];
  tour_booking_href: string | null;
  non_matchday_phone: string | null;
  non_matchday_email: string | null;
  matchday_phone: string | null;
  matchday_email: string | null;
  introduction_heading: string | null;
  introduction_paragraphs: string[];
  spaces: { title: string; body: string }[];
  events: { title: string; body: string }[];
  christmas_text: string | null;
  play_on_pitch_text: string | null;
  tours_text: string | null;
  key_facts: { label: string; value: string }[];
  map_embed_url: string | null;
  hero_image_url: string | null;
  christmas_image_url: string | null;
  play_on_pitch_image_url: string | null;
  published: boolean;
  archived: boolean;
  created_at?: string;
  updated_at?: string;
};

type ClubPageCreatePayload = {
  name?: unknown;
};

type ClubPageUpdatePayload = {
  club_name?: unknown;
  crest_url?: unknown;
  summary?: unknown;
  address?: unknown;
  website_url?: unknown;
  website_href?: unknown;
  social_links?: unknown;
  tour_booking_href?: unknown;
  non_matchday_phone?: unknown;
  non_matchday_email?: unknown;
  matchday_phone?: unknown;
  matchday_email?: unknown;
  introduction_heading?: unknown;
  introduction_paragraphs?: unknown;
  spaces?: unknown;
  events?: unknown;
  christmas_text?: unknown;
  play_on_pitch_text?: unknown;
  tours_text?: unknown;
  key_facts?: unknown;
  map_embed_url?: unknown;
  hero_image_url?: unknown;
  christmas_image_url?: unknown;
  play_on_pitch_image_url?: unknown;
  published?: unknown;
  archived?: unknown;
};

const stringFields: ClubPageEditorField[] = [
  "club_name",
  "crest_url",
  "summary",
  "address",
  "website_url",
  "website_href",
  "tour_booking_href",
  "non_matchday_phone",
  "non_matchday_email",
  "matchday_phone",
  "matchday_email",
  "introduction_heading",
  "christmas_text",
  "play_on_pitch_text",
  "tours_text",
  "map_embed_url",
  "hero_image_url",
  "christmas_image_url",
  "play_on_pitch_image_url"
];

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asString).filter((item): item is string => Boolean(item));
}

function asLinkArray(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const label = asString((item as Record<string, unknown>).label);
      const href = asString((item as Record<string, unknown>).href);

      return label && href ? { label, href } : null;
    })
    .filter((item): item is { label: string; href: string } => Boolean(item));
}

function asBlockArray(value: unknown): { title: string; body: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const title = asString((item as Record<string, unknown>).title);
      const body = asString((item as Record<string, unknown>).body);

      return title && body ? { title, body } : null;
    })
    .filter((item): item is { title: string; body: string } => Boolean(item));
}

function asFactArray(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const label = asString((item as Record<string, unknown>).label);
      const factValue = asString((item as Record<string, unknown>).value);

      return label && factValue ? { label, value: factValue } : null;
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}

export function parseCreateClubPayload(input: unknown): { name: string; slug: string } | null {
  const payload = (input ?? {}) as ClubPageCreatePayload;
  const name = asString(payload.name);

  if (!name) {
    return null;
  }

  return {
    name,
    slug: slugifyClubName(name)
  };
}

type ClubPageUpdateRecord = Partial<Omit<ClubPageEditorRecord, "created_at" | "updated_at">> & {
  slug: string;
  club_name: string;
};

function hasOwnField(payload: ClubPageUpdatePayload, field: keyof ClubPageUpdatePayload): boolean {
  return Object.prototype.hasOwnProperty.call(payload, field);
}

export function parseUpdateClubPayload(input: unknown): ClubPageUpdateRecord | null {
  const payload = (input ?? {}) as ClubPageUpdatePayload;
  const clubName = asString(payload.club_name);

  if (!clubName) {
    return null;
  }

  const record = {
    slug: slugifyClubName(clubName),
    club_name: clubName
  } as ClubPageUpdateRecord;

  for (const field of stringFields) {
    if (field === "club_name" || !hasOwnField(payload, field)) {
      continue;
    }

    record[field] = asString(payload[field]);
  }

  if (hasOwnField(payload, "social_links")) {
    record.social_links = asLinkArray(payload.social_links);
  }

  if (hasOwnField(payload, "introduction_paragraphs")) {
    record.introduction_paragraphs = asStringArray(payload.introduction_paragraphs);
  }

  if (hasOwnField(payload, "spaces")) {
    record.spaces = asBlockArray(payload.spaces);
  }

  if (hasOwnField(payload, "events")) {
    record.events = asBlockArray(payload.events);
  }

  if (hasOwnField(payload, "key_facts")) {
    record.key_facts = asFactArray(payload.key_facts);
  }

  if (hasOwnField(payload, "published")) {
    record.published = asBoolean(payload.published);
  }

  if (hasOwnField(payload, "archived")) {
    record.archived = asBoolean(payload.archived);
  }

  return record;
}

export function makeEmptyClubDraft(name: string, crestUrl: string | null) {
  return {
    slug: slugifyClubName(name),
    club_name: name,
    crest_url: crestUrl,
    summary: null,
    address: null,
    website_url: null,
    website_href: null,
    social_links: [],
    tour_booking_href: null,
    non_matchday_phone: null,
    non_matchday_email: null,
    matchday_phone: null,
    matchday_email: null,
    introduction_heading: "Overview",
    introduction_paragraphs: [],
    spaces: [],
    events: [],
    christmas_text: null,
    play_on_pitch_text: null,
    tours_text: null,
    key_facts: [],
    map_embed_url: null,
    hero_image_url: null,
    christmas_image_url: null,
    play_on_pitch_image_url: null,
    published: false,
    archived: false
  };
}

export function splitParagraphs(value: string): string[] {
  return value
    .split(/\r?\n\r?\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinParagraphs(value: string[] | null | undefined): string {
  return Array.isArray(value) ? value.filter(Boolean).join("\n\n") : "";
}
