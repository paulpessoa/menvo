/**
 * Camada 10 · Efeitos de mutação (chat)
 * Regra: só ações do domínio chat, com o prefixo `chat.`. Montadas em
 * `lib/query/effects.ts` (pendente do orquestrador).
 */
import { chatKeys } from "../keys/chat"
import type { Keys } from "./types"

export const chatEffects = {
  /** Enviar muda a ordem da lista (`last_message_at`). */
  "chat.send": (): Keys => [chatKeys.all],
  /** Marcar como lido zera o contador da conversa e o do badge. */
  "chat.markRead": (): Keys => [chatKeys.all],
} satisfies Record<`chat.${string}`, (ctx: never) => Keys>
