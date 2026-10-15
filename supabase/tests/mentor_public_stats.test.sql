-- Camada 12 · Contrato mentor_public_stats (security definer, so agregados)
-- Prova: anon ve totais de mentor publico+aprovado, nao ve de privado/pendente,
-- funcao nunca retorna linhas individuais.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', 't2_m1@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', 't2_m2@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', 't2_mentee@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, first_name, is_public) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', 't2_m1@test.menvo', 'MentorPub', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', 't2_m2@test.menvo', 'MentorPriv', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', 't2_mentee@test.menvo', 'Ment', true)
on conflict (id) do update set is_public = excluded.is_public;

insert into public.mentor_profiles (user_id, verification_status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', 'approved'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', 'approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

-- sessoes e feedbacks so para m1
insert into public.appointments (id, mentor_id, mentee_id, scheduled_at, duration_minutes, status) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', now() - interval '2 days', 45, 'completed'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', now() - interval '2 days', 45, 'completed')
on conflict (id) do nothing;

insert into public.appointment_feedbacks (id, appointment_id, reviewer_id, reviewed_id, rating, public_feedback, status) values
  ('cccccccc-cccc-cccc-cccc-cccccccc0011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011', 5, 'Otimo', 'approved'),
  ('cccccccc-cccc-cccc-cccc-cccccccc0012', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012', 5, 'Bom', 'approved')
on conflict (id) do nothing;

set local role anon;

select is(
  (select total_sessions from public.mentor_public_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011')),
  1,
  'anon ve total_sessions de mentor publico aprovado'
);

select ok(
  (select average_rating from public.mentor_public_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011')) = 5,
  'anon ve average_rating correto'
);

select is(
  (select count(*)::int from public.mentor_public_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0012')),
  0,
  'anon nao ve stats de mentor privado (mentor_is_publicly_listed = false)'
);

-- m2 tem sessao mas nao deve aparecer
select is(
  (select count(*)::int from public.mentor_public_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013')),
  0,
  'nao-mentor nao tem stats'
);

reset role;

-- authenticated tambem so ve agregados, nunca linhas brutas
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0013';

select is(
  (select total_reviews from public.mentor_public_stats('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011')),
  1,
  'authenticated ve total_reviews de mentor publico'
);

select is(
  (select count(*)::int from public.appointment_feedbacks where reviewed_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0011'),
  1,
  'feedback bruto continua legivel via RLS de participante (nao pela funcao)'
);

reset role;
select * from finish();
rollback;
