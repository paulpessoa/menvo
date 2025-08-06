# Menvo - Volunteer Mentor Platform

Menvo is a platform designed to connect aspiring individuals with experienced volunteer mentors. It aims to foster personal and professional growth through mentorship, making valuable guidance accessible to everyone.

## Features

*   **User Authentication**: Secure sign-up and login for both mentors and mentees using email/password and OAuth (Google, GitHub, LinkedIn).
*   **Profile Management**: Users can create and manage their profiles, including personal details, professional experience, skills, and interests.
*   **Mentor Search & Filtering**: Mentees can search for mentors based on various criteria such as expertise, industry, availability, and location.
*   **Mentorship Session Scheduling**: Integrated calendar and scheduling tools to book and manage mentorship sessions.
*   **Admin Dashboard**: A secure admin panel for managing users, verifying mentor profiles, and overseeing platform activities.
*   **Responsive Design**: Optimized for various devices, from desktops to mobile phones.
*   **Internationalization (i18n)**: Support for multiple languages (currently English, Spanish, and Brazilian Portuguese).

## Technologies Used

*   **Next.js 14 (App Router)**: React framework for building performant web applications.
*   **React**: JavaScript library for building user interfaces.
*   **TypeScript**: Strongly typed superset of JavaScript.
*   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
*   **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS.
*   **Supabase**: Open-source Firebase alternative for database, authentication, and storage.
*   **PostgreSQL**: Relational database managed by Supabase.
*   **Zustand**: A small, fast, and scalable bearbones state-management solution.
*   **React Hook Form & Zod**: For form validation.
*   **Lucide React**: Beautifully simple and customizable open-source icons.
*   **Recharts**: Composable charting library built on React components.
*   **Mermaid**: Diagramming and charting tool.

## Getting Started

### Prerequisites

*   Node.js (v18.x or later)
*   npm or Yarn
*   Git
*   A Supabase account and project

### Installation

1.  **Clone the repository**:
    \`\`\`bash
    git clone https://github.com/your-username/menvo.git
    cd menvo
    \`\`\`

2.  **Install dependencies**:
    \`\`\`bash
    npm install
    # or
    yarn install
    \`\`\`

3.  **Set up Supabase**:
    *   Go to [Supabase](https://supabase.com/) and create a new project.
    *   Find your project's URL and `anon` public key in **Settings > API**.
    *   Find your `service_role` key in **Settings > API** (under Project API keys).
    *   **Run the SQL schema**: Execute the SQL script located at `scripts/01-initial-schema.sql` in your Supabase SQL Editor. This will set up all necessary tables, functions, and RLS policies. **Warning: This script will drop existing tables and data.**

4.  **Configure environment variables**:
    Create a `.env.local` file in the root of your project and add the following:

    \`\`\`env
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

    # OAuth Callback URLs (adjust for your deployment environment)
    NEXT_PUBLIC_OAUTH_CALLBACK_URL="http://localhost:3000/auth/callback" # For local development
    NEXT_PUBLIC_LOCAL_CALLBACK_URL="http://localhost:3000/auth/callback" # For local development
    NEXT_PUBLIC_SITE_URL="http://localhost:3000" # Your site's base URL for email redirects

    # Google Analytics (optional)
    NEXT_PUBLIC_GOOGLE_ANALYTICS="YOUR_GA_MEASUREMENT_ID"

    # Google Maps (optional, if using map features)
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
    \`\`\`

5.  **Run the development server**:
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

\`\`\`
.
├── app/                    # Next.js App Router pages, layouts, and API routes
│   ├── (auth)/             # Authentication related pages (login, signup, etc.)
│   ├── api/                # Backend API routes (Next.js API routes)
│   ├── context/            # React Context providers
│   ├── admin/              # Admin dashboard pages
│   ├── mentors/            # Mentor listing and profile pages
│   ├── profile/            # User profile page
│   └── ...
├── components/             # Reusable React components
│   ├── ui/                 # shadcn/ui components
│   └── auth/               # Auth-specific components
│   └── mentorship/         # Mentorship-specific components
│   └── ...
├── data/                   # Mock data for development
├── database/               # SQL schema, RLS policies, functions
├── hooks/                  # Custom React hooks
├── i18n/                   # Internationalization configurations and translations
├── lib/                    # Utility functions and Supabase client setup
├── public/                 # Static assets (images, favicons)
├── services/               # API service calls (Supabase interactions)
├── styles/                 # Global CSS
├── types/                  # TypeScript type definitions
└── utils/                  # General utilities (e.g., Supabase client, Google Analytics)
\`\`\`

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for details on how to get started.

## License

This project is licensed under the MIT License.
