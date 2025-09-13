import express, { Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { Priority, Status } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../utils/database';
import {
  isValidPriority,
  isValidStatus,
  sanitizeTaskTitle,
  sanitizeTaskDescription,
  DATABASE_CONSTRAINTS,
} from '../utils/validation';

const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// Validation middleware for task creation/update
const taskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: DATABASE_CONSTRAINTS.TASK.TITLE_MAX_LENGTH })
    .withMessage(
      `Title must be between 1 and ${DATABASE_CONSTRAINTS.TASK.TITLE_MAX_LENGTH} characters`
    ),

  body('description')
    .optional()
    .trim()
    .isLength({ max: DATABASE_CONSTRAINTS.TASK.DESCRIPTION_MAX_LENGTH })
    .withMessage(
      `Description must be less than ${DATABASE_CONSTRAINTS.TASK.DESCRIPTION_MAX_LENGTH} characters`
    ),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  body('dueTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Due time must be in HH:MM format'),

  body('priority')
    .optional()
    .custom((value) => {
      if (value && !isValidPriority(value)) {
        throw new Error('Priority must be low, medium, or high');
      }
      return true;
    }),

  body('categoryId')
    .optional()
    .isString()
    .withMessage('Category ID must be a string'),

  validateRequest,
];

// GET /api/tasks - Get all active tasks for the authenticated user
router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        status,
        category,
        priority,
        search,
        limit = '50',
        offset = '0',
      } = req.query;

      interface TaskWhereClause {
        userId: string;
        status?: Status;
        categoryId?: string;
        priority?: Priority;
        OR?: Array<{
          title?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
        }>;
      }

      const where: TaskWhereClause = {
        userId: req.user!.id,
      };

      // Filter by status (default to active tasks)
      if (status && isValidStatus(status as string)) {
        where.status = (status as string).toUpperCase() as Status;
      } else {
        where.status = Status.ACTIVE;
      }

      // Filter by category
      if (category && typeof category === 'string') {
        where.categoryId = category;
      }

      // Filter by priority
      if (priority && isValidPriority(priority as string)) {
        where.priority = (priority as string).toUpperCase() as Priority;
      }

      // Search in title and description
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: [
          { dueDate: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: Math.min(parseInt(limit as string), 100), // Max 100 tasks per request
        skip: parseInt(offset as string),
      });

      // Format tasks for response to ensure consistent date format
      const formattedTasks = tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
      }));

      const totalCount = await prisma.task.count({ where });

      res.json({
        tasks: formattedTasks,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: totalCount > parseInt(offset as string) + tasks.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tasks - Create a new task
router.post(
  '/',
  taskValidation,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description, dueDate, dueTime, priority, categoryId } =
        req.body;

      // Validate category belongs to user if provided
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            userId: req.user!.id,
          },
        });

        if (!category) {
          throw createError(
            'Category not found or does not belong to user',
            404,
            'CATEGORY_NOT_FOUND'
          );
        }
      }

      // Helper function to parse date without timezone conversion
      const parseDateSafely = (dateString: string): Date => {
        // For YYYY-MM-DD format, create date at midnight UTC to avoid timezone shifts
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(dateString + 'T00:00:00.000Z');
        }
        // For other formats, use regular Date constructor
        return new Date(dateString);
      };

      // Create the task
      const task = await prisma.task.create({
        data: {
          userId: req.user!.id,
          title: sanitizeTaskTitle(title),
          description: description
            ? sanitizeTaskDescription(description)
            : null,
          dueDate: dueDate ? parseDateSafely(dueDate) : null,
          dueTime: dueTime ? new Date(`1970-01-01T${dueTime}:00.000Z`) : null,
          priority: priority
            ? (priority.toUpperCase() as Priority)
            : Priority.MEDIUM,
          categoryId: categoryId || null,
        },
        include: {
          category: true,
        },
      });

      // Format the task for response to ensure consistent date format
      const formattedTask = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
      };

      res.status(201).json({
        message: 'Task created successfully',
        task: formattedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tasks/:id - Get a specific task
router.get(
  '/:id',
  param('id').isString().withMessage('Task ID must be a string'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const task = await prisma.task.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
        include: {
          category: true,
        },
      });

      if (!task) {
        throw createError('Task not found', 404, 'TASK_NOT_FOUND');
      }

      // Format the task for response to ensure consistent date format
      const formattedTask = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
      };

      res.json({ task: formattedTask });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tasks/:id - Update a task
router.put(
  '/:id',
  param('id').isString().withMessage('Task ID must be a string'),
  taskValidation,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        dueDate,
        dueTime,
        priority,
        categoryId,
        status,
      } = req.body;

      // Check if task exists and belongs to user
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!existingTask) {
        throw createError('Task not found', 404, 'TASK_NOT_FOUND');
      }

      // Validate category belongs to user if provided
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            userId: req.user!.id,
          },
        });

        if (!category) {
          throw createError(
            'Category not found or does not belong to user',
            404,
            'CATEGORY_NOT_FOUND'
          );
        }
      }

      // Helper function to parse date without timezone conversion
      const parseDateSafely = (dateString: string): Date => {
        // For YYYY-MM-DD format, create date at midnight UTC to avoid timezone shifts
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(dateString + 'T00:00:00.000Z');
        }
        // For other formats, use regular Date constructor
        return new Date(dateString);
      };

      // Prepare update data
      interface TaskUpdateData {
        title: string;
        description: string | null;
        dueDate: Date | null;
        dueTime: Date | null;
        priority: Priority;
        categoryId: string | null;
        status?: Status;
        completedAt?: Date | null;
        archivedAt?: Date | null;
      }

      const updateData: TaskUpdateData = {
        title: sanitizeTaskTitle(title),
        description: description ? sanitizeTaskDescription(description) : null,
        dueDate: dueDate ? parseDateSafely(dueDate) : null,
        dueTime: dueTime ? new Date(`1970-01-01T${dueTime}:00.000Z`) : null,
        priority: priority
          ? (priority.toUpperCase() as Priority)
          : Priority.MEDIUM,
        categoryId: categoryId || null,
      };

      // Handle status changes
      if (status && isValidStatus(status)) {
        const newStatus = status.toUpperCase() as Status;
        updateData.status = newStatus;

        // Set completion timestamp when marking as completed
        if (
          newStatus === Status.COMPLETED &&
          existingTask.status !== Status.COMPLETED
        ) {
          updateData.completedAt = new Date();
        }

        // Clear completion timestamp when unmarking as completed
        if (
          newStatus !== Status.COMPLETED &&
          existingTask.status === Status.COMPLETED
        ) {
          updateData.completedAt = null;
        }

        // Set archived timestamp when archiving
        if (
          newStatus === Status.ARCHIVED &&
          existingTask.status !== Status.ARCHIVED
        ) {
          updateData.archivedAt = new Date();
        }
      }

      // Update the task
      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      // Format the task for response to ensure consistent date format
      const formattedTask = {
        ...updatedTask,
        dueDate: updatedTask.dueDate
          ? updatedTask.dueDate.toISOString().split('T')[0]
          : null,
      };

      res.json({
        message: 'Task updated successfully',
        task: formattedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/tasks/:id - Archive a task (soft delete)
router.delete(
  '/:id',
  param('id').isString().withMessage('Task ID must be a string'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if task exists and belongs to user
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!existingTask) {
        throw createError('Task not found', 404, 'TASK_NOT_FOUND');
      }

      // Archive the task (soft delete)
      const archivedTask = await prisma.task.update({
        where: { id },
        data: {
          status: Status.ARCHIVED,
          archivedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      // Format the task for response to ensure consistent date format
      const formattedTask = {
        ...archivedTask,
        dueDate: archivedTask.dueDate
          ? archivedTask.dueDate.toISOString().split('T')[0]
          : null,
      };

      res.json({
        message: 'Task archived successfully',
        task: formattedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tasks/archived - Get archived tasks
router.get(
  '/archived',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = '50', offset = '0', category, search } = req.query;

      interface ArchivedTaskWhereClause {
        userId: string;
        status: Status;
        categoryId?: string;
        OR?: Array<{
          title?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
        }>;
      }

      const where: ArchivedTaskWhereClause = {
        userId: req.user!.id,
        status: Status.ARCHIVED,
      };

      // Filter by category
      if (category && typeof category === 'string') {
        where.categoryId = category;
      }

      // Search in title and description
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: [{ archivedAt: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(parseInt(limit as string), 100),
        skip: parseInt(offset as string),
      });

      // Format tasks for response to ensure consistent date format
      const formattedTasks = tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
      }));

      const totalCount = await prisma.task.count({ where });

      res.json({
        tasks: formattedTasks,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: totalCount > parseInt(offset as string) + tasks.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tasks/:id/restore - Restore an archived task
router.post(
  '/:id/restore',
  param('id').isString().withMessage('Task ID must be a string'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if task exists, belongs to user, and is archived
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          userId: req.user!.id,
          status: Status.ARCHIVED,
        },
      });

      if (!existingTask) {
        throw createError(
          'Archived task not found',
          404,
          'ARCHIVED_TASK_NOT_FOUND'
        );
      }

      // Restore the task
      const restoredTask = await prisma.task.update({
        where: { id },
        data: {
          status: Status.ACTIVE,
          archivedAt: null,
        },
        include: {
          category: true,
        },
      });

      // Format the task for response to ensure consistent date format
      const formattedTask = {
        ...restoredTask,
        dueDate: restoredTask.dueDate
          ? restoredTask.dueDate.toISOString().split('T')[0]
          : null,
      };

      res.json({
        message: 'Task restored successfully',
        task: formattedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/tasks/:id/complete - Mark task as completed
router.post(
  '/:id/complete',
  param('id').isString().withMessage('Task ID must be a string'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if task exists and belongs to user
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          userId: req.user!.id,
          status: { not: Status.ARCHIVED },
        },
      });

      if (!existingTask) {
        throw createError(
          'Task not found or is archived',
          404,
          'TASK_NOT_FOUND'
        );
      }

      // Toggle completion status
      const newStatus =
        existingTask.status === Status.COMPLETED
          ? Status.ACTIVE
          : Status.COMPLETED;

      interface TaskCompletionUpdateData {
        status: Status;
        completedAt?: Date | null;
      }

      const updateData: TaskCompletionUpdateData = {
        status: newStatus,
      };

      if (newStatus === Status.COMPLETED) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      // Format the task for response to ensure consistent date format
      const formattedTask = {
        ...updatedTask,
        dueDate: updatedTask.dueDate
          ? updatedTask.dueDate.toISOString().split('T')[0]
          : null,
      };

      res.json({
        message: `Task ${newStatus === Status.COMPLETED ? 'completed' : 'uncompleted'} successfully`,
        task: formattedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
