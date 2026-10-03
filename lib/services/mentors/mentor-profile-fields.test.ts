import {
  MENTOR_EDITABLE_FIELDS,
  MENTOR_PROFILE_EMBED,
  splitMentorFields,
  withMentorFields,
} from "./mentor-profile-fields"

describe("MENTOR_PROFILE_EMBED", () => {
  it("reads every editable field plus the verification status, never the admin notes", () => {
    for (const field of MENTOR_EDITABLE_FIELDS) expect(MENTOR_PROFILE_EMBED).toContain(field)
    expect(MENTOR_PROFILE_EMBED).toContain("verification_status")
    expect(MENTOR_PROFILE_EMBED).not.toContain("verification_notes")
  })
})

describe("splitMentorFields", () => {
  it("sends mentor-only fields to mentor_profiles and the rest to profiles", () => {
    const { profile, mentor } = splitMentorFields({
      bio: "Oi",
      job_title: "Dev",
      expertise_areas: ["React"],
      inclusive_tags: ["LGBTQIA+"],
      chat_enabled: true,
      mentorship_approach: "Conversa",
    })

    expect(profile).toEqual({ bio: "Oi", job_title: "Dev", expertise_areas: ["React"] })
    expect(mentor).toEqual({ inclusive_tags: ["LGBTQIA+"], chat_enabled: true, mentorship_approach: "Conversa" })
  })

  it("drops undefined values and never lets verification fields through as mentor fields", () => {
    const { profile, mentor } = splitMentorFields({
      bio: undefined,
      verification_status: "approved",
      experience_years: null,
    })

    expect(mentor).toEqual({ experience_years: null })
    expect(profile).toEqual({ verification_status: "approved" })
  })
})

describe("withMentorFields", () => {
  it("flattens the embed and derives verified from verification_status", () => {
    const row = withMentorFields({
      id: "1",
      mentor_profiles: { verification_status: "approved", verified_at: "2026-10-01", chat_enabled: true },
    })

    expect(row).toMatchObject({ id: "1", verified: true, is_pending_mentor: false, chat_enabled: true })
    expect(row).not.toHaveProperty("mentor_profiles")
  })

  it("marks pending applicants and accepts the array form of the embed", () => {
    const row = withMentorFields({ id: "2", mentor_profiles: [{ verification_status: "pending" }] })
    expect(row).toMatchObject({ verified: false, is_pending_mentor: true, verification_status: "pending" })
  })

  it("treats a missing mentor row as not a mentor", () => {
    const row = withMentorFields({ id: "3", mentor_profiles: null })
    expect(row).toMatchObject({
      verified: false,
      is_pending_mentor: false,
      verification_status: null,
      availability_status: "available",
      inclusive_tags: null,
    })
  })
})
