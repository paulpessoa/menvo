> Read these instructions in another language: [English](INSTALLING.md)

# Guia de Instalação do Menvo

Este guia contém todas as instruções necessárias para instalar e executar o projeto Menvo localmente em sua máquina.

## Tabela de Conteúdos

- [Guia de Instalação do Menvo](#guia-de-instalação-do-menvo)
  - [Tabela de Conteúdos](#tabela-de-conteúdos)
  - [Pré-requisitos](#pré-requisitos)
  - [Passo a Passo da Instalação](#passo-a-passo-da-instalação)
    - [1. Fork e Clone do Repositório](#1-fork-e-clone-do-repositório)
    - [2. Instalação das Dependências](#2-instalação-das-dependências)
    - [3. Configuração das Variáveis de Ambiente](#3-configuração-das-variáveis-de-ambiente)
      - [Exemplo de conteúdo do arquivo .env](#exemplo-de-conteúdo-do-arquivo-env)
    - [4. Executando o Projeto](#4-executando-o-projeto)
  - [Scripts Adicionais](#scripts-adicionais)

## Pré-requisitos

Antes de começar, certifique-se de que você tem os seguintes softwares instalados em sua máquina:
* **Node.js**: Versão 18.x ou superior.
* **npm** ou **yarn**: Gerenciador de pacotes do Node.

## Passo a Passo da Instalação

### 1. Fork e Clone do Repositório

Primeiro, faça um "Fork" do projeto para a sua conta do GitHub e depois clone o seu fork para a sua máquina local.

```bash
$ git clone https://github.com/seu-usuario/menvo.git

$ cd menvo
```

### 2. Instalação das Dependências

Com o projeto clonado, instale todas as dependências necessárias executando o seguinte comando na raiz do projeto:

```bash
$ npm install
```

### 3. Configuração das Variáveis de Ambiente

O projeto Menvo utiliza Supabase como backend. Para rodar o projeto localmente, você precisará se conectar à sua própria instância do Supabase.

1.  **Crie uma Conta:** Se você não tiver uma, crie uma conta gratuita no [supabase.com](https://supabase.com) e crie um novo projeto.
2.  **Obtenha suas Chaves:** No painel do seu projeto Supabase, vá para **Project Settings > API**. Lá você encontrará a **Project URL** e a **Project API Keys** (use a chave `anon`).
3.  **Crie o arquivo .env:** Na raiz do projeto, crie uma cópia do arquivo `.env.example` e renomeie-a para `.env`.
4.  **Preencha o arquivo .env:** Cole a sua URL e a sua chave `anon` no arquivo `.env` que você acabou de criar. Veja o exemplo abaixo:

#### Exemplo de conteúdo do arquivo .env
```bash
NEXT_PUBLIC_SUPABASE_URL="URL_DO_SEU_PROJETO_SUPABASE"
NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_CHAVE_ANON"
```

**Importante:** O arquivo `.env` contém informações sensíveis e não deve ser enviado para o repositório. Ele já está incluído no `.gitignore` do projeto.

### 4. Executando o Projeto

Com tudo configurado, inicie o servidor de desenvolvimento:

```bash
$ npm run dev
```

Agora, abra seu navegador e acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação rodando!

## Scripts Adicionais

O projeto conta com outros scripts úteis que podem ser executados:
* `npm run build`: Gera a versão de produção do site.
* `npm run start`: Inicia um servidor de produção após o build.
* `npm run test`: Executa os testes automatizados do projeto.