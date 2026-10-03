-- Drop newsletter_subscriptions (LGPD art. 6º III, minimização).
--
-- A newsletter foi removida do código na PR #67. A tabela guardava e-mail,
-- nome, WhatsApp, IP e user agent de inscritos sem nenhum uso restante, então
-- os dados saem do banco.
--
-- Antes de apagar, quem tinha cancelado a inscrição entra na lista de
-- não-contato (email_suppressions), só como hash - o mesmo
-- sha256(lower(trim(email))) de lib/services/invites/suppression.service.ts.
-- Assim um pedido de "não quero mais e-mails" continua valendo depois que a
-- linha original some. Quem seguia inscrito não pediu para sair e por isso
-- não é bloqueado; só tem os dados apagados.
--
-- Para conferir antes de aplicar:
--   select status, count(*) from public.newsletter_subscriptions group by 1;
--
-- Irreversível: faça um backup da tabela antes se quiser guardar algo.

begin;

insert into public.email_suppressions (email_hash, reason)
select distinct encode(sha256(convert_to(lower(btrim(email, E' \t\r\n')), 'UTF8')), 'hex'), 'opted_out'
from public.newsletter_subscriptions
where status = 'unsubscribed' or unsubscribed_at is not null
on conflict (email_hash) do nothing;

-- Sem CASCADE: se algum objeto ainda depender da tabela, a migração falha
-- em vez de apagar esse objeto em silêncio.
drop table public.newsletter_subscriptions;

commit;
