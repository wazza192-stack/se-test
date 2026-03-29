# Stadium Experience Rebuild

This repository now contains a fresh starter for rebuilding `stadiumexperience.com` on Cloudflare and Supabase.

## Proposed stack

- `Astro` for the public site, because the current website is content-heavy and SEO-led.
- `Cloudflare Workers` for hosting, caching, redirects and edge delivery.
- `Supabase` for structured content, venue data, forms, media metadata and future admin workflows.

## What is included so far

- A fuller public-site prototype with routes for home, about, venues, awards, suppliers, news and enquiries
- Dynamic venue detail pages in `src/pages/venues/[slug].astro`
- Dynamic news article pages in `src/pages/latest-news/[slug].astro`
- Dynamic club pages in `src/pages/clubs/[slug].astro`
- Shared content and Supabase fallback helpers in `src/lib/content.ts`
- A server endpoint for enquiries in `src/pages/api/enquiries.ts`
- Cloudflare config in `wrangler.jsonc`
- Supabase schema starter in `supabase/schema.sql`
- Supabase migration files in `supabase/migrations/`

## Suggested Supabase schema

Start with these tables:

1. `venues`
2. `venue_spaces`
3. `venue_categories`
4. `news_posts`
5. `awards_pages`
6. `suppliers`
7. `club_pages`
8. `enquiries`
9. `downloads`

## Migration order

1. Export and map all current URLs, templates and downloadable assets from the existing website.
2. Import venue content into Supabase with stable slugs and region/category metadata.
3. Rebuild high-value pages and forms first, keeping old URLs covered with redirects.
4. Launch on a Cloudflare preview domain, test SEO parity, then switch the live domain.

## Local setup

Install dependencies:

```bash
npm install
```

Run the site:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment setup

Copy `.env.example` to `.env` and fill in:

- `PUBLIC_SITE_URL`
- `PUBLIC_CLUB_DIRECTORY_URL`
- `PUBLIC_MEDIA_BASE_URL`
- `PUBLIC_IMAGEKIT_URL_ENDPOINT`
- `PUBLIC_OWNED_IMAGE_HOSTS`
- `PUBLIC_OWNED_IMAGE_PREFIXES`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- or use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IMAGEKIT_PRIVATE_KEY`

## Supabase Schema Workflow

This repo now uses a simple schema workflow:

- add each new schema change as a SQL file in `supabase/migrations/`
- apply the migration in Supabase SQL Editor
- keep `supabase/schema.sql` updated as the latest schema snapshot

Read:

- `supabase/README.md`
- `SUPABASE-CONTRACT.md`

Current example migration:

- `supabase/migrations/20260329_add_news_posts.sql`

## Admin area

A simple admin foundation now exists at:

- `/admin/login/`
- `/admin/`

It uses Supabase Auth in the browser with the anon key and is intended as a starting point for
simple website content editing.

## Deployment notes

- The current Cloudflare adapter warns that a `SESSION` KV binding will be needed at deploy time.
- Recommended media strategy: store editor-managed images in ImageKit and save the owned delivery URL into the existing Supabase `*_image_url` fields.
- Set `PUBLIC_MEDIA_BASE_URL` and `PUBLIC_IMAGEKIT_URL_ENDPOINT` to your ImageKit URL endpoint, for example `https://ik.imagekit.io/your_imagekit_id`.
- Set `PUBLIC_OWNED_IMAGE_PREFIXES` to that same ImageKit endpoint so shared image validation can recognise your account-specific delivery URLs.
- Set `IMAGEKIT_PRIVATE_KEY` on the server so the admin upload flow can send files to ImageKit.
- `MEDIA_BUCKET` in `wrangler.jsonc` is now optional and only needed if you want the older R2-backed fallback path.
- Keep only stable brand/editorial assets in `public/assets/...`; do not rely on old WordPress upload URLs long term.
- The enquiry endpoint will work in prototype mode without Supabase, but it only persists submissions once the Supabase env vars are configured.

## Club page migration

Club pages currently support a migration bridge:

- canonical data source: `club_pages` in Supabase
- fallback source: live public HTML from the existing Stadium Experience club pages

Long term, the old-site HTML fallback should be removed once club content has been migrated into
Supabase-backed website content.
