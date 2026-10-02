import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

export const CV_BUCKET = "cvs"

/** Validade das URLs assinadas: o link expira, então vazar um não expõe o PDF para sempre. */
const SIGNED_URL_TTL_SECONDS = 60 * 60

const LEGACY_PUBLIC_MARKER = `/storage/v1/object/public/${CV_BUCKET}/`

/**
 * Caminho do currículo de `userId` dentro do bucket, a partir do valor
 * guardado em `mentee_profiles.cv_url`. Aceita o caminho (formato novo) e a
 * URL pública antiga, para o código funcionar antes e depois da migration que
 * torna o bucket privado.
 *
 * Só devolve caminho que pertence ao próprio `userId`: upload do site
 * (`<userId>/cv-<ts>.pdf`) ou importação JotForm
 * (`estagio-recife/<userId>_cv.pdf`). Qualquer outro valor vira null, para um
 * registro adulterado não apontar para o currículo de outra pessoa.
 */
export function cvStoragePath(stored: string | null | undefined, userId: string): string | null {
  const value = stored?.trim()
  if (!value || !userId) return null

  const markerAt = value.indexOf(LEGACY_PUBLIC_MARKER)
  let path = markerAt >= 0 ? value.slice(markerAt + LEGACY_PUBLIC_MARKER.length) : value
  try {
    path = decodeURIComponent(path)
  } catch {
    return null
  }

  const ownUpload = path.startsWith(`${userId}/`) && /^[^/]+\/[\w.-]+\.pdf$/i.test(path)
  const ownImport = path === `estagio-recife/${userId}_cv.pdf`
  return (ownUpload || ownImport) && !path.includes("..") ? path : null
}

/**
 * Gera URLs assinadas (uma chamada para todos) dos currículos dessas pessoas.
 * NÃO autoriza o leitor: o chamador já precisa ter decidido que quem pediu
 * pode ver esses currículos (próprio, admin ou `profile_cv_url`). Usa service
 * role porque o bucket é privado.
 *
 * @returns mapa userId → URL assinada (ausente se não há arquivo válido)
 */
export async function signCvUrls(
  entries: Array<{ userId: string; stored: string | null | undefined }>
): Promise<Map<string, string>> {
  const signed = new Map<string, string>()
  const pathByUser = new Map<string, string>()

  for (const { userId, stored } of entries) {
    const path = cvStoragePath(stored, userId)
    if (path) pathByUser.set(userId, path)
  }
  if (pathByUser.size === 0) return signed

  const { data, error } = await createServiceRoleClient()
    .storage.from(CV_BUCKET)
    .createSignedUrls([...pathByUser.values()], SIGNED_URL_TTL_SECONDS)

  if (error) throw new Error(error.message)

  const urlByPath = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) urlByPath.set(item.path, item.signedUrl)
  }
  for (const [userId, path] of pathByUser) {
    const url = urlByPath.get(path)
    if (url) signed.set(userId, url)
  }
  return signed
}

/** Atalho de `signCvUrls` para o currículo (já autorizado) de uma pessoa. */
export async function signCvUrl(userId: string, stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null
  return (await signCvUrls([{ userId, stored }])).get(userId) ?? null
}
