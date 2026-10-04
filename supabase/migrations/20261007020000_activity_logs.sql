-- Trilha de atividade dos usuários, alimentada por triggers no banco.
-- Por que trigger e não código na aplicação: as escritas passam por rotas com
-- service role, server actions e client direto; só o banco enxerga todas.
-- Sem FK de propósito: o log precisa sobreviver (e nunca bloquear) a exclusão
-- de contas pela retenção LGPD.
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  subject_user_id uuid,
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  record_id text,
  changes jsonb not null default '{}'::jsonb,
  search_text text not null default ''
);

alter table public.activity_logs enable row level security;

-- Só admin lê; ninguém escreve direto (o trigger é security definer).
create policy "Admins read activity logs"
  on public.activity_logs for select to authenticated
  using (public.is_admin());

revoke all on public.activity_logs from anon, authenticated;
grant select on public.activity_logs to authenticated;

create index if not exists idx_activity_logs_created on public.activity_logs (created_at desc);
create index if not exists idx_activity_logs_subject on public.activity_logs (subject_user_id, created_at desc);
create index if not exists idx_activity_logs_table on public.activity_logs (table_name, created_at desc);

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_old jsonb;
  v_changes jsonb := '{}'::jsonb;
  v_key text;
  v_val jsonb;
  v_subject uuid;
  v_ignored text[] := array['search_vector', 'updated_at', 'action_token', 'token_expires_at'];
  v_role text;
begin
  v_row := to_jsonb(coalesce(new, old));

  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    for v_key, v_val in select * from jsonb_each(v_row) loop
      continue when v_key = any(v_ignored);
      if v_val is distinct from v_old -> v_key then
        v_changes := v_changes || jsonb_build_object(
          v_key,
          jsonb_build_object(
            'old', case when jsonb_typeof(v_old -> v_key) = 'string' then to_jsonb(left(v_old ->> v_key, 300)) else v_old -> v_key end,
            'new', case when jsonb_typeof(v_val) = 'string' then to_jsonb(left(v_val #>> '{}', 300)) else v_val end
          )
        );
      end if;
    end loop;
    -- UPDATE que só mexeu em colunas ignoradas não vira ruído.
    if v_changes = '{}'::jsonb then
      return new;
    end if;
  elsif tg_table_name not in ('profiles', 'mentor_profiles', 'mentee_profiles') then
    -- Perfis inteiros (telefone, bio...) não são copiados no create/delete.
    for v_key, v_val in select * from jsonb_each(v_row) loop
      continue when v_key = any(v_ignored);
      v_changes := v_changes || jsonb_build_object(
        v_key,
        case when jsonb_typeof(v_val) = 'string' then to_jsonb(left(v_val #>> '{}', 300)) else v_val end
      );
    end loop;
  end if;

  if tg_table_name = 'user_roles' then
    select name into v_role from public.roles where id = (v_row ->> 'role_id')::int;
    v_changes := v_changes || jsonb_build_object('role', v_role);
  end if;

  v_subject := case tg_table_name
    when 'profiles' then (v_row ->> 'id')::uuid
    when 'appointments' then (v_row ->> 'mentee_id')::uuid
    when 'mentor_availability' then (v_row ->> 'mentor_id')::uuid
    else (v_row ->> 'user_id')::uuid
  end;

  insert into public.activity_logs (actor_id, subject_user_id, table_name, operation, record_id, changes, search_text)
  values (
    auth.uid(),
    v_subject,
    tg_table_name,
    tg_op,
    v_row ->> 'id',
    v_changes,
    lower(tg_table_name || ' ' || tg_op || ' ' || v_changes::text || ' ' || coalesce(v_row ->> 'mentor_id', ''))
  );

  return coalesce(new, old);
exception when others then
  -- Auditoria nunca pode derrubar a escrita do usuário.
  return coalesce(new, old);
end;
$$;

revoke all on function public.log_activity() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'mentor_profiles', 'mentee_profiles', 'mentor_availability', 'user_roles', 'appointments'] loop
    execute format('drop trigger if exists trg_log_activity on public.%I', t);
    execute format(
      'create trigger trg_log_activity after insert or update or delete on public.%I for each row execute function public.log_activity()', t);
  end loop;
end $$;
