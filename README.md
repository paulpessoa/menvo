# MentorConnect Platform

Welcome to MentorConnect, an open-source platform designed to connect aspiring mentees with experienced mentors across various fields. Our goal is to foster professional and personal growth through accessible mentorship.

## Features

*   **Mentor Directory**: Browse and search for mentors by skills, industry, experience, and more.
*   **Mentee Profiles**: Create a profile highlighting your learning goals and interests.
*   **Session Scheduling**: Easily book and manage mentorship sessions.
*   **Messaging System**: Communicate directly with your mentors or mentees.
*   **Admin Dashboard**: Tools for platform administrators to manage users, verify mentors, and oversee activity.
*   **Events & Learning**: Discover workshops, webinars, and other learning opportunities.
*   **Donation & Support**: Options to support the platform and recognize volunteer mentors.
*   **User Roles**: Differentiated experiences for Mentees, Mentors, and Admins.
*   **Authentication**: Secure user authentication powered by Supabase, supporting email/password and OAuth (Google, GitHub, LinkedIn).
*   **Internationalization (i18n)**: Support for multiple languages (Portuguese, English, Spanish).

## Technologies Used

*   **Next.js**: React framework for building performant web applications (App Router).
*   **React**: Frontend library for building user interfaces.
*   **TypeScript**: Strongly typed JavaScript for enhanced code quality.
*   **Tailwind CSS**: Utility-first CSS framework for rapid styling.
*   **shadcn/ui**: Reusable UI components built with Tailwind CSS and Radix UI.
*   **Supabase**: Open-source Firebase alternative for backend services (Authentication, Database, Storage).
*   **PostgreSQL**: Relational database managed by Supabase.
*   **Zustand**: A small, fast, and scalable bearbones state-management solution.
*   **React Query (TanStack Query)**: For data fetching, caching, and synchronization.
*   **i18next**: Internationalization framework for React applications.
*   **Sonner**: A toast library for Next.js.
*   **Lucide React**: Beautifully crafted open-source icons.
*   **date-fns**: Modern JavaScript date utility library.

## Getting Started

Follow these steps to set up and run the MentorConnect platform locally:

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/paulpessoa/menvo.git
cd menvo
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set up Supabase

1.  **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Get your API Keys**: In your Supabase project dashboard, navigate to `Settings > API`. Copy your `Project URL` and `anon public` key.
3.  **Configure Environment Variables**: Create a `.env.local` file in the root of your project and add the following:

    \`\`\`env
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    NEXT_PUBLIC_SITE_URL="http://localhost:3000" # Or your deployment URL
    \`\`\`
    For OAuth providers (Google, GitHub, LinkedIn), refer to `OAUTH_SETUP.md` for detailed configuration.

### 4. Run SQL Migrations (Optional, but Recommended for a Clean Start)

You can use the provided SQL script to set up your database schema.

1.  Go to your Supabase project dashboard.
2.  Navigate to `Database > SQL Editor`.
3.  Open `scripts/01-initial-schema.sql` from this repository.
4.  Copy the content and paste it into the SQL Editor.
5.  Run the query. This will create the necessary tables and functions.

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
├── app/                  # Next.js App Router pages, layouts, and API routes
│   ├── (auth)/           # Authentication related pages (login, signup, etc.)
│   ├── api/              # API routes for backend interactions
│   ├── context/          # React Context providers
│   ├── admin/            # Admin dashboard pages
│   ├── dashboard/        # User dashboard
│   ├── mentors/          # Mentor listing and profile pages
│   ├── messages/         # Messaging interface
│   └── ...               # Other top-level pages
├── components/           # Reusable React components (UI, auth, events, etc.)
│   ├── ui/               # shadcn/ui components
│   └── ...
├── data/                 # Mock data for development/testing
├── database/             # SQL schema and migration scripts
├── hooks/                # Custom React hooks for logic encapsulation
├── i18n/                 # Internationalization configuration and translations
├── lib/                  # Utility functions and helpers
├── public/               # Static assets (images, fonts, favicons)
├── services/             # API service layers (Supabase interactions, external APIs)
├── styles/               # Global CSS styles
├── types/                # TypeScript type definitions
├── utils/                # General utilities (Supabase client setup, Google Analytics)
└── ...                   # Configuration files (tailwind, tsconfig, etc.)
\`\`\`

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or feedback, feel free to open an issue on GitHub or contact us at [contato@menvo.com](mailto:contato@menvo.com).
