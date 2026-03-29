import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://stadiumexperience.com";

const SLUG_OVERRIDES = {
  "barclays-hampden-stadium": ["hampden-park-stadium"],
  "birmingham-bears-cricket-club-edgbaston": ["birmingham-bears-cricket-club"],
  "brighton-and-hove-albion-football-club": ["brighton-hove-albion-football-club"],
  "hull-fc-rugby-club": ["hull-rugby-club"],
  "london-stadium": ["west-ham-united-fc"],
  "nottinghamshire-cricket-club-trent-bridge": ["nottinghamshire-cricket-club", "trent-bridge"],
  "st-helens-rfc": ["st-helens-rugby-club"]
};

const TARGET_FACTS = [
  { label: "Theatre Capacity", aliases: ["theatre capacity", "theater capacity", "max capacity theatre style", "max capacity theatre"] },
  { label: "Total SQM Exhibition Space", aliases: ["total sqm exhibition space", "total sq m exhibition space", "exhibition space"] },
  { label: "Boxes", aliases: ["boxes", "smaller meeting rooms boxes", "smaller meeting rooms box", "number of boxes"] },
  { label: "Banquet Capacity", aliases: ["banquet capacity", "max capacity banquet style", "max capacity banquet"] },
  { label: "Event Spaces", aliases: ["event spaces", "number of event spaces"] },
  { label: "Distance To Nearest Hotel", aliases: ["distance to nearest hotel", "distance to nearest hotels", "nearest hotel"] }
];

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
  return argv.reduce((options, arg) => {
    if (arg === "--force") {
      return { ...options, force: true };
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

    return options;
  }, { force: false, limit: null, only: [] });
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function getSectionLines(lines, startLabel, endLabels) {
  const startIndex = findLineIndex(lines, (line) => line.includes(startLabel));

  if (startIndex === -1) {
    return [];
  }

  const tail = lines.slice(startIndex + 1);
  const endIndex = tail.findIndex((line) => endLabels.some((label) => line.includes(label)));

  return endIndex === -1 ? tail : tail.slice(0, endIndex);
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

function parseAlternatingFacts(lines) {
  const facts = [];

  for (let index = 0; index < lines.length - 1; index += 2) {
    const label = lines[index];
    const value = lines[index + 1];

    if (!label || !value) {
      continue;
    }

    facts.push({ label, value });
  }

  return facts;
}

function normalizeLabel(label) {
  return String(label ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePositiveInteger(value) {
  const cleaned = String(value ?? "").replace(/[^\d]/g, "");

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function updateMaxCapacity(currentValue, nextValue) {
  const candidate = parsePositiveInteger(nextValue);

  if (!candidate) {
    return currentValue;
  }

  return !currentValue || candidate > currentValue ? candidate : currentValue;
}

function extractFallbackCapacityFacts(lines) {
  let theatreCapacity = null;
  let banquetCapacity = null;

  for (const line of lines) {
    const theatreMatches = [
      ...line.matchAll(/capacity of\s+([\d,]+)\s+(?:delegates?\s+)?theatre style/gi),
      ...line.matchAll(/capacity from\s+[\d,]+\s+to\s+([\d,]+)\s+(?:people|delegates?|guests?)\s+theatre style/gi),
      ...line.matchAll(/up to\s+([\d,]+)\s+(?:delegates?|guests?).*?(?:theatre style|theatre|seminar|conference|auditorium|presentation)/gi),
      ...line.matchAll(/([\d,]+)\s+(?:delegates?|guests?).*?(?:theatre style|theatre)/gi),
      ...line.matchAll(/(?:auditorium|tiered auditorium).*?(?:seat|seats)\s+([\d,]+)/gi),
      ...line.matchAll(/conferences?\s+for\s+up\s+to\s+([\d,]+)\s+delegates?/gi),
      ...line.matchAll(/(?:conference|meeting|presentation|seminar|training|exhibition)[^.]*?up to\s+([\d,]+)\s+(?:delegates?|guests?|people)/gi)
    ];

    const banquetMatches = [
      ...line.matchAll(/(?:dinners?|banqueting)\s+up to\s+([\d,]+)/gi),
      ...line.matchAll(/(?:up to|catering for up to)\s+([\d,]+)\s+(?:dining guests?|guests?|people).*(?:banquet|banqueting|dining)?/gi),
      ...line.matchAll(/([\d,]+)\s+(?:dining guests?|guests?|people).*(?:banquet|banqueting|dining)/gi),
      ...line.matchAll(/(?:private dining|dining|dinners?|banquet(?:ing)?|weddings?|celebrations?).*?up to\s+([\d,]+)/gi),
      ...line.matchAll(/seated function suite.*?([\d,]+)/gi),
      ...line.matchAll(/(?:wedding breakfast|award dinners?|celebration dinners?)[^.]*?up to\s+([\d,]+)/gi)
    ];

    for (const match of theatreMatches) {
      theatreCapacity = updateMaxCapacity(theatreCapacity, match[1]);
    }

    for (const match of banquetMatches) {
      banquetCapacity = updateMaxCapacity(banquetCapacity, match[1]);
    }
  }

  return {
    theatreCapacity: theatreCapacity ? String(theatreCapacity) : null,
    banquetCapacity: banquetCapacity ? String(banquetCapacity) : null
  };
}

function extractSectionCapacityFacts(lines) {
  const sectionLines = getSectionLines(lines, "Spaces For Hire", ["Events at", "Christmas Parties", "Matchday Hospitality", "Key Information", "Awards", "Accreditations", "Brochures & Downloads"]);
  let theatreCapacity = null;
  let banquetCapacity = null;
  let receptionCapacity = null;
  let genericCapacity = null;

  for (const line of sectionLines) {
    const parentheticalMatches = Array.from(line.matchAll(/([\d,]+)\s*\(([^)]+)\)/gi));

    for (const match of parentheticalMatches) {
      const value = match[1];
      const label = normalizeLabel(match[2]);

      if (/theatre|conference|seminar|presentation/.test(label)) {
        theatreCapacity = updateMaxCapacity(theatreCapacity, value);
        continue;
      }

      if (/banquet|dinner|dining|formal dining|wedding breakfast|cabaret|reception/.test(label)) {
        banquetCapacity = updateMaxCapacity(banquetCapacity, value);

        if (/reception/.test(label)) {
          receptionCapacity = updateMaxCapacity(receptionCapacity, value);
        }
      }
    }

    const rangeMatch = line.match(/capacity\s*:?\s*([\d,]+)\s*-\s*([\d,]+)/i);

    if (rangeMatch) {
      genericCapacity = updateMaxCapacity(genericCapacity, rangeMatch[2]);
    }

    const minMaxMatch = line.match(/min\s+[\d,]+\s+max\s+([\d,]+)/i);

    if (minMaxMatch) {
      genericCapacity = updateMaxCapacity(genericCapacity, minMaxMatch[1]);
    }

    const upToMatch = line.match(/(?:capacity|accommodates?|hosting|host|groups of|events for|suite for|space for|up to)\D{0,20}([\d,]+)/i);

    if (upToMatch) {
      const normalized = normalizeLabel(line);
      const value = upToMatch[1];

      if (/banquet|dining|dinner|party|reception|celebration|wedding/.test(normalized)) {
        banquetCapacity = updateMaxCapacity(banquetCapacity, value);
      } else if (/conference|meeting|presentation|seminar|exhibition|delegate/.test(normalized)) {
        theatreCapacity = updateMaxCapacity(theatreCapacity, value);
      } else {
        genericCapacity = updateMaxCapacity(genericCapacity, value);
      }
    }
  }

  if (!theatreCapacity) {
    theatreCapacity = genericCapacity || receptionCapacity;
  }

  if (!banquetCapacity) {
    banquetCapacity = genericCapacity;
  }

  return {
    theatreCapacity: theatreCapacity ? String(theatreCapacity) : null,
    banquetCapacity: banquetCapacity ? String(banquetCapacity) : null
  };
}

function extractStructuredCapacityFacts(lines) {
  const spaceLines = getSectionLines(lines, "Spaces For Hire", ["Christmas Parties", "Matchday Hospitality", "Key Information", "Awards", "Accreditations"]);
  let theatreCapacity = null;
  let banquetCapacity = null;

  for (const line of spaceLines) {
    const theatreMatches = [
      ...line.matchAll(/theatre\s*[-:]\s*([\d,]+)/gi),
      ...line.matchAll(/max capacity\s+([\d,]+)\s+theatre(?: style)?/gi),
      ...line.matchAll(/theatre(?: style)?[^.\d]*([\d,]+)/gi),
      ...line.matchAll(/up to\s+([\d,]+)\s+delegates?/gi)
    ];
    const banquetMatches = [
      ...line.matchAll(/banquet(?:ing)?\s*[-:]\s*([\d,]+)/gi),
      ...line.matchAll(/max capacity\s+[\d,]+\s+(?:theatre(?: style)?[, ]+)?(?:[\d,]+\s+cabaret\s+and\s+)?([\d,]+)\s+dinner/gi),
      ...line.matchAll(/(?:dinner|dining|banquet(?:ing)?|reception)\s*[-:]\s*([\d,]+)/gi),
      ...line.matchAll(/up to\s+([\d,]+)\s+(?:guests?|people).*(?:dinner|dining|banquet|wedding|party|reception)/gi)
    ];

    for (const match of theatreMatches) {
      theatreCapacity = updateMaxCapacity(theatreCapacity, match[1]);
    }

    for (const match of banquetMatches) {
      banquetCapacity = updateMaxCapacity(banquetCapacity, match[1]);
    }
  }

  return {
    theatreCapacity: theatreCapacity ? String(theatreCapacity) : null,
    banquetCapacity: banquetCapacity ? String(banquetCapacity) : null
  };
}

function extractSpaceSectionCapacityFacts(lines) {
  const spaceLines = getSectionLines(lines, "Spaces For Hire", ["Matchday Hospitality", "Christmas Parties", "Stadium Tours", "Key Information"]);
  let theatreCapacity = null;
  let banquetCapacity = null;

  for (const line of spaceLines) {
    const theatreMatches = Array.from(line.matchAll(/(?:capacity\s*:?\s*|^)([\d,]+(?:\s*[\d,]+)?)\s*(?:theatre style|theatre)/gi));
    const banquetMatches = Array.from(line.matchAll(/(?:capacity\s*:?\s*|^)([\d,]+(?:\s*[\d,]+)?)\s*(?:private dining|dining guests?|banquet(?:ing)?|informal dining|seated buffet|lunch area)/gi));

    for (const match of theatreMatches) {
      const candidate = parsePositiveInteger(match[1]);

      if (candidate && (!theatreCapacity || candidate > theatreCapacity)) {
        theatreCapacity = candidate;
      }
    }

    for (const match of banquetMatches) {
      const candidate = parsePositiveInteger(match[1]);

      if (candidate && (!banquetCapacity || candidate > banquetCapacity)) {
        banquetCapacity = candidate;
      }
    }
  }

  return {
    theatreCapacity: theatreCapacity ? String(theatreCapacity) : null,
    banquetCapacity: banquetCapacity ? String(banquetCapacity) : null
  };
}

function extractVenueCapacityTableFacts(lines) {
  const sectionLines = getSectionLines(lines, "Venue Capacities", ["Matchday Hospitality", "Spaces For Hire", "Christmas Parties", "Key Information", "Awards"]);
  let theatreCapacity = null;
  let banquetCapacity = null;

  for (const line of sectionLines) {
    const normalized = line.replace(/\s+/g, " ").trim();

    if (!normalized || /^space\s+reception\s+theatre\s+dining/i.test(normalized)) {
      continue;
    }

    const tokens = normalized.split(" ");
    const numericTokens = tokens.filter((token) => /^[\d,]+$|^n\/a$/i.test(token));

    if (numericTokens.length < 3) {
      continue;
    }

    const theatreToken = numericTokens.at(-2);
    const banquetToken = numericTokens.at(-1);

    if (!/^n\/a$/i.test(theatreToken ?? "")) {
      theatreCapacity = updateMaxCapacity(theatreCapacity, theatreToken);
    }

    if (!/^n\/a$/i.test(banquetToken ?? "")) {
      banquetCapacity = updateMaxCapacity(banquetCapacity, banquetToken);
    }
  }

  return {
    theatreCapacity: theatreCapacity ? String(theatreCapacity) : null,
    banquetCapacity: banquetCapacity ? String(banquetCapacity) : null
  };
}

function parseLiveTargetFacts(html) {
  const lines = htmlToLines(html);
  const topMetricFacts = parseAlternatingFacts(
    getSectionLines(lines, "Matchday Hospitality", ["STARTING DAY DELEGATE RATE", "Venue Hire", "Unusual Venue Hire"])
      .filter((line) => !/contact details|@|^\+?\d[\d\s()/-]{6,}$/i.test(line))
      .filter((line) => line !== "Matchday Hospitality")
      .filter((line) => line !== "Non-Matchday Events")
  );
  const keyInformationFacts = parseKeyFacts(getSectionLines(lines, "Key Information", ["Awards", "Accreditations", "Take a Tour"]));
  const facts = [...topMetricFacts, ...keyInformationFacts];
  const targetFactMap = new Map();

  for (const fact of facts) {
    const normalized = normalizeLabel(fact.label);
    const target = TARGET_FACTS.find((item) => item.aliases.includes(normalized));

    if (!target) {
      continue;
    }

    targetFactMap.set(target.label, {
      label: target.label,
      value: fact.value.trim()
    });
  }

  const fallbackCapacities = extractFallbackCapacityFacts(lines);
  const sectionCapacities = extractSectionCapacityFacts(lines);
  const structuredCapacities = extractStructuredCapacityFacts(lines);
  const spaceCapacities = extractSpaceSectionCapacityFacts(lines);
  const venueCapacityTableFacts = extractVenueCapacityTableFacts(lines);
  const theatreFact = targetFactMap.get("Theatre Capacity");
  const banquetFact = targetFactMap.get("Banquet Capacity");

  const resolvedTheatreCapacity =
    sectionCapacities.theatreCapacity ??
    fallbackCapacities.theatreCapacity ??
    structuredCapacities.theatreCapacity ??
    venueCapacityTableFacts.theatreCapacity ??
    spaceCapacities.theatreCapacity;
  const resolvedBanquetCapacity =
    sectionCapacities.banquetCapacity ??
    fallbackCapacities.banquetCapacity ??
    structuredCapacities.banquetCapacity ??
    venueCapacityTableFacts.banquetCapacity ??
    spaceCapacities.banquetCapacity;

  if (!parsePositiveInteger(theatreFact?.value) && resolvedTheatreCapacity) {
    targetFactMap.set("Theatre Capacity", {
      label: "Theatre Capacity",
      value: resolvedTheatreCapacity
    });
  }

  if (!parsePositiveInteger(banquetFact?.value) && resolvedBanquetCapacity) {
    targetFactMap.set("Banquet Capacity", {
      label: "Banquet Capacity",
      value: resolvedBanquetCapacity
    });
  }

  return Array.from(targetFactMap.values());
}

function normalizeExistingFacts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const label = typeof item.label === "string" ? item.label.trim() : "";
      const factValue = typeof item.value === "string" ? item.value.trim() : "";

      return label && factValue ? { label, value: factValue } : null;
    })
    .filter(Boolean);
}

function mergeTargetFacts(existingFacts, incomingFacts) {
  const targetLabels = new Set(TARGET_FACTS.map((fact) => fact.label));
  const cleanedExisting = normalizeExistingFacts(existingFacts).filter((fact) => !targetLabels.has(fact.label));
  return [...incomingFacts, ...cleanedExisting];
}

function getFactValue(facts, label) {
  return facts.find((fact) => fact.label === label)?.value ?? null;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildCandidateSlugs(club) {
  const name = typeof club.club_name === "string" ? club.club_name.trim() : "";
  const strippedName = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();

  return unique([
    club.slug,
    ...(SLUG_OVERRIDES[club.slug] ?? []),
    strippedName ? slugify(strippedName) : null,
    name ? slugify(name) : null
  ]);
}

async function fetchLiveTargetFacts(club, baseSiteUrl) {
  const candidateSlugs = buildCandidateSlugs(club);
  let lastError = null;

  for (const candidateSlug of candidateSlugs) {
    const sourceUrl = `${baseSiteUrl.replace(/\/$/, "")}/clubs/${candidateSlug}/`;

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
      return {
        sourceUrl,
        facts: parseLiveTargetFacts(html)
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to fetch a live club page.");
}

loadDotEnv();

const { force, limit, only } = parseArgs(process.argv.slice(2));
const url = process.env.PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseSiteUrl = process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL;

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

let query = supabase
  .from("club_pages")
  .select("id, slug, club_name, key_facts")
  .order("club_name");

if (!force) {
  query = query.or("key_facts.eq.[],key_facts.is.null");
}

if (only.length) {
  query = query.in("slug", only);
}

if (limit) {
  query = query.limit(limit);
}

const { data: clubs, error } = await query;

if (error) {
  console.error(`Unable to load club pages: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(clubs) || !clubs.length) {
  console.log(force ? "No club pages found for planning-facts backfill." : "No club pages need planning-facts backfill.");
  process.exit(0);
}

console.log(
  `Preparing to scrape planning facts for ${clubs.length} club page${clubs.length === 1 ? "" : "s"}${force ? " (force mode)" : ""}${only.length ? ` (targeted: ${only.length} slug${only.length === 1 ? "" : "s"})` : ""}.`
);

let updatedCount = 0;
let skippedCount = 0;
let failedCount = 0;
const failures = [];

for (const club of clubs) {
  const name = club.club_name || club.slug || "Unknown club";

  try {
    const { sourceUrl, facts } = await fetchLiveTargetFacts(club, baseSiteUrl);

    if (!facts.length) {
      console.log(`Skipping ${name}: none of the requested planning facts were found on ${sourceUrl}.`);
      skippedCount += 1;
      await sleep(900);
      continue;
    }

    const theatreCapacity = getFactValue(facts, "Theatre Capacity");
    const banquetCapacity = getFactValue(facts, "Banquet Capacity");

    if (!parsePositiveInteger(theatreCapacity) || !parsePositiveInteger(banquetCapacity)) {
      throw new Error(
        `Capacity extraction incomplete on ${sourceUrl}. Theatre Capacity=${theatreCapacity ?? "missing"} | Banquet Capacity=${banquetCapacity ?? "missing"}`
      );
    }

    const nextFacts = mergeTargetFacts(club.key_facts, facts);

    const { error: updateError } = await supabase
      .from("club_pages")
      .update({
        key_facts: nextFacts
      })
      .eq("id", club.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    updatedCount += 1;
    console.log(`Updated ${name}: ${facts.map((fact) => `${fact.label} = ${fact.value}`).join(" | ")}`);
  } catch (clubError) {
    const reason = clubError instanceof Error ? clubError.message : "Unknown error";
    failedCount += 1;
    failures.push({ name, slug: club.slug, reason });
    console.log(`Failed ${name}: ${reason}`);
  }

  await sleep(900);
}

console.log("");
console.log(`Done. Updated: ${updatedCount}. Skipped: ${skippedCount}. Failed: ${failedCount}.`);

if (failures.length) {
  console.log("Rows still needing attention:");

  for (const failure of failures) {
    console.log(`- ${failure.name} (${failure.slug ?? "no-slug"}): ${failure.reason}`);
  }

  process.exitCode = 1;
}
