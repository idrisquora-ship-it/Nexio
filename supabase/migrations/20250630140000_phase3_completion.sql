-- Phase 3 completion: call accept/decline, call push trigger, message soft delete

create or replace function public.accept_call(p_call_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  call_row public.call_sessions%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into call_row from public.call_sessions where id = p_call_id;
  if not found then
    raise exception 'Call not found';
  end if;

  if call_row.status not in ('ringing', 'active') then
    raise exception 'Call is not available';
  end if;

  if call_row.initiated_by = me then
    raise exception 'Cannot accept own call';
  end if;

  if not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = call_row.conversation_id and cp.user_id = me
  ) then
    raise exception 'Not a participant';
  end if;

  update public.call_sessions
  set status = 'active', started_at = coalesce(started_at, now())
  where id = p_call_id;

  insert into public.call_participants (call_id, user_id, joined_at)
  values (p_call_id, me, now())
  on conflict (call_id, user_id) do update set joined_at = excluded.joined_at;
end;
$$;

create or replace function public.decline_call(p_call_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  call_row public.call_sessions%rowtype;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into call_row from public.call_sessions where id = p_call_id;
  if not found then
    raise exception 'Call not found';
  end if;

  if call_row.initiated_by = me then
    raise exception 'Cannot decline own call';
  end if;

  if call_row.status <> 'ringing' then
    raise exception 'Call is no longer ringing';
  end if;

  if not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = call_row.conversation_id and cp.user_id = me
  ) then
    raise exception 'Not a participant';
  end if;

  update public.call_sessions
  set status = 'declined', ended_at = now()
  where id = p_call_id;

  insert into public.call_participants (call_id, user_id, left_at)
  values (p_call_id, me, now())
  on conflict (call_id, user_id) do update set left_at = excluded.left_at;
end;
$$;

grant execute on function public.accept_call(uuid) to authenticated;
grant execute on function public.decline_call(uuid) to authenticated;

drop policy if exists "Sender can soft delete messages" on public.messages;
create policy "Sender can soft delete messages"
on public.messages for update to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

create or replace function public.trigger_push_on_call()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if NEW.status <> 'ringing' then
    return NEW;
  end if;

  perform net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/on-call-created',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'room_name', NEW.room_name,
        'call_type', NEW.call_type,
        'status', NEW.status,
        'initiated_by', NEW.initiated_by
      )
    )
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;

revoke execute on function public.trigger_push_on_call() from public, anon, authenticated;

drop trigger if exists on_call_created_push on public.call_sessions;
create trigger on_call_created_push
after insert on public.call_sessions
for each row execute function public.trigger_push_on_call();
