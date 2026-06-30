-- Phase 6: communities, channels, stories, business posts & follows

create type public.story_type as enum ('photo', 'video', 'text');
create type public.community_role as enum ('owner', 'admin', 'moderator', 'member');

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  story_type public.story_type not null,
  media_url text,
  text_content text,
  background_color text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create index if not exists idx_stories_user_expires
  on public.stories (user_id, expires_at desc);

create table if not exists public.story_views (
  story_id uuid not null references public.stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table if not exists public.business_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, business_id)
);

create index if not exists idx_business_follows_business
  on public.business_follows (business_id);

create table if not exists public.business_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) >= 1),
  media_url text,
  media_type text check (media_type is null or media_type in ('image', 'video')),
  created_at timestamptz not null default now()
);

create index if not exists idx_business_posts_business
  on public.business_posts (business_id, created_at desc);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  description text,
  avatar_url text,
  banner_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.community_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists idx_community_members_user
  on public.community_members (user_id);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities (id) on delete cascade,
  business_id uuid references public.business_profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  description text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.channel_followers (
  channel_id uuid not null references public.channels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table if not exists public.channel_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) >= 1),
  media_url text,
  media_type text check (media_type is null or media_type in ('image', 'video')),
  created_at timestamptz not null default now()
);

create index if not exists idx_channel_posts_channel
  on public.channel_posts (channel_id, created_at desc);

-- RPCs

