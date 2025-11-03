# Guia do Administrador de Organização

Bem-vindo ao guia completo para administradores de organizações na plataforma Menvo. Este guia irá ajudá-lo a gerenciar sua organização, convidar membros e acompanhar as atividades de mentoria.

## Índice

1. [Criando uma Organização](#criando-uma-organização)
2. [Convidando Membros](#convidando-membros)
3. [Gerenciando Membros](#gerenciando-membros)
4. [Dashboard e Métricas](#dashboard-e-métricas)
5. [Relatórios](#relatórios)
6. [Configurações](#configurações)

---

## Criando uma Organização

### Passo 1: Acesse a Página de Criação

1. Faça login na plataforma Menvo
2. Navegue até **Organizações** no menu principal
3. Clique em **"Criar Nova Organização"**

### Passo 2: Preencha as Informações

Forneça as seguintes informações sobre sua organização:

- **Nome da Organização** (obrigatório)

  - Nome completo da sua instituição
  - Exemplo: "Universidade Federal de Pernambuco"

- **Tipo de Organização** (obrigatório)

  - Escola/Universidade
  - Empresa
  - ONG/Sem fins lucrativos
  - Comunidade

- **Descrição** (obrigatório)

  - Breve descrição da organização e seus objetivos
  - Máximo 500 caracteres

- **Logo** (opcional)

  - Imagem quadrada, tamanho recomendado: 400x400px
  - Formatos aceitos: JPG, PNG
  - Tamanho máximo: 2MB

- **Website** (opcional)

  - URL do site oficial da organização

- **Informações de Contato** (opcional)
  - Email de contato
  - Telefone

### Passo 3: Aguarde Aprovação

Após submeter o formulário:

1. Sua organização será criada com status **"Pendente"**
2. Nossa equipe revisará sua solicitação em até 48 horas
3. Você receberá um email quando sua organização for aprovada
4. Após aprovação, você poderá começar a convidar membros

---

## Convidando Membros

### Convite Individual

1. Acesse o **Dashboard da Organização**
2. Vá para **"Membros"** → **"Convidar Membro"**
3. Preencha:
   - **Email** do membro
   - **Função**: Mentor ou Mentee
   - **Data de Expiração** (opcional): quando a membership expira
4. Clique em **"Enviar Convite"**

O membro receberá um email com um link para aceitar o convite. O convite expira em 30 dias.

### Convite em Massa (CSV)

Para convidar múltiplos membros de uma vez:

1. Acesse **"Membros"** → **"Convite em Massa"**
2. Baixe o **template CSV**
3. Preencha o arquivo com os dados:
   ```csv
   email,role
   mentor1@example.com,mentor
   mentee1@example.com,mentee
   mentee2@example.com,mentee
   ```
4. Faça upload do arquivo
5. Revise o resumo de convites
6. Confirme o envio

**Limites:**

- Máximo de 100 convites por arquivo
- Máximo de 100 convites por dia (dependendo do seu plano)

### Gerenciando Convites Pendentes

Visualize e gerencie convites pendentes:

1. Acesse **"Convites"** no menu da organização
2. Veja lista de convites pendentes com:
   - Email do convidado
   - Função
   - Data do convite
   - Status (pendente, aceito, expirado, cancelado)

**Ações disponíveis:**

- **Reenviar**: Envia novo email e estende validade por mais 30 dias
- **Cancelar**: Invalida o convite

---

## Gerenciando Membros

### Visualizando Membros

1. Acesse **"Membros"** no dashboard
2. Veja lista completa com:
   - Nome e email
   - Função (Admin, Mentor, Mentee)
   - Status (Ativo, Convidado, Expirado, Saiu)
   - Data de entrada

**Filtros disponíveis:**

- Por função
- Por status
- Busca por nome/email

### Alterando Função de Membro

Para promover um membro a administrador ou alterar sua função:

1. Encontre o membro na lista
2. Clique em **"Editar"**
3. Selecione a nova função
4. Salve as alterações

**Nota:** Organizações devem ter pelo menos um administrador ativo.

### Estendendo Membership

Se um membro tem data de expiração:

1. Clique em **"Editar"** no membro
2. Altere a **"Data de Expiração"**
3. Salve

Para membership sem expiração, deixe o campo vazio.

### Removendo Membros

Para remover um membro:

1. Clique em **"Remover"** no membro
2. Confirme a ação

**O que acontece:**

- Status do membro muda para "Saiu"
- Agendamentos futuros com a organização são cancelados
- Membro perde acesso a mentores exclusivos da organização
- Histórico de atividades é mantido

---

## Dashboard e Métricas

### Visão Geral

O dashboard fornece uma visão rápida da sua organização:

**Métricas Principais:**

- **Total de Mentores**: Mentores ativos na organização
- **Total de Mentees**: Mentees ativos
- **Agendamentos Mensais**: Sessões nos últimos 30 dias
- **Taxa de Conclusão**: % de sessões completadas
- **Mentores Ativos**: Mentores com sessões recentes

**Tópicos Mais Populares:**

- Lista dos 5 tópicos mais discutidos nas sessões
- Útil para entender as necessidades dos mentees

### Feed de Atividades

Acompanhe todas as atividades da organização:

- Novos membros entrando
- Membros saindo
- Convites enviados/aceitos/recusados
- Alterações de configurações

**Filtros:**

- Por tipo de atividade
- Por período (últimos 7, 30, 90 dias)

---

## Relatórios

### Relatório de Mentorias

Acesse relatórios detalhados sobre as sessões de mentoria:

1. Vá para **"Relatórios"** → **"Mentorias"**
2. Selecione o período desejado
3. Visualize:

**Resumo:**

- Total de agendamentos
- Agendamentos completados
- Taxa de conclusão
- Duração média das sessões

**Distribuição de Tópicos:**

- Gráfico mostrando os tópicos mais discutidos
- Percentual de cada tópico

**Top Mentores:**

- Ranking dos mentores mais ativos
- Número de sessões por mentor
- Taxa de conclusão individual

**Série Temporal:**

- Gráfico de agendamentos ao longo do tempo
- Identifique tendências e padrões

### Exportando Dados

Para análises mais profundas:

1. Clique em **"Exportar CSV"**
2. Selecione o período
3. Baixe o arquivo

**Dados incluídos no CSV:**

- Data e hora da sessão
- Mentor (nome e email)
- Mentee (nome e email)
- Duração
- Status
- Tópicos discutidos

---

## Configurações

### Informações da Organização

Atualize informações básicas:

1. Acesse **"Configurações"**
2. Edite:
   - Nome
   - Descrição
   - Logo
   - Website
   - Contatos
3. Salve as alterações

### Quotas e Limites

Visualize seus limites atuais:

- **Mentores**: Número máximo de mentores
- **Mentees**: Número máximo de mentees
- **Agendamentos Mensais**: Limite de sessões por mês

**Para aumentar limites:**

- Entre em contato com nossa equipe
- Ou faça upgrade do seu plano (se disponível)

### Notificações

Configure quais notificações você deseja receber:

- Novos membros entrando
- Membros saindo
- Convites expirados
- Relatórios semanais/mensais

---

## Perguntas Frequentes

### Como faço para ter mais de um administrador?

Convide o membro normalmente e depois altere sua função para "Admin" na lista de membros.

### O que acontece quando um convite expira?

Após 30 dias, o convite se torna inválido. Você pode reenviar o convite, que gerará um novo link válido por mais 30 dias.

### Posso remover um membro e convidá-lo novamente?

Sim, mas o histórico anterior será mantido. O membro receberá um novo convite.

### Como funciona a expiração de membership?

Se você definir uma data de expiração, o membro será automaticamente marcado como "Expirado" após essa data. Agendamentos futuros serão cancelados.

### Posso transferir a propriedade da organização?

Sim, promova outro membro a Admin e depois remova-se (desde que haja pelo menos um admin ativo).

### Quantos membros posso ter?

Depende do seu plano. Verifique em "Configurações" → "Quotas" ou entre em contato conosco.

---

## Suporte

Precisa de ajuda? Entre em contato:

- **Email**: suporte@menvo.com.br
- **Chat**: Disponível no canto inferior direito
- **Documentação**: https://docs.menvo.com.br

---

## Próximos Passos

Agora que você conhece as funcionalidades principais:

1. ✅ Convide seus primeiros membros
2. ✅ Configure as preferências da organização
3. ✅ Acompanhe as métricas no dashboard
4. ✅ Gere seu primeiro relatório

Boa sorte com sua organização! 🚀
