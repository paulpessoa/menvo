/**
 * Camada 4 · Zod (administração de usuários e decisão de candidatura)
 * Regra: o contrato de entrada das rotas `/api/admin/users`, `/api/admin/users/[id]`
 * e `/api/admin/verify`. Antes o schema do PATCH morava dentro da rota e a
 * interface `AdminUserUpdate` era escrita à mão (duplicada); agora o tipo sai
 * deste schema (`lib/domain/admin/user.entity.ts`).
 * Não faz: decidir quem pode chamar (é do `requireAdmin` + `assertAdmin`).
 * Tradeoff: a query da lista nunca rejeita (`catch` em cada campo), porque a
 * rota sempre ignorou valor desconhecido e o formato de resposta não muda;
 * o que muda é o teto de `limit` (100), que antes ia direto para o `.range`.
 */
import { z } from "zod"
import { toPlainText } from "./plain-text"

/**
 * Papéis que o painel pode atribuir. `moderator` saiu (decisão D3 do
 * admin-audit): o painel é só de `admin`, e não há moderador cadastrado.
 */
export const ADMIN_ASSIGNABLE_ROLES = ["mentee", "mentor", "admin"] as const

export const adminAssignableRoleSchema = z.enum(ADMIN_ASSIGNABLE_ROLES)

/**
 * Campos de perfil que o admin pode editar no modal de usuário. As colunas de
 * verificação (`verified`, `verification_status`, `verification_notes`,
 * `is_pending_mentor`) NÃO entram de propósito: só mudam por
 * `POST /api/admin/verify`, que também dá o papel de mentor e avisa a pessoa.
 * Chaves desconhecidas são descartadas.
 */
export const adminUserUpdatesSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  bio: z.string().max(5000).transform(toPlainText).optional(),
  avatar_url: z.string().max(2000).optional(),
  is_public: z.boolean().optional(),
  institution: z.string().max(200).optional(),
  course: z.string().max(200).optional(),
  academic_level: z.string().max(100).optional(),
  expected_graduation: z.string().max(50).optional(),
})

/** Corpo do `PATCH /api/admin/users/[id]`. */
export const adminUserPatchBodySchema = z.object({
  updates: adminUserUpdatesSchema.default({}),
  roles: z.array(adminAssignableRoleSchema).optional(),
})

export const ADMIN_USERS_MAX_LIMIT = 100

/**
 * Query da lista `GET /api/admin/users`. Valor inválido cai no padrão antigo
 * da rota (página 1, 10 por página, sem filtro) em vez de virar 400.
 * `limit` acima de 100 é cortado em 100.
 */
export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .catch(10)
    .transform((n) => Math.min(n, ADMIN_USERS_MAX_LIMIT)),
  search: z.string().max(200).catch(""),
  origin: z.enum(["menvo", "jotform"]).optional().catch(undefined),
  role: z.enum(["mentor", "mentee"]).optional().catch(undefined),
  status: z.enum(["pending", "verified"]).optional().catch(undefined),
  sort_by: z.enum(["created_at", "full_name"]).catch("created_at"),
  sort_order: z.enum(["asc", "desc"]).catch("desc"),
})

/** Corpo do `POST /api/admin/verify`. `userId` é UUID (antes: qualquer string). */
export const adminVerifyBodySchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "pending", "changes_requested"]),
  notes: z.string().max(2000).optional(),
  message: z.string().trim().min(1).max(4000).optional(),
  notifyEmail: z.boolean().optional(),
})

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>
export type AdminVerifyBody = z.infer<typeof adminVerifyBodySchema>
