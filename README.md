# Menvo - Volunteer Mentor Platform

Menvo is a platform designed to connect aspiring individuals with experienced volunteer mentors. It aims to foster knowledge sharing, personal growth, and community building by facilitating mentorship relationships.

## Features

*   **User Authentication**: Secure sign-up and login with email/password and OAuth (Google, GitHub, LinkedIn) via Supabase.
*   **User Profiles**: Comprehensive profiles for both mentees and mentors, including personal details, skills, interests, and professional background.
*   **Mentor Search & Filtering**: Easily find mentors based on expertise, availability, and other criteria.
*   **Mentorship Session Scheduling**: Intuitive calendar-based scheduling for one-on-one mentorship sessions.
*   **Admin Dashboard**: Tools for administrators to manage users, verify mentors, and oversee platform activity.
*   **Responsive Design**: Optimized for various devices using Tailwind CSS and Shadcn UI.
*   **Internationalization (i18n)**: Support for multiple languages (currently Portuguese, English, Spanish).
*   **SEO Friendly**: Configured for better search engine visibility.

## Technologies Used

*   **Next.js 14 (App Router)**: React framework for building performant web applications.
*   **React**: Frontend library for building user interfaces.
*   **TypeScript**: Strongly typed JavaScript for enhanced code quality.
*   **Supabase**: Open-source Firebase alternative for backend services (Authentication, Database, Storage).
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
*   **Shadcn UI**: Reusable UI components built with Radix UI and Tailwind CSS.
*   **React Query (TanStack Query)**: For efficient data fetching, caching, and synchronization.
*   **Zustand**: A small, fast, and scalable bearbones state-management solution.
*   **Lucide React**: Beautifully crafted open-source icons.
*   **i18next**: Internationalization framework.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18.x or higher)
*   npm or Yarn
*   Git

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/menvo.git
cd menvo
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set up Supabase

Menvo uses Supabase for its backend. You'll need to set up a Supabase project and configure your environment variables.

1.  **Create a Supabase Project**:
    *   Go to [Supabase](https://supabase.com/) and create a new project.
    *   Note your Project URL and `anon` public key from `Project Settings` -> `API`.

2.  **Run Database Migrations**:
    The `scripts/01-initial-schema.sql` file contains the complete database schema, including tables, types, functions, triggers, and RLS policies.
    *   In your Supabase project dashboard, navigate to `SQL Editor`.
    *   Open the `scripts/01-initial-schema.sql` file from this repository.
    *   Copy the entire content of the SQL file and paste it into the Supabase SQL Editor.
    *   Click `Run`. This will set up all necessary tables, RLS policies, and functions.

3.  **Configure OAuth Providers (Optional but Recommended)**:
    If you plan to use Google, GitHub, or LinkedIn authentication, follow the instructions in `OAUTH_SETUP.md` to configure them in your Supabase project and their respective developer consoles.

### 4. Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables. Replace the placeholder values with your actual Supabase credentials and other configurations.

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY # Found in Project Settings -> API -> Project API keys (service_role)

# OAuth Redirect URLs (adjust for your local/production environment)
NEXT_PUBLIC_OAUTH_CALLBACK_URL=http://localhost:3000/auth/callback # For local development
NEXT_PUBLIC_LOCAL_CALLBACK_URL=http://localhost:3000/auth/callback # For local development
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # For local development, change to your production URL for deployment

# Google Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX

# Google Maps API Key (Optional, for map features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# SheetDB API (Optional, for newsletter integration if used)
NEXT_PUBLIC_SHEETDB_API_URL=
SHEETDB_API_KEY=
\`\`\`

**Important**: For production deployments (e.g., Vercel), you must set these environment variables in your hosting provider's settings. Ensure `NEXT_PUBLIC_OAUTH_CALLBACK_URL` and `NEXT_PUBLIC_SITE_URL` point to your actual production domain.

### 5. Run the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

\`\`\`
.
├── app/                    # Next.js App Router routes, layouts, pages, and API routes
│   ├── (auth)/             # Authentication related pages (login, signup, etc.)
│   ├── api/                # API routes (e.g., /api/admin/users)
│   ├── context/            # React Context providers
│   ├── ...                 # Other application pages (dashboard, mentors, profile, etc.)
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components (UI, custom, shared)
│   ├── ui/                 # Shadcn UI components (auto-generated)
│   ├── auth/               # Auth-specific components
│   ├── events/             # Event-specific components
│   ├── mentorship/         # Mentorship-specific components
│   └── ...                 # Other custom components
├── data/                   # Mock data for development/testing
├── database/               # SQL schema, RLS policies, functions, triggers
├── hooks/                  # Custom React hooks (e.g., useAuth, useUserProfile)
├── i18n/                   # Internationalization configurations and translations
├── lib/                    # Utility functions and server-side Supabase client
├── public/                 # Static assets (images, favicons, etc.)
├── services/               # API service calls (Supabase interactions)
├── styles/                 # Global CSS
├── types/                  # TypeScript type definitions
├── utils/                  # General utility functions (e.g., Supabase client setup)
└── ...                     # Other configuration files (tailwind.config.ts, tsconfig.json, etc.)
\`\`\`

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License.
