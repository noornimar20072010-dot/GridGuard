-- GridGuard — Phase 1 schema (User, Transformer, Telemetry)
-- Paste this directly into the Supabase SQL Editor (Dashboard > SQL Editor > New query).
--
-- Notes:
-- * public.users mirrors auth.users (Supabase Auth manages the actual login
--   records); this table just lets us join app data to a known user.
-- * RLS is intentionally left disabled: the backend talks to Postgres using
--   the service role key, which bypasses RLS anyway. Revisit this before any
--   direct frontend-to-Supabase database access is introduced.

create table if not exists public.users (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique,
    created_at timestamptz not null default now()
);

create table if not exists public.transformers (
    id text primary key, -- human-readable code, e.g. 'T-101'
    zone text not null,  -- e.g. 'Zone A'
    created_at timestamptz not null default now()
);

create table if not exists public.telemetry (
    id bigserial primary key,
    transformer_id text not null references public.transformers (id) on delete cascade,
    load numeric not null,
    voltage numeric not null,
    current numeric not null,
    temperature numeric not null,
    recorded_at timestamptz not null default now()
);

create index if not exists idx_telemetry_transformer_recorded_at
    on public.telemetry (transformer_id, recorded_at desc);
