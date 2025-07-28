import { Category, Task } from '@prisma/client';

export interface CategoryWithTaskCount extends Category {
  _count: {
    tasks: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  color?: string;
}

export interface DeleteCategoryRequest {
  deleteAssociatedTasks?: boolean;
}

export interface CategoryTasksQuery {
  status?: string;
  limit?: string;
  offset?: string;
}

export interface CategoryResponse {
  category: CategoryWithTaskCount;
}

export interface CategoriesResponse {
  categories: CategoryWithTaskCount[];
}

export interface CategoryTasksResponse {
  category: Category;
  tasks: Task[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface DeleteCategoryResponse {
  message: string;
  tasksAffected: number;
  tasksArchived: boolean;
}
