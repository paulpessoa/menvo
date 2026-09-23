/**
 * Groups a user's appointments by what the user needs to do next, instead of
 * by raw DB status.
 *
 * Why: the DB status alone lies about time. A `confirmed` session stays
 * `confirmed` after it happens until the mentee evaluates it, and a `pending`
 * request nobody answered stays `pending` after its date passes. Grouping by
 * raw status (the old tab-per-status UI) left finished sessions under
 * "Agendadas" forever and expired requests under "Pendentes".
 */

export type Perspective = 'mentor' | 'mentee'

export interface GroupableAppointment {
    id: string | number
    scheduled_at: string
    duration_minutes: number
    status: string
    feedbacks?: { reviewer_id: string }[] | null
}

export interface GroupedAppointments<T extends GroupableAppointment> {
    /** Something only the current user can unblock (confirm, evaluate). */
    needsAction: T[]
    /** Future sessions, soonest first — confirmed or still awaiting the other side. */
    upcoming: T[]
    /** Everything that is over: done, cancelled, rejected or expired. Newest first. */
    history: T[]
}

const endOf = (a: GroupableAppointment) =>
    new Date(a.scheduled_at).getTime() + (a.duration_minutes || 0) * 60_000

const byDateAsc = (a: GroupableAppointment, b: GroupableAppointment) =>
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()

/**
 * Splits appointments into action / upcoming / history for one perspective.
 *
 * - Mentor perspective: a future `pending` request needs the mentor's answer.
 * - Mentee perspective: a finished session (confirmed or completed) without
 *   the mentee's feedback needs an evaluation — evaluations are mentee-only
 *   by design (see STATUS.md, "Mentorship Evaluation Model").
 */
export function groupAppointments<T extends GroupableAppointment>(
    appointments: T[],
    perspective: Perspective,
    currentUserId: string,
    now: Date = new Date()
): GroupedAppointments<T> {
    const nowMs = now.getTime()
    const result: GroupedAppointments<T> = { needsAction: [], upcoming: [], history: [] }

    for (const a of appointments) {
        const isPast = endOf(a) < nowMs
        const evaluated = (a.feedbacks || []).some((f) => f.reviewer_id === currentUserId)

        if (a.status === 'cancelled' || a.status === 'rejected') {
            result.history.push(a)
        } else if (a.status === 'pending') {
            if (isPast) result.history.push(a)
            else if (perspective === 'mentor') result.needsAction.push(a)
            else result.upcoming.push(a)
        } else if (a.status === 'confirmed' || a.status === 'completed') {
            if (!isPast) result.upcoming.push(a)
            else if (perspective === 'mentee' && !evaluated) result.needsAction.push(a)
            else result.history.push(a)
        } else {
            result.history.push(a)
        }
    }

    result.needsAction.sort(byDateAsc)
    result.upcoming.sort(byDateAsc)
    result.history.sort((a, b) => byDateAsc(b, a))
    return result
}

/** The next confirmed session, if any — drives the "Próxima sessão" highlight. */
export function nextConfirmedSession<T extends GroupableAppointment>(upcoming: T[]): T | undefined {
    return upcoming.find((a) => a.status === 'confirmed')
}
