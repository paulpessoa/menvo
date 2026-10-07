-- Camada 12 · Teste de RLS (mentor_availability)
-- Regra: prova as políticas e a função set_mentor_availability da migration
-- 20261008000000 no banco de verdade, por papel. Mock nenhum pega RLS errado.
-- Roda com `supabase test db` (Docker). Tudo dentro de uma transação que é
-- desfeita no fim, então não deixa dado para trás.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(10);

-- Fixtures: A aprovado e público, B pendente, C aprovado mas não público.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a@test.menvo'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b@test.menvo'),
  ('cccccccc-0000-0000-0000-00000000000c', 'c@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, is_public) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a@test.menvo', true),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b@test.menvo', true),
  ('cccccccc-0000-0000-0000-00000000000c', 'c@test.menvo', false)
on conflict (id) do update set is_public = excluded.is_public;

insert into public.mentor_profiles (user_id, verification_status) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'approved'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'pending'),
  ('cccccccc-0000-0000-0000-00000000000c', 'approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

insert into public.mentor_availability (mentor_id, day_of_week, start_time, end_time)
select id, 1, '09:00', '10:00' from public.profiles
where id in ('aaaaaaaa-0000-0000-0000-00000000000a',
             'bbbbbbbb-0000-0000-0000-00000000000b',
             'cccccccc-0000-0000-0000-00000000000c');

-- Anônimo ---------------------------------------------------------------------
set local role anon;

select is(
  (select count(*)::int from public.mentor_availability
    where mentor_id in ('aaaaaaaa-0000-0000-0000-00000000000a',
                        'bbbbbbbb-0000-0000-0000-00000000000b',
                        'cccccccc-0000-0000-0000-00000000000c')),
  1,
  'anônimo vê só a agenda do mentor aprovado e público'
);

select throws_ok(
  $$ select public.set_mentor_availability('[]'::jsonb) $$,
  '42501',
  null,
  'anônimo não pode chamar set_mentor_availability'
);

reset role;

-- Mentor pendente (B) -----------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-00000000000b';

select is(
  (select count(*)::int from public.mentor_availability
    where mentor_id = 'bbbbbbbb-0000-0000-0000-00000000000b'),
  1,
  'mentor pendente vê a própria agenda'
);

select is(
  (select count(*)::int from public.set_mentor_availability(
     '[{"day_of_week":2,"start_time":"14:00","end_time":"15:00"},
       {"day_of_week":3,"start_time":"08:30","end_time":"09:00","timezone":"Europe/Lisbon"}]'::jsonb,
     'America/Recife')),
  2,
  'set_mentor_availability devolve os slots gravados'
);

select is(
  (select count(*)::int from public.mentor_availability
    where mentor_id = 'bbbbbbbb-0000-0000-0000-00000000000b'),
  2,
  'a agenda antiga foi substituída pela nova'
);

select is(
  (select timezone from public.mentor_availability
    where mentor_id = 'bbbbbbbb-0000-0000-0000-00000000000b' and day_of_week = 3),
  'Europe/Lisbon',
  'o timezone do slot tem prioridade sobre o da chamada'
);

select throws_ok(
  $$ select public.set_mentor_availability(
       '[{"day_of_week":5,"start_time":"10:00","end_time":"11:00"},
         {"day_of_week":6,"start_time":"xx","end_time":"11:00"}]'::jsonb) $$,
  '22007',
  null,
  'slot inválido aborta a chamada inteira'
);

select is(
  (select count(*)::int from public.mentor_availability
    where mentor_id = 'bbbbbbbb-0000-0000-0000-00000000000b'),
  2,
  'depois do erro, a agenda anterior continua intacta (transação)'
);

-- O RLS não dá erro: o delete simplesmente não enxerga linhas de outro mentor.
delete from public.mentor_availability
 where mentor_id = 'aaaaaaaa-0000-0000-0000-00000000000a';

reset role;

select is(
  (select count(*)::int from public.mentor_availability
    where mentor_id = 'aaaaaaaa-0000-0000-0000-00000000000a'),
  1,
  'um mentor não apaga a agenda de outro'
);

select is(
  (select timezone from public.profiles where id = 'bbbbbbbb-0000-0000-0000-00000000000b'),
  'America/Recife',
  'p_timezone atualiza o timezone do perfil'
);

select * from finish();
rollback;
