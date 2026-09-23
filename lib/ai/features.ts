import { z } from "zod"

/**
 * Every AI-backed feature has a name here, and the same name is used for its
 * monthly limit (`ai_entitlements.feature`) and its cost rows
 * (`ai_usage_events.feature`). Adding a new AI feature = add it here + seed an
 * entitlement row; without the row the quota gate denies it (limit 0).
 */
export const AI_FEATURES = ["match", "assistant", "admin_waitlist_match"] as const

export const aiFeatureSchema = z.enum(AI_FEATURES)

export type AiFeature = z.infer<typeof aiFeatureSchema>
