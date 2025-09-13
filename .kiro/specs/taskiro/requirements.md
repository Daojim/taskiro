# Requirements Document

## Introduction

Taskoro is a personal productivity web application that helps users organize both academic and everyday tasks more efficiently using natural language input. The application addresses the friction found in most calendar and to-do apps by allowing users to simply type phrases like "Assignment 2 due next Tuesday" and automatically creating tasks that appear in both a task list and calendar view. This solo-use tool is designed for busy individuals including students, professionals, and anyone who wants to quickly organize their day or week without the manual overhead of traditional task management systems.

## Requirements

### Requirement 1

**User Story:** As a user, I want to register and log into my personal account, so that I can securely access my tasks from any device.

#### Acceptance Criteria

1. WHEN a new user visits the application THEN the system SHALL provide a registration form requiring email and password
2. WHEN a user submits valid registration information THEN the system SHALL create a new account and redirect to the main application
3. WHEN a registered user enters valid login credentials THEN the system SHALL authenticate them and provide access to their personal task dashboard
4. WHEN a user enters invalid login credentials THEN the system SHALL display an appropriate error message
5. IF a user is not authenticated THEN the system SHALL redirect them to the login page when accessing protected routes

### Requirement 2

**User Story:** As a user, I want to create tasks using natural language input, so that I can quickly add tasks without manually filling out forms.

#### Acceptance Criteria

1. WHEN a user types a natural language phrase like "Buy groceries tomorrow" THEN the system SHALL parse the text and extract the task name, due date, and due time if specified
2. WHEN the system successfully parses natural language input THEN it SHALL create a new task with the extracted information
3. WHEN a user enters phrases with relative dates like "next Tuesday" or "in two weeks" THEN the system SHALL correctly calculate and assign the absolute due date
4. WHEN a user enters ambiguous date phrases like "next week" THEN the system SHALL display a popup with selectable date options for the next 7-14 days
5. WHEN a user enters phrases like "end of month" THEN the system SHALL display a popup with selectable options for the last few days of the current month
6. WHEN a user includes priority indicators like "urgent", "important", "ASAP", or "major" THEN the system SHALL extract and assign the appropriate priority level
7. WHEN natural language parsing fails to extract clear information THEN the system SHALL prompt the user to clarify or use manual entry

### Requirement 3

**User Story:** As a user, I want to manually create and edit tasks with specific details, so that I have full control over task information when needed.

#### Acceptance Criteria

1. WHEN a user chooses manual task creation THEN the system SHALL provide a form with fields for task name, due date, due time, priority, and category
2. WHEN a user submits a valid manual task form THEN the system SHALL create the task with the specified details
3. WHEN a user wants to edit an existing task THEN the system SHALL allow inline editing of all task properties
4. WHEN a user wants detailed task editing THEN the system SHALL provide an option to open a comprehensive edit form
5. WHEN a user updates a task THEN the system SHALL save the changes and reflect them in both list and calendar views
6. IF required fields are missing in manual entry THEN the system SHALL display validation errors

### Requirement 4

**User Story:** As a user, I want to organize my tasks with categories and priorities, so that I can better manage different types of work and focus on what's important.

#### Acceptance Criteria

1. WHEN creating a task THEN the system SHALL allow assignment of a category (optional)
2. WHEN a user hasn't used categories before THEN the system SHALL provide default categories like "work", "personal", and "school"
3. WHEN a user wants to create custom categories THEN the system SHALL allow them to add and name new categories
4. WHEN a user wants to edit or delete custom categories THEN the system SHALL provide category management options
5. WHEN a user deletes a category with associated tasks THEN the system SHALL display a popup asking whether to delete the tasks or move them to an unassigned state
6. WHEN creating or editing a task THEN the system SHALL allow selection of priority level (high, medium, low)
7. WHEN no priority is specified THEN the system SHALL default to medium priority
8. WHEN no category is assigned THEN tasks SHALL exist in an unassigned/uncategorized state

### Requirement 5

**User Story:** As a user, I want to view my tasks in a list format with status tracking, so that I can see all my tasks at once and mark them as complete.

#### Acceptance Criteria

1. WHEN a user accesses the task list view THEN the system SHALL display all tasks by default with their name, due date, due time, priority, and category
2. WHEN a user clicks on a task checkbox THEN the system SHALL mark the task as complete and display it with a crossed-out visual style
3. WHEN a user clicks on a completed task checkbox THEN the system SHALL allow them to uncheck and restore the task to active status
4. WHEN viewing the task list THEN the system SHALL allow filtering by category, priority, or completion status
5. WHEN tasks are overdue THEN the system SHALL visually highlight them in the list
6. WHEN a user wants to delete a task THEN the system SHALL archive the task rather than permanently delete it

### Requirement 6

**User Story:** As a user, I want to view my tasks in a traditional calendar grid, so that I can see my schedule and plan my time effectively.

#### Acceptance Criteria

1. WHEN a user accesses the calendar view THEN the system SHALL display a monthly grid showing tasks on their due dates
2. WHEN multiple tasks are due on the same day THEN the system SHALL display all tasks for that date
3. WHEN a user clicks on a task in the calendar THEN the system SHALL allow them to view and edit task details
4. WHEN viewing the calendar THEN the system SHALL allow navigation between months
5. WHEN tasks have different priorities THEN the system SHALL use visual indicators (colors, icons) to distinguish them in the calendar

### Requirement 7

**User Story:** As a user, I want my task data to be persistently stored, so that my tasks are saved between sessions and I don't lose my work.

#### Acceptance Criteria

1. WHEN a user creates, updates, or deletes a task THEN the system SHALL immediately save the changes to the database
2. WHEN a user logs out and logs back in THEN the system SHALL restore all their tasks exactly as they were
3. WHEN the application experiences an unexpected shutdown THEN the system SHALL preserve all previously saved task data
4. WHEN multiple users use the application THEN the system SHALL ensure each user only sees their own tasks
5. IF database operations fail THEN the system SHALL display appropriate error messages to the user

### Requirement 8

**User Story:** As a user, I want to access my archived tasks, so that I can review what I've accomplished and reference past work.

#### Acceptance Criteria

1. WHEN a user deletes a task THEN the system SHALL move it to an archived state rather than permanently removing it
2. WHEN a user wants to view archived tasks THEN the system SHALL provide access to a separate archived tasks view
3. WHEN viewing archived tasks THEN the system SHALL display them with timestamps of when they were archived
4. WHEN a user wants to restore an archived task THEN the system SHALL allow them to move it back to active status
5. WHEN viewing archived tasks THEN the system SHALL allow filtering by date range and original category
