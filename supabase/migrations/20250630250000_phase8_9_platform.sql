-- Phase 8 + Phase 9 (payments shell): moderation, announcements, flags, payment placeholders

create type public.report_target_type as enum (
  'message',
  'profile',
  'business',
  'gig',
  'community',
  'story',
  'channel_post'
);

create type public.report_reason as enum (
  'spam',
  'scam',
  'harassment',
  'copyright',
  'explicit_content',
  'other'
);

create type public.report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');

create type public.moderation_action_type as enum (
  'warn',
  'suspend',
  'ban',
  'remove_content',
  'dismiss'
);

create type public.announcement_audience as enum ('everyone', 'businesses', 'personal', 'specific_group');

create type public.announcement_priority as enum ('normal', 'important');

create type public.payment_status as enum (
  'not_required',
  'pending',
  'held',
  'released',
  'refunded',
  'failed'
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists idx_reports_status_created on public.reports (status, created_at desc);
create index if not exists idx_reports_target on public.reports (target_type, target_id);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete set null,
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action public.moderation_action_type not null,
  target_type public.report_target_type,
  target_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_actions_report on public.moderation_actions (report_id, created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience public.announcement_audience not null default 'everyone',
  audience_group_id uuid references public.conversations (id) on delete set null,
  priority public.announcement_priority not null default 'normal',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_active
  on public.announcements (starts_at desc, expires_at);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.feature_flags (key, enabled, description) values
  ('ff_marketplace_enabled', true, 'Marketplace tab and gigs'),
  ('ff_stories_enabled', true, 'Stories on Updates and Chats'),
  ('ff_group_calls_enabled', true, 'Group voice/video calls'),
  ('ff_payments_enabled', false, 'Stripe payments and escrow'),
  ('ff_ai_assistant', false, 'AI assistant'),
  ('ff_desktop_companion', false, 'Desktop companion app'),
  ('ff_premium_tier', false, 'Premium subscription tier')
on conflict (key) do nothing;

create table if not exists public.monetization_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.monetization_config (key, value) values
  ('platform_fee_percent', '10'::jsonb),
  ('payout_delay_days', '7'::jsonb),
  ('escrow_hold_days', '3'::jsonb),
  ('stripe_mode', '"placeholder"'::jsonb)
on conflict (key) do nothing;

create table if not exists public.seller_payout_accounts (
  business_id uuid primary key references public.business_profiles (id) on delete cascade,
  stripe_connect_account_id text,
  payouts_enabled boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists payment_status public.payment_status not null default 'not_required',
  add column if not exists stripe_payment_intent_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists platform_fee_cents integer not null default 0;

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'placeholder',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_intents_order on public.payment_intents (order_id);

-- Reports
create or replace function public.submit_report(
  p_target_type public.report_target_type,
  p_target_id uuid,
  p_reason public.report_reason,
  p_details text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  me uuid := auth.uid();
  report_id uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not public.check_rate_limit('submit_report', 10, 3600) then
    raise exception 'Rate limit exceeded';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason, details)
  values (me, p_target_type, p_target_id, p_reason, nullif(trim(coalesce(p_details, '')), ''))
  returning id into report_id;

  return report_id;
end;
$$;

create or replace function public.list_pending_reports()
returns setof public.reports
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  return query
  select * from public.reports
  where status in ('pending', 'reviewing')
  order by created_at asc
  limit 100;
end;
$$;

create or replace function public.process_report(
  p_report_id uuid,
  p_action public.moderation_action_type,
  p_note text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  rep public.reports%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = me and is_admin = true) then
    raise exception 'Admin only';
  end if;

  select * into rep from public.reports where id = p_report_id for update;
  if not found then raise exception 'Report not found'; end if;

  insert into public.moderation_actions (report_id, admin_id, action, target_type, target_id, note)
  values (rep.id, me, p_action, rep.target_type, rep.target_id, p_note);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (me, p_action::text, 'report', rep.id, jsonb_build_object('target_type', rep.target_type, 'target_id', rep.target_id));

  update public.reports set
    status = case when p_action = 'dismiss' then 'dismissed'::public.report_status else 'resolved'::public.report_status end,
    reviewed_at = now(),
    reviewed_by = me
  where id = p_report_id
  returning * into rep;

  return rep;
end;
$$;

create or replace function public.fetch_active_announcements(p_user_id uuid default auth.uid())
returns setof public.announcements
language sql
stable
security invoker
set search_path = public
as $$
  select a.*
  from public.announcements a
  where a.starts_at <= now()
    and (a.expires_at is null or a.expires_at > now())
    and (
      a.audience = 'everyone'
      or (a.audience = 'businesses' and exists (
        select 1 from public.profiles p where p.id = p_user_id and p.is_business = true
      ))
      or (a.audience = 'personal' and exists (
        select 1 from public.profiles p where p.id = p_user_id and p.is_business = false
      ))
      or (a.audience = 'specific_group' and exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = a.audience_group_id and cp.user_id = p_user_id
      ))
    )
  order by
    case when a.priority = 'important' then 0 else 1 end,
    a.starts_at desc
  limit 20;
$$;

create or replace function public.publish_announcement(
  p_title text,
  p_body text,
  p_audience public.announcement_audience default 'everyone',
  p_priority public.announcement_priority default 'normal',
  p_audience_group_id uuid default null,
  p_expires_at timestamptz default null
)
returns public.announcements
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  row public.announcements%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = me and is_admin = true) then
    raise exception 'Admin only';
  end if;

  insert into public.announcements (title, body, audience, audience_group_id, priority, expires_at, created_by)
  values (trim(p_title), trim(p_body), p_audience, p_audience_group_id, p_priority, p_expires_at, me)
  returning * into row;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (me, 'publish_announcement', 'announcement', row.id, jsonb_build_object('audience', p_audience));

  return row;
end;
$$;

create or replace function public.get_feature_flags()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_object_agg(key, enabled), '{}'::jsonb)
  from public.feature_flags;
