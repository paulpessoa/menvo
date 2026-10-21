# Auditoria: chat (leitura da caixa de entrada)

> Escopo da onda "browser sem Supabase direto": só as leituras
> `getConversations` e `getUnreadCount`. Realtime, `send`, `mark-read` e
> `messages/[mentorId]` ficam como estão.

## Auditoria (antes)

| # | Camada | Estado | Prova |
|---|---|---|---|
| 4 | Zod | falta | `ChatConversationItem` era interface em `chat.service.ts` |
| 5 | Repository | falta | `chat.service.ts` chamava `supabase.from()` no browser (chave anon) |
| 7 | Service | falta | regra (outro participante, papel principal) misturada ao acesso a dados no browser |
| 8 | Route handler | parcial | só `send`, `mark-read`, `messages/[mentorId]`; sem rota de leitura da inbox |
| 9 | OpenAPI | falta | `chat` em `pendingDomains` |
| 10 | Query layer | falta | página e badge com `useState` + `useEffect` e recarga manual |
| 14 | Agentes | decisão | conversas privadas NÃO são expostas ao MCP/assistente nesta onda |

Achado principal: N+1. Para N conversas, 1 + 2N queries (perfil + contagem de
não lidas por conversa), todas do navegador.

## Plano e o que foi aplicado

1. Zod `lib/schemas/chat.ts`; repository `lib/repositories/chat.repository.ts`
   (client da sessão, RLS, nunca `service_role`).
2. Service `lib/services/chat/chat-inbox.service.ts` + composition; rotas
   `GET /api/chat/conversations` e `GET /api/chat/unread-count` (401 sem sessão,
   userId sempre da sessão, 500 genérico).
3. Queries fixas: conversas = 2 (conversas com perfil e papéis dos dois lados
   por select aninhado; não lidas de todas as conversas em uma query, agrupadas
   no service); contagem do badge = 2. Sem migration, sem RPC.
4. OpenAPI `lib/openapi/paths/chat.ts`; keys `lib/query/keys/chat.ts`; effects
   `lib/query/effects/chat.ts`; hooks `hooks/chat/*`.
5. Página `messages` e `MessagesBadge`: leem pelos hooks; o realtime só chama
   `invalidateQueries`. `chat.service.ts` ficou só com realtime.
6. Testes: service (número fixo de queries para 1, 5 e 40 conversas), rotas
   (401/200/500), hooks.

Tradeoff: a lista de não lidas traz 1 linha por mensagem não lida (só
`conversation_id`) e o service conta. Aceitável para caixa de entrada; se
crescer, trocar por view/RPC agregada (exige migration, outra onda).

## Handoff

- Feito: camadas 4, 5, 7, 8 (2 rotas), 9 (2 rotas), 10, 11 e testes.
- Pendente do orquestrador (arquivos compartilhados): `lib/query/keys.ts`
  (`import { chatKeys } from "./keys/chat"` e `chat: chatKeys`),
  `lib/query/effects.ts` (`import { chatEffects } from "./effects/chat"` e
  `...chatEffects`), `lib/openapi/document.ts` (`import "./paths/chat"`).
  Hooks e página importam `chatKeys` direto de `keys/chat` até `qk.chat` existir.
- `chat` continua em `pendingDomains` do `document.test.ts`: mover para
  `documentedDomains` só quando `send`, `mark-read` e `messages` também forem
  documentados.
- `chat.send` / `chat.markRead` (effects) ainda não são usados: `ChatInterface`
  usa `fetch` direto. O badge já atualiza via realtime no UPDATE de `messages`.
- Sem verificação manual no banco real: o select aninhado usa os FKs
  `conversations_mentor_id_fkey` / `conversations_mentee_id_fkey` para `profiles`;
  conferir na tela de mensagens em preview.
