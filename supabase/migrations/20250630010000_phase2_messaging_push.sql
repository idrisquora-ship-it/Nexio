-- Phase 2: messaging, device tokens, push notification support

create type public.conversation_type as enum ('direct', 'group');
create type public.message_status as enum ('sending', 'sent', 'delivered', 'read', 'failed');

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists idx_device_tokens_user_id on public.device_tokens (user_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null default 'direct',
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  muted boolean not null default false,
  pinned boolean not null default false,
  archived boolean not null default false,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists idx_conversation_participants_user_id
  on public.conversation_participants (user_id, created_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) <= 10000),
  status public.message_status not null default 'sent',
  client_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists idx_messages_client_idempotency
  on public.messages (conversation_id, sender_id, client_id)
  where client_id is not null;

-- idx_messages_conversation_id_created_at: thread pagination
create index if not exists idx_messages_conversation_id_created_at
  on public.messages (conversation_id, created_at desc);

create table if not exists public.read_receipts (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 120),
    updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert_touch_conversation on public.messages;
create trigger on_message_insert_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_on_message();

create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  new_id uuid;
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if other_user_id = me then
    raise exception 'Cannot start a chat with yourself';
  end if;

  select cp1.conversation_id
  into existing_id
  from public.conversation_participants cp1
  join public.conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  join public.conversations c on c.id = cp1.conversation_id
  where cp1.user_id = me
    and cp2.user_id = other_user_id
    and c.type = 'direct'
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.conversations (type)
  values ('direct')
  returning id into new_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (new_id, me), (new_id, other_user_id);

  return new_id;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

alter table public.device_tokens enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.read_receipts enable row level security;

drop policy if exists "Users manage own device tokens" on public.device_tokens;
create policy "Users manage own device tokens"
on public.device_tokens for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
on public.conversations for select
to authenticated
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants can view membership" on public.conversation_participants;
create policy "Participants can view membership"
on public.conversation_participants for select
to authenticated
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Users update own participant row" on public.conversation_participants;
create policy "Users update own participant row"
on public.conversation_participants for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Participants can read receipts" on public.read_receipts;
create policy "Participants can read receipts"
on public.read_receipts for select
to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_id and cp.user_id = auth.uid()
  )
);

drop policy if exists "Users insert own read receipts" on public.read_receipts;
create policy "Users insert own read receipts"
on public.read_receipts for insert
to authenticated
with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