$$;

create or replace function public.get_seller_analytics_series(
  p_business_id uuid,
  p_period text default 'weekly'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  biz public.business_profiles%rowtype;
  trunc_unit text;
  start_at timestamptz;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into biz from public.business_profiles where id = p_business_id;
  if not found then raise exception 'Business not found'; end if;
  if biz.user_id <> me and not exists (select 1 from public.profiles where id = me and is_admin = true) then
    raise exception 'Not allowed';
  end if;

  trunc_unit := case p_period
    when 'daily' then 'day'
    when 'monthly' then 'month'
    when 'yearly' then 'year'
    else 'week'
  end;

  start_at := case p_period
    when 'daily' then now() - interval '14 days'
    when 'monthly' then now() - interval '12 months'
    when 'yearly' then now() - interval '5 years'
    else now() - interval '8 weeks'
  end;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'label', to_char(bucket, 'YYYY-MM-DD'),
      'orders', orders,
      'revenue_cents', revenue_cents
    ) order by bucket)
    from (
      select
        date_trunc(trunc_unit, o.completed_at) as bucket,
        count(*)::integer as orders,
        coalesce(sum(o.price_cents), 0)::integer as revenue_cents
      from public.orders o
      where o.business_id = p_business_id
        and o.status = 'completed'
        and o.completed_at is not null
        and o.completed_at >= start_at
      group by 1
    ) s
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_payment_shell_config()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'payments_enabled', coalesce((select enabled from public.feature_flags where key = 'ff_payments_enabled'), false),
    'platform_fee_percent', coalesce((select value from public.monetization_config where key = 'platform_fee_percent'), '10'::jsonb),
    'payout_delay_days', coalesce((select value from public.monetization_config where key = 'payout_delay_days'), '7'::jsonb),
    'stripe_mode', coalesce((select value from public.monetization_config where key = 'stripe_mode'), '"placeholder"'::jsonb)
  );
$$;

alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.monetization_config enable row level security;
alter table public.seller_payout_accounts enable row level security;
alter table public.payment_intents enable row level security;

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports for select to authenticated
using (reporter_id = auth.uid());

drop policy if exists reports_admin_select on public.reports;
create policy reports_admin_select on public.reports for select to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements for select to authenticated
using (true);

drop policy if exists feature_flags_read on public.feature_flags;
create policy feature_flags_read on public.feature_flags for select to authenticated
using (true);

drop policy if exists monetization_config_read on public.monetization_config;
create policy monetization_config_read on public.monetization_config for select to authenticated
using (true);

drop policy if exists seller_payout_accounts_own on public.seller_payout_accounts;
create policy seller_payout_accounts_own on public.seller_payout_accounts for all to authenticated
using (
  exists (select 1 from public.business_profiles bp where bp.id = business_id and bp.user_id = auth.uid())
)
with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_id and bp.user_id = auth.uid())
);

drop policy if exists payment_intents_participants on public.payment_intents;
create policy payment_intents_participants on public.payment_intents for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
  )
);

grant execute on function public.submit_report(public.report_target_type, uuid, public.report_reason, text) to authenticated;
grant execute on function public.list_pending_reports() to authenticated;
grant execute on function public.process_report(uuid, public.moderation_action_type, text) to authenticated;
grant execute on function public.fetch_active_announcements(uuid) to authenticated;
grant execute on function public.publish_announcement(text, text, public.announcement_audience, public.announcement_priority, uuid, timestamptz) to authenticated;
grant execute on function public.get_feature_flags() to authenticated;
grant execute on function public.get_seller_analytics_series(uuid, text) to authenticated;
grant execute on function public.get_payment_shell_config() to authenticated;
