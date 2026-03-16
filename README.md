# CunyZeroLite

CunyZeroLite is a team project built with Next.js, Prisma, and SQLite.

## Tech Stack

- Next.js
- TypeScript
- Prisma
- SQLite
- Tailwind CSS

## Project Structure

```text
src/
  app/
    page.tsx
    login/
      page.tsx
    dashboard/
      page.tsx
    api/
  lib/
    db.ts
    ai.ts
  generated/
    prisma/
prisma/
  schema.prisma
Getting Started
1. Clone the repo
git clone https://github.com/dreyesliranzo/CunyZeroLite.git
cd CunyZeroLite
2. Install dependencies
npm install
3. Set up environment variables

Create a .env file in the project root and add:

DATABASE_URL="file:./dev.db"
4. Generate Prisma client
npx prisma generate
5. Push schema to the database
npx prisma db push
6. Run the project
npm run dev

Then open:

http://localhost:3000
Team Workflow
Main Rule

Do not work directly on main.

Start new work
git checkout main
git pull origin main
git checkout -b feature/your-task-name
Save your work
git add .
git commit -m "Describe your changes"
git push -u origin feature/your-task-name

Then open a pull request into main.

Branch Naming

Use names like:

feature/homepage-ui

feature/login-page

feature/dashboard-page

feature/enroll-route

feature/prisma-schema

feature/readme-update

Folder Ownership

src/app → pages and routes

src/app/api → backend API routes

src/lib → shared helpers

prisma → database schema

src/generated/prisma → generated Prisma client, do not manually edit

Rules

Do not push directly to main

Pull from main before starting a new branch

Keep pull requests small

Do not edit generated Prisma files manually

Ask before changing core setup files


