create extension if not exists pgcrypto;

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null,
  region text not null,
  summary text,
  hero_copy text,
  guest_capacity_min integer,
  guest_capacity_max integer,
  website_url text,
  enquiry_email text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists venue_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists venue_category_links (
  venue_id uuid not null references venues(id) on delete cascade,
  category_id uuid not null references venue_categories(id) on delete cascade,
  primary key (venue_id, category_id)
);

create table if not exists venue_spaces (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  layout_notes text,
  capacity_standing integer,
  capacity_dining integer,
  capacity_theatre integer,
  created_at timestamptz not null default now()
);

create table if not exists news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_markdown text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  company_name text not null,
  summary text,
  website_url text,
  created_at timestamptz not null default now()
);

create table if not exists club_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  club_name text not null,
  crest_url text,
  venue_name text,
  summary text,
  address text,
  website_url text,
  website_href text,
  social_links jsonb not null default '[]'::jsonb,
  tour_booking_href text,
  non_matchday_phone text,
  non_matchday_email text,
  matchday_phone text,
  matchday_email text,
  introduction_heading text,
  introduction_paragraphs jsonb not null default '[]'::jsonb,
  spaces jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  christmas_text text,
  play_on_pitch_text text,
  tours_text text,
  key_facts jsonb not null default '[]'::jsonb,
  map_embed_url text,
  hero_image_url text,
  christmas_image_url text,
  play_on_pitch_image_url text,
  draft_content jsonb,
  draft_updated_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table club_pages enable row level security;

drop policy if exists "club_pages_public_read_published" on club_pages;
create policy "club_pages_public_read_published"
on club_pages
for select
to anon, authenticated
using (published = true or auth.role() = 'authenticated');

drop policy if exists "club_pages_authenticated_manage" on club_pages;
create policy "club_pages_authenticated_manage"
on club_pages
for all
to authenticated
using (true)
with check (true);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_type text not null,
  name text not null,
  email text not null,
  company_name text,
  phone text,
  message text,
  venue_id uuid references venues(id) on delete set null,
  venue_slug text,
  created_at timestamptz not null default now()
);

create index if not exists venues_region_idx on venues(region);
create index if not exists venues_city_idx on venues(city);
create index if not exists club_pages_published_idx on club_pages(published);
create index if not exists enquiries_created_at_idx on enquiries(created_at desc);
