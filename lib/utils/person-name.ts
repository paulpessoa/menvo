/**
 * Helpers para nomes de pessoas, compartilhados pelo login social, pela rota de
 * perfil e pelo painel de admin (mesma regra de "nome genérico" em todos).
 */

const MAX_NAME_LENGTH = 100

/** Nomes que nunca identificam uma pessoa: "Usuário", "Usuário Teste", "Test"... */
const PLACEHOLDER_NAME = /^(usu[aá]rio|user|teste|test)(\s+(teste|test))?$/i

/** Texto limpo: só strings, espaços colapsados e tamanho limitado. */
export function normalizeName(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH)
}

/** Vazio ou genérico: não serve para identificar ninguém. */
export function isPlaceholderName(name: string | null | undefined): boolean {
  const normalized = normalizeName(name)
  return normalized === "" || PLACEHOLDER_NAME.test(normalized)
}

/** "Maria da Silva" -> { first: "Maria", last: "da Silva" }. */
export function splitFullName(fullName: unknown): { first: string; last: string } {
  const normalized = normalizeName(fullName)
  if (!normalized) return { first: "", last: "" }
  const firstSpace = normalized.indexOf(" ")
  if (firstSpace === -1) return { first: normalized, last: "" }
  return { first: normalized.slice(0, firstSpace), last: normalized.slice(firstSpace + 1) }
}
