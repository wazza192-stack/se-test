import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_OLD_SITE_URL = "https://stadiumexperience.com";

const SLUG_OVERRIDES = {
  "barclays-hampden-stadium": ["hampden-park-stadium"],
  "birmingham-bears-cricket-club-edgbaston": ["birmingham-bears-cricket-club"],
  "brighton-and-hove-albion-football-club": ["brighton-hove-albion-football-club"],
  "hull-fc-rugby-club": ["hull-rugby-club"],
  "london-stadium": ["west-ham-united-fc"],
  "nottinghamshire-cricket-club-trent-bridge": ["nottinghamshire-cricket-club", "trent-bridge"],
  "st-helens-rfc": ["st-helens-rugby-club"]
};

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  return argv.reduce(
    (options, arg) => {
      if (arg === "--force") {
        return { ...options, force: true };
      }

      if (arg === "--create-missing") {
        return { ...options, createMissing: true };
      }

      if (arg === "--dry-run") {
        return { ...options, dryRun: true };
      }

      if (arg.startsWith("--limit=")) {
        const value = Number(arg.slice("--limit=".length));
        return Number.isFinite(value) && value > 0 ? { ...options, limit: value } : options;
      }

      if (arg.startsWith("--only=")) {
        const slugs = arg
          .slice("--only=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

        return slugs.length ? { ...options, only: unique([...options.only, ...slugs]) } : options;
      }

      if (arg.startsWith("--site=")) {
        const siteUrl = arg.slice("--site=".length).trim();
        return siteUrl ? { ...options, siteUrl } : options;
      }

      return options;
    },
    {
      force: false,
      createMissing: false,
      dryRun: false,
      limit: null,
      only: [],
      siteUrl: process.env.OLD_SITE_URL || DEFAULT_OLD_SITE_URL
    }
  );
}

