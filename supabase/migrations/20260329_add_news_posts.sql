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
