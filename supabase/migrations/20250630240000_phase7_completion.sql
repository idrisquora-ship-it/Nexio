-- Phase 7 completion: remaining push triggers, rate limits, security hardening

-- Rate limiting for authenticated RPCs
create table if not exists public.api_rate_limits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 1,
  primary key (user_id, action, bucket_start)
);

create index if not exists idx_api_rate_limits_bucket
  on public.api_rate_limits (bucket_start);

alter table public.api_rate_limits enable row level security;

drop policy if exists api_rate_limits_own on public.api_rate_limits;
create policy api_rate_limits_own
on public.api_rate_limits for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.check_rate_limit(
  p_action text,
  p_max_requests integer default 60,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  me uuid := auth.uid();
  bucket timestamptz;
  current_count integer;
begin
  if me is null then
    return false;
  end if;

  bucket := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (user_id, action, bucket_start, request_count)
  values (me, p_action, bucket, 1)
  on conflict (user_id, action, bucket_start)
  do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into current_count;

  return current_count <= p_max_requests;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.check_rate_limit('mark_notification_read', 120, 60) then
    raise exception 'Rate limit exceeded';
  end if;

  update public.notification_log
  set read_at = now()
  where id = p_notification_id
    and user_id = auth.uid()
    and read_at is null;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated_count integer;
begin
  if not public.check_rate_limit('mark_all_notifications_read', 20, 60) then
    raise exception 'Rate limit exceeded';
  end if;

  update public.notification_log
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- notification_log: in-app entries are service-role only (edge functions)
revoke insert on public.notification_log from authenticated, anon;

-- Unified notification dispatch via pg_net
create or replace function public.trigger_notification_dispatch()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  payload jsonb;
  event_type text := TG_ARGV[0];
begin
  payload := jsonb_build_object(
    'type', event_type,
    'record', to_jsonb(NEW)
  );

  perform net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/on-notification-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;

create or replace function public.trigger_notification_dispatch_update()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  payload jsonb;
  event_type text := TG_ARGV[0];
begin
  if TG_OP = 'UPDATE' and event_type = 'verification' then
    if OLD.status = NEW.status or NEW.status = 'pending' then
      return NEW;
    end if;
  end if;

  if TG_OP = 'UPDATE' and event_type = 'marketplace' then
    if OLD.status = NEW.status or NEW.status <> 'published' then
      return NEW;
    end if;
  end if;

  payload := jsonb_build_object(
    'type', event_type,
    'record', to_jsonb(NEW)
  );

  perform net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/on-notification-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;

create or replace function public.trigger_mention_dispatch()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if NEW.body is null or NEW.body !~ '@[a-zA-Z0-9_]{3,30}' then
    return NEW;
  end if;

  perform net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/on-notification-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'mention',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;

revoke execute on function public.trigger_notification_dispatch() from public, anon, authenticated;
revoke execute on function public.trigger_notification_dispatch_update() from public, anon, authenticated;
revoke execute on function public.trigger_mention_dispatch() from public, anon, authenticated;

drop trigger if exists on_order_event_push on public.order_events;
create trigger on_order_event_push
after insert on public.order_events
for each row execute function public.trigger_notification_dispatch('order');

drop trigger if exists on_review_created_push on public.reviews;
create trigger on_review_created_push
after insert on public.reviews
for each row execute function public.trigger_notification_dispatch('review');

drop trigger if exists on_verification_updated_push on public.verification_submissions;
create trigger on_verification_updated_push
after update on public.verification_submissions
for each row execute function public.trigger_notification_dispatch_update('verification');

drop trigger if exists on_story_created_push on public.stories;
create trigger on_story_created_push
after insert on public.stories
for each row execute function public.trigger_notification_dispatch('story');

drop trigger if exists on_follower_created_push on public.business_follows;
create trigger on_follower_created_push
after insert on public.business_follows
for each row execute function public.trigger_notification_dispatch('follower');

drop trigger if exists on_community_post_push on public.channel_posts;
create trigger on_community_post_push
after insert on public.channel_posts
for each row execute function public.trigger_notification_dispatch('community');

drop trigger if exists on_gig_published_push on public.gigs;
create trigger on_gig_published_push
after update on public.gigs
for each row execute function public.trigger_notification_dispatch_update('marketplace');

drop trigger if exists on_message_mention_push on public.messages;
create trigger on_message_mention_push
after insert on public.messages
for each row execute function public.trigger_mention_dispatch();

-- RLS audit helper (admin / staging checks)
create or replace function public.audit_rls_coverage()
returns table(table_name text, rls_enabled boolean)
language sql
stable
security definer
set search_path = public
as $$
  select c.relname::text, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
  order by c.relname;
$$;

revoke execute on function public.audit_rls_coverage() from public, anon, authenticated;
