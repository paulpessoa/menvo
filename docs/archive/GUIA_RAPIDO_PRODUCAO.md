# 🚀 Guia Rápido - Produção

## ⚡ Passo a Passo Simplificado

### 1️⃣ Gerar Refresh Token

Execute:
```bash
node scripts/generate-production-token-simple.js
```

**O que fazer:**
1. Escolha a opção 1 (https://menvo.com.br/auth/callback)
2. Abra a URL no navegador
3. Autorize com a conta Google que vai criar os eventos
4. Copie o código da URL
5. Cole no terminal
6. Copie o refresh_token gerado

---

### 2️⃣ Adicionar Variáveis na Vercel

Acesse: https://vercel.com/paulpessoa/menvo/settings/environment-variables

Adicione estas 4 variáveis (Environment: **Production**):

```
GOOGLE_CALENDAR_CLIENT_ID=(copie do .env.local)
GOOGLE_CALENDAR_CLIENT_SECRET=(copie do .env.local)
GOOGLE_CALENDAR_REDIRECT_URI=https://menvo.com.br/auth/callback
GOOGLE_CALENDAR_REFRESH_TOKEN=(cole o token que você gerou)
```

**💡 Dica**: Os valores de CLIENT_ID e CLIENT_SECRET estão no seu `.env.local`

**⚠️ IMPORTANTE**: Marque apenas **Production**, não marque Preview nem Development!

---

### 3️⃣ Redeploy

Após adicionar as variáveis:

**Opção A - Via Dashboard:**
1. https://vercel.com/paulpessoa/menvo/deployments
2. Clique nos 3 pontinhos do último deploy
3. "Redeploy"

**Opção B - Via Git:**
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

### 4️⃣ Testar

Após o deploy:
1. Acesse: https://menvo.com.br/test/calendar
2. Clique em "Testar Integração"
3. Deve criar um evento no Google Calendar

---

## 🐛 Se der erro:

### Erro: "redirect_uri_mismatch"
- A URI não está no Google Cloud Console
- Adicione: https://menvo.com.br/auth/callback

### Erro: "Login Required"
- O refresh_token está errado ou não foi adicionado
- Gere um novo token

### Erro: "Failed to trigger confirmation flow"
- Faltam variáveis de ambiente na Vercel
- Verifique se as 4 variáveis estão em Production

---

## 📊 Ver Logs em Produção

https://vercel.com/paulpessoa/menvo/logs

Procure por:
- `[CONFIRM]` - Logs da confirmação
- `[CALENDAR]` - Logs do Google Calendar
- Erros em vermelho

---

## ✅ Checklist

- [ ] Refresh token gerado
- [ ] 4 variáveis adicionadas na Vercel (Production)
- [ ] Redeploy feito
- [ ] Teste em /test/calendar funcionou
- [ ] Teste de mentoria completo funcionou

---

**Dúvidas?** Veja os logs na Vercel!
