> Read these instructions in another language: [Português (Brasil)](INSTALLING.pt-br.md)

# Menvo Installation Guide

This guide contains all the necessary instructions to install and run the Menvo project locally on your machine.

## Table of Contents

- [Menvo Installation Guide](#menvo-installation-guide)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Installation](#step-by-step-installation)
    - [1. Fork and Clone the Repository](#1-fork-and-clone-the-repository)
    - [2. Install Dependencies](#2-install-dependencies)
    - [3. Set Up Environment Variables](#3-set-up-environment-variables)
      - [Example .env file content](#example-env-file-content)
    - [4. Run the Project](#4-run-the-project)
  - [Additional Scripts](#additional-scripts)

## Prerequisites

Before you begin, ensure you have the following software installed on your machine:
* **Node.js**: Version 18.x or higher.
* **npm** or **yarn**: Node package manager.

## Step-by-Step Installation

### 1. Fork and Clone the Repository

First, fork the project to your own GitHub account and then clone your fork to your local machine.

```bash
$ git clone https://github.com/your-username/menvo.git

$ cd menvo
```

### 2. Install Dependencies

With the project cloned, install all the necessary dependencies by running the following command in the project root:

```bash
$ npm install
```

### 3. Set Up Environment Variables

The Menvo project uses Supabase as its backend. To run the project locally, you will need to connect to your own Supabase instance.

1.  **Create an Account:** If you don't have one, create a free account at [supabase.com](https://supabase.com) and create a new project.
2.  **Get Your Keys:** In your Supabase project dashboard, navigate to **Project Settings > API**. There you will find the **Project URL** and the **Project API Keys** (use the `anon` key).
3.  **Create the .env file:** In the project's root directory, create a copy of the `.env.example` file and rename it to `.env`.
4.  **Fill in the .env file:** Paste your URL and your `anon` key into the `.env` file you just created. See the example below.

#### Example .env file content
```bash
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

**Important:** The `.env` file contains sensitive information and should not be committed to the repository. It is already included in the project's `.gitignore`.

### 4. Run the Project

With everything set up, start the development server:

```bash
$ npm run dev
```

Now, open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the application running!

## Additional Scripts

The project includes other useful scripts that can be run:
* `npm run build`: Creates a production-ready build of the site.
* `npm run start`: Starts a production server after a build.
* `npm run test`: Runs the project's automated tests.