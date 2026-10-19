-- Camada 12 · Contrato mentors_view x mentor_public_stats
-- Prova: visitante vê no catálogo as sessões e avaliações reais de mentor
-- público e aprovado (antes via 0 por causa do mentor_stats security_invoker),
-- e mentor fora do catálogo continua com os números de antes para si mesmo.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041', 't4_pub@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0042', 't4_priv@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0043', 't4_mentee@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, first_name, is_public) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041', 't4_pub@test.menvo', 'MentorPub', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0042', 't4_priv@test.menvo', 'MentorPriv', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0043', 't4_mentee@test.menvo', 'Ment', true)
on conflict (id) do update set is_public = excluded.is_public;

insert into public.user_roles (user_id, role_id)
  select u.id, r.id
    from (values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041'::uuid),
                 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0042'::uuid)) u(id)
    cross join public.roles r
   where r.name = 'mentor'
on conflict do nothing;

insert into public.mentor_profiles (user_id, verification_status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041', 'approved'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0042', 'approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

insert into public.appointments (id, mentor_id, mentee_id, scheduled_at, duration_minutes, status) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb041', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0043', now() - interval '3 days', 45, 'completed'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb042', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0043', now() - interval '2 days', 45, 'completed'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb043', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0042', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0043', now() - interval '2 days', 45, 'completed')
on conflict (id) do nothing;

insert into public.appointment_feedbacks (id, appointment_id, reviewer_id, reviewed_id, rating, public_feedback, status) values
  ('cccccccc-cccc-cccc-cccc-cccccccc0041', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb041', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0043', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041', 4, 'Bom', 'approved'),
  ('cccccccc-cccc-cccc-cccc-cccccccc0042', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb042', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0043', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041', 5, 'Otimo', 'approved')
on conflict (id) do nothing;

set local role anon;

select is(
  (select total_sessions from public.mentors_view where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041'),
  2,
  'anon ve total_sessions real de mentor publico no catalogo'
);

select is(
  (select total_reviews from public.mentors_view where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041'),
  2,
  'anon ve total_reviews real de mentor publico'
);

select ok(
  (select average_rating from public.mentors_view where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0041') = 4.5,
  'anon ve average_rating real de mentor publico'
);

reset role;

-- Mentor fora do catalogo: a funcao nao devolve linha e a view cai no
-- mentor_stats (RLS de participante), entao o proprio mentor ve suas sessoes.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0042';

select is(
  (select total_sessions from public.mentors_view where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0042'),
  1,
  'mentor privado ve as proprias sessoes (fallback para mentor_stats)'
);

reset role;

-- Contrato de colunas: o app le exatamente estes nomes e tipos.
select results_eq(
  $$select column_name::text, data_type::text from information_schema.columns
     where table_schema = 'public' and table_name = 'mentors_view'
       and column_name in ('average_rating', 'total_sessions', 'total_reviews')
     order by column_name$$,
  $$values ('average_rating', 'numeric'), ('total_reviews', 'integer'), ('total_sessions', 'integer')$$,
  'colunas de estatistica mantem nome e tipo'
);

select * from finish();
rollback;
