# Contributing to Mentor Connect

We welcome contributions to the Mentor Connect platform! By contributing, you help us build a stronger, more inclusive community. Please take a moment to review this document to make the contribution process as smooth as possible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Authentication Setup](#authentication-setup)
- [Style Guides](#style-guides)
  - [Git Commit Messages](#git-commit-messages)
  - [JavaScript/TypeScript](#javascripttypescript)
  - [CSS/Tailwind CSS](#csstailwind-css)
- [License](#license)

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on our [GitHub Issues](https://github.com/your-org/mentor-connect/issues) page. When reporting a bug, please include:

- A clear and concise description of the bug.
- Steps to reproduce the behavior.
- Expected behavior.
- Screenshots or videos if applicable.
- Your operating system, browser, and Node.js version.

### Suggesting Enhancements

We love new ideas! If you have a suggestion for an enhancement, please open an issue on our [GitHub Issues](https://github.com/your-org/mentor-connect/issues) page. Please include:

- A clear and concise description of the proposed enhancement.
- Why this enhancement would be useful.
- Any mockups or examples if applicable.

### Your First Code Contribution

If you're looking to make your first contribution, look for issues labeled `good first issue` on our [GitHub Issues](https://github.com/your-org/mentor-connect/issues) page. These issues are designed to be a good starting point for new contributors.

### Pull Request Guidelines

1.  **Fork the repository** and clone it to your local machine.
2.  **Create a new branch** from `main` for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b bugfix/your-bug-fix-name`.
3.  **Make your changes**. Ensure your code adheres to our [Style Guides](#style-guides).
4.  **Write clear, concise commit messages** following our [Git Commit Messages](#git-commit-messages) guidelines.
5.  **Test your changes thoroughly**. If applicable, add new tests or update existing ones.
6.  **Ensure all checks pass** (linting, tests).
7.  **Push your branch** to your forked repository.
8.  **Open a Pull Request** to the `main` branch of the original repository.
    - Provide a clear title and description of your changes.
    - Reference any related issues (e.g., `Fixes #123`, `Closes #456`).
    - Include screenshots or GIFs for UI changes.
9.  **Be responsive** to feedback from maintainers.

## Development Setup

### Prerequisites

- Node.js (LTS version recommended)
- npm or Yarn (npm is used in this guide)
- Git
- Supabase account (for database and authentication)

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
3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project based on `env.example`. You'll need to get these values from your Supabase project settings.

    \`\`\`
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # Used for server-side operations
    NEXT_PUBLIC_SITE_URL=http://localhost:3000 # Or your deployment URL
    NEXT_PUBLIC_LOCAL_CALLBACK_URL=http://localhost:3000/auth/callback
    \`\`\`
    For OAuth providers, refer to [Authentication Setup](#authentication-setup).

### Running the Application

To run the development server:

\`\`\`bash
npm run dev
# or yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

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
└── ...
\`\`\`

## Database Setup

We use Supabase for our database.
1.  **Create a new project** in your Supabase dashboard.
2.  **Run the SQL schema:** Navigate to the `database/` directory. You can run the `01-initial-schema.sql` script directly in your Supabase SQL Editor. This will set up the necessary tables and RLS policies.
    \`\`\`sql
    -- Example of running a SQL script
    -- Copy content from database/01-initial-schema.sql and paste into Supabase SQL Editor
    \`\`\`
3.  **Enable Row Level Security (RLS)** for all tables that store user data (e.g., `user_profiles`, `skills`). This is crucial for security. Our schema scripts include RLS policies.

## Authentication Setup

Mentor Connect uses Supabase Auth.
1.  **Enable Email/Password authentication** in your Supabase project settings.
2.  **Configure OAuth Providers (Optional but Recommended):**
    To enable social logins (Google, GitHub, LinkedIn), you'll need to configure them in your Supabase project's Authentication -> Providers section.
    -   **Google:** Follow Supabase's guide to set up Google OAuth. You'll need `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
    -   **GitHub:** Follow Supabase's guide to set up GitHub OAuth. You'll need `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
    -   **LinkedIn:** Follow Supabase's guide to set up LinkedIn OAuth. You'll need `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.

    Add these credentials to your `.env.local` file.
    \`\`\`
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    LINKEDIN_CLIENT_ID=your_linkedin_client_id
    LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
    \`\`\`
    Ensure your `NEXT_PUBLIC_LOCAL_CALLBACK_URL` is correctly set to `http://localhost:3000/auth/callback` for local development. For production, it should be your deployed domain.

## Style Guides

### Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
Examples:
- `feat: add user profile page`
- `fix: correct typo in login form`
- `docs: update contributing guide`
- `refactor: improve auth hook logic`

### JavaScript/TypeScript

-   Use ESLint and Prettier (configured in `.eslintrc.json` and `prettier.config.js`).
-   Prefer `const` and `let` over `var`.
-   Use arrow functions.
-   Follow React best practices (e.g., functional components, hooks).
-   Use TypeScript for type safety.

### CSS/Tailwind CSS

-   We use Tailwind CSS for styling.
-   Prefer utility classes over custom CSS where possible.
-   Ensure responsiveness using Tailwind's responsive prefixes (e.g., `md:`, `lg:`).

## License

This project is licensed under the [MIT License](LICENSE).
