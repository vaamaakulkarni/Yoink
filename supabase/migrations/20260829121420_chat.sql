-- CONVERSATIONS -------------------------------------------------------
-- One thread per buyer per item. Created on first offer or first message.
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references items(id) on delete cascade,
  buyer_id   uuid not null references profiles(id) on delete cascade,
  seller_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (item_id, buyer_id)
);

create index conversations_buyer_idx  on conversations (buyer_id);
create index conversations_seller_idx on conversations (seller_id);


-- OFFERS --------------------------------------------------------------
create table offers (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  item_id         uuid not null references items(id) on delete cascade,
  buyer_id        uuid not null references profiles(id) on delete cascade,
  seller_id       uuid not null references profiles(id) on delete cascade,
  amount_cents    int  not null check (amount_cents > 0),
  status          text not null default 'pending'
                  check (status in ('pending','accepted','declined','expired')),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '24 hours',
  responded_at    timestamptz
);

-- Only ONE live offer per buyer per item.
create unique index one_live_offer_per_buyer_per_item
  on offers (item_id, buyer_id)
  where status = 'pending';

create index offers_conversation_idx on offers (conversation_id);
create index offers_pending_idx on offers (expires_at) where status = 'pending';


-- MESSAGES ------------------------------------------------------------
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete set null,  -- null = system
  kind            text not null default 'text'
                  check (kind in ('text','offer','system')),
  body            text,
  offer_id        uuid references offers(id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at);


-- ROW LEVEL SECURITY --------------------------------------------------
alter table conversations enable row level security;
alter table offers        enable row level security;
alter table messages      enable row level security;

-- Conversations: only the two participants can see or create them.
create policy "participants read conversations" on conversations
  for select using (auth.uid() in (buyer_id, seller_id));

create policy "buyer creates conversation" on conversations
  for insert with check (auth.uid() = buyer_id);

-- Offers: participants can read. Writes go through functions only (0003).
create policy "participants read offers" on offers
  for select using (auth.uid() in (buyer_id, seller_id));

-- Messages: participants read; participants send their own text messages.
create policy "participants read messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and auth.uid() in (c.buyer_id, c.seller_id)
    )
  );

create policy "participants send messages" on messages
  for insert with check (
    sender_id = auth.uid()
    and kind = 'text'
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and auth.uid() in (c.buyer_id, c.seller_id)
    )
  );