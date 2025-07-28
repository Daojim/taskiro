# Taskiro API Documentation (Task 3.2 - Complete)

This document provides comprehensive documentation for the Taskiro task management API endpoints.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Task Management Endpoints

### 1. Get All Tasks

**GET** `/tasks`

Retrieves all active tasks for the authenticated user with filtering and pagination support.

**Query Parameters:**

- `status` (optional): Filter by task status (`active`, `completed`, `archived`)
- `category` (optional): Filter by category ID
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)
- `search` (optional): Search in task title and description
- `limit` (optional): Number of tasks to return (default: 50, max: 100)
- `offset` (optional): Number of tasks to skip (default: 0)

**Response:**

```json
{
  "tasks": [
    {
      "id": "task-id",
      "userId": "user-id",
      "categoryId": "category-id",
      "title": "Complete project proposal",
      "description": "Draft and review the Q1 project proposal",
      "dueDate": "2024-02-15T00:00:00.000Z",
      "dueTime": "1970-01-01T14:00:00.000Z",
      "priority": "HIGH",
      "status": "ACTIVE",
      "completedAt": null,
      "archivedAt": null,
      "createdAt": "2024-01-27T10:00:00.000Z",
      "updatedAt": "2024-01-27T10:00:00.000Z",
      "category": {
        "id": "category-id",
        "name": "Work",
        "color": "#3B82F6"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 2. Create Task

**POST** `/tasks`

Creates a new task for the authenticated user.

**Request Body:**

```json
{
  "title": "Complete project proposal",
  "description": "Draft and review the Q1 project proposal",
  "dueDate": "2024-02-15",
  "dueTime": "14:00",
  "priority": "high",
  "categoryId": "category-id"
}
```

**Validation Rules:**

- `title`: Required, 1-500 characters
- `description`: Optional, max 2000 characters
- `dueDate`: Optional, ISO 8601 date format
- `dueTime`: Optional, HH:MM format
- `priority`: Optional, one of: `low`, `medium`, `high`
- `categoryId`: Optional, must belong to user

**Response:**

```json
{
  "message": "Task created successfully",
  "task": {
    "id": "new-task-id",
    "title": "Complete project proposal",
    "priority": "HIGH",
    "status": "ACTIVE",
    "category": { ... }
  }
}
```

### 3. Get Specific Task

**GET** `/tasks/:id`

Retrieves a specific task by ID.

**Response:**

```json
{
  "task": {
    "id": "task-id",
    "title": "Complete project proposal",
    "category": { ... }
  }
}
```

### 4. Update Task

**PUT** `/tasks/:id`

Updates an existing task.

**Request Body:** Same as create task, plus optional `status` field.

**Response:**

```json
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

### 5. Archive Task

**DELETE** `/tasks/:id`

Archives a task (soft delete).

**Response:**

```json
{
  "message": "Task archived successfully",
  "task": {
    "status": "ARCHIVED",
    "archivedAt": "2024-01-27T15:30:00.000Z"
  }
}
```

### 6. Get Archived Tasks

**GET** `/tasks/archived`

Retrieves archived tasks with filtering and pagination.

**Query Parameters:**

- `category` (optional): Filter by category ID
- `search` (optional): Search in title and description
- `limit` (optional): Number of tasks (default: 50, max: 100)
- `offset` (optional): Number to skip (default: 0)

**Response:** Same structure as get all tasks.

### 7. Restore Archived Task

**POST** `/tasks/:id/restore`

Restores an archived task to active status.

**Response:**

```json
{
  "message": "Task restored successfully",
  "task": {
    "status": "ACTIVE",
    "archivedAt": null
  }
}
```

### 8. Toggle Task Completion

**POST** `/tasks/:id/complete`

Toggles task completion status between active and completed.

**Response:**

```json
{
  "message": "Task completed successfully",
  "task": {
    "status": "COMPLETED",
    "completedAt": "2024-01-27T16:00:00.000Z"
  }
}
```

## Category Management Endpoints

### 1. Get All Categories

**GET** `/categories`

Retrieves all categories for the authenticated user with task counts.

**Response:**

