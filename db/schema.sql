-- Sakoon: authentication schema (safe to re-run)
create extension if not exists pgcrypto;

create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  email          text not null,
  phone          text,
  password_hash  text not null,
  role           text not null check (role in ('admin','psychologist','client')),
  status         text not null default 'active' check (status in ('active','suspended','deactivated')),
  email_verified boolean not null default false,
  timezone       text not null default 'Asia/Karachi',
  created_at     timestamptz not null default now()
);
create unique index if not exists users_email_unique on users (lower(email));

create table if not exists client_profiles (
  user_id uuid primary key references users(id) on delete cascade
);

create table if not exists psychologist_profiles (
  user_id             uuid primary key references users(id) on delete cascade,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','approved','rejected','additional_info_required'))
);

-- Supabase exposes the public schema through its REST API.
-- Locking tables with RLS (and no policies) means only this server, connecting
-- directly with the database password, can read or write them.
alter table users                 enable row level security;
alter table client_profiles       enable row level security;
alter table psychologist_profiles enable row level security;
