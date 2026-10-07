/**
 * @jest-environment node
 */
import { extractIdentity, planNameFix, syncProfileIdentity } from "./oauth-identity"

// Formato real do user_metadata que o Supabase guarda para cada provedor.
const google = {
  iss: "https://accounts.google.com",
  sub: "1234567890",
  name: "Maria Silva",
  full_name: "Maria Silva",
  given_name: "Maria",
  family_name: "Silva",
  avatar_url: "https://lh3.googleusercontent.com/a/x",
  picture: "https://lh3.googleusercontent.com/a/x",
  email: "maria.silva@example.com",
  email_verified: true,
  provider_id: "1234567890"
}

const linkedin = {
  iss: "https://www.linkedin.com",
  sub: "AbCdEf",
  name: "Maria Silva",
  given_name: "Maria",
  family_name: "Silva",
  picture: "https://media.licdn.com/x",
  locale: { country: "BR", language: "pt" }, // objeto, não texto
  email: "maria.silva@example.com",
  email_verified: true,
  provider_id: "AbCdEf"
}

describe("extractIdentity", () => {
  it("reads Google (full_name / given_name / family_name)", () => {
    expect(extractIdentity(google)).toEqual({ firstName: "Maria", lastName: "Silva" })
  })

  it("reads LinkedIn OIDC, which has no full_name, first_name or last_name", () => {
    expect(extractIdentity(linkedin)).toEqual({ firstName: "Maria", lastName: "Silva" })
  })

  it("reads the app's own e-mail signup keys", () => {
    expect(extractIdentity({ first_name: "Maria", last_name: "Silva", full_name: "Maria Silva" })).toEqual({
      firstName: "Maria",
      lastName: "Silva"
    })
  })

  it("splits a lone `name` (GitHub-style) into first and last", () => {
    expect(extractIdentity({ name: "Maria da Silva" })).toEqual({ firstName: "Maria", lastName: "da Silva" })
  })

  it("handles a single-word name", () => {
    expect(extractIdentity({ name: "Madonna" })).toEqual({ firstName: "Madonna", lastName: "" })
  })

  it("derives the surname from the full name when only the first name is explicit", () => {
    expect(extractIdentity({ given_name: "Ana", name: "Ana Maria Souza" })).toEqual({
      firstName: "Ana",
      lastName: "Maria Souza"
    })
  })

  it("does not mix an explicit first name with an unrelated full name", () => {
    expect(extractIdentity({ given_name: "Ana", name: "Carlos Souza" })).toEqual({ firstName: "Ana", lastName: "" })
  })

  it("ignores the generic seed name, so a placeholder is never propagated", () => {
    expect(extractIdentity({ full_name: "Usuário Teste" })).toEqual({ firstName: "", lastName: "" })
    expect(extractIdentity({ first_name: "Usuário", last_name: "Teste" })).toEqual({ firstName: "", lastName: "" })
  })

  it("ignores non-text values and missing metadata", () => {
    expect(extractIdentity({ name: 123, given_name: { x: 1 } } as any)).toEqual({ firstName: "", lastName: "" })
    expect(extractIdentity(null)).toEqual({ firstName: "", lastName: "" })
    expect(extractIdentity(undefined)).toEqual({ firstName: "", lastName: "" })
  })

  it("cleans messy whitespace", () => {
    expect(extractIdentity({ name: "  Maria    Silva " })).toEqual({ firstName: "Maria", lastName: "Silva" })
  })
})

describe("planNameFix", () => {
  const identity = { firstName: "Maria", lastName: "Silva" }

  it("fills an empty name (what LinkedIn/Google users ended up with)", () => {
    expect(planNameFix({ first_name: "", last_name: "" }, identity)).toEqual({
      first_name: "Maria",
      last_name: "Silva"
    })
    expect(planNameFix({ first_name: null, last_name: null }, identity)).toEqual({
      first_name: "Maria",
      last_name: "Silva"
    })
  })

  it("replaces the generic 'Usuário Teste' with the real name", () => {
    expect(planNameFix({ first_name: "Usuário", last_name: "Teste" }, identity)).toEqual({
      first_name: "Maria",
      last_name: "Silva"
    })
  })

  it("NEVER overwrites a real name", () => {
    expect(planNameFix({ first_name: "Poli", last_name: "C." }, identity)).toBeNull()
    expect(planNameFix({ first_name: "Maria", last_name: "Silva" }, identity)).toBeNull()
  })

  it("fills only the missing part of a partial name", () => {
    expect(planNameFix({ first_name: "Maria", last_name: "" }, identity)).toEqual({ last_name: "Silva" })
    expect(planNameFix({ first_name: "", last_name: "Silva" }, identity)).toEqual({ first_name: "Maria" })
  })

  it("does nothing when the provider gave no usable name", () => {
    expect(planNameFix({ first_name: "", last_name: "" }, { firstName: "", lastName: "" })).toBeNull()
  })

  it("does nothing when the profile already matches", () => {
    expect(planNameFix({ first_name: "Maria", last_name: "Silva" }, identity)).toBeNull()
  })
})

