-- Phase 1/2 completion: security hardening + automatic push trigger

-- Fix search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Prevent internal trigger functions from being called via RPC
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_conversation_on_message() from public, anon, authenticated;

-- Push notification trigger via pg_net
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_push_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://thqhypzcisewftszeuat.supabase.co/functions/v1/on-message-created',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'body', coalesce(NEW.body, '')
      )
    )
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;

revoke execute on function public.trigger_push_on_message() from public, anon, authenticated;

drop trigger if exists on_message_created_push on public.messages;
create trigger on_message_created_push
after insert on public.messages
for each row execute function public.trigger_push_on_message();
