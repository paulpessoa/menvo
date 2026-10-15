import { OWN_PROFILE_COLUMNS } from "./own-profile-columns"

describe("OWN_PROFILE_COLUMNS", () => {
  const columns = OWN_PROFILE_COLUMNS.split(",").map(c => c.trim())

  // Campos que o formulário de perfil devolve no PUT: se um faltar aqui, o
  // formulário abre com o valor padrão e salvar sobrescreve o valor real.
  it.each(["is_public", "first_name", "last_name", "slug", "bio", "avatar_url", "onboarding_flags"])(
    "inclui %s",
    column => {
      expect(columns).toContain(column)
    }
  )

  it("não repete colunas", () => {
    expect(new Set(columns).size).toBe(columns.length)
  })
})
