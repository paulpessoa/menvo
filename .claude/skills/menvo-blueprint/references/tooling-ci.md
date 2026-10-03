# Camada 13 · Tooling e CI

Pergunta que esta camada responde: **o que roda, quando, e o que bloqueia um
merge?** Ferramenta de teste sem gatilho automático vira teste que ninguém roda.

## Onde cada checagem roda

| Momento | O que roda | Bloqueia? | Onde está |
|---|---|---|---|
| Enquanto edita | TypeScript e ESLint no editor | Não | `tsconfig.json`, `eslint.config.mjs` |
| Antes do push (local) | `npm run verify` (typecheck + lint + jest) | Por disciplina | `package.json` |
| Cada PR e push na main | typecheck, lint, jest, build, Playwright smoke | **Sim** (quando for check obrigatório) | `.github/workflows/ci.yml` |
| Cada deploy de Preview na Vercel | Playwright contra a URL real do Preview | Sim, se marcado obrigatório | `.github/workflows/e2e-preview.yml` |
| Cada PR | Bloqueio de atribuição de IA | Sim | `.github/workflows/no-ai-attribution.yml` |
| Antes de PR que mexe em RLS (local) | `supabase test db` (pgTAP) | Por disciplina | `supabase/tests/` |

**Por que não um hook de pre-push?** Hook local deixa todo push lento, é fácil
de pular (`--no-verify`) e não existe nos agentes de nuvem. O CI é a barreira
real; `npm run verify` é a cortesia local. Se um dia quiser hooks, use
`simple-git-hooks` só com o lint dos arquivos staged (rápido).

## Escolha das ferramentas de teste

| Ferramenta | Decisão | Por quê |
|---|---|---|
| **Jest** | Fica (unit e integração) | 81 suítes e 588 testes já existem. Migrar não entrega valor agora |
| **Vitest** | Não agora | Mais rápido e nativo de ESM, API quase igual à do Jest. Reavaliar se o tempo da suíte passar de ~2 min ou se o Jest travar com ESM |
| **Playwright** | Adotado (E2E) | Multi-browser, paraleliza, `getByRole` testa acessibilidade junto, trace viewer, roda contra o Preview |
| **Cypress** | Não | Sobrepõe o Playwright, mais lento em paralelo e pago para paralelizar no CI. Duas ferramentas de E2E = o dobro de manutenção |
| **Testing Library** | Fica (hooks e componentes) | Já está no projeto |
| **pgTAP** | Adotar (RLS) | Único jeito de testar política RLS de verdade |

## Regras do CI

1. **Build sem segredos.** O CI usa env pública falsa. Se o build precisar de
   uma chave real para compilar, é bug: client criado no topo do módulo.
   Crie o client dentro do handler (ver `createServiceRoleClient()`).
2. **`npm ci`, nunca `npm install`.** O `npm ci` falha se o lockfile está
   fora de sincronia, e é isso que queremos pegar antes da Vercel.
3. **Do barato para o caro.** typecheck → lint → jest → build → E2E.
4. **Sem `continue-on-error`** para esconder falha. Dívida antiga vira aviso
   no ESLint (estratégia "catraca", abaixo), não etapa ignorada.
5. **Teste instável não se pula:** corrige-se a causa.

## ESLint: estratégia "catraca"

Em 2026-10-03, ligar o lint revelou 941 erros (578 `any`, 214 variáveis sem
uso). Corrigir tudo de uma vez seria um PR gigante e arriscado. Então:

- No código legado, essas regras viram **aviso** (`LEGACY_BACKLOG_RULES`).
- Nas pastas do blueprint (`STRICT_PATHS`), são **erro**. Código novo não
  aumenta a dívida.
- Ao migrar uma pasta para o blueprint, mova ela para `STRICT_PATHS`.
- O número de avisos só pode cair. Acompanhe com `npm run lint | tail -1`.

## Playwright: dois modos, os mesmos testes

```bash
npm run build && npm run test:e2e          # local: sobe `next start` sozinho
E2E_BASE_URL=https://<preview>.vercel.app npm run test:e2e   # contra um deploy
npm run test:e2e:ui                         # modo visual para escrever testes
```

Regras dos specs (`e2e/*.spec.ts`):
- Selecione por papel e nome acessível (`getByRole('button', { name: 'Enviar' })`),
  nunca por classe CSS. Se não dá para selecionar por papel, o componente tem
  um problema de acessibilidade, e agentes de navegador também não vão achar.
- Um spec por fluxo crítico: `smoke`, `quiz`, `booking`. Só caminho feliz.
- Fluxo com login usa `storageState` gerado num `auth.setup.ts`, com um
  usuário de teste dedicado (nunca uma conta real).

## Configuração no GitHub (o Paul faz uma vez)

1. Settings → Branches → regra para `main` → "Require status checks":
   marque **Typecheck · Lint · Unit tests**, **Build · E2E smoke** e
   **No AI attribution**.
2. Vercel → Settings → Deployment Protection → "Protection Bypass for
   Automation" → copie o valor para o secret `VERCEL_AUTOMATION_BYPASS_SECRET`
   do GitHub.
