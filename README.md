# MentorConnect

MentorConnect is a volunteer mentorship platform designed to connect mentors with mentees for personal and professional growth.

## Features

*   **User Authentication**: Secure login and signup with email/password and OAuth providers (GitHub, Google, LinkedIn) via Supabase Auth.
*   **User Profiles**: Comprehensive user profiles for both mentors and mentees, including personal details, professional experience, skills, and social links.
*   **Mentor Discovery**: Search and filter mentors based on skills, availability, and other criteria.
*   **Mentorship Sessions**: Schedule and manage mentorship sessions.
*   **Admin Dashboard**: Tools for administrators to manage users and verifications.
*   **Responsive Design**: Built with Next.js and Tailwind CSS for a modern and responsive user interface.
*   **Internationalization (i18n)**: Support for multiple languages (currently Portuguese, English, Spanish).
*   **Google Analytics Integration**: Track user engagement and platform performance.

## Technologies Used

*   **Next.js**: React framework for building performant web applications.
*   **React**: Frontend library for building user interfaces.
*   **TypeScript**: Strongly typed superset of JavaScript.
*   **Supabase**: Open-source Firebase alternative for backend services (Auth, Database, Storage).
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
*   **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS.
*   **Lucide React**: Beautifully simple and customizable open-source icons.
*   **React Hook Form**: Flexible forms with easy validation.
*   **Zod**: TypeScript-first schema declaration and validation library.
*   **SWR**: React Hooks for data fetching.
*   **i18next**: Internationalization framework.
*   **Google Maps API**: For location-based features (if implemented).

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher)
*   npm or Yarn
*   A Supabase project (free tier is sufficient for development)

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/mentor-connect.git
cd mentor-connect
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install # or yarn install
\`\`\`

### 3. Set up Supabase

1.  **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Get Project URL and Anon Key**:
    *   In your Supabase project dashboard, navigate to **Settings** > **API**.
    *   Copy your `Project URL` and `anon public` key.
3.  **Configure Environment Variables**: Create a `.env.local` file in the root of your project and add the following:

    \`\`\`env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    \`\`\`
    Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with the values you copied from Supabase.

4.  **Run SQL Migrations**:
    *   Go to **SQL Editor** in your Supabase dashboard.
    *   Run the SQL script located at `database/last_schema.sql` to set up your database tables. This script includes tables for `user_profiles`, `mentors`, `mentorship_sessions`, `skills`, etc.
    *   Alternatively, you can use the Supabase CLI to link your project and push migrations.

5.  **Set up Storage (for profile photos)**:
    *   In your Supabase dashboard, navigate to **Storage**.
    *   Create a new bucket named `avatars`.
    *   Set the public access policy for this bucket if you want profile photos to be publicly accessible.

6.  **Set up OAuth Providers (Optional but Recommended)**:
    *   Follow the instructions in `OAUTH_SETUP.md` to configure GitHub, Google, and LinkedIn OAuth providers in your Supabase project and their respective developer consoles.

### 4. Run the Development Server

\`\`\`bash
npm run dev # or yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 5. Build for Production

\`\`\`bash
npm run build # or yarn build
npm start # to run the built application
\`\`\`

## Project Structure

*   `app/`: Next.js App Router pages and layouts.
*   `components/`: Reusable React components (including shadcn/ui components).
*   `hooks/`: Custom React hooks for logic encapsulation and data fetching.
*   `lib/`: Utility functions.
*   `services/`: API service functions for interacting with Supabase.
*   `types/`: TypeScript type definitions.
*   `utils/supabase/`: Supabase client setup for client, server, and middleware.
*   `public/`: Static assets like images, favicons.
*   `database/`: SQL schema and migration scripts.
*   `i18n/`: Internationalization configuration and translation files.

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License.