function slugifyClubName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function asString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function decodeHtmlEntities(input) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;|&#8211;/g, "-")
    .replace(/&mdash;|&#8212;/g, "-")
    .replace(/&hellip;/g, "...")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToLines(html) {
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

function findLineIndex(lines, matcher) {
  return lines.findIndex(matcher);
}

function findFirstLine(lines, matcher) {
  const line = lines.find(matcher);
  return line ?? null;
}

function getSectionLines(lines, startLabel, endLabels) {
  if (!startLabel) {
    return [];
  }

  const startIndex = findLineIndex(lines, (line) => line.includes(startLabel));

  if (startIndex === -1) {
    return [];
  }

  const tail = lines.slice(startIndex + 1);
  const endIndex = tail.findIndex((line) => endLabels.some((label) => line.includes(label)));

  return endIndex === -1 ? tail : tail.slice(0, endIndex);
}

function parseContactBlock(lines, heading) {
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

function looksLikeBlockTitle(line) {
  if (line.length > 70) return false;
  if (/[.!?]/.test(line)) return false;
  if (/^(Book Your|Enquire Today|Latest News|Awards|Accreditations|Take a Tour|Brochures)/i.test(line)) {
    return false;
  }
  return /[A-Za-z]/.test(line);
}

function looksLikeSectionHeading(line) {
  if (!line) return false;
  if (line.length > 80) return false;
  if (/[.!?]/.test(line)) return false;
  if (/^\d/.test(line)) return false;
  return /[A-Za-z]/.test(line);
}

function parseContentBlocks(lines) {
  const blocks = [];
  let current = null;

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

function parseKeyFacts(lines) {
  const facts = [];

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

function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLine(value) {
  const cleaned = normalizeWhitespace(value)
    .replace(/^[-:|]+/, "")
    .replace(/^(enquire today|book your event|book now)$/i, "")
    .trim();

  return cleaned || null;
}

function cleanParagraph(value, maxLength = 420) {
  const cleaned = cleanLine(value);

  if (!cleaned) {
    return null;
  }

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, "").trim()}...`;
}

function uniqueText(values) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const cleaned = cleanLine(value);

    if (!cleaned) {
      continue;
    }

    const key = cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function normalizeSectionHeading(value, fallback = "Overview") {
  const cleaned = cleanLine(value);

  if (!cleaned) {
    return fallback;
  }

  if (/venue hire|about|overview/i.test(cleaned)) {
    return fallback;
  }

  return cleaned;
}

function sanitizeParagraphs(values, limit = 4) {
  return uniqueText(values)
    .map((value) => cleanParagraph(value, 480))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeContentBlocks(values, limit = 8) {
  return (Array.isArray(values) ? values : [])
    .map((item) => {
      const title = cleanLine(item?.title);
      const body = cleanParagraph(item?.body, 280);

      if (!title || !body) {
        return null;
      }

      if (/^(enquire today|book your event|book now)$/i.test(title)) {
        return null;
      }

      return { title, body };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeFacts(values, limit = 12) {
  const seen = new Set();
  const facts = [];

  for (const fact of Array.isArray(values) ? values : []) {
    const label = cleanLine(fact?.label);
    const value = cleanLine(fact?.value);

    if (!label || !value) {
      continue;
    }

    const key = label.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    facts.push({ label, value });
  }

  return facts.slice(0, limit);
}

function buildTemplateReadyImport(imported) {
  const introduction = sanitizeParagraphs(imported.introduction, 4);
  const summarySource = introduction[0] ?? imported.christmasText ?? imported.playOnPitchText ?? imported.toursText ?? null;

  return {
    ...imported,
    introductionHeading: normalizeSectionHeading(imported.introductionHeading, "Overview"),
    introduction,
    summary: cleanParagraph(summarySource, 180),
    spaces: sanitizeContentBlocks(imported.spaces, 10),
    events: sanitizeContentBlocks(imported.events, 8),
    christmasText: cleanParagraph(imported.christmasText, 320),
    playOnPitchText: cleanParagraph(imported.playOnPitchText, 320),
    toursText: cleanParagraph(imported.toursText, 320),
    keyFacts: sanitizeFacts(imported.keyFacts, 12)
  };
}

function buildMapEmbedUrl(address) {
  if (!address) {
    return null;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function normalizeImageUrl(src, baseSiteUrl) {
  if (!src) {
    return null;
  }

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  return `${baseSiteUrl.replace(/\/$/, "")}/${src.replace(/^\//, "")}`;
}

function extractImageUrls(html, club, baseSiteUrl) {
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
    /stadium_experience_logo/i
  ];

  const normalizedCrest = club.crestUrl?.toLowerCase() ?? null;
  const seen = new Set();
  const urls = [];

  for (const match of imageMatches) {
    const rawSrc = match[1];
    const alt = match[2] ?? "";
    const absoluteSrc = normalizeImageUrl(rawSrc, baseSiteUrl);

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

function extractFirstImageFromSection(html, startMarker, endMarkers, baseSiteUrl) {
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

  return imageMatch ? normalizeImageUrl(imageMatch[1], baseSiteUrl) : null;
}

function extractHrefByText(html, textPattern, baseSiteUrl) {
  const match = html.match(new RegExp(`<a[^>]+href=["']([^"']+)["'][^>]*>[\\s\\S]*?${textPattern.source}[\\s\\S]*?<\\/a>`, "i"));
  return match ? normalizeImageUrl(match[1], baseSiteUrl) : null;
}

function extractSocialLinks(html, baseSiteUrl) {
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
    .filter(Boolean);
}

function parseLiveClubPageHtml(html, club, sourceUrl, baseSiteUrl) {
  const lines = htmlToLines(html);
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
    getSectionLines(lines, "Spaces For Hire", ["Events at", "Christmas at", "Play on the Pitch", "Stadium Tours"]).filter(
      (line) => line !== "Enquire Today"
    )
  );
  const events = parseContentBlocks(
    getSectionLines(lines, "Events at", ["Christmas at", "Play on the Pitch", "Stadium Tours", "Key Information"]).filter(
      (line) => line !== "Enquire Today"
    )
  );
  const christmasLines = getSectionLines(lines, "Christmas at", ["Play on the Pitch", "Stadium Tours", "Key Information"]);
  const playOnPitchLines = getSectionLines(lines, "Play on the Pitch", ["Stadium Tours", "Key Information"]);
  const toursLines = getSectionLines(lines, "Stadium Tours", ["Key Information", "Awards", "Latest News"]);
  const keyFacts = parseKeyFacts(getSectionLines(lines, "Key Information", ["Awards", "Accreditations", "Take a Tour"]));
  const socialLinks = extractSocialLinks(html, baseSiteUrl);
  const tourBookingHref = extractHrefByText(html, /take a tour|book a tour/i, baseSiteUrl);
  const imageUrls = extractImageUrls(html, club, baseSiteUrl);
  const heroImageUrl = imageUrls[0] ?? null;
  const christmasImageUrl = extractFirstImageFromSection(
    html,
    "Christmas at",
    ["Play on the Pitch", "Stadium Tours", "Key Information", "Awards"],
    baseSiteUrl
  );
  const playOnPitchImageUrl = extractFirstImageFromSection(
    html,
    "Play on the Pitch",
    ["Stadium Tours", "Key Information", "Awards"],
    baseSiteUrl
  );

  return {
    sourceUrl,
    address,
    websiteUrl,
    websiteHref: websiteUrl ? (websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl.replace(/^https?:\/\//, "")}`) : null,
    socialLinks,
    tourBookingHref,
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
    heroImageUrl,
    christmasImageUrl,
    playOnPitchImageUrl
  };
}

function hasContent(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return Boolean(asString(value));
}

function getMissingImportFields(row) {
  const fieldChecks = [
    { key: "summary", label: "summary" },
    { key: "address", label: "address" },
    { key: "website_url", label: "website_url" },
    { key: "introduction_paragraphs", label: "introduction" },
    { key: "spaces", label: "spaces" },
    { key: "events", label: "events" },
    { key: "key_facts", label: "key_facts" },
    { key: "hero_image_url", label: "hero_image" }
  ];

  return fieldChecks
    .filter((field) => !hasContent(row[field.key]))
    .map((field) => field.label);
}

function pickImportedValue(existingValue, importedValue, force) {
  if (!hasContent(importedValue)) {
    return existingValue ?? importedValue ?? null;
  }

  if (force || !hasContent(existingValue)) {
    return importedValue;
  }

  return existingValue;
}

function toImportPayload(existingRow, imported, force) {
  const templateReadyImport = buildTemplateReadyImport(imported);
  const introductionParagraphs = Array.isArray(templateReadyImport.introduction)
    ? templateReadyImport.introduction.filter(Boolean)
    : [];

  return {
    slug: existingRow.slug,
    club_name: existingRow.club_name,
    crest_url: pickImportedValue(existingRow.crest_url, existingRow.crest_url, force),
    summary: pickImportedValue(existingRow.summary, templateReadyImport.summary ?? null, force),
    address: pickImportedValue(existingRow.address, templateReadyImport.address, force),
    website_url: pickImportedValue(existingRow.website_url, templateReadyImport.websiteUrl, force),
    website_href: pickImportedValue(existingRow.website_href, templateReadyImport.websiteHref, force),
    social_links: pickImportedValue(existingRow.social_links, templateReadyImport.socialLinks, force) ?? [],
    tour_booking_href: pickImportedValue(existingRow.tour_booking_href, templateReadyImport.tourBookingHref, force),
    non_matchday_phone: pickImportedValue(existingRow.non_matchday_phone, templateReadyImport.nonMatchday?.phone ?? null, force),
    non_matchday_email: pickImportedValue(existingRow.non_matchday_email, templateReadyImport.nonMatchday?.email ?? null, force),
    matchday_phone: pickImportedValue(existingRow.matchday_phone, templateReadyImport.matchday?.phone ?? null, force),
    matchday_email: pickImportedValue(existingRow.matchday_email, templateReadyImport.matchday?.email ?? null, force),
    introduction_heading: pickImportedValue(existingRow.introduction_heading, templateReadyImport.introductionHeading ?? "Overview", force),
    introduction_paragraphs: pickImportedValue(existingRow.introduction_paragraphs, introductionParagraphs, force) ?? [],
    spaces: pickImportedValue(existingRow.spaces, templateReadyImport.spaces, force) ?? [],
    events: pickImportedValue(existingRow.events, templateReadyImport.events, force) ?? [],
    christmas_text: pickImportedValue(existingRow.christmas_text, templateReadyImport.christmasText, force),
    play_on_pitch_text: pickImportedValue(existingRow.play_on_pitch_text, templateReadyImport.playOnPitchText, force),
    tours_text: pickImportedValue(existingRow.tours_text, templateReadyImport.toursText, force),
    key_facts: pickImportedValue(existingRow.key_facts, templateReadyImport.keyFacts, force) ?? [],
    map_embed_url: pickImportedValue(existingRow.map_embed_url, templateReadyImport.mapEmbedUrl, force),
    hero_image_url: pickImportedValue(existingRow.hero_image_url, templateReadyImport.heroImageUrl, force),
    christmas_image_url: pickImportedValue(existingRow.christmas_image_url, templateReadyImport.christmasImageUrl, force),
    play_on_pitch_image_url: pickImportedValue(existingRow.play_on_pitch_image_url, templateReadyImport.playOnPitchImageUrl, force)
  };
}

function buildCandidateSlugs(slug, clubName) {
  const strippedName = clubName.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();

  return unique([
    slug,
    ...(SLUG_OVERRIDES[slug] ?? []),
    strippedName ? slugifyClubName(strippedName) : null,
    clubName ? slugifyClubName(clubName) : null
  ]);
}

async function fetchClubDirectory(endpoint) {
  if (!endpoint) {
    throw new Error("PUBLIC_CLUB_DIRECTORY_URL is not configured.");
  }

  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Club directory request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const clubs = Array.isArray(data?.clubs) ? data.clubs : [];

  return clubs
    .map((club) => ({
      name: typeof club?.name === "string" ? club.name.trim() : null,
      crestUrl: typeof club?.crest_url === "string" && club.crest_url.trim() ? club.crest_url.trim() : null
    }))
    .filter((club) => club.name)
    .sort((left, right) => left.name.localeCompare(right.name, "en", { sensitivity: "base" }));
}

async function fetchClubPageImport(slug, clubName, crestUrl, siteUrl) {
  const candidateSlugs = buildCandidateSlugs(slug, clubName);
  let lastError = null;

  for (const candidateSlug of candidateSlugs) {
    const sourceUrl = `${siteUrl.replace(/\/$/, "")}/clubs/${candidateSlug}/`;

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          accept: "text/html"
        }
      });

      if (!response.ok) {
        lastError = new Error(`Club page request failed with status ${response.status}.`);
        continue;
      }

      const html = await response.text();
      return parseLiveClubPageHtml(
        html,
        {
          name: clubName,
          crestUrl
        },
        sourceUrl,
        siteUrl
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to fetch a matching live club page.");
}

loadDotEnv();

const { force, createMissing, dryRun, limit, only, siteUrl } = parseArgs(process.argv.slice(2));
const url = process.env.PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const directoryUrl = process.env.PUBLIC_CLUB_DIRECTORY_URL;

if (!url || !serviceRoleKey) {
  console.error("Missing Supabase credentials. Set PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const directoryClubs = await fetchClubDirectory(directoryUrl);
const directoryMap = new Map(directoryClubs.map((club) => [slugifyClubName(club.name), club]));

const { data: existingRows, error: existingError } = await supabase
  .from("club_pages")
  .select(`
    id,
    slug,
    club_name,
    crest_url,
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
    published,
    archived
  `)
  .order("club_name");

if (existingError) {
  console.error(`Unable to load club pages: ${existingError.message}`);
  process.exit(1);
}

const existingMap = new Map((existingRows ?? []).map((row) => [row.slug, row]));

if (createMissing) {
  const missingRows = directoryClubs
    .map((club) => ({
      slug: slugifyClubName(club.name),
      club_name: club.name,
      crest_url: club.crestUrl,
      introduction_heading: "Overview",
      introduction_paragraphs: [],
      social_links: [],
      spaces: [],
      events: [],
      key_facts: [],
      published: false,
      archived: false
    }))
    .filter((club) => !existingMap.has(club.slug));

  if (missingRows.length && !dryRun) {
    const { data: insertedRows, error: insertError } = await supabase
      .from("club_pages")
      .insert(missingRows)
      .select(`
        id,
        slug,
        club_name,
        crest_url,
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
        published,
        archived
      `);

    if (insertError) {
      console.error(`Unable to create missing club drafts: ${insertError.message}`);
      process.exit(1);
    }

    for (const row of insertedRows ?? []) {
      existingMap.set(row.slug, row);
    }
  }

  if (missingRows.length) {
    console.log(`${dryRun ? "Would create" : "Created"} ${missingRows.length} missing club draft${missingRows.length === 1 ? "" : "s"} from the public directory.`);
  }
}

let targets = Array.from(existingMap.values());

if (only.length) {
  const onlySet = new Set(only);
  targets = targets.filter((row) => onlySet.has(row.slug));
}

if (!force) {
  targets = targets.filter((row) => {
    return getMissingImportFields(row).length > 0;
  });
}

if (limit) {
  targets = targets.slice(0, limit);
}

if (!targets.length) {
  console.log(force ? "No club pages found for full import." : "No club pages currently need import.");
  process.exit(0);
}

console.log(
  `Preparing to import ${targets.length} club page${targets.length === 1 ? "" : "s"} from ${siteUrl}${force ? " (force mode)" : ""}${dryRun ? " (dry run)" : ""}.`
);

let updatedCount = 0;
let failedCount = 0;
const failures = [];

for (const row of targets) {
  const directoryClub = directoryMap.get(row.slug);
  const clubName = row.club_name || directoryClub?.name || row.slug;
  const crestUrl = row.crest_url || directoryClub?.crestUrl || null;

  try {
    const imported = await fetchClubPageImport(row.slug, clubName, crestUrl, siteUrl);
    const payload = toImportPayload(
      {
        ...row,
        crest_url: crestUrl
      },
      imported,
      force
    );

    if (dryRun) {
      const missingFields = getMissingImportFields(row);
      const reasonText = force
        ? "force mode"
        : missingFields.length
          ? `missing: ${missingFields.join(", ")}`
          : "review requested";
      console.log(`Would enrich existing club: ${clubName} from ${imported.sourceUrl} (${reasonText})`);
      updatedCount += 1;
      await sleep(700);
      continue;
    }

    const { error: updateError } = await supabase
      .from("club_pages")
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    updatedCount += 1;
    console.log(`Imported ${clubName} from ${imported.sourceUrl}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    failedCount += 1;
    failures.push({ clubName, slug: row.slug, reason });
    console.log(`Failed ${clubName}: ${reason}`);
  }

  await sleep(700);
}

console.log("");
console.log(`Done. Imported: ${updatedCount}. Failed: ${failedCount}.`);

if (failures.length) {
  console.log("Rows still needing attention:");

  for (const failure of failures) {
    console.log(`- ${failure.clubName} (${failure.slug}): ${failure.reason}`);
  }

  process.exitCode = 1;
}
