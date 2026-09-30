-- Backfill profile names lost at signup (2026-09-30).
--
-- Companion to 20260930120000_handle_new_user_provider_names.sql. Accounts
-- created before that fix (mostly LinkedIn/GitHub logins) kept either the old
-- trigger default ('Usuário' + 'Teste') or an empty name. Complete them from
-- the metadata the provider already stored in auth.users.
--
-- Deliberately conservative:
--   * only profiles whose name is EMPTY or exactly the old default; a name a
--     person chose or edited is never touched;
--   * only when the provider really gave a name, and not a generic one such as
--     "Usuário Teste" (which is what the seed user's metadata says);
--   * idempotent: a second run changes nothing.
update public.profiles p
set first_name = n.first_name,
    last_name  = n.last_name,
    updated_at = now()
from auth.users u
cross join lateral public.profile_names_from_metadata(u.raw_user_meta_data) n
where p.id = u.id
  and n.first_name <> ''
  and btrim(n.first_name || ' ' || n.last_name)
        !~* '^(usu[aá]rio|user|teste|test)(\s+(teste|test))?$'
  and (
        (coalesce(btrim(p.first_name), '') = '' and coalesce(btrim(p.last_name), '') = '')
     or (p.first_name = 'Usuário' and p.last_name = 'Teste')
      )
  and (n.first_name, n.last_name) is distinct from (p.first_name, p.last_name);
