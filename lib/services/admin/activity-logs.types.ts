import { z } from "zod"

/** Tables whose writes are audited by the `log_activity` trigger. */
export const ACTIVITY_TABLES = [
  "profiles",
  "mentor_profiles",
  "mentee_profiles",
  "mentor_availability",
  "user_roles",
  "appointments"
] as const

const personSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.string().nullable()
})

export const activityLogSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  table_name: z.string(),
  operation: z.enum(["INSERT", "UPDATE", "DELETE"]),
  record_id: z.string().nullable(),
  changes: z.record(z.unknown()),
  actor: personSchema.nullable(),
  subject: personSchema.nullable()
})

export const activityLogsPageSchema = z.object({
  logs: z.array(activityLogSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
})

export type ActivityLog = z.infer<typeof activityLogSchema>
export type ActivityLogsPage = z.infer<typeof activityLogsPageSchema>

export const activityQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  table: z.enum(ACTIVITY_TABLES).optional(),
  page: z.coerce.number().int().min(1).default(1)
})
