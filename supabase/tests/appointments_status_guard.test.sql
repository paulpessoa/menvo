-- Camada 12 · Contrato do trigger appointments_guard_update
-- Prova: transições impossíveis são recusadas para todos; em update direto do
-- cliente só o mentor confirma e desfaz uma concluída, e ninguém troca os
-- participantes; service_role passa só pela tabela de pares.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0051', 't5_mentor@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0052', 't5_mentee@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0053', 't5_other@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, first_name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0051', 't5_mentor@test.menvo', 'Mentor'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0052', 't5_mentee@test.menvo', 'Mentee'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0053', 't5_other@test.menvo', 'Outro')
on conflict (id) do nothing;

insert into public.appointments (id, mentor_id, mentee_id, scheduled_at, duration_minutes, status) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb051', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0051', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0052', now() + interval '2 days', 45, 'pending'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb052', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0051', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0052', now() - interval '2 days', 45, 'completed'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb053', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0051', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0052', now() - interval '3 days', 45, 'cancelled')
on conflict (id) do nothing;

-- Mentorado logado
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0052';

select throws_like(
  $$update public.appointments set status = 'confirmed' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb051'$$,
  '%appointment_transition_forbidden%',
  'mentorado nao confirma o proprio pedido'
);

select throws_like(
  $$update public.appointments set mentor_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0053' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb051'$$,
  '%appointment_immutable_column%',
  'mentorado nao troca o mentor da sessao'
);

select throws_like(
  $$update public.appointments set status = 'cancelled' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb052'$$,
  '%appointment_transition_forbidden%',
  'mentorado nao desfaz uma sessao concluida'
);

select lives_ok(
  $$update public.appointments set notes_mentee = 'Levo minhas duvidas' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb051'$$,
  'mentorado ainda edita campos que nao sao status nem participantes'
);

reset role;

-- Mentor logado
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0051';

select lives_ok(
  $$update public.appointments set status = 'confirmed' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb051'$$,
  'mentor confirma o pedido'
);

select throws_like(
  $$update public.appointments set status = 'confirmed' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb053'$$,
  '%appointment_invalid_transition: cancelled -> confirmed%',
  'sessao cancelada nao volta'
);

select throws_like(
  $$update public.appointments set status = 'pending' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb051'$$,
  '%appointment_invalid_transition: confirmed -> pending%',
  'confirmada nao volta para pendente'
);

reset role;

-- Rotas com service_role: so a tabela de pares vale
set local role service_role;

select lives_ok(
  $$update public.appointments set status = 'cancelled' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb052'$$,
  'service_role registra no-show (completed -> cancelled)'
);

select throws_like(
  $$update public.appointments set status = 'completed' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb053'$$,
  '%appointment_invalid_transition%',
  'service_role tambem nao reabre sessao cancelada'
);

reset role;
select * from finish();
rollback;
