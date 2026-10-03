/**
 * Camada 6 · Port (criação de conta sem sessão)
 * Regra: criar uma conta já confirmada e saber se um e-mail já tem conta. É a
 * parte do quiz que precisa de `auth.admin` (service_role, ADR 0007); isolada
 * aqui para o service não importar o client privilegiado.
 * Não faz: conferir o token do link (isso é regra do service).
 */
export type CreateAccountResult =
  | { kind: "created"; userId: string }
  | { kind: "exists" }
  /** A política de senha do projeto recusou (tamanho/força); a mensagem é segura de mostrar. */
  | { kind: "password_rejected"; message: string }
  | { kind: "failed"; message?: string }

export interface AccountProvisioner {
  emailHasAccount(email: string): Promise<boolean>
  createConfirmedAccount(input: { email: string; password: string; fullName: string }): Promise<CreateAccountResult>
}
