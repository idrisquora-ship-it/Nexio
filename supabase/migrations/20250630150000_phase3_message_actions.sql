-- Phase 3 polish: pin, star, edit messages, mark unread

alter table public.messages
  add column if not exists edited_at timestamptz,
  add column if not exists pinned_at timestamptz;

create index if not exists idx_messages_pinned
  on public.messages (conversation_id, pinned_at desc nulls last)
  where pinned_at is not null and deleted_at is null;

create table if not exists public.starred_messages (
  user_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

alter table public.starred_messages enable row level security;

drop policy if exists "Users manage own stars" on public.starred_messages;
create policy "Users manage own stars"
on public.starred_messages for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users read own stars" on public.starred_messages;
create policy "Users read own stars"
on public.starred_messages for select to authenticated
using (user_id = auth.uid());

create or replace function public.edit_message(p_message_id uuid, p_body text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  msg public.messages%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if p_body is null or char_length(trim(p_body)) < 1 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(p_body) > 10000 then raise exception 'Message too long'; end if;

  select * into msg from public.messages where id = p_message_id;
  if not found then raise exception 'Message not found'; end if;
  if msg.sender_id <> me then raise exception 'Only sender can edit'; end if;
  if msg.content_type <> 'text' then raise exception 'Only text messages can be edited'; end if;
  if msg.deleted_at is not null then raise exception 'Message was deleted'; end if;
  if msg.created_at < now() - interval '15 minutes' then
    raise exception 'Edit window expired (15 minutes)';
  end if;

  update public.messages
  set body = trim(p_body), edited_at = now()
  where id = p_message_id
  returning * into msg;

  return msg;
end;
$$;

create or replace function public.pin_message(p_message_id uuid)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  msg public.messages%rowtype;
  pinned_count integer;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  select * into msg from public.messages where id = p_message_id and deleted_at is null;
  if not found then raise exception 'Message not found'; end if;

  if not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = msg.conversation_id and cp.user_id = me
  ) then raise exception 'Not a participant'; end if;

  select count(*) into pinned_count
  from public.messages
  where conversation_id = msg.conversation_id
    and pinned_at is not null
    and deleted_at is null
    and id <> p_message_id;

  if pinned_count >= 3 then raise exception 'Maximum 3 pinned messages per chat'; end if;

  update public.messages set pinned_at = now() where id = p_message_id returning * into msg;
  return msg;
end;
$$;

create or replace function public.unpin_message(p_message_id uuid)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  msg public.messages%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  select * into msg from public.messages where id = p_message_id;
  if not found then raise exception 'Message not found'; end if;

  if not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = msg.conversation_id and cp.user_id = me
  ) then raise exception 'Not a participant'; end if;

  update public.messages set pinned_at = null where id = p_message_id returning * into msg;
  return msg;
end;
$$;

create or replace function public.toggle_star_message(p_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  starred boolean;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  if not exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = p_message_id and cp.user_id = me
  ) then raise exception 'Not allowed'; end if;

  if exists (select 1 from public.starred_messages where user_id = me and message_id = p_message_id) then
    delete from public.starred_messages where user_id = me and message_id = p_message_id;
    return false;
  end if;

  insert into public.starred_messages (user_id, message_id) values (me, p_message_id);
  return true;
end;
$$;

create or replace function public.mark_conversation_unread(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  update public.conversation_participants
  set last_read_at = '1970-01-01'::timestamptz
  where conversation_id = p_conversation_id and user_id = auth.uid();
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  update public.conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = auth.uid();
end;
$$;

grant execute on function public.edit_message(uuid, text) to authenticated;
grant execute on function public.pin_message(uuid) to authenticated;
grant execute on function public.unpin_message(uuid) to authenticated;
grant execute on function public.toggle_star_message(uuid) to authenticated;
grant execute on function public.mark_conversation_unread(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
