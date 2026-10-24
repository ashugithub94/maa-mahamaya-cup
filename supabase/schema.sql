-- MAA MAHAMAYA CUP database setup
create extension if not exists pgcrypto;

create sequence if not exists public.mmc_registration_number start 1;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text unique not null default ('MMC-' || lpad(nextval('public.mmc_registration_number')::text, 4, '0')),
  name text not null,
  mobile text not null unique check (mobile ~ '^[6-9][0-9]{9}$'),
  age integer not null check (age between 12 and 70),
  jersey_name text,
  jersey_number integer check (jersey_number between 0 and 99),
  tshirt_size text not null check (tshirt_size in ('S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  trouser_size text not null check (trouser_size in ('S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  role text not null check (role in ('Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper')),
  batting_style text not null check (batting_style in ('Right-hand', 'Left-hand')),
  bowling_style text not null check (bowling_style in ('Right-arm fast', 'Right-arm medium', 'Right-arm off-spin', 'Left-arm spin', 'Left-arm fast', 'None')),
  notes text,
  photo_url text,
  receipt_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Keeps an existing table compatible if this migration is run after the first setup.
alter table public.registrations alter column photo_url drop not null;

alter table public.registrations enable row level security;

drop policy if exists "Public can submit registrations" on public.registrations;
create policy "Public can submit registrations"
  on public.registrations for insert to anon, authenticated
  with check (true);

-- No SELECT, UPDATE, or DELETE policy is intentionally created for public users.
-- The server-side service role used by the protected admin routes bypasses RLS.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

-- Profile photos are intentionally public so committee-shared CSV links do not expire.
-- Payment receipts remain in the private receipts bucket below.
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can upload registration files" on storage.objects;
create policy "Public can upload registration files"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'receipts');

-- There is intentionally no public SELECT policy for this private bucket.
-- The service role creates short-lived signed URLs for the admin desk.
