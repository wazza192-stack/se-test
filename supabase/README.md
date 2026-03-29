# Supabase Workflow

This repo currently keeps:

- `supabase/schema.sql` as the latest schema snapshot
- `supabase/migrations/` as the ordered record of schema changes that need to be applied

## Source Of Truth

For new schema work:

1. add a new SQL file in `supabase/migrations/`
2. make the SQL additive whenever possible
3. apply that migration to the target Supabase project
4. update `supabase/schema.sql` so the snapshot matches the latest intended state

Do not make `schema.sql` the only place a change exists.

## Naming

Use timestamp-style names so ordering stays obvious:

- `YYYYMMDD_short_description.sql`

Example:

- `20260329_add_news_posts.sql`

## Applying A Migration

This repo does not currently depend on the Supabase CLI.

Default apply flow:

1. open the target Supabase project
2. go to SQL Editor
3. paste the contents of the migration file
4. run it in local or staging first when possible
5. run it in production after verification

## Safety Rules

- check `SUPABASE-CONTRACT.md` before changing schema
- treat shared or unclear tables as cross-app contract surfaces
- prefer new tables, nullable columns, new indexes, and JSON fields over destructive edits
- avoid renames and removals unless both repos are coordinated

## After A Migration

After applying schema changes:

1. verify the new table or column exists in Supabase
2. test the related admin flow or public route
3. run `npm run build`
4. keep the migration file in git alongside the app code that depends on it

## Current Example

The first migration added under this workflow is:

- `supabase/migrations/20260329_add_news_posts.sql`
