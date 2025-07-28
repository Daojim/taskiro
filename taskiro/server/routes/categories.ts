import express, { Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../utils/database';
import {
  isValidColor,
  sanitizeCategoryName,
  DATABASE_CONSTRAINTS,
} from '../utils/validation';

const router = express.Router();

// All category routes require authentication
router.use(authenticateToken);

// Validation middleware for category creation/update
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: DATABASE_CONSTRAINTS.CATEGORY.NAME_MAX_LENGTH })
    .withMessage(
      `Category name must be between 1 and ${DATABASE_CONSTRAINTS.CATEGORY.NAME_MAX_LENGTH} characters`
    ),

  body('color')
    .optional()
    .custom((value) => {
      if (value && !isValidColor(value)) {
        throw new Error('Color must be a valid hex color (e.g., #3B82F6)');
      }
      return true;
    }),

  validateRequest,
];

// GET /api/categories - Get all categories for the authenticated user
router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.category.findMany({
        where: {
          userId: req.user!.id,
        },
        include: {
          _count: {
            select: {
              tasks: {
                where: {
                  status: { not: 'ARCHIVED' },
                },
              },
            },
          },
        },
        orderBy: [
          { isDefault: 'desc' }, // Default categories first
          { createdAt: 'asc' },
        ],
      });

      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/categories - Create a new category
router.post(
  '/',
  categoryValidation,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, color } = req.body;

      // Check if category name already exists for this user
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId: req.user!.id,
          name: sanitizeCategoryName(name),
        },
      });

      if (existingCategory) {
        throw createError(
          'Category with this name already exists',
          409,
          'CATEGORY_EXISTS'
        );
      }

      // Create the category
      const category = await prisma.category.create({
        data: {
          userId: req.user!.id,
          name: sanitizeCategoryName(name),
          color: color || DATABASE_CONSTRAINTS.CATEGORY.COLOR_DEFAULT,
          isDefault: false,
        },
        include: {
          _count: {
            select: {
              tasks: {
                where: {
                  status: { not: 'ARCHIVED' },
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        message: 'Category created successfully',
        category,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/categories/:id - Get a specific category
router.get(
  '/:id',
  param('id').isString().withMessage('Category ID must be a string'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
        include: {
          _count: {
            select: {
              tasks: {
                where: {
                  status: { not: 'ARCHIVED' },
                },
              },
            },
          },
        },
      });

      if (!category) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/categories/:id - Update a category
router.put(
  '/:id',
  param('id').isString().withMessage('Category ID must be a string'),
  categoryValidation,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, color } = req.body;

      // Check if category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!existingCategory) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Check if new name conflicts with existing categories (excluding current one)
      if (name !== existingCategory.name) {
        const nameConflict = await prisma.category.findFirst({
          where: {
            userId: req.user!.id,
            name: sanitizeCategoryName(name),
            id: { not: id },
          },
        });

        if (nameConflict) {
          throw createError(
            'Category with this name already exists',
            409,
            'CATEGORY_EXISTS'
          );
        }
      }

      // Update the category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          name: sanitizeCategoryName(name),
          color: color || existingCategory.color,
        },
        include: {
          _count: {
            select: {
              tasks: {
                where: {
                  status: { not: 'ARCHIVED' },
                },
              },
            },
          },
        },
      });

      res.json({
        message: 'Category updated successfully',
        category: updatedCategory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/categories/:id - Delete a category
router.delete(
  '/:id',
  param('id').isString().withMessage('Category ID must be a string'),
  body('deleteAssociatedTasks')
    .optional()
    .isBoolean()
    .withMessage('deleteAssociatedTasks must be a boolean'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { deleteAssociatedTasks = false } = req.body;

      // Check if category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      if (!existingCategory) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Prevent deletion of default categories
      if (existingCategory.isDefault) {
        throw createError(
          'Cannot delete default categories',
          400,
          'CANNOT_DELETE_DEFAULT'
        );
      }

      // Handle associated tasks
      if (existingCategory._count.tasks > 0) {
        if (deleteAssociatedTasks) {
          // Archive all tasks in this category
          await prisma.task.updateMany({
            where: {
              categoryId: id,
              userId: req.user!.id,
            },
            data: {
              status: 'ARCHIVED',
              archivedAt: new Date(),
            },
          });
        } else {
          // Remove category from tasks (set to null)
          await prisma.task.updateMany({
            where: {
              categoryId: id,
              userId: req.user!.id,
            },
            data: {
              categoryId: null,
            },
          });
        }
      }

      // Delete the category
      await prisma.category.delete({
        where: { id },
      });

      res.json({
        message: 'Category deleted successfully',
        tasksAffected: existingCategory._count.tasks,
        tasksArchived: deleteAssociatedTasks,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/categories/:id/tasks - Get all tasks in a specific category
router.get(
  '/:id/tasks',
  param('id').isString().withMessage('Category ID must be a string'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, limit = '50', offset = '0' } = req.query;

      // Check if category exists and belongs to user
      const category = await prisma.category.findFirst({
        where: {
          id,
          userId: req.user!.id,
        },
      });

      if (!category) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      interface CategoryTasksWhereClause {
        categoryId: string;
        userId: string;
        status?: unknown;
      }

      const where: CategoryTasksWhereClause = {
        categoryId: id,
        userId: req.user!.id,
      };

      // Filter by status
      if (status && typeof status === 'string') {
        where.status = status.toUpperCase();
      } else {
        where.status = { not: 'ARCHIVED' };
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
        take: Math.min(parseInt(limit as string), 100),
        skip: parseInt(offset as string),
      });

      const totalCount = await prisma.task.count({ where });

      res.json({
        category,
        tasks,
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

export default router;
