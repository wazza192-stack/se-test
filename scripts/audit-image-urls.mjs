import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://stadiumexperience.com";
const DEFAULT_OWNED_IMAGE_HOSTS = ["imagedelivery.net"];

const TABLE_AUDITS = [
  {
    label: "club_pages",
    table: "club_pages",
    keyField: "slug",
    nameField: "club_name",
    select: "slug, club_name, crest_url, hero_image_url, christmas_image_url, play_on_pitch_image_url",
    imageFields: ["crest_url", "hero_image_url", "christmas_image_url", "play_on_pitch_image_url"]
  },
  {
    label: "news_posts",
    table: "news_posts",
    keyField: "slug",
    nameField: "title",
    select: "slug, title, cover_image_url, seo",
    imageFields: ["cover_image_url"],
    jsonImageFields: [
      { source: "seo", key: "ogImage", label: "seo.ogImage" },
      { source: "seo", key: "socialImage", label: "seo.socialImage" }
    ]
  },
  {
    label: "awards_programmes",
    table: "awards_programmes",
    keyField: "slug",
    nameField: "title",
    select: "slug, title, hero_image_url",
    imageFields: ["hero_image_url"]
  },
  {
    label: "awards_pages",
    table: "awards_pages",
    keyField: "slug",
    nameField: "title",
    select: "slug, title, hero_image_url",
    imageFields: ["hero_image_url"]
  },
  {
    label: "awards_categories",
    table: "awards_categories",
    keyField: "slug",
    nameField: "title",
    select: "slug, title, hero_image_url",
    imageFields: ["hero_image_url"]
  }
];

function parseArgs(argv) {
  return argv.reduce(
    (options, arg) => {
      if (arg === "--verbose") {
        return { ...options, verbose: true };
      }

      return options;
    },
    {
      verbose: false
    }
  );
}

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

function parseList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/[,\n]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values));
}

function asString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeUrlPrefix(value) {
  try {
    return new URL(value).toString().replace(/\/+$/u, "").toLowerCase();
  } catch {
    return null;
  }
}

function matchesHost(host, expectedHost) {
  const normalizedHost = String(host ?? "").toLowerCase();
  const normalizedExpectedHost = String(expectedHost ?? "").toLowerCase();
  return normalizedHost === normalizedExpectedHost || normalizedHost.endsWith(`.${normalizedExpectedHost}`);
}

function isLegacyWordPressPath(pathname) {
  return /^\/wp-content\/uploads\//iu.test(pathname) || /\.pagespeed\./iu.test(pathname);
}

