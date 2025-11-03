# Environment Variables Documentation

This document describes all environment variables required for the Menvo platform, including the multi-tenant organizations feature.

## Required Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`

- **Required:** Yes
- **Description:** Your Supabase project URL
- **Example:** `https://xxxxx.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Required:** Yes
- **Description:** Supabase anonymous/public key for client-side operations
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API
- **Security:** Safe to expose in client-side code

#### `SUPABASE_SERVICE_ROLE_KEY`

- **Required:** Yes (for organizations feature)
- **Description:** Supabase service role key for server-side admin operations
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API
- **Security:** ⚠️ **NEVER expose this in client-side code!** Only use in API routes and server components
- **Used for:**
  - Creating/managing organizations
  - Sending invitations
  - Admin operations (approve, suspend organizations)
  - Bulk operations
  - Cron jobs

---

### Email Service (Brevo)

#### `BREVO_API_KEY`

- **Required:** Yes
- **Description:** Brevo (formerly Sendinblue) API key for sending emails
- **Example:** `xkeysib-xxxxx`
- **Where to find:** Brevo Dashboard → SMTP & API → API Keys
- **Used for:**
  - Organization invitations
  - Approval notifications
  - Member activity notifications
  - Appointment confirmations

#### `BREVO_SENDER_EMAIL`

- **Required:** Yes
- **Description:** Email address to use as sender
- **Example:** `noreply@menvo.com.br`
- **Note:** Must be verified in Brevo

#### `BREVO_SENDER_NAME`

- **Required:** Yes
- **Description:** Display name for email sender
- **Example:** `MENVO`
- **Default:** `MENVO`

---

### Application Configuration

#### `NEXT_PUBLIC_SITE_URL`

- **Required:** Yes
- **Description:** Full URL of your application (used in emails and redirects)
- **Example:** `https://menvo.com.br`
- **Note:** Should NOT include trailing slash
- **Used for:**
  - Invitation acceptance links
  - Email links
  - OAuth redirects

#### `NEXT_PUBLIC_APP_URL`

- **Required:** Optional (defaults to NEXT_PUBLIC_SITE_URL)
- **Description:** Alternative app URL if different from site URL
- **Example:** `https://app.menvo.com.br`

---

### Cron Jobs

#### `CRON_SECRET`

- **Required:** Yes (for production)
- **Description:** Secret token to authenticate cron job requests
- **Example:** `your_random_secret_token_here`
- **How to generate:** `openssl rand -base64 32`
- **Security:** Keep this secret! Used to prevent unauthorized cron job execution
- **Used for:**
  - `/api/cron/expire-memberships` - Daily job to expire memberships
  - `/api/cron/expire-invitations` - Daily job to expire invitations
- **Configuration:** Set in Vercel → Project Settings → Environment Variables

---

### Optional Variables

#### `OPENAI_API_KEY`

- **Required:** No (for AI features)
- **Description:** OpenAI API key for AI-powered features
- **Example:** `sk-xxxxx`
- **Where to find:** OpenAI Dashboard → API Keys

---

## Environment Setup

### Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable with its value
3. Select environments: Production, Preview, Development
4. Save and redeploy

### Staging

Use the same variables as production but with staging-specific values:

- Different Supabase project
- Different email sender (e.g., `staging@menvo.com.br`)
- Different site URL (e.g., `https://staging.menvo.com.br`)

---

## Security Best Practices

### ⚠️ Never Commit Secrets

- Never commit `.env.local` or `.env` files
- Use `.env.example` for documentation only (no real values)
- Add `.env*` to `.gitignore` (except `.env.example`)

### 🔒 Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS):

- Only use in API routes (`app/api/**`)
- Never use in client components
- Never expose in browser
- Rotate regularly (every 90 days recommended)

### 🔐 Cron Secret

- Generate a strong random token
- Rotate after any suspected compromise
- Use different secrets for staging and production

---

## Troubleshooting

### "Unauthorized" errors in organization APIs

**Cause:** Missing or invalid `SUPABASE_SERVICE_ROLE_KEY`

**Solution:**

1. Verify the key is set in environment variables
2. Check it matches your Supabase project
3. Restart your development server

### Emails not sending

**Cause:** Missing or invalid Brevo configuration

**Solution:**

1. Verify `BREVO_API_KEY` is correct
2. Check sender email is verified in Brevo
3. Check Brevo API logs for errors

### Cron jobs not running

**Cause:** Missing or incorrect `CRON_SECRET`

**Solution:**

1. Verify `CRON_SECRET` is set in Vercel
2. Check `vercel.json` cron configuration
3. View Vercel logs for cron execution

### Invitation links not working

**Cause:** Incorrect `NEXT_PUBLIC_SITE_URL`

**Solution:**

1. Verify URL matches your deployment
2. Ensure no trailing slash
3. Check protocol (http vs https)

---

## Verification Checklist

Before deploying to production, verify:

- [ ] All required variables are set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is correct and secure
- [ ] Brevo sender email is verified
- [ ] `NEXT_PUBLIC_SITE_URL` matches deployment URL
- [ ] `CRON_SECRET` is generated and set
- [ ] All secrets are different from staging
- [ ] `.env.local` is in `.gitignore`
- [ ] Test email sending works
- [ ] Test cron jobs execute successfully

---

## Support

For issues with:

- **Supabase:** https://supabase.com/docs
- **Brevo:** https://developers.brevo.com/
- **Vercel:** https://vercel.com/docs
