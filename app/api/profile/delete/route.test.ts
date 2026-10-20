/**
 * @jest-environment node
 */
import { DELETE } from "./route"
import { createClient } from "@/lib/utils/supabase/server"
import { deleteUserCompletely } from "@/lib/services/admin/delete-user.service"

jest.mock("@/lib/utils/supabase/server", () => ({ createClient: jest.fn() }))
jest.mock("@/lib/services/admin/delete-user.service", () => ({ deleteUserCompletely: jest.fn() }))

const withSession = (user: { id: string } | null, error: unknown = null) =>
  (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: async () => ({ data: { user }, error }) } })

describe("DELETE /api/profile/delete", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("returns 401 without a session and deletes nothing", async () => {
    withSession(null, { message: "no session" })
    const res = await DELETE()
    expect(res.status).toBe(401)
    expect(deleteUserCompletely).not.toHaveBeenCalled()
  })

  it("deletes only the account of the session user, as self service", async () => {
    withSession({ id: "u1" })
    ;(deleteUserCompletely as jest.Mock).mockResolvedValue({ success: true, filesRemoved: 3 })
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, filesRemoved: 3 })
    expect(deleteUserCompletely).toHaveBeenCalledWith("u1", { source: "self_service" })
  })

  it("returns a generic 500 without leaking the error", async () => {
    withSession({ id: "u1" })
    ;(deleteUserCompletely as jest.Mock).mockRejectedValue(new Error("auth.users FK violation"))
    const res = await DELETE()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Internal Server Error" })
  })
})
