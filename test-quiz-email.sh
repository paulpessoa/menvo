#!/bin/bash

# Script para testar o sistema de email do quiz

echo "🧪 Testando Sistema de Email do Quiz RecnPlay"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar última resposta do quiz
echo "📊 1. Verificando última resposta do quiz..."
echo ""
echo "Execute este SQL no Supabase:"
echo ""
echo "SELECT id, name, email, score, processed_at, email_sent, email_sent_at"
echo "FROM quiz_responses"
echo "ORDER BY created_at DESC"
echo "LIMIT 1;"
echo ""
read -p "Cole o ID da resposta aqui: " RESPONSE_ID
echo ""

if [ -z "$RESPONSE_ID" ]; then
    echo -e "${RED}❌ ID não fornecido. Abortando.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ID recebido: $RESPONSE_ID${NC}"
echo ""

# 2. Pegar ANON_KEY
echo "🔑 2. Pegue sua ANON_KEY do Supabase"
echo "URL: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/settings/api"
echo ""
read -p "Cole a ANON_KEY aqui: " ANON_KEY
echo ""

if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}❌ ANON_KEY não fornecida. Abortando.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ANON_KEY recebida${NC}"
echo ""

# 3. Testar Edge Function de email
echo "📧 3. Testando envio de email..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" --location --request POST \
  "https://evxrzmzkghshjmmyegxu.supabase.co/functions/v1/send-quiz-email" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data "{\"responseId\":\"$RESPONSE_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Status HTTP: $HTTP_CODE"
echo "Resposta: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Email enviado com sucesso!${NC}"
    echo ""
    echo "Verifique:"
    echo "1. Caixa de entrada do email"
    echo "2. Pasta de spam"
    echo "3. Logs do Brevo: https://app.brevo.com/log"
else
    echo -e "${RED}❌ Erro ao enviar email${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Verificar logs: https://supabase.com/dashboard/project/evxrzmzkghshjmmyegxu/functions/send-quiz-email/logs"
    echo "2. Verificar variáveis de ambiente no Supabase"
    echo "3. Verificar se BREVO_API_KEY está configurada"
fi

echo ""
echo "=============================================="
echo "Teste concluído!"
