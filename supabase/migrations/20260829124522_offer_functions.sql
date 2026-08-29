-- Sweep a buyer's stale offers so the unique index doesn't wrongly block them.
create or replace function expire_stale_offers()
returns void
language sql security definer set search_path = public
as $$
  update offers set status = 'expired'
  where status = 'pending' and expires_at < now();
$$;


-- MAKE AN OFFER -------------------------------------------------------
create or replace function make_offer(
  p_listing_id uuid,
  p_amount numeric
) returns offers
language plpgsql security definer set search_path = public
as $$
declare
  v_seller uuid;
  v_status text;
  v_conv   conversations;
  v_offer  offers;
begin
  if auth.uid() is null then
    raise exception 'must be logged in';
  end if;

  perform expire_stale_offers();

  select seller_id, status into v_seller, v_status
  from listings where id = p_listing_id;

  if v_seller is null then
    raise exception 'listing not found or has no seller';
  end if;
  if v_seller = auth.uid() then
    raise exception 'cannot offer on your own listing';
  end if;
  if v_status <> 'available' then
    raise exception 'listing is no longer available';
  end if;

  -- Reuse the thread if one exists, else create it.
  select * into v_conv from conversations
  where listing_id = p_listing_id and buyer_id = auth.uid();

  if v_conv.id is null then
    insert into conversations (listing_id, buyer_id, seller_id)
    values (p_listing_id, auth.uid(), v_seller)
    returning * into v_conv;
  end if;

  -- Blocked by the partial unique index if one is already pending.
  insert into offers (conversation_id, listing_id, buyer_id, seller_id, amount)
  values (v_conv.id, p_listing_id, auth.uid(), v_seller, p_amount)
  returning * into v_offer;

  insert into messages (conversation_id, sender_id, kind, offer_id, body)
  values (v_conv.id, auth.uid(), 'offer', v_offer.id,
          'Offered $' || to_char(p_amount, 'FM999999990.00'));

  return v_offer;
exception
  when unique_violation then
    raise exception 'You already have a live offer on this item';
end $$;


-- ACCEPT OR DECLINE ---------------------------------------------------
create or replace function respond_to_offer(
  p_offer_id uuid,
  p_action   text          -- 'accept' | 'decline'
) returns offers
language plpgsql security definer set search_path = public
as $$
declare
  v_offer offers;
  v_buyer_name text;
begin
  if p_action not in ('accept','decline') then
    raise exception 'action must be accept or decline';
  end if;

  select * into v_offer from offers where id = p_offer_id for update;

  if v_offer.id is null then
    raise exception 'offer not found';
  end if;
  if v_offer.seller_id <> auth.uid() then
    raise exception 'not your offer to respond to';
  end if;
  if v_offer.status <> 'pending' then
    raise exception 'offer already %', v_offer.status;
  end if;
  if v_offer.expires_at < now() then
    update offers set status = 'expired' where id = v_offer.id;
    raise exception 'this offer expired';
  end if;

  update offers
     set status = case p_action when 'accept' then 'accepted' else 'declined' end,
         responded_at = now()
   where id = v_offer.id
   returning * into v_offer;

  if p_action = 'accept' then
    update listings set status = 'sold' where id = v_offer.listing_id;

    -- Every other live offer on this listing is now dead.
    update offers set status = 'declined', responded_at = now()
    where listing_id = v_offer.listing_id
      and status = 'pending'
      and id <> v_offer.id;

    select name into v_buyer_name from profiles where id = v_offer.buyer_id;

    insert into messages (conversation_id, kind, body)
    values (v_offer.conversation_id, 'system',
            'Offer accepted 🎉 Sold to ' || coalesce(v_buyer_name,'buyer')
            || ' for $' || to_char(v_offer.amount, 'FM999999990.00')
            || '. Arrange pickup below.');
  else
    insert into messages (conversation_id, kind, body)
    values (v_offer.conversation_id, 'system', 'Offer declined.');
  end if;

  return v_offer;
end $$;


-- BUY NOW -------------------------------------------------------------
create or replace function buy_now(p_listing_id uuid)
returns conversations
language plpgsql security definer set search_path = public
as $$
declare
  v_seller uuid;
  v_status text;
  v_price  numeric;
  v_conv   conversations;
  v_name   text;
begin
  if auth.uid() is null then
    raise exception 'must be logged in';
  end if;

  select seller_id, status, price into v_seller, v_status, v_price
  from listings where id = p_listing_id for update;

  if v_seller = auth.uid() then
    raise exception 'cannot buy your own listing';
  end if;
  if v_status <> 'available' then
    raise exception 'listing is no longer available';
  end if;

  select * into v_conv from conversations
  where listing_id = p_listing_id and buyer_id = auth.uid();

  if v_conv.id is null then
    insert into conversations (listing_id, buyer_id, seller_id)
    values (p_listing_id, auth.uid(), v_seller)
    returning * into v_conv;
  end if;

  update listings set status = 'sold' where id = p_listing_id;

  update offers set status = 'declined', responded_at = now()
  where listing_id = p_listing_id and status = 'pending';

  select name into v_name from profiles where id = auth.uid();

  insert into messages (conversation_id, kind, body)
  values (v_conv.id, 'system',
          '🎉 ' || coalesce(v_name,'Someone') || ' just bought this — arrange a pickup time.');

  return v_conv;
end $$;