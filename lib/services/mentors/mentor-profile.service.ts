/**
 * Camada 7 · Service (perfil público do mentor)
 * Regra: casos de uso do perfil: a página pública, os textos só para logados
 * e a resolução de nomes sugeridos pela IA em slugs. Recebe os repositories
 * por parâmetro; roda em teste sem banco.
 * Não faz: HTTP nem criar client (camadas 8 e composição).
 * Tradeoff: a regra "abordagem só para quem está logado" fica aqui, e não só
 * na rota, para valer igual em qualquer entrada (rota, server action, agente).
 */
import type { AvailabilitySlot } from "@/lib/domain/mentors/availability.entity"
import type { MentorApproach, MentorSlugMatch, PublicMentor } from "@/lib/domain/mentors/mentor.entity"
import type { MentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import type { MentorsRepository } from "@/lib/repositories/mentors.repository"

export interface MentorProfileServiceDeps {
  mentors: MentorsRepository
  availability: MentorAvailabilityRepository
}

export type PublicProfileOutcome =
  | { kind: "ok"; mentor: PublicMentor; availability: AvailabilitySlot[] }
  | { kind: "not_found" }

export type ApproachOutcome =
  | { kind: "ok"; approach: MentorApproach }
  | { kind: "unauthorized" }
  | { kind: "not_found" }

/** Limite de nomes por chamada: a análise do quiz sugere no máximo alguns mentores. */
const MAX_NAMES = 20

export function createMentorProfileService({ mentors, availability }: MentorProfileServiceDeps) {
  const findPublic = async (slugOrId: string): Promise<PublicMentor | null> => {
    try {
      return await mentors.findPublicBySlugOrId(slugOrId)
    } catch (error) {
      console.error("[mentorProfile.findPublic]", (error as Error).message)
      return null
    }
  }

  return {
    findPublic,

    async getPublicProfile(slugOrId: string): Promise<PublicProfileOutcome> {
      const mentor = await findPublic(slugOrId)
      if (!mentor?.id) return { kind: "not_found" }

      // A agenda é complemento: se falhar, a página abre sem horários em vez de 404.
      let slots: AvailabilitySlot[] = []
      try {
        slots = await availability.listByMentor(mentor.id)
      } catch (error) {
        console.error("[mentorProfile.availability]", (error as Error).message)
      }
      return { kind: "ok", mentor, availability: slots }
    },

    async getApproach(slugOrId: string, isAuthenticated: boolean): Promise<ApproachOutcome> {
      if (!isAuthenticated) return { kind: "unauthorized" }
      try {
        const approach = await mentors.findApproachBySlugOrId(slugOrId)
        return approach ? { kind: "ok", approach } : { kind: "not_found" }
      } catch (error) {
        console.error("[mentorProfile.getApproach]", (error as Error).message)
        return { kind: "not_found" }
      }
    },

    async resolveSlugs(names: string[]): Promise<MentorSlugMatch[]> {
      const clean = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, MAX_NAMES)
      return mentors.findSlugsByNames(clean)
    },
  }
}

export type MentorProfileService = ReturnType<typeof createMentorProfileService>
