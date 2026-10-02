export const CV_BUCKET = "cvs"

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
 * Link do currículo de `userId` no próprio Menvo (`/api/cv/<userId>`), ou null
 * se não há arquivo válido. A rota confere a permissão a cada acesso e entrega
 * o PDF pelo servidor, então o navegador nunca vê o endereço do Supabase nem
 * um token, e o link não expira.
 */
export function cvLink(userId: string, stored: string | null | undefined): string | null {
  return cvStoragePath(stored, userId) ? `/api/cv/${userId}` : null
}
