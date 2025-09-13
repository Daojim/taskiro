# Taskiro Backend API

## Authentication System (Task 2.1 - Complete)

The authentication system provides secure user registration, login, and token management using JWT tokens and bcrypt password hashing.

### Features Implemented

- ✅ User registration with email and password
- ✅ Secure password hashing with bcrypt (12 rounds)
- ✅ JWT-based authentication with access and refresh tokens
- ✅ Token refresh mechanism
- ✅ User profile retrieval
- ✅ Input validation and sanitization
- ✅ Rate limiting for authentication endpoints
- ✅ Comprehensive error handling
- ✅ Default category creation for new users

### API Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

#### POST /api/auth/login

Authenticate an existing user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

#### POST /api/auth/refresh

Refresh an expired access token.

**Request Body:**

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**

```json
{
  "message": "Token refreshed successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  }
}
```

#### DELETE /api/auth/logout

Logout the current user (requires authentication).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "message": "Logout successful"
}
```

#### GET /api/auth/me

Get current user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
- **Rate Limiting**: 5 requests per 15 minutes for auth endpoints
- **Input Validation**: Email format and password strength validation
- **CORS Protection**: Configured for frontend origin
- **Helmet Security**: Security headers for production
- **Error Handling**: Standardized error responses

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskiro"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Default Categories

When a user registers, the system automatically creates three default categories:

- **Work** (Blue - #3B82F6)
- **Personal** (Green - #10B981)
- **School** (Yellow - #F59E0B)

### Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

Common error codes:

- `USER_EXISTS`: Email already registered
- `INVALID_CREDENTIALS`: Wrong email/password
- `TOKEN_REQUIRED`: Missing authorization header
- `TOKEN_EXPIRED`: Access token expired
- `VALIDATION_ERROR`: Invalid input data
- `USER_NOT_FOUND`: User doesn't exist

### Development Setup

1. Install dependencies: `npm install`
2. Start PostgreSQL: `docker compose up -d`
3. Generate Prisma client: `npm run db:generate`
4. Push database schema: `npm run db:push`
5. Start development server: `npm run server:dev`

The server will run on http://localhost:3001 with a health check at `/health`.

### Testing

Run the authentication test to verify implementation:

```bash
npx tsx server/test-auth.ts
```

This validates password hashing, Prisma client, and JWT configuration without requiring a database connection.
