/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createQuizRepository } from "./quiz.repository"
import { RepositoryError } from "./repository-error"

const ID = "33333333-3333-3333-3333-333333333333"

const analysis = {
  titulo_personalizado: "t",
  resumo_motivador: "r",
  mentores_sugeridos: [],
  conselhos_praticos: [],
  proximos_passos: [],
  areas_desenvolvimento: [],
  mensagem_final: "m",
}

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

function repoWith(opts: { rpc?: unknown; table?: unknown }) {
  const q = builder(opts.table)
  const db = {
    rpc: jest.fn().mockResolvedValue(opts.rpc),
    from: jest.fn(() => q.proxy),
  } as unknown as SupabaseClient<Database>
  return { repo: createQuizRepository(db), db, calls: q.calls }
}

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}))
afterEach(() => jest.restoreAllMocks())

describe("submissionStatus", () => {
  it.each(["ip_limit", "email_limit", "budget", "ok"])("passes %s through", async (status) => {
    const { repo, db } = repoWith({ rpc: { data: status, error: null } })
    expect(await repo.submissionStatus({ email: "a@b.co", ip: "1.1.1.1", isAuth: true })).toBe(status)
    expect(db.rpc).toHaveBeenCalledWith("quiz_submission_status", { p_email: "a@b.co", p_ip: "1.1.1.1", p_is_auth: true })
  })

  it("treats an RPC error or an unknown value as ok (the insert policy still enforces it)", async () => {
    expect(await repoWith({ rpc: { data: null, error: { message: "x" } } }).repo.submissionStatus({ email: "a", ip: "i", isAuth: false })).toBe("ok")
    expect(await repoWith({ rpc: { data: "weird", error: null } }).repo.submissionStatus({ email: "a", ip: "i", isAuth: false })).toBe("ok")
  })
})

describe("insert", () => {
  it("throws a RepositoryError on failure", async () => {
    const { repo } = repoWith({ table: { error: { message: "violates policy" } } })
    await expect(repo.insert({} as never)).rejects.toBeInstanceOf(RepositoryError)
  })
})

describe("getResult", () => {
  it("returns null when the RPC has no row", async () => {
    expect(await repoWith({ rpc: { data: [], error: null } }).repo.getResult(ID)).toBeNull()
  })

  it("maps the first row and validates ai_analysis", async () => {
    const { repo } = repoWith({ rpc: { data: [{ id: ID, processed_at: "2026-10-01", ai_analysis: analysis }], error: null } })
    expect(await repo.getResult(ID)).toEqual({ id: ID, processed_at: "2026-10-01", ai_analysis: analysis })
  })

  it("an invalid ai_analysis becomes null instead of a blind cast", async () => {
    const { repo } = repoWith({ rpc: { data: [{ id: ID, processed_at: null, ai_analysis: { titulo_personalizado: "só isso" } }], error: null } })
    expect((await repo.getResult(ID))?.ai_analysis).toBeNull()
  })

  it("throws a RepositoryError when the RPC fails", async () => {
    await expect(repoWith({ rpc: { data: null, error: { message: "boom" } } }).repo.getResult(ID)).rejects.toBeInstanceOf(RepositoryError)
  })
})

describe("claimAnalysis", () => {
  it("not claimed", async () => {
    expect(await repoWith({ rpc: { data: [{ claimed: false }], error: null } }).repo.claimAnalysis("k", ID)).toEqual({ claimed: false })
  })

  it("claimed: maps the answers and defaults the nulls", async () => {
    const { repo, db } = repoWith({
      rpc: { data: [{ claimed: true, name: "Ana", career_moment: "x", development_areas: null }], error: null },
    })
    const result = await repo.claimAnalysis("k", ID)
    expect(db.rpc).toHaveBeenCalledWith("claim_quiz_analysis", { p_server_key: "k", p_id: ID })
    expect(result).toMatchObject({ claimed: true, answers: { name: "Ana", career_moment: "x", development_areas: [], current_challenge: "" } })
  })

  it("throws on RPC error", async () => {
    await expect(repoWith({ rpc: { data: null, error: { message: "x" } } }).repo.claimAnalysis("k", ID)).rejects.toBeInstanceOf(RepositoryError)
  })
})

describe("table reads and writes", () => {
  it("findLatestByEmail maps a row and defaults development_areas", async () => {
    const row = { id: ID, name: "Ana", email: "a@b.co", score: null, processed_at: null, created_at: "d", development_areas: null, career_moment: "x", ai_analysis: analysis }
    const { repo, calls } = repoWith({ table: { data: row, error: null } })
    const summary = await repo.findLatestByEmail("a@b.co")
    expect(summary).toMatchObject({ id: ID, development_areas: [], ai_analysis: analysis })
    expect(calls.eq[0]).toEqual(["email", "a@b.co"])
  })

  it("findLatestByEmail is null when there is no row", async () => {
    expect(await repoWith({ table: { data: null, error: null } }).repo.findLatestByEmail("a@b.co")).toBeNull()
  })

  it("linkUser only touches rows that still have no owner", async () => {
    const { repo, calls } = repoWith({ table: { error: null } })
    await repo.linkUser(ID, "u1")
    expect(calls.update[0]).toEqual([{ user_id: "u1" }])
    expect(calls.is[0]).toEqual(["user_id", null])
  })

  it("findForEmail is null on error or missing row", async () => {
    expect(await repoWith({ table: { data: null, error: { message: "x" } } }).repo.findForEmail(ID)).toBeNull()
    expect(await repoWith({ table: { data: null, error: null } }).repo.findForEmail(ID)).toBeNull()
  })

  it("markEmailSent does not throw when the update fails (the e-mail already went out)", async () => {
    await expect(repoWith({ table: { error: { message: "x" } } }).repo.markEmailSent(ID)).resolves.toBeUndefined()
  })
})
