import { hasPublicListing, isMentorCandidate } from "./profile.entity"

describe("isMentorCandidate", () => {
  it.each(["pending", "changes_requested", "rejected", "approved"] as const)("%s tem linha de mentor", status => {
    expect(isMentorCandidate({ verification_status: status })).toBe(true)
  })

  it("mentorado comum (sem linha em mentor_profiles) não é candidato", () => {
    expect(isMentorCandidate({ verification_status: null })).toBe(false)
  })
})

describe("hasPublicListing", () => {
  it("só aparece quando verificado e público", () => {
    expect(hasPublicListing({ verified: true, is_public: true })).toBe(true)
  })

  it.each([
    [true, false],
    [false, true],
    [false, false],
    [true, null],
  ])("verified=%s is_public=%s não aparece", (verified, isPublic) => {
    expect(hasPublicListing({ verified, is_public: isPublic })).toBe(false)
  })
})
