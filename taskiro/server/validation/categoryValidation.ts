import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { DATABASE_CONSTRAINTS, isValidColor } from '../utils/validation';

export const categoryIdValidation = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Category ID must be a valid string'),
  validateRequest,
];

export const createCategoryValidation = [
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

export const updateCategoryValidation = [
  ...categoryIdValidation,
  ...createCategoryValidation,
];

export const deleteCategoryValidation = [
  ...categoryIdValidation,
  body('deleteAssociatedTasks')
    .optional()
    .isBoolean()
    .withMessage('deleteAssociatedTasks must be a boolean'),
  validateRequest,
];

export const categoryTasksValidation = [
  ...categoryIdValidation,
  query('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),

  validateRequest,
];
