# OAuth Setup for Menvo

This document outlines the steps to configure OAuth providers (Google, GitHub, LinkedIn) for the Menvo platform using Supabase.

## Prerequisites

*   A Supabase project set up and running.
*   Access to your Supabase project dashboard.
*   Developer accounts for Google, GitHub, and LinkedIn.

## General Supabase OAuth Configuration

1.  **Go to Authentication Settings**: In your Supabase project dashboard, navigate to `Authentication` -> `Providers`.
2.  **Add Redirect URLs**: For each provider you enable, you will need to add a **Redirect URL**. This is where the user will be redirected after successful authentication with the OAuth provider.
    *   **For local development**: `http://localhost:3000/auth/callback`
    *   **For production (Vercel)**: `https://your-vercel-app-url.vercel.app/auth/callback` (Replace `your-vercel-app-url.vercel.app` with your actual domain).
    *   You can add multiple redirect URLs, separated by commas.

## 1. Google OAuth Setup

1.  **Go to Google Cloud Console**:
    *   Visit [Google Cloud Console](https://console.cloud.google.com/).
    *   Select or create a new project.
2.  **Enable Google People API**:
    *   Navigate to `APIs & Services` -> `Enabled APIs & services`.
    *   Search for "Google People API" and enable it.
3.  **Create OAuth Consent Screen**:
    *   Go to `APIs & Services` -> `OAuth consent screen`.
    *   Choose "External" user type and click "CREATE".
    *   Fill in the required information (App name, User support email, Developer contact information).
    *   Add your authorized domains (e.g., `localhost:3000`, `your-vercel-app-url.vercel.app`).
    *   Add scopes: At a minimum, you'll need `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
    *   Add test users if your app is in "Testing" status.
4.  **Create Credentials**:
    *   Go to `APIs & Services` -> `Credentials`.
    *   Click `+ CREATE CREDENTIALS` -> `OAuth client ID`.
    *   Select "Web application" as the Application type.
    *   Give it a name (e.g., "Menvo Web Client").
    *   **Authorized JavaScript origins**: Add your development and production URLs (e.g., `http://localhost:3000`, `https://your-vercel-app-url.vercel.app`).
    *   **Authorized redirect URIs**: Add the Supabase redirect URLs (e.g., `http://localhost:3000/auth/callback`, `https://your-vercel-app-url.vercel.app/auth/callback`).
    *   Click "CREATE".
    *   You will get your **Client ID** and **Client Secret**.
5.  **Configure in Supabase**:
    *   In your Supabase dashboard, go to `Authentication` -> `Providers`.
    *   Enable "Google".
    *   Paste your Google **Client ID** into `Client ID`.
    *   Paste your Google **Client Secret** into `Client Secret`.
    *   Save the settings.

## 2. GitHub OAuth Setup

1.  **Go to GitHub Developer Settings**:
    *   Visit [GitHub Developer Settings](https://github.com/settings/developers).
    *   Navigate to `OAuth Apps`.
2.  **Register a New OAuth Application**:
    *   Click `New OAuth App`.
    *   **Application name**: Menvo
    *   **Homepage URL**: `http://localhost:3000` (or your production URL)
    *   **Application description**: (Optional)
    *   **Authorization callback URL**: Add the Supabase redirect URLs (e.g., `http://localhost:3000/auth/callback`, `https://your-vercel-app-url.vercel.app/auth/callback`).
    *   Click `Register application`.
3.  **Generate a New Client Secret**:
    *   After registration, you will see your **Client ID**.
    *   Click `Generate a new client secret`. Copy this secret immediately as it will only be shown once.
4.  **Configure in Supabase**:
    *   In your Supabase dashboard, go to `Authentication` -> `Providers`.
    *   Enable "GitHub".
    *   Paste your GitHub **Client ID** into `Client ID`.
    *   Paste your GitHub **Client Secret** into `Client Secret`.
    *   Save the settings.

## 3. LinkedIn OAuth Setup (OpenID Connect)

Supabase uses LinkedIn's OpenID Connect (OIDC) for authentication.

1.  **Go to LinkedIn Developer Portal**:
    *   Visit [LinkedIn Developer Portal](https://developer.linkedin.com/).
    *   Go to `My Apps`.
2.  **Create a New Application**:
    *   Click `Create app`.
    *   Fill in the required details (App name, Company, Privacy policy URL, Business email).
    *   Upload an app logo.
    *   Agree to the terms and click `Create app`.
3.  **Configure Auth Settings**:
    *   Once the app is created, navigate to the `Auth` tab.
    *   **Client ID** and **Client Secret** will be displayed here. Copy them.
    *   **Redirect URLs**: Add the Supabase redirect URLs (e.g., `http://localhost:3000/auth/callback`, `https://your-vercel-app-url.vercel.app/auth/callback`).
    *   **Scopes**: Ensure you have at least `r_liteprofile` and `r_emailaddress` selected. For OIDC, you might also need `openid` and `profile`.
    *   Save changes.
4.  **Configure in Supabase**:
    *   In your Supabase dashboard, go to `Authentication` -> `Providers`.
    *   Enable "LinkedIn (OpenID Connect)".
    *   Paste your LinkedIn **Client ID** into `Client ID`.
    *   Paste your LinkedIn **Client Secret** into `Client Secret`.
    *   Save the settings.

## Environment Variables in Next.js

After configuring the providers in Supabase, you need to add the redirect URLs to your Next.js application's environment variables.

In your `.env.local` file (and your Vercel project environment variables for production), add:

\`\`\`env
NEXT_PUBLIC_OAUTH_CALLBACK_URL=https://your-vercel-app-url.vercel.app/auth/callback
NEXT_PUBLIC_LOCAL_CALLBACK_URL=http://localhost:3000/auth/callback
NEXT_PUBLIC_SITE_URL=https://your-vercel-app-url.vercel.app # Or http://localhost:3000 for local
\`\`\`

Replace `https://your-vercel-app-url.vercel.app` with your actual Vercel deployment URL. `NEXT_PUBLIC_SITE_URL` is used for email redirects (e.g., password reset, email confirmation).

By following these steps, your Menvo application should be able to authenticate users using Google, GitHub, and LinkedIn via Supabase.
