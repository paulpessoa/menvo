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

describe("findById", () => {
  it("returns the whole row, or null", async () => {
    expect(await repoWith({ data: { id: "o1" }, error: null }).repo.findById("o1")).toEqual({ id: "o1" })
    expect(await repoWith({ data: null, error: null }).repo.findById("o1")).toBeNull()
  })

  it("throws a RepositoryError on failure", async () => {
    await expect(repoWith({ data: null, error: { message: "x" } }).repo.findById("o1")).rejects.toBeInstanceOf(RepositoryError)
  })
})

describe("listMembers", () => {
  it("embeds the profile in one query and maps it (object or array embed)", async () => {
    const { repo, calls } = repoWith({
      data: [
        { user_id: "u1", role: "admin", status: "active", created_at: "2026-01-02", profiles: { id: "u1", full_name: "A", email: "a@x" } },
        { user_id: "u2", role: "member", status: "invited", created_at: "2026-01-01", profiles: [{ id: "u2", full_name: null, email: "b@x" }] },
        { user_id: "u3", role: "member", status: "requested", created_at: "2026-01-01", profiles: null },
      ],
      error: null,
    })
    const members = await repo.listMembers("o1")
    expect(members).toEqual([
      { user_id: "u1", role: "admin", status: "active", created_at: "2026-01-02", profile: { id: "u1", full_name: "A", email: "a@x" } },
      { user_id: "u2", role: "member", status: "invited", created_at: "2026-01-01", profile: { id: "u2", full_name: null, email: "b@x" } },
      { user_id: "u3", role: "member", status: "requested", created_at: "2026-01-01", profile: null },
    ])
    expect(calls.eq).toEqual([["organization_id", "o1"]])
    expect(calls.order).toEqual([["created_at", { ascending: false }]])
  })
})

describe("listAppointments", () => {
  const row = (id: string, feedbacks: { rating: number | null }[]) => ({
    id,
    mentee_id: "u1",
    mentor_id: "u2",
    status: "completed",
    duration_minutes: 30,
    scheduled_at: "2026-10-01",
    appointment_feedbacks: feedbacks,
  })

  it("does not query without members", async () => {
    const { repo, db } = repoWith({ data: [], error: null })
    expect(await repo.listAppointments([], "mentee", null)).toEqual([])
    expect(db.from).not.toHaveBeenCalled()
  })

  it("filters by mentee or mentor column and keeps only numeric ratings", async () => {
    const { repo, calls } = repoWith({ data: [row("a1", [{ rating: 5 }, { rating: null }])], error: null })
    expect(await repo.listAppointments(["u1"], "mentor", null)).toEqual([
      { id: "a1", mentee_id: "u1", mentor_id: "u2", status: "completed", duration_minutes: 30, ratings: [5] },
    ])
    expect(calls.in).toEqual([["mentor_id", ["u1"]]])
    expect(calls.gte).toBeUndefined()
  })

  it("applies the period start on scheduled_at", async () => {
    const { repo, calls } = repoWith({ data: [], error: null })
    await repo.listAppointments(["u1"], "mentee", "2026-09-19T00:00:00.000Z")
    expect(calls.in).toEqual([["mentee_id", ["u1"]]])
    expect(calls.gte).toEqual([["scheduled_at", "2026-09-19T00:00:00.000Z"]])
  })

  it("splits a big member list into chunks so the URL stays small", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `u${i}`)
    const { repo, calls } = repoWith({ data: [], error: null })
    await repo.listAppointments(ids, "mentee", null)
    expect(calls.in?.map(([, chunk]) => (chunk as string[]).length)).toEqual([100, 100, 50])
  })

  it("throws a RepositoryError on failure", async () => {
    const { repo } = repoWith({ data: null, error: { message: "x" } })
    await expect(repo.listAppointments(["u1"], "mentee", null)).rejects.toBeInstanceOf(RepositoryError)
  })
})

describe("listUserRoleNames", () => {
  it("groups role names per user (object or array embed) and skips rows without a role", async () => {
    const { repo } = repoWith({
      data: [
        { user_id: "u1", roles: { name: "mentee" } },
        { user_id: "u1", roles: [{ name: "mentor" }] },
        { user_id: "u2", roles: null },
      ],
      error: null,
    })
    const map = await repo.listUserRoleNames(["u1", "u2"])
    expect(map.get("u1")).toEqual(["mentee", "mentor"])
    expect(map.has("u2")).toBe(false)
  })

  it("throws a RepositoryError on failure", async () => {
    await expect(repoWith({ data: null, error: { message: "x" } }).repo.listUserRoleNames(["u1"])).rejects.toBeInstanceOf(RepositoryError)
  })
})

describe("quizDoneEmails", () => {
  function repoWithRpc(result: unknown) {
    const db = { rpc: jest.fn().mockResolvedValue(result) } as unknown as SupabaseClient<Database>
    return { repo: createOrganizationsRepository(db), db }
  }

  it("returns the e-mails from the RPC", async () => {
    const { repo, db } = repoWithRpc({ data: [{ email: "a@x" }, { email: "b@x" }], error: null })
    expect(await repo.quizDoneEmails("o1")).toEqual(["a@x", "b@x"])
    expect(db.rpc).toHaveBeenCalledWith("org_members_quiz_done", { p_org: "o1" })
  })

  it("degrades to empty (and warns) when the RPC fails", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
    expect(await repoWithRpc({ data: null, error: { message: "denied" } }).repo.quizDoneEmails("o1")).toEqual([])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe("listAdminOrganizations", () => {
  it("asks for active admin rows of the user and flattens the embedded org", async () => {
    const { repo, calls } = repoWith({
      data: [
        { organization_id: "o1", organizations: { id: "o1", slug: "giral", name: "Giral" } },
        { organization_id: "o2", organizations: [{ id: "o2", slug: "porto", name: "Porto" }] },
        { organization_id: "o3", organizations: null },
      ],
      error: null,
    })
    expect(await repo.listAdminOrganizations("u1")).toEqual([
      { id: "o1", slug: "giral", name: "Giral" },
      { id: "o2", slug: "porto", name: "Porto" },
    ])
    expect(calls.eq).toEqual([
      ["user_id", "u1"],
      ["role", "admin"],
      ["status", "active"],
    ])
  })
})
