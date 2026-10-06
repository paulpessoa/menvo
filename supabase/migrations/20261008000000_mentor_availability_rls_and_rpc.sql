-- mentor_availability: versiona a tabela, fixa o RLS e salva a agenda numa transação.
--
-- Por quê (docs/blueprint/mentors-audit.md, achados 1 a 3):
-- 1. A tabela foi criada fora das migrations. Ninguém sabia, pelo repositório,
--    quais políticas RLS valiam, e por isso as rotas usavam service_role
--    ("leitura pública irrestrita") em vez de confiar no RLS.
-- 2. GET /api/mentors/availability?mentor_id=X devolvia a agenda de qualquer
--    usuário, mesmo de mentor não aprovado ou não público.
-- 3. Salvar a agenda era "apaga tudo, depois insere": se o insert falhasse, o
--    mentor ficava sem horários.
--
-- Depois desta migration: leitura pública só de mentor aprovado e público
-- (o mesmo filtro do perfil público), o dono lê e escreve a própria agenda, e
-- a escrita passa por set_mentor_availability (uma transação, security invoker,
-- sujeita ao RLS). Nenhuma rota precisa mais de service_role para isso.

-- 1. Tabela ------------------------------------------------------------------
-- No banco de produção ela já existe: o "if not exists" só documenta o formato
-- (espelha lib/types/supabase.ts) e cria a tabela num banco novo/local.
create table if not exists public.mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mentor_availability_mentor_id_idx
  on public.mentor_availability (mentor_id);

alter table public.mentor_availability enable row level security;

-- 2. Políticas ---------------------------------------------------------------
-- As políticas atuais foram criadas à mão e não estão versionadas. Políticas
-- permissivas se somam (OR), então uma antiga mais aberta anularia as novas.
-- Por isso apagamos todas antes de criar as definitivas.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'mentor_availability'
  loop
    execute format('drop policy %I on public.mentor_availability', pol.policyname);
  end loop;
end $$;

-- Mesmo filtro do perfil público (mentors_view: verified + is_public). Fica numa
-- função security definer, como profile_is_mentor: assim a política não depende
-- do RLS e dos grants de coluna de profiles/mentor_profiles para anon, e o
-- Postgres não avalia políticas aninhadas a cada linha.
create or replace function public.mentor_is_publicly_listed(p_mentor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mentor_profiles mp
    join public.profiles p on p.id = mp.user_id
    where mp.user_id = p_mentor_id
      and mp.verification_status = 'approved'
      and coalesce(p.is_public, false)
  );
$$;

revoke all on function public.mentor_is_publicly_listed(uuid) from public;
grant execute on function public.mentor_is_publicly_listed(uuid) to anon, authenticated;

create policy "Public reads availability of approved public mentors"
  on public.mentor_availability
  for select
  to anon, authenticated
  using (public.mentor_is_publicly_listed(mentor_id));

create policy "Mentor reads own availability"
  on public.mentor_availability
  for select
  to authenticated
  using (mentor_id = auth.uid());

create policy "Mentor manages own availability"
  on public.mentor_availability
  for all
  to authenticated
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

-- 3. Escrita atômica ----------------------------------------------------------
-- security invoker: roda com a permissão de quem chama, então o RLS acima vale
-- dentro da função. O mentor_id vem sempre de auth.uid(), nunca do cliente.
create or replace function public.set_mentor_availability(
  p_slots jsonb,
  p_timezone text default null
)
returns setof public.mentor_availability
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_mentor uuid := auth.uid();
begin
  if v_mentor is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if jsonb_typeof(coalesce(p_slots, '[]'::jsonb)) <> 'array' then
    raise exception 'p_slots must be a json array' using errcode = '22023';
  end if;

  delete from public.mentor_availability where mentor_id = v_mentor;

  return query
    insert into public.mentor_availability (mentor_id, day_of_week, start_time, end_time, timezone)
    select
      v_mentor,
      s.day_of_week,
      s.start_time,
      s.end_time,
      coalesce(s.timezone, p_timezone, 'America/Sao_Paulo')
    from jsonb_to_recordset(coalesce(p_slots, '[]'::jsonb))
      as s(day_of_week integer, start_time time, end_time time, timezone text)
    returning *;

  if p_timezone is not null then
    update public.profiles
       set timezone = p_timezone, updated_at = now()
     where id = v_mentor;
  end if;
end;
$$;

revoke all on function public.set_mentor_availability(jsonb, text) from public, anon;
grant execute on function public.set_mentor_availability(jsonb, text) to authenticated;

comment on function public.set_mentor_availability(jsonb, text) is
  'Substitui a agenda semanal do mentor autenticado numa transação. Security invoker: sujeito ao RLS de mentor_availability.';
