/**
 * Camada 10 · cliente HTTP tipado
 * Regra: o `fetch` das rotas /api fica aqui e a resposta passa pelo schema Zod
 * da camada 4 antes de chegar ao hook. Resposta fora do contrato vira erro
 * visível em vez de `undefined` na tela.
 * Não faz: cache nem retry (é do TanStack Query).
 */
import type { z } from "zod"

/** Erro de uma rota /api. `body` guarda o JSON cru para quem precisa de mais campos (ex.: `status: "exists"`). */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly body?: Record<string, unknown>
  ) {
    super(message)
    this.name = "ApiClientError"
  }
}

type ResponseSchema<T> = z.ZodType<T, z.ZodTypeDef, unknown>

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const data: unknown = await res.json().catch(() => ({}))
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {}
}

async function request<T>(url: string, init: RequestInit | undefined, schema: ResponseSchema<T>): Promise<T> {
  const res = await fetch(url, init)
  const data = await readJson(res)

  if (!res.ok) {
    throw new ApiClientError(
      res.status,
      typeof data.error === "string" ? data.error : `Erro ${res.status}`,
      typeof data.code === "string" ? data.code : undefined,
      data
    )
  }
  return schema.parse(data)
}

export function getJson<T>(url: string, schema: ResponseSchema<T>): Promise<T> {
  return request(url, undefined, schema)
}

export function postJson<T>(url: string, body: unknown, schema: ResponseSchema<T>): Promise<T> {
  return request(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    schema
  )
}
