-- Profile name from social login (2026-09-30).
--
-- handle_new_user() only knew first_name/last_name (the app's e-mail signup)
-- and full_name (Google). Every provider sends its own keys:
--
--   e-mail (app signUp)  first_name, last_name, full_name
--   Google               full_name, name, given_name, family_name
--   LinkedIn (OIDC)      name, given_name, family_name
--   GitHub               name
--
-- so anyone signing in with LinkedIn or GitHub fell through to the hard-coded
-- defaults 'Usuário' + 'Teste' and showed up to mentors (requests, calendar
-- invites) as "Usuário Teste". Metadata with first_name = '' (empty text, not
-- null) also slipped through and produced profiles with no name at all.
--
-- New behaviour: read the name from any of those keys, derive the surname from
-- the full name when it is coherent with the first name, and store an EMPTY
-- name (never "Usuário Teste") when the provider sent nothing, which the app
-- already treats as "incomplete profile". Everything else in the trigger
-- (slug, verified, default 'mentee' role, ON CONFLICT) is unchanged.
--
-- lib/auth/oauth-identity.ts applies the same rules on every login, so accounts
-- created before this migration are completed the next time they sign in.

-- ─── 1. Helpers (pure; not callable through the public API) ─────────────────
create or replace function public.clean_person_name(value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(left(btrim(regexp_replace(coalesce(value, ''), '\s+', ' ', 'g')), 100), '');
$$;

create or replace function public.profile_names_from_metadata(meta jsonb)
returns table (first_name text, last_name text)
language sql
immutable
set search_path = public
as $$
  with raw as (
    select
      coalesce(public.clean_person_name(meta ->> 'first_name'),
               public.clean_person_name(meta ->> 'given_name'))  as explicit_first,
      coalesce(public.clean_person_name(meta ->> 'last_name'),
               public.clean_person_name(meta ->> 'family_name')) as explicit_last,
      coalesce(public.clean_person_name(meta ->> 'full_name'),
               public.clean_person_name(meta ->> 'name'))        as full_name
  ),
  names as (
    select
      explicit_last,
      full_name,
      coalesce(explicit_first, nullif(split_part(full_name, ' ', 1), '')) as first_name
    from raw
  )
  select
    coalesce(names.first_name, '') as first_name,
    coalesce(
      names.explicit_last,
      -- Only derive the surname when the full name starts with the first name;
      -- otherwise an empty surname is better than a mismatched one.
      case
        when names.full_name is not null and names.first_name is not null
         and (lower(names.full_name) = lower(names.first_name)
              or left(lower(names.full_name), char_length(names.first_name) + 1) = lower(names.first_name) || ' ')
        then nullif(btrim(substring(names.full_name from char_length(names.first_name) + 1)), '')
      end,
      ''
    ) as last_name
  from names;
$$;

revoke all on function public.clean_person_name(text) from public, anon, authenticated;
revoke all on function public.profile_names_from_metadata(jsonb) from public, anon, authenticated;

-- ─── 2. The trigger function (same signature, security and side effects) ────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  user_slug text;
  profile_names record;
begin
  select * into profile_names
  from public.profile_names_from_metadata(new.raw_user_meta_data);

  -- Safe slug
  user_slug := split_part(new.email, '@', 1) || '-' || substr(new.id::text, 1, 5);

  -- Create profile
  insert into public.profiles (id, email, first_name, last_name, slug, verified, created_at, updated_at)
  values (new.id, new.email, profile_names.first_name, profile_names.last_name, user_slug, false, now(), now())
  on conflict (id) do update set email = excluded.email, updated_at = now();

  -- Default role 'mentee', looked up by name
  insert into public.user_roles (user_id, role_id)
  select new.id, id from public.roles where name = 'mentee' limit 1
  on conflict do nothing;

  return new;
end;
$function$;
