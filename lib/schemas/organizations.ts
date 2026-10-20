import { z } from "zod"

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(150),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen")
    .min(2)
    .max(60),
  type: z.enum(["ngo", "company", "event", "school", "other"]),
  contact_name: z.string().trim().max(150).optional().nullable(),
  contact_email: z.string().trim().email("E-mail inválido").optional().nullable()
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const updateOrganizationStatusSchema = z.object({
  status: z.enum(["active", "suspended"])
})

export const assignOrgAdminSchema = z.object({
  email: z.string().trim().email("E-mail inválido")
})

// ---------------------------------------------------------------------------
// Camada 4 · rotas do dia a dia da org (`/api/org/**`, `/api/me/organizations`)
// Só ADICIONA exports: os schemas acima são usados pelas rotas admin (outra
// linha) e não mudam. Os tipos de DTO saem de `z.infer`, sem interface paralela.
// ---------------------------------------------------------------------------

/** `[id]` da URL das rotas `/api/org/[id]`: UUID inválido vira 400 em vez de erro do Postgres. */
export const orgIdParamSchema = z.string().uuid("Organização inválida")

/**
 * `?period=` do dashboard. Valor desconhecido cai em "all" (o comportamento
 * que a rota já tinha), então o schema nunca rejeita: é só normalização.
 */
export const orgPeriodSchema = z.enum(["all", "30d", "90d", "1y"]).catch("all")

/** Convite por e-mail. Minúsculas porque a busca em `profiles.email` é por igualdade. */
export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido")
})

/** Body do `PATCH …/members` (aprovar pedido) e query do `DELETE …/members?userId=`. */
export const memberUserIdSchema = z.object({ userId: z.string().uuid("userId inválido") })

/** `PATCH /api/org/[id]`: o que o admin da org pode mudar (hoje só a política de entrada). */
export const updateOrgSettingsSchema = z.object({
  join_policy: z.enum(["open", "invite_only"])
})

/** `POST /api/me/organizations`: pedir para entrar ou aceitar convite, pelo slug. */
export const joinOrganizationSchema = z.object({ slug: z.string().trim().min(1, "Slug inválido") })

/** `DELETE /api/me/organizations?organizationId=`. */
export const leaveOrganizationQuerySchema = z.object({
  organizationId: z.string().uuid("organizationId inválido")
})

// --- Saída (o que as rotas devolvem dentro de `{ data }`) -------------------

const membershipStatusSchema = z.enum(["invited", "requested", "active"])

export const orgDashboardMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "member"]),
  status: membershipStatusSchema,
  platformRole: z.enum(["mentor", "mentee"]).nullable(),
  joinedAt: z.string(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  sessionsBooked: z.number(),
  sessionsGiven: z.number(),
  quizDone: z.boolean()
})

export const orgDashboardSummarySchema = z.object({
  beneficiaries: z.number(),
  mentors: z.number(),
  pendingRequests: z.number(),
  pendingInvites: z.number(),
  sessionsBookedByBeneficiaries: z.number(),
  sessionsGivenByOrgMentors: z.number(),
  impact: z.object({
    period: z.enum(["all", "30d", "90d", "1y"]),
    totalSessionsCompleted: z.number(),
    totalHoursCompleted: z.number(),
    totalDiagnosticsDone: z.number(),
    averageRating: z.number().nullable()
  })
})

/**
 * A linha de `organizations` como o admin da org a recebe (`select *`), em
 * `GET` e `PATCH /api/org/[id]`. `passthrough`: validamos o que a tela usa sem
 * descartar as outras colunas.
 */
export const orgRowSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    join_policy: z.enum(["open", "invite_only"]).optional()
  })
  .passthrough()

/**
 * `GET /api/org/[id]`. `organization` é a linha inteira (`select *`, só o admin
 * da org a recebe), por isso `passthrough`: validamos o que a tela usa sem
 * descartar as outras colunas.
 */
export const orgDashboardSchema = z.object({
  organization: orgRowSchema,
  members: z.array(orgDashboardMemberSchema),
  summary: orgDashboardSummarySchema
})

/** `GET /api/org/mine`: as orgs que a pessoa administra. */
export const myOrgOptionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string()
})

/** `GET /api/me/organizations`: cada vínculo da pessoa, com a org embutida (pode vir `null` se a RLS a esconder). */
export const myMembershipSchema = z.object({
  organization_id: z.string(),
  role: z.enum(["admin", "member"]),
  status: membershipStatusSchema,
  created_at: z.string(),
  organizations: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      type: z.string(),
      status: z.string()
    })
    .nullable()
})

// --- Contrato HTTP (camada 9 lê estes; as rotas não os usam para validar) ---

/** Todas as rotas de org respondem sucesso como `{ data, message? }` (`successResponse`). */
export function orgEnvelope<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, message: z.string().optional() })
}

/** `{id}` do path de `/api/org/{id}`. */
export const orgPathParamsSchema = z.object({ id: orgIdParamSchema })

/**
 * `?period=` como a documentação o descreve. Não é o `orgPeriodSchema`: aquele
 * normaliza valor desconhecido para "all"; este lista os valores que valem.
 */
export const orgPeriodQuerySchema = z.object({ period: z.enum(["all", "30d", "90d", "1y"]).optional() })

/** Resultado das ações de membership: o estado em que a pessoa ficou. */
export const membershipResultSchema = z.object({ status: membershipStatusSchema })
export const removedMemberSchema = z.object({ userId: z.string() })
export const leftOrganizationSchema = z.object({ organizationId: z.string() })

export type InviteMemberInput =z.infer<typeof inviteMemberSchema>
export type UpdateOrgSettingsInput = z.infer<typeof updateOrgSettingsSchema>
export type OrgDashboardResponse = z.infer<typeof orgDashboardSchema>
export type MyOrgOption = z.infer<typeof myOrgOptionSchema>
export type MyMembership = z.infer<typeof myMembershipSchema>
