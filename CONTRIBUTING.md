# Contributing to Menvo

We welcome contributions to the Menvo project! Here's how you can help.

## Getting Started

1.  **Fork the repository**: Start by forking the Menvo repository to your GitHub account.
2.  **Clone the repository**: Clone your forked repository to your local machine:
    \`\`\`bash
    git clone https://github.com/YOUR_USERNAME/menvo.git
    cd menvo
    \`\`\`
3.  **Install dependencies**:
    \`\`\`bash
    npm install
    # or
    yarn install
    \`\`\`
4.  **Set up environment variables**: Copy `.env.example` to `.env.local` and fill in the necessary environment variables (e.g., Supabase credentials, OAuth keys).
    \`\`\`bash
    cp .env.example .env.local
    \`\`\`
5.  **Run the development server**:
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Making Changes

1.  **Create a new branch**: Before making any changes, create a new branch for your feature or bug fix:
    \`\`\`bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b bugfix/your-bug-fix-name
    \`\`\`
    Choose a descriptive name for your branch.

2.  **Implement your changes**: Write your code, ensuring it adheres to the project's coding style and best practices.

3.  **Test your changes**: If you're adding new features, please write tests. If you're fixing a bug, ensure your fix includes a test that reproduces the bug and then passes with your fix.

4.  **Commit your changes**: Write clear and concise commit messages.
    \`\`\`bash
    git add .
    git commit -m "feat: Add new feature"
    # or
    git commit -m "fix: Resolve bug in authentication"
    \`\`\`

5.  **Push to your fork**:
    \`\`\`bash
    git push origin feature/your-feature-name
    \`\`\`

## Submitting a Pull Request

1.  **Open a Pull Request**: Go to your forked repository on GitHub and click the "Compare & pull request" button.
2.  **Describe your changes**: Provide a detailed description of your changes, including:
    *   What problem does this PR solve?
    *   How does it solve it?
    *   Any relevant screenshots or GIFs for UI changes.
    *   Any breaking changes or considerations for reviewers.
3.  **Link to issues**: If your PR addresses an open issue, link it using keywords like `Closes #123` or `Fixes #456`.
4.  **Request a review**: Ask one of the project maintainers to review your code.

## Code Style

*   We use ESLint and Prettier for code formatting and linting. Please ensure your code passes lint checks before submitting a PR.
*   Follow the existing code style in the project.

## Reporting Bugs

If you find a bug, please open an issue on GitHub. Provide as much detail as possible, including:
*   Steps to reproduce the bug.
*   Expected behavior.
*   Actual behavior.
*   Screenshots or error messages.
*   Your environment (OS, browser, Node.js version).

Thank you for contributing to Menvo!
