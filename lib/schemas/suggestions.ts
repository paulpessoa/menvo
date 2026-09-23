import { z } from "zod"

const shortText = z.string().trim().max(100)

/**
 * Snapshot of the /mentors filters that were active when the search came back
 * empty. Stored alongside the suggestion so the team can see *which* gap in the
 * catalog the person hit, not just the free-text topic.
 */
export const suggestionContextSchema = z.object({
  topics: z.array(shortText).max(20).optional(),
  languages: z.array(shortText).max(20).optional(),
  inclusiveTags: z.array(shortText).max(20).optional(),
  country: shortText.optional(),
  state: shortText.optional(),
  city: shortText.optional(),
  availabilityStatus: z.enum(["available", "busy"]).optional(),
  experienceYears: shortText.optional(),
})

export const mentorSuggestionSchema = z.object({
  topic: z.string().trim().min(3, "O tema deve ter pelo menos 3 caracteres.").max(100, "O tema não pode ter mais de 100 caracteres."),
  description: z.string().max(500, "A descrição não pode passar de 500 caracteres.").optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
  context: suggestionContextSchema.optional().nullable(),
})

export type SuggestionContext = z.infer<typeof suggestionContextSchema>
export type MentorSuggestionInput = z.infer<typeof mentorSuggestionSchema>

/**
 * Whether a context snapshot carries any real filter. Lets both the UI (hide
 * the summary) and the API (store NULL) treat "no filters" the same way.
 */
export function hasSuggestionContext(context: SuggestionContext | null | undefined): context is SuggestionContext {
  if (!context) return false
  return Object.values(context).some((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
}
