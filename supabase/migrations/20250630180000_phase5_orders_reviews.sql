-- Phase 5: orders, reviews, verification, ranking config

create type public.order_status as enum (
  'inquiry',
  'waiting',
  'accepted',
  'in_progress',
  'revision_requested',
  'delivered',
  'completed',
  'cancelled',
  'archived'
);

create type public.review_direction as enum ('buyer_to_seller', 'seller_to_buyer');

alter type public.message_content_type add value if not exists 'order_card';

alter table public.business_profiles
  add column if not exists is_verified boolean not null default false;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  gig_id uuid not null references public.gigs (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  package_tier public.package_tier not null default 'basic',
  status public.order_status not null default 'inquiry',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  delivery_days integer not null check (delivery_days > 0),
  terms text,
  agreement_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_orders_conversation on public.orders (conversation_id, updated_at desc);
create index if not exists idx_orders_buyer on public.orders (buyer_id, status);
create index if not exists idx_orders_seller on public.orders (seller_id, status);
create index if not exists idx_orders_gig on public.orders (gig_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  from_status public.order_status,
  to_status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_order on public.order_events (order_id, created_at);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  direction public.review_direction not null,
  overall_rating smallint check (overall_rating between 1 and 5),
  communication smallint check (communication between 1 and 5),
  quality smallint check (quality between 1 and 5),
  professionalism smallint check (professionalism between 1 and 5),
  delivery smallint check (delivery between 1 and 5),
  requirements_quality smallint check (requirements_quality between 1 and 5),
  would_recommend boolean,
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, reviewer_id)
);

create index if not exists idx_reviews_reviewee on public.reviews (reviewee_id, created_at desc);

create type public.verification_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.verification_submissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  document_url text not null,
  status public.verification_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_verification_business on public.verification_submissions (business_id, created_at desc);

insert into public.marketplace_config (key, value) values
  ('ranking_weights', '{"verified":10,"rating":20,"completed_orders":15,"keyword":25,"recent_activity":5}')
on conflict (key) do nothing;

-- Helper: post order card message in conversation
create or replace function public._post_order_card_message(p_order_id uuid, p_body text default null)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  g public.gigs%rowtype;
  msg public.messages%rowtype;
  meta jsonb;
begin
  select * into o from public.orders where id = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  select * into g from public.gigs where id = o.gig_id;

  meta := jsonb_build_object(
    'orderId', o.id,
    'status', o.status,
    'gigId', o.gig_id,
    'gigTitle', g.title,
    'packageTier', o.package_tier,
    'priceCents', o.price_cents,
    'currency', o.currency,
    'deliveryDays', o.delivery_days,
    'buyerId', o.buyer_id,
    'sellerId', o.seller_id
  );

  insert into public.messages (
    conversation_id, sender_id, body, content_type, media_metadata, status
  ) values (
    o.conversation_id,
    o.seller_id,
    coalesce(p_body, 'Order update'),
    'order_card',
    meta,
    'sent'
  )
  returning * into msg;

  update public.conversations
  set last_message_at = now(), updated_at = now()
  where id = o.conversation_id;

  return msg;
end;
$$;

