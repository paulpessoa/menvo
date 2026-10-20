/**
 * Camada 4 · Zod (respostas das rotas de usuários e candidaturas do admin)
 * Regra: o formato que `/api/admin/users`, `/api/admin/users/[id]`,
 * `/api/admin/verifications/*` e `/api/admin/verify` devolvem, para o cliente
 * HTTP tipado conferir antes de a resposta chegar ao hook.
 * Tradeoff: o item de usuário e o de candidatura são validados só no que a
 * tela não vive sem (`id`); o tipo vem da entity, porque o item é achatado em
 * runtime e o Zod não o reconstruiria sem duplicar o tipo do banco.
 */
import { z } from "zod"
import type { AdminUserView } from "@/lib/domain/admin/user.entity"
import type { Verification } from "@/lib/types/models/verification"

function hasStringId(value: unknown): boolean {
  return typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "string"
}

const adminUserViewSchema = z.custom<AdminUserView>(hasStringId, "usuário sem id")
const verificationSchema = z.custom<Verification>(hasStringId, "candidatura sem id")

/** `GET /api/admin/users`: usuários da página, paginação e contagens dos filtros. */
export const adminUsersResponseSchema = z.object({
  data: z.object({
    users: z.array(adminUserViewSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
    counts: z.object({
      all: z.number(),
      pending: z.number(),
      mentors: z.number(),
      mentees: z.number(),
      menvoOrigin: z.number(),
      jotformOrigin: z.number(),
    }),
  }),
})

/** `PATCH /api/admin/users/[id]`: o perfil já atualizado. */
export const adminUpdateUserResponseSchema = z.object({
  success: z.literal(true),
  data: z.record(z.unknown()),
})

/** `DELETE /api/admin/users/[id]`. */
export const adminDeleteUserResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  filesRemoved: z.number(),
})

/** `GET /api/admin/verifications/pending|completed`. */
export const adminVerificationsResponseSchema = z.object({
  verifications: z.array(verificationSchema),
})

/** `POST /api/admin/verify`: o que foi enviado à pessoa depois da decisão. */
export const adminVerifyResponseSchema = z.object({
  success: z.literal(true),
  chatSent: z.boolean(),
  emailSent: z.boolean(),
})
