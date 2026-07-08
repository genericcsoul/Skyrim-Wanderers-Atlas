-- Wanderer's Atlas Supabase setup for 7-character online share codes.
-- Run this in Supabase SQL Editor.
-- Do not put any service_role key in the public website.

create table if not exists public.atlas_shares (
  code text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  app_version text not null default 'wanderers-atlas',
  constraint atlas_shares_code_format check (code ~ '^[A-Z0-9]{7}$'),
  constraint atlas_shares_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint atlas_shares_payload_features_array check (coalesce(jsonb_typeof(payload -> 'features') = 'array', false)),
  constraint atlas_shares_payload_feature_count check (
    case
      when jsonb_typeof(payload -> 'features') = 'array'
      then jsonb_array_length(payload -> 'features') between 1 and 500
      else false
    end
  ),
  constraint atlas_shares_payload_size check (pg_column_size(payload) <= 1000000)
);

create index if not exists atlas_shares_expires_at_idx
  on public.atlas_shares (expires_at);

alter table public.atlas_shares enable row level security;

drop policy if exists atlas_shares_public_read_active on public.atlas_shares;
create policy atlas_shares_public_read_active
  on public.atlas_shares
  for select
  to anon, authenticated
  using (expires_at is null or expires_at > now());

drop policy if exists atlas_shares_public_insert on public.atlas_shares;
create policy atlas_shares_public_insert
  on public.atlas_shares
  for insert
  to anon, authenticated
  with check (expires_at is null or expires_at > now());

revoke update, delete on public.atlas_shares from anon, authenticated;
grant select, insert on public.atlas_shares to anon, authenticated;
