# Requirements Document

## Introduction

Este documento define os requisitos para o sistema "Meus Arquivos" - uma funcionalidade que permite aos usuários fazer upload, visualizar e gerenciar seus arquivos pessoais. Os arquivos serão armazenados no Amazon S3 e os metadados registrados no Supabase para controle de acesso e organização por usuário.

## Requirements

### Requirement 1

**User Story:** Como um usuário logado, eu quero acessar uma página "Meus Arquivos" para visualizar todos os meus arquivos enviados, para que eu possa gerenciar meus documentos de forma organizada.

#### Acceptance Criteria

1. WHEN o usuário navegar para /meus-arquivos THEN o sistema SHALL exibir uma página com listagem dos arquivos do usuário
2. WHEN a página carregar THEN o sistema SHALL mostrar apenas os arquivos pertencentes ao usuário logado
3. IF o usuário não estiver autenticado THEN o sistema SHALL redirecionar para a página de login
4. WHEN a listagem estiver vazia THEN o sistema SHALL exibir uma mensagem informativa "Nenhum arquivo encontrado"

### Requirement 2

**User Story:** Como um usuário, eu quero fazer upload de arquivos através de uma interface intuitiva, para que eu possa armazenar meus documentos na plataforma.

#### Acceptance Criteria

1. WHEN o usuário clicar em "Enviar Arquivo" THEN o sistema SHALL abrir um seletor de arquivos
2. WHEN o usuário selecionar um arquivo THEN o sistema SHALL validar o tipo e tamanho do arquivo
3. IF o arquivo for válido THEN o sistema SHALL fazer upload para o S3 e registrar no Supabase
4. WHEN o upload for concluído THEN o sistema SHALL atualizar a listagem automaticamente
5. IF o upload falhar THEN o sistema SHALL exibir uma mensagem de erro clara
6. WHEN o upload estiver em progresso THEN o sistema SHALL mostrar uma barra de progresso

### Requirement 3

**User Story:** Como um usuário, eu quero visualizar informações detalhadas dos meus arquivos (nome, tamanho, data de upload), para que eu possa identificar e organizar melhor meus documentos.

#### Acceptance Criteria

1. WHEN a listagem for exibida THEN o sistema SHALL mostrar nome do arquivo, tamanho e data de upload
2. WHEN o usuário clicar em um arquivo THEN o sistema SHALL permitir download ou visualização
3. WHEN o arquivo for uma imagem THEN o sistema SHALL exibir uma miniatura
4. IF o arquivo for um PDF THEN o sistema SHALL permitir visualização inline

### Requirement 4

**User Story:** Como um usuário, eu quero poder excluir arquivos que não preciso mais, para que eu possa manter meu espaço organizado.

#### Acceptance Criteria

1. WHEN o usuário clicar em "Excluir" THEN o sistema SHALL solicitar confirmação
2. WHEN a exclusão for confirmada THEN o sistema SHALL remover o arquivo do S3 e do Supabase
3. WHEN a exclusão for concluída THEN o sistema SHALL atualizar a listagem automaticamente
4. IF a exclusão falhar THEN o sistema SHALL exibir uma mensagem de erro

### Requirement 5

**User Story:** Como administrador do sistema, eu quero que os arquivos sejam armazenados de forma segura no S3 com controle de acesso adequado, para que apenas o proprietário possa acessar seus arquivos.

#### Acceptance Criteria

1. WHEN um arquivo for enviado THEN o sistema SHALL armazenar no S3 com path único por usuário
2. WHEN um usuário tentar acessar um arquivo THEN o sistema SHALL verificar se ele é o proprietário
3. IF o usuário não for o proprietário THEN o sistema SHALL negar o acesso
4. WHEN os metadados forem salvos THEN o sistema SHALL incluir user_id, nome original, tamanho e tipo MIME

### Requirement 6

**User Story:** Como usuário, eu quero que o sistema suporte diferentes tipos de arquivo comuns (PDF, imagens, documentos), para que eu possa armazenar diversos tipos de documentos.

#### Acceptance Criteria

1. WHEN o usuário selecionar um arquivo THEN o sistema SHALL aceitar PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX
2. WHEN o arquivo exceder 10MB THEN o sistema SHALL rejeitar o upload com mensagem clara
3. IF o tipo de arquivo não for suportado THEN o sistema SHALL exibir lista de tipos aceitos
4. WHEN o arquivo for aceito THEN o sistema SHALL detectar automaticamente o tipo MIME

### Requirement 7

**User Story:** Como desenvolvedor, eu quero que o sistema seja configurado corretamente com AWS S3 e Supabase, para que a funcionalidade opere de forma confiável.

#### Acceptance Criteria

1. WHEN o sistema inicializar THEN o sistema SHALL ter configurações válidas do S3 (bucket, região, credenciais)
2. WHEN um arquivo for enviado THEN o sistema SHALL usar signed URLs para upload seguro
3. WHEN os metadados forem salvos THEN o sistema SHALL usar a tabela 'user_files' no Supabase
4. IF as configurações estiverem incorretas THEN o sistema SHALL falhar de forma controlada com logs apropriados