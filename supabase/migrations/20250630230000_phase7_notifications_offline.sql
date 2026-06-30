-- Phase 7: notification center, preferences, in-app log

create type public.notification_category as enum (
  'message',
  'call',
  'story',
  'business_update',
  'marketplace',
  'order',
  'review',
  'verification',
  'mention',
  'follower',
  'community',
  'system'
);

create table if not exists public.notification_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.notification_category not null,
  push_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

create index if not exists idx_notification_preferences_user_id
  on public.notification_preferences (user_id);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.notification_category not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_log_user_created
  on public.notification_log (user_id, created_at desc);

create index if not exists idx_notification_log_user_unread
  on public.notification_log (user_id)
  where read_at is null;

-- Default preferences for new profiles
create or replace function public.seed_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id, category)
  select new.id, c.category
  from (
    values
      ('message'::public.notification_category),
      ('call'),
      ('story'),
      ('business_update'),
      ('marketplace'),
      ('order'),
      ('review'),
      ('verification'),
      ('mention'),
      ('follower'),
      ('community'),
      ('system')
  ) as c(category)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_profiles_seed_notification_prefs on public.profiles;
create trigger trg_profiles_seed_notification_prefs
after insert on public.profiles
for each row execute function public.seed_notification_preferences();

-- Backfill existing users
insert into public.notification_preferences (user_id, category)
select p.id, c.category
from public.profiles p
cross join (
  values
    ('message'::public.notification_category),
    ('call'),
    ('story'),
    ('business_update'),
    ('marketplace'),
    ('order'),
    ('review'),
    ('verification'),
    ('mention'),
    ('follower'),
    ('community'),
    ('system')
) as c(category)
on conflict do nothing;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
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
  update public.notification_log
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.get_unread_notification_count()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer
  from public.notification_log
  where user_id = auth.uid()
    and read_at is null;
$$;

alter table public.notification_preferences enable row level security;
alter table public.notification_log enable row level security;

drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own
on public.notification_preferences for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own
on public.notification_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notification_log_select_own on public.notification_log;
create policy notification_log_select_own
on public.notification_log for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notification_log_update_own on public.notification_log;
create policy notification_log_update_own
on public.notification_log for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.get_unread_notification_count() to authenticated;
