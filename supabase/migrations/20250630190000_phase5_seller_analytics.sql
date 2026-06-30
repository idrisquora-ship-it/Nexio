-- Phase 5 completion: seller levels, metrics, analytics, vacation, admin verification

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.business_profiles
  add column if not exists seller_level integer not null default 0;

create table if not exists public.seller_level_definitions (
  level integer primary key,
  display_name text not null,
  max_active_gigs integer not null check (max_active_gigs > 0),
  sort_order integer not null default 0
);

create table if not exists public.seller_level_requirements (
  level integer primary key references public.seller_level_definitions (level) on delete cascade,
  min_completed_orders integer not null default 0,
  min_average_rating numeric(3, 2) not null default 0,
  min_completion_rate numeric(5, 2) not null default 0,
  min_account_age_days integer not null default 0
);

create table if not exists public.seller_metrics (
  business_id uuid primary key references public.business_profiles (id) on delete cascade,
  completed_orders integer not null default 0,
  accepted_orders integer not null default 0,
  average_rating numeric(3, 2) not null default 0,
  repeat_buyers integer not null default 0,
  favorites_count integer not null default 0,
  profile_views integer not null default 0,
  gig_views integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.seller_level_definitions (level, display_name, max_active_gigs, sort_order) values
  (0, 'New Seller', 7, 0),
  (1, 'Level 1', 10, 1),
  (2, 'Level 2', 20, 2),
  (3, 'Top Seller', 35, 3),
  (4, 'Verified Seller', 50, 4)
on conflict (level) do nothing;

insert into public.seller_level_requirements (level, min_completed_orders, min_average_rating, min_completion_rate, min_account_age_days) values
  (0, 0, 0, 0, 0),
  (1, 5, 4.0, 0.80, 14),
  (2, 25, 4.3, 0.85, 60),
  (3, 100, 4.5, 0.90, 180),
  (4, 50, 4.6, 0.92, 90)
on conflict (level) do nothing;

create or replace function public.refresh_seller_metrics(p_business_id uuid)
returns public.seller_metrics
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.seller_metrics%rowtype;
  biz public.business_profiles%rowtype;
begin
  select * into biz from public.business_profiles where id = p_business_id;
  if not found then raise exception 'Business not found'; end if;

  insert into public.seller_metrics (business_id)
  values (p_business_id)
  on conflict (business_id) do nothing;

  update public.seller_metrics sm set
    completed_orders = (
      select count(*)::integer from public.orders o
      where o.business_id = p_business_id and o.status = 'completed'
    ),
    accepted_orders = (
      select count(*)::integer from public.orders o
      where o.business_id = p_business_id
        and o.status in ('in_progress', 'revision_requested', 'delivered', 'completed')
    ),
    average_rating = coalesce((
      select avg(rv.overall_rating)::numeric(3,2)
      from public.reviews rv
      join public.orders o on o.id = rv.order_id
      where o.business_id = p_business_id and rv.direction = 'buyer_to_seller'
    ), 0),
    repeat_buyers = (
      select count(*)::integer from (
        select buyer_id from public.orders
        where business_id = p_business_id and status = 'completed'
        group by buyer_id having count(*) >= 2
      ) rb
    ),
    favorites_count = (
      select count(*)::integer from public.favorites f
      where f.target_type = 'business' and f.target_id = p_business_id
    ),
    updated_at = now()
  where sm.business_id = p_business_id
  returning * into m;

  return m;
end;
$$;

create or replace function public.evaluate_seller_levels()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  biz record;
  m public.seller_metrics%rowtype;
  req public.seller_level_requirements%rowtype;
  new_level integer;
  upgraded integer := 0;
  completion_rate numeric;
  account_age_days integer;
begin
  for biz in select id, seller_level, created_at, is_verified from public.business_profiles loop
    select * into m from public.refresh_seller_metrics(biz.id);

    completion_rate := case
      when m.accepted_orders > 0 then m.completed_orders::numeric / m.accepted_orders
      else 0
    end;
    account_age_days := extract(day from now() - biz.created_at)::integer;

    new_level := biz.seller_level;

    for req in
      select * from public.seller_level_requirements
      where level > biz.seller_level
      order by level desc
    loop
      if m.completed_orders >= req.min_completed_orders
        and m.average_rating >= req.min_average_rating
        and completion_rate >= req.min_completion_rate
        and account_age_days >= req.min_account_age_days
        and (req.level < 4 or biz.is_verified)
      then
        new_level := req.level;
        exit;
      end if;
    end loop;

    if new_level > biz.seller_level then
      update public.business_profiles set seller_level = new_level, updated_at = now()
      where id = biz.id;
      upgraded := upgraded + 1;
    end if;
  end loop;

  return upgraded;
end;
$$;

create or replace function public.get_active_gig_limit(p_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sld.max_active_gigs, (
    select coalesce((value #>> '{}')::integer, 3)
    from public.marketplace_config where key = 'default_active_gig_limit'
  ))
  from public.business_profiles bp
  left join public.seller_level_definitions sld on sld.level = bp.seller_level
  where bp.id = p_business_id;
$$;

create or replace function public.toggle_vacation_mode(p_enabled boolean)
returns public.business_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  biz public.business_profiles%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  update public.business_profiles
  set is_vacation_mode = p_enabled, updated_at = now()
  where user_id = me
  returning * into biz;
  if not found then raise exception 'Business profile required'; end if;
  return biz;
end;
$$;

create or replace function public.get_seller_analytics(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  biz public.business_profiles%rowtype;
  m public.seller_metrics%rowtype;
  active_gigs integer;
  gig_limit integer;
  level_name text;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into biz from public.business_profiles where id = p_business_id;
  if not found then raise exception 'Business not found'; end if;
  if biz.user_id <> me and not exists (
    select 1 from public.profiles where id = me and is_admin = true
  ) then raise exception 'Not allowed'; end if;

  select * into m from public.refresh_seller_metrics(p_business_id);
  select count(*)::integer into active_gigs from public.gigs
  where business_id = p_business_id and status = 'published';
  gig_limit := public.get_active_gig_limit(p_business_id);
  select display_name into level_name from public.seller_level_definitions
  where level = biz.seller_level;

  return jsonb_build_object(
    'completed_orders', m.completed_orders,
    'active_gigs', active_gigs,
    'gig_limit', gig_limit,
    'average_rating', m.average_rating,
    'repeat_buyers', m.repeat_buyers,
    'favorites_count', m.favorites_count,
    'profile_views', m.profile_views,
    'gig_views', m.gig_views,
    'seller_level', biz.seller_level,
    'seller_level_name', level_name,
    'is_verified', biz.is_verified,
    'is_vacation_mode', biz.is_vacation_mode
  );
end;
$$;

create or replace function public.process_verification_submission(
  p_submission_id uuid,
  p_approve boolean,
  p_admin_note text default null
)
returns public.verification_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  sub public.verification_submissions%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = me and is_admin = true) then
    raise exception 'Admin only';
  end if;

  select * into sub from public.verification_submissions where id = p_submission_id;
  if not found then raise exception 'Submission not found'; end if;
  if sub.status <> 'pending' then raise exception 'Already processed'; end if;

  update public.verification_submissions set
    status = case when p_approve then 'approved'::public.verification_status else 'rejected'::public.verification_status end,
    admin_note = p_admin_note,
    reviewed_at = now()
  where id = p_submission_id
  returning * into sub;

  if p_approve then
    update public.business_profiles set is_verified = true, updated_at = now()
    where id = sub.business_id;
    perform public.evaluate_seller_levels();
  end if;

  return sub;
end;
$$;

create or replace function public.list_pending_verifications()
returns setof public.verification_submissions
language sql
stable
security definer
set search_path = public
as $$
  select vs.*
  from public.verification_submissions vs
  where vs.status = 'pending'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  order by vs.created_at asc;
$$;

grant execute on function public.refresh_seller_metrics(uuid) to authenticated;
grant execute on function public.evaluate_seller_levels() to authenticated;
grant execute on function public.toggle_vacation_mode(boolean) to authenticated;
grant execute on function public.get_seller_analytics(uuid) to authenticated;
grant execute on function public.process_verification_submission(uuid, boolean, text) to authenticated;
grant execute on function public.list_pending_verifications() to authenticated;

alter table public.seller_level_definitions enable row level security;
alter table public.seller_level_requirements enable row level security;
alter table public.seller_metrics enable row level security;

drop policy if exists "Anyone reads level definitions" on public.seller_level_definitions;
create policy "Anyone reads level definitions"
on public.seller_level_definitions for select to authenticated using (true);

drop policy if exists "Anyone reads level requirements" on public.seller_level_requirements;
create policy "Anyone reads level requirements"
on public.seller_level_requirements for select to authenticated using (true);

drop policy if exists "Owners read seller metrics" on public.seller_metrics;
create policy "Owners read seller metrics"
on public.seller_metrics for select to authenticated
using (exists (
  select 1 from public.business_profiles bp
  where bp.id = business_id and bp.user_id = auth.uid()
));
