import { z } from "zod"
import type { QuizAnalysisResult } from "@/lib/types/models/quiz"

export type DiagnosticShareScope = "summary" | "full"

export interface DiagnosticShareRecord {
  id: string
  diagnostic_session_id?: string | null
  quiz_response_id?: string | null
  mentee_id: string
  mentor_id: string
  scope: DiagnosticShareScope
  created_at: string
  revoked_at?: string | null
}

export interface DiagnosticShareWithMentor extends DiagnosticShareRecord {
  mentor: {
    id: string
    full_name: string
    email?: string | null
    avatar_url?: string | null
    slug?: string | null
  }
}

export interface DiagnosticShareWithMentee extends DiagnosticShareRecord {
  mentee: {
    id: string
    full_name: string
    email?: string | null
    avatar_url?: string | null
  }
}

export interface SharedDiagnosticInsight {
  shareId: string
  quizResponseId?: string | null
  diagnosticSessionId?: string | null
  scope: DiagnosticShareScope
  createdAt: string
  mentee: {
    id: string
    fullName: string
    avatarUrl?: string | null
  }
  analysis: QuizAnalysisResult | null
  developmentAreas: string[]
  currentChallenge?: string | null
  futureVision?: string | null
  careerMoment?: string | null
  personalLifeHelp?: string | null
}

export const createDiagnosticShareSchema = z
  .object({
    mentor_id: z.string().uuid({ message: "mentor_id deve ser um UUID válido" }),
    quiz_response_id: z.string().uuid().optional().nullable(),
    diagnostic_session_id: z.string().uuid().optional().nullable(),
    scope: z.enum(["summary", "full"]).default("summary")
  })
  .refine(
    (data) => Boolean(data.quiz_response_id || data.diagnostic_session_id),
    {
      message: "Deve fornecer quiz_response_id ou diagnostic_session_id"
    }
  )

export type CreateDiagnosticShareInput = z.infer<typeof createDiagnosticShareSchema>
