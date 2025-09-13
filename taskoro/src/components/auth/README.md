# Frontend Authentication Components (Task 2.2 - Complete)

This directory contains the complete frontend authentication system for Taskiro, providing secure user registration, login, and session management.

## Components Overview

### 🔐 Core Authentication Components

#### `AuthContext.tsx`

- **Purpose**: Centralized authentication state management
- **Features**:
  - User state management
  - JWT token handling
  - Automatic token refresh
  - Login/register/logout functions
  - Loading states

#### `LoginForm.tsx`

- **Purpose**: User login interface
- **Features**:
  - Email/password validation
  - Form error handling
  - Loading states with spinner
  - Responsive design
  - Dark mode support

#### `RegisterForm.tsx`

- **Purpose**: User registration interface
- **Features**:
  - Email/password/confirm password validation
  - Password strength requirements
  - Form error handling
  - Loading states
  - Terms acceptance

#### `ProtectedRoute.tsx`

- **Purpose**: Route protection for authenticated users
- **Features**:
  - Authentication checks
  - Loading state handling
  - Automatic redirect to login
  - Return URL preservation

### 🎨 Theme Support

#### `ThemeContext.tsx`

- **Purpose**: Dark/light mode management
- **Features**:
  - System preference detection
  - Theme persistence
  - Smooth transitions
  - Manual theme switching

### 🌐 API Integration

#### `api.ts`

- **Purpose**: Backend communication service
- **Features**:
  - Axios HTTP client
  - Automatic token attachment
  - Token refresh interceptor
  - Error handling
  - Request/response transformation

### 📝 Form Validation

#### `validation.ts`

- **Purpose**: Form validation schemas
- **Features**:
  - Zod schema validation
  - Email format validation
  - Password strength requirements
  - Confirm password matching
  - TypeScript type inference

## Authentication Flow

### Registration Flow

1. User fills registration form
2. Frontend validates input (email format, password strength)
3. API call to `/api/auth/register`
4. Backend creates user and default categories
5. JWT tokens returned and stored
6. User redirected to dashboard

### Login Flow

1. User fills login form
2. Frontend validates input
3. API call to `/api/auth/login`
4. Backend verifies credentials
5. JWT tokens returned and stored
6. User redirected to dashboard

### Token Management

1. Access tokens (15 minutes) stored in localStorage
2. Refresh tokens (7 days) for automatic renewal
3. Automatic token refresh on API calls
4. Logout clears all stored tokens

### Protected Routes

1. Check authentication status
2. Verify token validity
3. Redirect to login if unauthenticated
4. Preserve return URL for post-login redirect

## Security Features

- **JWT Token Management**: Secure token storage and automatic refresh
- **Form Validation**: Client-side validation with server-side verification
- **HTTPS Enforcement**: Secure communication with backend
- **XSS Protection**: Proper input sanitization
- **CSRF Protection**: Token-based authentication
- **Route Protection**: Authenticated-only access to sensitive areas

## Usage Examples

### Using Authentication Context

```tsx
import { useAuth } from '../../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.email}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login({ email, password })}>Login</button>
      )}
    </div>
  );
}
```

### Creating Protected Routes

```tsx
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Using Theme Context

```tsx
import { useTheme } from '../../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
  );
}
```

## Environment Configuration

Create `.env.local` file:

```env
VITE_API_URL=http://localhost:3001
```

## Dependencies

### Core Dependencies

- `react-router-dom` - Client-side routing
- `axios` - HTTP client for API calls
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation integration
- `zod` - Schema validation

### Development Dependencies

- `@types/react-router-dom` - TypeScript types

## Styling

- **Framework**: Tailwind CSS
- **Dark Mode**: Class-based dark mode support
- **Responsive**: Mobile-first responsive design
- **Components**: Consistent styling across all forms
- **Loading States**: Animated spinners and disabled states

## Error Handling

### API Errors

- Network errors with retry mechanisms
- Validation errors with field-specific messages
- Authentication errors with automatic logout
- Server errors with user-friendly messages

### Form Errors

- Real-time validation feedback
- Field-specific error messages
- Form submission error handling
- Loading state management

## Testing

Run the frontend authentication test:

```bash
npx tsx src/test-frontend-auth.ts
```

This validates:

- API service initialization
- Token storage and retrieval
- Authentication state management
- Component integration

## Integration with Backend

The frontend authentication system integrates seamlessly with the backend API:

- **Registration**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Token Refresh**: `POST /api/auth/refresh`
- **Logout**: `DELETE /api/auth/logout`
- **User Profile**: `GET /api/auth/me`

All API calls include proper error handling, loading states, and automatic token management.

## Next Steps

After completing the authentication system:

1. **Task Management**: Implement task creation and management
2. **Natural Language Processing**: Add NLP for task parsing
3. **Calendar Integration**: Connect with Google Calendar
4. **Offline Support**: Add offline functionality
5. **Mobile App**: Deploy with Capacitor

The authentication foundation is now complete and ready for building the core task management features!
