-- Phase 4 completion: gig inquiry messages, gig extras, publish RPC

alter type public.message_content_type add value if not exists 'gig_inquiry';

alter table public.gigs
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists buyer_requirements text,
  add column if not exists gallery_urls text[] not null default '{}'::text[];

create or replace function public.publish_gig(p_gig_id uuid)
returns public.gigs
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  g public.gigs%rowtype;
  biz public.business_profiles%rowtype;
  basic_pkg public.gig_packages%rowtype;
  active_count integer;
  gig_limit integer;
  min_price integer;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  select g.* into g from public.gigs g where g.id = p_gig_id;
  if not found then raise exception 'Gig not found'; end if;

  select * into biz from public.business_profiles where id = g.business_id;
  if biz.user_id <> me then raise exception 'Not your gig'; end if;

  if g.cover_image_url is null or char_length(trim(g.cover_image_url)) < 1 then
    raise exception 'Cover image is required';
  end if;

  select * into basic_pkg
  from public.gig_packages
  where gig_id = p_gig_id and tier = 'basic';

  if not found then raise exception 'Basic package is required'; end if;
  if basic_pkg.price_cents < 0 or basic_pkg.delivery_days < 1 then
    raise exception 'Basic package must have price and delivery time';
  end if;
  if char_length(trim(basic_pkg.description)) < 1 then
    raise exception 'Basic package description is required';
  end if;

  select count(*) into active_count
  from public.gigs
  where business_id = g.business_id
    and status = 'published'
    and id <> p_gig_id;

  gig_limit := public.get_active_gig_limit(g.business_id);
  if active_count >= gig_limit then
    raise exception 'Active gig limit reached (%)', gig_limit;
  end if;

  select min(price_cents) into min_price
  from public.gig_packages
  where gig_id = p_gig_id;

  update public.gigs
  set
    status = 'published',
    published_at = coalesce(published_at, now()),
    starting_price_cents = min_price,
    updated_at = now()
  where id = p_gig_id
  returning * into g;

  return g;
end;
$$;

grant execute on function public.publish_gig(uuid) to authenticated;
