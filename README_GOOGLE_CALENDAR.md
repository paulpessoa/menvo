# 🚀 Google Calendar - Guia Rápido

## ⚡ TL;DR - O que você precisa fazer AGORA

### 1. Configure o Google Cloud Console (15 min)
Siga: `GUIA_SETUP_GOOGLE_CALENDAR.md`

Você vai precisar:
- Client ID
- Client Secret

### 2. Adicione no `.env.local` (1 min)
```env
GOOGLE_CALENDAR_CLIENT_ID=seu_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
GOOGLE_CALENDAR_REFRESH_TOKEN=vai_gerar_no_proximo_passo
```

### 3. Gere o Refresh Token (5 min)
```bash
node scripts/generate-refresh-token.js
```

Copie o token gerado e adicione no `.env.local`

### 4. Reinicie o servidor (1 min)
```bash
npm run dev
```

### 5. Teste (2 min)
Acesse: http://localhost:3000/test/calendar

Clique em "Testar Integração"

---

## ✅ O que foi implementado

### Código
- ✅ Serviço unificado de Google Calendar
- ✅ API de confirmação atualizada
- ✅ Campo de observações do mentor
- ✅ Página de teste
- ✅ Script de geração de token

### Funcionalidades
- ✅ Criar evento no Calendar ao confirmar mentoria
- ✅ Gerar link do Google Meet automaticamente
- ✅ Incluir mensagem do mentee na descrição
- ✅ Incluir observações do mentor na descrição
- ✅ Enviar convites por email
- ✅ Configurar lembretes (24h, 1h, 10min antes)

---

## 📚 Documentação Completa

- `CHECKLIST_IMPLEMENTACAO.md` - Passo a passo detalhado
- `GUIA_SETUP_GOOGLE_CALENDAR.md` - Como configurar Google Cloud
- `RELATORIO_GOOGLE_CALENDAR.md` - Análise técnica completa
- `CHANGELOG_GOOGLE_CALENDAR.md` - O que mudou no código

---

## 🎯 Fluxo Completo

```
1. Mentee solicita mentoria
   └─> Cria appointment (status: pending)
   └─> Salva mensagem do mentee

2. Mentor vê solicitação
   └─> Visualiza mensagem do mentee
   └─> Clica em "Confirmar Mentoria"

3. Modal abre
   └─> Mostra detalhes da mentoria
   └─> Mostra mensagem do mentee
   └─> Campo para observações do mentor

4. Mentor adiciona observações e confirma
   └─> API cria evento no Google Calendar
   └─> Gera link do Google Meet
   └─> Salva event_id e meet_link no banco
   └─> Muda status para "confirmed"
   └─> Envia emails de confirmação

5. Resultado
   ✅ Evento no Calendar de ambos
   ✅ Link do Meet disponível
   ✅ Convites enviados
   ✅ Lembretes configurados
```

---

## 🐛 Problemas Comuns

### "Google Calendar não configurado"
→ Adicione as 4 variáveis no `.env.local` e reinicie

### "invalid_grant"
→ Execute: `node scripts/generate-refresh-token.js`

### "access_denied"
→ Adicione seu email como "Test user" no Google Cloud Console

### Evento sem link do Meet
→ Verifique se a conta tem permissão para criar Meet

---

## 🎉 Quando funcionar, você terá:

- ✅ Eventos criados automaticamente
- ✅ Links do Google Meet gerados
- ✅ Convites enviados por email
- ✅ Lembretes automáticos
- ✅ Descrição completa com mensagens
- ✅ Tudo sincronizado

---

## 📞 Precisa de ajuda?

1. Teste em: http://localhost:3000/test/calendar
2. Veja os logs do servidor
3. Consulte `CHECKLIST_IMPLEMENTACAO.md`
4. Me chame com o erro específico

---

**Tempo total**: ~30 minutos
**Dificuldade**: Fácil (só seguir o passo a passo)
**Status**: ✅ Pronto para usar

Boa sorte! 🚀
