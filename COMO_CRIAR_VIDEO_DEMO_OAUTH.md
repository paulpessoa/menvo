# Como Criar o Vídeo de Demonstração do OAuth

## Ferramentas Recomendadas

### Opção 1: Loom (Mais Fácil)
- **Site:** https://www.loom.com
- **Vantagens:** Gratuito, fácil de usar, grava tela e webcam
- **Como usar:**
  1. Crie uma conta gratuita
  2. Instale a extensão do Chrome
  3. Clique no ícone do Loom
  4. Selecione "Screen Only"
  5. Grave o fluxo
  6. Compartilhe o link

### Opção 2: OBS Studio (Gratuito e Profissional)
- **Site:** https://obsproject.com
- **Vantagens:** Totalmente gratuito, mais controle
- **Como usar:**
  1. Baixe e instale
  2. Configure a captura de tela
  3. Grave o fluxo
  4. Faça upload no YouTube

### Opção 3: Windows Game Bar (Já vem no Windows)
- **Atalho:** Windows + G
- **Vantagens:** Já está instalado
- **Como usar:**
  1. Pressione Windows + G
  2. Clique no botão de gravar
  3. Grave o fluxo
  4. Faça upload no YouTube

---

## Roteiro do Vídeo (2-3 minutos)

### Cena 1: Login (15 segundos)
1. Abra https://menvo.com.br
2. Clique em "Entrar"
3. Faça login com suas credenciais
4. **Narração:** "Primeiro, faço login na plataforma Menvo"

### Cena 2: Navegação até Mentores (15 segundos)
1. Clique em "Encontrar Mentores"
2. Navegue pelos mentores disponíveis
3. Selecione um mentor
4. **Narração:** "Navego até a lista de mentores e seleciono um"

### Cena 3: Agendamento (30 segundos)
1. Clique em "Agendar Sessão"
2. Selecione data e horário
3. Adicione observações
4. Clique em "Solicitar Mentoria"
5. **Narração:** "Seleciono um horário disponível e solicito a mentoria"

### Cena 4: Confirmação pelo Mentor (30 segundos)
1. Faça login como mentor (ou simule)
2. Vá para "Minhas Mentorias"
3. Veja a solicitação pendente
4. Clique em "Confirmar"
5. **IMPORTANTE:** Aqui deve aparecer a tela de consentimento OAuth do Google
6. **Narração:** "O mentor confirma a sessão, e o sistema solicita permissão para criar o evento no Google Calendar"

### Cena 5: Tela de Consentimento OAuth (45 segundos) ⭐ MAIS IMPORTANTE
1. **Mostre claramente a tela de consentimento do Google**
2. Destaque os escopos solicitados:
   - "Ver, editar, compartilhar e excluir permanentemente todos os calendários que você pode acessar usando o Google Agenda"
3. Mostre o nome da aplicação: "Menvo"
4. Clique em "Permitir"
5. **Narração:** "A tela de consentimento do Google mostra claramente que o Menvo solicita acesso ao Calendar apenas para criar eventos de mentoria. Clico em Permitir."

### Cena 6: Evento Criado (30 segundos)
1. Abra o Google Calendar em outra aba
2. Mostre o evento criado
3. Mostre os detalhes:
   - Título: "Mentoria: [Nome Mentor] & [Nome Mentorado]"
   - Data e hora
   - Participantes (mentor e mentorado)
   - Link do Google Meet
4. **Narração:** "O evento foi criado automaticamente no Google Calendar com todos os detalhes da mentoria e link do Meet"

### Cena 7: Convites Enviados (15 segundos)
1. Mostre o e-mail de convite recebido
2. Mostre que ambos os participantes foram convidados
3. **Narração:** "Ambos os participantes receberam o convite por e-mail"

---

## Checklist Antes de Gravar

- [ ] Limpe o histórico do navegador (para mostrar o fluxo limpo)
- [ ] Feche abas desnecessárias
- [ ] Desative notificações do sistema
- [ ] Teste o áudio do microfone
- [ ] Prepare duas contas: uma de mentor e uma de mentorado
- [ ] Certifique-se de que a conta do mentor NÃO tem o Google Calendar conectado ainda

---

## Checklist Durante a Gravação

- [ ] Grave em resolução HD (1280x720 ou 1920x1080)
- [ ] Fale claramente e devagar
- [ ] Mostre CLARAMENTE a tela de consentimento OAuth
- [ ] Destaque os escopos solicitados
- [ ] Mostre o evento criado no Google Calendar
- [ ] Mostre os convites enviados

---

## Checklist Depois de Gravar

- [ ] Revise o vídeo completo
- [ ] Certifique-se de que a tela de consentimento OAuth está visível
- [ ] Adicione legendas (opcional, mas recomendado)
- [ ] Faça upload no YouTube
- [ ] Configure como "Não listado" (para que apenas quem tem o link possa ver)
- [ ] Copie o link do vídeo
- [ ] Adicione o link no template de resposta ao Google

---

## Dicas Importantes

### ⚠️ CRÍTICO: Tela de Consentimento OAuth
- Esta é a parte MAIS IMPORTANTE do vídeo
- O Google precisa ver claramente:
  - A tela de consentimento aparecendo
  - Os escopos solicitados
  - O nome da aplicação (Menvo)
  - O usuário clicando em "Permitir"

### 💡 Dicas de Gravação
- Grave em um ambiente silencioso
- Use um microfone de qualidade (ou o do fone de ouvido)
- Fale de forma clara e pausada
- Se errar, não tem problema! Você pode editar depois
- Grave em partes se necessário

### 🎬 Edição (Opcional)
- Use um editor simples como:
  - Windows Video Editor (gratuito no Windows)
  - iMovie (gratuito no Mac)
  - DaVinci Resolve (gratuito e profissional)
- Corte partes desnecessárias
- Adicione legendas explicativas
- Adicione setas ou destaques na tela de consentimento

---

## Upload no YouTube

1. Acesse https://studio.youtube.com
2. Clique em "Criar" > "Enviar vídeos"
3. Selecione o arquivo do vídeo
4. Preencha:
   - **Título:** "Menvo - OAuth Consent Screen Workflow Demo"
   - **Descrição:** "Demonstration of OAuth consent screen workflow for Menvo mentorship platform. Shows Google Calendar API integration for creating mentorship events."
   - **Visibilidade:** "Não listado"
5. Clique em "Publicar"
6. Copie o link do vídeo

---

## Exemplo de Link Final

Após o upload, o link será algo como:
```
https://www.youtube.com/watch?v=ABC123XYZ
```

Adicione este link no template de resposta ao Google!

---

## Problemas Comuns

### A tela de consentimento não aparece
- **Solução:** Revogue o acesso do Menvo nas configurações do Google e tente novamente
- **Como revogar:** https://myaccount.google.com/permissions

### O vídeo ficou muito grande
- **Solução:** Comprima o vídeo usando:
  - HandBrake (gratuito): https://handbrake.fr
  - CloudConvert (online): https://cloudconvert.com

### Não consigo narrar
- **Solução:** Adicione legendas de texto no vídeo explicando cada etapa

---

## Tempo Estimado

- Preparação: 15 minutos
- Gravação: 30 minutos (incluindo tentativas)
- Edição (opcional): 15 minutos
- Upload: 10 minutos
- **Total: ~1 hora**

Boa sorte! 🎬
