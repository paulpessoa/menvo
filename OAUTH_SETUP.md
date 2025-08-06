# OAuth Setup for MentorConnect

This document outlines the steps to set up OAuth providers (GitHub, Google, LinkedIn) for the MentorConnect application using Supabase Auth.

## Prerequisites

*   A Supabase project.
*   Your Next.js application configured to use Supabase.
*   Access to the developer consoles for GitHub, Google, and LinkedIn.

## 1. Supabase Configuration

First, you need to enable the desired OAuth providers in your Supabase project.

1.  Go to your Supabase project dashboard.
2.  Navigate to **Authentication** > **Providers**.
3.  Enable the providers you want to use (GitHub, Google, LinkedIn).
4.  For each provider, you will need to enter a **Client ID** and **Client Secret**. Supabase will provide you with a **Redirect URI** (e.g., `https://your-supabase-url.supabase.co/auth/v1/callback`). Copy this URI as you'll need it for the next steps.

## 2. GitHub OAuth Setup

1.  Go to [GitHub Developer Settings](https://github.com/settings/developers).
2.  Navigate to **OAuth Apps** and click **New OAuth App**.
3.  Fill in the following details:
    *   **Application name**: `MentorConnect` (or a descriptive name)
    *   **Homepage URL**: Your application's public URL (e.g., `http://localhost:3000` for local development, or your Vercel deployment URL).
    *   **Authorization callback URL**: This is the **Redirect URI** you copied from Supabase (e.g., `https://your-supabase-url.supabase.co/auth/v1/callback`).
4.  Click **Register application**.
5.  You will be given a **Client ID**. Copy this.
6.  Click **Generate a new client secret**. Copy this secret.
7.  In your Supabase dashboard, go to **Authentication** > **Providers** > **GitHub** and paste the **Client ID** and **Client Secret**.

## 3. Google OAuth Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select or create a new project.
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
    *   Configure the consent screen (User type: External, App name, User support email, Developer contact information).
    *   Add test users if your app is in "Testing" status.
4.  Navigate to **APIs & Services** > **Credentials**.
5.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
6.  Select **Web application** as the Application type.
7.  Fill in the details:
    *   **Name**: `MentorConnect Web Client` (or a descriptive name)
    *   **Authorized JavaScript origins**: Add your application's public URL (e.g., `http://localhost:3000`, your Vercel deployment URL).
    *   **Authorized redirect URIs**: Add the **Redirect URI** you copied from Supabase (e.g., `https://your-supabase-url.supabase.co/auth/v1/callback`).
8.  Click **CREATE**.
9.  You will be given a **Client ID** and **Client Secret**. Copy these.
10. In your Supabase dashboard, go to **Authentication** > **Providers** > **Google** and paste the **Client ID** and **Client Secret**.

## 4. LinkedIn OAuth Setup

1.  Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/).
2.  Click **Create app**.
3.  Fill in the details:
    *   **App name**: `MentorConnect` (or a descriptive name)
    *   **LinkedIn Page**: Select or create a LinkedIn Page associated with your app.
    *   **Privacy policy URL**: Your application's privacy policy URL (e.g., `http://localhost:3000/privacy`).
    *   **Business email**: Your contact email.
4.  Click **Create app**.
5.  Navigate to the **Auth** tab for your new app.
6.  Under **OAuth 2.0 settings**, click the pencil icon to edit **Redirect URLs**.
7.  Add the **Redirect URI** you copied from Supabase (e.g., `https://your-supabase-url.supabase.co/auth/v1/callback`).
8.  Under **Application credentials**, you will find your **Client ID** and **Client Secret**. Copy these.
9.  In your Supabase dashboard, go to **Authentication** > **Providers** > **LinkedIn** and paste the **Client ID** and **Client Secret**.

## 5. Environment Variables

Ensure your Next.js application has the following environment variables set, typically in a `.env.local` file for local development and configured in your Vercel project settings for deployment:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

These are used by the Supabase client in your application. The OAuth client IDs and secrets are handled directly by Supabase's backend, so they don't need to be in your Next.js environment variables unless you are implementing a custom OAuth flow outside of Supabase Auth.

## 6. Testing

After configuring all providers:

1.  Run your Next.js application.
2.  Navigate to your login page (e.g., `/login`).
3.  Test the "Sign in with GitHub", "Sign in with Google", and "Sign in with LinkedIn" buttons.
4.  Verify that users are successfully authenticated and redirected back to your application.

If you encounter any issues, double-check your Client IDs, Client Secrets, and Redirect URIs in both your OAuth provider's developer console and your Supabase dashboard.
