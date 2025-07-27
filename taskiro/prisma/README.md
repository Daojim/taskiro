# Taskiro Database Schema (Task 3.1 - Complete)

This directory contains the complete database schema for Taskiro, including migrations, seed data, and documentation.

## Database Overview

Taskiro uses PostgreSQL with Prisma ORM for type-safe database operations. The schema supports:

- **User Management**: Secure user accounts with authentication
- **Task Organization**: Flexible task management with categories and priorities
- **Calendar Integration**: Google Calendar sync capabilities
- **Data Archiving**: Soft deletion with task archiving
- **Performance**: Optimized indexes for common queries

## Schema Structure

### Tables

#### 1. Users (`users`)

Stores user account information and authentication data.

```sql
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);
```

**Key Features:**

- Unique email constraint for authentication
- Bcrypt password hashing (12 rounds)
- Automatic timestamps for audit trail

#### 2. Categories (`categories`)

User-defined categories for task organization.

```sql
CREATE TABLE "categories" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT REFERENCES users(id) ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**

- User-scoped categories (CASCADE delete)
- Color coding for visual organization
- Default categories created on user registration
- Support for custom user categories

**Default Categories:**

- **Work** (Blue - #3B82F6)
- **Personal** (Green - #10B981)
- **School** (Yellow - #F59E0B)

#### 3. Tasks (`tasks`)

Core task data with full lifecycle management.

```sql
CREATE TABLE "tasks" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT REFERENCES users(id) ON DELETE CASCADE,
    "category_id" TEXT REFERENCES categories(id) ON DELETE SET NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATE,
    "due_time" TIME,
    "priority" Priority DEFAULT 'medium',
    "status" Status DEFAULT 'active',
    "completed_at" TIMESTAMP,
    "archived_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);
```

**Key Features:**

- User-scoped tasks (CASCADE delete)
- Optional category assignment (SET NULL on category delete)
- Separate date and time fields for flexible scheduling
- Status tracking: active → completed → archived
- Audit timestamps for task lifecycle

**Enums:**

```sql
-- Priority levels
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');

-- Task status
CREATE TYPE "Status" AS ENUM ('active', 'completed', 'archived');
```

#### 4. Calendar Integrations (`calendar_integrations`)

Google Calendar API integration data.

```sql
CREATE TABLE "calendar_integrations" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT REFERENCES users(id) ON DELETE CASCADE,
    "google_calendar_id" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**

- OAuth token management for Google Calendar
- Automatic token refresh handling
- User-scoped integrations

### Performance Indexes

```sql
-- User lookup optimization
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Task query optimization
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
```

**Query Patterns Optimized:**

- User authentication by email
- Task retrieval by user
- Calendar view by due date
- Task filtering by status

## Database Operations

### Migrations

```bash
# Create new migration
npm run db:migrate

# Apply migrations to database
npm run db:push

# Generate Prisma client
npm run db:generate
```

### Seeding

```bash
# Run seed script
npm run db:seed
```

The seed script creates default categories for development and provides setup instructions.

### Development Tools

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (development only)
npx prisma migrate reset
```

## Data Relationships

```
Users (1) ──────── (∞) Categories
  │                      │
  │                      │
  └── (∞) Tasks ────── (1) Category [Optional]
  │
  └── (∞) Calendar Integrations
```

**Relationship Rules:**

- **Users → Categories**: One-to-many, CASCADE delete
- **Users → Tasks**: One-to-many, CASCADE delete
- **Categories → Tasks**: One-to-many, SET NULL on delete
- **Users → Calendar Integrations**: One-to-many, CASCADE delete

## Data Validation

### Application Level (Prisma)

- Required fields enforced by schema
- Enum validation for priority and status
- Foreign key constraints
- Unique constraints (email)

### Database Level (PostgreSQL)

- CHECK constraints on enums
- NOT NULL constraints
- UNIQUE constraints
- Foreign key constraints with CASCADE/SET NULL

### Business Logic (Application)

- Email format validation
- Password strength requirements (8+ chars, mixed case, numbers)
- Task title length limits (500 chars)
- Category name limits (100 chars)
- Color format validation (hex colors)

## Security Considerations

### Data Protection

- Password hashing with bcrypt (12 rounds)
- User data isolation through foreign keys
- No sensitive data in logs
- Parameterized queries prevent SQL injection

### Access Control

- All data scoped to authenticated users
- JWT token validation required
- No cross-user data access possible
- Soft deletion preserves audit trail

## Performance Characteristics

### Optimized Queries

- User authentication: O(1) with email index
- Task retrieval: O(log n) with user_id index
- Calendar view: O(log n) with due_date index
- Status filtering: O(log n) with status index

### Scalability Considerations

- Indexes support up to millions of tasks per user
- Soft deletion prevents data loss
- Timestamp fields enable audit trails
- Prepared statements for query optimization

## Backup and Recovery

### Development

- Local PostgreSQL with Docker
- Migration files in version control
- Seed scripts for test data

### Production Recommendations

- Automated daily backups
- Point-in-time recovery capability
- Migration rollback procedures
- Monitoring for performance metrics

## Usage Examples

### Creating a Task

```typescript
const task = await prisma.task.create({
  data: {
    userId: user.id,
    title: 'Complete project proposal',
    description: 'Draft and review the Q1 project proposal',
    dueDate: new Date('2024-02-15'),
    dueTime: new Date('2024-02-15T14:00:00'),
    priority: Priority.HIGH,
    categoryId: workCategory.id,
  },
  include: {
    category: true,
  },
});
```

### Querying User Tasks

```typescript
const tasks = await prisma.task.findMany({
  where: {
    userId: user.id,
    status: Status.ACTIVE,
  },
  include: {
    category: true,
  },
  orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
});
```

### Archiving a Task

```typescript
const archivedTask = await prisma.task.update({
  where: { id: taskId },
  data: {
    status: Status.ARCHIVED,
    archivedAt: new Date(),
  },
});
```

The database schema is now complete and ready to support all Taskiro features with optimal performance and data integrity.
