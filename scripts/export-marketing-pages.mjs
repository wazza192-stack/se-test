import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const DEFAULT_OLD_SITE_URL = "https://stadiumexperience.com";
const DEFAULT_OUTPUT_PATH = "scripts/output/marketing-pages.json";

const PAGE_CONFIG = [
  { key: "home", targetPath: "/", sourcePaths: ["/"] },
  { key: "about", targetPath: "/about/", sourcePaths: ["/what-we-offer/", "/about-us/"] },
  { key: "activities", targetPath: "/about/whats-on/", sourcePaths: ["/what-we-offer/our-activities/"] },
  { key: "venues", targetPath: "/venues/", sourcePaths: ["/venues/"] },
  { key: "awards", targetPath: "/awards/", sourcePaths: ["/awards/"] },
  { key: "news", targetPath: "/latest-news/", sourcePaths: ["/latest-news/"] },
  { key: "suppliers", targetPath: "/suppliers/", sourcePaths: ["/suppliers/"] },
  { key: "supplier-advertising", targetPath: "/suppliers/advertising/", sourcePaths: ["/suppliers/advertising/", "/suppliers/"] },
  { key: "venue-guide", targetPath: "/venues/venue-guide/", sourcePaths: ["/stadium-venue-guide/", "/wp-content/uploads/2025/06/Stadium-Experience-Venue-Guide-June-2025.pdf"] },
  { key: "christmas", targetPath: "/venues/christmas-parties/", sourcePaths: ["/venues/xmas-parties/", "/unique-christmas-party-venues/", "/christmas-parties/"] },
  { key: "jobs", targetPath: "/stadium-jobs/", sourcePaths: ["/jobs/", "/stadium-jobs/"] }
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

      if (arg.startsWith("--site=")) {
        const siteUrl = arg.slice("--site=".length).trim();
        return siteUrl ? { ...options, siteUrl } : options;
      }

      if (arg.startsWith("--output=")) {
        const outputPath = arg.slice("--output=".length).trim();
        return outputPath ? { ...options, outputPath } : options;
      }

      if (arg.startsWith("--only=")) {
        const only = arg
          .slice("--only=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

        return only.length ? { ...options, only } : options;
      }

      return options;
    },
    {
      dryRun: false,
      siteUrl: process.env.OLD_SITE_URL || DEFAULT_OLD_SITE_URL,
      outputPath: DEFAULT_OUTPUT_PATH,
      only: []
    }
  );
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

function stripHtml(value) {
  return decodeHtmlEntities(
    String(value ?? "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|ul|ol|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]+/g, " ")
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function extractTagContent(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? stripHtml(match[1]) : null;
}

function extractMetaDescription(html) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractParagraphs(html, limit = 10) {
  return Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean)
    .filter((text) => text.length > 35)
    .slice(0, limit);
}

function extractHeadings(html, tagName, limit = 12) {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi")))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeUrl(href, siteUrl) {
  if (!href) {
    return null;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (href.startsWith("//")) {
    return `https:${href}`;
  }

  return `${siteUrl.replace(/\/$/, "")}/${href.replace(/^\//, "")}`;
}

function extractLinks(html, siteUrl, limit = 20) {
  const seen = new Set();

  return Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map((match) => {
      const href = normalizeUrl(match[1], siteUrl);
      const label = stripHtml(match[2]);

      if (!href || !label) {
        return null;
      }

      const key = `${label.toLowerCase()}|${href.toLowerCase()}`;

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);
      return { label, href };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function extractImages(html, siteUrl, limit = 12) {
  const seen = new Set();

  return Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi))
    .map((match) => {
      const src = normalizeUrl(match[1], siteUrl);
      const alt = stripHtml(match[2] ?? "");

      if (!src || seen.has(src.toLowerCase())) {
        return null;
      }

      seen.add(src.toLowerCase());
      return {
        src,
        alt: alt || null
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function summarizeContent(paragraphs, subheadings) {
  const summary = [];

  if (paragraphs[0]) {
    summary.push(`Lead: ${paragraphs[0]}`);
  }

  if (subheadings.length) {
    summary.push(`Subheadings: ${subheadings.slice(0, 5).join(" | ")}`);
  }

  return summary;
}

function buildPageExport(config, html, siteUrl) {
  const pageTitle = extractTagContent(html, "title");
  const heroTitle = extractTagContent(html, "h1");
  const heroSubtitle = extractParagraphs(html, 2)[0] ?? null;
  const paragraphs = extractParagraphs(html, 12);
  const h2s = extractHeadings(html, "h2", 12);
  const h3s = extractHeadings(html, "h3", 12);
  const links = extractLinks(html, siteUrl, 24);
  const images = extractImages(html, siteUrl, 12);

  return {
    key: config.key,
    targetPath: config.targetPath,
    sourceUrl: null,
    pageTitle,
    metaDescription: extractMetaDescription(html),
    heroTitle,
    heroSubtitle,
    paragraphs,
    h2s,
    h3s,
    links,
    images,
    migrationNotes: summarizeContent(paragraphs, h2s)
  };
}

async function fetchPageHtml(config, siteUrl) {
  let lastError = null;

  for (const sourcePath of config.sourcePaths) {
    const sourceUrl = `${siteUrl.replace(/\/$/, "")}${sourcePath}`;

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/pdf"
        }
      });

      if (!response.ok) {
        lastError = new Error(`Unable to fetch ${sourceUrl}. Status: ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (/pdf/i.test(contentType)) {
        return {
          sourceUrl,
          html: "",
          isPdf: true,
          contentType
        };
      }

      return {
        sourceUrl,
        html: await response.text(),
        isPdf: false,
        contentType
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch any source for ${config.key}.`);
}

loadDotEnv();

const { dryRun, siteUrl, outputPath, only } = parseArgs(process.argv.slice(2));
const pages = only.length
  ? PAGE_CONFIG.filter((page) => only.includes(page.key))
  : PAGE_CONFIG;

if (!pages.length) {
  console.error("No marketing pages matched the requested selection.");
  process.exit(1);
}

const exports = [];

for (const page of pages) {
  const fetched = await fetchPageHtml(page, siteUrl);
  const pageExport = fetched.isPdf
    ? {
        key: page.key,
        targetPath: page.targetPath,
        sourceUrl: fetched.sourceUrl,
        pageTitle: page.key === "venue-guide" ? "Stadium Venue Guide" : page.key,
        metaDescription: null,
        heroTitle: null,
        heroSubtitle: null,
        paragraphs: [],
        h2s: [],
        h3s: [],
        links: [],
        images: [],
        migrationNotes: [`Source is a PDF asset and should be handled as a download: ${fetched.sourceUrl}`]
      }
    : buildPageExport(page, fetched.html, siteUrl);
  pageExport.sourceUrl = fetched.sourceUrl;
  exports.push(pageExport);
  console.log(`Fetched ${page.key} from ${fetched.sourceUrl}`);
}

const payload = {
  generatedAt: new Date().toISOString(),
  sourceSite: siteUrl,
  pages: exports
};

if (dryRun) {
  console.log("");
  console.log(`Dry run complete. Prepared ${exports.length} page export${exports.length === 1 ? "" : "s"}.`);
  process.exit(0);
}

const outputFile = resolve(process.cwd(), outputPath);
mkdirSync(resolve(outputFile, ".."), { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log("");
console.log(`Saved ${exports.length} page export${exports.length === 1 ? "" : "s"} to ${outputPath}`);
