# Requirements Document

## Introduction

Este documento define os requisitos para melhorar a funcionalidade da página de perfil do usuário, corrigindo problemas críticos com upload de imagem, salvamento de dados do perfil e implementando o upload de currículo em PDF. A página de perfil é essencial para que os usuários possam gerenciar suas informações pessoais e profissionais na plataforma de mentoria.

## Requirements

### Requirement 1

**User Story:** Como usuário, eu quero fazer upload da minha foto de perfil, para que outros usuários possam me identificar visualmente na plataforma.

#### Acceptance Criteria

1. WHEN o usuário clica no botão "Alterar Foto" THEN o sistema SHALL abrir um seletor de arquivos que aceita apenas imagens (jpg, png, webp, gif)
2. WHEN o usuário seleciona uma imagem válida THEN o sistema SHALL fazer upload da imagem para o bucket "profile-photos" do Supabase Storage
3. WHEN o upload é bem-sucedido THEN o sistema SHALL atualizar o campo avatar_url no perfil do usuário com a URL pública da imagem
4. WHEN o upload é bem-sucedido THEN o sistema SHALL exibir a nova imagem imediatamente na interface
5. IF o upload falhar THEN o sistema SHALL exibir uma mensagem de erro clara para o usuário
6. WHEN uma nova imagem é enviada THEN o sistema SHALL substituir a imagem anterior no storage
7. WHEN o usuário não tem imagem THEN o sistema SHALL exibir um avatar com as iniciais do nome

### Requirement 2

**User Story:** Como usuário, eu quero salvar todas as informações do meu perfil, para que meus dados sejam persistidos e atualizados na plataforma.

#### Acceptance Criteria

1. WHEN o usuário preenche os campos do formulário de perfil THEN o sistema SHALL validar os dados obrigatórios (nome, sobrenome)
2. WHEN o usuário clica em "Salvar Perfil" THEN o sistema SHALL enviar todos os dados do formulário para a API de atualização
3. WHEN a atualização é bem-sucedida THEN o sistema SHALL exibir uma mensagem de sucesso
4. WHEN a atualização é bem-sucedida THEN o sistema SHALL manter os dados atualizados na interface
5. IF a atualização falhar THEN o sistema SHALL exibir uma mensagem de erro específica
6. WHEN há campos obrigatórios vazios THEN o sistema SHALL impedir o envio e destacar os campos necessários
7. WHEN o usuário navega entre as abas THEN o sistema SHALL manter os dados preenchidos sem perder informações

### Requirement 3

**User Story:** Como usuário, eu quero fazer upload do meu currículo em formato PDF, para que mentores possam conhecer melhor meu background profissional.

#### Acceptance Criteria

1. WHEN o usuário clica no botão "Subir CV (PDF)" THEN o sistema SHALL abrir um seletor de arquivos que aceita apenas PDFs
2. WHEN o usuário seleciona um arquivo PDF válido THEN o sistema SHALL verificar se o arquivo não excede 5MB
3. WHEN o arquivo é válido THEN o sistema SHALL fazer upload para um bucket "cvs" no Supabase Storage
4. WHEN o upload é bem-sucedido THEN o sistema SHALL atualizar o campo cv_url no perfil do usuário
5. WHEN o upload é bem-sucedido THEN o sistema SHALL exibir o nome do arquivo e um link para visualização
6. IF o arquivo não for PDF THEN o sistema SHALL exibir erro "Apenas arquivos PDF são aceitos"
7. IF o arquivo exceder 5MB THEN o sistema SHALL exibir erro "Arquivo muito grande. Máximo 5MB"
8. WHEN já existe um CV THEN o sistema SHALL permitir substituição e remover o arquivo anterior
9. WHEN o usuário tem CV salvo THEN o sistema SHALL exibir opção para visualizar ou remover o arquivo

### Requirement 4

**User Story:** Como usuário, eu quero receber feedback claro sobre o status das minhas ações, para que eu saiba se minhas operações foram bem-sucedidas ou se houve algum erro.

#### Acceptance Criteria

1. WHEN qualquer operação está em andamento THEN o sistema SHALL exibir indicadores de loading apropriados
2. WHEN uma operação é bem-sucedida THEN o sistema SHALL exibir mensagem de sucesso por 3 segundos
3. WHEN uma operação falha THEN o sistema SHALL exibir mensagem de erro específica e acionável
4. WHEN há erro de conectividade THEN o sistema SHALL exibir "Erro de conexão. Tente novamente"
5. WHEN há erro de permissão THEN o sistema SHALL exibir "Você não tem permissão para esta ação"
6. WHEN há erro de validação THEN o sistema SHALL destacar os campos com problema e exibir mensagens específicas
7. WHEN o usuário tenta sair com dados não salvos THEN o sistema SHALL exibir confirmação

