alter table public.quiz_responses add column if not exists ip_address text;

create or replace function public.quiz_submission_status(p_email text, p_ip text default null, p_is_auth boolean default false)
returns text
language plpgsql stable security definer
set search_path = public
as $$
declare
  c_auth_limit constant int := 2;
  c_anon_limit constant int := 1;
  c_window constant interval := interval '30 days';
  v_count int;
begin
  if public.ai_budget_exhausted() then
    return 'budget';
  end if;

  if p_is_auth then
    -- Usuário logado: limite de 2 por mês vinculado ao email dele
    select count(*) into v_count
    from public.quiz_responses q
    where q.email = lower(trim(p_email))
      and q.diagnostic_session_id is null
      and q.created_at > now() - c_window;
      
    if v_count >= c_auth_limit then
      return 'email_limit';
    end if;
  else
    -- Usuário anônimo: limite de 1 por mês pelo IP
    if p_ip is not null then
      select count(*) into v_count
      from public.quiz_responses q
      where q.ip_address = p_ip
        and q.diagnostic_session_id is null
        and q.created_at > now() - c_window;
        
      if v_count >= c_anon_limit then
        return 'ip_limit';
      end if;
    end if;
    
    -- Se por acaso mudou de IP mas usou o mesmo email, bloqueia também
    select count(*) into v_count
    from public.quiz_responses q
    where q.email = lower(trim(p_email))
      and q.diagnostic_session_id is null
      and q.created_at > now() - c_window;
      
    if v_count >= c_anon_limit then
      return 'email_limit';
    end if;
  end if;

  return 'ok';
end;
$$;

revoke all on function public.quiz_submission_status(text, text, boolean) from public;
grant execute on function public.quiz_submission_status(text, text, boolean) to anon, authenticated;

drop policy if exists "Public can submit quiz responses" on public.quiz_responses;
create policy "Public can submit quiz responses"
  on public.quiz_responses for insert to anon
  with check (
    user_id is null
    and ai_analysis is null
    and processed_at is null
    and score is null
    and coalesce(email_sent, false) = false
    and email_sent_at is null
    and public.quiz_submission_status(email, ip_address, false) = 'ok'
  );

drop policy if exists "Authenticated can submit own quiz responses" on public.quiz_responses;
create policy "Authenticated can submit own quiz responses"
  on public.quiz_responses for insert to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and (processed_at is not null or public.quiz_submission_status(email, ip_address, true) = 'ok')
    )
  );
