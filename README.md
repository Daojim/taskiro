# Taskiro

Taskiro is a modern personal productivity web application that transforms how you manage tasks through intelligent natural language processing. Simply type what you need to do in plain English, and Taskiro automatically extracts due dates, priorities, and categories to organize your workflow seamlessly.

## ✨ Features

- **Natural Language Task Input** - Create tasks by typing naturally: "Call mom tomorrow at 3pm" or "Finish project report by Friday"
- **Smart Date & Time Parsing** - Automatically extracts and schedules due dates from your input using advanced NLP
- **Category Management** - Organize tasks with customizable categories (work, personal, school, etc.)
- **Priority Levels** - Automatic and manual priority assignment (low, medium, high)
- **Google Calendar Integration** - Sync your tasks with Google Calendar for unified scheduling
- **User Authentication** - Secure JWT-based authentication system
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Task Status Tracking** - Active, completed, and archived task states

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with bcrypt password hashing
- **NLP:** Chrono-node for natural language date parsing
- **Testing:** Jest with coverage reporting
- **Code Quality:** ESLint, Prettier
- **Containerization:** Docker & Docker Compose

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** (v20.19.0 or >=22.12.0)
- **Docker & Docker Compose** (for PostgreSQL database)
- **npm** or **yarn**

### Quick Start

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd <repo-name>
   ```

2. **Navigate to the project directory:**

   ```bash
   cd taskiro
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the configuration values as needed.

5. **Start the PostgreSQL database:**

   ```bash
   docker compose up -d
   ```

6. **Set up the database:**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

7. **Start the development servers:**

   **Option A: Full-stack development (recommended)**

   ```bash
   # Terminal 1: Start the backend server
   npm run server:dev

   # Terminal 2: Start the frontend development server
   npm run dev
   ```

   **Option B: Frontend only (if backend is running elsewhere)**

   ```bash
   npm run dev
   ```

8. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database Studio: `npm run db:studio` (http://localhost:5555)

## 🐳 Docker Deployment

### Development with Docker

```bash
cd taskiro
# Start PostgreSQL only
docker compose up -d

# Or start the full application stack
docker compose -f docker-compose.prod.yml up -d
```

### Production Docker Build

```bash
cd taskiro
# Build production image
npm run docker:build

# Run production container
npm run docker:run

# Stop production container
npm run docker:stop
```

## 📝 Available Scripts

All commands should be run from the `taskiro/` directory:

### Development

- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend development server with hot reload
- `npm run build` - Build frontend for production
- `npm run build:prod` - Full production build (lint + test + build + server build)

### Database

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:prod` - Run production migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio (database GUI)

### Testing & Quality

- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Production

- `npm run server:build` - Build backend for production
- `npm run server:start` - Start production server
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run production Docker container

## 🗄️ Database Schema

The application uses PostgreSQL with the following core models:

- **User** - User accounts with secure authentication
- **Category** - Customizable task categories with color coding
- **Task** - Tasks with NLP-parsed due dates, priorities, and status tracking
- **CalendarIntegration** - Google Calendar synchronization settings

## 🔧 Configuration

### Environment Variables

Copy `taskiro/.env.example` to `taskiro/.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://taskiro:password@localhost:5432/taskiro_db"

# JWT Secrets (generate strong random strings for production)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google Calendar Integration (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5173/calendar/callback"
```

### Google Calendar Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Add your credentials to the `.env` file

## 🚀 Production Deployment

### Using Docker (Recommended)

1. **Build and deploy:**

   ```bash
   cd taskiro
   npm run deploy:build
   npm run docker:run
   ```

2. **Environment setup:**
   - Copy `.env.production.example` to `.env.production`
   - Update production environment variables
   - Ensure DATABASE_URL points to your production database

### Manual Deployment

1. **Build the application:**

   ```bash
   cd taskiro
   npm run build:prod
   ```

2. **Set up production database:**

   ```bash
   npm run db:migrate:prod
   ```

3. **Start the server:**
   ```bash
   npm run server:start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Issues & Support

If you encounter any issues or have questions, please [open an issue](https://github.com/your-username/taskiro/issues) on GitHub.
