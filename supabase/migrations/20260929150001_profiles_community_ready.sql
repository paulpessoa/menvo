-- Critério de "perfil pronto para o Mural de Mentorados" em um lugar só
-- (docs/COMMUNITY_CONTACT_PLAN.md §5). O mural só passa a filtrar por esta
-- coluna em 14/10/2026, depois do e-mail aos mentorados; até lá ela serve
-- para medir quantos perfis estão prontos e para a barra "X% pronto" no /profile.
--
-- LinkedIn é exigido porque hoje é o único canal de contato do mentor com o
-- mentorado. Quando o "Oferecer ajuda" por e-mail intermediado existir (§3),
-- remover essa condição.
--
-- Coluna gerada: nenhum código deve escrevê-la. Um update que envie
-- community_ready (ex.: reenviando uma linha lida com select *) falha.
alter table public.profiles
  add column if not exists community_ready boolean
  generated always as (
    coalesce(is_public, false)
    and char_length(coalesce(bio, '')) >= 80
    and (
      coalesce(array_length(mentorship_topics, 1), 0) > 0
      or char_length(coalesce(learning_goals, '')) >= 40
    )
    and char_length(coalesce(linkedin_url, '')) > 0
  ) stored;

create index if not exists profiles_community_ready_updated_idx
  on public.profiles (updated_at desc)
  where community_ready;
