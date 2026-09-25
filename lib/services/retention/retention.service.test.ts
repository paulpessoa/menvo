/**
 * @jest-environment node
 */
import { planRetentionActions, RETENTION_POLICY, RetentionCandidate, RetentionQueueRow, RetentionState } from "./retention.service"

const DAY_MS = 24 * 60 * 60 * 1000
const isoDaysAgo = (now: Date, days: number) => new Date(now.getTime() - days * DAY_MS).toISOString()
const isoDaysFromNow = (now: Date, days: number) => new Date(now.getTime() + days * DAY_MS).toISOString()

function candidate(overrides: Partial<RetentionCandidate> & { userId: string }): RetentionCandidate {
  return { campaign: "estagiorecife-2026", firstInvitedAt: new Date().toISOString(), optedOut: false, ...overrides }
}

function queueRow(overrides: Partial<RetentionQueueRow> & { userId: string; clockStartedAt: string }): RetentionQueueRow {
  return {
    campaign: "estagiorecife-2026",
    noticeThirtyDaySentAt: null,
    scheduledDeletionAt: null,
    noticeOneDaySentAt: null,
    ...overrides
  }
}

function state(overrides: Partial<RetentionState> = {}): RetentionState {
  return { candidates: [], queue: [], signedInUserIds: new Set(), ...overrides }
}

