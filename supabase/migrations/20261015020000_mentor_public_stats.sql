-- mentor_public_stats: números públicos de um mentor (certificado C-T3).
--
-- Por quê: mentor_stats é security_invoker, então soma só as linhas de
-- appointments/appointment_feedbacks que o RLS deixa quem consulta ver. Para um
-- visitante (ou qualquer pessoa que não participou das sessões) o mentor tinha
-- 0 sessões, e a página pública /certificate/[slug] respondia "Certificado não
-- encontrado": o certificado "verificável" só abria para o próprio mentor.
--
-- Como: função security definer que devolve só agregados (contagens e média),
-- nunca linhas, e só para mentor aprovado e público (mentor_is_publicly_listed,
-- o mesmo filtro do catálogo). Nenhuma rota precisa de service_role.

create or replace function public.mentor_public_stats(p_mentor_id uuid)
returns table (total_sessions integer, average_rating numeric, total_reviews integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer
       from appointments a
      where a.mentor_id = p_mentor_id and a.status = 'completed'),
    (select round(avg(f.rating)::numeric, 1)
       from appointment_feedbacks f
      where f.reviewed_id = p_mentor_id and f.status = 'approved' and f.rating is not null),
    (select count(*)::integer
       from appointment_feedbacks f
      where f.reviewed_id = p_mentor_id and f.status = 'approved' and f.rating is not null)
  where public.mentor_is_publicly_listed(p_mentor_id)
$$;

revoke all on function public.mentor_public_stats(uuid) from public;
grant execute on function public.mentor_public_stats(uuid) to anon, authenticated;