function getSiteUrl() {
  try {
    return new URL(process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

function getOwnedHosts() {
  return unique(
    [...DEFAULT_OWNED_IMAGE_HOSTS, ...parseList(process.env.PUBLIC_OWNED_IMAGE_HOSTS)]
      .map((host) => host.toLowerCase())
  );
}

function getOwnedPrefixes() {
  return unique(
    [
      process.env.PUBLIC_OWNED_IMAGE_PREFIXES,
      process.env.PUBLIC_IMAGEKIT_URL_ENDPOINT,
      process.env.PUBLIC_MEDIA_BASE_URL
    ]
      .flatMap((value) => parseList(value))
      .map((value) => normalizeUrlPrefix(value))
      .filter(Boolean)
  );
}

function resolveUrl(value, baseSiteUrl) {
  const trimmed = asString(value);

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (/^\/\//u.test(trimmed)) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//iu.test(trimmed)) {
    return trimmed;
  }

  try {
    return new URL(trimmed, baseSiteUrl).toString();
  } catch {
    return null;
  }
}

function assessImageUrl(value) {
  const baseSiteUrl = getSiteUrl();
  const siteHost = baseSiteUrl.host.toLowerCase();
  const ownedHosts = getOwnedHosts();
  const ownedPrefixes = getOwnedPrefixes();
  const resolved = resolveUrl(value, baseSiteUrl.toString());

  if (!resolved) {
    return {
      kind: "invalid",
      url: null,
      host: null
    };
  }

  if (resolved.startsWith("/")) {
    return {
      kind: "local",
      url: resolved,
      host: null
    };
  }

  try {
    const parsed = new URL(resolved);
    const host = parsed.host.toLowerCase();
    const pathname = parsed.pathname;
    const normalizedUrl = parsed.toString().toLowerCase();

    if (isLegacyWordPressPath(pathname)) {
      return {
        kind: "legacy-wordpress",
        url: resolved,
        host,
        isOnSite: matchesHost(host, siteHost)
      };
    }

    if (matchesHost(host, siteHost)) {
      return {
        kind: "site-managed",
        url: resolved,
        host
      };
    }

    if (ownedHosts.some((ownedHost) => matchesHost(host, ownedHost))) {
      return {
        kind: "owned-remote",
        url: resolved,
        host
      };
    }

    if (ownedPrefixes.some((prefix) => normalizedUrl.startsWith(prefix))) {
      return {
        kind: "owned-remote",
        url: resolved,
        host
      };
    }

    return {
      kind: "external",
      url: resolved,
      host
    };
  } catch {
    return {
      kind: "invalid",
      url: null,
      host: null
    };
  }
}

function shouldReport(kind) {
  return kind === "legacy-wordpress" || kind === "external" || kind === "invalid";
}

function pushFinding(findings, counts, finding) {
  findings.push(finding);
  counts[finding.kind] = (counts[finding.kind] ?? 0) + 1;
  counts.total += 1;
}

function auditValue(findings, counts, source, recordKey, recordName, field, rawValue) {
  const trimmed = asString(rawValue);

  if (!trimmed) {
    return;
  }

  const assessment = assessImageUrl(trimmed);

  if (!shouldReport(assessment.kind)) {
    return;
  }

  pushFinding(findings, counts, {
    source,
    recordKey,
    recordName,
    field,
    kind: assessment.kind,
    host: assessment.host ?? null,
    url: assessment.url ?? trimmed
  });
}

async function auditSupabaseTables(findings, counts) {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.log("Skipping Supabase audit because Supabase credentials are not configured in .env.");
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  for (const tableAudit of TABLE_AUDITS) {
    const { data, error } = await supabase
      .from(tableAudit.table)
      .select(tableAudit.select)
      .order(tableAudit.keyField);

    if (error) {
      console.log(`Unable to audit ${tableAudit.table}: ${error.message}`);
      continue;
    }

    for (const row of data ?? []) {
      const recordKey = asString(row?.[tableAudit.keyField]) ?? "(no-key)";
      const recordName = asString(row?.[tableAudit.nameField]) ?? recordKey;

      for (const field of tableAudit.imageFields) {
        auditValue(findings, counts, tableAudit.label, recordKey, recordName, field, row?.[field]);
      }

      for (const jsonImageField of tableAudit.jsonImageFields ?? []) {
        const jsonValue = row?.[jsonImageField.source];
        const nestedValue =
          jsonValue && typeof jsonValue === "object" && !Array.isArray(jsonValue)
            ? jsonValue[jsonImageField.key]
            : null;

        auditValue(findings, counts, tableAudit.label, recordKey, recordName, jsonImageField.label, nestedValue);
      }
    }
  }
}

async function auditPublicClubDirectory(findings, counts) {
  const endpoint = asString(process.env.PUBLIC_CLUB_DIRECTORY_URL);

  if (!endpoint) {
    console.log("Skipping public club directory audit because PUBLIC_CLUB_DIRECTORY_URL is not configured.");
    return;
  }

  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Public club directory request failed with status ${response.status}.`);
  }

  const payload = await response.json().catch(() => null);
  const clubs = Array.isArray(payload?.clubs) ? payload.clubs : [];

  for (const club of clubs) {
    const name = asString(club?.name) ?? "(unnamed club)";
    auditValue(findings, counts, "public_club_directory", name, name, "crest_url", club?.crest_url);
  }
}

function printSummary(findings, counts, options) {
  const bySource = new Map();
  const byField = new Map();

  for (const finding of findings) {
    bySource.set(finding.source, (bySource.get(finding.source) ?? 0) + 1);
    const fieldKey = `${finding.source}.${finding.field}`;
    byField.set(fieldKey, (byField.get(fieldKey) ?? 0) + 1);
  }

  console.log("");
  console.log("Image URL audit summary");
  console.log("-----------------------");
  console.log(`Flagged URLs: ${counts.total}`);
  console.log(`Legacy WordPress: ${counts["legacy-wordpress"] ?? 0}`);
  console.log(`External hosts: ${counts.external ?? 0}`);
  console.log(`Invalid URLs: ${counts.invalid ?? 0}`);

  if (!findings.length) {
    console.log("");
    console.log("No legacy or external image URLs were found in the audited sources.");
    return;
  }

  console.log("");
  console.log("By source");
  console.log("---------");

  for (const [source, count] of Array.from(bySource.entries()).sort((left, right) => right[1] - left[1])) {
    console.log(`${source}: ${count}`);
  }

  console.log("");
  console.log("By field");
  console.log("--------");

  for (const [fieldKey, count] of Array.from(byField.entries()).sort((left, right) => right[1] - left[1])) {
    console.log(`${fieldKey}: ${count}`);
  }

  if (!options.verbose) {
    console.log("");
    console.log("Run with --verbose to print every flagged row and URL.");
    return;
  }

  console.log("");
  console.log("Flagged image URLs");
  console.log("------------------");

  for (const finding of findings) {
    console.log(
      `[${finding.kind}] ${finding.source} :: ${finding.recordKey} :: ${finding.field}${finding.host ? ` :: ${finding.host}` : ""}`
    );
    console.log(`  ${finding.url}`);
  }
}

loadDotEnv();

const options = parseArgs(process.argv.slice(2));
const findings = [];
const counts = {
  total: 0
};

try {
  await auditSupabaseTables(findings, counts);
  await auditPublicClubDirectory(findings, counts);
  printSummary(findings, counts, options);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Image URL audit failed.");
  process.exit(1);
}
