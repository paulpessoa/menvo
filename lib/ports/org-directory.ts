/**
 * Camada 6 · Port (diretório de contatos da org, acesso privilegiado)
 * Regra: o que o service precisa ler e que a RLS não deixa o usuário ver. Hoje
 * é só os e-mails dos admins de uma org, para avisá-los de um pedido para
 * entrar (ADR 0008, exceção E3). O e-mail nunca volta ao navegador.
 * Não faz: conferir quem pode pedir isso (é regra do service) nem devolver mais
 * do que o e-mail (ADR 0008, regra 4).
 * Tradeoff: a implementação usa `service_role`; fica atrás desta interface para
 * a rota não importar o client privilegiado e para o service ser testado sem banco.
 */
export interface OrgDirectory {
  /** E-mails dos admins ATIVOS da org. Sem e-mail cadastrado, a pessoa fica de fora. */
  listAdminEmails(organizationId: string): Promise<string[]>
}
