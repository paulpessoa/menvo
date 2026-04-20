# 🔐 Guia de Configuração de Autenticação Social (Menvo 2026)

Este documento descreve as URLs exatas que devem estar configuradas em cada plataforma para que o login com Google e LinkedIn funcione perfeitamente, evitando erros de redirecionamento ou de troca de código (PKCE).

---

## 1. Google Cloud Console
**Onde configurar:** APIs & Services > Credentials > OAuth 2.0 Client IDs

O Google não conversa diretamente com o site do Menvo. Ele conversa com a infraestrutura do **Supabase**.

| Campo | Valor Exato (Copie e Cole) |
| :--- | :--- |
| **Authorized redirect URIs** | `https://evxrzmzkghshjmmyegxu.supabase.co/auth/v1/callback` |

> **⚠️ ATENÇÃO:** Remova qualquer URL que contenha `menvo.com.br` deste campo. O Google deve enviar o código apenas para o Supabase.

---

## 2. LinkedIn Developers
**Onde configurar:** Auth > OAuth 2.0 settings

| Campo | Valor Exato (Copie e Cole) |
| :--- | :--- |
| **Authorized redirect URLs** | `https://evxrzmzkghshjmmyegxu.supabase.co/auth/v1/callback` |

> **💡 Dica Senior:** Certifique-se de que o produto "Sign In with LinkedIn using OpenID Connect" está habilitado na aba "Products" do seu App no LinkedIn.

---

## 3. Supabase Dashboard
**Onde configurar:** Authentication > URL Configuration

Aqui é onde o Supabase decide para onde mandar o usuário de volta após validar o login do Google/LinkedIn.

### Site URL
| Valor Exato |
| :--- |
| `https://www.menvo.com.br` |

### Redirect URLs
Adicione estas duas URLs na lista:
1. `https://www.menvo.com.br/api/auth/callback` (Esta é a rota técnica que processa o login)
2. `https://www.menvo.com.br/callback` (Fallback de segurança)

---

## 🚀 Como testar localmente?
Se você quiser que o login funcione no seu computador enquanto desenvolve, adicione estas URLs temporárias no **Supabase**:
*   **Redirect URLs:** `http://localhost:3000/api/auth/callback`

---

## 🧠 Por que usamos `/api/auth/callback`?
Em projetos com múltiplos idiomas, se usarmos apenas `/callback`, o sistema de tradução pode redirecionar para `/pt-BR/callback`. Esse pequeno "pulo" de redirecionamento faz o navegador perder os cookies de segurança (PKCE), gerando o erro **4/0A**. 

Ao usar uma rota dentro de `/api/`, o Next.js ignora as regras de idioma, permitindo uma troca de código "limpa" e instantânea.
