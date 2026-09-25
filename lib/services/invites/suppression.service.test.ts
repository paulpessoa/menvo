/**
 * @jest-environment node
 */
import { hashEmail, isSuppressed, suppress } from "./suppression.service"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"

jest.mock("@/lib/utils/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(),
  ensureServerSide: jest.fn()
}))

describe("hashEmail", () => {
  it("is deterministic and case/whitespace-insensitive", () => {
    const a = hashEmail("Someone@Example.com ")
    const b = hashEmail(" someone@example.com")
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it("never returns the plaintext email", () => {
    expect(hashEmail("someone@example.com")).not.toContain("someone")
  })
})

describe("isSuppressed / suppress", () => {
  let maybeSingle: jest.Mock
  let eq: jest.Mock
  let select: jest.Mock
  let upsert: jest.Mock
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    maybeSingle = jest.fn()
    eq = jest.fn().mockReturnValue({ maybeSingle })
    select = jest.fn().mockReturnValue({ eq })
    upsert = jest.fn().mockResolvedValue({ error: null })
    mockSupabase = { from: jest.fn().mockReturnValue({ select, upsert }) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it("returns false when the email is not suppressed", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(isSuppressed("new@example.com")).resolves.toBe(false)
  })

  it("returns true when a matching hash exists", async () => {
    maybeSingle.mockResolvedValue({ data: { email_hash: hashEmail("gone@example.com") }, error: null })
    await expect(isSuppressed("gone@example.com")).resolves.toBe(true)
  })

  it("throws on a query error", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: new Error("db down") })
    await expect(isSuppressed("x@example.com")).rejects.toThrow("db down")
  })

  it("upserts the hashed email with the given reason", async () => {
    await suppress("Person@Example.com", "deleted")
    expect(mockSupabase.from).toHaveBeenCalledWith("email_suppressions")
    expect(upsert).toHaveBeenCalledWith(
      { email_hash: hashEmail("person@example.com"), reason: "deleted" },
      { onConflict: "email_hash" }
    )
  })
})
