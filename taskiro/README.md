# Taskiro

A personal productivity web application that helps users organize tasks using natural language input.

## Setup Complete ✅

This project has been initialized with:

- ✅ React 18 with TypeScript
- ✅ Vite for build tooling
- ✅ Tailwind CSS for styling
- ✅ Prisma ORM with PostgreSQL schema
- ✅ ESLint + Prettier for code quality
- ✅ Docker Compose for PostgreSQL database

## Prerequisites

- Node.js (v20.19.0 or >=22.12.0)
- Docker and Docker Compose (for database)
- npm or yarn

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the database:**

   ```bash
   docker compose up -d
   ```

3. **Generate Prisma client:**

   ```bash
   npm run db:generate
   ```

4. **Run database migrations:**

   ```bash
   npm run db:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Database Schema

The application uses PostgreSQL with the following models:

- **User** - User accounts with authentication
- **Category** - Task categories (work, personal, school, etc.)
- **Task** - Individual tasks with natural language parsing
- **CalendarIntegration** - Google Calendar sync integration

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Build Tool:** Vite
- **Database:** PostgreSQL with Prisma ORM
- **Code Quality:** ESLint, Prettier
- **Containerization:** Docker Compose

## Next Steps

The foundation is ready! You can now proceed with implementing:

1. Authentication system
2. Natural language processing
3. Task management features
4. Calendar integration
5. Mobile deployment with Capacitor
