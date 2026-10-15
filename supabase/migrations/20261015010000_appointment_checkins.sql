-- Check-in pós-sessão: "a mentoria aconteceu?" (docs/domains/session-checkin.md)
--
-- Por quê: uma sessão `confirmed` ficava `confirmed` para sempre, porque ninguém
-- entrava para clicar em "concluir". Sem saber se a sessão aconteceu, não dá
-- para medir feedback, avanço do mentorado, horas voluntárias nem impacto.
--
-- Como: o cron cria uma linha por participante (mentor e mentorado) com um
-- token aleatório; só o hash do token fica no banco. A resposta chega por
-- funções security definer, que validam o token ou o auth.uid() e aplicam a
-- regra da §3.4 do doc na mesma transação. Nenhuma rota precisa de
-- service_role para responder; o cron continua usando a dele para enviar.

-- 1. Tabela ------------------------------------------------------------------
create table if not exists public.appointment_checkins (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('mentor', 'mentee')),
  -- sha256 (hex) do token enviado por e-mail. Nulo quando a resposta veio de
  -- dentro da plataforma (logado), sem e-mail.
  token_hash text unique,
  expires_at timestamptz,
  sent_at timestamptz,
  reminded_at timestamptz,
  outcome text check (outcome in ('happened', 'not_happened', 'rescheduled')),
  answered_at timestamptz,
  next_step text check (char_length(next_step) <= 500),
  details_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (appointment_id, role),
  check ((outcome is null) = (answered_at is null)),
  check ((token_hash is null) = (expires_at is null))
);

create index if not exists appointment_checkins_participant_idx
  on public.appointment_checkins (participant_id);

alter table public.appointments
  add column if not exists checkin_conflict boolean not null default false;

-- 2. RLS ---------------------------------------------------------------------
-- Participante lê a própria linha (o bloqueio de agendamento usa isso); admin
-- lê tudo. Nenhuma escrita direta: só pelas funções abaixo ou pelo cron.
alter table public.appointment_checkins enable row level security;

create policy "appointment_checkins_participant_read"
  on public.appointment_checkins for select
  to authenticated
  using (participant_id = auth.uid() or public.is_admin());

-- 3. Regra de resolução (§3.4) -----------------------------------------------
-- Interna: não é exposta a anon/authenticated. Só mexe em sessões ainda
-- `confirmed`; uma resposta posterior nunca desfaz um status já resolvido,
-- só marca conflito para o admin.
create or replace function public.resolve_appointment_checkin(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_mentor text;
  v_mentee text;
  v_any_happened boolean;
  v_any_not boolean;
begin
  select status into v_status from appointments where id = p_appointment_id for update;
  if v_status is null then
    return;
  end if;

  select
    max(outcome) filter (where role = 'mentor'),
    max(outcome) filter (where role = 'mentee')
  into v_mentor, v_mentee
  from appointment_checkins
  where appointment_id = p_appointment_id;

  v_any_happened := 'happened' in (coalesce(v_mentor, ''), coalesce(v_mentee, ''));
  v_any_not := coalesce(v_mentor, '') in ('not_happened', 'rescheduled')
            or coalesce(v_mentee, '') in ('not_happened', 'rescheduled');

  if v_any_happened and v_any_not then
    update appointments set checkin_conflict = true, updated_at = now()
    where id = p_appointment_id;
    return;
  end if;

  if v_status <> 'confirmed' then
    return;
  end if;

  if 'rescheduled' in (coalesce(v_mentor, ''), coalesce(v_mentee, '')) then
    update appointments
    set status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = null,
        cancellation_reason = 'Remarcada (check-in pós-sessão).',
        updated_at = now()
    where id = p_appointment_id;
  elsif v_any_happened then
    update appointments
    set status = 'completed', completed_at = now(), updated_at = now()
    where id = p_appointment_id;
  elsif v_any_not then
    update appointments
    set status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = null,
        cancellation_reason = 'Não aconteceu (check-in pós-sessão).',
        updated_at = now()
    where id = p_appointment_id;
  end if;
end;
$$;

revoke all on function public.resolve_appointment_checkin(uuid) from public, anon, authenticated;

-- 4. Leitura e resposta por token (sem login) --------------------------------
-- O hash é calculado aqui, então o token em claro nunca é comparado em SQL
-- montado pelo cliente. Token inexistente, adulterado e expirado devolvem o
-- mesmo erro, para não confirmar a terceiros que uma sessão existe.
create or replace function public.checkin_row_for_token(p_token text)
returns public.appointment_checkins
language sql
stable
security definer
set search_path = public, extensions
as $$
  select c.*
  from appointment_checkins c
  where c.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and c.expires_at > now()
$$;

revoke all on function public.checkin_row_for_token(text) from public, anon, authenticated;

create or replace function public.checkin_summary(p_checkin public.appointment_checkins)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'appointment_id', a.id,
    'role', p_checkin.role,
    'outcome', p_checkin.outcome,
    'scheduled_at', a.scheduled_at,
    'other_first_name', split_part(coalesce(other.full_name, ''), ' ', 1),
    'mentor_slug', mentor.slug,
    'can_add_details',
      p_checkin.outcome = 'happened' and p_checkin.details_submitted_at is null
  )
  from appointments a
  join profiles mentor on mentor.id = a.mentor_id
  join profiles other on other.id = case when p_checkin.role = 'mentor' then a.mentee_id else a.mentor_id end
  where a.id = p_checkin.appointment_id
