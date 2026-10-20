/**
 * Camada 7 · Service (flags de onboarding)
 * Regra: marca um tour como concluído ou limpa todos. As flags são um jsonb
 * em `profiles.onboarding_flags` e o usuário só mexe nas dele.
 * Não faz: HTTP nem validar o formato da flag (`onboardingFlagSchema`, camada 4).
 * Tradeoff: ler-modificar-gravar em duas chamadas. Dois tours que terminam no
 * mesmo instante podem perder uma flag; o custo é um tour reaparecer uma vez, e
 * uma RPC com `jsonb_set` (migration) não compensa agora (audit, achado 7).
 * Se a LEITURA falhar, o service falha em vez de gravar só a flag nova: antes a
 * rota tratava o erro como "sem flags" e sobrescrevia todas as outras.
 */
import type { OnboardingFlagInput } from "@/lib/schemas/profile"
import {
  ProfileRepositoryError,
  type OnboardingFlags,
  type ProfileRepository,
} from "@/lib/repositories/profile.repository"

export interface OnboardingServiceDeps {
  repo: Pick<ProfileRepository, "findOnboardingFlags" | "setOnboardingFlags">
}

export type OnboardingOutcome =
  | { kind: "ok"; flags: OnboardingFlags }
  | { kind: "failed"; message: string }

const failure = (error: unknown): OnboardingOutcome => ({
  kind: "failed",
  message: (error instanceof ProfileRepositoryError ? error.dbMessage : (error as Error | undefined)?.message) ?? "Erro desconhecido",
})

export function createOnboardingService({ repo }: OnboardingServiceDeps) {
  return {
    async markSeen(userId: string, { flag, value }: OnboardingFlagInput): Promise<OnboardingOutcome> {
      try {
        const flags = { ...(await repo.findOnboardingFlags(userId)), [flag]: value }
        await repo.setOnboardingFlags(userId, flags)
        return { kind: "ok", flags }
      } catch (error) {
        return failure(error)
      }
    },

    async clear(userId: string): Promise<OnboardingOutcome> {
      try {
        await repo.setOnboardingFlags(userId, {})
        return { kind: "ok", flags: {} }
      } catch (error) {
        return failure(error)
      }
    },
  }
}

export type OnboardingService = ReturnType<typeof createOnboardingService>
