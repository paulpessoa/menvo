-- C-O1: pedidos de organizações que querem a Menvo ("Quero a Menvo na
-- minha organização"). Só cria um lead; a organização em si continua
-- sendo criada pelo admin (sem autocadastro, ver docs/domains/organizations.md).
create table public.organization_leads (
  id uuid primary key default gen_random_uuid(),
  org_name text not null check (char_length(org_name) between 2 and 120),
  org_type text not null check (org_type in ('ngo', 'company', 'school', 'event', 'other')),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  contact_email text not null check (char_length(contact_email) <= 254),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 30),
  people_estimate text not null check (people_estimate in ('1-20', '21-100', '101-500', '500+')),
  message text check (message is null or char_length(message) <= 1000),
  locale text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_leads_status_created_idx
  on public.organization_leads (status, created_at desc);

alter table public.organization_leads enable row level security;

create policy "Admins can read organization leads"
  on public.organization_leads for select
  using (public.is_admin());

create policy "Admins can update organization leads"
  on public.organization_leads for update
  using (public.is_admin())
  with check (public.is_admin());

-- Sem policy de insert: o formulário público grava pelo service-role
-- client em app/api/contact/organization/route.ts, atrás de rate limit
-- e honeypot.
