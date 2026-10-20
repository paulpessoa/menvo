import {
  onboardingFlagSchema,
  requestMentorSchema,
  roleProfileDataSchema,
  updateProfileSchema,
  updateUserRoleSchema,
} from "./profile"

describe("updateProfileSchema", () => {
  it("prepends https:// to links pasted without a scheme", () => {
    const parsed = updateProfileSchema.parse({ linkedin_url: "linkedin.com/in/maria", portfolio_url: " github.com/maria " })
    expect(parsed.linkedin_url).toBe("https://linkedin.com/in/maria")
    expect(parsed.portfolio_url).toBe("https://github.com/maria")
  })

  it("keeps empty links empty", () => {
    expect(updateProfileSchema.parse({ website_url: "" }).website_url).toBe("")
  })

  it("rejects links that are not URLs even after normalizing", () => {
    expect(updateProfileSchema.safeParse({ linkedin_url: "not a url" }).success).toBe(false)
  })

  it("drops an empty slug instead of failing the whole save", () => {
    const parsed = updateProfileSchema.parse({ slug: "", first_name: "Maria" })
    // undefined is dropped by JSON serialization, so the column is left untouched
    expect(parsed.slug).toBeUndefined()
  })

  it("still validates a non-empty slug", () => {
    expect(updateProfileSchema.safeParse({ slug: "Maria Silva" }).success).toBe(false)
    expect(updateProfileSchema.parse({ slug: "maria-silva" }).slug).toBe("maria-silva")
  })

  it("accepts learning_goals (column added in 20260923000001)", () => {
    expect(updateProfileSchema.parse({ learning_goals: "Primeiro emprego" }).learning_goals).toBe("Primeiro emprego")
  })
})

describe("roleProfileDataSchema", () => {
  it("keeps the strings and arrays the onboarding sends", () => {
    const parsed = roleProfileDataSchema.parse({
      city: "Recife",
      job_title: "Dev",
      mentorship_topics: ["carreira"],
      learning_goals: "Primeiro emprego",
    })
    expect(parsed).toMatchObject({ city: "Recife", job_title: "Dev", mentorship_topics: ["carreira"] })
  })

  it("treats null and wrong types as 'do not touch', as the route always did", () => {
    const parsed = roleProfileDataSchema.parse({ job_title: null, company: 42, expertise_areas: "x", bio: undefined })
    expect(parsed.job_title).toBeUndefined()
    expect(parsed.company).toBeUndefined()
    expect(parsed.expertise_areas).toBeUndefined()
    expect(parsed.bio).toBeUndefined()
  })

  it("drops fields the route does not write (e.g. is_public, verification_status)", () => {
    const parsed = roleProfileDataSchema.parse({ is_public: true, verification_status: "approved", city: "Recife" })
    expect(parsed).not.toHaveProperty("is_public")
    expect(parsed).not.toHaveProperty("verification_status")
  })
})

describe("updateUserRoleSchema", () => {
  it("only accepts mentor and mentee", () => {
    expect(updateUserRoleSchema.safeParse({ role: "admin" }).success).toBe(false)
    expect(updateUserRoleSchema.parse({ role: "mentee" }).role).toBe("mentee")
  })

  it("rejects a profileData that is not an object", () => {
    expect(updateUserRoleSchema.safeParse({ role: "mentee", profileData: "x" }).success).toBe(false)
  })
})

describe("onboardingFlagSchema", () => {
  it("accepts a tour id with an ISO date", () => {
    expect(onboardingFlagSchema.safeParse({ flag: "ob_m1", value: new Date().toISOString() }).success).toBe(true)
    expect(onboardingFlagSchema.safeParse({ flag: "tour-assistant-v1", value: true }).success).toBe(true)
  })

  it.each([
    [{ flag: "", value: "x" }],
    [{ flag: "a b", value: "x" }],
    [{ flag: "x".repeat(65), value: "x" }],
    [{ flag: "ob_m1" }],
    [{ flag: "ob_m1", value: { nested: "json" } }],
    [{ flag: "ob_m1", value: "x".repeat(65) }],
  ])("rejects %j", body => {
    expect(onboardingFlagSchema.safeParse(body).success).toBe(false)
  })
})

describe("requestMentorSchema", () => {
  it("trims and requires the approach", () => {
    const parsed = requestMentorSchema.parse({ mentorship_approach: "  Conversas práticas ", what_to_expect: " x " })
    expect(parsed).toEqual({ mentorship_approach: "Conversas práticas", what_to_expect: "x" })
  })

  it.each([[{}], [{ mentorship_approach: "   " }], [{ mentorship_approach: 5 }]])("rejects %j", body => {
    expect(requestMentorSchema.safeParse(body).success).toBe(false)
  })

  it("defaults a missing what_to_expect to an empty string", () => {
    expect(requestMentorSchema.parse({ mentorship_approach: "a" }).what_to_expect).toBe("")
  })
})
