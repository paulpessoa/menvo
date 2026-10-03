import {
  buildWeeks,
  bucketSessions,
  bucketSignups,
  classifySession,
  countInWindow,
  cumulativeDailyCost,
  retentionStages,
  summarizeRatings,
  weekStartUtc
} from "./overview.aggregate"

// Wednesday, 2026-10-07 12:00 UTC
const NOW = new Date("2026-10-07T12:00:00Z")

describe("weekStartUtc", () => {
  it("returns the Monday of the week", () => {
    expect(weekStartUtc(new Date("2026-10-07T23:59:00Z"))).toBe("2026-10-05")
    expect(weekStartUtc(new Date("2026-10-11T10:00:00Z"))).toBe("2026-10-05") // Sunday
    expect(weekStartUtc(new Date("2026-10-05T00:00:00Z"))).toBe("2026-10-05")
  })
})

describe("buildWeeks", () => {
  it("returns consecutive Mondays ending with the current week", () => {
    expect(buildWeeks(NOW, 3)).toEqual(["2026-09-21", "2026-09-28", "2026-10-05"])
  })
})

describe("bucketSignups", () => {
  it("splits by role and keeps empty weeks", () => {
    const weeks = buildWeeks(NOW, 2)
    const result = bucketSignups(
      [
        { created_at: "2026-10-06T10:00:00Z", roles: ["mentee"] },
        { created_at: "2026-10-06T11:00:00Z", roles: ["mentor"] },
        { created_at: "2026-10-07T11:00:00Z", roles: [] },
        { created_at: "2025-01-01T00:00:00Z", roles: ["mentee"] }
      ],
      weeks
    )
    expect(result).toEqual([
      { week: "2026-09-28", mentees: 0, mentors: 0, other: 0 },
      { week: "2026-10-05", mentees: 1, mentors: 1, other: 1 }
    ])
  })
})

describe("classifySession", () => {
  it("treats a confirmed session in the past as done", () => {
    expect(classifySession("confirmed", "2026-10-01T10:00:00Z", NOW)).toBe("done")
    expect(classifySession("confirmed", "2026-10-20T10:00:00Z", NOW)).toBe("scheduled")
    expect(classifySession("rejected", "2026-10-20T10:00:00Z", NOW)).toBe("cancelled")
    expect(classifySession("weird", "2026-10-20T10:00:00Z", NOW)).toBeNull()
  })
})

describe("bucketSessions", () => {
  it("counts each request in its request week", () => {
    const [week] = bucketSessions(
      [
        { created_at: "2026-10-05T09:00:00Z", status: "pending", scheduled_at: "2026-10-10T10:00:00Z" },
        { created_at: "2026-10-06T09:00:00Z", status: "cancelled", scheduled_at: "2026-10-10T10:00:00Z" }
      ],
      buildWeeks(NOW, 1),
      NOW
    )
    expect(week).toEqual({ week: "2026-10-05", done: 0, scheduled: 0, pending: 1, cancelled: 1 })
  })
})

describe("countInWindow", () => {
  it("counts rows inside the half-open window", () => {
    const rows = [{ created_at: "2026-10-01T00:00:00Z" }, { created_at: "2026-08-20T00:00:00Z" }]
    expect(countInWindow(rows, NOW, 0, 30)).toBe(1)
    expect(countInWindow(rows, NOW, 30, 60)).toBe(1)
  })
})

describe("cumulativeDailyCost", () => {
  it("accumulates per day up to today", () => {
    const result = cumulativeDailyCost(
      [
        { created_at: "2026-10-01T10:00:00Z", cost_usd: 0.5 },
        { created_at: "2026-10-03T10:00:00Z", cost_usd: 1 },
        { created_at: "2026-10-03T11:00:00Z", cost_usd: null }
      ],
      "2026-10-01",
      new Date("2026-10-03T12:00:00Z")
    )
    expect(result).toEqual([
      { day: "2026-10-01", costUsd: 0.5 },
      { day: "2026-10-02", costUsd: 0.5 },
      { day: "2026-10-03", costUsd: 1.5 }
    ])
  })
})

describe("summarizeRatings", () => {
  it("orders 5 to 1 and averages", () => {
    expect(summarizeRatings({ 5: 3, 4: 1 })).toEqual({
      distribution: [
        { stars: 5, count: 3 },
        { stars: 4, count: 1 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 }
      ],
      average: 4.75
    })
    expect(summarizeRatings({}).average).toBeNull()
  })
})

describe("retentionStages", () => {
  it("applies opt-out first, then the latest notice", () => {
    const result = retentionStages(
      [
        { opted_out: true, notice_30d_sent_at: "x", notice_1d_sent_at: "x", scheduled_deletion_at: "2026-10-08T00:00:00Z" },
        { opted_out: false, notice_30d_sent_at: "x", notice_1d_sent_at: "x", scheduled_deletion_at: null },
        { opted_out: false, notice_30d_sent_at: "x", notice_1d_sent_at: null, scheduled_deletion_at: "2026-12-01T00:00:00Z" },
        { opted_out: false, notice_30d_sent_at: null, notice_1d_sent_at: null, scheduled_deletion_at: null }
      ],
      NOW
    )
    expect(result).toEqual({ waiting: 1, notice30d: 1, notice1d: 1, optedOut: 1, deletionsNext7d: 1 })
  })
})