$$;

revoke all on function public.checkin_summary(public.appointment_checkins) from public, anon, authenticated;

/** Leitura sem efeito colateral: a página abre com isto (scanners de e-mail abrem links). */
create or replace function public.get_session_checkin(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row appointment_checkins;
begin
  v_row := checkin_row_for_token(p_token);
  if v_row.id is null then
    return jsonb_build_object('error', 'invalid_token');
  end if;
  return checkin_summary(v_row);
end;
$$;

create or replace function public.answer_session_checkin(p_token text, p_outcome text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointment_checkins;
begin
  if p_outcome not in ('happened', 'not_happened', 'rescheduled') then
    return jsonb_build_object('error', 'invalid_outcome');
  end if;

  v_row := checkin_row_for_token(p_token);
  if v_row.id is null then
    return jsonb_build_object('error', 'invalid_token');
  end if;

  -- A primeira resposta vale; repetir o clique só devolve o estado atual.
  if v_row.outcome is null then
    update appointment_checkins
    set outcome = p_outcome, answered_at = now()
    where id = v_row.id
    returning * into v_row;

    perform resolve_appointment_checkin(v_row.appointment_id);
  end if;

  return checkin_summary(v_row);
end;
$$;

/**
 * Detalhes opcionais depois do "aconteceu": o mentorado dá nota, comentário
 * público (vai para moderação) e o próximo passo; o mentor deixa uma nota
 * privada em appointments.notes_mentor. Uma vez por token.
 */
create or replace function public.submit_session_checkin_details(
  p_token text,
  p_rating int,
  p_public_feedback text,
  p_private_note text,
  p_next_step text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row appointment_checkins;
  v_appt appointments;
begin
  v_row := checkin_row_for_token(p_token);
  if v_row.id is null then
    return jsonb_build_object('error', 'invalid_token');
  end if;
  if v_row.outcome is distinct from 'happened' or v_row.details_submitted_at is not null then
    return jsonb_build_object('error', 'not_allowed');
  end if;

  select * into v_appt from appointments where id = v_row.appointment_id;

  if v_row.role = 'mentee' then
    if p_rating is null or p_rating not between 1 and 5 then
      return jsonb_build_object('error', 'invalid_rating');
    end if;
    if not exists (
      select 1 from appointment_feedbacks
      where appointment_id = v_appt.id and reviewer_id = v_row.participant_id
    ) then
      insert into appointment_feedbacks
        (appointment_id, reviewer_id, reviewed_id, rating, public_feedback, private_notes, status)
      values
        (v_appt.id, v_row.participant_id, v_appt.mentor_id, p_rating,
         nullif(left(trim(p_public_feedback), 1000), ''),
         nullif(left(trim(p_private_note), 1000), ''),
         'pending');
    end if;
    update appointment_checkins
    set next_step = nullif(left(trim(p_next_step), 500), ''), details_submitted_at = now()
    where id = v_row.id;
  else
    if nullif(trim(p_private_note), '') is not null then
      update appointments
      set notes_mentor = left(trim(p_private_note), 1000), updated_at = now()
      where id = v_appt.id;
    end if;
    update appointment_checkins set details_submitted_at = now() where id = v_row.id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- 5. Resposta de dentro da plataforma (logado) -------------------------------
-- Usada pelo bloqueio de agendamento: o mentorado responde "aconteceu?" no
-- próprio modal, mesmo que o e-mail do cron ainda não tenha saído.
create or replace function public.answer_my_session_checkin(p_appointment_id uuid, p_outcome text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_appt appointments;
  v_role text;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'unauthenticated');
  end if;
  if p_outcome not in ('happened', 'not_happened', 'rescheduled') then
    return jsonb_build_object('error', 'invalid_outcome');
  end if;

  select * into v_appt from appointments where id = p_appointment_id;
  if v_appt.id is null or v_uid not in (v_appt.mentor_id, v_appt.mentee_id) then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_appt.scheduled_at > now() then
    return jsonb_build_object('error', 'not_yet');
  end if;

  v_role := case when v_uid = v_appt.mentor_id then 'mentor' else 'mentee' end;

  insert into appointment_checkins (appointment_id, participant_id, role, outcome, answered_at)
  values (v_appt.id, v_uid, v_role, p_outcome, now())
  on conflict (appointment_id, role) do update
    set outcome = excluded.outcome, answered_at = excluded.answered_at
    where appointment_checkins.outcome is null;

  perform resolve_appointment_checkin(v_appt.id);

  return jsonb_build_object('ok', true);
end;
$$;

-- 6. Permissões --------------------------------------------------------------
revoke all on function public.get_session_checkin(text) from public;
revoke all on function public.answer_session_checkin(text, text) from public;
revoke all on function public.submit_session_checkin_details(text, int, text, text, text) from public;
revoke all on function public.answer_my_session_checkin(uuid, text) from public, anon;

grant execute on function public.get_session_checkin(text) to anon, authenticated;
grant execute on function public.answer_session_checkin(text, text) to anon, authenticated;
grant execute on function public.submit_session_checkin_details(text, int, text, text, text) to anon, authenticated;
grant execute on function public.answer_my_session_checkin(uuid, text) to authenticated;
