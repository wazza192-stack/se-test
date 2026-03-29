import type {
  AwardsCategory,
  AwardsFaqItem,
  AwardsLink,
  AwardsPage,
  AwardsProgramme,
  AwardsSectionBlock,
  AwardsSponsor,
  AwardsStat,
  AwardsTimelineItem
} from "../data/awards";

type GenericRow = Record<string, unknown>;

export function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => asString(item)).filter((item): item is string => Boolean(item));
}

export function asLinks(value: unknown): AwardsLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as GenericRow;
      const label = asString(row.label);
      const href = asString(row.href);

      return label && href
        ? {
            label,
            href,
            description: asString(row.description) ?? undefined,
            external: row.external === true
          }
        : null;
    })
    .filter((item): item is AwardsLink => Boolean(item));
}

export function asStats(value: unknown): AwardsStat[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as GenericRow;
      const label = asString(row.label);
      const statValue = asString(row.value);

      return label && statValue
        ? {
            label,
            value: statValue,
            detail: asString(row.detail) ?? undefined
          }
        : null;
    })
    .filter((item): item is AwardsStat => Boolean(item));
}

export function asTimeline(value: unknown): AwardsTimelineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as GenericRow;
      const label = asString(row.label);
      const timelineValue = asString(row.value);

      return label && timelineValue
        ? {
            label,
            value: timelineValue,
            detail: asString(row.detail) ?? undefined
          }
        : null;
    })
    .filter((item): item is AwardsTimelineItem => Boolean(item));
}

export function asSponsors(value: unknown): AwardsSponsor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as GenericRow;
      const name = asString(row.name);

      return name
        ? {
            name,
            href: asString(row.href) ?? undefined,
            logoUrl: asString(row.logoUrl ?? row.logo_url) ?? undefined,
            description: asString(row.description) ?? undefined,
            meta: asString(row.meta) ?? undefined
          }
        : null;
    })
    .filter((item): item is AwardsSponsor => Boolean(item));
}

export function asFaqItems(value: unknown): AwardsFaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as GenericRow;
      const question = asString(row.question);
      const answer = asString(row.answer);

      return question && answer ? { question, answer } : null;
    })
    .filter((item): item is AwardsFaqItem => Boolean(item));
}

export function asSections(value: unknown): AwardsSectionBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as GenericRow;
      const heading = asString(row.heading);
      const body = asStringArray(row.body);
      const tone = asString(row.tone);

      return heading && body.length
        ? {
            eyebrow: asString(row.eyebrow) ?? undefined,
            heading,
            body,
            items: asStringArray(row.items),
            imageUrl: asString(row.imageUrl ?? row.image_url) ?? undefined,
            imageAlt: asString(row.imageAlt ?? row.image_alt) ?? undefined,
            tone: tone === "callout" ? "callout" : "default"
          }
        : null;
    })
    .filter((item): item is AwardsSectionBlock => Boolean(item));
}

export function mapAwardsProgramme(row: Record<string, unknown>): AwardsProgramme {
  return {
    slug: asString(row.slug) ?? "awards-programme",
    pageType: "programme",
    yearLabel: asString(row.year_label) ?? "Awards",
    heroEyebrow: asString(row.hero_eyebrow) ?? "Awards",
    title: asString(row.title) ?? "Awards programme",
    summary: asString(row.summary) ?? "Awards programme information",
    heroImageUrl: asString(row.hero_image_url),
    heroLabel: asString(row.hero_label),
    statusText: asString(row.status_text),
    eventDateText: asString(row.event_date_text),
    venueName: asString(row.venue_name),
    venueCity: asString(row.venue_city),
    intro: asStringArray(row.intro),
    highlights: asStringArray(row.highlights),
    stats: asStats(row.stats),
    timeline: asTimeline(row.timeline),
    ctaLinks: asLinks(row.cta_links),
    mediaLinks: asLinks(row.media_links),
    sponsorsTitle: asString(row.sponsors_title),
    sponsorsSummary: asString(row.sponsors_summary),
    sponsors: asSponsors(row.sponsors),
    sections: asSections(row.sections),
    archiveLinks: asLinks(row.archive_links),
    categoryIntroTitle: asString(row.category_intro_title),
    categoryIntroSummary: asString(row.category_intro_summary),
    published: row.published === true,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0
  };
}

export function mapAwardsPage(row: Record<string, unknown>): AwardsPage {
  const pageType = asString(row.page_type);

  return {
    slug: asString(row.slug) ?? "awards-page",
    pageType: pageType === "faq" ? "faq" : pageType === "landing" ? "landing" : "standard",
    programmeSlug: asString(row.programme_slug),
    heroEyebrow: asString(row.hero_eyebrow) ?? "Awards",
    title: asString(row.title) ?? "Awards page",
    summary: asString(row.summary) ?? "Awards page information",
    heroImageUrl: asString(row.hero_image_url),
    heroLabel: asString(row.hero_label),
    statusText: asString(row.status_text),
    intro: asStringArray(row.intro),
    highlights: asStringArray(row.highlights),
    stats: asStats(row.stats),
    timeline: asTimeline(row.timeline),
    ctaLinks: asLinks(row.cta_links),
    mediaLinks: asLinks(row.media_links),
    sponsorsTitle: asString(row.sponsors_title),
    sponsorsSummary: asString(row.sponsors_summary),
    sponsors: asSponsors(row.sponsors),
    sections: asSections(row.sections),
    faqItems: asFaqItems(row.faq_items),
    archiveLinks: asLinks(row.archive_links),
    published: row.published === true,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0
  };
}

export function mapAwardsCategory(row: Record<string, unknown>): AwardsCategory {
  return {
    slug: asString(row.slug) ?? "awards-category",
    programmeSlug: asString(row.programme_slug) ?? "2026-awards",
    heroEyebrow: asString(row.hero_eyebrow) ?? "Award category",
    title: asString(row.title) ?? "Award category",
    shortTitle: asString(row.short_title) ?? asString(row.title) ?? "Category",
    summary: asString(row.summary) ?? "Award category information",
    heroImageUrl: asString(row.hero_image_url),
    statusText: asString(row.status_text),
    eligibilityText: asString(row.eligibility_text),
    openedText: asString(row.opened_text),
    closesText: asString(row.closes_text),
    sponsorName: asString(row.sponsor_name),
    sponsorDescription: asString(row.sponsor_description),
    sponsorUrl: asString(row.sponsor_url),
    sponsorLogoUrl: asString(row.sponsor_logo_url),
    stats: asStats(row.stats),
    timeline: asTimeline(row.timeline),
    criteriaIntro: asString(row.criteria_intro) ?? "",
    criteriaPoints: asStringArray(row.criteria_points),
    submissionText: asString(row.submission_text),
    judgingText: asString(row.judging_text),
    resultsText: asString(row.results_text),
    mediaLinks: asLinks(row.media_links),
    ctaLinks: asLinks(row.cta_links),
    sections: asSections(row.sections),
    published: row.published === true,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0
  };
}