/** Cliente Supabase falso: devolve o perfil e registra o que foi gravado. */
function makeClient(profile: any, { readError = null, writeError = null }: { readError?: any; writeError?: any } = {}) {
  const writes: any[] = []
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    update: jest.fn((patch: any) => {
      writes.push(patch)
      return { eq: jest.fn(async () => ({ error: writeError })) }
    }),
    maybeSingle: jest.fn(async () => ({ data: profile, error: readError }))
  }
  return { client: { from: jest.fn(() => builder) } as any, writes, builder }
}

describe("syncProfileIdentity", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  it("saves the LinkedIn name into an empty profile", async () => {
    const { client, writes } = makeClient({ first_name: "", last_name: "" })
    const result = await syncProfileIdentity(client, { id: "u1", user_metadata: linkedin })

    expect(result).toEqual({ updated: true })
    expect(writes).toEqual([{ first_name: "Maria", last_name: "Silva" }])
  })

  it("fixes a profile stuck on 'Usuário Teste' using the Google name", async () => {
    const { client, writes } = makeClient({ first_name: "Usuário", last_name: "Teste" })
    await syncProfileIdentity(client, { id: "u1", user_metadata: google })
    expect(writes).toEqual([{ first_name: "Maria", last_name: "Silva" }])
  })

  it("leaves a real, user-chosen name alone", async () => {
    const { client, writes } = makeClient({ first_name: "Poli", last_name: "Silva" })
    const result = await syncProfileIdentity(client, { id: "u1", user_metadata: google })

    expect(result).toEqual({ updated: false })
    expect(writes).toHaveLength(0)
  })

  it("does not touch the database when the provider sent no name", async () => {
    const { client } = makeClient({ first_name: "", last_name: "" })
    await syncProfileIdentity(client, { id: "u1", user_metadata: { email: "x@y.com" } })
    expect(client.from).not.toHaveBeenCalled()
  })

  it("does not create a profile that does not exist yet", async () => {
    const { client, writes } = makeClient(null)
    const result = await syncProfileIdentity(client, { id: "u1", user_metadata: google })

    expect(result).toEqual({ updated: false })
    expect(writes).toHaveLength(0)
  })

  it("only writes the signed-in user's own row", async () => {
    const { client, builder } = makeClient({ first_name: "", last_name: "" })
    await syncProfileIdentity(client, { id: "user-42", user_metadata: google })
    expect(builder.eq).toHaveBeenCalledWith("id", "user-42")
  })

  it("never throws: a read error, write error or exception just returns updated=false", async () => {
    expect(
      await syncProfileIdentity(makeClient(null, { readError: { message: "boom" } }).client, { id: "u", user_metadata: google })
    ).toEqual({ updated: false })

    expect(
      await syncProfileIdentity(makeClient({ first_name: "", last_name: "" }, { writeError: { message: "rls" } }).client, {
        id: "u",
        user_metadata: google
      })
    ).toEqual({ updated: false })

    const exploding: any = { from: () => { throw new Error("network") } }
    await expect(syncProfileIdentity(exploding, { id: "u", user_metadata: google })).resolves.toEqual({ updated: false })
  })

  it("does not log the person's name on failure", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    await syncProfileIdentity(makeClient({ first_name: "", last_name: "" }, { writeError: { message: "rls" } }).client, {
      id: "u1",
      user_metadata: google
    })
    expect(JSON.stringify(spy.mock.calls)).not.toContain("Maria")
  })
})
