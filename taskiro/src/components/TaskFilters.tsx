import React, { useCallback } from 'react';
import type { Category, Priority, TaskStatus } from '../types/task';
import type { FilterState } from './TaskList';

interface TaskFiltersProps {
  filters: FilterState;
  categories: Category[];
  onChange: (filters: Partial<FilterState>) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  categories,
  onChange,
}) => {
  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ category: e.target.value });
    },
    [onChange]
  );

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ priority: e.target.value as Priority | '' });
    },
    [onChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ status: e.target.value as TaskStatus | '' });
    },
    [onChange]
  );

  const handleSortByChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ sortBy: e.target.value as FilterState['sortBy'] });
    },
    [onChange]
  );

  const handleSortOrderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ sortOrder: e.target.value as 'asc' | 'desc' });
    },
    [onChange]
  );

  const handleClearFilters = useCallback(() => {
    onChange({
      category: '',
      priority: '',
      status: '',
      sortBy: 'dueDate',
      sortOrder: 'asc',
    });
  }, [onChange]);

  const hasActiveFilters =
    filters.category || filters.priority || filters.status;

  return (
    <div className="bg-gray-50 dark:bg-gray-700-50 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="category-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category:
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={handleCategoryChange}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All categories</option>
            <option value="uncategorized">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="priority-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Priority:
          </label>
          <select
            id="priority-filter"
            value={filters.priority}
            onChange={handlePriorityChange}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Status:
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={handleStatusChange}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All tasks</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="sort-by"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Sort by:
          </label>
          <select
            id="sort-by"
            value={filters.sortBy}
            onChange={handleSortByChange}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="createdAt">Created Date</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="sort-order"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Order:
          </label>
          <select
            id="sort-order"
            value={filters.sortOrder}
            onChange={handleSortOrderChange}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium focus:outline-none focus:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Active filters:
          </span>

          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              Category:{' '}
              {filters.category === 'uncategorized'
                ? 'Uncategorized'
                : categories.find((c) => c.id === filters.category)?.name ||
                  'Unknown'}
              <button
                onClick={() => onChange({ category: '' })}
                className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                ×
              </button>
            </span>
          )}

          {filters.priority && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              Priority:{' '}
              {filters.priority.charAt(0).toUpperCase() +
                filters.priority.slice(1)}
              <button
                onClick={() => onChange({ priority: '' })}
                className="ml-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
              >
                ×
              </button>
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
              Status:{' '}
              {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
              <button
                onClick={() => onChange({ status: '' })}
                className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Quick Filter Buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Quick filters:
        </span>

        <button
          onClick={() => onChange({ status: 'active', priority: 'high' })}
          className="px-3 py-1 text-xs font-medium rounded-full border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          High Priority Active
        </button>

        <button
          onClick={() =>
            onChange({ status: 'active', sortBy: 'dueDate', sortOrder: 'asc' })
          }
          className="px-3 py-1 text-xs font-medium rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          Due Soon
        </button>

        <button
          onClick={() =>
            onChange({
              status: 'completed',
              sortBy: 'createdAt',
              sortOrder: 'desc',
            })
          }
          className="px-3 py-1 text-xs font-medium rounded-full border border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/20 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        >
          Recently Completed
        </button>
      </div>
    </div>
  );
};

export default TaskFilters;
