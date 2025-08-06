# Contributing to Menvo

We welcome contributions to Menvo! Here's how you can help:

## Getting Started

1.  **Fork the repository**: Start by forking the Menvo repository to your GitHub account.
2.  **Clone the repository**: Clone your forked repository to your local machine:
    \`\`\`bash
    git clone https://github.com/YOUR_USERNAME/menvo.git
    \`\`\`
3.  **Install dependencies**: Navigate to the project directory and install the necessary dependencies:
    \`\`\`bash
    cd menvo
    npm install # or yarn install
    \`\`\`
4.  **Set up environment variables**: Create a `.env.local` file in the root of your project and add the required environment variables. Refer to `env.example` for a list of variables.
5.  **Run the development server**:
    \`\`\`bash
    npm run dev # or yarn dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Making Changes

1.  **Create a new branch**: Before making any changes, create a new branch for your feature or bug fix:
    \`\`\`bash
    git checkout -b feature/your-feature-name # or bugfix/your-bug-fix-name
    \`\`\`
2.  **Implement your changes**: Write your code, ensuring it adheres to the project's coding style and best practices.
3.  **Test your changes**: If applicable, write or run tests to ensure your changes work as expected and don't introduce any regressions.
4.  **Commit your changes**: Write clear and concise commit messages.
    \`\`\`bash
    git commit -m "feat: Add new feature" # or "fix: Fix bug in authentication"
    \`\`\`
5.  **Push your branch**: Push your changes to your forked repository:
    \`\`\`bash
    git push origin feature/your-feature-name
    \`\`\`
6.  **Create a Pull Request**: Open a pull request from your forked repository to the `main` branch of the original Menvo repository. Provide a detailed description of your changes.

## Code Style

We use ESLint and Prettier to maintain a consistent code style. Please ensure your code is formatted correctly before submitting a pull request.

## Reporting Bugs

If you find a bug, please open an issue on GitHub and provide as much detail as possible, including steps to reproduce the bug and expected behavior.

## Feature Requests

If you have an idea for a new feature, feel free to open an issue on GitHub to discuss it.

Thank you for contributing to Menvo!
