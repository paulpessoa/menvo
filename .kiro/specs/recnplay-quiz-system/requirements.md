# Requirements Document

## Introduction

O sistema de questionário inteligente do RecnPlay é uma ferramenta de geração de leads que coleta informações sobre necessidades de mentoria dos participantes do evento. O sistema oferece um questionário rápido e envolvente que, ao ser completado, gera uma análise personalizada com sugestões de mentores usando IA (OpenAI GPT), além de enviar automaticamente um convite por email para a plataforma MENVO.

## Requirements

### Requirement 1

**User Story:** Como organizador do RecnPlay, eu quero coletar informações dos participantes através de um questionário rápido, para que eu possa entender suas necessidades de mentoria e gerar leads qualificados.

#### Acceptance Criteria

1. WHEN um participante acessa o questionário THEN o sistema SHALL apresentar um formulário com 5-7 perguntas mistas (múltipla escolha e abertas)
2. WHEN o participante completa o questionário THEN o sistema SHALL salvar as respostas no banco de dados
3. WHEN as respostas são salvas THEN o sistema SHALL processar automaticamente as informações via API da OpenAI
4. IF o processamento da IA falhar THEN o sistema SHALL usar um fallback com respostas pré-definidas baseadas nas respostas

### Requirement 2

**User Story:** Como participante do RecnPlay, eu quero receber uma análise personalizada das minhas necessidades de mentoria, para que eu possa entender melhor meu momento de carreira e descobrir oportunidades.

#### Acceptance Criteria

1. WHEN o questionário é submetido THEN o sistema SHALL gerar uma análise personalizada usando OpenAI GPT
2. WHEN a análise é gerada THEN o sistema SHALL incluir uma pontuação de compatibilidade (0-100)
3. WHEN a análise é gerada THEN o sistema SHALL incluir sugestões específicas de tipos de mentores
4. WHEN a análise é gerada THEN o sistema SHALL incluir conselhos personalizados para o momento de carreira
5. WHEN a análise é gerada THEN o sistema SHALL incluir elogios e motivação baseados nas respostas
6. WHEN a análise é gerada THEN o sistema SHALL sugerir áreas de desenvolvimento específicas

### Requirement 3

**User Story:** Como participante do RecnPlay, eu quero receber automaticamente um convite por email para a plataforma MENVO, para que eu possa continuar minha jornada de mentoria após o evento.

#### Acceptance Criteria

1. WHEN o questionário é completado THEN o sistema SHALL enviar automaticamente um email de convite
2. WHEN o email é enviado THEN o sistema SHALL incluir um link personalizado de convite para a plataforma
3. WHEN o email é enviado THEN o sistema SHALL incluir um resumo da análise gerada
4. IF o envio do email falhar THEN o sistema SHALL registrar o erro e permitir reenvio manual

### Requirement 4

**User Story:** Como organizador do RecnPlay, eu quero coletar dados sobre as necessidades dos participantes, para que eu possa identificar quais tipos de mentores voluntários devo recrutar.

#### Acceptance Criteria

1. WHEN respostas são coletadas THEN o sistema SHALL armazenar dados estruturados sobre necessidades de mentoria
2. WHEN dados são armazenados THEN o sistema SHALL permitir análise posterior das tendências
3. WHEN análises são solicitadas THEN o sistema SHALL fornecer insights sobre tipos de mentores mais procurados
4. WHEN dados são coletados THEN o sistema SHALL manter privacidade e conformidade com LGPD

### Requirement 5

**User Story:** Como desenvolvedor, eu quero que o sistema seja responsivo e rápido, para que os participantes tenham uma experiência fluida durante o evento.

#### Acceptance Criteria

1. WHEN o questionário é acessado THEN o sistema SHALL carregar em menos de 3 segundos
2. WHEN o questionário é submetido THEN o sistema SHALL processar em menos de 10 segundos
3. WHEN o sistema é acessado via mobile THEN o sistema SHALL ser totalmente responsivo
4. WHEN múltiplos usuários acessam simultaneamente THEN o sistema SHALL manter performance adequada

### Requirement 6

**User Story:** Como organizador do RecnPlay, eu quero oferecer brindes aos participantes, para que eles se sintam valorizados e engajados com a iniciativa.

#### Acceptance Criteria

1. WHEN o questionário é completado THEN o sistema SHALL informar sobre os brindes disponíveis
2. WHEN a análise é apresentada THEN o sistema SHALL incluir informações sobre como retirar os brindes
3. WHEN brindes são mencionados THEN o sistema SHALL manter o tom descontraído e acolhedor
4. IF não houver orçamento para brindes THEN o sistema SHALL focar no valor da análise personalizada como recompensa

### Requirement 7

**User Story:** Como administrador do sistema, eu quero monitorar o uso e performance do questionário, para que eu possa otimizar a experiência e identificar problemas.

#### Acceptance Criteria

1. WHEN questionários são submetidos THEN o sistema SHALL registrar métricas de uso
2. WHEN erros ocorrem THEN o sistema SHALL registrar logs detalhados
3. WHEN a IA é utilizada THEN o sistema SHALL monitorar custos e uso da API
4. WHEN emails são enviados THEN o sistema SHALL rastrear taxa de entrega e abertura
### Requ
irement 8

**User Story:** Como organizador do RecnPlay, eu quero coletar informações específicas sobre experiências e interesses em mentoria, para que eu possa qualificar melhor os leads e entender o perfil dos participantes.

#### Acceptance Criteria

1. WHEN o questionário é apresentado THEN o sistema SHALL incluir perguntas sobre experiência prévia com mentoria
2. WHEN o questionário é apresentado THEN o sistema SHALL incluir perguntas sobre temas de interesse para mentoria
3. WHEN o questionário é apresentado THEN o sistema SHALL incluir perguntas sobre momento de carreira atual
4. WHEN o questionário é apresentado THEN o sistema SHALL incluir pelo menos 2 perguntas abertas para capturar necessidades específicas
5. WHEN respostas são coletadas THEN o sistema SHALL categorizar automaticamente os temas de interesse mencionados