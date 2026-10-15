import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createClient } from "@/lib/utils/supabase/server"

export interface MentorCertificateData {
  mentorId: string
  slug: string | null
  mentorName: string
  mentorTitle: string | null
  memberSinceIso: string | null
  memberSinceFormatted: string
  issueDateFormatted: string
  totalSessions: number
  totalHours: number
  /** Minutos exatos (45 por sessão); o certificado mostra "45 min" em vez de "0,8 h". */
  totalMinutes: number
  averageRating: number | null
  totalReviews: number
  verificationCode: string
  verificationUrl: string
  isValid: boolean
}

/**
 * Gera um código determinístico de verificação a partir do ID do mentor e sessões.
 * Formato: MV-XXXXXXXX-YYYY (ex: MV-A1B2C3D4-000F)
 */
export function generateVerificationCode(mentorId: string, completedSessions: number): string {
  const cleanId = mentorId.replace(/-/g, "").slice(0, 8).toUpperCase()
  const sessionsHex = Math.max(0, completedSessions).toString(16).toUpperCase().padStart(4, "0")
  return `MV-${cleanId}-${sessionsHex}`
}

/**
 * Calcula total de horas doadas a partir do número de sessões (padrão 45 min por sessão).
 */
export function calculateVolunteeredHours(completedSessions: number): number {
  if (completedSessions <= 0) return 0
  return Math.round((completedSessions * 45) / 60 * 10) / 10
}

function formatDate(isoDate: string | null | undefined, locale = "pt-BR"): string {
  if (!isoDate) return ""
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  } catch {
    return ""
  }
}

export const mentorCertificateService = {
  /**
   * Obtém os dados do certificado para um mentor por ID ou slug.
   * Só retorna certificado válido se o mentor for verificado e tiver ao menos 1 sessão realizada.
   */
  async getCertificate(
    slugOrId: string,
    db?: SupabaseClient<Database>,
    locale = "pt-BR"
  ): Promise<MentorCertificateData | null> {
    const supabase = db ?? (await createClient())

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)

    let query = (supabase.from("mentors_view") as any)
      .select("id, slug, full_name, job_title, created_at, verified")
      .eq("verified", true)

    if (isUuid) {
      query = query.eq("id", slugOrId)
    } else {
      query = query.eq("slug", slugOrId)
    }

    const { data, error } = await query.maybeSingle()

    if (error || !data) {
      if (error) {
        console.error("[mentorCertificateService.getCertificate]", error.message)
      }
      return null
    }

    // Os números vêm de mentor_public_stats, não de mentors_view: a view soma
    // só o que o RLS deixa quem consulta ver, e um visitante via 0 sessões.
    const { data: statsRows, error: statsError } = await supabase.rpc("mentor_public_stats", { p_mentor_id: data.id })
    if (statsError) {
      console.error("[mentorCertificateService.getCertificate] stats", statsError.message)
      return null
    }
    const stats = statsRows?.[0]
    const totalSessions = stats?.total_sessions ?? 0
    if (totalSessions <= 0) {
      return null
    }

    const totalHours = calculateVolunteeredHours(totalSessions)
    const verificationCode = generateVerificationCode(data.id, totalSessions)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.menvo.com.br"
    const verificationUrl = `${baseUrl}/certificate/${data.slug || data.id}`

    const now = new Date().toISOString()

    return {
      mentorId: data.id,
      slug: data.slug,
      mentorName: data.full_name || "Mentor Menvo",
      mentorTitle: data.job_title || null,
      memberSinceIso: data.created_at,
      memberSinceFormatted: formatDate(data.created_at, locale),
      issueDateFormatted: formatDate(now, locale),
      totalSessions,
      totalHours,
      totalMinutes: totalSessions * 45,
      averageRating: stats?.average_rating != null ? Number(stats.average_rating) : null,
      totalReviews: stats?.total_reviews ?? 0,
      verificationCode,
      verificationUrl,
      isValid: true
    }
  }
}
