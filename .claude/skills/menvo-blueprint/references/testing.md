# Camada 12 · Testes

Princípio: **cada camada tem um tipo de teste**, e o teste de uma camada não
re-testa a de baixo. Quanto mais perto do banco/navegador, mais lento e mais
raro o teste.

```
            ▲ poucos, lentos
   E2E      │  Playwright: 1 caminho feliz por fluxo crítico
   RLS      │  pgTAP: quem pode ler/escrever cada tabela
   Rota     │  handler com service fake: status, auth, 400/429
   Hook/UI  │  Testing Library: invalida as chaves certas, render
   Service  │  regra de negócio com repository/ports fake em memória
   Schema   │  Zod aceita/rejeita; mapper Row → Entity
            ▼ muitos, rápidos
```

| Camada testada | Tipo | Arquivo | Ferramenta | Roda onde |
|---|---|---|---|---|
| 1 Migration / RLS | Banco | `supabase/tests/<d>.test.sql` | pgTAP (`supabase test db`) | Local (Docker) |
| 3 Entity | Unit | `lib/domain/<d>/<d>.entity.test.ts` | Jest | CI |
| 4 Zod | Unit | `lib/schemas/<d>.test.ts` | Jest | CI |
| 5 Repository (mapper) | Unit | `lib/repositories/<d>.repository.test.ts` | Jest, client mockado | CI |
| 7 Service | Unit | `lib/services/<d>/<d>.service.test.ts` | Jest + fakes | CI |
| 8 Route handler | Integração | `app/api/<d>/route.test.ts` | Jest (`@jest-environment node`) | CI |
| 9 OpenAPI | Contrato | `lib/openapi/document.test.ts` | Jest | CI |
| 10 Hooks | Unit | `hooks/<d>/<hook>.test.tsx` | Testing Library + QueryClient | CI |
| 11 Componente | Unit | `components/<d>/*.test.tsx` | Testing Library | CI |
| Fluxo | E2E | `e2e/<fluxo>.spec.ts` | Playwright | Local + CI noturno |

## Por camada, o que vale testar

- **Zod:** um caso válido, e um inválido por regra (limite, formato,
  obrigatório). Não teste o Zod em si.
- **Service:** este é o teste mais importante. Use fakes (não mocks de
  `jest.fn()` encadeados): um `createInMemoryQuizRepository()` que implementa
  a interface. Teste cada regra e cada `AppError`. Injete `now` para datas.
- **Route handler:** com o service substituído por um fake. Teste: 401 sem
  sessão, 400 com body inválido, status certo para cada `AppError`, 2xx com a
  resposta passando no schema de saída (isso é teste de contrato barato).
- **Hooks:** o `onSuccess` chama `invalidateQueries` com as chaves de
  `effects[...]`. É aqui que se prova que "quiz atualiza o dashboard".
- **RLS (pgTAP):** para cada tabela, um teste por papel (anônimo, dono,
  outro usuário, admin) e por operação relevante. É o único teste que pega
  uma política RLS errada; mock nenhum faz isso.
- **E2E:** só o caminho feliz dos fluxos que dão dinheiro/confiança
  (responder quiz, agendar mentoria). Não teste variação de formulário aqui.

## Tradeoffs que vale saber explicar

- **Fake vs mock:** fake (implementação em memória da interface) testa
  comportamento e sobrevive a refatoração; mock de chamada
  (`from().select().eq()`) testa implementação e quebra a cada mudança. O
  repository existe em grande parte para permitir o fake.
- **pgTAP local, não no CI (por enquanto):** exige Docker e um Postgres com as
  160 migrations. Vale rodar antes de qualquer PR que mexa em RLS.
- **Cobertura:** não persiga %. Persiga "cada regra do service e cada
  política RLS tem um teste".
- **Playwright:** o Chromium já vem no ambiente de nuvem; local precisa de
  `npx playwright install chromium`. Adicionar a dependência é ponto de
  parada.

## Fakes compartilhados

Ficam em `lib/testing/fakes/<d>.ts`, exportando
`createInMemory<D>Repository(seed?)` e `createFakeEmailPort()` (que guarda as
mensagens enviadas em um array para o teste conferir).
