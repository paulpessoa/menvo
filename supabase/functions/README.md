# Supabase Edge Functions - Quiz System

Este diretório contém as Edge Functions para o sistema de questionário do RecnPlay.

## Functions

### 1. analyze-quiz
Processa as respostas do questionário usando OpenAI GPT-4 e gera análise personalizada.

**Endpoint:** `POST /functions/v1/analyze-quiz`

**Body:**
```json
{
  "responseId": "uuid-da-resposta"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": { ... },
  "usedFallback": false,
  "responseId": "uuid"
}
```

### 2. send-quiz-email
Envia email com os resultados da análise usando Brevo (Sendinblue).

**Endpoint:** `POST /functions/v1/send-quiz-email`

**Body:**
```json
{
  "responseId": "uuid-da-resposta"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

## Configuração de Variáveis de Ambiente

### No Supabase Dashboard

1. Acesse: Project Settings > Edge Functions > Manage secrets
2. Adicione as seguintes variáveis:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Brevo (Email)
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@menvo.com.br
BREVO_SENDER_NAME=MENVO

# Site URL
NEXT_PUBLIC_SITE_URL=https://menvo.com.br
```

### Localmente (para testes)

Crie um arquivo `.env` na raiz do projeto:

```bash
OPENAI_API_KEY=sk-...
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@menvo.com.br
BREVO_SENDER_NAME=MENVO
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Deploy

Para fazer deploy das functions:

```bash
# Deploy todas as functions
supabase functions deploy

# Deploy uma function específica
supabase functions deploy analyze-quiz
supabase functions deploy send-quiz-email
```

## Teste Local

Para testar localmente:

```bash
# Inicie o servidor local do Supabase
supabase start

# Sirva as functions localmente
supabase functions serve

# Teste a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/analyze-quiz' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"responseId":"uuid-here"}'
```

## Obter Chaves da API

### OpenAI
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova API key
3. Copie a chave (começa com `sk-`)

### Brevo (Email)
1. Acesse: https://app.brevo.com/settings/keys/api
2. Crie uma nova API key
3. Copie a chave (começa com `xkeysib-`)
4. Configure um email remetente verificado em: https://app.brevo.com/settings/senders

## Fluxo de Execução

1. Usuário completa o questionário
2. Resposta é salva no banco de dados
3. `analyze-quiz` é chamada:
   - Busca a resposta do banco
   - Busca mentores disponíveis
   - Chama OpenAI GPT-4 para análise
   - Se falhar, usa análise fallback
   - Salva análise no banco
   - Dispara `send-quiz-email`
4. `send-quiz-email`:
   - Busca resposta com análise
   - Gera template HTML do email
   - Envia via Brevo
   - Atualiza status de email enviado

## Troubleshooting

### Erro: "OpenAI API key not configured"
- Verifique se `OPENAI_API_KEY` está configurada no Supabase
- Confirme que a chave é válida e tem créditos

### Erro: "Brevo API error"
- Verifique se `BREVO_API_KEY` está configurada
- Confirme que o email remetente está verificado no Brevo
- Verifique os logs do Brevo: https://app.brevo.com/log

### Email não chega
- Verifique a pasta de spam
- Confirme que `email_sent` foi atualizado no banco
- Verifique os logs da function: `supabase functions logs send-quiz-email`

## Monitoramento

Para ver logs das functions:

```bash
# Logs em tempo real
supabase functions logs analyze-quiz --tail

# Logs específicos
supabase functions logs send-quiz-email --limit 100
```
