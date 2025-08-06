# OAuth Setup for Menvo

This document outlines the steps to set up OAuth providers (Google, GitHub, LinkedIn) for the Menvo platform using Supabase.

## Prerequisites

*   A Supabase project.
*   Your Menvo application running locally or deployed.

## 1. Supabase Configuration

Log in to your Supabase project dashboard and navigate to **Authentication > Providers**.

### Google

1.  Enable the **Google** provider.
2.  You will need a **Google Client ID** and **Google Client Secret**.
3.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
4.  Create a new project or select an existing one.
5.  Navigate to **APIs & Services > OAuth consent screen**.
    *   Configure the consent screen (User type: External, App name, User support email, Developer contact information).
    *   Add test users if your app is in testing mode.
6.  Navigate to **APIs & Services > Credentials**.
    *   Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    *   Application type: **Web application**.
    *   Name: (e.g., `Menvo Web Client`).
    *   **Authorized JavaScript origins**: Add your application's URL (e.g., `http://localhost:3000`, `https://your-menvo-app.vercel.app`).
    *   **Authorized redirect URIs**: Add the Supabase OAuth callback URL. You can find this in your Supabase dashboard under **Authentication > Providers > Google**. It typically looks like `https://<your-supabase-ref>.supabase.co/auth/v1/callback`.
    *   Click **CREATE**.
7.  Copy your **Client ID** and **Client Secret**.
8.  Paste them into the Google provider settings in your Supabase dashboard.

### GitHub

1.  Enable the **GitHub** provider.
2.  You will need a **GitHub Client ID** and **GitHub Client Secret**.
3.  Go to your [GitHub Developer Settings](https://github.com/settings/developers).
4.  Navigate to **OAuth Apps** and click **New OAuth App**.
    *   Application name: (e.g., `Menvo`).
    *   Homepage URL: Your application's URL (e.g., `http://localhost:3000`).
    *   Authorization callback URL: The Supabase OAuth callback URL (e.g., `https://<your-supabase-ref>.supabase.co/auth/v1/callback`).
    *   Click **Register application**.
5.  Copy your **Client ID**.
6.  Click **Generate a new client secret** and copy the **Client Secret**.
7.  Paste them into the GitHub provider settings in your Supabase dashboard.

### LinkedIn (OpenID Connect)

1.  Enable the **LinkedIn (OpenID Connect)** provider.
2.  You will need a **LinkedIn Client ID** and **LinkedIn Client Secret**.
3.  Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/).
4.  Create a new application or select an existing one.
5.  Navigate to **Auth**.
    *   Under **OAuth 2.0 settings**, add a redirect URL. This will be the Supabase OAuth callback URL (e.g., `https://<your-supabase-ref>.supabase.co/auth/v1/callback`).
    *   Ensure the following scopes are enabled: `r_liteprofile`, `r_emailaddress`, `openid`.
6.  Copy your **Client ID** and **Client Secret**.
7.  Paste them into the LinkedIn (OpenID Connect) provider settings in your Supabase dashboard.

## 2. Environment Variables in Menvo

After configuring the providers in Supabase, you need to add the following environment variables to your Menvo project's `.env.local` file (for local development) and your deployment environment (e.g., Vercel):

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY" # Used for server-side operations, keep this secure!

# OAuth Callback URLs
# This should be your deployed application's URL followed by /auth/callback
# For local development, it will be http://localhost:3000/auth/callback
NEXT_PUBLIC_OAUTH_CALLBACK_URL="https://your-menvo-app.vercel.app/auth/callback"
NEXT_PUBLIC_LOCAL_CALLBACK_URL="http://localhost:3000/auth/callback"

# Your site's base URL (used for email redirects)
NEXT_PUBLIC_SITE_URL="https://your-menvo-app.vercel.app"
\`\`\`

**Important Security Note**: The `SUPABASE_SERVICE_ROLE_KEY` grants full access to your Supabase project. **Never expose this key to the client-side**. It should only be used in server-side code (e.g., Next.js API routes, Server Actions).

## 3. Testing

After setting up the environment variables and deploying your application, test the OAuth login flow for each provider. Ensure users are redirected correctly and their profiles are created/updated in your Supabase database.
