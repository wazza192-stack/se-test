# AGENTS.md

This file helps coding agents work safely and efficiently in this repository.

## Project Summary

This repo is the rebuild of `stadiumexperience.com`.

Current stack:

- `Astro` for the public website
- `Cloudflare` adapter for deployment
- `Supabase` for structured content and enquiry persistence

The site is public-facing, SEO-sensitive, and intended for real users. Changes should be production-minded rather than prototype-minded.

## Current Priorities

When working in this repo, optimize for:

- public-facing polish
- clear venue discovery journeys
- consistent Stadium Experience branding
- preserving safe public data boundaries
- mobile usability

Do not introduce “prototype”, “demo”, or “concept” wording into user-facing copy unless explicitly asked.

## Key Architectural Rules

### 0. Supabase schema changes are cross-app changes

This repo may share a Supabase project with a separate app repo.

That means:

- do not treat schema changes as repo-local
- do not change shared tables casually
- prefer additive changes
- check `SUPABASE-CONTRACT.md` before proposing or making schema changes
- add new schema changes in `supabase/migrations/` instead of only editing `supabase/schema.sql`

If ownership of a table is unclear, treat it as shared until clarified.

### 0.1 Supabase migration workflow

This repo now uses a simple migration-first workflow:

- create a new SQL file in `supabase/migrations/` for each schema change
- apply that migration to Supabase separately
- then keep `supabase/schema.sql` aligned as the current snapshot

Do not leave a schema change only in `schema.sql`.

### 1. Public club directory

Club list data must come from the configured **public endpoint**, not directly from Supabase tables.

Relevant file:

- `src/lib/club-directory.ts`

Environment variable:

- `PUBLIC_CLUB_DIRECTORY_URL`

Expected response shape:

```json
{
  "clubs": [
    {
      "name": "Club name",
      "crest_url": "https://..."
    }
  ]
}
```

Only use:

- `name`
- `crest_url`

Do not assume admin-only fields exist in that endpoint.

### 2. Club pages

Club pages are currently enriched by fetching public HTML from the live Stadium Experience club pages and parsing useful public content.

Relevant files:

- `src/lib/live-club-pages.ts`
- `src/pages/clubs/[slug].astro`

Important:

- images should only appear when they support the related content
- do not add image galleries just because images exist
- keep sections purposeful and user-friendly
- if the parser is updated, preserve graceful fallback behavior

### 3. Venue data

Venue data is loaded through the shared content layer:

- `src/lib/content.ts`

This file currently supports:

- local fallback data from `src/data/site.ts`
- optional Supabase-backed venue loading

If changing venue data behavior, keep fallback behavior intact unless explicitly changing the data model.

### 4. Enquiries

Enquiries submit through:

- `src/pages/api/enquiries.ts`

This endpoint should remain safe in both modes:

- with Supabase configured
- without Supabase configured

Do not expose private Supabase data or service-role behavior to the browser.

## Environment Variables

Expected local env file:

- `.env`

Template file:

- `.env.example`

Current important variables:

- `PUBLIC_SITE_URL`
- `PUBLIC_CLUB_DIRECTORY_URL`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Notes:

- `.env.example` is documentation only
- real local values belong in `.env`
- after changing `.env`, restart the dev server

## Important Files

### Layout and styling

- `src/layouts/BaseLayout.astro`
- `src/styles/global.css`

Keep design changes consistent with the existing Stadium Experience visual language unless the user asks for a redesign.

### Core pages

- `src/pages/index.astro`
- `src/pages/venues/index.astro`
- `src/pages/venues/[slug].astro`
- `src/pages/clubs/[slug].astro`
- `src/pages/enquire/index.astro`

### Data and helpers

- `src/data/site.ts`
- `src/lib/content.ts`
- `src/lib/club-directory.ts`
- `src/lib/live-club-pages.ts`
- `supabase/README.md`
- `supabase/migrations/`

### Brand handoff files

- `BRAND-GUIDE.md`
- `design-tokens.css`
- `tokens.ts`

These exist partly to support a separate app repo that should feel like part of the same brand.

## Working Style Expectations

When making changes:

- prefer reusable helpers over page-local ad hoc logic
- keep public pages readable and marketing-friendly
- keep mobile layouts usable
- maintain graceful fallback states for network-driven content
- avoid making assumptions about hidden/private data

When changing data-fetching behavior:

- handle loading states
- handle empty states
- handle error states
- preserve stable rendering if the external source changes

## Club Page UX Guidance

For club pages specifically, prioritize this order:

1. what venue/club this is
2. why a public user should care
3. how to enquire or contact
4. what spaces/events are available
5. where it is

Avoid:

- dumping all scraped content without structure
- adding decorative content with no user purpose
- surfacing irrelevant admin/internal details

## Commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Validation

Before finishing substantial work:

- run `npm run build`
- check affected pages for obvious layout regressions
- verify responsive behavior if the change affects layout

## If You Need To Extend This Repo

Preferred sequence:

1. update shared helper/data layer
2. update page template/component
3. update styling
4. run build

If changing scraped club-page logic, test with multiple clubs because live-page structure may vary.

## Shared UI Standards

### Product Feel

- Aim for a professional, editorial, premium feel.
- Keep the visual language calm, confident, and tidy.
- Prefer elegant simplicity over decorative clutter.
- Default to polished, production-quality UI, not placeholder UI.
- Avoid crude cards, rushed spacing, uneven alignment, or generic-looking layouts.
- Every interface should feel intentional, visually balanced, and consistent with the wider product.

### Layout And Spacing

- Use a consistent spacing rhythm across sections, cards, forms, and tables.
- Prefer a smaller number of well-designed components over many weak visual elements.
- Use typography, spacing, borders, colour, and hierarchy deliberately.
- Keep desktop and mobile layouts equally considered.

### Buttons

- Buttons should look like they belong to the same design system across the product.
- Use a small, consistent set of button types rather than inventing one-off button styles.
- Standard button families:
  - primary: main action for the section
  - secondary: supporting action
  - danger: destructive action only
  - link or ghost: low-emphasis utility action
- Primary buttons should always look recognisably primary across the whole product.
- Destructive buttons should always use the same danger treatment everywhere.
- Avoid multiple competing primary buttons in the same area unless there is a strong reason.
- Button shape, radius, height, font weight, and spacing should stay consistent across pages.
- Prefer one standard height for normal buttons and one for compact buttons.
- Button text should be short, direct, and action-led.
- Buttons should not feel oversized, chunky, or overly glossy.
- Disabled buttons should remain legible and clearly intentional.
- Hover, focus, and pressed states should be subtle, consistent, and predictable.

### Tables

- Table headers should have clear hierarchy and feel deliberate without looking heavy.
- Use small chevron sort indicators for sortable columns as the standard across the product, not large arrow glyphs.
- Sort controls should look understated and consistent on every table.
- Tables, filters, and admin panels should feel clean and professional, not bulky or toy-like.

### Cards And Summary Blocks

- Summary cards should not use generic placeholder styling.
- Keep copy short and hierarchy obvious.
- Use restrained emphasis rather than loud colour or oversized treatments.
- Cards should feel integrated with the page rather than bolted on.

### Interaction Expectations

- If a UI change is functional but visually weak, refine it rather than stopping at "works".
- If there are multiple possible UI directions and the choice materially affects the product, pause and ask before committing.
- If a new component introduces a different visual pattern, first check whether an existing product pattern should be reused.
