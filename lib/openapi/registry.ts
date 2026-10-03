/**
 * Camada 9 · Registro OpenAPI
 * Regra: um único `OpenAPIRegistry` para o app inteiro. Cada domínio registra
 * os próprios paths em `paths/<domínio>.ts`, usando os MESMOS schemas Zod que a
 * rota usa para validar (camada 4): a documentação deriva do código.
 * Não faz: validar request (isso é a rota).
 * Tradeoff: `extendZodWithOpenApi` altera o Zod (adiciona `.openapi()`). É
 * chamado uma vez, aqui; os schemas atuais não usam `.openapi()`, então nada
 * muda para eles.
 */
import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()
