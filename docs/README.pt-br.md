> Leia este documento em [Inglês](../README.md)

<p align="center">
  <a href="https://www.menvo.com.br/">
    <img 
      src="https://raw.githubusercontent.com/paulpessoa/menvo/main/public/images/logo512.png"
      alt="Menvo Logo" 
      width="110" 
      height="110"
    />
  </a>
</p>

<h1 align="center">Menvo — Mentoria Voluntária</h1>

<p align="center">
  <strong>Democratizando a mentoria de carreira para jovens e estudantes em busca de suas primeiras oportunidades profissionais.</strong>
</p>

<p align="center">
  <a href="https://www.menvo.com.br/">Website</a> •
  <a href="https://www.menvo.com.br/about">Sobre</a> •
  <a href="https://www.menvo.com.br/mentors">Mentores</a> •
  <a href="https://www.menvo.com.br/doar">Doar (PIX)</a> •
  <a href="https://www.menvo.com.br/contact">Contato</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.2-black?style=flat-square&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat-square&logo=react-query" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/i18n-PT--BR%20%7C%20EN%20%7C%20ES-orange?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="Licença MIT" />
</p>

---

## 📖 Sobre o Menvo

O **Menvo** é uma plataforma open-source e sem fins lucrativos que conecta profissionais experientes do mercado a jovens em início de carreira. Por meio de sessões individuais de mentoria voluntária, quiz vocacional interativo e networking comunitário, capacitamos talentos com conhecimento prático, confiança e ferramentas reais para se destacarem em processos seletivos.

Alinhado com os **Objetivos de Desenvolvimento Sustentável da ONU (ODS 4, 8 e 10)**, o Menvo oferece mentoria 100% gratuita para estudantes e pessoas em transição de carreira no Brasil e no exterior.

---

## ✨ Funcionalidades Principais

- 🎯 **AI Mentor Match:** Recomendação inteligente de mentores ideais para o objetivo do mentorado usando IA (OpenAI e Groq).
- 📅 **Agendamento Integrado:** Gestão de disponibilidade, integração com Google Calendar e e-mails automáticos de confirmação.
- 💬 **Mensagens em Tempo Real:** Chat moderno e responsivo entre mentores e mentorados antes e depois das sessões.
- 🧭 **Quiz Vocacional de Entrada:** Diagnóstico interativo de objetivos com direcionamento para trilhas e mentores compatíveis.
- 🌐 **Internacionalização Completa (i18n):** Suporte nativo em **Português (pt-BR)**, **Inglês (en)** e **Espanhol (es)** via `next-intl`.
- 👥 **Comunidade Ativa:** Mural público de membros com geolocalização automática e perfis protegidos.
- 🛡️ **Verificação de Mentores:** Processo de validação de voluntários garantindo segurança e alto nível de mentoria.
- 💝 **Apoio Voluntário via PIX:** Sistema transparente e sem taxas para apoio direto à infraestrutura e servidores.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Função |
|---|---|---|
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | Arquitetura híbrida RSC/Client, streaming e Route Handlers |
| **Linguagem** | [TypeScript 5.9](https://www.typescriptlang.org/) | Tipagem estática estrita em 100% da base |
| **Interface (UI)** | [React 19](https://react.dev/) + [Radix UI](https://www.radix-ui.com/) | Primitivos acessíveis, modulares e composáveis |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) | Design tokens consistentes e suporte a temas claro/escuro |
| **Backend & Auth** | [Supabase](https://supabase.com/) | PostgreSQL, Row Level Security (RLS), Realtime, Auth e Storage |
| **Estado do Servidor** | [TanStack Query v5](https://tanstack.com/query) | Cache otimizado, sincronização e elimina N+1 queries |
| **Estado Global** | [Zustand](https://zustand-demo.pmnd.rs/) | Gerenciamento de estado leve e modular |
| **Formulários** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Validação de esquemas e proteção de fronteiras de dados |
| **Internacionalização** | [next-intl](https://next-intl-docs.vercel.app/) | Dicionários tipados em `pt-BR`, `en` e `es` com 100% de paridade |
| **Integração IA** | OpenAI / Groq API | Match semântico por palavras-chave e embeddings |
| **E-mails Transacionais** | [Brevo (Sendinblue)](https://www.brevo.com/) | Confirmações de agendamento e alertas |
| **Hospedagem** | [Vercel](https://vercel.com/) | Rede Edge global de alta velocidade |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js**: `v18.18.0` ou superior (recomendado LTS)
- **NPM**: Gerenciador de pacotes padrão

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/paulpessoa/menvo.git
   cd menvo
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   Copie o arquivo de exemplo e insira suas chaves do Supabase:
   ```bash
   cp .env.example .env.local
   ```

4. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📜 Scripts do Projeto

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor Next.js em modo desenvolvimento |
| `npm run build` | Compila o projeto para produção |
| `npm run start` | Executa o servidor de produção compilado |
| `npm run typecheck` | Validação estrita de TypeScript (`tsc --noEmit`) |
| `npm run lint` | Verificação de boas práticas e linting com ESLint |
| `npm test` | Execução da suíte de testes com Jest |
| `npm run db:types` | Gera os tipos TypeScript diretamente do schema do Supabase |

---

## 🤝 Como Contribuir

Ficamos muito felizes com a sua ajuda! Por favor, leia o [CONTRIBUTING.md](../CONTRIBUTING.md) para detalhes sobre fluxo de branches, commits convencionais e padrões arquiteturais (`AGENTS.md`).

---

## 📄 Licença

Este projeto é de código aberto sob a licença [MIT](../LICENSE).

---

## 📞 Canais Oficiais

- **Site:** [https://www.menvo.com.br](https://www.menvo.com.br)
- **E-mail de Suporte:** [contato@menvo.com.br](mailto:contato@menvo.com.br)
- **WhatsApp:** [+55 (81) 99509-7377](https://wa.me/5581995097377)
- **LinkedIn:** [Menvo no LinkedIn](https://www.linkedin.com/company/menvo/)
- **Instagram:** [@menvobr](https://www.instagram.com/menvobr/)
