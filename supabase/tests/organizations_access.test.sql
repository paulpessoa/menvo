-- Camada 12 · Teste de RLS (organizations, organization_members)
-- Regra: prova no banco de verdade o estado FINAL das policies de org (várias
-- migrations redefinem as mesmas, ver docs/blueprint/org-audit.md): quem lê, quem
-- escreve, quem só pede para entrar, e que `is_org_admin()` vale só para admin
-- ATIVO da própria org (invariante do STATUS "Multi-Tenant Organizations").
-- Não cobre: o RPC `org_members_quiz_done` para admin de plataforma (achado 4 do
-- audit: hoje ele devolve vazio; se virar decisão, o teste muda junto).
-- Roda com `supabase test db` (Docker). Tudo dentro de uma transação desfeita.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(33);

-- Fixtures -------------------------------------------------------------------
-- PA admin da plataforma · OA admin ativo da org A · OM membro ativo de A ·
-- OI convidado de A · ST estranho · MT mentor público listado, ativo em A ·
-- AI linha de admin ainda `invited` em A · OB admin ativo da org B · NW conta nova
-- Orgs: A aberta, B aberta, S suspensa, I só por convite.
insert into auth.users (id, email) values
  ('eeeeeeee-0000-0000-0000-00000000e001', 'o_pa@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e002', 'o_oa@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e003', 'o_om@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e004', 'o_oi@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e005', 'o_st@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e006', 'o_mt@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e007', 'o_ai@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e008', 'o_ob@test.menvo'),
  ('eeeeeeee-0000-0000-0000-00000000e009', 'o_nw@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, is_public) values
  ('eeeeeeee-0000-0000-0000-00000000e001', 'o_pa@test.menvo', false),
  ('eeeeeeee-0000-0000-0000-00000000e002', 'o_oa@test.menvo', false),
  ('eeeeeeee-0000-0000-0000-00000000e003', 'o_om@test.menvo', false),
  ('eeeeeeee-0000-0000-0000-00000000e004', 'o_oi@test.menvo', false),
  ('eeeeeeee-0000-0000-0000-00000000e005', 'o_st@test.menvo', false),
  ('eeeeeeee-0000-0000-0000-00000000e006', 'o_mt@test.menvo', true),
  ('eeeeeeee-0000-0000-0000-00000000e007', 'o_ai@test.menvo', false),
  ('eeeeeeee-0000-0000-0000-00000000e008', 'o_ob@test.menvo', false),
  ('eeeeeeee-0000-0000-0000-00000000e009', 'o_nw@test.menvo', false)
on conflict (id) do update set is_public = excluded.is_public;

insert into public.user_roles (user_id, role_id)
select 'eeeeeeee-0000-0000-0000-00000000e001', id from public.roles where name = 'admin'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select 'eeeeeeee-0000-0000-0000-00000000e006', id from public.roles where name = 'mentor'
on conflict do nothing;

insert into public.mentor_profiles (user_id, verification_status) values
  ('eeeeeeee-0000-0000-0000-00000000e006', 'approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

insert into public.organizations (id, slug, name, type, status, join_policy) values
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'test-org-a', 'Org A', 'ngo', 'active', 'open'),
  ('eeeeeeee-0000-0000-0000-0000000000a2', 'test-org-b', 'Org B', 'ngo', 'active', 'open'),
  ('eeeeeeee-0000-0000-0000-0000000000a3', 'test-org-s', 'Org S', 'ngo', 'suspended', 'open'),
  ('eeeeeeee-0000-0000-0000-0000000000a4', 'test-org-i', 'Org I', 'ngo', 'active', 'invite_only');

insert into public.organization_members (organization_id, user_id, role, status) values
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-00000000e002', 'admin',  'active'),
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-00000000e003', 'member', 'active'),
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-00000000e004', 'member', 'invited'),
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-00000000e006', 'member', 'active'),
  ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-00000000e007', 'admin',  'invited'),
  ('eeeeeeee-0000-0000-0000-0000000000a2', 'eeeeeeee-0000-0000-0000-00000000e008', 'admin',  'active');

-- OM fez o quiz (o e-mail do quiz é sempre minúsculo).
insert into public.quiz_responses (name, email, career_moment, mentorship_experience, development_areas) values
  ('OM', 'o_om@test.menvo', 'inicio', 'nenhuma', array['dados']);

-- Anônimo ----------------------------------------------------------------------
set local role anon;

select is(
  (select count(*)::int from public.organizations
    where id in ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-0000000000a3')),
  1,
  'anônimo vê a org ativa e não vê a suspensa'
);

select is(
  (select count(*)::int from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'),
  1,
  'anônimo só vê o vínculo do mentor público listado, não o de mentorados nem de admins'
);

select throws_ok(
  $$ select * from public.org_members_quiz_done('eeeeeeee-0000-0000-0000-0000000000a1') $$,
  '42501',
  null,
  'anônimo não pode chamar org_members_quiz_done'
);

reset role;

-- Membro comum (OM) --------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-0000-0000-0000-00000000e003';

select is(
  (select count(*)::int from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
      and user_id <> 'eeeeeeee-0000-0000-0000-00000000e003'),
  1,
  'membro comum vê o próprio vínculo e só o mentor listado, não os outros membros'
);

select is(
  (select count(*)::int from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a2'),
  0,
  'membro de A não vê nenhum vínculo de B'
);

select is(
  (select count(*)::int from public.organizations where id = 'eeeeeeee-0000-0000-0000-0000000000a3'),
  0,
  'usuário comum não vê org suspensa'
);

select lives_ok(
  $$ update public.organization_members set role = 'admin'
      where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
        and user_id = 'eeeeeeee-0000-0000-0000-00000000e003' $$,
  'tentar se promover não dá erro, mas não acha linha para atualizar'
);

select is(
  (select role from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
      and user_id = 'eeeeeeee-0000-0000-0000-00000000e003'),
  'member',
  'membro comum continua membro: não se auto-promove'
);

select is(
  (select count(*)::int from public.org_members_quiz_done('eeeeeeee-0000-0000-0000-0000000000a1')),
  0,
  'membro comum não vê quem fez o quiz'
);

reset role;

-- Admin ativo de A (OA) ------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-0000-0000-0000-00000000e002';

select is(
  (select count(*)::int from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'),
  5,
  'admin de A vê todos os vínculos de A (ativos, convidado e admin pendente)'
);

select is(
  (select count(*)::int from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a2'),
  0,
  'admin de A não vê vínculos de B'
);

select ok(public.is_org_admin('eeeeeeee-0000-0000-0000-0000000000a1'), 'is_org_admin: verdadeiro para a própria org');
select ok(not public.is_org_admin('eeeeeeee-0000-0000-0000-0000000000a2'), 'is_org_admin: falso para outra org');

select lives_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-00000000e009', 'member', 'invited') $$,
  'admin de A convida alguém para A'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a2', 'eeeeeeee-0000-0000-0000-00000000e009', 'member', 'invited') $$,
  '42501',
  null,
  'admin de A não convida para B'
);

select lives_ok(
  $$ delete from public.organization_members
      where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a2'
        and user_id = 'eeeeeeee-0000-0000-0000-00000000e008' $$,
  'admin de A apagar vínculo de B não dá erro, mas não acha linha'
);

select is(
  (select email from public.org_members_quiz_done('eeeeeeee-0000-0000-0000-0000000000a1')),
  'o_om@test.menvo',
  'admin de A vê que OM fez o quiz (só o e-mail, nunca as respostas)'
);

reset role;

-- Admin de B chamando o RPC de A -----------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-0000-0000-0000-00000000e008';

select is(
  (select count(*)::int from public.org_members_quiz_done('eeeeeeee-0000-0000-0000-0000000000a1')),
  0,
  'admin de B não vê o quiz dos membros de A'
);

reset role;

-- Linha de admin ainda convidada (AI) ---------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-0000-0000-0000-00000000e007';

select ok(
  not public.is_org_admin('eeeeeeee-0000-0000-0000-0000000000a1'),
  'is_org_admin: falso para admin que ainda está só convidado (status invited)'
);

reset role;

-- Convidado (OI) ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-0000-0000-0000-00000000e004';

select throws_ok(
  $$ update public.organization_members set status = 'active', role = 'admin'
      where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
        and user_id = 'eeeeeeee-0000-0000-0000-00000000e004' $$,
  '42501',
  null,
  'convidado não aceita o convite virando admin'
);

select lives_ok(
  $$ update public.organization_members set status = 'active'
      where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
        and user_id = 'eeeeeeee-0000-0000-0000-00000000e004' $$,
  'convidado aceita o próprio convite'
);

select is(
  (select status from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
      and user_id = 'eeeeeeee-0000-0000-0000-00000000e004'),
  'active',
  'depois de aceitar, o vínculo está ativo'
);

reset role;

-- Estranho (ST): pedir para entrar ------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-0000-0000-0000-00000000e005';

select lives_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a1', 'eeeeeeee-0000-0000-0000-00000000e005', 'member', 'requested') $$,
  'estranho pede para entrar numa org aberta'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a4', 'eeeeeeee-0000-0000-0000-00000000e005', 'member', 'requested') $$,
  '42501',
  null,
  'estranho não pede para entrar numa org só por convite'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a3', 'eeeeeeee-0000-0000-0000-00000000e005', 'member', 'requested') $$,
  '42501',
  null,
  'estranho não pede para entrar numa org suspensa'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a2', 'eeeeeeee-0000-0000-0000-00000000e005', 'admin', 'requested') $$,
  '42501',
  null,
  'estranho não se coloca como admin'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a2', 'eeeeeeee-0000-0000-0000-00000000e005', 'member', 'active') $$,
  '42501',
  null,
  'estranho não se coloca como ativo sem aprovação'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role, status)
     values ('eeeeeeee-0000-0000-0000-0000000000a2', 'eeeeeeee-0000-0000-0000-00000000e003', 'member', 'requested') $$,
  '42501',
  null,
  'estranho não pede para entrar em nome de outra pessoa'
);

select lives_ok(
  $$ update public.organization_members set status = 'active'
      where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
        and user_id = 'eeeeeeee-0000-0000-0000-00000000e005' $$,
  'tentar se auto-aprovar não dá erro, mas não acha linha para atualizar'
);

select is(
  (select status from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
      and user_id = 'eeeeeeee-0000-0000-0000-00000000e005'),
  'requested',
  'o pedido continua pendente: só a org aprova'
);

select lives_ok(
  $$ delete from public.organization_members
      where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a1'
        and user_id = 'eeeeeeee-0000-0000-0000-00000000e005' $$,
  'estranho cancela o próprio pedido'
);

reset role;

-- Admin da plataforma (PA) e o que as escritas de verdade deixaram --------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-0000-0000-0000-00000000e001';

select is(
  (select count(*)::int from public.organizations where id = 'eeeeeeee-0000-0000-0000-0000000000a3'),
  1,
  'admin da plataforma vê a org suspensa'
);

select is(
  (select count(*)::int from public.organization_members
    where organization_id = 'eeeeeeee-0000-0000-0000-0000000000a2'),
  1,
  'e o vínculo de B continua lá: o admin de A não apagou'
);

reset role;

select * from finish();
rollback;
