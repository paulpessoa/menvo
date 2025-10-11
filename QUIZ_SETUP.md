# 🎯 Setup do Sistema de Quiz - RecnPlay

## ✅ Status do Deploy

- ✅ Edge Functions deployadas
- ✅ Migration do banco aplicada
- ✅ Código frontend implementado

## 🔑 Configuração de Variáveis de Ambiente

### 1. Obter as Chaves da API

#### OpenAI API Key
1. Acesse: https://platform.openai.com/api-keys
2. Clique em "Create new secret key"
3. Copie a chave (começa com `sk-`)
4. **Importante:** Certifique-se de ter créditos na conta OpenAI

#### Brevo (Email) API Key
1. Acesse: https://app.brevo.com/settings/keys/api
2. Clique em "Generate a new API key"
3. Copie a chave (começa com `xkeysib-`)
4. Configure um email remetente verificado em: https://app.brevo.com/settings/senders
   - Recomendado: `noreply@menvo.com.br`

### 2. Adicionar no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/settings/functions
2. Clique em "Manage secrets"
3. Adicione as seguintes variáveis:

```bash
OPENAI_API_KEY=sk-proj-...
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@menvo.com.br
BREVO_SENDER_NAME=MENVO
NEXT_PUBLIC_SITE_URL=https://menvo.com.br
```

4. Clique em "Save" após adicionar cada variável

### 3. Verificar Configuração

Após adicionar as variáveis, as Edge Functions estarão prontas para uso.

## 🧪 Testar o Sistema

### Teste Completo do Fluxo

1. **Acesse a página do quiz:**
   ```
   https://menvo.com.br/quiz
   ```

2. **Preencha o questionário:**
   - Responda todas as 8 perguntas
   - Use um email real para receber o resultado

3. **Verifique a análise:**
   - Você será redirecionado para a página de resultados
   - Verifique se a pontuação aparece (0-1000)
   - Confira se os mentores sugeridos aparecem
   - Se pontuação >= 700, escolha seu brinde

4. **Verifique o email:**
   - Cheque sua caixa de entrada
   - Verifique também a pasta de spam
   - O email deve chegar em até 1 minuto

### Teste das Edge Functions (Opcional)

#### Testar analyze-quiz:
```bash
curl -i --location --request POST \
  'https://evxrzmzkghshjmmyegxu.supabase.co/functions/v1/analyze-quiz' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"responseId":"uuid-de-uma-resposta"}'
```

#### Testar send-quiz-email:
```bash
curl -i --location --request POST \
  'https://evxrzmzkghshjmmyegxu.supabase.co/functions/v1/send-quiz-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"responseId":"uuid-de-uma-resposta"}'
```

## 📊 Monitoramento

### Ver Logs das Functions

```bash
# Logs da análise com IA
supabase functions logs analyze-quiz --tail

# Logs do envio de email
supabase functions logs send-quiz-email --tail
```

### Verificar Respostas no Banco

1. Acesse: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/editor
2. Abra a tabela `quiz_responses`
3. Verifique:
   - `processed_at` - deve ter data/hora após processamento
   - `score` - pontuação calculada
   - `ai_analysis` - JSON com a análise completa
   - `email_sent` - deve ser `true` após envio

### Verificar Mentores

1. Abra a tabela `quiz_mentors`
2. Deve ter 5 mentores cadastrados:
   - Mentor de Tecnologia
   - Mentor de Liderança
   - Mentor de Carreira
   - Mentor de Empreendedorismo
   - Mentor de Desenvolvimento Pessoal

## 🐛 Troubleshooting

### Erro: "OpenAI API key not configured"
**Solução:**
- Verifique se `OPENAI_API_KEY` está configurada no Supabase
- Confirme que a chave é válida
- Verifique se tem créditos na conta OpenAI

### Erro: "Brevo API error"
**Solução:**
- Verifique se `BREVO_API_KEY` está configurada
- Confirme que o email remetente está verificado no Brevo
- Verifique os logs: https://app.brevo.com/log

### Email não chega
**Solução:**
- Verifique a pasta de spam
- Confirme que `email_sent` foi atualizado no banco
- Verifique os logs: `supabase functions logs send-quiz-email`
- Teste o email remetente no Brevo

### Análise demora muito
**Solução:**
- A OpenAI pode levar 5-10 segundos para responder
- Se demorar mais de 30 segundos, verifique os logs
- O sistema tem fallback automático se a IA falhar

### Pontuação sempre baixa
**Solução:**
- Verifique o prompt na Edge Function
- O sistema é configurado para dar 700-900 pontos na maioria dos casos
- Se estiver usando fallback, a pontuação base é 700

## 📈 Métricas Importantes

### Para o RecnPlay

- **Taxa de conclusão:** Quantos completam o quiz
- **Pontuação média:** Deve estar entre 750-850
- **Brindes ganhos:** Quantos têm score >= 700 (esperado: 80-90%)
- **Emails enviados:** Taxa de sucesso de envio
- **Potenciais mentores:** Quantos demonstram interesse em compartilhar conhecimento

### Consultas SQL Úteis

```sql
-- Total de respostas
SELECT COUNT(*) FROM quiz_responses;

-- Pontuação média
SELECT AVG(score) FROM quiz_responses WHERE score IS NOT NULL;

-- Quantos ganharam brinde
SELECT COUNT(*) FROM quiz_responses WHERE score >= 700;

-- Potenciais mentores
SELECT COUNT(*) FROM quiz_responses 
WHERE (ai_analysis->>'potencial_mentor')::boolean = true;

-- Áreas mais procuradas
SELECT 
  unnest(development_areas) as area,
  COUNT(*) as total
FROM quiz_responses
GROUP BY area
ORDER BY total DESC;

-- Taxa de envio de email
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN email_sent THEN 1 ELSE 0 END) as enviados,
  ROUND(100.0 * SUM(CASE WHEN email_sent THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_envio
FROM quiz_responses;
```

## 🎉 Pronto para o RecnPlay!

O sistema está completamente funcional e pronto para uso no evento. Certifique-se de:

1. ✅ Variáveis de ambiente configuradas
2. ✅ Testar o fluxo completo pelo menos uma vez
3. ✅ Verificar que os emails estão chegando
4. ✅ Preparar os brindes (canetas e bottons)
5. ✅ Ter um tablet/computador no estande para mostrar os resultados

## 📞 Suporte

Se encontrar problemas durante o evento:

1. Verifique os logs das functions
2. Consulte a tabela `quiz_responses` no Supabase
3. Verifique o dashboard do Brevo para status de emails
4. Em último caso, o sistema tem fallback automático

Boa sorte no RecnPlay! 🚀
