# 🔐 Environment Variables Guide — Menvo

> **Single Source of Truth** for Menvo environment variables across Local Development, Preview, and Production (Vercel).
> All template keys are defined in [`.env.example`](../../.env.example).

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
| `GROQ_API_KEY` | Optional | Server-only | Groq key for fallback inference and Assistant |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Server-only | Google AI key for Gemini 2.5 Flash-Lite fallback in the Assistant |
| `AI_METERING_KEY` | **Required for AI cost metering** | Server-only | Proves AI usage rows come from the server (`record_ai_usage` rejects calls without it). Its SHA-256 must be stored in `private.ai_settings` — see migration `20260923000003`. Missing = usage not recorded, so the monthly budget can't see the spend |
| `AI_FORCE_FALLBACK` | Optional, evals-only | Local, never set in Production/Preview | Set to a capability name (e.g. `converse`) to make `lib/ai/models` drop the primary model for that one capability, so `npm run test:evals`/`npm run eval:match` can exercise the fallback model deliberately (ADR 0004 §7.1). |

### Scheduled Jobs (Vercel Cron)
| Variable | Required | Context | Description |
|---|---|---|---|
| `CRON_SECRET` | **Required for `/api/cron/account-retention`** | Server-only | Bearer token Vercel Cron sends as `Authorization: Bearer ${CRON_SECRET}`. Unlike the pre-existing `ai-retention`/`appointments` crons, `account-retention` fails **closed**: missing → 500, not an open endpoint. See `docs/domains/account-retention.md` §5. |
| `RETENTION_MODE` | Optional (default `dry_run`) | Server-only | `dry_run` computes and logs the account-retention plan without writing or sending anything; `live` executes it. Keep at `dry_run` until a Paul-reviewed dry run looks correct. |
| `RETENTION_MAX_EMAILS_PER_RUN` | Optional (default `100`) | Server-only | Caps 30-day + 1-day retention notices sent per cron run (shares the Brevo daily quota with reengagement campaigns). |
| `RETENTION_MAX_DELETIONS_PER_RUN` | Optional (default `25`) | Server-only | Caps accounts deleted per cron run, to stay inside the Vercel function timeout. |

### Analytics (Microsoft Clarity MCP)
| Variable | Required | Context | Description |
|---|---|---|---|
| `CLARITY_API_TOKEN` | Optional | Local dev tooling only | Used by `.mcp.json`'s `clarity` MCP server (`${CLARITY_API_TOKEN}`) to query session recordings and dashboard analytics from an agent session. Set via `.claude/settings.local.json` (`env` block) or a user-level OS env var — never committed. Not used by the running app itself. |

---

## 3. Security Guidelines

- **Never** expose `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CALENDAR_CLIENT_SECRET`, or `BREVO_API_KEY` to client components.
- Any variable prefixed with `NEXT_PUBLIC_` is bundled into client JavaScript and publicly readable.
