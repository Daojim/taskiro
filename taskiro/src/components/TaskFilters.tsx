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
    <div className="task-filters">
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="category-filter" className="task-filter-label">
            Category:
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={handleCategoryChange}
            className="filter-select"
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
          <label htmlFor="priority-filter" className="task-filter-label">
            Priority:
          </label>
          <select
            id="priority-filter"
            value={filters.priority}
            onChange={handlePriorityChange}
            className="filter-select"
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="task-filter-label">
            Status:
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={handleStatusChange}
            className="filter-select"
          >
            <option value="">All tasks</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-by" className="task-filter-label">
            Sort by:
          </label>
          <select
            id="sort-by"
            value={filters.sortBy}
            onChange={handleSortByChange}
            className="filter-select"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-order" className="task-filter-label">
            Order:
          </label>
          <select
            id="sort-order"
            value={filters.sortOrder}
            onChange={handleSortOrderChange}
            className="filter-select"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button onClick={handleClearFilters} className="btn-ghost btn-sm">
            Clear filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Active filters:
          </span>

          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
              Category:{' '}
              {filters.category === 'uncategorized'
                ? 'Uncategorized'
                : categories.find((c) => c.id === filters.category)?.name ||
                  'Unknown'}
              <button
                onClick={() => onChange({ category: '' })}
                className="filter-tag-remove ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
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
                className="filter-tag-remove ml-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
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
                className="filter-tag-remove ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Quick Filter Buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Quick filters:
        </span>

        <button
          onClick={() => onChange({ status: 'active', priority: 'high' })}
          className="quick-filter quick-filter-high"
        >
          High Priority Active
        </button>

        <button
          onClick={() =>
            onChange({ status: 'active', sortBy: 'dueDate', sortOrder: 'asc' })
          }
          className="quick-filter quick-filter-due"
        >
          Due Soon
        </button>

        <button
          onClick={() =>
            onChange({
              status: 'completed',
              sortBy: 'dueDate',
              sortOrder: 'desc',
            })
          }
          className="quick-filter quick-filter-completed"
        >
          Recently Completed
        </button>
      </div>
    </div>
  );
};

export default TaskFilters;
