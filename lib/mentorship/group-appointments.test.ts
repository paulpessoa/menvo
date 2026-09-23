import { groupAppointments, nextConfirmedSession } from './group-appointments'

const NOW = new Date('2026-09-23T12:00:00Z')
const at = (iso: string, status: string, extra: object = {}) => ({
    id: `${status}-${iso}`,
    scheduled_at: iso,
    duration_minutes: 45,
    status,
    ...extra,
})

describe('groupAppointments', () => {
    const futurePending = at('2026-09-25T19:30:00Z', 'pending')
    const pastPending = at('2026-09-20T19:30:00Z', 'pending')
    const futureConfirmed = at('2026-09-24T10:00:00Z', 'confirmed')
    const laterConfirmed = at('2026-09-30T10:00:00Z', 'confirmed')
    const pastConfirmed = at('2026-09-21T10:00:00Z', 'confirmed')
    const pastEvaluated = at('2026-09-10T10:00:00Z', 'completed', {
        feedbacks: [{ reviewer_id: 'mentee-1' }],
    })
    const cancelled = at('2026-09-26T10:00:00Z', 'cancelled')

    const all = [futurePending, pastPending, futureConfirmed, laterConfirmed, pastConfirmed, pastEvaluated, cancelled]

    it('asks the mentor to answer future pending requests only', () => {
        const g = groupAppointments(all, 'mentor', 'mentor-1', NOW)
        expect(g.needsAction).toEqual([futurePending])
        expect(g.upcoming).toEqual([futureConfirmed, laterConfirmed])
        // Expired requests and finished sessions end up in history, newest first
        expect(g.history).toEqual([cancelled, pastConfirmed, pastPending, pastEvaluated])
    })

    it('asks the mentee to evaluate finished, unevaluated sessions', () => {
        const g = groupAppointments(all, 'mentee', 'mentee-1', NOW)
        expect(g.needsAction).toEqual([pastConfirmed])
        // A pending request is "waiting on the mentor", so it's upcoming for the mentee
        expect(g.upcoming).toEqual([futureConfirmed, futurePending, laterConfirmed])
        expect(g.history).toEqual([cancelled, pastPending, pastEvaluated])
    })

    it('treats a session as ongoing until its end time', () => {
        const ongoing = at('2026-09-23T11:30:00Z', 'confirmed')
        const g = groupAppointments([ongoing], 'mentee', 'mentee-1', NOW)
        expect(g.upcoming).toEqual([ongoing])
    })

    it('picks the soonest confirmed session as the next one', () => {
        const g = groupAppointments(all, 'mentee', 'mentee-1', NOW)
        expect(nextConfirmedSession(g.upcoming)).toBe(futureConfirmed)
        expect(nextConfirmedSession([futurePending])).toBeUndefined()
    })
})