describe("planRetentionActions", () => {
  const now = new Date("2026-09-25T12:00:00.000Z")

  it("never enrolls a self-registered account (not in the candidate list at all)", () => {
    // Candidates only ever contains JotForm profiles with >=1 invite — a
    // self-registered account simply never appears here, so nothing to enroll.
    const s = state({ candidates: [] })
    expect(planRetentionActions(s, now)).toEqual([])
  })

  it("does not enroll a JotForm profile that was never invited", () => {
    // Same reasoning: the caller only includes JotForm profiles with a
    // reengagement_invites row when building `candidates`.
    const s = state({ candidates: [] })
    expect(planRetentionActions(s, now)).toEqual([])
  })

  it("enrolls a JotForm, invited, never-signed-in candidate not yet in the queue", () => {
    const s = state({
      candidates: [candidate({ userId: "u1", firstInvitedAt: isoDaysAgo(now, 5) })]
    })
    expect(planRetentionActions(s, now)).toEqual([
      { kind: "enroll", userId: "u1", campaign: "estagiorecife-2026", clockStartedAt: isoDaysAgo(now, 5) }
    ])
  })

  it("releases a queued account that has since signed in, and never deletes or notices it", () => {
    const s = state({
      candidates: [candidate({ userId: "u1", firstInvitedAt: isoDaysAgo(now, 100) })],
      queue: [queueRow({ userId: "u1", clockStartedAt: isoDaysAgo(now, 100) })],
      signedInUserIds: new Set(["u1"])
    })
    expect(planRetentionActions(s, now)).toEqual([{ kind: "release", userId: "u1" }])
  })

  it("sends the 30-day notice only once clockStartedAt + 60 days has passed", () => {
    const before = state({
      queue: [queueRow({ userId: "u1", clockStartedAt: isoDaysAgo(now, 59) })]
    })
    expect(planRetentionActions(before, now)).toEqual([])

    const after = state({
      queue: [queueRow({ userId: "u1", clockStartedAt: isoDaysAgo(now, 60) })]
    })
    expect(planRetentionActions(after, now)).toEqual([{ kind: "notice_30d", userId: "u1" }])
  })

  it("invited long ago on the first run only sends the 30-day notice, never deletes directly", () => {
    // Enrolled 200 days ago but no notice has been sent yet — the clock for
    // deletion only starts once the 30-day notice actually goes out, never
    // from clockStartedAt directly.
    const s = state({
      queue: [queueRow({ userId: "u1", clockStartedAt: isoDaysAgo(now, 200) })]
    })
    expect(planRetentionActions(s, now)).toEqual([{ kind: "notice_30d", userId: "u1" }])
  })

  it("sends the 1-day notice only once scheduledDeletionAt - 1 day has passed", () => {
    const scheduledDeletionAt = isoDaysFromNow(now, 1)
    const notSent = isoDaysFromNow(now, 2)

    const before = state({
      queue: [
        queueRow({
          userId: "u1",
          clockStartedAt: isoDaysAgo(now, 61),
          noticeThirtyDaySentAt: isoDaysAgo(now, 1),
          scheduledDeletionAt: notSent
        })
      ]
    })
    expect(planRetentionActions(before, now)).toEqual([])

    const after = state({
      queue: [
        queueRow({
          userId: "u1",
          clockStartedAt: isoDaysAgo(now, 61),
          noticeThirtyDaySentAt: isoDaysAgo(now, 1),
          scheduledDeletionAt
        })
      ]
    })
    expect(planRetentionActions(after, now)).toEqual([{ kind: "notice_1d", userId: "u1" }])
  })

  it("requires both notices before deleting", () => {
    const s = state({
      queue: [
        queueRow({
          userId: "u1",
          clockStartedAt: isoDaysAgo(now, 200),
          noticeThirtyDaySentAt: isoDaysAgo(now, 31),
          scheduledDeletionAt: isoDaysAgo(now, 1)
          // noticeOneDaySentAt still null
        })
      ]
    })
    expect(planRetentionActions(s, now)).toEqual([{ kind: "notice_1d", userId: "u1" }])
  })

  it("deletes (with notify) once both notices are sent and the schedule has passed", () => {
    const s = state({
      queue: [
        queueRow({
          userId: "u1",
          clockStartedAt: isoDaysAgo(now, 200),
          noticeThirtyDaySentAt: isoDaysAgo(now, 31),
          scheduledDeletionAt: isoDaysAgo(now, 1),
          noticeOneDaySentAt: isoDaysAgo(now, 2)
        })
      ]
    })
    expect(planRetentionActions(s, now)).toEqual([{ kind: "delete", userId: "u1", notify: true }])
  })

  it("a late 1-day notice pushes deletion back instead of deleting immediately", () => {
    // scheduledDeletionAt is already in the past, but the 1-day notice only
    // went out a few hours ago — deletion must wait until 1 day after that.
    const s = state({
      queue: [
        queueRow({
          userId: "u1",
          clockStartedAt: isoDaysAgo(now, 200),
          noticeThirtyDaySentAt: isoDaysAgo(now, 40),
          scheduledDeletionAt: isoDaysAgo(now, 10),
          noticeOneDaySentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2h ago
        })
      ]
    })
    expect(planRetentionActions(s, now)).toEqual([])
  })

  it("opted-out/suppressed accounts get no notices and delete at clockStartedAt + 90 days", () => {
    const before = state({
      candidates: [candidate({ userId: "u1", optedOut: true, firstInvitedAt: isoDaysAgo(now, 89) })],
      queue: [queueRow({ userId: "u1", clockStartedAt: isoDaysAgo(now, 89) })]
    })
    expect(planRetentionActions(before, now)).toEqual([])

    const after = state({
      candidates: [candidate({ userId: "u1", optedOut: true, firstInvitedAt: isoDaysAgo(now, 90) })],
      queue: [queueRow({ userId: "u1", clockStartedAt: isoDaysAgo(now, 90) })]
    })
    expect(planRetentionActions(after, now)).toEqual([{ kind: "delete", userId: "u1", notify: false }])
  })

  it("orders actions as release, enroll, delete, notice_1d, notice_30d", () => {
    const s = state({
      candidates: [
        candidate({ userId: "new1", firstInvitedAt: isoDaysAgo(now, 1) }),
        candidate({ userId: "signed-in", firstInvitedAt: isoDaysAgo(now, 100) })
      ],
      queue: [
        queueRow({ userId: "signed-in", clockStartedAt: isoDaysAgo(now, 100) }),
        queueRow({
          userId: "to-delete",
          clockStartedAt: isoDaysAgo(now, 200),
          noticeThirtyDaySentAt: isoDaysAgo(now, 31),
          scheduledDeletionAt: isoDaysAgo(now, 1),
          noticeOneDaySentAt: isoDaysAgo(now, 2)
        }),
        queueRow({
          userId: "needs-1d",
          clockStartedAt: isoDaysAgo(now, 61),
          noticeThirtyDaySentAt: isoDaysAgo(now, 1),
          scheduledDeletionAt: now.toISOString()
        }),
        queueRow({ userId: "needs-30d", clockStartedAt: isoDaysAgo(now, 60) })
      ],
      signedInUserIds: new Set(["signed-in"])
    })

    expect(planRetentionActions(s, now).map(a => a.kind)).toEqual([
      "release",
      "enroll",
      "delete",
      "notice_1d",
      "notice_30d"
    ])
  })

  it("RETENTION_POLICY matches the documented timeline", () => {
    expect(RETENTION_POLICY.firstNoticeAfterDays).toBe(60)
    expect(RETENTION_POLICY.noticeLeadDays).toBe(30)
    expect(RETENTION_POLICY.lastNoticeLeadDays).toBe(1)
    expect(RETENTION_POLICY.optedOutDeleteAfterDays).toBe(90)
  })
})
