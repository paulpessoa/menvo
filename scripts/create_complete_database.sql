/*
  Script completo para perfis, roles e validação manual com RLS no Supabase
  - Executar no SQL Editor do Supabase (Projeto > SQL)
  - Não apague este comentário até validar. TODO: remover depois de validar em produção.
*/

-- Extensões úteis
create extension if not exists pgcrypto;

-- Tipos
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_enum') then
    create type role_enum as enum ('mentor', 'mentee', 'admin');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'validation_status') then
    create type validation_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

-- Tabela profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  bio text,
  role role_enum, -- mentor | mentee | admin
  is_validated boolean not null default false,

  -- Campos opcionais úteis ao frontend que já vimos nos requests/cURLs
  location text,
  skills text[],
  experience_level text,
  linkedin_url text,
  github_url text,
  website_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- Atualiza updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Tabela user_roles (para abordagem mais escalável)
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('mentor', 'mentee', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Tabela para solicitar validação manual (especialmente para mentores)
create table if not exists public.validation_requests (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status validation_status not null default 'pending',
  notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_validation_requests_set_updated_at on public.validation_requests;
create trigger trg_validation_requests_set_updated_at
before update on public.validation_requests
for each row execute function public.set_updated_at();

create index if not exists idx_validation_requests_user_id on public.validation_requests(user_id);

-- Habilitar RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.validation_requests enable row level security;

-- Policies profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (user_id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (user_id = auth.uid());

-- Policies user_roles (cada usuário pode ver seus próprios roles)
drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own"
on public.user_roles
for select
using (user_id = auth.uid());

drop policy if exists "user_roles_insert_own" on public.user_roles;
create policy "user_roles_insert_own"
on public.user_roles
for insert
with check (user_id = auth.uid());

drop policy if exists "user_roles_delete_own" on public.user_roles;
create policy "user_roles_delete_own"
on public.user_roles
for delete
using (user_id = auth.uid());

-- Policies validation_requests
-- Usuário pode ver e criar seus próprios pedidos
drop policy if exists "validation_requests_select_own" on public.validation_requests;
create policy "validation_requests_select_own"
on public.validation_requests
for select
using (user_id = auth.uid());

drop policy if exists "validation_requests_insert_own" on public.validation_requests;
create policy "validation_requests_insert_own"
on public.validation_requests
for insert
with check (user_id = auth.uid());

-- Observação: Aprovar/Rejeitar deve ser feito via Server (chave service_role) em rotas admin
-- para não expor permissões no client. TODO: criar rota admin com service role se necessário.
