# Stadium Experience Brand Guide

Use this guide when building the separate app repo so it feels like part of the same Stadium Experience product family while the codebases remain separate.

## Core Goal

The marketing site and the app should feel like they belong to the same brand:

- same logo placement
- same color system
- same typography mood
- same button and card language
- same tone of voice

The app can be more functional than the website, but it should not feel like a different company.

## Logo And Header

The Stadium Experience logo should appear in the **top left** of the app shell, matching the website pattern.

Implementation guidance:

- Use the same logo asset: `public/assets/stadium-experience/logo.svg`
- Keep it in the top-left corner of the main app header
- Give it clear breathing room, not cramped against the edge
- If the app has a dashboard/sidebar layout, the logo should still anchor the top-left brand area
- Clicking the logo should return users to the app home/dashboard

Recommended header behavior:

- soft white/glass surface
- rounded container when appropriate
- subtle shadow
- dark text with green primary action

## Brand Tokens

These are the key visual tokens to mirror in the app repo.

### Colors

- `--bg: #eef1ea`
- `--bg-deep: #dde4d7`
- `--surface: rgba(255, 255, 255, 0.9)`
- `--surface-strong: #ffffff`
- `--surface-soft: #f5f7f1`
- `--surface-tint: #ebf0e5`
- `--text: #172118`
- `--muted: #596355`
- `--muted-strong: #465044`
- `--line: rgba(24, 33, 24, 0.1)`
- `--line-strong: rgba(24, 33, 24, 0.18)`
- `--brand: #97b81b`
- `--brand-strong: #7d9715`
- `--brand-deep: #3d4f0d`
- `--accent: #123c33`
- `--accent-soft: #e3ece8`

### Radius

- cards: `18px`
- large panels/hero containers: `28px` to `30px`
- pill buttons/tags: `999px`

### Shadows

- soft elevation: `0 18px 40px rgba(18, 29, 18, 0.08)`
- richer feature surfaces: `0 28px 70px rgba(14, 24, 14, 0.14)`

## Typography

Match the mood, not necessarily the exact font stack if the app repo differs.

- Headings: elegant editorial serif feel
- Body/UI: clean modern sans-serif
- Headings should feel premium and confident, not tech-startup generic
- Body copy should stay practical and readable

If exact font parity is possible, use:

- Serif-style heading voice similar to `adobe-caslon-pro`
- Sans-serif UI/body similar to `neo-sans`

## Layout Style

The visual language should feel:

- premium
- calm
- professional
- venue and hospitality oriented

Avoid:

- harsh flat white screens with no depth
- generic SaaS dashboard blue styling
- over-animated UI
- sharp corners everywhere
- overly playful components

Preferred patterns:

- layered light backgrounds
- soft glass or tinted white surfaces
- subtle gradients
- restrained shadows
- generous spacing

## Buttons

### Primary

- green gradient background
- white text
- pill shape
- strong but not loud

Suggested style:

- background: `linear-gradient(135deg, #97b81b 0%, #7d9715 100%)`
- text: `#ffffff`
- border: `#7d9715`

### Secondary

- light surface
- subtle border
- refined, quiet treatment
- should still feel premium rather than default

## Cards And Panels

Cards should use:

- soft white or tinted white surfaces
- rounded corners
- subtle border
- soft shadow

Use stronger treatment for important panels:

- testimonials
- summaries
- confirmation panels
- key stats

## Forms

Forms in the app should borrow from the same language as the site:

- rounded inputs
- light borders
- generous vertical rhythm
- clear labels
- green primary submit actions

Avoid dense enterprise-style forms unless the workflow truly requires it.

## Tone Of Voice

All product copy should feel like the same brand as the site:

- professional
- direct
- trustworthy
- practical
- venue and hospitality aware

Avoid words like:

- prototype
- demo
- concept
- mock
- placeholder

Prefer wording like:

- direct enquiries
- venue teams
- planners
- member venues
- meetings, conferences and events

## App-Specific Guidance

Even if the app is more functional, keep these shared brand anchors:

- logo top-left
- green primary actions
- same neutral/brand palette
- same corner radius system
- same editorial heading style where appropriate
- same empty-state and CTA tone

For denser app screens:

- use cleaner spacing before adding more borders
- use tinted backgrounds to separate sections
- use 1-2 emphasis colors only

## Prompt For The Other Repo

Use this prompt in the app repo:

```text
This app must feel like part of the same Stadium Experience brand as our separate marketing website, while staying in its own repo for now.

Please restyle this app to match the shared brand language below.

Non-negotiable brand rule:
- Put the Stadium Experience logo in the top-left of the app header/shell, using the same logo treatment as the website.

Brand direction:
- Premium, professional, modern UK venue/hospitality feel
- Editorial, confident, calm
- Not generic SaaS
- Not overly playful

Use these design tokens:
- bg: #eef1ea
- bg-deep: #dde4d7
- surface: rgba(255,255,255,0.9)
- surface-strong: #ffffff
- surface-soft: #f5f7f1
- text: #172118
- muted: #596355
- muted-strong: #465044
- line: rgba(24,33,24,0.1)
- line-strong: rgba(24,33,24,0.18)
- brand: #97b81b
- brand-strong: #7d9715
- brand-deep: #3d4f0d
- accent: #123c33

Visual rules:
- cards radius 18px
- major panels radius 28-30px
- pill buttons/tags
- primary buttons use green gradient with white text
- secondary buttons use a light premium surface with subtle border
- soft shadows, not heavy dark shadows
- use an editorial serif feel for major headings and a clean sans-serif for body/UI

UI requirements:
1. Put the Stadium Experience logo at the top-left of the app shell/header.
2. Update theme/design tokens first.
3. Restyle navigation, forms, cards, buttons, and page shells to match this brand.
4. Keep the app responsive on mobile.
5. Make all copy sound professional and trustworthy.
6. Remove any wording that sounds like a prototype, mockup, or internal tool unless absolutely necessary.

When finished, summarize:
- what changed
- what still feels visually inconsistent with the website
- what should eventually be shared across both repos
```

## Shared Asset

If you want to copy the same logo into the app repo, use:

- `public/assets/stadium-experience/logo.svg`

If the other repo supports shared static assets, keep the same filename and path structure if possible to reduce drift later.
