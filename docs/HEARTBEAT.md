# 💓 HEARTBEAT - Single Source of Truth

## 📅 Última Atualização: 23/04/2026
**Status Atual:** TypeScript 0 erros ✅ / Build Produção OK ✅ / Schema Supabase Regenerado ✅

---

## 📍 Onde Paramos?
- **TypeScript Cleanup:** Eliminados todos os 35 erros de TypeScript em 26 arquivos. Build `npm run build` e `tsc --noEmit` passam com `exit code 0`.
- **Schema Atualizado:** `lib/types/supabase.ts` foi regenerado diretamente do Supabase remoto, incluindo todas as tabelas, views e funções RPC que antes faltavam (causando inferência `never`).
- **Admin Consolidation:** Simplificação do título "Painel Administrativo" para "Dashboard" e unificação de rotas no menu de avatar para apontar para `/dashboard`.
- **Gestão de Organizações:** Página de detalhes (`organizations/[id]`) agora permite edição completa de campos, upload de logo, website e gestão de status (Ativa, Pendente, Suspensa).
- **IA Match:** Recuperação de processo quebrado. Corrigido erro de sintaxe no `groq.service.ts` e tipagem no `MagicSearchBar.tsx`. Retorno agora inclui `suggestions` individuais por mentor.

---

## 🚀 Próximos Passos (P0)
1. **Remover `as any` residuais:** Com o schema completo, auditar os casts `as any` nos services e removê-los onde o tipo now é inferido corretamente.
2. **Auditoria de Eventos:** Auditar a tabela `events` para substituir os mocks da página pública.
3. **Settings Admin:** Mover configurações globais remanescentes para a rota centralizada `/settings`.
4. **Bug Mobile:** Chat não atualiza em tempo real no Chrome/Xiaomi Note 15 (funciona normalmente no Chrome desktop). Investigar SSE/WebSocket no mobile.

---

## 🗄️ Workflow de Banco de Dados — REGRA OBRIGATÓRIA

> ⚠️ **Sempre que adicionar, alterar ou remover tabelas/colunas/views/funções no Supabase, rodar obrigatoriamente:**

```bash
npm run db:types
```

Este comando regenera `lib/types/supabase.ts` a partir do schema remoto, garantindo type-safety de ponta a ponta.

**O que o comando faz internamente:**
```bash
supabase gen types typescript --project-id evxrzmzkghshjmmyegxu --schema public > lib/types/supabase.ts
```

> ⚠️ **No Windows/PowerShell**, o operador `>` gera UTF-16. Usar sempre `npm run db:types` que já resolve isso. Se rodar manualmente, usar:
> ```powershell
> supabase gen types typescript --project-id evxrzmzkghshjmmyegxu --schema public | Out-File -Encoding UTF8 lib/types/supabase.ts
> ```

**Projeto Supabase:** `Menvo` — ref: `evxrzmzkghshjmmyegxu` (East US / North Virginia)

---

## 🛠️ Notas Técnicas
- **Routing:** Unificação do acesso ao dashboard via `/dashboard` para todas as roles, permitindo que o middleware decida o destino final ou que a página de dashboard seja polimórfica.
- **API Admin:** Nova rota `/api/admin/organizations/[id]/status` para gerenciar transições de estado de organizações com tracking de quem aprovou.
- **i18n:** Adicionadas chaves `magicSearch` e `admin.feedbacks` para manter a paridade de tradução.
- **TypeScript:** Padrão `supabase.from('tabela') as any` é um workaround temporário para inferência `never` em queries com joins complexos. O fix real é manter o schema gerado atualizado via `npm run db:types`.
