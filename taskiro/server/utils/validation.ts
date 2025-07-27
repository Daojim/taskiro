import { Priority, Status } from '@prisma/client';

// Validation utilities for database operations

export function isValidPriority(priority: string): priority is Priority {
  const upperPriority = priority.toUpperCase() as Priority;
  return Object.values(Priority).includes(upperPriority);
}

export function isValidStatus(status: string): status is Status {
  const upperStatus = status.toUpperCase() as Status;
  return Object.values(Status).includes(upperStatus);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidColor(color: string): boolean {
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorRegex.test(color);
}

export function sanitizeTaskTitle(title: string): string {
  return title.trim().substring(0, 500);
}

export function sanitizeTaskDescription(description: string): string {
  return description.trim().substring(0, 2000);
}

export function sanitizeCategoryName(name: string): string {
  return name.trim().substring(0, 100);
}

// Database constraint validation
export const DATABASE_CONSTRAINTS = {
  USER: {
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_MIN_LENGTH: 8,
  },
  CATEGORY: {
    NAME_MAX_LENGTH: 100,
    COLOR_DEFAULT: '#3B82F6',
  },
  TASK: {
    TITLE_MAX_LENGTH: 500,
    DESCRIPTION_MAX_LENGTH: 2000,
    PRIORITY_DEFAULT: Priority.MEDIUM,
    STATUS_DEFAULT: Status.ACTIVE,
  },
} as const;

// Type guards for Prisma enums
export function isPriorityEnum(value: unknown): value is Priority {
  return (
    typeof value === 'string' &&
    Object.values(Priority).includes(value as Priority)
  );
}

export function isStatusEnum(value: unknown): value is Status {
  return (
    typeof value === 'string' && Object.values(Status).includes(value as Status)
  );
}
