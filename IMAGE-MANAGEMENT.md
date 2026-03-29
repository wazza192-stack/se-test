# Image Management

This repo now treats image ownership as an explicit content concern.

## Current Decision

Use `Option A` now, backed by owned media URLs without changing the current schema:

- keep the existing URL fields in Supabase
- move content-managed images into storage we control
- replace legacy URLs with owned URLs
- avoid adding schema changes until an upload workflow is ready

This fits the current repo architecture and avoids cross-app schema risk.

## What Counts As Owned

Safe image sources for this repo are:

- local repo assets such as `/assets/...`
- site-managed URLs on the Stadium Experience domain that are not legacy WordPress uploads
- remote hosts listed in `PUBLIC_OWNED_IMAGE_HOSTS`

Legacy WordPress uploads such as `/wp-content/uploads/...` should be treated as migration debt, not a permanent source.

## Immediate Rules

- use `public/assets/...` only for stable brand and editorial assets we want in the repo
- keep content-managed images in storage we control, then store those owned URLs in the existing URL fields
- do not treat old-site WordPress upload URLs as safe long-term
- keep the live club-page HTML scrape as text/content fallback only, not an essential image source

## Current Implementation

- `src/lib/media.ts` classifies image URLs as local, owned, legacy WordPress, or external
- automatic club-page live fallback now drops legacy WordPress image URLs instead of assuming they are safe
- admin editors warn when image fields use legacy or unowned hosts
- an admin upload endpoint is ready at `/api/admin/media/upload`

## Recommended Setup

Use `ImageKit` as the default managed-image path for this repo:

- keep storing the final public image URL in Supabase, not an internal asset ID
- use the ImageKit URL endpoint as `PUBLIC_MEDIA_BASE_URL`
- keep the server-side private key on the backend only
- continue to use local `/assets/...` paths only for fixed repo-managed assets

Example endpoint:

- `https://ik.imagekit.io/your_imagekit_id`

Suggested object keys:

- `clubs/{club-slug}/crest.{ext}`
- `clubs/{club-slug}/hero.{ext}`
- `clubs/{club-slug}/christmas.{ext}`
- `clubs/{club-slug}/play-on-pitch.{ext}`
- `news/{year}/{post-slug}/cover.{ext}`
- `awards/{type}/{slug}/hero.{ext}`

Helper functions for these conventions now live in `src/lib/media-paths.ts`.

`Cloudflare R2` is still supported as a fallback path if needed, but it is no longer the primary recommendation in this repo.

## Recommended Rollout

1. Inventory current image URLs in `club_pages`, `news_posts`, and the public club directory endpoint.
   Run `npm run audit:image-urls` for a grouped summary, or `npm run audit:image-urls -- --verbose` for every flagged row and URL.
2. Copy legacy assets into ImageKit-managed storage and serve them from the owned endpoint.
3. Replace stored URLs in the existing fields.
4. Add uploads/selectors in admin later, once the storage path and editor workflow are agreed.

The first upload flow is now wired for club images and news cover images. For ImageKit-backed uploads,
configure the ImageKit env vars below. For an R2 fallback, keep the `MEDIA_BUCKET` binding configured.

## Environment

Use:

- `PUBLIC_MEDIA_BASE_URL` for the public media base URL, for example `https://ik.imagekit.io/your_imagekit_id`
- `PUBLIC_IMAGEKIT_URL_ENDPOINT` for the ImageKit URL endpoint, usually the same value as `PUBLIC_MEDIA_BASE_URL`
- `PUBLIC_OWNED_IMAGE_PREFIXES` for account-specific owned URL prefixes, for example `https://ik.imagekit.io/your_imagekit_id`
- `PUBLIC_OWNED_IMAGE_HOSTS` for extra owned hosts when you use a dedicated media domain
- `IMAGEKIT_PRIVATE_KEY` for server-side uploads from the admin area
