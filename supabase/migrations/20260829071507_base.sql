-- PROFILES ------------------------------------------------------------
-- Mirrors auth.users with the app-level fields (name, uni, dorm).
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  university  text,
  dorm        text,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- Everyone can read profiles: buyers need to see seller name + dorm.
create policy "profiles are public" on profiles
  for select using (true);

create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, university, dorm)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Student'),
    new.raw_user_meta_data->>'university',
    new.raw_user_meta_data->>'dorm'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ITEMS ---------------------------------------------------------------
create table items (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  price_cents int not null default 0 check (price_cents >= 0),
  is_free     boolean not null default false,
  condition   text check (condition in ('new','like_new','good','fair','worn')),
  category    text check (category in ('kitchenware','winter','furniture','books','electronics','other')),
  image_url   text,
  status      text not null default 'available'
              check (status in ('available','pending','sold')),
  created_at  timestamptz not null default now()
);

create index items_status_created_idx on items (status, created_at desc);
create index items_seller_idx on items (seller_id);

alter table items enable row level security;

create policy "items are public" on items
  for select using (true);

create policy "users insert own items" on items
  for insert with check (auth.uid() = seller_id);

create policy "sellers update own items" on items
  for update using (auth.uid() = seller_id);

create policy "sellers delete own items" on items
  for delete using (auth.uid() = seller_id);