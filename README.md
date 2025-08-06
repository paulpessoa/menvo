# Mentor Connect Platform

Welcome to Mentor Connect, an open-source platform designed to connect mentees with experienced mentors. Our goal is to foster learning, growth, and professional development through meaningful mentorship relationships.

## Features

-   **User Authentication**: Secure sign-up and login with email/password and OAuth providers (Google, GitHub, LinkedIn).
-   **User Profiles**: Comprehensive profiles for mentees and mentors, including skills, interests, experience, and social links.
-   **Role-Based Access**: Differentiated experiences for mentees, mentors, and administrators.
-   **Mentor Discovery**: Search and filter mentors based on skills, industry, location, and more.
-   **Mentorship Scheduling**: Intuitive calendar-based system for booking and managing mentorship sessions.
-   **Messaging**: Direct messaging between mentees and mentors.
-   **Admin Dashboard**: Tools for administrators to manage users, verify mentors, and oversee the platform.
-   **Events Management**: Create and manage community events.
-   **Responsive Design**: Optimized for various devices and screen sizes.
-   **Internationalization (i18n)**: Support for multiple languages.
-   **Theme Toggle**: Light and dark mode support.

## Technologies Used

-   **Next.js**: React framework for building server-rendered and static web applications.
-   **React**: JavaScript library for building user interfaces.
-   **TypeScript**: Superset of JavaScript that adds static types.
-   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
-   **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS.
-   **Supabase**: Open-source Firebase alternative for database (PostgreSQL), authentication, and storage.
-   **SWR**: React Hooks for data fetching.
-   **Zustand**: Small, fast, and scalable bearbones state-management solution.
-   **React Hook Form**: For flexible and extensible forms with easy validation.
-   **Zod**: TypeScript-first schema declaration and validation library.
-   **date-fns**: Modern JavaScript date utility library.
-   **react-day-picker**: Flexible date picker component.
-   **lucide-react**: Beautifully simple and customizable open-source icons.
-   **i18next**: Internationalization framework.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/en/) (LTS version recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)
-   [Git](https://git-scm.com/)
-   A [Supabase](https://supabase.com/) account (free tier is sufficient for development)

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/your-org/mentor-connect.git
    cd mentor-connect
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    # or yarn install
    \`\`\`

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of your project based on `env.example`. You'll need to get these values from your Supabase project settings.

    \`\`\`env
    # Supabase Credentials
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # Used for server-side operations

    # Application URLs
    NEXT_PUBLIC_SITE_URL=http://localhost:3000 # Or your deployment URL
    NEXT_PUBLIC_LOCAL_CALLBACK_URL=http://localhost:3000/auth/callback

    # Optional: OAuth Provider Credentials (if you enable them in Supabase)
    # Refer to OAUTH_SETUP.md for detailed instructions
    # NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
    # NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
    # NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
    # NEXT_PUBLIC_GITHUB_CLIENT_SECRET=your_github_client_secret
    # NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
    # NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

    # Optional: Google Analytics
    # NEXT_PUBLIC_GOOGLE_ANALYTICS=your_google_analytics_id

    # Optional: Google Maps API Key (if using map features)
    # NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
    \`\`\`

4.  **Supabase Database Setup:**
    -   Go to your Supabase dashboard and create a new project.
    -   Navigate to the "SQL Editor" and run the SQL script located at `database/01-initial-schema.sql`. This script sets up all necessary tables, functions, and Row Level Security (RLS) policies.
    -   **Important**: Ensure RLS is enabled for all tables that store user data (e.g., `user_profiles`, `skills`). The provided schema script includes RLS policies.

5.  **Supabase Authentication Setup:**
    -   In your Supabase project, go to "Authentication" -> "Providers".
    -   Enable "Email" and "Password" authentication.
    -   If you plan to use social logins, follow the instructions in `OAUTH_SETUP.md` to configure Google, GitHub, and LinkedIn providers. Remember to add the respective `NEXT_PUBLIC_` environment variables.

### Running the Development Server

\`\`\`bash
npm run dev
# or yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

The project follows a standard Next.js App Router structure:

\`\`\`
.
├── app/                  # Next.js App Router pages, layouts, and API routes
│   ├── (auth)/           # Authentication related pages (login, signup, etc.)
│   ├── api/              # API routes (Supabase interactions, auth callbacks)
│   ├── context/          # React Context providers
│   ├── components/       # Reusable UI components specific to pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Root page
├── components/           # Shared UI components (shadcn/ui, custom)
│   └── ui/               # shadcn/ui components
├── data/                 # Mock data or static data
├── database/             # SQL schema and migrations
├── hooks/                # Custom React hooks
├── i18n/                 # Internationalization files
├── lib/                  # Utility functions
├── public/               # Static assets (images, favicons)
├── services/             # Business logic and external API integrations (e.g., Supabase service)
├── styles/               # Additional global styles or Tailwind config
├── types/                # TypeScript type definitions
├── utils/                # General utilities (e.g., Supabase client setup)
└── ...                   # Other configuration files (tsconfig.json, next.config.mjs, etc.)
\`\`\`

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or need further assistance, please open an issue on our GitHub repository.
