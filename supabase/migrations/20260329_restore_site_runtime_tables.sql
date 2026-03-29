create table if not exists public.venues (
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

alter table if exists public.venues add column if not exists summary text;
alter table if exists public.venues add column if not exists hero_copy text;
alter table if exists public.venues add column if not exists guest_capacity_min integer;
alter table if exists public.venues add column if not exists guest_capacity_max integer;
alter table if exists public.venues add column if not exists website_url text;
alter table if exists public.venues add column if not exists enquiry_email text;
alter table if exists public.venues add column if not exists published boolean not null default false;
alter table if exists public.venues add column if not exists updated_at timestamptz not null default now();

alter table public.venues enable row level security;

drop trigger if exists set_venues_updated_at on public.venues;
create trigger set_venues_updated_at
  before update on public.venues
  for each row execute procedure public.touch_updated_at();

drop policy if exists "venues_select_published" on public.venues;
drop policy if exists "venues_admin_manage" on public.venues;

create policy "venues_select_published"
  on public.venues
  for select
  using (published = true or public.is_admin());

create policy "venues_admin_manage"
  on public.venues
  for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.club_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  club_name text not null,
  club_size text check (club_size in ('small', 'medium', 'large')),
  crest_url text,
  venue_name text,
  summary text,
  address text,
  latitude double precision,
  longitude double precision,
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
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.club_pages add column if not exists club_size text;
alter table if exists public.club_pages add column if not exists latitude double precision;
alter table if exists public.club_pages add column if not exists longitude double precision;
alter table if exists public.club_pages add column if not exists archived boolean not null default false;
alter table if exists public.club_pages add column if not exists updated_at timestamptz not null default now();
alter table if exists public.club_pages drop constraint if exists club_pages_club_size_check;
alter table if exists public.club_pages
  add constraint club_pages_club_size_check
  check (club_size in ('small', 'medium', 'large'));

alter table public.club_pages enable row level security;

drop trigger if exists set_club_pages_updated_at on public.club_pages;
create trigger set_club_pages_updated_at
  before update on public.club_pages
  for each row execute procedure public.touch_updated_at();

drop policy if exists "club_pages_public_read_published" on public.club_pages;
drop policy if exists "club_pages_authenticated_manage" on public.club_pages;
drop policy if exists "club_pages_select_published" on public.club_pages;
drop policy if exists "club_pages_admin_manage" on public.club_pages;

create policy "club_pages_select_published"
  on public.club_pages
  for select
  using (((published = true) and (archived = false)) or public.is_admin());

create policy "club_pages_admin_manage"
  on public.club_pages
  for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_type text not null,
  name text not null,
  email text not null,
  company_name text,
  phone text,
  message text,
  venue_id uuid references public.venues(id) on delete set null,
  venue_slug text,
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

create index if not exists venues_region_idx on public.venues(region);
create index if not exists venues_city_idx on public.venues(city);
create index if not exists club_pages_published_idx on public.club_pages(published, archived);
create index if not exists enquiries_created_at_idx on public.enquiries(created_at desc);
