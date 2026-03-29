import type { ClubDirectoryClub } from "./club-directory";
import { resolveImageUrl, stripLegacyImageUrl } from "./media";
import { slugifyClubName } from "./club-slugs";

export type ClubContactDetails = {
  phone: string | null;
  email: string | null;
};

export type ClubContentBlock = {
  title: string;
  body: string;
};

export type ClubKeyFact = {
  label: string;
  value: string;
};

export type LiveClubPage = {
  sourceUrl: string;
  address: string | null;
  websiteUrl: string | null;
  websiteHref: string | null;
  socialLinks: { label: string; href: string }[];
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
  imageUrls: string[];
  heroImageUrl: string | null;
  christmasImageUrl: string | null;
  playOnPitchImageUrl: string | null;
};

const DEFAULT_SITE_URL = "https://stadiumexperience.com";

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;|&#8211;/g, "-")
    .replace(/&mdash;|&#8212;/g, "-")
    .replace(/&hellip;/g, "...")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToLines(html: string): string[] {
  const text = decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<(br|\/p|\/div|\/section|\/article|\/li|\/ul|\/ol|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );

  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function findLineIndex(lines: string[], matcher: (line: string) => boolean): number {
  return lines.findIndex(matcher);
}

function findFirstLine(lines: string[], matcher: (line: string) => boolean): string | null {
  const line = lines.find(matcher);
  return line ?? null;
}

function getSectionLines(lines: string[], startLabel: string, endLabels: string[]): string[] {
  const startIndex = findLineIndex(lines, (line) => line.includes(startLabel));
  if (startIndex === -1) {
    return [];
  }

  const tail = lines.slice(startIndex + 1);
  const endIndex = tail.findIndex((line) => endLabels.some((label) => line.includes(label)));

  return endIndex === -1 ? tail : tail.slice(0, endIndex);
}

function parseContactBlock(lines: string[], heading: string): ClubContactDetails | null {
  const startIndex = findLineIndex(lines, (line) => line.includes(heading));
  if (startIndex === -1) {
    return null;
  }

  const slice = lines.slice(startIndex, startIndex + 8);
  return {
    phone: findFirstLine(slice, (line) => /(?:\+?\d[\d\s()/-]{6,})/.test(line)),
    email: findFirstLine(slice, (line) => /@/.test(line))
  };
}

function looksLikeBlockTitle(line: string): boolean {
  if (line.length > 70) return false;
  if (/[.!?]/.test(line)) return false;
  if (/^(Book Your|Enquire Today|Latest News|Awards|Accreditations|Take a Tour|Brochures)/i.test(line)) {
    return false;
  }
  return /[A-Za-z]/.test(line);
}

function looksLikeSectionHeading(line: string | null): boolean {
  if (!line) return false;
  if (line.length > 80) return false;
  if (/[.!?]/.test(line)) return false;
  if (/^\d/.test(line)) return false;
  return /[A-Za-z]/.test(line);
}

function parseContentBlocks(lines: string[]): ClubContentBlock[] {
  const blocks: ClubContentBlock[] = [];
  let current: ClubContentBlock | null = null;

  for (const line of lines) {
    if (looksLikeBlockTitle(line)) {
      if (current?.body) {
        blocks.push({ ...current, body: current.body.trim() });
      }
      current = { title: line, body: "" };
      continue;
    }

    if (!current) {
      continue;
    }

    current.body = `${current.body} ${line}`.trim();
  }

  if (current?.body) {
    blocks.push({ ...current, body: current.body.trim() });
  }

  return blocks;
}

function parseKeyFacts(lines: string[]): ClubKeyFact[] {
  const facts: ClubKeyFact[] = [];

  for (let index = 0; index < lines.length - 1; index += 2) {
    const value = lines[index];
    const label = lines[index + 1];

    if (!value || !label) {
      continue;
    }

    facts.push({ label, value });
  }

  return facts;
}

function buildMapEmbedUrl(address: string | null): string | null {
  if (!address) {
    return null;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function extractImageUrls(html: string, club: ClubDirectoryClub, baseSiteUrl: string): string[] {
  const imageMatches = Array.from(
    html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi)
  );

  const ignoredPatterns = [
    /logo\.svg/i,
    /icon-award/i,
    /icon-guide/i,
    /icon-member/i,
    /award/i,
    /member/i,
    /guide/i,
    /Stadium_experience_logo/i
  ];

  const normalizedCrest = club.crestUrl?.toLowerCase() ?? null;
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const match of imageMatches) {
    const rawSrc = match[1];
    const alt = match[2] ?? "";
    const absoluteSrc = resolveImageUrl(rawSrc, baseSiteUrl);
    if (!absoluteSrc) {
      continue;
    }
    const lowerSrc = absoluteSrc.toLowerCase();
    const lowerAlt = alt.toLowerCase();

    if (normalizedCrest && lowerSrc === normalizedCrest) {
      continue;
    }

    if (ignoredPatterns.some((pattern) => pattern.test(lowerSrc) || pattern.test(lowerAlt))) {
      continue;
    }

    if (seen.has(absoluteSrc)) {
      continue;
    }

    seen.add(absoluteSrc);
    urls.push(absoluteSrc);
  }

  return urls;
}

function extractFirstImageFromSection(
  html: string,
  startMarker: string,
  endMarkers: string[],
  baseSiteUrl: string
): string | null {
  const startIndex = html.indexOf(startMarker);
  if (startIndex === -1) {
    return null;
  }

  const tail = html.slice(startIndex + startMarker.length);
  let endIndex = tail.length;

  for (const marker of endMarkers) {
    const candidateIndex = tail.indexOf(marker);
    if (candidateIndex !== -1 && candidateIndex < endIndex) {
      endIndex = candidateIndex;
    }
  }

  const sectionHtml = tail.slice(0, endIndex);
  const imageMatch = sectionHtml.match(/<img[^>]+src=["']([^"']+)["']/i);

  return imageMatch ? resolveImageUrl(imageMatch[1], baseSiteUrl) : null;
}

function extractHrefByText(html: string, textPattern: RegExp, baseSiteUrl: string): string | null {
  const match = html.match(new RegExp(`<a[^>]+href=["']([^"']+)["'][^>]*>[\\s\\S]*?${textPattern.source}[\\s\\S]*?<\\/a>`, "i"));
  return match ? resolveImageUrl(match[1], baseSiteUrl) : null;
}

function extractSocialLinks(html: string, baseSiteUrl: string): { label: string; href: string }[] {
  const platforms = [
    { label: "Facebook", pattern: /facebook/i },
    { label: "Instagram", pattern: /instagram/i },
    { label: "LinkedIn", pattern: /linkedin/i },
    { label: "TikTok", pattern: /tiktok/i },
    { label: "X", pattern: /twitter|x\.com/i }
  ];

  return platforms
    .map((platform) => {
      const href = extractHrefByText(html, platform.pattern, baseSiteUrl);
      return href ? { label: platform.label, href } : null;
    })
    .filter((item): item is { label: string; href: string } => Boolean(item));
}

export function parseLiveClubPageHtml(
  html: string,
  club: ClubDirectoryClub,
  sourceUrl: string
): LiveClubPage {
  const lines = htmlToLines(html);
  const clubIndex = findLineIndex(lines, (line) => line === club.name);

  const address = findFirstLine(lines, (line) => /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/i.test(line));
  const websiteUrl = findFirstLine(lines, (line) => /^www\.|^https?:\/\//i.test(line));
  const nonMatchday = parseContactBlock(lines, "Non-Matchday Events");
  const matchday = parseContactBlock(lines, "Matchday Hospitality");

  const rawIntroductionHeading = findFirstLine(lines, (line) => /Venue Hire/i.test(line));
  const introductionHeading = looksLikeSectionHeading(rawIntroductionHeading) ? rawIntroductionHeading : null;
  const introduction = getSectionLines(lines, introductionHeading ?? "", ["Spaces For Hire"]).filter(
    (line) => line !== "Enquire Today"
  );

  const spaces = parseContentBlocks(
    getSectionLines(lines, "Spaces For Hire", ["Events at", "Christmas at", "Play on the Pitch", "Stadium Tours"])
      .filter((line) => line !== "Enquire Today")
  );

  const events = parseContentBlocks(
    getSectionLines(lines, "Events at", ["Christmas at", "Play on the Pitch", "Stadium Tours", "Key Information"])
      .filter((line) => line !== "Enquire Today")
  );

  const christmasLines = getSectionLines(lines, "Christmas at", ["Play on the Pitch", "Stadium Tours", "Key Information"]);
  const playOnPitchLines = getSectionLines(lines, "Play on the Pitch", ["Stadium Tours", "Key Information"]);
  const toursLines = getSectionLines(lines, "Stadium Tours", ["Key Information", "Awards", "Latest News"]);
  const keyFacts = parseKeyFacts(getSectionLines(lines, "Key Information", ["Awards", "Accreditations", "Take a Tour"]));

  return {
    sourceUrl,
    address,
    websiteUrl,
    websiteHref: null,
    socialLinks: [],
    tourBookingHref: null,
    nonMatchday,
    matchday,
    introductionHeading,
    introduction: introduction.slice(0, 4),
    spaces,
    events,
    christmasText: christmasLines.find((line) => line !== "Enquire Today" && !/^Image:/i.test(line)) ?? null,
    playOnPitchText: playOnPitchLines.find((line) => line !== "Enquire Today" && !/^Book/i.test(line)) ?? null,
    toursText: toursLines.find((line) => !/^Book/i.test(line) && !/^Image:/i.test(line)) ?? null,
    keyFacts,
    mapEmbedUrl: buildMapEmbedUrl(address),
    imageUrls: [],
    heroImageUrl: null,
    christmasImageUrl: null,
    playOnPitchImageUrl: null
  };
}

export async function fetchLiveClubPage(
  club: ClubDirectoryClub,
  fetchImpl: typeof fetch = fetch,
  baseSiteUrl = import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL
): Promise<LiveClubPage> {
  const sourceUrl = `${baseSiteUrl.replace(/\/$/, "")}/clubs/${slugifyClubName(club.name)}/`;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: "text/html"
    }
  });

  if (!response.ok) {
    throw new Error(`Club page request failed with status ${response.status}.`);
  }

  const html = await response.text();
  const page = parseLiveClubPageHtml(html, club, sourceUrl);
  const imageUrls = extractImageUrls(html, club, baseSiteUrl)
    .map((imageUrl) => stripLegacyImageUrl(imageUrl, { baseSiteUrl }))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
  const websiteHref =
    extractHrefByText(html, /meeting-and-events|events/i, baseSiteUrl) ??
    (page.websiteUrl ? `https://${page.websiteUrl.replace(/^https?:\/\//, "")}` : null);

  return {
    ...page,
    websiteHref,
    socialLinks: extractSocialLinks(html, baseSiteUrl),
    tourBookingHref: extractHrefByText(html, /Book Your Stadium Tour/i, baseSiteUrl),
    imageUrls,
    heroImageUrl: imageUrls[0] ?? null,
    christmasImageUrl: stripLegacyImageUrl(
      extractFirstImageFromSection(html, "Christmas at", ["Play on the Pitch", "Stadium Tours", "Key Information"], baseSiteUrl),
      { baseSiteUrl }
    ),
    playOnPitchImageUrl: stripLegacyImageUrl(
      extractFirstImageFromSection(html, "Play on the Pitch", ["Stadium Tours", "Key Information", "Awards"], baseSiteUrl),
      { baseSiteUrl }
    )
  };
}
