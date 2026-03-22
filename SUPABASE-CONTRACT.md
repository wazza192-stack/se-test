# SUPABASE-CONTRACT.md

This document exists because the public website in this repo and a separate app repo may share the same Supabase project.

That means schema changes in one repo can affect the other repo even if the codebases remain separate.

## Core Rule

Do not treat Supabase schema changes as repo-local changes.

If a table, view, function, or policy is shared by both the website and the other app, any change must be treated as a shared contract change.

## Goals

- keep the website and app from breaking each other
- make table ownership clear
- reduce accidental schema drift
- allow additive changes while avoiding destructive surprises

## Ownership Model

Every table should have one of these statuses:

- `website-owned`
- `app-owned`
- `shared`

### Website-owned

The website repo can evolve these with much lower coordination risk, as long as the other app does not depend on them.

Current or proposed website-owned tables:

- `club_pages`

Likely website-owned or website-first tables:

- `news_posts`
- `venue_categories`
- `venue_category_links`

### App-owned

These belong primarily to the other app and should not be changed from this repo without coordination.

Examples:

- admin workflow tables
- app-specific user workflow tables
- operational reporting tables

If ownership is unclear, treat the table as `shared` until clarified.

### Shared

These must be considered cross-app contract surfaces.

Likely shared or potentially shared tables:

- `venues`
- `venue_spaces`
- `suppliers`
- `enquiries`

## Safe Change Rules

### Safer changes

These are generally safer when coordinated properly:

- adding a new table
- adding a nullable column
- adding a new index
- adding a new view
- adding a new JSON field used only by one surface

### Risky changes

These should be assumed risky until proven otherwise:

- renaming tables
- renaming columns
- removing columns
- changing column meanings
- changing enums or constrained values
- changing row-level security policies
- changing foreign key behavior
- changing data formats used by the other app

## Recommended Process For Schema Changes

Before making a schema change:

1. Identify whether the affected table is website-owned, app-owned, or shared.
2. If shared or unknown, review the other app before changing anything.
3. Prefer additive changes first.
4. Avoid destructive changes unless both repos have been updated and verified.
5. Update this contract if ownership or usage changes.

## Club Page Migration Plan

The long-term intention is:

- club-page content should live in Supabase
- the public website should read from Supabase first
- the old-site HTML scrape should be temporary fallback only

The proposed table:

- `club_pages`

Recommended status:

- `website-owned`

Why:

- it supports public marketing-site pages
- it should not be required by the other app unless that app later chooses to consume it

## Shared Read Models

If both repos need the same entity, prefer one of these:

1. a clearly shared table with documented fields
2. a public API layer over Supabase
3. a stable view that protects each repo from low-level table churn

This is often safer than letting both repos depend directly on raw base tables with different assumptions.

## Current Guidance For This Repo

When working in this website repo:

- do not assume the website is the only consumer of Supabase
- do not repurpose existing tables without checking ownership
- prefer website-owned tables for website-specific content
- treat `club_pages` as the preferred long-term source for club-page content
- treat the live-site HTML fallback as temporary migration support only

## What To Clarify With The Other App

Before larger schema work, confirm:

1. Which Supabase tables the other app reads from
2. Which tables it writes to
3. Whether it expects strict field names/types on shared entities
4. Whether it already has a club/content model that should be reused instead of duplicated

## Recommended Next Step

Create the same or similar contract file in the other app repo, and keep the ownership model aligned in both places.
