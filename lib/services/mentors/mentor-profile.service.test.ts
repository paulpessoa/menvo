import type { AvailabilitySlot } from "@/lib/domain/mentors/availability.entity"
import type { PublicMentor } from "@/lib/domain/mentors/mentor.entity"
import type { MentorAvailabilityRepository } from "@/lib/repositories/mentor-availability.repository"
import type { MentorsRepository } from "@/lib/repositories/mentors.repository"
import { createMentorProfileService } from "./mentor-profile.service"

const mentor = { id: "m1", slug: "ana", full_name: "Ana" } as PublicMentor
const slot = { id: "s1", mentor_id: "m1" } as AvailabilitySlot

/** Fakes em memória das duas interfaces; `broken` faz o método lançar. */
function setup(opts: { mentor?: PublicMentor | null; broken?: "mentors" | "availability" } = {}) {
  const names: string[][] = []
  const mentors: MentorsRepository = {
    async findPublicBySlugOrId(slugOrId) {
      if (opts.broken === "mentors") throw new Error("db down")
      return slugOrId === "ana" ? (opts.mentor === undefined ? mentor : opts.mentor) : null
    },
    async findApproachBySlugOrId(slugOrId) {
      if (opts.broken === "mentors") throw new Error("db down")
      return slugOrId === "ana" ? { mentorship_approach: "escuta", what_to_expect: null } : null
    },
    async findSlugsByNames(list) {
      names.push(list)
      return list.map((full_name) => ({ id: "x", full_name, slug: "x" }))
    },
  }
  const availability: MentorAvailabilityRepository = {
    async listByMentor() {
      if (opts.broken === "availability") throw new Error("db down")
      return [slot]
    },
    async replaceOwn() {
      return []
    },
  }
  return { service: createMentorProfileService({ mentors, availability }), names }
}

describe("mentor profile service", () => {
  it("returns the public profile with its schedule", async () => {
    expect(await setup().service.getPublicProfile("ana")).toEqual({ kind: "ok", mentor, availability: [slot] })
  })

  it("is not_found for a mentor the directory hides", async () => {
    expect(await setup().service.getPublicProfile("ghost")).toEqual({ kind: "not_found" })
  })

  it("opens the profile without slots when only the schedule fails", async () => {
    expect(await setup({ broken: "availability" }).service.getPublicProfile("ana")).toEqual({
      kind: "ok",
      mentor,
      availability: [],
    })
  })

  it("treats a database error on the profile as not_found instead of crashing the page", async () => {
    expect(await setup({ broken: "mentors" }).service.getPublicProfile("ana")).toEqual({ kind: "not_found" })
  })

  it("only gives the approach texts to logged-in users", async () => {
    const { service } = setup()
    expect(await service.getApproach("ana", false)).toEqual({ kind: "unauthorized" })
    expect(await service.getApproach("ana", true)).toEqual({
      kind: "ok",
      approach: { mentorship_approach: "escuta", what_to_expect: null },
    })
    expect(await service.getApproach("ghost", true)).toEqual({ kind: "not_found" })
  })

  it("dedupes, trims and caps names before resolving slugs", async () => {
    const { service, names } = setup()
    const many = Array.from({ length: 30 }, (_, i) => `Nome ${i}`)
    await service.resolveSlugs([" Ana ", "Ana", "", ...many])
    expect(names[0][0]).toBe("Ana")
    expect(names[0]).toHaveLength(20)
  })
})
