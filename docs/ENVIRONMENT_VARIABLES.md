# 🔐 Environment Variables Guide — Menvo

> **Single Source of Truth** for Menvo environment variables across Local Development, Preview, and Production (Vercel).
> All template keys are defined in [`.env.example`](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/menvo/.env.example).

---

## 1. Quick Setup

```bash
# Copy template to local environment
cp .env.example .env.local
```

---

## 2. Variables Reference

### Supabase (Database & Auth)
| Variable | Required | Context | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client & Server | Project API URL (`https://*.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client & Server | Anonymous public key with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only | Elevated admin operations (BFF, migrations) |
| `SUPABASE_ACCESS_TOKEN` | Optional | CLI | Supabase CLI deployment token |

### Application URLs & Routing
| Variable | Required | Context | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Client & Server | Canonical site URL (e.g. `https://www.menvo.com.br`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Client & Server | Base application URL |
| `NEXT_PUBLIC_OAUTH_CALLBACK_URL` | Yes | Client & Server | OAuth callback destination (`/auth/callback`) |
| `NEXT_PUBLIC_RESET_PASSWORD_URL` | Yes | Client & Server | Password recovery target (`/update-password`) |

### Feature Flags
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_FEATURE_WAITING_LIST` | `false` | When true, gates new registrations behind waiting list |
| `NEXT_PUBLIC_FEATURE_NEW_USER_REGISTRATION` | `true` | Allows immediate account creation |

### Google Calendar Integration (Meet Scheduling)
| Variable | Required | Context | Description |
|---|---|---|---|
| `GOOGLE_CALENDAR_CLIENT_ID` | Yes | Server-only | Google Cloud OAuth Client ID |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Yes | Server-only | Google Cloud OAuth Client Secret |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Yes | Server-only | Authorized callback URI |
| `GOOGLE_CALENDAR_REFRESH_TOKEN` | Yes | Server-only | Long-lived platform refresh token |

### Email Service (Brevo / Transactional SMTP)
| Variable | Required | Context | Description |
|---|---|---|---|
| `BREVO_API_KEY` | Yes | Server-only | Brevo REST API Key |
| `BREVO_SMTP_API_KEY` | Optional | Server-only | Brevo SMTP password |
| `BREVO_SENDER_EMAIL` | Yes | Server-only | Verified sender email (`contato@menvo.com.br`) |
| `BREVO_SENDER_NAME` | Yes | Server-only | Sender name (`Menvo`) |

### AI Providers (Mentor Match & Quiz Analysis)
| Variable | Required | Context | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Recommended | Server-only | OpenAI key for GPT-4o-mini matching |
| `GROQ_API_KEY` | Optional | Server-only | Groq key for fallback inference |

---

## 3. Security Guidelines

- **Never** expose `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CALENDAR_CLIENT_SECRET`, or `BREVO_API_KEY` to client components.
- Any variable prefixed with `NEXT_PUBLIC_` is bundled into client JavaScript and publicly readable.
