import { communityIdsQuerySchema, communityProfilesResponseSchema, MAX_COMMUNITY_IDS } from "./community"

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"

describe("communityIdsQuerySchema", () => {
  it("splits, trims and dedupes uuids", () => {
    expect(communityIdsQuerySchema.parse({ ids: ` ${A}, ${B},${A}` }).ids).toEqual([A, B])
  })

  it("drops hallucinated ids instead of rejecting the list", () => {
    expect(communityIdsQuerySchema.parse({ ids: `nope,${A}` }).ids).toEqual([A])
  })

  it("returns an empty list for an empty param", () => {
    expect(communityIdsQuerySchema.parse({ ids: "" }).ids).toEqual([])
  })

  it("rejects more than the maximum number of ids", () => {
    const many = Array.from({ length: MAX_COMMUNITY_IDS + 1 }, () => A).join(",")
    expect(communityIdsQuerySchema.safeParse({ ids: many }).success).toBe(false)
  })
})

describe("communityProfilesResponseSchema", () => {
  it("rejects a profile missing a column the wall uses", () => {
    expect(communityProfilesResponseSchema.safeParse({ profiles: [{ id: A }] }).success).toBe(false)
  })
})