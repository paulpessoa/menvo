import { updateProfileSchema } from "./profile"

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
