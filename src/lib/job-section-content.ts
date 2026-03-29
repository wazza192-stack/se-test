export type JobSectionBullet = {
  text: string;
  level: 1 | 2;
};

export type JobSectionContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "bullet";
      text: string;
      level: 1 | 2;
    };

type JobSectionLike = {
  heading?: unknown;
  content?: unknown;
  body?: unknown;
  bullets?: unknown;
};

function asTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normaliseContent(value: unknown): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n") : "";
}

export function splitJobSectionParagraphs(value: unknown): string[] {
  return normaliseContent(value)
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/[ \t]+$/gm, "").trim())
    .filter(Boolean);
}

export function parseJobSectionContent(value: unknown): JobSectionContentBlock[] {
  const lines = normaliseContent(value).split("\n");
  const blocks: JobSectionContentBlock[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.map((line) => line.trim()).join(" ").trim();
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
    paragraphLines = [];
  };

  for (const line of lines) {
    const expandedLine = line.replace(/\t/g, "  ").replace(/[ \t]+$/g, "");

    if (!expandedLine.trim()) {
      flushParagraph();
      continue;
    }

    const bulletMatch = expandedLine.match(/^(\s*)[-*•]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      const text = bulletMatch[2]?.trim();
      if (text) {
        blocks.push({
          type: "bullet",
          text,
          level: bulletMatch[1].length >= 2 ? 2 : 1
        });
      }
      continue;
    }

    paragraphLines.push(expandedLine);
  }

  flushParagraph();
  return blocks;
}

export function getJobSectionBullets(blocks: JobSectionContentBlock[]): JobSectionBullet[] {
  return blocks
    .filter((block): block is Extract<JobSectionContentBlock, { type: "bullet" }> => block.type === "bullet")
    .map((block) => ({
      text: block.text,
      level: block.level
    }));
}

export function getJobSectionBody(blocks: JobSectionContentBlock[]): string[] {
  return blocks
    .filter((block): block is Extract<JobSectionContentBlock, { type: "paragraph" }> => block.type === "paragraph")
    .map((block) => block.text);
}

export function buildJobSectionContent(blocks: JobSectionContentBlock[]): string {
  const lines: string[] = [];
  let previousType: JobSectionContentBlock["type"] | null = null;

  for (const block of blocks) {
    if (lines.length > 0 && previousType !== block.type) {
      lines.push("");
    }

    if (block.type === "paragraph") {
      lines.push(block.text);
    } else {
      lines.push(`${block.level === 2 ? "  " : ""}- ${block.text}`);
    }

    previousType = block.type;
  }

  return lines.join("\n");
}

export function buildJobSectionContentFromLegacy(body: unknown, bullets: unknown): string {
  const blocks: JobSectionContentBlock[] = [];

  if (Array.isArray(body)) {
    for (const paragraph of body) {
      const text = asTrimmedString(paragraph);
      if (text) {
        blocks.push({ type: "paragraph", text });
      }
    }
  }

  if (Array.isArray(bullets)) {
    for (const bullet of bullets) {
      if (!bullet || typeof bullet !== "object") {
        continue;
      }

      const text = asTrimmedString((bullet as Record<string, unknown>).text);
      if (!text) {
        continue;
      }

      blocks.push({
        type: "bullet",
        text,
        level: Number((bullet as Record<string, unknown>).level) === 2 ? 2 : 1
      });
    }
  }

  return buildJobSectionContent(blocks);
}

export function normaliseJobSections(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section) => {
      if (!section || typeof section !== "object") {
        return null;
      }

      const candidate = section as JobSectionLike;
      const heading = asTrimmedString(candidate.heading) ?? "Role description";
      const content =
        normaliseContent(candidate.content).trim() ||
        buildJobSectionContentFromLegacy(candidate.body, candidate.bullets);
      const blocks = parseJobSectionContent(content);
      const body = getJobSectionBody(blocks);
      const bullets = getJobSectionBullets(blocks);

      return content.trim()
        ? {
            heading,
            content,
            body,
            bullets
          }
        : null;
    })
    .filter(
      (
        section
      ): section is {
        heading: string;
        content: string;
        body: string[];
        bullets: JobSectionBullet[];
      } => Boolean(section)
    );
}
