/**
 * Camada 5 · erro de repository
 * Regra: o repository converte o erro do driver (Supabase) neste tipo, para o
 * service não depender da forma do erro do banco. Guarda só a operação e a
 * mensagem; nunca o objeto inteiro (pode conter dado do usuário).
 */
export class RepositoryError extends Error {
  constructor(
    public readonly operation: string,
    cause: { message?: string } | null | undefined
  ) {
    super(`${operation}: ${cause?.message ?? "erro desconhecido"}`)
    this.name = "RepositoryError"
  }
}
