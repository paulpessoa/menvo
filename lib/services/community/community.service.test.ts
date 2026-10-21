import type { CommunityRepository } from "@/lib/repositories/community.repository"
import { createCommunityService, sanitizeSearchTerm } from "./community.service"

function fakeRepo(overrides: Partial<CommunityRepository> = {}): jest.Mocked<CommunityRepository> {
  return {
    listMentorIds: jest.fn(async () => ["m1"]),
    searchMentees: jest.fn(async () => ({ profiles: [], totalCount: 0 })),
    findByIds: jest.fn(async () => []),
    listFilterSources: jest.fn(async () => []),
    ...overrides,
  } as jest.Mocked<CommunityRepository>
}

describe("community service", () => {
  it("sanitizes terms that could break out of a PostgREST or()", () => {
    expect(sanitizeSearchTerm("a,b)(*%")).toBe("a b")
  })

  it("computes the range from page and limit and excludes mentors", async () => {
    const repo = fakeRepo()
    await createCommunityService({ community: repo }).getCommunityProfiles({ page: 2, limit: 10, search: " x,y " })
    expect(repo.searchMentees).toHaveBeenCalledWith(
      expect.objectContaining({ from: 20, to: 29, search: "x y", sortBy: "newest" }),
      ["m1"]
    )
  })

  it("ignores organization 'all' and reports hasMore", async () => {
    const profiles = [{ id: "p" }] as never
    const repo = fakeRepo({ searchMentees: jest.fn(async () => ({ profiles, totalCount: 30 })) })
    const out = await createCommunityService({ community: repo }).getCommunityProfiles({ organization: "all" })
    expect(repo.searchMentees.mock.calls[0][0].organization).toBeUndefined()
    expect(out.hasMore).toBe(true)
  })

  it("builds sorted, deduped filter options from company, institution and topics", async () => {
    const repo = fakeRepo({
      listFilterSources: jest.fn(async () => [
        { company: "B", mentorship_topics: ["z", "a"], mentee_profiles: { institution: "A" } },
        { company: "B", mentorship_topics: null, mentee_profiles: [{ institution: null }] },
      ]),
    })
    expect(await createCommunityService({ community: repo }).getFilterOptions()).toEqual({
      organizations: ["A", "B"],
      topics: ["a", "z"],
    })
  })
})