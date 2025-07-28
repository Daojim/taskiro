import { Status } from '@prisma/client';
import { prisma } from '../utils/database';
import { createError } from '../middleware/errorHandler';
import {
  sanitizeCategoryName,
  DATABASE_CONSTRAINTS,
} from '../utils/validation';

export interface CreateCategoryData {
  name: string;
  color?: string;
  userId: string;
}

export interface UpdateCategoryData {
  name: string;
  color?: string;
}

export interface DeleteCategoryOptions {
  deleteAssociatedTasks?: boolean;
}

export class CategoryService {
  private static readonly CATEGORY_WITH_TASK_COUNT = {
    include: {
      _count: {
        select: {
          tasks: {
            where: {
              status: { not: Status.ARCHIVED },
            },
          },
        },
      },
    },
  } as const;

  static async findAllByUser(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      ...this.CATEGORY_WITH_TASK_COUNT,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  static async findByIdAndUser(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      ...this.CATEGORY_WITH_TASK_COUNT,
    });

    if (!category) {
      throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  static async create(data: CreateCategoryData) {
    const { name, color, userId } = data;
    const sanitizedName = sanitizeCategoryName(name);

    // Check for existing category
    const existingCategory = await prisma.category.findFirst({
      where: { userId, name: sanitizedName },
    });

    if (existingCategory) {
      throw createError(
        'Category with this name already exists',
        409,
        'CATEGORY_EXISTS'
      );
    }

    return prisma.category.create({
      data: {
        userId,
        name: sanitizedName,
        color: color || DATABASE_CONSTRAINTS.CATEGORY.COLOR_DEFAULT,
        isDefault: false,
      },
      ...this.CATEGORY_WITH_TASK_COUNT,
    });
  }

  static async update(id: string, userId: string, data: UpdateCategoryData) {
    const { name, color } = data;
    const sanitizedName = sanitizeCategoryName(name);

    // Check if category exists
    const existingCategory = await this.findByIdAndUser(id, userId);

    // Check for name conflicts
    if (name !== existingCategory.name) {
      const nameConflict = await prisma.category.findFirst({
        where: {
          userId,
          name: sanitizedName,
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

    return prisma.category.update({
      where: { id },
      data: {
        name: sanitizedName,
        color: color || existingCategory.color,
      },
      ...this.CATEGORY_WITH_TASK_COUNT,
    });
  }

  static async delete(
    id: string,
    userId: string,
    options: DeleteCategoryOptions = {}
  ) {
    const { deleteAssociatedTasks = false } = options;

    // Check if category exists and get task count
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!existingCategory) {
      throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    if (existingCategory.isDefault) {
      throw createError(
        'Cannot delete default categories',
        400,
        'CANNOT_DELETE_DEFAULT'
      );
    }

    // Handle deletion in transaction
    await prisma.$transaction(async (tx) => {
      if (existingCategory._count.tasks > 0) {
        if (deleteAssociatedTasks) {
          await tx.task.updateMany({
            where: { categoryId: id, userId },
            data: {
              status: Status.ARCHIVED,
              archivedAt: new Date(),
            },
          });
        } else {
          await tx.task.updateMany({
            where: { categoryId: id, userId },
            data: { categoryId: null },
          });
        }
      }

      await tx.category.delete({ where: { id } });
    });

    return {
      tasksAffected: existingCategory._count.tasks,
      tasksArchived: deleteAssociatedTasks,
    };
  }

  static async findTasksInCategory(
    id: string,
    userId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { status, limit = 50, offset = 0 } = options;

    // Verify category exists
    await this.findByIdAndUser(id, userId);

    const where = {
      categoryId: id,
      userId,
      status: status
        ? (status.toUpperCase() as Status)
        : { not: Status.ARCHIVED },
    };

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { category: true },
        orderBy: [
          { dueDate: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: Math.min(limit, 100),
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + tasks.length,
      },
    };
  }
}
