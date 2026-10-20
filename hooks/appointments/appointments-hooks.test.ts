import { appointmentsEffects } from "@/lib/query/effects/appointments"
import { appointmentsKeys } from "@/lib/query/keys/appointments"

describe("appointments query layer", () => {
  it("every key starts with the domain root", () => {
    expect(appointmentsKeys.mine("mentor", "u1")[0]).toBe("appointments")
    expect(appointmentsKeys.list("u1", { limit: 10 })[0]).toBe("appointments")
    expect(appointmentsKeys.availability("m1", {})[0]).toBe("appointments")
  })

  it("every mutation invalidates the whole domain", () => {
    for (const [name, effect] of Object.entries(appointmentsEffects)) {
      expect(name.startsWith("appointments.")).toBe(true)
      expect((effect as () => unknown)()).toEqual([appointmentsKeys.all])
    }
  })
})
