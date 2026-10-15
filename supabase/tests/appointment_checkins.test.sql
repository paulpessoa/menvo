-- Camada 12 · Teste de RLS e funções (appointment_checkins)
-- Regra: prova a migration 20261015010000 no banco de verdade - a tabela de
-- resolução da §3.4 de docs/domains/session-checkin.md, tokens, permissões
-- por papel e o RLS. Roda com `supabase test db`. Tudo numa transação desfeita.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(16);

-- Fixtures: mentor M, mentorado E, estranho X; cinco sessões confirmadas no passado.
insert into auth.users (id, email) values
  ('11111111-0000-0000-0000-000000000001', 'm@test.menvo'),
  ('22222222-0000-0000-0000-000000000002', 'e@test.menvo'),
  ('33333333-0000-0000-0000-000000000003', 'x@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, first_name, last_name, slug) values
  ('11111111-0000-0000-0000-000000000001', 'm@test.menvo', 'Marta', 'Mentora', 'marta-test-checkin'),
  ('22222222-0000-0000-0000-000000000002', 'e@test.menvo', 'Edu', 'Mentorado', null),
  ('33333333-0000-0000-0000-000000000003', 'x@test.menvo', 'Xis', null, null)
on conflict (id) do update set first_name = excluded.first_name, last_name = excluded.last_name, slug = excluded.slug;

insert into public.appointments (id, mentor_id, mentee_id, scheduled_at, duration_minutes, status)
select ('aaaaaaaa-0000-0000-0000-00000000000' || n)::uuid,
       '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002',
       now() - interval '1 day', 45, 'confirmed'
from generate_series(1, 5) n;

-- Tokens "tok-<sessão>-<papel>"; a sessão 5 tem token vencido.
insert into public.appointment_checkins (appointment_id, participant_id, role, token_hash, expires_at, sent_at)
select ('aaaaaaaa-0000-0000-0000-00000000000' || n)::uuid,
       case r when 'mentor' then '11111111-0000-0000-0000-000000000001'::uuid
              else '22222222-0000-0000-0000-000000000002'::uuid end,
       r,
       encode(digest('tok-' || n || '-' || r, 'sha256'), 'hex'),
       case when n = 5 then now() - interval '1 minute' else now() + interval '14 days' end,
       now()
from generate_series(1, 5) n, unnest(array['mentor', 'mentee']) r;

-- Anônimo --------------------------------------------------------------------
set local role anon;

select is(
  public.get_session_checkin('nao-existe')->>'error', 'invalid_token',
  'token inexistente devolve invalid_token'
);

select is(
  public.get_session_checkin('tok-5-mentee')->>'error', 'invalid_token',
  'token vencido devolve o mesmo erro do inexistente'
);

select is(
  public.get_session_checkin('tok-1-mentee')->>'other_first_name', 'Marta',
  'leitura devolve só o primeiro nome do outro lado'
);

select is(
  (select count(*)::int from public.appointment_checkins), 0,
  'anônimo não lê nenhuma linha da tabela'
);

-- Sessão 1: mentorado diz que aconteceu -> completed.
select is(
  public.answer_session_checkin('tok-1-mentee', 'happened')->>'can_add_details', 'true',
  'mentorado que respondeu "aconteceu" pode avaliar'
);

reset role;
select is(
  (select status from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'completed', 'um "aconteceu" conclui a sessão'
);

-- Mentor discorda depois -> conflito, status não volta.
set local role anon;
select public.answer_session_checkin('tok-1-mentor', 'not_happened');
reset role;
select is(
  (select status || ':' || checkin_conflict from public.appointments
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'completed:true', 'resposta contrária marca conflito e não desfaz o status'
);

-- Sessão 2: mentor diz que remarcaram -> cancelled (remarcada).
set local role anon;
select public.answer_session_checkin('tok-2-mentor', 'rescheduled');
reset role;
select is(
  (select status || ':' || cancellation_reason from public.appointments
    where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  'cancelled:Remarcada (check-in pós-sessão).', '"remarcamos" cancela como remarcada'
);

-- Sessão 3: mentorado diz que não rolou -> cancelled (não aconteceu).
set local role anon;
select public.answer_session_checkin('tok-3-mentee', 'not_happened');
-- Segundo clique com outra opção não muda a primeira resposta.
select is(
  public.answer_session_checkin('tok-3-mentee', 'happened')->>'outcome', 'not_happened',
  'a primeira resposta vale'
);
reset role;
select is(
  (select status from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000000003'),
  'cancelled', '"não rolou" sem resposta do outro lado cancela'
);

-- Detalhes do mentorado na sessão 1.
set local role anon;
select is(
  public.submit_session_checkin_details('tok-1-mentee', 5, 'Ótima conversa', null, 'Atualizar o LinkedIn')->>'ok',
  'true', 'mentorado envia nota e próximo passo'
);
select is(
  public.submit_session_checkin_details('tok-1-mentee', 4, null, null, null)->>'error',
  'not_allowed', 'detalhes só uma vez por token'
);
select is(
  public.submit_session_checkin_details('tok-3-mentee', 5, null, null, null)->>'error',
  'not_allowed', 'sem "aconteceu" não há avaliação'
);
reset role;
select is(
  (select rating || ':' || status from public.appointment_feedbacks
    where appointment_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  '5:pending', 'avaliação entra pendente de moderação'
);

-- Logado: estranho não responde; mentorado responde a sessão 4 pelo app.
set local role authenticated;
set local request.jwt.claim.sub = '33333333-0000-0000-0000-000000000003';
select is(
  public.answer_my_session_checkin('aaaaaaaa-0000-0000-0000-000000000004', 'happened')->>'error',
  'not_found', 'quem não participou não responde'
);

set local request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
select public.answer_my_session_checkin('aaaaaaaa-0000-0000-0000-000000000004', 'happened');
select is(
  (select count(*)::int from public.appointment_checkins
    where participant_id <> '22222222-0000-0000-0000-000000000002'),
  0, 'participante só lê as próprias linhas'
);
reset role;

select * from finish();
rollback;
