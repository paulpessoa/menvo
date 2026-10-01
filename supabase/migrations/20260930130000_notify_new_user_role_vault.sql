-- notify_new_user_role(): no secrets in the function body (2026-09-30).
--
-- The previous version had a service_role JWT pasted into its source, which
-- gives full database access (it bypasses Row Level Security) to anyone who
-- can read the function definition. It also hard-coded the project URL and
-- did not catch errors: if the HTTP call failed, the INSERT that fired the
-- trigger failed with it, so a problem in a notification could break a signup.
--
-- What the function needs:
--   * The Edge Function notify-new-user only requires a VALID JWT to be
--     invoked (verify_jwt) and uses its own injected service role to read the
--     database. So the trigger never needs a powerful key: the public anon key
--     is enough.
--   * Both values now come from Supabase Vault, so nothing sensitive, and no
--     project-specific value, lives in the function or in this repository.
--
-- One-time setup (run in the SQL Editor; NEVER commit the values):
--
--   select vault.create_secret('https://<project-ref>.supabase.co',
--                              'notify_project_url',
--                              'Project URL used by notify_new_user_role');
--   select vault.create_secret('<the project''s ANON (public) key>',
--                              'notify_function_key',
--                              'JWT that only lets notify_new_user_role call the notify-new-user Edge Function');
--
-- Until both secrets exist the function logs a WARNING and skips the e-mail;
-- it never blocks the signup. To rotate later:
--   select vault.update_secret(id, '<new value>') from vault.secrets
--   where name = 'notify_function_key';
create or replace function public.notify_new_user_role()
returns trigger
language plpgsql
security definer
-- Empty search_path: every object below is schema-qualified, so nobody can
-- shadow net.* / vault.* with their own objects.
set search_path = ''
as $function$
declare
  project_url text;
  function_key text;
begin
  select decrypted_secret into project_url
  from vault.decrypted_secrets where name = 'notify_project_url' limit 1;

  select decrypted_secret into function_key
  from vault.decrypted_secrets where name = 'notify_function_key' limit 1;

  if project_url is null or function_key is null then
    raise warning 'notify_new_user_role: Vault secrets notify_project_url / notify_function_key are not configured; skipping the new-user notification';
    return new;
  end if;

  -- Edge Function call via pg_net (asynchronous HTTP request)
  perform net.http_post(
    url     := rtrim(project_url, '/') || '/functions/v1/notify-new-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || function_key
    ),
    body    := jsonb_build_object(
      'type',   tg_op,
      'table',  tg_table_name,
      'record', row_to_json(new),
      'schema', tg_table_schema
    )
  );

  return new;
exception
  when others then
    -- A failed notification must never roll back the signup that fired it.
    raise warning 'notify_new_user_role failed (% - %); signup continues', sqlstate, sqlerrm;
    return new;
end;
$function$;

-- A trigger function is never meant to be called directly.
revoke all on function public.notify_new_user_role() from public, anon, authenticated;
