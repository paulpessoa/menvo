-- Camada 12 · Contrato appointment_feedbacks: private_notes so dono/avaliado/admin
-- Estado atual: policy "Users can view feedbacks" com using(true) vaza private_notes
-- para qualquer authenticated. Este teste documenta o comportamento DESEJADO
-- (falha ate a migration corrigir) e garante que rating/public_feedback publicos
-- seguem legiveis.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0021', 't3_reviewer@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0022', 't3_reviewed@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0023', 't3_stranger@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0029', 't3_admin2@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, first_name, is_public) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0021', 't3_reviewer@test.menvo', 'Rev', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0022', 't3_reviewed@test.menvo', 'Rev2', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0023', 't3_stranger@test.menvo', 'Str', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0029', 't3_admin2@test.menvo', 'Adm', true)
on conflict (id) do update set first_name = excluded.first_name;

insert into public.user_roles (user_id, role_id) select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0029', id from public.roles where name='admin' on conflict do nothing;

insert into public.appointments (id, mentor_id, mentee_id, scheduled_at, duration_minutes, status) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0022', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0021', now()-interval '1 day', 45, 'completed')
on conflict (id) do nothing;

insert into public.appointment_feedbacks (id, appointment_id, reviewer_id, reviewed_id, rating, public_feedback, private_notes, admin_notes, status) values
  ('cccccccc-cccc-cccc-cccc-cccccccc0021', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0022', 5, 'Publico', 'Privado do reviewer', 'Nota admin', 'approved')
on conflict (id) do update set private_notes = excluded.private_notes, admin_notes = excluded.admin_notes, rating = excluded.rating;

-- Stranger (authenticated aleatorio) NAO deve ler private_notes
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0023';

-- DESEJADO: stranger ve a linha mas private_notes nulo (ou 0 linhas se filtrado por view).
-- Hoje com using(true) ele ve tudo -> este teste FALHA ate a migration.
-- Escrevemos a assercao do DESEJADO e marcamos como todo() se quiser passar no CI antes da migracao.
-- Aqui deixamos falhando de proposito para travar o PR ate corrigir.
select is(
  (select private_notes from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  null,
  'estranho nao le private_notes (DESEJADO: null, ATUAL: vaza)'
);

select is(
  (select admin_notes from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  null,
  'estranho nao le admin_notes'
);

-- mas rating/public_feedback aprovados seguem legiveis
select is(
  (select rating from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  5,
  'estranho le rating publico'
);

reset role;

-- Reviewer le proprio private_notes
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0021';
select is(
  (select private_notes from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  'Privado do reviewer',
  'reviewer le proprio private_notes'
);
reset role;

-- Reviewed le (ou ao menos nao e null) - definicao: avaliado pode ver?
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0022';
select is(
  (select private_notes from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  'Privado do reviewer',
  'reviewed le private_notes (participante)'
);
reset role;

-- Admin le tudo
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0029';
select is(
  (select private_notes from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  'Privado do reviewer',
  'admin le private_notes'
);
select is(
  (select admin_notes from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  'Nota admin',
  'admin le admin_notes'
);
reset role;

-- Anon nao le nada (RLS sem policy anon)
set local role anon;
select is(
  (select count(*)::int from public.appointment_feedbacks where id = 'cccccccc-cccc-cccc-cccc-cccccccc0021'),
  0,
  'anon nao le feedback'
);
reset role;

select * from finish();
rollback;
