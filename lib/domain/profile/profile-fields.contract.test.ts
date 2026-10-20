/**
 * Contrato entre o que o formulário ESCREVE e o que a API DEVOLVE.
 * Em 2026-10-15 (f95c9da5) `is_public` sumiu de uma lista de colunas copiada em
 * duas rotas: o formulário abria com "Perfil público" desligado e cada "Salvar"
 * tirava o mentor do catálogo. Nenhum teste ligava as listas. Estes ligam.
 */
import { updateProfileSchema } from "@/lib/schemas/profile"
import { OWN_PROFILE_COLUMNS } from "@/lib/services/auth/own-profile-columns"
import {
  MENTOR_EDITABLE_FIELDS,
  MENTOR_PROFILE_EMBED,
} from "@/lib/services/mentors/mentor-profile-fields"
import {
  MENTEE_EDITABLE_FIELDS,
  MENTEE_PROFILE_EMBED,
  MENTEE_PROFILE_EMBED_WITH_CV,
} from "@/lib/services/mentees/mentee-profile-fields"

const ownColumns = OWN_PROFILE_COLUMNS.split(",").map(c => c.trim())
const embedColumns = (embed: string) =>
  embed.slice(embed.indexOf("(") + 1, embed.lastIndexOf(")")).split(",").map(c => c.trim())

// cv_url só é gravado por /api/upload/cv (a URL do formulário é assinada e
// expira); por isso está nos campos de mentorado mas não no schema do PUT.
const NOT_WRITTEN_BY_FORM = ["cv_url"]

describe("campos do perfil: schema de escrita x resposta da API", () => {
  const formFields = Object.keys(updateProfileSchema.shape)

  it.each(formFields)("%s, que o formulário pode gravar, volta na resposta", field => {
    const returned = [...ownColumns, ...MENTOR_EDITABLE_FIELDS, ...MENTEE_EDITABLE_FIELDS] as string[]
    expect(returned).toContain(field)
  })

  it("o formulário não grava cv_url", () => {
    expect(formFields).not.toContain("cv_url")
  })

  it("is_public está nos dois lados (regressão de 2026-10-15)", () => {
    expect(formFields).toContain("is_public")
    expect(ownColumns).toContain("is_public")
  })
})

describe("campos editáveis x embeds", () => {
  it("o embed de mentor traz todo campo editável de mentor", () => {
    expect(embedColumns(MENTOR_PROFILE_EMBED)).toEqual(expect.arrayContaining([...MENTOR_EDITABLE_FIELDS]))
  })

  it("o embed de mentorado traz todo campo editável, exceto o currículo (sem grant)", () => {
    const expected = MENTEE_EDITABLE_FIELDS.filter(f => !NOT_WRITTEN_BY_FORM.includes(f))
    expect(embedColumns(MENTEE_PROFILE_EMBED)).toEqual(expect.arrayContaining(expected))
  })

  it("o embed completo de mentorado é o simples mais cv_url", () => {
    expect(embedColumns(MENTEE_PROFILE_EMBED_WITH_CV)).toEqual([...embedColumns(MENTEE_PROFILE_EMBED), "cv_url"])
  })
})
