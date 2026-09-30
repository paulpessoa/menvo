-- Registro do aceite dos Termos de Uso (docs/COMMUNITY_CONTACT_PLAN.md §7.2).
-- Os Termos dizem que "o aceite no cadastro vale como termo de adesão à
-- atividade voluntária" (Lei 9.608/1998, art. 2º); sem registro, não há como
-- provar quem aceitou qual versão e quando.
--
-- Uma linha por (pessoa, versão), só inserção: nunca se edita um aceite.
-- A versão corrente fica no código (lib/legal/terms.ts); quando ela muda,
-- a pessoa aceita de novo e ganha outra linha.
create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check (char_length(terms_version) between 1 and 40),
  accepted_at timestamptz not null default now(),
  user_agent text check (user_agent is null or char_length(user_agent) <= 400),
  unique (user_id, terms_version)
);

alter table public.terms_acceptances enable row level security;

create policy "Users read own terms acceptances"
  on public.terms_acceptances for select
  using (user_id = auth.uid());

create policy "Users record own terms acceptance"
  on public.terms_acceptances for insert
  with check (user_id = auth.uid());

create policy "Admins read terms acceptances"
  on public.terms_acceptances for select
  using (public.is_admin());

-- accepted_at vem sempre do banco: o cliente só pode enviar estas colunas.
revoke insert on public.terms_acceptances from anon, authenticated;
grant insert (user_id, terms_version, user_agent) on public.terms_acceptances to authenticated;
-- Sem update/delete para ninguém além do service role.
revoke update, delete on public.terms_acceptances from anon, authenticated;
