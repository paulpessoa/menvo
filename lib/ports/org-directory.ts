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
/** O mínimo de uma conta achada pelo e-mail: o suficiente para convidar e avisar. */
export interface DirectoryAccount {
  id: string
  full_name: string | null
  email: string
}

export interface OrgDirectory {
  /**
   * Conta com esse e-mail (igualdade exata), ou `null`. Só o service de
   * administração da org chama, depois do guard de admin; a resposta ao
   * navegador diz apenas "tem conta" ou "não tem" (risco aceito no ADR 0008, E4).
   */
  findAccountByEmail(email: string): Promise<DirectoryAccount | null>
  /** E-mails dos admins ATIVOS da org. Sem e-mail cadastrado, a pessoa fica de fora. */
  listAdminEmails(organizationId: string): Promise<string[]>
}
