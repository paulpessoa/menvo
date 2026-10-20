/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"

const mockFrom = jest.fn()
const mockGetSessionUser = jest.fn()

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
    from: (...args: unknown[]) => mockFrom(...args)
  }))
}))

jest.mock("@/lib/utils/supabase/server", () => ({
  createClient: jest.fn(async () => ({ auth: { getUser: mockGetSessionUser } }))
}))

let GET: (request: NextRequest) => Promise<Response>
let PUT: (request: NextRequest) => Promise<Response>

beforeAll(() => {
  // A rota cria o cliente admin ao ser importada, então o ambiente precisa existir antes.
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key"
  ;({ GET, PUT } = require("./route"))
})

/** Simula "perfil ainda não existe" e captura o que a rota tenta inserir. */
function mockMissingProfile() {
  const inserted: any[] = []
  mockFrom.mockImplementation(() => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data: null, error: { code: "PGRST116", message: "no rows" } }) })
    }),
    insert: (row: any) => {
      inserted.push(row)
      return { select: () => ({ single: async () => ({ data: { ...row }, error: null }) }) }
    }
  }))
  return inserted
}

const get = () => GET(new NextRequest("http://localhost:3000/api/profile"))

describe("GET /api/profile: creating the profile of a new account", () => {
  beforeEach(() => jest.clearAllMocks())

  it("saves the name of a LinkedIn (OIDC) account, which has no first_name/last_name", async () => {
    const inserted = mockMissingProfile()
    mockGetSessionUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "maria.silva@example.com",
          user_metadata: { name: "Maria Silva", given_name: "Maria", family_name: "Silva" }
        }
      },
      error: null
    })

    const res = await get()

    expect(res.status).toBe(200)
    expect(inserted).toEqual([
      { id: "u1", email: "maria.silva@example.com", first_name: "Maria", last_name: "Silva" }
    ])
  })

  it("saves the name of a Google account", async () => {
    const inserted = mockMissingProfile()
    mockGetSessionUser.mockResolvedValue({
      data: {
        user: { id: "u2", email: "m@example.com", user_metadata: { full_name: "Maria da Silva", name: "Maria da Silva" } }
      },
      error: null
    })

    await get()

    expect(inserted[0]).toMatchObject({ first_name: "Maria", last_name: "da Silva" })
  })

  it("keeps working for the e-mail signup keys", async () => {
    const inserted = mockMissingProfile()
    mockGetSessionUser.mockResolvedValue({
      data: { user: { id: "u3", email: "j@example.com", user_metadata: { first_name: "João", last_name: "Souza" } } },
      error: null
    })

    await get()

    expect(inserted[0]).toMatchObject({ first_name: "João", last_name: "Souza" })
  })

  it("does not store a generic placeholder as the person's name", async () => {
    const inserted = mockMissingProfile()
    mockGetSessionUser.mockResolvedValue({
      data: { user: { id: "u4", email: "t@example.com", user_metadata: { full_name: "Usuário Teste" } } },
      error: null
    })

    await get()

    expect(inserted[0]).toMatchObject({ first_name: "", last_name: "" })
  })

  it("returns 401 without a session", async () => {
    mockGetSessionUser.mockResolvedValue({ data: { user: null }, error: { message: "no session" } })
    const res = await get()
    expect(res.status).toBe(401)
  })
})

const sessionUser = { id: "u1", email: "ana@example.com", user_metadata: {} }

const put = (body: unknown) =>
  PUT(
    new NextRequest("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )

/** Tabelas falsas de perfil; devolve o que foi escrito em cada uma. */
function mockTables(opts: { updateError?: { code?: string; message: string }; profile?: Record<string, unknown> } = {}) {
  const written: Record<string, unknown[]> = { profiles: [], mentor_profiles: [], mentee_profiles: [] }
  mockFrom.mockImplementation((table: string) => ({
    update: (fields: unknown) => {
      written[table].push(fields)
      const result = { data: { id: "u1" }, error: opts.updateError ?? null }
      return { eq: () => Object.assign(Promise.resolve(result), { select: () => ({ single: async () => result }) }) }
    },
    upsert: async (fields: unknown) => {
      written[table].push(fields)
      return { error: null }
    },
    select: () => ({
      eq: () => ({
        single: async () => ({
          data: { id: "u1", is_public: true, mentor_profiles: null, mentee_profiles: null, ...opts.profile },
          error: null,
        }),
      }),
    }),
  }))
  return written
}

describe("PUT /api/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionUser.mockResolvedValue({ data: { user: sessionUser }, error: null })
  })

  it("returns 401 without a session", async () => {
    mockGetSessionUser.mockResolvedValue({ data: { user: null }, error: { message: "no session" } })
    expect((await put({ bio: "x" })).status).toBe(401)
  })

  it("returns 400 with the first validation message", async () => {
    mockTables()
    const res = await put({ slug: "Maria Silva" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("Slug")
  })

  it("saving the pause switch keeps the rest of the profile and returns is_public (f95c9da5)", async () => {
    const written = mockTables({ profile: { is_public: false, first_name: "Ana", slug: "ana" } })
    const res = await put({ is_public: false })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe("Perfil atualizado com sucesso")
    expect(body.profile).toMatchObject({ id: "u1", is_public: false, first_name: "Ana", slug: "ana" })
    expect(written.profiles[0]).toMatchObject({ is_public: false })
    expect(written.mentor_profiles).toEqual([])
    expect(written.mentee_profiles).toEqual([])
  })

  it("writes mentor and mentee fields to their own tables", async () => {
    const written = mockTables()
    await put({ bio: "Olá", chat_enabled: true, course: "BCC" })
    expect(written.profiles[0]).toMatchObject({ bio: "Olá" })
    expect(written.mentor_profiles).toEqual([{ chat_enabled: true }])
    expect(written.mentee_profiles).toEqual([{ user_id: "u1", course: "BCC" }])
  })

  it("answers 409 for a slug already taken", async () => {
    mockTables({ updateError: { code: "23505", message: 'violates unique constraint "profiles_slug_key" (slug)' } })
    const res = await put({ slug: "ana" })
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain("slug")
  })

  it("answers 500 with the current error format on a database failure", async () => {
    mockTables({ updateError: { message: "boom" } })
    const res = await put({ bio: "x" })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Erro ao atualizar perfil", details: "boom" })
  })
})
