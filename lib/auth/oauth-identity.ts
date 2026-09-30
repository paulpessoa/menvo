import type { SupabaseClient } from "@supabase/supabase-js"
import { isPlaceholderName, normalizeName, splitFullName } from "@/lib/utils/person-name"

/**
 * Nome da pessoa a partir dos metadados que o Supabase guarda em cada conta.
 *
 * Cada provedor manda chaves diferentes, e o app só conhecia as do cadastro
 * por e-mail (`first_name`/`last_name`), então quem entrava pelo Google ou
 * LinkedIn ficava sem nome no perfil:
 *
 *  - e-mail (signUp do app): first_name, last_name, full_name
 *  - Google:                  full_name, name, given_name, family_name
 *  - LinkedIn (OIDC):         name, given_name, family_name
 *  - GitHub:                  name
 */
export interface ProviderIdentity {
  firstName: string
  lastName: string
}

type Metadata = Record<string, unknown> | null | undefined

const NO_IDENTITY: ProviderIdentity = { firstName: "", lastName: "" }

function pickText(metadata: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = normalizeName(metadata[key])
    if (value) return value
  }
  return ""
}

function startsWithWord(text: string, word: string): boolean {
  const a = text.toLowerCase()
  const b = word.toLowerCase()
  return a === b || a.startsWith(`${b} `)
}

export function extractIdentity(metadata: Metadata): ProviderIdentity {
  const meta = metadata ?? {}

  const explicitFirst = pickText(meta, ["first_name", "given_name"])
  const explicitLast = pickText(meta, ["last_name", "family_name"])
  const full = pickText(meta, ["full_name", "name"])
  const fromFull = splitFullName(full)

  const firstName = explicitFirst || fromFull.first
  // Só deriva o sobrenome do nome completo quando ele é coerente com o primeiro
  // nome; senão é melhor ficar vazio do que montar um nome trocado.
  const lastName =
    explicitLast ||
    (full && firstName && startsWithWord(full, firstName) ? full.slice(firstName.length).trim() : "")

  // Nome genérico vindo do provedor (ex: "Usuário Teste") não ajuda ninguém.
  if (isPlaceholderName(`${firstName} ${lastName}`)) return NO_IDENTITY

  return { firstName, lastName }
}

export interface ProfileNameFields {
  first_name?: string | null
  last_name?: string | null
}

export interface ProfileNamePatch {
  first_name?: string
  last_name?: string
}

/**
 * O que gravar no perfil, ou null se não há nada a fazer.
 *
 * Regra de ouro: nunca sobrescrever um nome real. Só preenche o que está vazio
 * e troca o nome inteiro apenas quando ele é genérico ("Usuário Teste").
 */
export function planNameFix(profile: ProfileNameFields, identity: ProviderIdentity): ProfileNamePatch | null {
  if (!identity.firstName) return null

  const first = normalizeName(profile.first_name)
  const last = normalizeName(profile.last_name)
  const patch: ProfileNamePatch = {}

  if (isPlaceholderName(`${first} ${last}`)) {
    if (first !== identity.firstName) patch.first_name = identity.firstName
    if (last !== identity.lastName) patch.last_name = identity.lastName
  } else {
    if (!first) patch.first_name = identity.firstName
    if (!last && identity.lastName) patch.last_name = identity.lastName
  }

  return Object.keys(patch).length > 0 ? patch : null
}

type AnyClient = SupabaseClient<any, any, any>

/**
 * Completa o nome do perfil com o que o provedor informou. Seguro para rodar a
 * cada login: não cria perfil, não mexe em nome real e nunca lança erro (um
 * problema aqui não pode impedir a pessoa de entrar).
 *
 * `client` precisa ser de service role e `user` já autenticado: a escrita é
 * limitada ao `id` dele.
 */
export async function syncProfileIdentity(
  client: AnyClient,
  user: { id: string; user_metadata?: Metadata }
): Promise<{ updated: boolean }> {
  try {
    const identity = extractIdentity(user.user_metadata)
    if (!identity.firstName) return { updated: false }

    const { data: profile, error: readError } = await client
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()

    // Sem perfil ainda: quem cria é o fluxo de sempre (que agora usa extractIdentity).
    if (readError || !profile) return { updated: false }

    const patch = planNameFix(profile as ProfileNameFields, identity)
    if (!patch) return { updated: false }

    const { error: writeError } = await client.from("profiles").update(patch).eq("id", user.id)
    if (writeError) {
      console.error("[auth] Não foi possível completar o nome do perfil:", user.id, writeError.message)
      return { updated: false }
    }

    return { updated: true }
  } catch (error) {
    console.error("[auth] Erro ao sincronizar o nome do perfil:", user.id, error)
    return { updated: false }
  }
}
