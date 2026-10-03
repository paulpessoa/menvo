import { splitMenteeFields, withMenteeFields } from "./mentee-profile-fields"

describe("splitMenteeFields", () => {
  it("separates academic fields from profile fields and drops undefined", () => {
    const { profile, mentee } = splitMenteeFields({
      bio: "oi",
      institution: "UFPE",
      learning_goals: undefined,
      course: "CC",
    })
    expect(profile).toEqual({ bio: "oi" })
    expect(mentee).toEqual({ institution: "UFPE", course: "CC" })
  })

  it("stores an empty cv_url as null", () => {
    expect(splitMenteeFields({ cv_url: "" }).mentee).toEqual({ cv_url: null })
  })
})

describe("withMenteeFields", () => {
  it("flattens the embed (object or array) and nulls missing fields", () => {
    const obj = withMenteeFields({ id: "1", mentee_profiles: { institution: "UFPE" } })
    expect(obj).toMatchObject({ id: "1", institution: "UFPE", course: null, cv_url: null })
    expect(obj).not.toHaveProperty("mentee_profiles")

    const arr = withMenteeFields({ id: "2", mentee_profiles: [{ course: "CC" }] })
    expect(arr.course).toBe("CC")
  })

  it("returns nulls when the person has no mentee_profiles row", () => {
    expect(withMenteeFields({ id: "3", mentee_profiles: null }).learning_goals).toBeNull()
  })
})
