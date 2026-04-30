# Análise Estrutural: Arquivos da Raiz do Projeto

Fizemos uma varredura completa (`list_dir` e `view_file`) de todos os arquivos soltos na raiz (excluindo as pastas, por enquanto). O objetivo é despoluir, organizar e consolidar configurações.

Abaixo, os arquivos com veredito de "Problema/Ajuste" ou "Deleção". Os demais (como `package.json`, `.env.local`, `tsconfig.json`, `middleware.ts` e afins) estão certinhos onde estão.

## 🗑️ Podem ser Deletados

1. **`postcss.config.js`**
   - **Por que:** Temos o `postcss.config.js` e também o `postcss.config.mjs`. O Next.js e o Tailwind só precisam de um. Como o seu config do Next.js já é `next.config.mjs`, podemos padronizar e apagar o `.js`, mantendo apenas o `.mjs` moderno.
2. **`amplify.yml`**
   - **Por que:** É um arquivo de configuração de build para AWS Amplify. A menos que você hospede o front-end tanto na AWS quanto na Vercel simultaneamente. Caso a Vercel seja o seu provedor principal (onde o cron job está no `vercel.json`), o arquivo do Amplify é lixo morto.

## 🚚 Podem ser Movidos / Reorganizados

3. **`CONTRIBUTING.md`, `CONTRIBUTING.pt-br.md`, `INSTALLING.md`, `INSTALLING.pt-br.md`**
   - **Por que:** Quatro arquivos de documentação técnica soltos na raiz geram poluição visual.
   - **Sugestão:** Movê-los para dentro da pasta `docs/` ou colocá-los sob `.github/` (pois o GitHub reconhece documentação oficial de contribuição nativamente se estiver na pasta oculta). Manteríamos apenas o `README.md` principal na raiz.
4. **`css.d.ts`**
   - **Por que:** Arquivo contendo declarações de tipagem global. Em projetos Next.js + TS, geralmente essas definições isoladas ficam melhor armazenadas numa pasta `types/` (ex: `types/global.d.ts`), pra não deixar arquivos curtos soltos na raiz.

## 🔧 Precisam de Ajustes

5. **`.gitignore`**
   - **Por que:** Atualmente ele ignora arquivos como `.geminirc` e `GEMINI.md`. Embora faça sentido ignorar os caches/logs (`.gemini/`), os arquivos de regra do desenvolvedor como o `GEMINI.md` são muitas vezes úteis de versionar, para que a base de conhecimento do assistente vá para a equipe. Mas isso é opcional e depende da sua preferência.

## ✅ Arquivos que Ficam (OK!)

- `vercel.json` (Triggers os cron jobs de expiração no Vercel - Vital).
- `components.json` (Registro oficial do Shadcn/ui).
- `middleware.ts` (Tem que ficar na raiz do `/src` ou raiz do projeto para o Edge runtime de Auth).
- `tailwind.config.ts`, `next.config.mjs`, `.eslintrc.json`, `package.json`, etc.

---

### Mapeamento Concluído! 📍

O que você quer atacar agora?
1. Executar os cortes e movimentações sugeridos na **Raiz**?
2. Mover logo o foco investigativo para um primeiro "Grupo de Pastas"? (ex: `components/`, `app/`, `lib/`, `hooks/`, `services/`)
