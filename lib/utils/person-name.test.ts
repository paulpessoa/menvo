import { isPlaceholderName, normalizeName, splitFullName } from "./person-name"

describe("normalizeName", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeName("  Maria   da   Silva \n")).toBe("Maria da Silva")
  })

  it.each([null, undefined, 42, {}, ["Maria"]])("returns '' for non-string %p", value => {
    expect(normalizeName(value)).toBe("")
  })

  it("caps the length", () => {
    expect(normalizeName("a".repeat(500))).toHaveLength(100)
  })
})

describe("isPlaceholderName", () => {
  it.each(["", "   ", null, undefined, "Usuário", "usuario", "Usuário Teste", "USUARIO  TESTE", "Teste", "Test", "User"])(
    "flags %p",
    value => expect(isPlaceholderName(value as any)).toBe(true)
  )

  it.each(["Maria Silva", "Ana Souza", "Teste Silva Souza", "Usuário Silva", "João"])(
    "keeps the real name %p",
    value => expect(isPlaceholderName(value)).toBe(false)
  )
})

describe("splitFullName", () => {
  it("splits on the first space", () => {
    expect(splitFullName("Maria da Silva")).toEqual({ first: "Maria", last: "da Silva" })
  })

  it("handles a single name and empty input", () => {
    expect(splitFullName("Madonna")).toEqual({ first: "Madonna", last: "" })
    expect(splitFullName("")).toEqual({ first: "", last: "" })
    expect(splitFullName(undefined)).toEqual({ first: "", last: "" })
  })
})
