-- C-O4: restringe a leitura pública de organization_members a mentores listados.
-- A policy de 20261014010000 expunha a qualquer visitante (inclusive anônimo)
-- todos os membros ativos de orgs abertas, incluindo mentorados. O chip
-- "Mentor da {org}" só precisa dos mentores aprovados e com perfil público,
-- o mesmo critério de mentor_is_publicly_listed (security definer, já usada
-- pela RLS de mentor_availability).

drop policy if exists "organization_members_public_read_open_orgs"
  on public.organization_members;

create policy "organization_members_public_read_open_orgs"
  on public.organization_members for select
  using (
    status = 'active'
    and public.mentor_is_publicly_listed(organization_members.user_id)
    and exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.status = 'active'
        and o.join_policy = 'open'
    )
  );
