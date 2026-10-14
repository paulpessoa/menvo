-- C-M3: "Me avise quando abrir horário" quando o mentor não tem disponibilidade.
-- Grava o interesse do mentorado e envia e-mail quando o mentor salvar novos horários.

create table if not exists public.mentor_availability_alerts (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  mentee_id uuid references public.profiles(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

-- Evita alertas duplicados pendentes para o mesmo mentor e e-mail
create unique index if not exists mentor_availability_alerts_unique_pending_idx
  on public.mentor_availability_alerts (mentor_id, lower(email))
  where notified_at is null;

create index if not exists mentor_availability_alerts_mentor_pending_idx
  on public.mentor_availability_alerts (mentor_id)
  where notified_at is null;

alter table public.mentor_availability_alerts enable row level security;

-- Leitura:
-- 1. Mentorado pode ver seus próprios alertas
-- 2. Mentor pode ver alertas cadastrados para ele
-- 3. Admin pode ver tudo
create policy "Users can read own availability alerts"
  on public.mentor_availability_alerts for select
  using (
    (auth.uid() is not null and mentee_id = auth.uid()) or
    (auth.uid() is not null and mentor_id = auth.uid()) or
    public.is_admin()
  );

-- Inserção: mentorado logado ou anônimo com e-mail
create policy "Anyone can insert availability alerts"
  on public.mentor_availability_alerts for insert
  with check (
    (auth.uid() is null and mentee_id is null) or
    (auth.uid() is not null and (mentee_id = auth.uid() or mentee_id is null))
  );

-- Atualização: o mentor pode marcar notified_at nos seus alertas; admin pode gerenciar
create policy "Mentors can update own alerts"
  on public.mentor_availability_alerts for update
  using (
    (auth.uid() is not null and mentor_id = auth.uid()) or
    public.is_admin()
  )
  with check (
    (auth.uid() is not null and mentor_id = auth.uid()) or
    public.is_admin()
  );

-- Remoção: usuário pode cancelar seu próprio alerta; admin pode gerenciar
create policy "Users can delete own availability alerts"
  on public.mentor_availability_alerts for delete
  using (
    (auth.uid() is not null and mentee_id = auth.uid()) or
    public.is_admin()
  );
