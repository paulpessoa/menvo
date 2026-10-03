"use client"

import { useCallback, useState } from "react"
import type { z } from "zod"

/**
 * Camada 10 · rascunho persistente (formulário pela metade)
 * Regras: valida com Zod ao ler e descarta se falhar ou se a `version` mudar
 * (melhor perder um rascunho que quebrar a tela); `try/catch` em todo acesso
 * (aba anônima, quota cheia); nunca guarde e-mail/telefone nem token.
 * Tradeoff: localStorage é por navegador e fica em claro; por isso o chamador
 * decide o que entra no rascunho e limpa no envio. O hook devolve o rascunho
 * lido UMA vez na montagem e uma função para salvar; o estado do formulário
 * continua sendo do formulário (ele pode ter vários `useState`).
 */
type DraftSchema<T> = z.ZodType<T, z.ZodTypeDef, unknown>

interface Envelope {
  v: number
  data: unknown
}

export function readDraft<T>(key: string, schema: DraftSchema<T>, version: number): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const envelope = JSON.parse(raw) as Envelope
    if (envelope?.v !== version) return null
    const parsed = schema.safeParse(envelope.data)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function writeDraft(key: string, version: number, data: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: version, data } satisfies Envelope))
  } catch {
    // quota cheia ou storage bloqueado: o formulário segue funcionando sem rascunho
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // idem
  }
}

/**
 * `restored` é o rascunho válido encontrado na montagem (ou `null`). `save`
 * grava o valor, ou apaga o rascunho se `isEmpty(value)`: um formulário vazio
 * não deve deixar rascunho para trás.
 */
export function usePersistentDraft<T>(
  key: string,
  schema: DraftSchema<T>,
  version: number,
  isEmpty: (value: T) => boolean
) {
  const [restored] = useState<T | null>(() => (typeof window === "undefined" ? null : readDraft(key, schema, version)))

  const save = useCallback(
    (value: T) => {
      if (isEmpty(value)) clearDraft(key)
      else writeDraft(key, version, value)
    },
    [key, version, isEmpty]
  )
  const clear = useCallback(() => clearDraft(key), [key])

  return { restored, save, clear }
}
