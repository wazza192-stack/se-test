create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  judge_qualifications text,
  role text not null default 'judge' check (role in ('judge', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists judge_qualifications text;
alter table public.profiles add column if not exists role text not null default 'judge';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = check_user
      and p.role = 'admin'
  );
$$;

create table if not exists public.judge_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'judge' check (role in ('judge')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.accept_judge_invite()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_email text;
begin
  if auth.uid() is null then
    return;
  end if;

  invite_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if invite_email = '' then
    return;
  end if;

  if exists (select 1 from public.judge_invites i where lower(i.email) = invite_email) then
    insert into public.profiles (id, email, role)
    values (auth.uid(), invite_email, 'judge')
    on conflict (id) do update
      set email = excluded.email,
          role = case when public.profiles.role = 'admin' then 'admin' else 'judge' end,
          updated_at = now();

    update public.judge_invites
      set accepted_at = coalesce(accepted_at, now()),
          accepted_by = coalesce(accepted_by, auth.uid()),
          updated_at = now()
    where lower(email) = invite_email;
  end if;
end;
$$;

create table if not exists public.judging_reports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  club_name text,
  awards_year text default '2027',
  category text default 'Matchday Hospitality Report',
  caterer text,
  match_attended text,
  date_visited date,
  judge_name text,
  report_date date,
  signed_by_judge text,
  judge_qualifications text,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  responses jsonb not null default '{}'::jsonb,
  general_comments text,
  raw_total numeric(6,1) not null default 0,
  applicable_max integer not null default 0,
  percentage numeric(5,2) not null default 0,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.judging_reports add column if not exists judge_name text;
alter table public.judging_reports add column if not exists awards_year text default '2027';
alter table public.judging_reports add column if not exists judge_qualifications text;
alter table public.judging_reports add column if not exists category text default 'Matchday Hospitality Report';

create or replace function public.list_submitted_report_slots()
returns table (
  id uuid,
  club_name text,
  awards_year text,
  category text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.club_name,
    r.awards_year,
    r.category
  from public.judging_reports r
  where r.status = 'submitted'
    and r.club_name is not null
    and btrim(r.club_name) <> '';
$$;

grant execute on function public.list_submitted_report_slots() to authenticated;


create table if not exists public.award_year_clubs (
  id uuid primary key default gen_random_uuid(),
  awards_year text not null,
  stadiumexperience_club_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.award_year_clubs add column if not exists awards_year text;
alter table public.award_year_clubs add column if not exists stadiumexperience_club_id uuid;

create table if not exists public.caterers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.caterers add column if not exists name text;
create unique index if not exists ux_caterers_name on public.caterers (lower(btrim(name)));

create table if not exists public.stadiumexperience_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_page_url text not null unique,
  crest_url text,
  club_size text check (club_size in ('small', 'medium', 'large')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stadiumexperience_clubs add column if not exists name text;
alter table public.stadiumexperience_clubs add column if not exists source_page_url text;
alter table public.stadiumexperience_clubs add column if not exists crest_url text;
alter table public.stadiumexperience_clubs add column if not exists club_size text;
alter table public.stadiumexperience_clubs drop constraint if exists stadiumexperience_clubs_club_size_check;
alter table public.stadiumexperience_clubs
  add constraint stadiumexperience_clubs_club_size_check
  check (club_size in ('small', 'medium', 'large'));
create unique index if not exists ux_stadiumexperience_clubs_name on public.stadiumexperience_clubs (lower(btrim(name)));

alter table public.award_year_clubs
  drop constraint if exists award_year_clubs_stadiumexperience_club_id_fkey;
alter table public.award_year_clubs
  add constraint award_year_clubs_stadiumexperience_club_id_fkey
  foreign key (stadiumexperience_club_id) references public.stadiumexperience_clubs(id) on delete cascade;

create table if not exists public.awards_years (
  id uuid primary key default gen_random_uuid(),
  year text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.awards_years add column if not exists year text;
alter table public.awards_years add column if not exists is_active boolean not null default false;
create unique index if not exists ux_awards_years_year on public.awards_years (lower(btrim(year)));

create or replace function public.create_award_year(next_year text)
returns public.awards_years
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_year text := btrim(next_year);
  result_row public.awards_years;
begin
  if cleaned_year = '' then
    raise exception 'Award year is required.';
  end if;

  if not public.is_admin() then
    raise exception 'Only admins can create award years.';
  end if;

  update public.awards_years
    set is_active = false
  where is_active = true;

  insert into public.awards_years (year, is_active)
  values (cleaned_year, true)
  on conflict (year) do update
    set is_active = true,
        updated_at = now()
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.create_award_year(text) to authenticated;

insert into public.awards_years (year, is_active)
values ('2027', true)
on conflict (year) do update
set is_active = excluded.is_active;

insert into public.caterers (name)
values
  ('Sodexo Live!'),
  ('Levy UK + Ireland'),
  ('Delaware North'),
  ('Compass Group'),
  ('Aramark'),
  ('Centerplate'),
  ('In-house / Club operated')
on conflict do nothing;

create table if not exists public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.judging_reports(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('judge-report-files', 'judge-report-files', false)
on conflict (id) do nothing;

drop trigger if exists set_profiles_updated_at on public.profiles;
drop trigger if exists set_judge_invites_updated_at on public.judge_invites;
drop trigger if exists set_judging_reports_updated_at on public.judging_reports;
drop trigger if exists set_report_attachments_updated_at on public.report_attachments;
drop trigger if exists set_award_year_clubs_updated_at on public.award_year_clubs;
drop trigger if exists set_caterers_updated_at on public.caterers;
drop trigger if exists set_stadiumexperience_clubs_updated_at on public.stadiumexperience_clubs;
drop trigger if exists set_awards_years_updated_at on public.awards_years;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

create trigger set_judge_invites_updated_at
  before update on public.judge_invites
  for each row execute procedure public.touch_updated_at();

create trigger set_judging_reports_updated_at
  before update on public.judging_reports
  for each row execute procedure public.touch_updated_at();

create trigger set_report_attachments_updated_at
  before update on public.report_attachments
  for each row execute procedure public.touch_updated_at();

create trigger set_award_year_clubs_updated_at
  before update on public.award_year_clubs
  for each row execute procedure public.touch_updated_at();

create trigger set_caterers_updated_at
  before update on public.caterers
  for each row execute procedure public.touch_updated_at();

create trigger set_stadiumexperience_clubs_updated_at
  before update on public.stadiumexperience_clubs
  for each row execute procedure public.touch_updated_at();

create trigger set_awards_years_updated_at
  before update on public.awards_years
  for each row execute procedure public.touch_updated_at();


alter table public.profiles enable row level security;
alter table public.judge_invites enable row level security;
alter table public.judging_reports enable row level security;
alter table public.report_attachments enable row level security;
alter table public.award_year_clubs enable row level security;
alter table public.caterers enable row level security;
alter table public.stadiumexperience_clubs enable row level security;
alter table public.awards_years enable row level security;

-- clean up old policies
 drop policy if exists "Users can view their own profile" on public.profiles;
 drop policy if exists "Users can update their own profile" on public.profiles;
 drop policy if exists "Users can insert their own profile" on public.profiles;
 drop policy if exists "profiles_select" on public.profiles;
 drop policy if exists "profiles_update" on public.profiles;
 drop policy if exists "profiles_insert" on public.profiles;
 drop policy if exists "judge_invites_admin_select" on public.judge_invites;
 drop policy if exists "judge_invites_admin_insert" on public.judge_invites;
 drop policy if exists "judge_invites_admin_update" on public.judge_invites;
 drop policy if exists "judge_invites_admin_delete" on public.judge_invites;
 drop policy if exists "Judges can view their own reports or admins can view all" on public.judging_reports;
 drop policy if exists "Judges can create their own reports" on public.judging_reports;
 drop policy if exists "Judges can update their own reports or admins can update all" on public.judging_reports;
 drop policy if exists "Admins can delete reports" on public.judging_reports;
 drop policy if exists "reports_select" on public.judging_reports;
 drop policy if exists "reports_insert" on public.judging_reports;
 drop policy if exists "reports_update" on public.judging_reports;
 drop policy if exists "reports_update_judge_draft_only" on public.judging_reports;
 drop policy if exists "reports_update_admin" on public.judging_reports;
 drop policy if exists "reports_delete" on public.judging_reports;
 drop policy if exists "attachments_select" on public.report_attachments;
 drop policy if exists "attachments_insert" on public.report_attachments;
 drop policy if exists "attachments_delete" on public.report_attachments;
 drop policy if exists "attachments_update" on public.report_attachments;
 drop policy if exists "judge files read" on storage.objects;
 drop policy if exists "judge files upload" on storage.objects;
 drop policy if exists "judge files update" on storage.objects;
 drop policy if exists "judge files delete" on storage.objects;
 drop policy if exists "award_year_clubs_select" on public.award_year_clubs;
 drop policy if exists "award_year_clubs_admin_manage" on public.award_year_clubs;
 drop policy if exists "caterers_select" on public.caterers;
 drop policy if exists "caterers_admin_manage" on public.caterers;
 drop policy if exists "stadiumexperience_clubs_select" on public.stadiumexperience_clubs;
 drop policy if exists "stadiumexperience_clubs_admin_manage" on public.stadiumexperience_clubs;
 drop policy if exists "awards_years_select" on public.awards_years;
 drop policy if exists "awards_years_admin_manage" on public.awards_years;

create policy "profiles_select"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update"
  on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "profiles_insert"
  on public.profiles
  for insert
  with check (auth.uid() = id or public.is_admin());

create policy "judge_invites_admin_select"
  on public.judge_invites
  for select
  using (public.is_admin());

create policy "judge_invites_admin_insert"
  on public.judge_invites
  for insert
  with check (public.is_admin());

create policy "judge_invites_admin_update"
  on public.judge_invites
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "judge_invites_admin_delete"
  on public.judge_invites
  for delete
  using (public.is_admin());

create policy "reports_select"
  on public.judging_reports
  for select
  using (created_by = auth.uid() or public.is_admin());

create policy "reports_insert"
  on public.judging_reports
  for insert
  with check (created_by = auth.uid() or public.is_admin());

create policy "reports_update_admin"
  on public.judging_reports
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "reports_update_judge_draft_only"
  on public.judging_reports
  for update
  using (created_by = auth.uid() and status = 'draft')
  with check (created_by = auth.uid());

create policy "reports_delete"
  on public.judging_reports
  for delete
  using ((created_by = auth.uid() and status = 'draft') or public.is_admin());

create policy "attachments_select"
  on public.report_attachments
  for select
  using (
    exists (
      select 1
      from public.judging_reports r
      where r.id = report_id
        and (r.created_by = auth.uid() or public.is_admin())
    )
  );

create policy "attachments_insert"
  on public.report_attachments
  for insert
  with check (
    exists (
      select 1
      from public.judging_reports r
      where r.id = report_id
        and r.status = 'draft'
        and (r.created_by = auth.uid() or public.is_admin())
    )
  );

create policy "attachments_update"
  on public.report_attachments
  for update
  using (
    exists (
      select 1
      from public.judging_reports r
      where r.id = report_id
        and r.status = 'draft'
        and (r.created_by = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.judging_reports r
      where r.id = report_id
        and r.status = 'draft'
        and (r.created_by = auth.uid() or public.is_admin())
    )
  );

create policy "attachments_delete"
  on public.report_attachments
  for delete
  using (
    exists (
      select 1
      from public.judging_reports r
      where r.id = report_id
        and r.status = 'draft'
        and (r.created_by = auth.uid() or public.is_admin())
    )
  );


create policy "award_year_clubs_select"
  on public.award_year_clubs
  for select
  using (auth.role() = 'authenticated');

create policy "award_year_clubs_admin_manage"
  on public.award_year_clubs
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "caterers_select"
  on public.caterers
  for select
  using (auth.role() = 'authenticated');

create policy "caterers_admin_manage"
  on public.caterers
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "stadiumexperience_clubs_select"
  on public.stadiumexperience_clubs
  for select
  using (auth.role() = 'authenticated');

create policy "stadiumexperience_clubs_admin_manage"
  on public.stadiumexperience_clubs
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "awards_years_select"
  on public.awards_years
  for select
  using (auth.role() = 'authenticated');

create policy "awards_years_admin_manage"
  on public.awards_years
  for all
  using (public.is_admin())
  with check (public.is_admin());


create policy "judge files read"
  on storage.objects
  for select
  using (bucket_id = 'judge-report-files' and auth.role() = 'authenticated');

create policy "judge files upload"
  on storage.objects
  for insert
  with check (bucket_id = 'judge-report-files' and auth.role() = 'authenticated');

create policy "judge files update"
  on storage.objects
  for update
  using (bucket_id = 'judge-report-files' and auth.role() = 'authenticated')
  with check (bucket_id = 'judge-report-files' and auth.role() = 'authenticated');

create policy "judge files delete"
  on storage.objects
  for delete
  using (bucket_id = 'judge-report-files' and auth.role() = 'authenticated');

create index if not exists idx_judging_reports_created_by on public.judging_reports(created_by);
create index if not exists idx_judge_invites_email on public.judge_invites(lower(email));
create index if not exists idx_report_attachments_report_id on public.report_attachments(report_id);
create index if not exists idx_award_year_clubs_awards_year on public.award_year_clubs(awards_year);
create index if not exists idx_award_year_clubs_source_id on public.award_year_clubs(stadiumexperience_club_id);
create unique index if not exists ux_award_year_clubs_year_source
  on public.award_year_clubs (awards_year, stadiumexperience_club_id);
create index if not exists idx_caterers_name on public.caterers(lower(btrim(name)));
create index if not exists idx_awards_years_active on public.awards_years(is_active);
create unique index if not exists ux_judging_reports_creator_club_year
  on public.judging_reports (created_by, awards_year, lower(btrim(club_name)))
  where club_name is not null and btrim(club_name) <> '';
create unique index if not exists ux_judging_reports_submitted_club_year_category
  on public.judging_reports (awards_year, lower(btrim(category)), lower(btrim(club_name)))
  where status = 'submitted'
    and club_name is not null and btrim(club_name) <> ''
    and category is not null and btrim(category) <> '';

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
alter table if exists public.club_pages
  add column if not exists archived boolean not null default false;
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

create table if not exists public.stadium_jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  location text,
  employment_type text,
  summary text,
  description text,
  content_sections jsonb,
  salary text,
  hours text,
  job_location text,
  closing_date text,
  application_url text,
  contact_email text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.stadium_jobs
  add column if not exists content_sections jsonb;
alter table if exists public.stadium_jobs
  add column if not exists salary text;
alter table if exists public.stadium_jobs
  add column if not exists hours text;
alter table if exists public.stadium_jobs
  add column if not exists job_location text;
alter table if exists public.stadium_jobs
  add column if not exists closing_date text;

alter table public.stadium_jobs enable row level security;

drop trigger if exists set_stadium_jobs_updated_at on public.stadium_jobs;
create trigger set_stadium_jobs_updated_at
  before update on public.stadium_jobs
  for each row execute procedure public.touch_updated_at();

drop policy if exists "stadium_jobs_select_published" on public.stadium_jobs;
drop policy if exists "stadium_jobs_admin_manage" on public.stadium_jobs;

create policy "stadium_jobs_select_published"
  on public.stadium_jobs
  for select
  using (published = true or public.is_admin());

create policy "stadium_jobs_admin_manage"
  on public.stadium_jobs
  for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_stadium_jobs_published on public.stadium_jobs(published);
create index if not exists idx_stadium_jobs_slug on public.stadium_jobs(slug);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  cover_image_url text,
  seo jsonb,
  published boolean not null default false,
  published_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.news_posts
  add column if not exists cover_image_url text;
alter table if exists public.news_posts
  add column if not exists seo jsonb;
alter table if exists public.news_posts
  add column if not exists published_at date;

alter table public.news_posts enable row level security;

drop trigger if exists set_news_posts_updated_at on public.news_posts;
create trigger set_news_posts_updated_at
  before update on public.news_posts
  for each row execute procedure public.touch_updated_at();

drop policy if exists "news_posts_select_published" on public.news_posts;
drop policy if exists "news_posts_admin_manage" on public.news_posts;

create policy "news_posts_select_published"
  on public.news_posts
  for select
  using (published = true or public.is_admin());

create policy "news_posts_admin_manage"
  on public.news_posts
  for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_news_posts_published on public.news_posts(published);
create index if not exists idx_news_posts_published_at on public.news_posts(published_at desc);
create index if not exists idx_news_posts_slug on public.news_posts(slug);

create table if not exists public.awards_programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  year_label text not null,
  hero_eyebrow text,
  title text not null,
  summary text,
  hero_image_url text,
  hero_label text,
  status_text text,
  event_date_text text,
  venue_name text,
  venue_city text,
  intro jsonb,
  highlights jsonb,
  stats jsonb,
  timeline jsonb,
  cta_links jsonb,
  media_links jsonb,
  sponsors_title text,
  sponsors_summary text,
  sponsors jsonb,
  sections jsonb,
  archive_links jsonb,
  category_intro_title text,
  category_intro_summary text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.awards_programmes add column if not exists year_label text;
alter table if exists public.awards_programmes add column if not exists hero_eyebrow text;
alter table if exists public.awards_programmes add column if not exists title text;
alter table if exists public.awards_programmes add column if not exists summary text;
alter table if exists public.awards_programmes add column if not exists hero_image_url text;
alter table if exists public.awards_programmes add column if not exists hero_label text;
alter table if exists public.awards_programmes add column if not exists status_text text;
alter table if exists public.awards_programmes add column if not exists event_date_text text;
alter table if exists public.awards_programmes add column if not exists venue_name text;
alter table if exists public.awards_programmes add column if not exists venue_city text;
alter table if exists public.awards_programmes add column if not exists intro jsonb;
alter table if exists public.awards_programmes add column if not exists highlights jsonb;
alter table if exists public.awards_programmes add column if not exists stats jsonb;
alter table if exists public.awards_programmes add column if not exists timeline jsonb;
alter table if exists public.awards_programmes add column if not exists cta_links jsonb;
alter table if exists public.awards_programmes add column if not exists media_links jsonb;
alter table if exists public.awards_programmes add column if not exists sponsors_title text;
alter table if exists public.awards_programmes add column if not exists sponsors_summary text;
alter table if exists public.awards_programmes add column if not exists sponsors jsonb;
alter table if exists public.awards_programmes add column if not exists sections jsonb;
alter table if exists public.awards_programmes add column if not exists archive_links jsonb;
alter table if exists public.awards_programmes add column if not exists category_intro_title text;
alter table if exists public.awards_programmes add column if not exists category_intro_summary text;
alter table if exists public.awards_programmes add column if not exists sort_order integer not null default 0;
alter table if exists public.awards_programmes add column if not exists published boolean not null default false;

create table if not exists public.awards_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  page_type text not null default 'standard' check (page_type in ('landing', 'standard', 'faq')),
  programme_slug text references public.awards_programmes(slug) on delete set null,
  hero_eyebrow text,
  title text not null,
  summary text,
  hero_image_url text,
  hero_label text,
  status_text text,
  intro jsonb,
  highlights jsonb,
  stats jsonb,
  timeline jsonb,
  cta_links jsonb,
  media_links jsonb,
  sponsors_title text,
  sponsors_summary text,
  sponsors jsonb,
  sections jsonb,
  faq_items jsonb,
  archive_links jsonb,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.awards_pages add column if not exists page_type text not null default 'standard';
alter table if exists public.awards_pages add column if not exists programme_slug text;
alter table if exists public.awards_pages add column if not exists hero_eyebrow text;
alter table if exists public.awards_pages add column if not exists title text;
alter table if exists public.awards_pages add column if not exists summary text;
alter table if exists public.awards_pages add column if not exists hero_image_url text;
alter table if exists public.awards_pages add column if not exists hero_label text;
alter table if exists public.awards_pages add column if not exists status_text text;
alter table if exists public.awards_pages add column if not exists intro jsonb;
alter table if exists public.awards_pages add column if not exists highlights jsonb;
alter table if exists public.awards_pages add column if not exists stats jsonb;
alter table if exists public.awards_pages add column if not exists timeline jsonb;
alter table if exists public.awards_pages add column if not exists cta_links jsonb;
alter table if exists public.awards_pages add column if not exists media_links jsonb;
alter table if exists public.awards_pages add column if not exists sponsors_title text;
alter table if exists public.awards_pages add column if not exists sponsors_summary text;
alter table if exists public.awards_pages add column if not exists sponsors jsonb;
alter table if exists public.awards_pages add column if not exists sections jsonb;
alter table if exists public.awards_pages add column if not exists faq_items jsonb;
alter table if exists public.awards_pages add column if not exists archive_links jsonb;
alter table if exists public.awards_pages add column if not exists sort_order integer not null default 0;
alter table if exists public.awards_pages add column if not exists published boolean not null default false;
alter table if exists public.awards_pages drop constraint if exists awards_pages_page_type_check;
alter table if exists public.awards_pages
  add constraint awards_pages_page_type_check
  check (page_type in ('landing', 'standard', 'faq'));
alter table if exists public.awards_pages
  drop constraint if exists awards_pages_programme_slug_fkey;
alter table if exists public.awards_pages
  add constraint awards_pages_programme_slug_fkey
  foreign key (programme_slug) references public.awards_programmes(slug) on delete set null;

create table if not exists public.awards_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  programme_slug text not null references public.awards_programmes(slug) on delete cascade,
  hero_eyebrow text,
  title text not null,
  short_title text,
  summary text,
  hero_image_url text,
  status_text text,
  eligibility_text text,
  opened_text text,
  closes_text text,
  sponsor_name text,
  sponsor_description text,
  sponsor_url text,
  sponsor_logo_url text,
  stats jsonb,
  timeline jsonb,
  criteria_intro text,
  criteria_points jsonb,
  submission_text text,
  judging_text text,
  results_text text,
  media_links jsonb,
  cta_links jsonb,
  sections jsonb,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.awards_categories add column if not exists programme_slug text;
alter table if exists public.awards_categories add column if not exists hero_eyebrow text;
alter table if exists public.awards_categories add column if not exists title text;
alter table if exists public.awards_categories add column if not exists short_title text;
alter table if exists public.awards_categories add column if not exists summary text;
alter table if exists public.awards_categories add column if not exists hero_image_url text;
alter table if exists public.awards_categories add column if not exists status_text text;
alter table if exists public.awards_categories add column if not exists eligibility_text text;
alter table if exists public.awards_categories add column if not exists opened_text text;
alter table if exists public.awards_categories add column if not exists closes_text text;
alter table if exists public.awards_categories add column if not exists sponsor_name text;
alter table if exists public.awards_categories add column if not exists sponsor_description text;
alter table if exists public.awards_categories add column if not exists sponsor_url text;
alter table if exists public.awards_categories add column if not exists sponsor_logo_url text;
alter table if exists public.awards_categories add column if not exists stats jsonb;
alter table if exists public.awards_categories add column if not exists timeline jsonb;
alter table if exists public.awards_categories add column if not exists criteria_intro text;
alter table if exists public.awards_categories add column if not exists criteria_points jsonb;
alter table if exists public.awards_categories add column if not exists submission_text text;
alter table if exists public.awards_categories add column if not exists judging_text text;
alter table if exists public.awards_categories add column if not exists results_text text;
alter table if exists public.awards_categories add column if not exists media_links jsonb;
alter table if exists public.awards_categories add column if not exists cta_links jsonb;
alter table if exists public.awards_categories add column if not exists sections jsonb;
alter table if exists public.awards_categories add column if not exists sort_order integer not null default 0;
alter table if exists public.awards_categories add column if not exists published boolean not null default false;
alter table if exists public.awards_categories
  drop constraint if exists awards_categories_programme_slug_fkey;
alter table if exists public.awards_categories
  add constraint awards_categories_programme_slug_fkey
  foreign key (programme_slug) references public.awards_programmes(slug) on delete cascade;

alter table public.awards_programmes enable row level security;
alter table public.awards_pages enable row level security;
alter table public.awards_categories enable row level security;

drop trigger if exists set_awards_programmes_updated_at on public.awards_programmes;
drop trigger if exists set_awards_pages_updated_at on public.awards_pages;
drop trigger if exists set_awards_categories_updated_at on public.awards_categories;

create trigger set_awards_programmes_updated_at
  before update on public.awards_programmes
  for each row execute procedure public.touch_updated_at();

create trigger set_awards_pages_updated_at
  before update on public.awards_pages
  for each row execute procedure public.touch_updated_at();

create trigger set_awards_categories_updated_at
  before update on public.awards_categories
  for each row execute procedure public.touch_updated_at();

drop policy if exists "awards_programmes_select_published" on public.awards_programmes;
drop policy if exists "awards_pages_select_published" on public.awards_pages;
drop policy if exists "awards_categories_select_published" on public.awards_categories;

create policy "awards_programmes_select_published"
  on public.awards_programmes
  for select
  using (published = true);

create policy "awards_pages_select_published"
  on public.awards_pages
  for select
  using (published = true);

create policy "awards_categories_select_published"
  on public.awards_categories
  for select
  using (published = true);

create index if not exists idx_awards_programmes_slug on public.awards_programmes(slug);
create index if not exists idx_awards_programmes_published on public.awards_programmes(published);
create index if not exists idx_awards_programmes_sort_order on public.awards_programmes(sort_order desc);
create index if not exists idx_awards_pages_slug on public.awards_pages(slug);
create index if not exists idx_awards_pages_programme_slug on public.awards_pages(programme_slug);
create index if not exists idx_awards_pages_published on public.awards_pages(published);
create index if not exists idx_awards_pages_sort_order on public.awards_pages(sort_order desc);
create index if not exists idx_awards_categories_slug on public.awards_categories(slug);
create index if not exists idx_awards_categories_programme_slug on public.awards_categories(programme_slug);
create index if not exists idx_awards_categories_published on public.awards_categories(published);
create index if not exists idx_awards_categories_sort_order on public.awards_categories(sort_order);
