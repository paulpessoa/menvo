import { z } from "zod"
import type { QuizAnalysisResult } from "./analyze"

export type DiagnosticStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface DiagnosticSlotValues {
  career_moment?: string
  current_challenge?: string
  mentorship_experience?: string
  future_vision?: string
  development_areas?: string[]
  development_areas_other?: string
  personal_life_help?: string
  share_knowledge?: string
}

export interface DiagnosticFollowupCounts {
  challenge?: number
  vision?: number
}

export interface DiagnosticState {
  currentStep: DiagnosticStepId
  answers: DiagnosticSlotValues
  followups: DiagnosticFollowupCounts
  isAwaitingFollowup?: boolean
  completedAt?: string
}

export interface DiagnosticSessionRow {
  id: string
  user_id: string
  status: "in_progress" | "completed" | "abandoned"
  current_step: number
  state: DiagnosticState
  quiz_response_id: string | null
  expires_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export const extractCareerMomentSchema = z.object({
  value: z.enum([
    "ensino-medio",
    "estudante-universitario",
    "recem-formado",
    "profissional-junior",
    "transicao",
    "outro"
  ]),
  confidence: z.number().min(0).max(1)
})

export const extractDevelopmentAreasSchema = z.object({
  areas: z.array(
    z.enum([
      "Desenvolvimento técnico",
      "Comunicação e networking",
      "Liderança e gestão",
      "Planejamento de carreira",
      "Empreendedorismo",
      "Equilíbrio vida pessoal/profissional"
    ])
  ),
  other: z.string().optional()
})

export const followupCheckSchema = z.object({
  needsFollowup: z.boolean(),
  question: z.string().optional(),
  reason: z.string().optional()
})
