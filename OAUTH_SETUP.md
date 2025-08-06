# OAuth Setup for Mentor Connect

This guide details how to set up OAuth providers (Google, GitHub, LinkedIn) for your Supabase project, which is used by the Mentor Connect application.

## Prerequisites

-   A Supabase project.
-   Access to your Supabase dashboard.
-   Developer accounts for Google, GitHub, and LinkedIn.

## General Steps for OAuth Providers

For each provider, the general steps are:

1.  **Create an OAuth Application** on the respective platform's developer console.
2.  **Configure Redirect URIs**: Add your Supabase callback URL to the OAuth application settings.
    -   For local development: `http://localhost:3000/auth/callback`
    -   For production: `https://your-domain.com/auth/callback` (Replace `your-domain.com` with your actual domain)
3.  **Get Client ID and Client Secret**: Copy these credentials from your OAuth application.
4.  **Configure Supabase**: Add the Client ID and Client Secret to your Supabase project settings.
5.  **Update Environment Variables**: Add the credentials to your `.env.local` file for your Next.js application.

---

## 1. Google OAuth Setup

1.  **Go to Google Cloud Console**:
    -   Visit [Google Cloud Console](https://console.cloud.google.com/).
    -   Select or create a new project.
2.  **Enable the Google People API**:
    -   In the left navigation, go to "APIs & Services" > "Enabled APIs & services".
    -   Click "+ ENABLE APIS AND SERVICES".
    -   Search for "Google People API" and enable it.
3.  **Create OAuth Consent Screen**:
    -   In the left navigation, go to "APIs & Services" > "OAuth consent screen".
    -   Choose "External" and click "CREATE".
    -   Fill in the required information (App name, User support email, Developer contact information).
    -   Add authorized domains (e.g., `localhost:3000`, `your-domain.com`).
    -   For "Scopes", you typically need `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
    -   Add test users if your app is in "Testing" status.
4.  **Create Credentials**:
    -   In the left navigation, go to "APIs & Services" > "Credentials".
    -   Click "+ CREATE CREDENTIALS" > "OAuth client ID".
    -   Select "Web application" as the Application type.
    -   Give it a name (e.g., `Mentor Connect Web`).
    -   **Authorized JavaScript origins**:
        -   `http://localhost:3000`
        -   `https://your-domain.com` (your production domain)
    -   **Authorized redirect URIs**:
        -   `http://localhost:3000/auth/callback`
        -   `https://your-domain.com/auth/callback`
        -   `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` (Find this in Supabase Auth settings)
    -   Click "CREATE".
    -   Copy your **Client ID** and **Client Secret**.
5.  **Configure Supabase**:
    -   Go to your Supabase project dashboard.
    -   Navigate to "Authentication" > "Providers".
    -   Enable "Google".
    -   Paste your Google **Client ID** and **Client Secret**.
6.  **Update `.env.local`**:
    \`\`\`env
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
    NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
    \`\`\`

---

## 2. GitHub OAuth Setup

1.  **Go to GitHub Developer Settings**:
    -   Visit [GitHub Developer Settings](https://github.com/settings/developers).
    -   Go to "OAuth Apps" > "New OAuth App".
2.  **Register a new OAuth application**:
    -   **Application name**: `Mentor Connect`
    -   **Homepage URL**: `http://localhost:3000` (or your production domain)
    -   **Authorization callback URL**:
        -   `http://localhost:3000/auth/callback`
        -   `https://your-domain.com/auth/callback`
        -   `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
    -   Click "Register application".
3.  **Generate a new client secret**:
    -   Copy your **Client ID**.
    -   Click "Generate a new client secret" and copy the **Client Secret**.
4.  **Configure Supabase**:
    -   Go to your Supabase project dashboard.
    -   Navigate to "Authentication" > "Providers".
    -   Enable "GitHub".
    -   Paste your GitHub **Client ID** and **Client Secret**.
5.  **Update `.env.local`**:
    \`\`\`env
    NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
    NEXT_PUBLIC_GITHUB_CLIENT_SECRET=your_github_client_secret
    \`\`\`

---

## 3. LinkedIn OAuth Setup

1.  **Go to LinkedIn Developer Portal**:
    -   Visit [LinkedIn Developer Portal](https://developer.linkedin.com/).
    -   Go to "My Apps" and click "Create app".
2.  **Create a new application**:
    -   Fill in the required details (App name, Company, Privacy policy URL, Business email).
    -   Upload an App logo.
    -   Agree to the terms and click "Create app".
3.  **Configure Auth**:
    -   In your app's settings, go to "Auth".
    -   Under "OAuth 2.0 settings", click "Add redirect URL".
    -   Add the following redirect URLs:
        -   `http://localhost:3000/auth/callback`
        -   `https://your-domain.com/auth/callback`
        -   `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
    -   Copy your **Client ID** and **Client Secret**.
4.  **Configure Supabase**:
    -   Go to your Supabase project dashboard.
    -   Navigate to "Authentication" > "Providers".
    -   Enable "LinkedIn".
    -   Paste your LinkedIn **Client ID** and **Client Secret**.
5.  **Update `.env.local`**:
    \`\`\`env
    NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
    NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
    \`\`\`

---

## Important Notes

-   **Environment Variables**: Always use environment variables for sensitive credentials. Do not hardcode them in your application.
-   **Production Deployment**: When deploying to production, ensure your `NEXT_PUBLIC_SITE_URL` and all redirect URIs in your OAuth provider settings and Supabase are updated to your production domain.
-   **Supabase Callback URL**: The Supabase callback URL (`https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`) is crucial. Make sure it's included in your OAuth provider's redirect URIs. You can find your project reference in your Supabase project URL (e.g., `https://app.supabase.com/project/<YOUR_SUPABASE_PROJECT_REF>/...`).
-   **Security**: Never expose your `SUPABASE_SERVICE_ROLE_KEY` on the client-side. It should only be used in server-side environments (e.g., Next.js API routes, Server Actions).
