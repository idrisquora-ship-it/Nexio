-- Phase 6 completion: community groups, business post push, group RPC update

alter table public.conversations
  add column if not exists community_id uuid references public.communities (id) on delete cascade;

create index if not exists idx_conversations_community
  on public.conversations (community_id)
  where community_id is not null;

create or replace function public.create_group_conversation(
  p_name text,
  p_member_ids uuid[],
  p_community_id uuid default null
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

  if p_community_id is not null then
    if not exists (
      select 1 from public.community_members
      where community_id = p_community_id and user_id = me
    ) then
      raise exception 'Not a community member';
    end if;
  end if;

  insert into public.conversations (type, name, created_by, community_id)
  values ('group', trim(p_name), me, p_community_id)
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

grant execute on function public.create_group_conversation(text, uuid[], uuid) to authenticated;

create or replace function public.trigger_push_on_business_post()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/on-business-post-created',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'business_id', NEW.business_id,
        'body', NEW.body
      )
    )
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;

revoke execute on function public.trigger_push_on_business_post() from public, anon, authenticated;

drop trigger if exists on_business_post_created_push on public.business_posts;
create trigger on_business_post_created_push
after insert on public.business_posts
for each row execute function public.trigger_push_on_business_post();
