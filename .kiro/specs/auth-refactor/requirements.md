# Requirements Document - MVP

## Introduction

Esta refatoração visa simplificar e profissionalizar o sistema de autenticação da plataforma de mentores voluntários para um MVP funcional. O objetivo é eliminar redundâncias, consolidar arquivos duplicados, limpar o banco de dados Supabase e implementar um fluxo de autenticação enxuto com suporte a email, Google e LinkedIn. Inclui também funcionalidades básicas para listagem de mentores verificados e agendamento via Google Calendar.

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, eu quero fazer backup e configurar ambiente local do Supabase, para que possa trabalhar com segurança sem perder dados de produção.

#### Acceptance Criteria

1. WHEN fazendo backup THEN o sistema SHALL exportar dados da tabela auth.users para preservar usuários existentes
2. WHEN fazendo backup THEN o sistema SHALL exportar dados de todas as tabelas customizadas
3. WHEN configurando local THEN o sistema SHALL executar Supabase localmente via CLI
4. WHEN configurando local THEN o sistema SHALL aplicar migrações no ambiente local
5. WHEN testando THEN o sistema SHALL validar funcionamento local antes de aplicar em produção

### Requirement 2

**User Story:** Como desenvolvedor, eu quero limpar seletivamente o banco de dados Supabase, para que possamos reorganizar mantendo os usuários existentes.

#### Acceptance Criteria

1. WHEN executando a limpeza THEN o sistema SHALL preservar a tabela auth.users nativa do Supabase
2. WHEN executando a limpeza THEN o sistema SHALL remover apenas tabelas customizadas desnecessárias
3. WHEN executando a limpeza THEN o sistema SHALL remover functions obsoletas
4. WHEN executando a limpeza THEN o sistema SHALL remover triggers desnecessários
5. WHEN executando a limpeza THEN o sistema SHALL remover policies obsoletas

### Requirement 3

**User Story:** Como desenvolvedor, eu quero consolidar e simplificar os arquivos de autenticação, para que o código seja mais maintível e profissional.

#### Acceptance Criteria

1. WHEN refatorando THEN o sistema SHALL eliminar arquivos duplicados de autenticação (useAuth, AuthGuard, auth-context, etc.)
2. WHEN refatorando THEN o sistema SHALL manter apenas um hook principal de autenticação
3. WHEN refatorando THEN o sistema SHALL manter apenas um componente de proteção de rotas
4. WHEN refatorando THEN o sistema SHALL manter apenas um provider de contexto de autenticação
5. WHEN consolidando THEN o sistema SHALL preservar toda funcionalidade essencial

### Requirement 4

**User Story:** Como usuário, eu quero me cadastrar usando email, Google ou LinkedIn, para que tenha opções convenientes de acesso à plataforma.

#### Acceptance Criteria

1. WHEN acessando o cadastro THEN o sistema SHALL oferecer opção de cadastro por email
2. WHEN acessando o cadastro THEN o sistema SHALL oferecer opção de cadastro por Google
3. WHEN acessando o cadastro THEN o sistema SHALL oferecer opção de cadastro por LinkedIn
4. WHEN cadastrando THEN o sistema SHALL confirmar email antes de permitir login
5. WHEN cadastrando THEN o sistema SHALL criar perfil básico sem role definida (null)

### Requirement 5

**User Story:** Como usuário, eu quero fazer login usando as mesmas opções do cadastro, para que tenha consistência na experiência.

#### Acceptance Criteria

1. WHEN fazendo login THEN o sistema SHALL aceitar email e senha
2. WHEN fazendo login THEN o sistema SHALL aceitar autenticação via Google
3. WHEN fazendo login THEN o sistema SHALL aceitar autenticação via LinkedIn
4. WHEN autenticando com email não confirmado THEN o sistema SHALL bloquear acesso e mostrar mensagem
5. WHEN falhando autenticação THEN o sistema SHALL mostrar mensagem de erro clara

### Requirement 6

**User Story:** Como usuário autenticado sem papel definido, eu quero selecionar obrigatoriamente entre "mentor" ou "mentee", para que possa acessar a plataforma com as permissões adequadas.

#### Acceptance Criteria

1. WHEN fazendo login com role null/vazia THEN o sistema SHALL redirecionar para página de seleção de papel
2. WHEN na página de seleção THEN o sistema SHALL oferecer apenas opções "mentor" e "mentee"
3. WHEN selecionando papel THEN o sistema SHALL atualizar user_roles com papel escolhido
4. WHEN tentando acessar outras páginas sem papel definido THEN o sistema SHALL redirecionar para seleção de papel
5. WHEN completando seleção de papel THEN o sistema SHALL redirecionar para dashboard apropriado

### Requirement 7

**User Story:** Como desenvolvedor, eu quero uma estrutura de banco de dados simplificada para MVP, para que seja mais fácil de manter e escalar.

#### Acceptance Criteria

