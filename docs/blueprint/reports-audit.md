# Auditoria e plano: reports (denúncias)

Onda "browser sem Supabase direto", 2026-10-20.

## Auditoria (antes)

- Só existia a migration (RLS de `user_reports` e do bucket privado `reports_evidence`).
- `app/[locale]/support/page.tsx` criava um client do browser na mão (chave anon) e subia o anexo direto no bucket.
- `POST /api/reports` inseria em `user_reports` sem Zod.
- **Achado de segurança:** `evidence_paths` era aceito sem checar o dono do arquivo. Qualquer pessoa logada podia anexar à própria denúncia o caminho de um arquivo de outra pessoa.
- Faltavam Zod, repository, service, OpenAPI e uma rota de upload.

## Plano e o que foi feito

| Camada | Arquivo |
|---|---|
| 4 Zod | `lib/schemas/reports.ts` |
| 5 Repository | `lib/repositories/reports.repository.ts` |
| 6 Port + adapter | `lib/ports/reports-evidence-storage.ts`, `lib/ports/adapters/reports-evidence.supabase.ts` (client de cookie, nunca `service_role`) |
| 7 Service | `lib/services/reports/reports.service.ts` |
| 8 Rotas | `POST /api/reports/evidence` (nova), `POST /api/reports` (Zod, mesmo formato `{ success, reportId }`) |
| 9 OpenAPI | `lib/openapi/paths/reports.ts` |
| 10 Query | `hooks/reports/useSubmitReport.ts` (mutation, sem query keys porque não há leitura) |
| 11 Página | `support/page.tsx` sem Supabase |
| 12 Testes | service, `route.test.ts`, `evidence/route.test.ts` |

- Evidência: exige login; jpg, png, webp e PDF até 5 MB; caminho `<uid>/<ts>_<uuid>.<ext>` gerado no servidor, nome do cliente ignorado.
- `POST /api/reports` responde 400 para body inválido e para anexo fora de `${user.id}/<arquivo>` (sem `..`, sem subpasta).
- MCP: denúncias não são expostas a agentes.

## Decisões em aberto

1. O input aceita só imagem e PDF; o texto da página cita áudio. Sugestão: manter e ampliar se aparecer demanda.
2. Se o insert falhar depois do upload, o arquivo fica órfão no bucket (já era assim). Sugestão: tratar depois.

## Handoff

- Pendente na integração (arquivos compartilhados): `import "./paths/reports"` e tag `{ name: "reports", description: "Denúncias e anexos de evidência" }` em `lib/openapi/document.ts`; mover `reports` de `pendingDomains` para `documentedDomains` em `document.test.ts`.
