import { orgPublicService } from "./org-public.service"

describe("orgPublicService.getOpenOrganizationsForMentors", () => {
  it("returns an empty map when mentorIds is empty", async () => {
    const mockSupabase = {
      from: jest.fn(),
    } as any

    const result = await orgPublicService.getOpenOrganizationsForMentors([], mockSupabase)
    expect(result.size).toBe(0)
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it("returns mentor-to-organization mapping for active open organizations", async () => {
    const mockData = [
      {
        user_id: "mentor-1",
        organizations: {
          name: "Giral",
          slug: "giral",
          status: "active",
          join_policy: "open",
        },
      },
      {
        user_id: "mentor-2",
        organizations: {
          name: "Porto Digital",
          slug: "porto-digital",
          status: "active",
          join_policy: "open",
        },
      },
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(function (this: any) {
        return this
      }),
    }
    // Final chain returns the data
    ;(mockQuery as any).eq = jest.fn().mockImplementation(function (this: any, col: string) {
      if (col === "organizations.join_policy") {
        return Promise.resolve({ data: mockData, error: null })
      }
      return this
    })

    const mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery),
    } as any

    const result = await orgPublicService.getOpenOrganizationsForMentors(
      ["mentor-1", "mentor-2", "mentor-3"],
      mockSupabase
    )

    expect(result.size).toBe(2)
    expect(result.get("mentor-1")).toEqual({ name: "Giral", slug: "giral" })
    expect(result.get("mentor-2")).toEqual({ name: "Porto Digital", slug: "porto-digital" })
    expect(result.get("mentor-3")).toBeUndefined()
  })

  it("gracefully returns empty map on query error", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(function (this: any, col: string) {
        if (col === "organizations.join_policy") {
          return Promise.resolve({ data: null, error: { message: "RLS denied" } })
        }
        return this
      }),
    }

    const mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery),
    } as any

    const result = await orgPublicService.getOpenOrganizationsForMentors(["mentor-1"], mockSupabase)
    expect(result.size).toBe(0)
  })
})
