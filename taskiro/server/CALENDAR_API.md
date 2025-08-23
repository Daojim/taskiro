# Google Calendar API Integration

This document describes the Google Calendar API integration endpoints for Taskiro.

## Setup Requirements

1. **Google Cloud Console Setup:**
   - Create a project in Google Cloud Console
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:5173/calendar/callback`

2. **Environment Variables:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/calendar/callback
   ```

## API Endpoints

All endpoints require authentication via Bearer token in the Authorization header.

### 1. Get Authorization URL

**GET** `/api/calendar/auth-url`

Get the Google OAuth 2.0 authorization URL for calendar access.

**Response:**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 2. Connect Calendar

**POST** `/api/calendar/connect`

Connect user's Google Calendar using authorization code.

**Request Body:**

```json
{
  "code": "authorization_code_from_google"
}
```

**Response:**

```json
{
  "success": true,
  "integration": {
    "id": "integration_id",
    "connected": true,
    "calendars": 5
  }
}
```

### 3. Get Connection Status

**GET** `/api/calendar/status`

Get current calendar connection status.

**Response:**

```json
{
  "connected": true,
  "integration": {
    "id": "integration_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "calendars": 5
  }
}
```

### 4. Disconnect Calendar

**DELETE** `/api/calendar/disconnect`

Disconnect Google Calendar integration.

**Response:**

```json
{
  "success": true,
  "message": "Calendar disconnected successfully"
}
```

### 5. Sync Tasks to Calendar

**POST** `/api/calendar/sync/tasks-to-calendar`

Sync active tasks with due dates to Google Calendar.

**Response:**

```json
{
  "success": true,
  "result": {
    "eventsCreated": 5,
    "eventsUpdated": 2,
    "errors": []
  }
}
```

### 6. Sync Events to Tasks

**POST** `/api/calendar/sync/events-to-tasks`

Sync Google Calendar events to Taskiro tasks.

**Response:**

```json
{
  "success": true,
  "result": {
    "tasksCreated": 3,
    "tasksUpdated": 1,
    "errors": []
  }
}
```

### 7. Bidirectional Sync

**POST** `/api/calendar/sync`

Perform bidirectional synchronization between tasks and calendar events.

**Response:**

```json
{
  "success": true,
  "result": {
    "tasksCreated": 3,
    "tasksUpdated": 1,
    "eventsCreated": 5,
    "eventsUpdated": 2,
    "errors": []
  }
}
```

### 8. Refresh Access Token

**POST** `/api/calendar/refresh-token`

Manually refresh the Google Calendar access token.

**Response:**

```json
{
  "success": true,
  "tokenRefreshed": true,
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Common Error Codes

- `AUTH_URL_ERROR`: Failed to generate authorization URL
- `VALIDATION_ERROR`: Invalid request data
- `CONNECTION_ERROR`: Failed to connect calendar
- `STATUS_ERROR`: Failed to get calendar status
- `DISCONNECT_ERROR`: Failed to disconnect calendar
- `SYNC_ERROR`: Failed to perform sync operation
- `TOKEN_REFRESH_ERROR`: Failed to refresh access token

## Integration Flow

1. **Frontend requests auth URL:** `GET /api/calendar/auth-url`
2. **User authorizes in Google:** Redirect to returned auth URL
3. **Google redirects back:** With authorization code
4. **Frontend connects calendar:** `POST /api/calendar/connect` with code
5. **Sync operations:** Use sync endpoints as needed
6. **Token refresh:** Automatic or manual via refresh endpoint

## Security Features

- **OAuth 2.0:** Secure authorization flow
- **Token Refresh:** Automatic token refresh mechanism
- **Scope Limitation:** Only calendar read/write permissions
- **User Isolation:** Each user's calendar data is isolated
- **Error Handling:** Comprehensive error handling and logging

## Sync Behavior

### Tasks to Calendar Events

- Only active tasks with due dates are synced
- Task priority determines event color:
  - High priority: Red (colorId: 11)
  - Medium priority: Yellow (colorId: 5)
  - Low priority: Green (colorId: 2)
- Tasks with specific times create timed events (1 hour duration)
- Tasks without times create all-day events

### Calendar Events to Tasks

- Events from next 30 days are considered
- Events without titles are skipped
- Duplicate detection by title and date
- New tasks created with medium priority
- Event descriptions become task descriptions

## Testing

Use the test script to verify setup:

```bash
npx tsx server/test-calendar-integration.ts
```

This will check:

- Environment variable configuration
- Auth URL generation
- Database schema integrity

## Troubleshooting

### Common Issues

1. **"No refresh token available"**
   - Ensure `prompt: 'consent'` in OAuth flow
   - User must re-authorize to get refresh token

2. **"Token expired"**
   - Automatic refresh should handle this
   - Manual refresh via `/api/calendar/refresh-token`

3. **"Calendar not found"**
   - Check Google Calendar API is enabled
   - Verify OAuth credentials are correct

4. **"Sync errors"**
   - Check individual error messages in response
   - Verify calendar permissions
   - Ensure tasks have valid due dates

### Debug Tips

- Enable debug logging in Google APIs client
- Check server logs for detailed error messages
- Verify OAuth redirect URI matches exactly
- Test with minimal calendar events first
