# Contributing to MentorConnect

Thank you for your interest in contributing to MentorConnect! We welcome contributions from everyone. By contributing, you agree to abide by our Code of Conduct.

## How to Contribute

1.  **Fork the Repository**: Start by forking the MentorConnect repository to your GitHub account.
2.  **Clone the Repository**: Clone your forked repository to your local machine:
    \`\`\`bash
    git clone https://github.com/your-username/mentor-connect.git
    \`\`\`
3.  **Create a New Branch**: Create a new branch for your feature or bug fix:
    \`\`\`bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b bugfix/your-bug-fix-name
    \`\`\`
4.  **Install Dependencies**: Navigate to the project directory and install the dependencies:
    \`\`\`bash
    cd mentor-connect
    npm install # or yarn install
    \`\`\`
5.  **Make Your Changes**: Implement your feature or fix the bug. Ensure your code adheres to the project's coding style and best practices.
6.  **Test Your Changes**: Run tests to ensure your changes haven't introduced any regressions:
    \`\`\`bash
    npm test # or yarn test
    \`\`\`
7.  **Commit Your Changes**: Commit your changes with a clear and concise commit message. Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat: add new feature`, `fix: resolve bug`).
    \`\`\`bash
    git commit -m "feat: Add user profile editing"
    \`\`\`
8.  **Push to Your Fork**: Push your changes to your forked repository:
    \`\`\`bash
    git push origin feature/your-feature-name
    \`\`\`
9.  **Create a Pull Request**: Open a pull request from your forked repository to the `main` branch of the original MentorConnect repository. Provide a detailed description of your changes.

## Code Style

We use ESLint and Prettier for code formatting and linting. Please ensure your code is formatted correctly before submitting a pull request. You can run the following commands:

\`\`\`bash
npm run lint
npm run format
\`\`\`

## Reporting Bugs

If you find a bug, please open an issue on GitHub. Provide as much detail as possible, including steps to reproduce the bug, expected behavior, and actual behavior.

## Suggesting Features

We welcome feature suggestions! Open an issue on GitHub and describe your idea. Explain why you think it would be a valuable addition to MentorConnect.

## Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We expect all contributors to adhere to these guidelines.

Thank you for helping us build a better MentorConnect!
