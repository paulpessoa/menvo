# Regras para agentes (proposta de AGENTS.md)


> `AGENTS.md` está no `.gitignore` (cada máquina tem o seu). Este arquivo é a
> versão versionada: copie o conteúdo para o seu `AGENTS.md`/`CLAUDE.md` local
> ou aponte para cá.
Regras deste repositório para qualquer agente de código (Claude Code,
Antigravity, Codex, Cursor) e para humanos. Curto de propósito: o detalhe
mora nos arquivos citados.

## Antes de mudar código

- Sincronize com a `main` antes de abrir PR (`CONTRIBUTING.md`).
- Arquitetura: siga a skill `menvo-blueprint`
  (`.claude/skills/menvo-blueprint/SKILL.md`) e o ADR 0006. Código novo de
  domínio entra nas 14 camadas; código legado migra aos poucos.
- Comente o **porquê** e o tradeoff, não o quê. Arquivos de camada abrem com
  o cabeçalho descrito na skill: este repo também é material de estudo.

## Antes de dizer que terminou

```bash
npm run verify                         # typecheck + lint + jest, o que o CI roda
npm run build && npm run test:e2e      # se mexeu em página, rota ou fluxo
```

## Nunca

- Usar `service_role` como atalho em funcionalidade de usuário. Exceções só
  com ADR (ver ADR 0005) e dentro de um service, nunca numa rota ou tool.
- Criar client Supabase (ou qualquer SDK com chave) no topo do módulo: o
  build roda sem segredos. Crie dentro do handler.
- Editar `lib/types/supabase.ts` à mão (`npm run db:types`).
- Rodar `supabase db push` ou mudar dados de produção sem o Paul pedir.
- Liberar capability para agentes fora de `lib/agents/exposure.ts`.
- Pular, desabilitar ou marcar como `skip` um teste para o CI passar.
- Creditar uma IA como autora, committer ou co-autora (`CONTRIBUTING.md`).
