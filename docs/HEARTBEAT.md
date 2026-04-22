# ❤️ HEARTBEAT - Single Source of Truth

## 📅 Última Atualização: 22/04/2026
**Status Atual:** Mentores Modularizados ✅ / Admin Consolidation 🔄 / Gestão de Orgs Premium ✅ / IA Match Fix ✅

---

## 📍 Onde Paramos?
- **Admin Consolidation:** Simplificação do título "Painel Administrativo" para "Dashboard" e unificação de rotas no menu de avatar para apontar para `/dashboard`.
- **Gestão de Organizações:** Página de detalhes (`organizations/[id]`) agora permite edição completa de campos, upload de logo, website e gestão de status (Ativa, Pendente, Suspensa).
- **IA Match:** Recuperação de processo quebrado. Corrigido erro de sintaxe no `groq.service.ts` e tipagem no `MagicSearchBar.tsx`. Retorno agora inclui `suggestions` individuais por mentor.
- **Limpeza:** Removido diretório redundante `admin/users/manage`.

## 🚀 Próximos Passos (P0)
1. **Auditoria de Eventos:** Auditar a tabela `events` para substituir os mocks da página pública.
2. **Settings Admin:** Mover configurações globais remanescentes para a rota centralizada `/settings`.
3. **Limpeza de Legado:** Concluir a deleção de páginas de admin obsoletas (mentors/verify, migrations, etc).

## 🛠️ Notas Técnicas
- **Routing:** Unificação do acesso ao dashboard via `/dashboard` para todas as roles, permitindo que o middleware decida o destino final ou que a página de dashboard seja polimórfica.
- **API Admin:** Nova rota `/api/admin/organizations/[id]/status` para gerenciar transições de estado de organizações com tracking de quem aprovou.
- **i18n:** Adicionadas chaves `magicSearch` e `admin.feedbacks` para manter a paridade de tradução.