### Requirement 5

**User Story:** Como usuário, eu quero que meu currículo PDF seja recuperado corretamente após recarregar a página, para que eu não precise fazer upload novamente a cada sessão.

#### Acceptance Criteria

1. WHEN o usuário tem um CV salvo THEN o sistema SHALL exibir o status "CV enviado" ao carregar a página
2. WHEN o usuário tem um CV salvo THEN o sistema SHALL exibir os botões "Ver" e "Remover" em vez do botão de upload
3. WHEN o usuário clica em "Ver" THEN o sistema SHALL abrir o PDF em uma nova aba
4. WHEN o usuário recarrega a página THEN o sistema SHALL manter o estado do CV salvo
5. WHEN o perfil é carregado THEN o sistema SHALL verificar se cv_url existe e exibir a interface apropriada
6. IF cv_url existe mas o arquivo não está acessível THEN o sistema SHALL exibir opção para fazer novo upload
7. WHEN o usuário faz logout e login novamente THEN o sistema SHALL manter o CV salvo

### Requirement 6

**User Story:** Como mentor, eu quero ter acesso a todos os campos específicos de mentoria no meu perfil, para que eu possa configurar completamente minha oferta de mentoria.

#### Acceptance Criteria

1. WHEN o usuário é um mentor THEN o sistema SHALL exibir a seção "Idiomas" com opções para Português, English, Español
2. WHEN o usuário é um mentor THEN o sistema SHALL exibir o campo "Áreas de Expertise" com sugestões relevantes
3. WHEN o usuário é um mentor THEN o sistema SHALL exibir o campo "Tópicos de Mentoria" com sugestões
4. WHEN o usuário é um mentor THEN o sistema SHALL exibir o campo "Tags Inclusivas" com opções apropriadas
5. WHEN o usuário é um mentor THEN o sistema SHALL exibir o campo "Abordagem da Mentoria" como textarea
6. WHEN o usuário é um mentor THEN o sistema SHALL exibir o campo "O que Esperar" como textarea
7. WHEN o usuário é um mentor THEN o sistema SHALL exibir o campo "Mentee Ideal" como textarea
8. WHEN o usuário é um mentor THEN o sistema SHALL exibir informação sobre "Mentorias Gratuitas"
9. WHEN o usuário salva o perfil THEN o sistema SHALL persistir todos os campos de mentoria

### Requirement 7

**User Story:** Como usuário, eu quero ter acesso a todos os campos básicos e profissionais no meu perfil, para que eu possa manter minhas informações completas e atualizadas.

#### Acceptance Criteria

1. WHEN o usuário acessa o perfil THEN o sistema SHALL exibir o campo "Slug do Perfil" com preview da URL
2. WHEN o usuário acessa o perfil THEN o sistema SHALL exibir todos os campos de "Informações Profissionais"
3. WHEN o usuário acessa o perfil THEN o sistema SHALL exibir a seção "Localização" com campos de endereço
4. WHEN o usuário preenche o endereço THEN o sistema SHALL mostrar aviso sobre privacidade
5. WHEN o usuário salva o perfil THEN o sistema SHALL persistir todos os campos básicos e profissionais
6. WHEN o usuário acessa o perfil THEN o sistema SHALL exibir a seção "Documentos e Integrações"
7. WHEN o usuário faz upload do CV THEN o sistema SHALL analisar automaticamente para preencher campos

### Requirement 8

**User Story:** Como desenvolvedor, eu quero que o sistema tenha logs adequados e tratamento de erros, para que possamos diagnosticar e resolver problemas rapidamente.

#### Acceptance Criteria

1. WHEN ocorre um erro de upload THEN o sistema SHALL registrar detalhes do erro no console
2. WHEN ocorre erro de API THEN o sistema SHALL registrar a resposta completa do erro
3. WHEN há falha de storage THEN o sistema SHALL registrar informações sobre bucket, arquivo e permissões
4. WHEN há erro de validação THEN o sistema SHALL registrar os dados que falharam na validação
5. IF há erro não tratado THEN o sistema SHALL capturar e registrar o erro com stack trace
6. WHEN operações são bem-sucedidas THEN o sistema SHALL registrar confirmação no console (modo desenvolvimento)