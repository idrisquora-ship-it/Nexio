-- Phase 4: marketplace, business profiles, gigs, portfolio, favorites

create type public.gig_status as enum ('draft', 'published', 'paused', 'archived');
create type public.package_tier as enum ('basic', 'standard', 'premium');
create type public.favorite_target_type as enum ('gig', 'business');

create table if not exists public.marketplace_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.marketplace_config (key, value) values
  ('default_active_gig_limit', '3'),
  ('platform_fee_percent', '0'),
  ('categories', '["Design","Development","Marketing","Writing","Video","Music","Business","Other"]')
on conflict (key) do nothing;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  business_name text not null check (char_length(trim(business_name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  tagline text,
  description text,
  logo_url text,
  banner_url text,
  category text,
  is_vacation_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_profiles_user_id on public.business_profiles (user_id);
create index if not exists idx_business_profiles_slug on public.business_profiles (slug);

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category text not null,
  sub_category text not null,
  tags text[] not null default '{}',
  short_description text check (char_length(short_description) <= 200),
  description text,
  cover_image_url text,
  status public.gig_status not null default 'draft',
  starting_price_cents integer check (starting_price_cents is null or starting_price_cents >= 0),
  currency text not null default 'USD',
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  order_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_gigs_business_id on public.gigs (business_id);
create index if not exists idx_gigs_status on public.gigs (status, published_at desc nulls last);
create index if not exists idx_gigs_category on public.gigs (category) where status = 'published';

create table if not exists public.gig_packages (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs (id) on delete cascade,
  tier public.package_tier not null,
  price_cents integer not null check (price_cents >= 0),
  delivery_days integer not null check (delivery_days > 0),
  revisions integer not null default 0 check (revisions >= 0),
  description text not null,
  features text[] not null default '{}',
  unique (gig_id, tier)
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  title text not null,
  description text,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_portfolio_business on public.portfolio_items (business_id, sort_order);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.favorite_target_type not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create or replace function public.become_business(
  p_business_name text,
  p_slug text,
  p_category text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  biz_id uuid;
  clean_slug text := lower(trim(p_slug));
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.business_profiles where user_id = me) then
    raise exception 'Already a business account';
  end if;

  insert into public.business_profiles (user_id, business_name, slug, category)
  values (me, trim(p_business_name), clean_slug, p_category)
  returning id into biz_id;

  update public.profiles set is_business = true, updated_at = now() where id = me;
  return biz_id;
end;
$$;

create or replace function public.get_active_gig_limit(p_business_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((value #>> '{}')::integer, 3)
  from public.marketplace_config
  where key = 'default_active_gig_limit';
$$;

grant execute on function public.become_business(text, text, text) to authenticated;
grant execute on function public.get_active_gig_limit(uuid) to authenticated;

alter table public.marketplace_config enable row level security;
alter table public.business_profiles enable row level security;
alter table public.gigs enable row level security;
alter table public.gig_packages enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Anyone reads marketplace config" on public.marketplace_config;
create policy "Anyone reads marketplace config"
on public.marketplace_config for select to authenticated
using (true);

drop policy if exists "Public reads business profiles" on public.business_profiles;
create policy "Public reads business profiles"
on public.business_profiles for select to authenticated
using (true);

drop policy if exists "Owners manage business profiles" on public.business_profiles;
create policy "Owners manage business profiles"
on public.business_profiles for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Public reads published gigs" on public.gigs;
create policy "Public reads published gigs"
on public.gigs for select to authenticated
using (status = 'published' or exists (
  select 1 from public.business_profiles bp
  where bp.id = business_id and bp.user_id = auth.uid()
));

drop policy if exists "Business owners manage gigs" on public.gigs;
create policy "Business owners manage gigs"
on public.gigs for all to authenticated
using (exists (
  select 1 from public.business_profiles bp
  where bp.id = business_id and bp.user_id = auth.uid()
))
with check (exists (
  select 1 from public.business_profiles bp
  where bp.id = business_id and bp.user_id = auth.uid()
));

drop policy if exists "Read packages for visible gigs" on public.gig_packages;
create policy "Read packages for visible gigs"
on public.gig_packages for select to authenticated
using (exists (
  select 1 from public.gigs g
  join public.business_profiles bp on bp.id = g.business_id
  where g.id = gig_id and (g.status = 'published' or bp.user_id = auth.uid())
));

drop policy if exists "Owners manage gig packages" on public.gig_packages;
create policy "Owners manage gig packages"
on public.gig_packages for all to authenticated
using (exists (
  select 1 from public.gigs g
  join public.business_profiles bp on bp.id = g.business_id
  where g.id = gig_id and bp.user_id = auth.uid()
))
with check (exists (
  select 1 from public.gigs g
  join public.business_profiles bp on bp.id = g.business_id
  where g.id = gig_id and bp.user_id = auth.uid()
));

drop policy if exists "Public reads portfolio" on public.portfolio_items;
create policy "Public reads portfolio"
on public.portfolio_items for select to authenticated
using (true);

drop policy if exists "Owners manage portfolio" on public.portfolio_items;
create policy "Owners manage portfolio"
on public.portfolio_items for all to authenticated
using (exists (
  select 1 from public.business_profiles bp
  where bp.id = business_id and bp.user_id = auth.uid()
))
with check (exists (
  select 1 from public.business_profiles bp
  where bp.id = business_id and bp.user_id = auth.uid()
));

drop policy if exists "Users manage favorites" on public.favorites;
create policy "Users manage favorites"
on public.favorites for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values
  ('business_logos', 'business_logos', true),
  ('business_banners', 'business_banners', true),
  ('gig_images', 'gig_images', true),
  ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "Public read business_logos" on storage.objects;
create policy "Public read business_logos"
on storage.objects for select to authenticated
using (bucket_id = 'business_logos');

drop policy if exists "Owners upload business_logos" on storage.objects;
create policy "Owners upload business_logos"
on storage.objects for insert to authenticated
with check (bucket_id = 'business_logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Public read gig_images" on storage.objects;
create policy "Public read gig_images"
on storage.objects for select to authenticated
using (bucket_id = 'gig_images');

drop policy if exists "Owners upload gig_images" on storage.objects;
create policy "Owners upload gig_images"
on storage.objects for insert to authenticated
with check (bucket_id = 'gig_images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Public read portfolio" on storage.objects;
create policy "Public read portfolio"
on storage.objects for select to authenticated
using (bucket_id = 'portfolio');

drop policy if exists "Owners upload portfolio" on storage.objects;
create policy "Owners upload portfolio"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
