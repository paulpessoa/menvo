/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseOrgDirectory } from "./org-directory.supabase"

function adminWith(result: unknown) {
  const calls: Record<string, unknown[][]> = {}
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") return (resolve: (v: unknown) => unknown) => resolve(result)
        return (...args: unknown[]) => {
          ;(calls[prop] ||= []).push(args)
          return proxy
        }
      },
    }
  )
  const client = { from: jest.fn(() => proxy) } as unknown as SupabaseClient
  return { client, calls }
}

describe("createSupabaseOrgDirectory.listAdminEmails", () => {
  it("asks for ACTIVE admins of that org only and returns just e-mails", async () => {
    const { client, calls } = adminWith({
      data: [{ profiles: { email: "a@x.org" } }, { profiles: [{ email: "b@x.org" }] }, { profiles: { email: null } }, { profiles: null }],
      error: null,
    })
    const getAdmin = jest.fn(() => client)

    expect(await createSupabaseOrgDirectory(getAdmin).listAdminEmails("o1")).toEqual(["a@x.org", "b@x.org"])
    expect(client.from).toHaveBeenCalledWith("organization_members")
    expect(calls.eq).toEqual([
      ["organization_id", "o1"],
      ["role", "admin"],
      ["status", "active"],
    ])
  })

  it("does not create the privileged client until it is used", () => {
    const getAdmin = jest.fn()
    createSupabaseOrgDirectory(getAdmin)
    expect(getAdmin).not.toHaveBeenCalled()
  })

  it("throws on a database error so the service can treat it as best effort", async () => {
    const { client } = adminWith({ data: null, error: { message: "boom" } })
    await expect(createSupabaseOrgDirectory(() => client).listAdminEmails("o1")).rejects.toThrow(/boom/)
  })
})

describe("createSupabaseOrgDirectory.findAccountByEmail", () => {
  it("looks up profiles by exact e-mail and returns only id, name and e-mail", async () => {
    const { client, calls } = adminWith({ data: { id: "u1", full_name: "Ana", email: "ana@x.org", phone: "x" }, error: null })
    expect(await createSupabaseOrgDirectory(() => client).findAccountByEmail("ana@x.org")).toEqual({
      id: "u1",
      full_name: "Ana",
      email: "ana@x.org",
    })
    expect(client.from).toHaveBeenCalledWith("profiles")
    expect(calls.eq).toEqual([["email", "ana@x.org"]])
  })

  it("is null when no account has that e-mail", async () => {
    const { client } = adminWith({ data: null, error: null })
    expect(await createSupabaseOrgDirectory(() => client).findAccountByEmail("no@x.org")).toBeNull()
  })

  it("throws on a database error instead of pretending the account does not exist", async () => {
    const { client } = adminWith({ data: null, error: { message: "boom" } })
    await expect(createSupabaseOrgDirectory(() => client).findAccountByEmail("a@x.org")).rejects.toThrow(/boom/)
  })
})
