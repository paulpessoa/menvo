/**
 * Camada 9 · Contrato OpenAPI (community)
 * Regra: descreve as rotas da comunidade com os mesmos schemas que a rota usa
 * para validar (lib/schemas/community.ts). `POST /api/community/contact` ainda
 * não tem schema de saída próprio e fica de fora até migrar.
 */
import { z } from "zod"
import { registry } from "../registry"
import { apiErrorSchema } from "@/lib/schemas/api"
import { communityIdsQuerySchema, communityProfilesResponseSchema } from "@/lib/schemas/community"

const json = <T extends z.ZodTypeAny>(schema: T) => ({ "application/json": { schema } })

registry.registerPath({
  method: "get",
  path: "/api/community/profiles",
  tags: ["community"],
  summary: "Perfis do mural da comunidade por id",
  description:
    "Só para logados. Roda com a sessão de quem pede, então o RLS decide quem aparece (mentorados só para mentor/admin). Ids que não são UUID são ignorados; mais de 50 ids é erro. Só os campos do mural: sem e-mail, telefone ou currículo.",
  request: { query: communityIdsQuerySchema },
  responses: {
    200: { description: "Perfis encontrados (lista vazia se nenhum id for visível)", content: json(communityProfilesResponseSchema) },
    400: { description: "Mais de 50 ids", content: json(apiErrorSchema) },
    401: { description: "Não autenticado", content: json(apiErrorSchema) },
    500: { description: "Falha ao buscar", content: json(apiErrorSchema) },
  },
})