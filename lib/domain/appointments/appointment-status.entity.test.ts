import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TRANSITIONS,
  InvalidTransitionError,
  TRANSITION_ACTORS,
  allowedActors,
  assertTransition,
  canTransition,
  isAppointmentStatus,
  isTerminal,
  nextStatuses,
  type AppointmentStatus,
  type TransitionActor,
} from "./appointment-status.entity"

/**
 * Tabela esperada, escrita de novo por extenso (não derivada da constante) para
 * que mudar a regra exija mudar o teste de propósito. O trigger SQL deve ter os
 * mesmos pares.
 */
const EXPECTED: Record<string, TransitionActor[]> = {
  "pending>confirmed": ["mentor"],
  "pending>cancelled": ["mentor", "mentee", "admin", "system"],
  "confirmed>completed": ["mentor", "mentee", "system"],
  "confirmed>cancelled": ["mentor", "mentee", "admin", "system"],
  "completed>cancelled": ["mentor", "admin"],
}

describe("appointment status transitions", () => {
  describe.each(APPOINTMENT_STATUSES)("from %s", (from) => {
    describe.each(APPOINTMENT_STATUSES)("to %s", (to) => {
      describe.each(TRANSITION_ACTORS)("by %s", (actor) => {
        const expectedActors = EXPECTED[`${from}>${to}`] ?? []
        const sameState = from === to
        const allowed = sameState || expectedActors.includes(actor)

        it(`${allowed ? "allows" : "refuses"}`, () => {
          expect(canTransition(from, to, actor)).toBe(allowed)
          if (allowed) {
            expect(() => assertTransition(from, to, actor)).not.toThrow()
          } else {
            expect(() => assertTransition(from, to, actor)).toThrow(InvalidTransitionError)
          }
        })
      })
    })
  })

  it("the constant covers exactly the expected pairs", () => {
    const pairs = APPOINTMENT_STATUSES.flatMap((from) =>
      Object.keys(APPOINTMENT_TRANSITIONS[from]).map((to) => `${from}>${to}`)
    )
    expect(pairs.sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  it("never allows leaving cancelled, whoever asks", () => {
    for (const to of APPOINTMENT_STATUSES) {
      for (const actor of TRANSITION_ACTORS) {
        if (to !== "cancelled") expect(canTransition("cancelled", to, actor)).toBe(false)
      }
    }
    expect(isTerminal("cancelled")).toBe(true)
    expect(isTerminal("pending")).toBe(false)
  })

  it("blocks the impossible transition the hardening plan names (cancelled -> completed)", () => {
    expect(() => assertTransition("cancelled", "completed", "admin")).toThrow(/cancelled -> completed/)
  })

  it("the mentee cannot confirm their own request, nor undo a completed session", () => {
    expect(canTransition("pending", "confirmed", "mentee")).toBe(false)
    expect(canTransition("completed", "cancelled", "mentee")).toBe(false)
  })

  it("distinguishes an impossible pair (409) from the wrong actor (403)", () => {
    const pair = (() => {
      try {
        assertTransition("cancelled", "confirmed", "mentor")
      } catch (e) {
        return e as InvalidTransitionError
      }
    })()
    expect(pair?.code).toBe("INVALID_TRANSITION")

    const actor = (() => {
      try {
        assertTransition("pending", "confirmed", "mentee")
      } catch (e) {
        return e as InvalidTransitionError
      }
    })()
    expect(actor?.code).toBe("TRANSITION_FORBIDDEN")
    expect(actor).toMatchObject({ from: "pending", to: "confirmed", actor: "mentee" })
  })

  it("treats repeating the same state as a no-op for everyone", () => {
    for (const status of APPOINTMENT_STATUSES) {
      for (const actor of TRANSITION_ACTORS) {
        expect(canTransition(status, status, actor)).toBe(true)
      }
    }
  })

  it("allowedActors and nextStatuses agree with the table", () => {
    expect(allowedActors("pending", "confirmed")).toEqual(["mentor"])
    expect(allowedActors("cancelled", "pending")).toEqual([])
    expect(nextStatuses("pending", "mentor")).toEqual(["confirmed", "cancelled"])
    expect(nextStatuses("completed", "mentee")).toEqual([])
    expect(nextStatuses("confirmed", "system")).toEqual(["completed", "cancelled"])
  })

  it("isAppointmentStatus accepts the four database values and nothing else", () => {
    for (const s of APPOINTMENT_STATUSES) expect(isAppointmentStatus(s)).toBe(true)
    const outside: unknown[] = ["rejected", "expired", "PENDING", "", null, undefined, 1]
    for (const v of outside) expect(isAppointmentStatus(v)).toBe(false)
  })

  it("types: AppointmentStatus is the union of the constant", () => {
    const s: AppointmentStatus = "pending"
    expect(APPOINTMENT_STATUSES).toContain(s)
  })
})
