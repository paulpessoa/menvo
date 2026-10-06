/**
 * Camada 5 · Repository (perfil público do mentor)
 * Regra: único ponto que lê `mentors_view` para perfil, abordagem e resolução
 * de nomes em slug. Sempre com o filtro do diretório (`verified` + `is_public`)
 * quando o dado vai para um visitante: um perfil que o /mentors esconde não
 * pode existir por outro caminho.
 * Não faz: regra de negócio nem decidir quem está logado (camada 7).
 * Tradeoff: a busca do catálogo (filtros, paginação) ainda mora em
 * `mentors.service.ts` e em `app/actions/mentors.ts`; migra numa etapa própria
 * (docs/blueprint/mentors-audit.md, D5), porque mexe na página de 972 linhas.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import {
  PUBLIC_MENTOR_FIELDS,
  isMentorId,
  type MentorApproach,
  type MentorSlugMatch,
  type PublicMentor,
} from "@/lib/domain/mentors/mentor.entity"
import { RepositoryError } from "./repository-error"

export interface MentorsRepository {
  findPublicBySlugOrId(slugOrId: string): Promise<PublicMentor | null>
  findApproachBySlugOrId(slugOrId: string): Promise<MentorApproach | null>
  findSlugsByNames(names: string[]): Promise<MentorSlugMatch[]>
}

const PUBLIC_COLUMNS = PUBLIC_MENTOR_FIELDS.join(", ")

export function createMentorsRepository(db: SupabaseClient<Database>): MentorsRepository {
  /** Mentores que o diretório mostra, buscados por slug ou por UUID. */
  const listed = (columns: string, slugOrId: string) => {
    const query = db.from("mentors_view").select(columns).eq("verified", true).eq("is_public", true)
    return isMentorId(slugOrId) ? query.eq("id", slugOrId) : query.eq("slug", slugOrId)
  }

  return {
    async findPublicBySlugOrId(slugOrId) {
      const { data, error } = await listed(PUBLIC_COLUMNS, slugOrId).maybeSingle()
      if (error) throw new RepositoryError("mentors.findPublicBySlugOrId", error)
      return (data as PublicMentor | null) ?? null
    },

    async findApproachBySlugOrId(slugOrId) {
      const { data, error } = await listed("mentorship_approach, what_to_expect", slugOrId).maybeSingle()
      if (error) throw new RepositoryError("mentors.findApproachBySlugOrId", error)
      return (data as MentorApproach | null) ?? null
    },

    async findSlugsByNames(names) {
      if (names.length === 0) return []
      const { data, error } = await db.from("mentors_view").select("id, full_name, slug").in("full_name", names)
      if (error) throw new RepositoryError("mentors.findSlugsByNames", error)
      return data ?? []
    },
  }
}