create or replace function public._record_order_event(
  p_order_id uuid,
  p_actor_id uuid,
  p_from public.order_status,
  p_to public.order_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_events (order_id, actor_id, from_status, to_status, note)
  values (p_order_id, p_actor_id, p_from, p_to, p_note);
end;
$$;

create or replace function public.create_inquiry_order(p_conversation_id uuid, p_gig_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  g public.gigs%rowtype;
  biz public.business_profiles%rowtype;
  pkg public.gig_packages%rowtype;
  other_id uuid;
  oid uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  select * into g from public.gigs where id = p_gig_id and status = 'published';
  if not found then raise exception 'Gig not found'; end if;

  select * into biz from public.business_profiles where id = g.business_id;
  if biz.user_id = me then raise exception 'Cannot inquire on own gig'; end if;

  if not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.user_id = me
  ) then raise exception 'Not a participant'; end if;

  select cp.user_id into other_id
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id and cp.user_id <> me
  limit 1;

  if other_id is distinct from biz.user_id then
    raise exception 'Conversation must be with the seller';
  end if;

  select id into oid from public.orders
  where conversation_id = p_conversation_id and gig_id = p_gig_id
    and status not in ('cancelled', 'archived', 'completed')
  limit 1;

  if found then return oid; end if;

  select * into pkg from public.gig_packages
  where gig_id = p_gig_id and tier = 'basic';

  insert into public.orders (
    conversation_id, gig_id, buyer_id, seller_id, business_id,
    package_tier, status, price_cents, currency, delivery_days,
    agreement_snapshot
  ) values (
    p_conversation_id, p_gig_id, me, biz.user_id, biz.id,
    coalesce(pkg.tier, 'basic'), 'inquiry',
    coalesce(pkg.price_cents, g.starting_price_cents, 0),
    g.currency,
    coalesce(pkg.delivery_days, 3),
    jsonb_build_object('gig_title', g.title, 'tier', coalesce(pkg.tier, 'basic'))
  )
  returning id into oid;

  perform public._record_order_event(oid, me, null, 'inquiry', 'Gig inquiry');
  return oid;
end;
$$;

create or replace function public.create_order_agreement(
  p_conversation_id uuid,
  p_gig_id uuid,
  p_package_tier public.package_tier,
  p_terms text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  g public.gigs%rowtype;
  biz public.business_profiles%rowtype;
  pkg public.gig_packages%rowtype;
  buyer_id uuid;
  o public.orders%rowtype;
  from_st public.order_status;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  select * into g from public.gigs where id = p_gig_id;
  if not found then raise exception 'Gig not found'; end if;

  select * into biz from public.business_profiles where id = g.business_id;
  if biz.user_id <> me then raise exception 'Only the seller can create agreements'; end if;
  if biz.is_vacation_mode then raise exception 'Seller is on vacation — new orders disabled'; end if;

  select cp.user_id into buyer_id
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id and cp.user_id <> me
  limit 1;

  if buyer_id is null then raise exception 'Buyer not found in conversation'; end if;

  select * into pkg from public.gig_packages
  where gig_id = p_gig_id and tier = p_package_tier;

  if not found then raise exception 'Package tier not found'; end if;

  select * into o from public.orders
  where conversation_id = p_conversation_id and gig_id = p_gig_id
    and status in ('inquiry', 'waiting')
  order by created_at desc
  limit 1;

  if found then
    from_st := o.status;
    update public.orders set
      status = 'waiting',
      package_tier = p_package_tier,
      price_cents = pkg.price_cents,
      delivery_days = pkg.delivery_days,
      terms = p_terms,
      agreement_snapshot = jsonb_build_object(
        'gig_title', g.title,
        'tier', p_package_tier,
        'price_cents', pkg.price_cents,
        'delivery_days', pkg.delivery_days,
        'terms', p_terms
      ),
      updated_at = now()
    where id = o.id
    returning * into o;
  else
    from_st := null;
    insert into public.orders (
      conversation_id, gig_id, buyer_id, seller_id, business_id,
      package_tier, status, price_cents, currency, delivery_days, terms,
      agreement_snapshot
    ) values (
      p_conversation_id, p_gig_id, buyer_id, me, biz.id,
      p_package_tier, 'waiting', pkg.price_cents, g.currency, pkg.delivery_days, p_terms,
      jsonb_build_object(
        'gig_title', g.title,
        'tier', p_package_tier,
        'price_cents', pkg.price_cents,
        'delivery_days', pkg.delivery_days,
        'terms', p_terms
      )
    )
    returning * into o;
  end if;

  perform public._record_order_event(o.id, me, from_st, 'waiting', p_terms);
  perform public._post_order_card_message(o.id, 'Agreement sent — awaiting buyer acceptance');
  return o;
end;
$$;

create or replace function public.accept_order_agreement(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o public.orders%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into o from public.orders where id = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  if o.buyer_id <> me then raise exception 'Only buyer can accept'; end if;
  if o.status <> 'waiting' then raise exception 'Order is not awaiting acceptance'; end if;

  update public.orders set status = 'in_progress', updated_at = now() where id = p_order_id returning * into o;
  perform public._record_order_event(p_order_id, me, 'waiting', 'in_progress', 'Agreement accepted');
  perform public._post_order_card_message(p_order_id, 'Order in progress');
  return o;
end;
$$;

create or replace function public.mark_order_delivered(p_order_id uuid, p_note text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o public.orders%rowtype;
  prev public.order_status;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into o from public.orders where id = p_order_id;
  if o.seller_id <> me then raise exception 'Only seller can deliver'; end if;
  if o.status not in ('in_progress', 'revision_requested') then
    raise exception 'Order cannot be delivered in current status';
  end if;

  prev := o.status;
  update public.orders set status = 'delivered', updated_at = now() where id = p_order_id returning * into o;
  perform public._record_order_event(p_order_id, me, prev, 'delivered', p_note);
  perform public._post_order_card_message(p_order_id, coalesce(p_note, 'Delivery submitted'));
  return o;
end;
$$;

create or replace function public.accept_order_delivery(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o public.orders%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into o from public.orders where id = p_order_id;
  if o.buyer_id <> me then raise exception 'Only buyer can accept delivery'; end if;
  if o.status <> 'delivered' then raise exception 'Order is not delivered'; end if;

  update public.orders
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = p_order_id returning * into o;

  update public.gigs set order_count = order_count + 1 where id = o.gig_id;

  perform public._record_order_event(p_order_id, me, 'delivered', 'completed', 'Delivery accepted');
  perform public._post_order_card_message(p_order_id, 'Order completed — leave a review!');
  return o;
end;
$$;

create or replace function public.request_order_revision(p_order_id uuid, p_note text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o public.orders%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into o from public.orders where id = p_order_id;
  if o.buyer_id <> me then raise exception 'Only buyer can request revision'; end if;
  if o.status <> 'in_progress' then raise exception 'Revision only during in progress'; end if;

  update public.orders set status = 'revision_requested', updated_at = now() where id = p_order_id returning * into o;
  perform public._record_order_event(p_order_id, me, 'in_progress', 'revision_requested', p_note);
  perform public._post_order_card_message(p_order_id, coalesce(p_note, 'Revision requested'));
  return o;
end;
$$;

create or replace function public.resume_order_work(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o public.orders%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into o from public.orders where id = p_order_id;
  if o.seller_id <> me then raise exception 'Only seller can resume work'; end if;
  if o.status <> 'revision_requested' then raise exception 'Order is not awaiting revision'; end if;

  update public.orders set status = 'in_progress', updated_at = now() where id = p_order_id returning * into o;
  perform public._record_order_event(p_order_id, me, 'revision_requested', 'in_progress', 'Work resumed');
  perform public._post_order_card_message(p_order_id, 'Seller resumed work');
  return o;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o public.orders%rowtype;
  prev public.order_status;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into o from public.orders where id = p_order_id;
  if me not in (o.buyer_id, o.seller_id) then raise exception 'Not allowed'; end if;
  if o.status in ('completed', 'cancelled', 'archived') then
    raise exception 'Order cannot be cancelled';
  end if;

  prev := o.status;
  update public.orders set status = 'cancelled', updated_at = now() where id = p_order_id returning * into o;
  perform public._record_order_event(p_order_id, me, prev, 'cancelled', p_reason);
  perform public._post_order_card_message(p_order_id, coalesce(p_reason, 'Order cancelled'));
  return o;
end;
$$;

create or replace function public.submit_order_review(
  p_order_id uuid,
  p_overall smallint default null,
  p_communication smallint default null,
  p_quality smallint default null,
  p_professionalism smallint default null,
  p_delivery smallint default null,
  p_requirements_quality smallint default null,
  p_would_recommend boolean default null,
  p_comment text default null
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  o public.orders%rowtype;
  dir public.review_direction;
  reviewee uuid;
  r public.reviews%rowtype;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into o from public.orders where id = p_order_id;
  if o.status <> 'completed' then raise exception 'Reviews only after completion'; end if;

  if me = o.buyer_id then
    dir := 'buyer_to_seller';
    reviewee := o.seller_id;
    if p_overall is null or p_communication is null then
      raise exception 'Overall and communication ratings required';
    end if;
  elsif me = o.seller_id then
    dir := 'seller_to_buyer';
    reviewee := o.buyer_id;
    if p_communication is null then raise exception 'Communication rating required'; end if;
  else
    raise exception 'Not a party on this order';
  end if;

  insert into public.reviews (
    order_id, reviewer_id, reviewee_id, direction,
    overall_rating, communication, quality, professionalism, delivery,
    requirements_quality, would_recommend, comment
  ) values (
    p_order_id, me, reviewee, dir,
    p_overall, p_communication, p_quality, p_professionalism, p_delivery,
    p_requirements_quality, p_would_recommend, p_comment
  )
  returning * into r;

  if dir = 'buyer_to_seller' then
    update public.gigs g set
      rating_avg = (
        select coalesce(avg(rv.overall_rating), 0)::numeric(3,2)
        from public.reviews rv
        join public.orders ord on ord.id = rv.order_id
        where ord.gig_id = o.gig_id and rv.direction = 'buyer_to_seller'
      ),
      rating_count = (
        select count(*)::integer
        from public.reviews rv
        join public.orders ord on ord.id = rv.order_id
        where ord.gig_id = o.gig_id and rv.direction = 'buyer_to_seller'
      )
    where g.id = o.gig_id;
  end if;

  return r;
end;
$$;

create or replace function public.submit_verification(p_document_url text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  biz_id uuid;
  sub_id uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select id into biz_id from public.business_profiles where user_id = me;
  if biz_id is null then raise exception 'Business profile required'; end if;

  if exists (
    select 1 from public.verification_submissions
    where business_id = biz_id and status = 'pending'
  ) then raise exception 'Verification already pending'; end if;

  insert into public.verification_submissions (business_id, document_url)
  values (biz_id, p_document_url)
  returning id into sub_id;

  return sub_id;
end;
$$;

grant execute on function public.create_inquiry_order(uuid, uuid) to authenticated;
grant execute on function public.create_order_agreement(uuid, uuid, public.package_tier, text) to authenticated;
grant execute on function public.accept_order_agreement(uuid) to authenticated;
grant execute on function public.mark_order_delivered(uuid, text) to authenticated;
grant execute on function public.accept_order_delivery(uuid) to authenticated;
grant execute on function public.request_order_revision(uuid, text) to authenticated;
grant execute on function public.resume_order_work(uuid) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.submit_order_review(uuid, smallint, smallint, smallint, smallint, smallint, smallint, boolean, text) to authenticated;
grant execute on function public.submit_verification(text) to authenticated;

alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.reviews enable row level security;
alter table public.verification_submissions enable row level security;

drop policy if exists "Parties read orders" on public.orders;
create policy "Parties read orders"
on public.orders for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "Parties read order events" on public.order_events;
create policy "Parties read order events"
on public.order_events for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
));

drop policy if exists "Public read reviews" on public.reviews;
create policy "Public read reviews"
on public.reviews for select to authenticated
using (true);

drop policy if exists "Authors read own reviews" on public.reviews;
create policy "Authors read own reviews"
on public.reviews for insert to authenticated
with check (reviewer_id = auth.uid());

drop policy if exists "Owners read verification" on public.verification_submissions;
create policy "Owners read verification"
on public.verification_submissions for select to authenticated
using (exists (
  select 1 from public.business_profiles bp
  where bp.id = business_id and bp.user_id = auth.uid()
));

insert into storage.buckets (id, name, public) values
  ('verification', 'verification', false)
on conflict (id) do nothing;

drop policy if exists "Owners upload verification" on storage.objects;
create policy "Owners upload verification"
on storage.objects for insert to authenticated
with check (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners read verification docs" on storage.objects;
create policy "Owners read verification docs"
on storage.objects for select to authenticated
using (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);
