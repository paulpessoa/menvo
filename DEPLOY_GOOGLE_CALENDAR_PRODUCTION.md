# 🚀 Deploy Google Calendar - Produção

## 📋 Checklist Completo

### 1️⃣ Configurar Google Cloud Console

- [ ] Acesse: https://console.cloud.google.com/apis/credentials
- [ ] Clique no cliente OAuth "Menvo"
- [ ] Em **"URIs de redirecionamento autorizados"**, adicione:
  ```
  https://menvo.com.br/setup/google-calendar/callback
  ```
- [ ] Clique em **"SALVAR"**

**⚠️ IMPORTANTE**: Use `/setup/google-calendar/callback` (não `/api/...`). Esta é uma página que mostra o código para você copiar!

---

### 2️⃣ Gerar Refresh Token de Produção

Execute o script:

```bash
node scripts/generate-refresh-token-production.js
```

**O que vai acontecer:**

1. Script gera uma URL
2. Você abre a URL no navegador
3. Faz login com a conta Google que vai criar os eventos
4. Autoriza o app
5. É redirecionado para uma página que **mostra o código**
6. Clica no botão **"Copiar"** na página
7. Cola no terminal
8. Script gera o `refresh_token`

**💡 Dica**: A página mostra o código de forma clara para você copiar facilmente!

**⚠️ IMPORTANTE**: Use a conta Google que você quer que crie TODOS os eventos de mentoria!

---

### 3️⃣ Adicionar Variáveis na Vercel

Acesse: https://vercel.com/seu-projeto/settings/environment-variables

Adicione estas 4 variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `GOOGLE_CALENDAR_CLIENT_ID` | (copie do script) | Production |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | (copie do script) | Production |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `https://menvo.com.br/setup/google-calendar/callback` | Production |
| `GOOGLE_CALENDAR_REFRESH_TOKEN` | (copie do script) | Production |

**Como adicionar:**

1. Clique em **"Add New"**
2. Cole o **Nome** da variável
3. Cole o **Valor**
4. Selecione **"Production"** em Environment
5. Clique em **"Save"**
6. Repita para as 4 variáveis

---

### 4️⃣ Redeploy do Projeto

Após adicionar as variáveis:

**Opção A - Via Dashboard:**
1. Vá em: https://vercel.com/seu-projeto/deployments
2. Clique nos 3 pontinhos do último deploy
3. Clique em **"Redeploy"**

**Opção B - Via Git:**
```bash
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push origin main
```

---

### 5️⃣ Testar em Produção

Após o deploy:

1. Acesse: https://menvo.com.br/test/calendar
2. Clique em **"Testar Integração"**
3. Verifique se:
   - ✅ Evento é criado
   - ✅ Link do Meet é gerado
   - ✅ Aparece no Google Calendar

---

### 6️⃣ Testar Fluxo Completo

1. Como mentee, solicite uma mentoria
2. Como mentor, confirme a mentoria
3. Verifique se:
   - ✅ Evento aparece no Google Calendar
   - ✅ Link do Meet está disponível
   - ✅ Ambos recebem email
   - ✅ Convites do Calendar chegam

---

## 🔒 Segurança

### Quem precisa estar na lista de teste?

**Apenas a conta que tem o refresh_token!**

- ✅ A conta que você usou para gerar o token
- ❌ Mentores NÃO precisam
- ❌ Mentees NÃO precisam

### Publicar o App (Opcional)

Se quiser remover o modo "Em teste":

1. Acesse: https://console.cloud.google.com/apis/credentials/consent
2. Clique em **"PUBLICAR APLICATIVO"**
3. Siga o processo de verificação do Google (pode levar dias)

**Mas não é necessário!** O app funciona perfeitamente em modo teste.

---

## 🐛 Troubleshooting

### Erro: "Login Required"
- Verifique se o refresh_token está correto na Vercel
- Gere um novo token se necessário

### Erro: "redirect_uri_mismatch"
- Verifique se a URI de produção está no Google Cloud Console
- Deve ser EXATAMENTE: `https://menvo.com.br/setup/google-calendar/callback`

### Evento não é criado
- Verifique os logs na Vercel: https://vercel.com/seu-projeto/logs
- Procure por erros com `[CALENDAR]`

### Email não chega
- Verifique se o Brevo está configurado
- Verifique os logs do Brevo

---

## 📊 Monitoramento

### Ver logs em tempo real:

```bash
vercel logs --follow
```

### Ver logs de uma função específica:

```bash
vercel logs --follow --filter="/api/appointments/confirm"
```

---

## ✅ Checklist Final

Antes de considerar pronto:

- [ ] URI de produção adicionada no Google Cloud Console
- [ ] Refresh token de produção gerado
- [ ] 4 variáveis adicionadas na Vercel
- [ ] Redeploy realizado
- [ ] Teste em /test/calendar funcionou
- [ ] Fluxo completo de mentoria testado
- [ ] Evento aparece no Google Calendar
- [ ] Link do Meet funciona
- [ ] Emails chegam

---

## 🎉 Pronto!

Sua integração do Google Calendar está em produção! 🚀

**Dúvidas?** Consulte:
- `README_GOOGLE_CALENDAR.md` - Guia rápido
- `GUIA_SETUP_GOOGLE_CALENDAR.md` - Setup detalhado