1. WHEN criando estrutura THEN o sistema SHALL ter tabela profiles com campos essenciais (id, email, first_name, last_name, full_name, avatar_url, verified, created_at, updated_at)
2. WHEN criando estrutura THEN o sistema SHALL ter campo verified como boolean simples (default false)
3. WHEN criando estrutura THEN o sistema SHALL ter tabela user_roles para relacionamento usuário-papel (pode ser null inicialmente)
4. WHEN criando estrutura THEN o sistema SHALL ter tabela roles apenas com papéis básicos (mentee, mentor, admin)
5. WHEN criando estrutura THEN o sistema SHALL ter storage bucket para imagens de perfil
6. WHEN criando estrutura THEN o sistema SHALL ter tabela mentor_availability para disponibilidade dos mentores
7. WHEN criando estrutura THEN o sistema SHALL ter tabela appointments para agendamentos

### Requirement 8

**User Story:** Como desenvolvedor, eu quero triggers e functions essenciais, para que o sistema funcione automaticamente sem código redundante.

#### Acceptance Criteria

1. WHEN usuário se cadastra THEN o sistema SHALL criar perfil automaticamente via trigger sem role definida
2. WHEN usuário se cadastra THEN o sistema SHALL gerar slug único para username via function
3. WHEN usuário faz login THEN o sistema SHALL incluir roles e verified status no JWT via custom claims function
4. WHEN usuário seleciona papel THEN o sistema SHALL criar entrada em user_roles com papel escolhido
5. WHEN atualizando perfil THEN o sistema SHALL manter campos de auditoria atualizados
6. WHEN deletando usuário THEN o sistema SHALL limpar dados relacionados via cascade

### Requirement 9

**User Story:** Como administrador, eu quero verificar mentores de forma simples, para que apenas mentores qualificados apareçam na listagem pública.

#### Acceptance Criteria

1. WHEN admin acessa painel THEN o sistema SHALL mostrar lista de mentores não verificados
2. WHEN admin revisa mentor THEN o sistema SHALL permitir marcar como verificado ou não
3. WHEN mentor é verificado THEN o sistema SHALL atualizar campo verified para true
4. WHEN mentor é verificado THEN o sistema SHALL tornar perfil visível na página de mentores
5. WHEN mentor não verificado THEN o sistema SHALL manter perfil oculto da listagem pública

### Requirement 10

**User Story:** Como usuário, eu quero ver mentores verificados em uma página pública, para que possa escolher com quem agendar uma mentoria.

#### Acceptance Criteria

1. WHEN acessando página de mentores THEN o sistema SHALL mostrar apenas mentores verificados
2. WHEN visualizando mentor THEN o sistema SHALL mostrar perfil, especialidades e disponibilidade
3. WHEN clicando em mentor THEN o sistema SHALL abrir página individual do mentor
4. WHEN na página do mentor THEN o sistema SHALL mostrar horários disponíveis de forma simples
5. WHEN mentor tem horários THEN o sistema SHALL permitir solicitar agendamento

### Requirement 11

**User Story:** Como mentor, eu quero definir minha disponibilidade de forma simples, para que mentees possam agendar comigo.

#### Acceptance Criteria

1. WHEN mentor acessa configurações THEN o sistema SHALL permitir definir dias da semana disponíveis
2. WHEN definindo disponibilidade THEN o sistema SHALL permitir definir horários por dia
3. WHEN salvando disponibilidade THEN o sistema SHALL armazenar na tabela mentor_availability
4. WHEN mentee solicita agendamento THEN o sistema SHALL verificar disponibilidade
5. WHEN agendamento confirmado THEN o sistema SHALL criar evento no Google Calendar com link do Meet

### Requirement 12

**User Story:** Como desenvolvedor, eu quero manter endpoints essenciais do Next.js, para que funcionalidades server-side continuem funcionando.

#### Acceptance Criteria

1. WHEN mantendo endpoints THEN o sistema SHALL preservar aqueles que usam ROLE_KEY server-side
2. WHEN simplificando THEN o sistema SHALL remover endpoints duplicados ou desnecessários
3. WHEN possível THEN o sistema SHALL migrar para client-side do Supabase
4. WHEN usando ROLE_KEY THEN o sistema SHALL manter variável de ambiente segura
5. WHEN refatorando THEN o sistema SHALL documentar quais endpoints foram mantidos e por quê

### Requirement 13

**User Story:** Como desenvolvedor, eu quero manter o layout atual, para que não haja impacto visual desnecessário durante a refatoração.

#### Acceptance Criteria

1. WHEN refatorando THEN o sistema SHALL preservar todos os componentes visuais existentes
2. WHEN refatorando THEN o sistema SHALL manter a mesma estrutura de páginas
3. WHEN refatorando THEN o sistema SHALL remover apenas campos desnecessários dos formulários
4. WHEN refatorando THEN o sistema SHALL manter a mesma experiência do usuário
5. WHEN refatorando THEN o sistema SHALL preservar estilos e temas existentes

## Funcionalidades para Fase 2 (Pós-MVP)

### Feature Flags da Vercel
- Lista de espera controlada por feature flag
- Controle granular de funcionalidades
- A/B testing de features

### Sistema de Verificação Avançado
- Múltiplos métodos de verificação (vídeo, documento, chamada)
- Workflow de aprovação com comentários
- Notificações automáticas

### Sistema de Permissões Granular
- Roles adicionais (volunteer, moderator)
- Permissões específicas por funcionalidade
- Controle de acesso mais refinado

### Funcionalidades Avançadas de Agendamento
- Integração completa com Google Calendar
- Notificações automáticas
- Reagendamento e cancelamento
- Histórico de mentorias
