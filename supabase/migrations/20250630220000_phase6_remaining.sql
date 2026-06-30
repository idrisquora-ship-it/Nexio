-- Phase 6 remaining: channel post reactions

create table if not exists public.channel_post_reactions (
  post_id uuid not null references public.channel_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_channel_post_reactions_post
  on public.channel_post_reactions (post_id);

create or replace function public.toggle_channel_post_reaction(
  p_post_id uuid,
  p_emoji text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  current_emoji text;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if p_emoji is null or char_length(trim(p_emoji)) < 1 then
    raise exception 'Emoji required';
  end if;

  select emoji into current_emoji
  from public.channel_post_reactions
  where post_id = p_post_id and user_id = me;

  if current_emoji = p_emoji then
    delete from public.channel_post_reactions
    where post_id = p_post_id and user_id = me;
    return null;
  end if;

  insert into public.channel_post_reactions (post_id, user_id, emoji)
  values (p_post_id, me, p_emoji)
  on conflict (post_id, user_id) do update set emoji = excluded.emoji, created_at = now();

  return p_emoji;
end;
$$;

grant execute on function public.toggle_channel_post_reaction(uuid, text) to authenticated;

alter table public.channel_post_reactions enable row level security;

drop policy if exists "Read channel post reactions" on public.channel_post_reactions;
create policy "Read channel post reactions"
on public.channel_post_reactions for select to authenticated
using (true);

drop policy if exists "Users manage own channel reactions" on public.channel_post_reactions;
create policy "Users manage own channel reactions"
on public.channel_post_reactions for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
