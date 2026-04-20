# 🕵️ REVISÃO FINAL DE URLs (20-04-2026)

Este documento identifica o que deve ser mantido ou removido nos painéis externos baseado na nova arquitetura blindada.

---

## 🔵 GOOGLE CLOUD CONSOLE

### Origens JavaScript autorizadas
* `https://menvo.com.br` -> **MANTER**
* `http://localhost:3000` -> **MANTER**
* `https://evxrzmzkghshjmmyegxu.supabase.co` -> **REMOVER** (Google não precisa disso aqui)

### URIs de redirecionamento autorizados
* `https://evxrzmzkghshjmmyegxu.supabase.co/auth/v1/callback` -> **MANTER (O MAIS IMPORTANTE)**
* `https://menvo.com.br/api/auth/google-calendar/callback` -> **MANTER** (Para integração de agenda)
* `http://localhost:3000/api/auth/google-calendar/callback` -> **MANTER**
* `https://menvo.com.br/auth/callback` -> **REMOVER** (Google não fala direto com o Menvo no login)
* `https://menvo.com.br` -> **REMOVER**
* `https://menvo.com.br/auth/userinfo.email` -> **REMOVER** (Isso é escopo, não URL)

---

## 🔗 LINKEDIN DEVELOPERS

### Authorized redirect URLs
* `https://evxrzmzkghshjmmyegxu.supabase.co/auth/v1/callback` -> **MANTER (O MAIS IMPORTANTE)**
* `https://www.menvo.com.br/auth/callback` -> **REMOVER** (LinkedIn fala apenas com o Supabase)
* `https://www.menvo.com.br/api/auth/callback` -> **REMOVER**
* Todas as URLs `vercel.app` -> **REMOVER** (Use apenas o domínio oficial e o Supabase)

---

## ⚡ SUPABASE DASHBOARD

### Site URL
* `https://menvo.com.br/` -> **MANTER**

### Redirect URLs
* `https://www.menvo.com.br/auth/callback` -> **MANTER (ÚNICA NECESSÁRIA PARA O AUTH NOVO)**
* `https://menvo.com.br/**` -> **MANTER** (Curinga de segurança)
* `http://localhost:3000/**` -> **MANTER**
* `https://menvo.com.br/reset-password` -> **MANTER**
* `https://menvo.com.br/update-password` -> **MANTER**
* Qualquer URL com `/api/auth/callback` -> **REMOVER** (Mudamos para `/auth/callback` sem o `api`)
* Qualquer URL com `/pt-BR/` ou outro idioma -> **REMOVER** (O middleware novo lida com isso)

---

## 🧠 RESUMO STAFF
O fluxo agora é:
1. Usuário clica no Menvo.
2. Vai para o Google/LinkedIn.
3. Google/LinkedIn devolve para o **Supabase**.
4. Supabase devolve para o Menvo em **`/auth/callback`**.
5. O Menvo detecta o idioma e joga para o **Dashboard**.
