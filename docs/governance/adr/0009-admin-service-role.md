---
title: "ADR 0009 - service_role no painel admin: assertAdmin no service, só papel admin"
owner: paul
status: current
last_reviewed: 2026-10-20
source_of_truth: [docs/blueprint/admin-audit.md, docs/governance/adr/0008-service-role-exceptions-org-profile-appointments.md]
---

# ADR 0009 - service_role no painel admin

- **Status:** aceito (2026-10-20, decisões D1 a D4 do `admin-audit.md`).
- **Relacionado:** ADR 0008 (exceção E7), ADR 0006, `docs/blueprint/admin-audit.md`.

## 1. Contexto

A auditoria do admin achou 12 pontos com `service_role`. Nenhum cumpria a regra
do ADR 0008: client só em `*.composition.ts` e service conferindo o ator. As 34
rotas conferem admin com `requireAdmin`, mas os services que rodam com
privilégio total confiam nisso (mesmo padrão que causou o bug do `cancel`).

## 2. Decisão

1. **E7 do ADR 0008 vale para o admin** (painel sem sessão do dono do dado).
   O client privilegiado nasce só em `*.composition.ts`, de forma preguiçosa, e
   nunca na rota. O inventário rota a rota está em `admin-audit.md`.
2. **`assertAdmin(db)` é obrigatório no service** (`lib/services/admin/assert-admin.ts`).
   Chama a RPC `is_admin()` com o client da **sessão** antes de usar qualquer
   client privilegiado. Nega por padrão (erro de RPC ou resposta diferente de
   `true` recusa). A rota continua com `requireAdmin` para 401/403 e traduz
   `AdminForbiddenError` com `adminForbiddenResponse`.
3. **O painel exige só o papel `admin`.** `moderator` sai do guard e do tipo
   `AdminRole`; não existe moderador cadastrado (conferido no banco) e
   `is_admin()` não o reconhece, então a leitura pela sessão já falharia.
4. **Rotas sem chamador foram apagadas** (`users/actions`, `users/manage`,
   `notify-verification`, `stats`, `audit-logs/stats`, `resolve-migration-conflict`).
   `audit-logs` fica: é a única leitura da trilha `admin_audit_logs`.

## 3. Pendências (não fazer sem pedido)

| # | Migration | O que resolve |
|---|---|---|
| M-A1 | `admin_set_user_roles(uid, roles[])`, security definer, atômica e com auditoria | Troca de papel hoje é "apaga tudo, insere"; falha no meio deixa a pessoa sem papel |
| M-A2 | Versionar as policies de admin de `feature_flags`, `feature_flag_audit_logs`, `admin_audit_logs` e o SELECT de admin em `appointments` | Existem em produção e não estão em migration; destrava trocar `service_role` pela sessão |

Até lá, E7 em composition. Cada linha de trabalho (L1, L2) usa `assertAdmin`
nos services que tocar.
