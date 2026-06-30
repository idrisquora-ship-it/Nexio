-- Phase 3: groups, media messages, reactions, calls, storage buckets

create type public.message_content_type as enum ('text', 'image', 'video', 'voice', 'document');
create type public.call_type as enum ('voice', 'video');
create type public.call_status as enum ('ringing', 'active', 'ended', 'missed', 'declined');

alter table public.conversations
  add column if not exists name text,
  add column if not exists avatar_url text,
  add column if not exists created_by uuid references public.profiles (id);

alter table public.messages
  add column if not exists content_type public.message_content_type not null default 'text',
  add column if not exists media_url text,
  add column if not exists media_metadata jsonb,
  add column if not exists reply_to_id uuid references public.messages (id);

alter table public.messages alter column body set default '';

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  room_name text not null unique,
  call_type public.call_type not null default 'voice',
  status public.call_status not null default 'ringing',
  initiated_by uuid not null references public.profiles (id),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_sessions_conversation_id
  on public.call_sessions (conversation_id, created_at desc);

create table if not exists public.call_participants (
  call_id uuid not null references public.call_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz,
  left_at timestamptz,
  primary key (call_id, user_id)
);

create or replace function public.create_group_conversation(
  p_name text,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  me uuid := auth.uid();
  member_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or char_length(trim(p_name)) < 1 then
    raise exception 'Group name is required';
  end if;

  if p_member_ids is null or array_length(p_member_ids, 1) is null then
    raise exception 'At least one member is required';
  end if;

  insert into public.conversations (type, name, created_by)
  values ('group', trim(p_name), me)
  returning id into new_id;

  insert into public.conversation_participants (conversation_id, user_id, role)
  values (new_id, me, 'admin');

  foreach member_id in array p_member_ids loop
    if member_id <> me then
      insert into public.conversation_participants (conversation_id, user_id, role)
      values (new_id, member_id, 'member')
      on conflict do nothing;
    end if;
  end loop;

  return new_id;
end;
$$;

grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;

alter table public.message_reactions enable row level security;
alter table public.call_sessions enable row level security;
alter table public.call_participants enable row level security;

drop policy if exists "Participants can view reactions" on public.message_reactions;
create policy "Participants can view reactions"
on public.message_reactions for select to authenticated
using (
  exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants can add reactions" on public.message_reactions;
create policy "Participants can add reactions"
on public.message_reactions for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Users remove own reactions" on public.message_reactions;
create policy "Users remove own reactions"
on public.message_reactions for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Participants can view calls" on public.call_sessions;
create policy "Participants can view calls"
on public.call_sessions for select to authenticated
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants can create calls" on public.call_sessions;
create policy "Participants can create calls"
on public.call_sessions for insert to authenticated
with check (
  initiated_by = auth.uid()
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Initiator can update calls" on public.call_sessions;
create policy "Initiator can update calls"
on public.call_sessions for update to authenticated
using (initiated_by = auth.uid())
with check (initiated_by = auth.uid());

drop policy if exists "Participants can view call participants" on public.call_participants;
create policy "Participants can view call participants"
on public.call_participants for select to authenticated
using (
  exists (
    select 1 from public.call_sessions cs
    join public.conversation_participants cp on cp.conversation_id = cs.conversation_id
    where cs.id = call_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Users manage own call participant row" on public.call_participants;
create policy "Users manage own call participant row"
on public.call_participants for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values
  ('chat_images', 'chat_images', false),
  ('chat_videos', 'chat_videos', false),
  ('voice_notes', 'voice_notes', false),
  ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Participants read chat_images" on storage.objects;
create policy "Participants read chat_images"
on storage.objects for select to authenticated
using (
  bucket_id = 'chat_images'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants upload chat_images" on storage.objects;
create policy "Participants upload chat_images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat_images'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants read chat_videos" on storage.objects;
create policy "Participants read chat_videos"
on storage.objects for select to authenticated
using (
  bucket_id = 'chat_videos'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants upload chat_videos" on storage.objects;
create policy "Participants upload chat_videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat_videos'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants read voice_notes" on storage.objects;
create policy "Participants read voice_notes"
on storage.objects for select to authenticated
using (
  bucket_id = 'voice_notes'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants upload voice_notes" on storage.objects;
create policy "Participants upload voice_notes"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'voice_notes'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants read documents" on storage.objects;
create policy "Participants read documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants upload documents" on storage.objects;
create policy "Participants upload documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = nullif(split_part(name, '/', 1), '')::uuid
      and cp.user_id = auth.uid()
  )
);

alter publication supabase_realtime add table public.call_sessions;