create or replace function public.create_story(
  p_story_type public.story_type,
  p_media_url text default null,
  p_text_content text default null,
  p_background_color text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  sid uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if p_story_type = 'text' and coalesce(trim(p_text_content), '') = '' then
    raise exception 'Text story requires content';
  end if;
  if p_story_type in ('photo', 'video') and coalesce(trim(p_media_url), '') = '' then
    raise exception 'Media story requires media_url';
  end if;

  insert into public.stories (user_id, story_type, media_url, text_content, background_color)
  values (me, p_story_type, p_media_url, p_text_content, p_background_color)
  returning id into sid;

  return sid;
end;
$$;

create or replace function public.view_story(p_story_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.stories
    where id = p_story_id and expires_at > now()
  ) then
    raise exception 'Story not found or expired';
  end if;

  insert into public.story_views (story_id, viewer_id)
  values (p_story_id, me)
  on conflict do nothing;
end;
$$;

create or replace function public.toggle_business_follow(p_business_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  following boolean;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  if exists (
    select 1 from public.business_follows
    where follower_id = me and business_id = p_business_id
  ) then
    delete from public.business_follows
    where follower_id = me and business_id = p_business_id;
    following := false;
  else
    insert into public.business_follows (follower_id, business_id)
    values (me, p_business_id);
    following := true;
  end if;

  return following;
end;
$$;

create or replace function public.publish_business_post(
  p_business_id uuid,
  p_body text,
  p_media_url text default null,
  p_media_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  post_id uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.business_profiles
    where id = p_business_id and user_id = me
  ) then
    raise exception 'Not business owner';
  end if;

  insert into public.business_posts (business_id, author_id, body, media_url, media_type)
  values (p_business_id, me, trim(p_body), p_media_url, p_media_type)
  returning id into post_id;

  return post_id;
end;
$$;

create or replace function public.create_community(
  p_name text,
  p_slug text,
  p_description text default null,
  p_is_public boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  cid uuid;
  clean_slug text := lower(trim(p_slug));
begin
  if me is null then raise exception 'Not authenticated'; end if;

  insert into public.communities (owner_id, name, slug, description, is_public)
  values (me, trim(p_name), clean_slug, p_description, coalesce(p_is_public, true))
  returning id into cid;

  insert into public.community_members (community_id, user_id, role)
  values (cid, me, 'owner');

  return cid;
end;
$$;

create or replace function public.join_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  is_pub boolean;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  select is_public into is_pub from public.communities where id = p_community_id;
  if is_pub is null then raise exception 'Community not found'; end if;
  if not is_pub then raise exception 'Community is private'; end if;

  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, me, 'member')
  on conflict do nothing;
end;
$$;

create or replace function public.create_channel(
  p_name text,
  p_community_id uuid default null,
  p_business_id uuid default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  ch_id uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  if p_community_id is not null then
    if not exists (
      select 1 from public.community_members
      where community_id = p_community_id
        and user_id = me
        and role in ('owner', 'admin')
    ) then
      raise exception 'Not a community admin';
    end if;
  elsif p_business_id is not null then
    if not exists (
      select 1 from public.business_profiles
      where id = p_business_id and user_id = me
    ) then
      raise exception 'Not business owner';
    end if;
  else
    raise exception 'community_id or business_id required';
  end if;

  insert into public.channels (community_id, business_id, owner_id, name, description)
  values (p_community_id, p_business_id, me, trim(p_name), p_description)
  returning id into ch_id;

  insert into public.channel_followers (channel_id, user_id)
  values (ch_id, me)
  on conflict do nothing;

  return ch_id;
end;
$$;

create or replace function public.toggle_channel_follow(p_channel_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  following boolean;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  if exists (
    select 1 from public.channel_followers
    where channel_id = p_channel_id and user_id = me
  ) then
    delete from public.channel_followers
    where channel_id = p_channel_id and user_id = me;
    following := false;
  else
    insert into public.channel_followers (channel_id, user_id)
    values (p_channel_id, me);
    following := true;
  end if;

  return following;
end;
$$;

create or replace function public.create_channel_post(
  p_channel_id uuid,
  p_body text,
  p_media_url text default null,
  p_media_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  post_id uuid;
  ch record;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  select * into ch from public.channels where id = p_channel_id;
  if ch is null then raise exception 'Channel not found'; end if;

  if ch.owner_id <> me and not exists (
    select 1 from public.community_members cm
    where cm.community_id = ch.community_id
      and cm.user_id = me
      and cm.role in ('owner', 'admin')
  ) and not exists (
    select 1 from public.business_profiles bp
    where bp.id = ch.business_id and bp.user_id = me
  ) then
    raise exception 'Not allowed to post';
  end if;

  insert into public.channel_posts (channel_id, author_id, body, media_url, media_type)
  values (p_channel_id, me, trim(p_body), p_media_url, p_media_type)
  returning id into post_id;

  return post_id;
end;
$$;

create or replace function public.expire_stories()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  with deleted as (
    delete from public.stories where expires_at <= now() returning id
  )
  select count(*)::integer into deleted_count from deleted;
  return deleted_count;
end;
$$;

grant execute on function public.create_story(public.story_type, text, text, text) to authenticated;
grant execute on function public.view_story(uuid) to authenticated;
grant execute on function public.toggle_business_follow(uuid) to authenticated;
grant execute on function public.publish_business_post(uuid, text, text, text) to authenticated;
grant execute on function public.create_community(text, text, text, boolean) to authenticated;
grant execute on function public.join_community(uuid) to authenticated;
grant execute on function public.create_channel(text, uuid, uuid, text) to authenticated;
grant execute on function public.toggle_channel_follow(uuid) to authenticated;
grant execute on function public.create_channel_post(uuid, text, text, text) to authenticated;
grant execute on function public.expire_stories() to service_role;

-- RLS

alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.business_follows enable row level security;
alter table public.business_posts enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.channels enable row level security;
alter table public.channel_followers enable row level security;
alter table public.channel_posts enable row level security;

drop policy if exists "Read active stories" on public.stories;
create policy "Read active stories"
on public.stories for select to authenticated
using (expires_at > now());

drop policy if exists "Users manage own stories" on public.stories;
create policy "Users manage own stories"
on public.stories for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users record story views" on public.story_views;
create policy "Users record story views"
on public.story_views for insert to authenticated
with check (viewer_id = auth.uid());

drop policy if exists "Read story views" on public.story_views;
create policy "Read story views"
on public.story_views for select to authenticated
using (
  viewer_id = auth.uid()
  or exists (
    select 1 from public.stories s
    where s.id = story_id and s.user_id = auth.uid()
  )
);

drop policy if exists "Users manage business follows" on public.business_follows;
create policy "Users manage business follows"
on public.business_follows for all to authenticated
using (follower_id = auth.uid())
with check (follower_id = auth.uid());

drop policy if exists "Read business follows" on public.business_follows;
create policy "Read business follows"
on public.business_follows for select to authenticated
using (true);

drop policy if exists "Read business posts" on public.business_posts;
create policy "Read business posts"
on public.business_posts for select to authenticated
using (true);

drop policy if exists "Business owners publish posts" on public.business_posts;
create policy "Business owners publish posts"
on public.business_posts for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.business_profiles bp
    where bp.id = business_id and bp.user_id = auth.uid()
  )
);

drop policy if exists "Read public communities" on public.communities;
create policy "Read public communities"
on public.communities for select to authenticated
using (
  is_public
  or owner_id = auth.uid()
  or exists (
    select 1 from public.community_members cm
    where cm.community_id = id and cm.user_id = auth.uid()
  )
);

drop policy if exists "Owners create communities" on public.communities;
create policy "Owners create communities"
on public.communities for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners update communities" on public.communities;
create policy "Owners update communities"
on public.communities for update to authenticated
using (owner_id = auth.uid());

drop policy if exists "Read community members" on public.community_members;
create policy "Read community members"
on public.community_members for select to authenticated
using (
  exists (
    select 1 from public.communities c
    where c.id = community_id
      and (
        c.is_public
        or exists (
          select 1 from public.community_members cm2
          where cm2.community_id = community_id and cm2.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "Users join communities" on public.community_members;
create policy "Users join communities"
on public.community_members for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Read channels" on public.channels;
create policy "Read channels"
on public.channels for select to authenticated
using (true);

drop policy if exists "Owners create channels" on public.channels;
create policy "Owners create channels"
on public.channels for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users manage channel follows" on public.channel_followers;
create policy "Users manage channel follows"
on public.channel_followers for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Read channel follows" on public.channel_followers;
create policy "Read channel follows"
on public.channel_followers for select to authenticated
using (true);

drop policy if exists "Read channel posts" on public.channel_posts;
create policy "Read channel posts"
on public.channel_posts for select to authenticated
using (true);

drop policy if exists "Admins create channel posts" on public.channel_posts;
create policy "Admins create channel posts"
on public.channel_posts for insert to authenticated
with check (author_id = auth.uid());

-- Storage: stories bucket (private)

insert into storage.buckets (id, name, public) values
  ('stories', 'stories', false)
on conflict (id) do nothing;

drop policy if exists "Owners upload stories" on storage.objects;
create policy "Owners upload stories"
on storage.objects for insert to authenticated
with check (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Authenticated read stories" on storage.objects;
create policy "Authenticated read stories"
on storage.objects for select to authenticated
using (bucket_id = 'stories');

drop policy if exists "Owners delete stories" on storage.objects;
create policy "Owners delete stories"
on storage.objects for delete to authenticated
using (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);
