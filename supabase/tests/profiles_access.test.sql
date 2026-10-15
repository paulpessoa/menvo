-- Camada 12 · Contrato RLS de profiles (anon vs authenticated vs admin)
-- Prova as policies Anon reads public mentors / Authenticated reads allowed profiles
-- e os column grants de anon (sem email/phone). Roda com `supabase test db`.
-- Dentro de transacao com rollback, nao deixa dado.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

-- Fixtures: u1 = mentor publico aprovado, u2 = mentorado privado, admin, u3 = estranho
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 't1_u1@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', 't1_u2@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', 't1_u3@test.menvo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', 't1_admin@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, first_name, is_public, onboarding_flags) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 't1_u1@test.menvo', 'MentorPublico', true, '{"seen_welcome":true}'::jsonb),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', 't1_u2@test.menvo', 'MenteePrivado', false, '{"seen_welcome":false}'::jsonb),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', 't1_u3@test.menvo', 'Estranho', true, '{}'::jsonb),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', 't1_admin@test.menvo', 'Admin', true, '{}'::jsonb)
on conflict (id) do update set is_public = excluded.is_public, onboarding_flags = excluded.onboarding_flags;

-- roles ja existem (id int 1/2/3), nao inserir

-- garantir roles ids consistentes (buscar do banco se ja existiam)
-- usar administradores: associar papeis via nome
insert into public.user_roles (user_id, role_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', id from public.roles where name='mentor'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', id from public.roles where name='mentee'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', id from public.roles where name='mentee'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', id from public.roles where name='admin'
on conflict do nothing;

insert into public.mentor_profiles (user_id, verification_status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

-- Anon ---------------------------------------------------------------
set local role anon;

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001'),
  1,
  'anon ve mentor publico aprovado'
);

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002'),
  0,
  'anon nao ve mentorado privado'
);

-- anon nao tem grant em email/phone/onboarding_flags (column-level)
select throws_ok(
  $$ select email from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001' $$,
  '42501',
  null,
  'anon sem grant SELECT(email) e bloqueado por coluna'
);

reset role;

-- Dono ve proprio ---------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002';

select is(
  (select is_public from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002'),
  false,
  'dono ve proprio is_public'
);

select ok(
  (select onboarding_flags is not null from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002'),
  'dono ve proprio onboarding_flags'
);

-- Estranho nao ve dados privados de outro
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003';

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002'),
  0,
  'estranho nao ve perfil privado de outro'
);

reset role;

-- Compartilha mentoria -> passa a ver (shares_mentorship_with)
insert into public.appointments (id, mentor_id, mentee_id, scheduled_at, duration_minutes, status)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', now(), 45, 'confirmed')
on conflict (id) do nothing;

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001';

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002'),
  1,
  'mentor ve mentorado com quem tem appointment (shares_mentorship_with)'
);

reset role;

-- Admin ve tudo -----------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009';

select is(
  (select count(*)::int from public.profiles where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002')),
  2,
  'admin ve ambos'
);

reset role;

select * from finish();
rollback;
