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

beforeAll(() => {
  // A rota cria o cliente admin ao ser importada, então o ambiente precisa existir antes.
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key"
  ;({ GET } = require("./route"))
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
