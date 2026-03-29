import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://stadiumexperience.com";
const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

const MIGRATION_TARGETS = [
  {
    table: "club_pages",
    label: "club_pages",
    keyField: "id",
    displayField: "slug",
    select: "id, slug, club_name, crest_url, hero_image_url, christmas_image_url, play_on_pitch_image_url",
    fields: [
      { field: "crest_url", target: (row, source) => buildClubTarget(row.slug, "crest", source) },
      { field: "hero_image_url", target: (row, source) => buildClubTarget(row.slug, "hero", source) },
      { field: "christmas_image_url", target: (row, source) => buildClubTarget(row.slug, "christmas", source) },
      { field: "play_on_pitch_image_url", target: (row, source) => buildClubTarget(row.slug, "play-on-pitch", source) }
    ]
  },
  {
    table: "stadiumexperience_clubs",
    label: "stadiumexperience_clubs",
    keyField: "id",
    displayField: "name",
    select: "id, name, crest_url",
    fields: [
      { field: "crest_url", target: (row, source) => buildClubTarget(slugifyClubName(row.name), "crest", source) }
    ]
  },
  {
    table: "news_posts",
    label: "news_posts",
    keyField: "id",
    displayField: "slug",
    select: "id, slug, published_at, cover_image_url, seo",
    fields: [
      { field: "cover_image_url", target: (row, source) => buildNewsTarget(row.slug, row.published_at, "cover", source) }
    ],
    jsonFields: [
      { source: "seo", key: "ogImage", target: (row, source) => buildNewsTarget(row.slug, row.published_at, "og", source) },
      { source: "seo", key: "socialImage", target: (row, source) => buildNewsTarget(row.slug, row.published_at, "og", source) }
    ]
  },
  {
    table: "awards_programmes",
    label: "awards_programmes",
    keyField: "id",
    displayField: "slug",
    select: "id, slug, hero_image_url",
    fields: [
      { field: "hero_image_url", target: (row, source) => buildAwardsTarget(row.slug, "programme", source) }
    ]
  },
  {
    table: "awards_pages",
    label: "awards_pages",
    keyField: "id",
    displayField: "slug",
    select: "id, slug, hero_image_url",
    fields: [
      { field: "hero_image_url", target: (row, source) => buildAwardsTarget(row.slug, "page", source) }
    ]
  },
  {
    table: "awards_categories",
    label: "awards_categories",
    keyField: "id",
    displayField: "slug",
    select: "id, slug, hero_image_url",
    fields: [
      { field: "hero_image_url", target: (row, source) => buildAwardsTarget(row.slug, "category", source) }
    ]
  }
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
  return argv.reduce(
    (options, arg) => {
      if (arg === "--dry-run") {
        return { ...options, dryRun: true };
      }

      if (arg === "--verbose") {
        return { ...options, verbose: true };
      }

      if (arg.startsWith("--limit=")) {
        const value = Number(arg.slice("--limit=".length));
        return Number.isFinite(value) && value > 0 ? { ...options, limit: value } : options;
      }

      if (arg.startsWith("--table=")) {
        const values = arg
          .slice("--table=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

        return values.length ? { ...options, tables: unique([...options.tables, ...values]) } : options;
      }

      return options;
    },
    {
      dryRun: false,
      verbose: false,
      limit: null,
      tables: []
    }
  );
}

function asString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function unique(values) {
  return Array.from(new Set(values));
}

function slugifyClubName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifySegment(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getImageKitPrivateKey() {
  return asString(process.env.IMAGEKIT_PRIVATE_KEY);
}

function getImageKitUrlEndpoint() {
  return asString(process.env.PUBLIC_IMAGEKIT_URL_ENDPOINT) ?? asString(process.env.PUBLIC_MEDIA_BASE_URL);
}

function getSupabaseUrl() {
  return asString(process.env.PUBLIC_SUPABASE_URL) ?? asString(process.env.VITE_SUPABASE_URL);
}

function normalizeUrlPrefix(value) {
  try {
    return new URL(value).toString().replace(/\/+$/u, "");
  } catch {
    return null;
  }
}

function resolveUrl(value, baseSiteUrl) {
  const trimmed = asString(value);

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return new URL(trimmed, baseSiteUrl).toString();
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

function isLegacyWordPressUrl(value) {
  const baseSiteUrl = process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const resolved = resolveUrl(value, baseSiteUrl);

  if (!resolved) {
    return false;
  }

  try {
    const parsed = new URL(resolved);
    return /^\/wp-content\/uploads\//iu.test(parsed.pathname) || /\.pagespeed\./iu.test(parsed.pathname);
  } catch {
    return false;
  }
}

function getExtensionFromContentType(contentType) {
  const normalized = String(contentType ?? "").split(";")[0].trim().toLowerCase();

  switch (normalized) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return null;
  }
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const pathMatch = pathname.match(/\.([a-z0-9]+)(?:$|[._-])/iu);

    if (pathMatch?.[1]) {
      return pathMatch[1].toLowerCase();
    }

    const simpleMatch = pathname.match(/\.([a-z0-9]+)$/iu);
    return simpleMatch?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function buildClubTarget(clubSlug, slot, sourceUrl) {
  return {
    objectKey: `clubs/${slugifySegment(clubSlug)}/${slot}.${getExtensionFromUrl(sourceUrl) ?? "jpg"}`
  };
}

function buildNewsTarget(slug, publishedAt, slot, sourceUrl) {
  const rawYear = asString(publishedAt)?.slice(0, 4);
  const year = rawYear && /^\d{4}$/u.test(rawYear) ? rawYear : "drafts";
  const extension = getExtensionFromUrl(sourceUrl) ?? "jpg";
  const fileName = slot === "og" ? `og.${extension}` : `cover.${extension}`;

  return {
    objectKey: `news/${year}/${slugifySegment(slug)}/${fileName}`
  };
}

function buildAwardsTarget(slug, type, sourceUrl) {
  return {
    objectKey: `awards/${type}/${slugifySegment(slug)}/hero.${getExtensionFromUrl(sourceUrl) ?? "jpg"}`
  };
}

function replaceObjectKeyExtension(objectKey, nextExtension) {
  return objectKey.replace(/\.[a-z0-9]+$/iu, `.${nextExtension}`);
}

async function fetchLegacyImage(sourceUrl) {
  const response = await fetch(sourceUrl, {
    headers: {
      accept: "image/*,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const contentType = asString(response.headers.get("content-type")) ?? "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();

  if (!arrayBuffer.byteLength) {
    throw new Error("Downloaded image was empty.");
  }

  return {
    contentType,
    arrayBuffer
  };
}

async function uploadToImageKit(sourceUrl, objectKey, cache) {
  const cacheKey = `${sourceUrl}::${objectKey}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const imageKitPrivateKey = getImageKitPrivateKey();
  const imageKitUrlEndpoint = normalizeUrlPrefix(getImageKitUrlEndpoint());

  if (!imageKitPrivateKey || !imageKitUrlEndpoint) {
    throw new Error("ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY and PUBLIC_IMAGEKIT_URL_ENDPOINT.");
  }

  const downloaded = await fetchLegacyImage(sourceUrl);
  const actualExtension = getExtensionFromContentType(downloaded.contentType) ?? getExtensionFromUrl(sourceUrl) ?? "jpg";
  const normalizedObjectKey = replaceObjectKeyExtension(objectKey, actualExtension);
  const fileName = normalizedObjectKey.split("/").at(-1) ?? `image.${actualExtension}`;
  const folder = `/${normalizedObjectKey.split("/").slice(0, -1).join("/")}`;
  const blob = new Blob([downloaded.arrayBuffer], { type: downloaded.contentType });
  const formData = new FormData();

  formData.set("file", blob, fileName);
  formData.set("fileName", fileName);
  formData.set("folder", folder);
  formData.set("useUniqueFileName", "false");
  formData.set("overwriteFile", "true");
  formData.set("tags", "stadium-experience,migration");

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${imageKitPrivateKey}:`).toString("base64")}`
    },
    body: formData
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      asString(payload?.message) ??
      asString(payload?.help) ??
      `ImageKit upload failed with status ${response.status}`;
    throw new Error(message);
  }

  const uploadedUrl = asString(payload?.url) ?? `${imageKitUrlEndpoint}/${normalizedObjectKey.split("/").map(encodeURIComponent).join("/")}`;
  const result = {
    objectKey: normalizedObjectKey,
    url: uploadedUrl
  };

  cache.set(cacheKey, result);
  return result;
}

function buildJsonPatch(row, jsonField, nestedKey, nextUrl) {
  const currentValue =
    row?.[jsonField] && typeof row[jsonField] === "object" && !Array.isArray(row[jsonField])
      ? { ...row[jsonField] }
      : {};

  currentValue[nestedKey] = nextUrl;
  return currentValue;
}

async function migrateTable(supabase, targetConfig, options, uploadCache) {
  const stats = {
    scanned: 0,
    migrated: 0,
    skipped: 0,
    failed: 0
  };

  let query = supabase.from(targetConfig.table).select(targetConfig.select).order(targetConfig.displayField);

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to load ${targetConfig.table}: ${error.message}`);
  }

  for (const row of data ?? []) {
    stats.scanned += 1;
    const displayValue = asString(row?.[targetConfig.displayField]) ?? asString(row?.slug) ?? "(no-slug)";
    const rowUpdate = {};
    let rowChanged = false;

    for (const fieldConfig of targetConfig.fields ?? []) {
      const currentValue = row?.[fieldConfig.field];

      if (!isLegacyWordPressUrl(currentValue)) {
        continue;
      }

      try {
        const sourceUrl = resolveUrl(currentValue, process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL);
        const uploaded = await uploadToImageKit(sourceUrl, fieldConfig.target(row, sourceUrl).objectKey, uploadCache);
        rowUpdate[fieldConfig.field] = uploaded.url;
        rowChanged = true;
        stats.migrated += 1;

        if (options.verbose) {
          console.log(`${targetConfig.label} :: ${displayValue} :: ${fieldConfig.field}`);
          console.log(`  ${sourceUrl}`);
          console.log(`  -> ${uploaded.url}`);
        }
      } catch (error) {
        stats.failed += 1;
        console.log(`Failed ${targetConfig.label} :: ${displayValue} :: ${fieldConfig.field}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    for (const jsonFieldConfig of targetConfig.jsonFields ?? []) {
      const currentJson = row?.[jsonFieldConfig.source];
      const currentValue =
        currentJson && typeof currentJson === "object" && !Array.isArray(currentJson)
          ? currentJson[jsonFieldConfig.key]
          : null;

      if (!isLegacyWordPressUrl(currentValue)) {
        continue;
      }

      try {
        const sourceUrl = resolveUrl(currentValue, process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL);
        const uploaded = await uploadToImageKit(sourceUrl, jsonFieldConfig.target(row, sourceUrl).objectKey, uploadCache);
        rowUpdate[jsonFieldConfig.source] = buildJsonPatch(row, jsonFieldConfig.source, jsonFieldConfig.key, uploaded.url);
        rowChanged = true;
        stats.migrated += 1;

        if (options.verbose) {
          console.log(`${targetConfig.label} :: ${displayValue} :: ${jsonFieldConfig.source}.${jsonFieldConfig.key}`);
          console.log(`  ${sourceUrl}`);
          console.log(`  -> ${uploaded.url}`);
        }
      } catch (error) {
        stats.failed += 1;
        console.log(`Failed ${targetConfig.label} :: ${displayValue} :: ${jsonFieldConfig.source}.${jsonFieldConfig.key}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    if (!rowChanged) {
      stats.skipped += 1;
      continue;
    }

    if (options.dryRun) {
      continue;
    }

    const { error: updateError } = await supabase
      .from(targetConfig.table)
      .update(rowUpdate)
      .eq(targetConfig.keyField, row[targetConfig.keyField]);

    if (updateError) {
      stats.failed += 1;
      console.log(`Failed to update ${targetConfig.label} :: ${displayValue}: ${updateError.message}`);
    }
  }

  return stats;
}

function printStats(summary) {
  console.log("");
  console.log("Migration summary");
  console.log("-----------------");

  for (const [table, stats] of Object.entries(summary)) {
    console.log(`${table}: scanned ${stats.scanned}, migrated ${stats.migrated}, skipped ${stats.skipped}, failed ${stats.failed}`);
  }
}

loadDotEnv();

const options = parseArgs(process.argv.slice(2));
const supabaseUrl = getSupabaseUrl();
const serviceRoleKey = asString(process.env.SUPABASE_SERVICE_ROLE_KEY);
const imageKitPrivateKey = getImageKitPrivateKey();
const imageKitUrlEndpoint = getImageKitUrlEndpoint();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials. Set PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.");
  process.exit(1);
}

if (!imageKitPrivateKey || !imageKitUrlEndpoint) {
  console.error("Missing ImageKit credentials. Set IMAGEKIT_PRIVATE_KEY and PUBLIC_IMAGEKIT_URL_ENDPOINT (or PUBLIC_MEDIA_BASE_URL) in .env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const uploadCache = new Map();
const summary = {};
const targets = options.tables.length
  ? MIGRATION_TARGETS.filter((target) => options.tables.includes(target.table))
  : MIGRATION_TARGETS;

for (const target of targets) {
  console.log(`${options.dryRun ? "Planning" : "Migrating"} ${target.table}...`);
  summary[target.table] = await migrateTable(supabase, target, options, uploadCache);
}

printStats(summary);
