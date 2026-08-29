-- Chat was built against the old `items` table; rebuild against `listings`.
drop table if exists messages cascade;
drop table if exists offers cascade;
drop table if exists conversations cascade;
drop table if exists items cascade;


create table conversations (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id   uuid not null references profiles(id) on delete cascade,
  seller_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create index conversations_buyer_idx  on conversations (buyer_id);
create index conversations_seller_idx on conversations (seller_id);


create table offers (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  listing_id      uuid not null references listings(id) on delete cascade,
  buyer_id        uuid not null references profiles(id) on delete cascade,
  seller_id       uuid not null references profiles(id) on delete cascade,
  amount          numeric not null check (amount > 0),
  status          text not null default 'pending'
                  check (status in ('pending','accepted','declined','expired')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '24 hours',
  responded_at    timestamptz
);

create unique index one_live_offer_per_buyer_per_listing
  on offers (listing_id, buyer_id)
  where status = 'pending';

create index offers_conversation_idx on offers (conversation_id);
create index offers_pending_idx on offers (expires_at) where status = 'pending';


create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete set null,
  kind            text not null default 'text'
                  check (kind in ('text','offer','system')),
  body            text,
  offer_id        uuid references offers(id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at);


alter table conversations enable row level security;
alter table offers        enable row level security;
alter table messages      enable row level security;

create policy "participants read conversations" on conversations
  for select using (auth.uid() in (buyer_id, seller_id));

create policy "buyer creates conversation" on conversations
  for insert with check (auth.uid() = buyer_id);

create policy "participants read offers" on offers
  for select using (auth.uid() in (buyer_id, seller_id));

create policy "participants read messages" on messages
  for select using (
    exists (select 1 from conversations c
            where c.id = messages.conversation_id
              and auth.uid() in (c.buyer_id, c.seller_id))
  );

create policy "participants send messages" on messages
  for insert with check (
    sender_id = auth.uid()
    and kind = 'text'
    and exists (select 1 from conversations c
                where c.id = messages.conversation_id
                  and auth.uid() in (c.buyer_id, c.seller_id))
  );