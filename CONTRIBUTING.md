> Read this guide in another language: [Português (Brasil)](CONTRIBUTING.pt-br.md)

# Contributing
Would you like to help us improve the project? Check out this contribution guide to help Menvo grow.

## Table of Contents
- [Contributing](#contributing)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Cloning the repository](#cloning-the-repository)
    - [Creating a new branch](#creating-a-new-branch)
    - [Naming the commit message](#naming-the-commit-message)
  - [Submitting your changes](#submitting-your-changes)
  - [Other ways to contribute](#other-ways-to-contribute)

## Getting Started
### Cloning the repository
Fork the repository on GitHub and clone it to your machine.
\`\`\`bash
$ git clone https://github.com/{Seu nome}/menvo.git

$ cd menvo
\`\`\`

### Creating a new branch
Create a new branch for the change you want to submit. For example:
\`\`\`bash
$ git checkout -b fix-responsive
\`\`\`
Executing the command above the branch named `fix-responsive` will be created.

**Note:** The branch name must be meaningful and should **only** indicate the change to be made. Pull requests that do not follow this pattern will not be accepted.

### Naming the commit message
To write a good commit message, you can imagine the following sentence: "If applied, this commit will {your commit message}". For example:

*If applied, this commit will **Fix malformed responsiveness***

Remember to start your message with a verb like: Add, Refactor, Delete, Fix, etc.

**Note:** Try to keep your messages under 50 characters and detail the changes in the commit description. While not mandatory, this is a well-known and widely used practice in the Git community.

## Submitting your changes
After making your changes, push them to the remote repository:
\`\`\`bash
$ git push origin fix-responsive
\`\`\`

After that, go to your newly forked repository on GitHub, select the created branch, and click on "Pull Request".

**IMPORTANT:** Make the Pull Request from your branch specifically to the `dev` branch. Pull Requests sent to the `main` branch will be automatically rejected.

Write a general comment about the changes made and, if necessary, provide a description of the changes and your reasoning (optional). For example:

"**Fixes #418**

This PR fixes the issue submitted regarding a responsiveness error."

After that, your Pull Request will enter the review phase and, hopefully, your changes will be integrated into Menvo!

## Other ways to contribute
You can also help the project grow by:

- Creating new issues
- Suggesting changes and improvements
- Joining our [community](https://discord.gg/5tWy7Zgm) on Discord