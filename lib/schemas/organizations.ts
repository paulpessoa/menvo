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
