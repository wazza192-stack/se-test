begin;

drop policy if exists "awards_programmes_admin_manage" on public.awards_programmes;
drop policy if exists "awards_pages_admin_manage" on public.awards_pages;
drop policy if exists "awards_categories_admin_manage" on public.awards_categories;

drop policy if exists "awards_programmes_select_published" on public.awards_programmes;
create policy "awards_programmes_select_published"
  on public.awards_programmes
  for select
  using (published = true);

drop policy if exists "awards_pages_select_published" on public.awards_pages;
create policy "awards_pages_select_published"
  on public.awards_pages
  for select
  using (published = true);

drop policy if exists "awards_categories_select_published" on public.awards_categories;
create policy "awards_categories_select_published"
  on public.awards_categories
  for select
  using (published = true);

commit;
