-- Migration to create waiting_list table for waiting list signups

create table if not exists waiting_list (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text,
  reason text not null,
  user_type text not null,
  created_at timestamptz not null default now()
);
