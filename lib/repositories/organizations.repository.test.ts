/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createOrganizationsRepository } from "./organizations.repository"
import { RepositoryError } from "./repository-error"

/** Thenable query builder: every call returns itself, awaiting yields `result`. */
function builder(result: unknown) {
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
  return { proxy, calls }
}

function repoWith(result: unknown) {
  const q = builder(result)
  const db = { from: jest.fn(() => q.proxy) } as unknown as SupabaseClient<Database>
  return { repo: createOrganizationsRepository(db), db, calls: q.calls }
}

describe("findActiveBySlug", () => {
  it("only looks at active orgs and narrows join_policy", async () => {
    const { repo, db, calls } = repoWith({
      data: { slug: "giral", name: "Giral", type: "ngo", join_policy: "invite_only" },
      error: null,
    })
    expect(await repo.findActiveBySlug("giral")).toEqual({
      slug: "giral",
      name: "Giral",
      type: "ngo",
      join_policy: "invite_only",
    })
    expect(db.from).toHaveBeenCalledWith("organizations")
    expect(calls.eq).toEqual([
      ["slug", "giral"],
      ["status", "active"],
    ])
  })

  it("returns null when there is no such org", async () => {
    expect(await repoWith({ data: null, error: null }).repo.findActiveBySlug("nope")).toBeNull()
  })

  it("treats an unexpected join_policy as open (the CHECK constraint allows only two values)", async () => {
    const { repo } = repoWith({ data: { slug: "a", name: "A", type: "ngo", join_policy: "weird" }, error: null })
    expect((await repo.findActiveBySlug("a"))?.join_policy).toBe("open")
  })

  it("throws a RepositoryError on failure", async () => {
    const { repo } = repoWith({ data: null, error: { message: "boom" } })
    await expect(repo.findActiveBySlug("x")).rejects.toBeInstanceOf(RepositoryError)
  })
})

describe("listOpenOrganizationLinks", () => {
  it("does not query for an empty list", async () => {
    const { repo, db } = repoWith({ data: [], error: null })
    expect(await repo.listOpenOrganizationLinks([])).toEqual([])
    expect(db.from).not.toHaveBeenCalled()
  })

  it("asks for active members of active, open orgs in a single query and flattens the embed", async () => {
    const { repo, db, calls } = repoWith({
      data: [
        { user_id: "m1", organizations: { name: "Giral", slug: "giral", status: "active", join_policy: "open" } },
        { user_id: "m2", organizations: [{ name: "Porto", slug: "porto", status: "active", join_policy: "open" }] },
        { user_id: "m3", organizations: null },
      ],
      error: null,
    })
    expect(await repo.listOpenOrganizationLinks(["m1", "m2", "m3"])).toEqual([
      { user_id: "m1", name: "Giral", slug: "giral" },
      { user_id: "m2", name: "Porto", slug: "porto" },
    ])
    expect(db.from).toHaveBeenCalledTimes(1)
    expect(calls.in).toEqual([["user_id", ["m1", "m2", "m3"]]])
    expect(calls.eq).toEqual([
      ["status", "active"],
      ["organizations.status", "active"],
      ["organizations.join_policy", "open"],
    ])
  })

  it("throws a RepositoryError on failure", async () => {
    const { repo } = repoWith({ data: null, error: { message: "RLS denied" } })
    await expect(repo.listOpenOrganizationLinks(["m1"])).rejects.toBeInstanceOf(RepositoryError)
  })
})
