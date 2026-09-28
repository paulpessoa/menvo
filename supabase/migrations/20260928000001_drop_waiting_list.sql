-- Remove a lista de espera (tabela, função de sync e feature flag).
--
-- Contexto (2026-09-28): o cadastro está aberto e a flag `waiting_list_flag`
-- já estava desligada. Todas as 44 pessoas da lista viraram contas normais
-- antes desta migração, por um script único rodado com service role:
--   - a única que ainda não tinha conta ganhou uma (e-mail já confirmado,
--     sem envio de e-mail);
--   - as 24 contas criadas por convite e nunca aceitas tiveram o e-mail
--     confirmado, para poderem entrar por "Esqueci a senha" ou pelo Google;
--   - o WhatsApp foi para `profiles.phone` e o motivo para `profiles.bio`
--     (só quando vazios), e a linha inteira da lista foi copiada para
--     `profiles.original_data` com `source = 'waiting_list'`.
-- Nada que estava só nesta tabela se perde.
--
-- Aplicar DEPOIS do deploy do código que parou de ler `waiting_list`
-- (senão /api/admin/users e /api/admin/stats quebram no meio do caminho).

drop function if exists public.sync_waiting_list_status();

-- Policies, trigger e FK são da própria tabela e caem junto.
drop table if exists public.waiting_list;

delete from public.feature_flags where name = 'waiting_list_flag';

comment on column public.profiles.original_data is
  'Dados de origem de quem não se cadastrou pelo site. origin_platform = ''jotform'': respostas originais do formulário do Estágio Recife. source = ''waiting_list'': a entrada da antiga lista de espera (tabela removida em 20260928000001).';