```json
{
  "categories": [
    {
      "id": "category-id",
      "userId": "user-id",
      "name": "Work",
      "color": "#3B82F6",
      "isDefault": true,
      "createdAt": "2024-01-27T09:00:00.000Z",
      "_count": {
        "tasks": 5
      }
    }
  ]
}
```

### 2. Create Category

**POST** `/categories`

Creates a new category.

**Request Body:**

```json
{
  "name": "Personal Projects",
  "color": "#10B981"
}
```

**Validation Rules:**

- `name`: Required, 1-100 characters, must be unique per user
- `color`: Optional, valid hex color (default: #3B82F6)

**Response:**

```json
{
  "message": "Category created successfully",
  "category": { ... }
}
```

### 3. Get Specific Category

**GET** `/categories/:id`

Retrieves a specific category with task count.

### 4. Update Category

**PUT** `/categories/:id`

Updates an existing category.

### 5. Delete Category

**DELETE** `/categories/:id`

Deletes a category with options for handling associated tasks.

**Request Body:**

```json
{
  "deleteAssociatedTasks": false
}
```

**Options:**

- `deleteAssociatedTasks: true` - Archives all tasks in the category
- `deleteAssociatedTasks: false` - Removes category from tasks (sets to null)

**Response:**

```json
{
  "message": "Category deleted successfully",
  "tasksAffected": 3,
  "tasksArchived": false
}
```

**Restrictions:**

- Cannot delete default categories (Work, Personal, School)

### 6. Get Category Tasks

**GET** `/categories/:id/tasks`

Retrieves all tasks in a specific category.

**Query Parameters:**

- `status` (optional): Filter by task status
- `limit` (optional): Number of tasks (default: 50, max: 100)
- `offset` (optional): Number to skip (default: 0)

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2024-01-27T10:00:00.000Z"
  }
}
```

### Common Error Codes

- `TASK_NOT_FOUND` - Task doesn't exist or doesn't belong to user
- `CATEGORY_NOT_FOUND` - Category doesn't exist or doesn't belong to user
- `CATEGORY_EXISTS` - Category name already exists for user
- `CANNOT_DELETE_DEFAULT` - Attempted to delete a default category
- `VALIDATION_ERROR` - Request validation failed
- `TOKEN_REQUIRED` - Authentication token missing
- `TOKEN_EXPIRED` - Authentication token expired

## Data Types

### Task Status

- `ACTIVE` - Task is active and incomplete
- `COMPLETED` - Task has been completed
- `ARCHIVED` - Task has been archived (soft deleted)

### Priority Levels

- `LOW` - Low priority task
- `MEDIUM` - Medium priority task (default)
- `HIGH` - High priority task

### Date/Time Formats

- **Dates**: ISO 8601 format (`2024-01-27`)
- **Times**: HH:MM format (`14:30`)
- **Timestamps**: ISO 8601 with timezone (`2024-01-27T14:30:00.000Z`)

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP

## Pagination

All list endpoints support pagination:

- `limit`: Maximum number of items to return (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)
- Response includes `pagination` object with total count and hasMore flag

## Security Features

- **Authentication**: JWT token required for all endpoints
- **Authorization**: Users can only access their own data
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Prevents abuse and DoS attacks
- **CORS**: Configured for frontend origin only
- **Helmet**: Security headers for production

## Usage Examples

### Creating a Task with cURL

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pull request",
    "description": "Review the authentication system PR",
    "dueDate": "2024-01-28",
    "dueTime": "10:00",
    "priority": "high"
  }'
```

### Filtering Tasks

```bash
# Get high priority work tasks
curl "http://localhost:3001/api/tasks?priority=high&category=work-category-id" \
  -H "Authorization: Bearer your-jwt-token"

# Search for tasks containing "project"
curl "http://localhost:3001/api/tasks?search=project" \
  -H "Authorization: Bearer your-jwt-token"
```

### Managing Categories

```bash
# Create a new category
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Side Projects",
    "color": "#F59E0B"
  }'

# Delete category and archive associated tasks
curl -X DELETE http://localhost:3001/api/categories/category-id \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"deleteAssociatedTasks": true}'
```

The API is now complete and ready for frontend integration and natural language processing features!
