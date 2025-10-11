# Teste do Sistema de Email - Quiz RecnPlay

## 1. Verificar Variáveis de Ambiente no Supabase

Acesse: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/settings/functions

Verifique se estas variáveis estão configuradas:
- ✅ `OPENAI_API_KEY` - Chave da OpenAI
- ✅ `BREVO_API_KEY` - Chave do Brevo
- ✅ `BREVO_SENDER_EMAIL` - Email remetente (ex: noreply@menvo.com.br)
- ✅ `BREVO_SENDER_NAME` - Nome remetente (ex: MENVO)
- ✅ `NEXT_PUBLIC_SITE_URL` - URL do site (ex: https://menvo.com.br)

## 2. Verificar no Banco de Dados

Acesse: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/editor

Execute esta query:

```sql
SELECT 
  id,
  name,
  email,
  score,
  processed_at,
  email_sent,
  email_sent_at,
  created_at
FROM quiz_responses
ORDER BY created_at DESC
LIMIT 5;
```

**O que verificar:**
- `processed_at` deve ter data/hora (análise foi processada)
- `email_sent` deve ser `true` (email foi enviado)
- `email_sent_at` deve ter data/hora

## 3. Verificar Logs das Edge Functions

### Logs da função analyze-quiz:
```bash
# No terminal local
supabase functions logs analyze-quiz
```

Ou acesse: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/functions/analyze-quiz/logs

**O que procurar:**
- Erros de OpenAI API
- Erros ao salvar no banco
- Confirmação de que disparou o email

### Logs da função send-quiz-email:
```bash
# No terminal local
supabase functions logs send-quiz-email
```

Ou acesse: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/functions/send-quiz-email/logs

**O que procurar:**
- Erros de Brevo API
- Erros de configuração
- Confirmação de envio

## 4. Testar Manualmente a Edge Function de Email

### Via cURL:

```bash
curl -i --location --request POST \
  'https://evxrzmzkghshjmmyegxu.supabase.co/functions/v1/send-quiz-email' \
  --header 'Authorization: Bearer SEU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"responseId":"ID_DA_RESPOSTA_DO_QUIZ"}'
```

**Onde encontrar:**
- `SEU_ANON_KEY`: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/settings/api
- `ID_DA_RESPOSTA_DO_QUIZ`: Pegue da query SQL acima (coluna `id`)

## 5. Verificar no Brevo

Acesse: https://app.brevo.com/log

**O que verificar:**
- Se há tentativas de envio
- Status dos emails (enviado, falhou, etc)
- Erros de API

## 6. Possíveis Problemas e Soluções

### Problema 1: Email não está sendo disparado
**Causa:** A função `analyze-quiz` não está chamando `send-quiz-email`

**Solução:** Verificar se o código está correto em `supabase/functions/analyze-quiz/index.ts`

### Problema 2: Brevo API Key inválida
**Causa:** Chave não configurada ou inválida

**Solução:** 
1. Gerar nova chave em: https://app.brevo.com/settings/keys/api
2. Adicionar no Supabase: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/settings/functions

### Problema 3: Email remetente não verificado
**Causa:** Email em `BREVO_SENDER_EMAIL` não está verificado no Brevo

**Solução:**
1. Verificar email em: https://app.brevo.com/settings/senders
2. Adicionar e verificar o domínio

### Problema 4: Rate limit do Brevo
**Causa:** Muitos emails enviados rapidamente (plano gratuito tem limite)

**Solução:** Aguardar ou fazer upgrade do plano

### Problema 5: Edge Function timeout
**Causa:** OpenAI demora muito e a função expira antes de enviar email

**Solução:** Já implementado - email é disparado de forma assíncrona (fire and forget)

## 7. Teste Rápido

Execute este teste para verificar se tudo está funcionando:

1. Preencha o quiz em: https://menvo.com.br/quiz
2. Use um email real que você tenha acesso
3. Aguarde 30 segundos
4. Verifique:
   - ✅ Página de resultados carregou?
   - ✅ Pontuação apareceu?
   - ✅ Mentores foram sugeridos?
   - ✅ Email chegou na caixa de entrada?
   - ✅ Email está na pasta de spam?

## 8. Debug Avançado

Se nada funcionar, rode este SQL para forçar o envio de email:

```sql
-- Pegar ID de uma resposta recente
SELECT id, email FROM quiz_responses ORDER BY created_at DESC LIMIT 1;

-- Marcar como não enviado para reenviar
UPDATE quiz_responses 
SET email_sent = false, email_sent_at = null 
WHERE id = 'COLE_O_ID_AQUI';
```

Depois chame a Edge Function manualmente com o cURL acima.
