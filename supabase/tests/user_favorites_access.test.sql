-- Camada 12 · Teste de RLS (user_favorites)
-- Regra: prova no banco de verdade que cada pessoa lê e escreve só os próprios
-- favoritos, e que anônimo não vê nada. A tabela e a RLS não estão em nenhuma
-- migration (docs/blueprint/profile-audit.md, achado 9): este teste descreve o
-- contrato que a rota /api/me/favorites assume. Se falhar, a policy real está
-- diferente do que a rota supõe, e é preciso uma migration (decisão D3).
-- Roda com `supabase test db` (Docker). Tudo dentro de uma transação desfeita.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

-- Fixtures: A e B são usuários; M é o mentor favoritado.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'fa@test.menvo'),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'fb@test.menvo'),
  ('cccccccc-0000-0000-0000-0000000000f3', 'fm@test.menvo')
on conflict (id) do nothing;

insert into public.profiles (id, email, is_public) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'fa@test.menvo', false),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'fb@test.menvo', false),
  ('cccccccc-0000-0000-0000-0000000000f3', 'fm@test.menvo', true)
on conflict (id) do update set is_public = excluded.is_public;

insert into public.user_favorites (user_id, mentor_id) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'cccccccc-0000-0000-0000-0000000000f3'),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'cccccccc-0000-0000-0000-0000000000f3');

-- Anônimo ---------------------------------------------------------------------
set local role anon;

select is(
  (select count(*)::int from public.user_favorites
    where mentor_id = 'cccccccc-0000-0000-0000-0000000000f3'),
  0,
  'anônimo não vê favoritos de ninguém'
);

reset role;

-- Usuário A ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-0000000000f1';

select is(
  (select count(*)::int from public.user_favorites),
  1,
  'A vê só o próprio favorito, não o de B'
);

select is(
  (select count(*)::int from public.user_favorites
    where user_id = 'bbbbbbbb-0000-0000-0000-0000000000f2'),
  0,
  'A não consegue ler a linha de B mesmo filtrando pelo id dele'
);

select throws_ok(
  $$ insert into public.user_favorites (user_id, mentor_id)
     values ('bbbbbbbb-0000-0000-0000-0000000000f2', 'aaaaaaaa-0000-0000-0000-0000000000f1') $$,
  '42501',
  null,
  'A não pode inserir favorito em nome de B'
);

select lives_ok(
  $$ delete from public.user_favorites
      where user_id = 'aaaaaaaa-0000-0000-0000-0000000000f1'
        and mentor_id = 'cccccccc-0000-0000-0000-0000000000f3' $$,
  'A pode remover o próprio favorito'
);

select is(
  (select count(*)::int from public.user_favorites),
  0,
  'depois de remover, A não tem favoritos'
);

select lives_ok(
  $$ insert into public.user_favorites (user_id, mentor_id)
     values ('aaaaaaaa-0000-0000-0000-0000000000f1', 'cccccccc-0000-0000-0000-0000000000f3') $$,
  'A pode favoritar de novo'
);

reset role;

-- B continua com o favorito dele, intacto depois das ações de A.
select is(
  (select count(*)::int from public.user_favorites
    where user_id = 'bbbbbbbb-0000-0000-0000-0000000000f2'),
  1,
  'as ações de A não mexem nos favoritos de B'
);

select * from finish();
rollback;
