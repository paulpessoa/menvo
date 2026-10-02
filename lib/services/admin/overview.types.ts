import { z } from "zod"

/** Number of weekly buckets the trend charts on /dashboard/admin cover. */
export const OVERVIEW_WEEKS = 12

const count = z.number().int().nonnegative()

export const weeklySignupsSchema = z.object({
  week: z.string(),
  mentees: count,
  mentors: count,
  other: count
})

export const weeklySessionsSchema = z.object({
  week: z.string(),
  done: count,
  scheduled: count,
  pending: count,
  cancelled: count
})

/**
 * Contract of GET /api/admin/overview. The dashboard parses the response with
 * this schema, so a renamed column on the server fails loudly in one place
 * instead of rendering a silently empty chart.
 */
export const adminOverviewSchema = z.object({
  generatedAt: z.string(),
  users: z.object({
    total: count,
    new30d: count,
    prev30d: count,
    verifiedMentors: count,
    mentees: count
  }),
  signupsByWeek: z.array(weeklySignupsSchema),
  sessions: z.object({
    last30d: count,
    prev30d: count,
    byWeek: z.array(weeklySessionsSchema),
    /** Share of requests in the window that ended cancelled; null with no requests. */
    cancelRate: z.number().nullable()
  }),
  mentorPipeline: z.object({ pending: count, approved: count, rejected: count }),
  ratings: z.object({
    distribution: z.array(z.object({ stars: z.number().int(), count })),
    average: z.number().nullable(),
    pendingModeration: count
  }),
  ai: z.object({
    month: z.string(),
    spentUsd: z.number(),
    budgetUsd: z.number().nullable(),
    cumulativeByDay: z.array(z.object({ day: z.string(), costUsd: z.number() })),
    byFeature: z.array(z.object({ feature: z.string(), costUsd: z.number(), calls: count }))
  }),
  organizations: z.object({
    active: count,
    leadsNew: count,
    leadsContacted: count,
    leadsClosed: count
  }),
  retention: z.object({
    waiting: count,
    notice30d: count,
    notice1d: count,
    optedOut: count,
    inactiveNotified: count,
    deletionsNext7d: count
  })
})

export type AdminOverview = z.infer<typeof adminOverviewSchema>
export type WeeklySignups = z.infer<typeof weeklySignupsSchema>
export type WeeklySessions = z.infer<typeof weeklySessionsSchema>
