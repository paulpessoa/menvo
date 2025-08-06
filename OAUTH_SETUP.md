# OAuth Setup for MentorConnect

This guide explains how to set up OAuth providers (Google, GitHub, LinkedIn) for the MentorConnect platform using Supabase.

## Prerequisites

*   A Supabase project set up and linked to your MentorConnect application.
*   Access to your Supabase project dashboard.
*   Your `NEXT_PUBLIC_SITE_URL` environment variable correctly configured (e.g., `http://localhost:3000` for local development, or your Vercel deployment URL).

## Supabase Authentication Settings

1.  Go to your Supabase project dashboard.
2.  Navigate to **Authentication** > **Providers**.

## 1. Google OAuth Setup

1.  **Enable Google Provider in Supabase**:
    *   In the Supabase dashboard, under **Authentication** > **Providers**, enable "Google".
    *   You will need a Google Client ID and Client Secret.

2.  **Create Google OAuth Credentials**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Select or create a new project.
    *   Navigate to **APIs & Services** > **Credentials**.
    *   Click **+ Create Credentials** > **OAuth client ID**.
    *   Select "Web application" as the Application type.
    *   **Authorized JavaScript origins**: Add your `NEXT_PUBLIC_SITE_URL` (e.g., `http://localhost:3000`).
    *   **Authorized redirect URIs**: Add your Supabase callback URL. This is typically `YOUR_SUPABASE_URL/auth/v1/callback` (e.g., `https://abcdefg.supabase.co/auth/v1/callback`). You can find this in your Supabase Google provider settings.
    *   Click "Create".
    *   Copy the **Client ID** and **Client Secret**.

3.  **Configure Supabase**:
    *   Paste the copied **Client ID** and **Client Secret** into the respective fields in your Supabase Google provider settings.
    *   Save the settings.

## 2. GitHub OAuth Setup

1.  **Enable GitHub Provider in Supabase**:
    *   In the Supabase dashboard, under **Authentication** > **Providers**, enable "GitHub".
    *   You will need a GitHub Client ID and Client Secret.

2.  **Create GitHub OAuth App**:
    *   Go to your GitHub profile settings: **Settings** > **Developer settings** > **OAuth Apps**.
    *   Click **New OAuth App**.
    *   **Application name**: e.g., "MentorConnect"
    *   **Homepage URL**: Your `NEXT_PUBLIC_SITE_URL` (e.g., `http://localhost:3000`).
    *   **Authorization callback URL**: Your Supabase callback URL. This is typically `YOUR_SUPABASE_URL/auth/v1/callback` (e.g., `https://abcdefg.supabase.co/auth/v1/callback`). You can find this in your Supabase GitHub provider settings.
    *   Click "Register application".
    *   Copy the **Client ID**.
    *   Click "Generate a new client secret" and copy the **Client Secret**.

3.  **Configure Supabase**:
    *   Paste the copied **Client ID** and **Client Secret** into the respective fields in your Supabase GitHub provider settings.
    *   Save the settings.

## 3. LinkedIn OAuth Setup

1.  **Enable LinkedIn Provider in Supabase**:
    *   In the Supabase dashboard, under **Authentication** > **Providers**, enable "LinkedIn".
    *   You will need a LinkedIn Client ID and Client Secret.

2.  **Create LinkedIn Application**:
    *   Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/).
    *   Click "Create app".
    *   Fill in the required details (App name, Company, Privacy policy URL, etc.).
    *   Under **Auth**, copy the **Client ID** and **Client Secret**.
    *   **Redirect URLs**: Add your Supabase callback URL. This is typically `YOUR_SUPABASE_URL/auth/v1/callback` (e.g., `https://abcdefg.supabase.co/auth/v1/callback`). You can find this in your Supabase LinkedIn provider settings.
    *   Ensure you have the necessary permissions enabled (e.g., `r_liteprofile`, `r_emailaddress`).

3.  **Configure Supabase**:
    *   Paste the copied **Client ID** and **Client Secret** into the respective fields in your Supabase LinkedIn provider settings.
    *   Save the settings.

## Environment Variables

After setting up each provider in their respective developer consoles and in Supabase, ensure your `.env.local` (or Vercel environment variables) are updated with the correct `NEXT_PUBLIC_SITE_URL`.

Example `.env.local`:

\`\`\`
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
# Or your deployed URL:
# NEXT_PUBLIC_SITE_URL="https://your-app-name.vercel.app"

# Supabase Project URL and Anon Key (from Supabase project settings -> API)
NEXT_PUBLIC_SUPABASE_URL="https://abcdefg.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
\`\`\`

**Important Security Note**: Never expose your Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) or any other sensitive API keys directly in client-side code or public environment variables. Only use `NEXT_PUBLIC_` prefixed variables for client-side access. Server-side operations requiring the Service Role Key should be handled in secure API routes or Server Actions.
