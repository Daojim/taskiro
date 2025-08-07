import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';

import { useTaskContext } from '../contexts/TaskContext';
import { useMobileGestures } from '../hooks/useMobileGestures';
import TaskItemCompact from './TaskItemCompact';
import TaskFilters from './TaskFilters';
import TaskSearch from './TaskSearch';
import PullToRefresh from './PullToRefresh';
import type { Task, Category, Priority, TaskStatus } from '../types/task';

interface TaskListProps {
  tasks?: Task[];
  categories?: Category[];
  isLoading?: boolean;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  onError?: (error: string) => void;
  onRefresh?: () => Promise<void>;
}

export interface FilterState {
  search: string;
  category: string;
  priority: Priority | '';
  status: TaskStatus | '';
  sortBy: 'dueDate' | 'priority' | 'title' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

// Removed virtualization - tasks now render naturally

const TaskList: React.FC<TaskListProps> = ({
  tasks = [],
  categories = [],
  isLoading = false,
  onTaskUpdated,
  onTaskDeleted,
  onError,
  onRefresh,
}) => {
  const {
    updateTask,
    deleteTask,
    toggleTaskCompletion,

    refreshTasks,
    error,
  } = useTaskContext();
  // Theme is available if needed for future enhancements
  // const { theme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter and search state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    priority: '',
    status: '',
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  // Pull-to-refresh gesture support
  const {
    pullStyle,
    gestureState: pullGestureState,
    AnimatedDiv: AnimatedPullDiv,
  } = useMobileGestures({
    onPullRefresh: async () => {
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          await refreshTasks();
        }
      } catch {
        if (onError) {
          onError('Failed to refresh tasks');
        }
      }
    },
    pullRefreshThreshold: 80,
  });

  // Handle errors from useTasks hook
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Filter and sort tasks based on current filters
  const filteredAndSortedTasks = useMemo(() => {
    // Debug: Filtering tasks

    const filtered = tasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription =
          task.description?.toLowerCase().includes(searchLower) || false;
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Category filter
      if (filters.category) {
        if (filters.category === 'uncategorized') {
          if (task.categoryId) return false;
        } else {
          if (task.categoryId !== filters.category) return false;
        }
      }

      // Priority filter - add debugging and ensure case-insensitive comparison
      if (filters.priority) {
        const taskPriority = task.priority?.toLowerCase();
        const filterPriority = filters.priority.toLowerCase();
        // Debug: Priority filter check
        if (taskPriority !== filterPriority) {
          return false;
        }
      }

      // Status filter - ensure case-insensitive comparison
      if (filters.status) {
        const taskStatus = task.status?.toLowerCase();
        const filterStatus = filters.status.toLowerCase();
        // Debug: Status filter check
        if (taskStatus !== filterStatus) {
          return false;
        }
      }

      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      // When showing all tasks (no status filter), prioritize active tasks over completed ones
      if (!filters.status) {
        const aStatus = a.status.toLowerCase();
        const bStatus = b.status.toLowerCase();

        // Active tasks come before completed tasks
        if (aStatus === 'active' && bStatus === 'completed') {
          return -1;
        }
        if (aStatus === 'completed' && bStatus === 'active') {
          return 1;
        }
        // If both have the same status, continue with regular sorting
      }

      let comparison = 0;

      switch (filters.sortBy) {
        case 'dueDate': {
          const aDate = a.dueDate
            ? new Date(a.dueDate)
            : new Date('9999-12-31');
          const bDate = b.dueDate
            ? new Date(b.dueDate)
            : new Date('9999-12-31');
          comparison = aDate.getTime() - bDate.getTime();
          break;
        }
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Debug: Filtered and sorted results

    return filtered;
  }, [tasks, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Handle task completion toggle
  const handleToggleCompletion = useCallback(
    async (taskId: string) => {
      try {
        const updatedTask = await toggleTaskCompletion(taskId);
        if (updatedTask && onTaskUpdated) {
          onTaskUpdated(updatedTask);
        }
      } catch {
        if (onError) {
          onError('Failed to update task completion status');
        }
      }
    },
    [toggleTaskCompletion, onTaskUpdated, onError]
  );

  // Handle task update
  const handleTaskUpdate = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        const updatedTask = await updateTask(taskId, updates);
        if (updatedTask && onTaskUpdated) {
          onTaskUpdated(updatedTask);
        }
      } catch {
        if (onError) {
          onError('Failed to update task');
        }
      }
    },
    [updateTask, onTaskUpdated, onError]
  );

  // Handle task deletion (archiving)
  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      try {
        const success = await deleteTask(taskId);
        if (success && onTaskDeleted) {
          onTaskDeleted(taskId);
        }
      } catch {
        if (onError) {
          onError('Failed to delete task');
        }
      }
    },
    [deleteTask, onTaskDeleted, onError]
  );

  // Removed renderTaskItem - now rendering tasks directly

  if (isLoading) {
    return (
      <div className="card animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="spinner-lg"></div>
          <span className="ml-3 text-body">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <AnimatedPullDiv
      ref={containerRef}
      className="card relative overflow-hidden pull-refresh-container task-list-mobile sm:task-list-tablet animate-fade-in"
      style={{ touchAction: 'auto' }}
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefresh
        pullY={pullStyle.pullY.get()}
        isPulling={pullGestureState.isPulling}
        threshold={80}
      />

      <div className="p-6 safe-area-inset-left safe-area-inset-right">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading-3">
            Tasks ({filteredAndSortedTasks.length})
          </h3>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <TaskSearch
            value={filters.search}
            onChange={(search: string) => handleFilterChange({ search })}
            placeholder="Search tasks by title or description..."
          />

          <TaskFilters
            filters={filters}
            categories={categories}
            onChange={handleFilterChange}
          />
        </div>

        {/* Task List */}
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-heading-4 mb-2">
              {filters.search ||
              filters.category ||
              filters.priority ||
              filters.status
                ? 'No tasks match your filters'
                : 'No tasks yet'}
            </h3>
            <p className="text-body">
              {filters.search ||
              filters.category ||
              filters.priority ||
              filters.status
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first task using the input above!'}
            </p>
          </div>
        ) : (
          <div className="animate-fade-in task-grid">
            {filteredAndSortedTasks.map((task) => (
              <TaskItemCompact
                key={task.id}
                task={task}
                categories={categories}
                onToggleCompletion={handleToggleCompletion}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
                onError={onError}
              />
            ))}
          </div>
        )}
      </div>
    </AnimatedPullDiv>
  );
};

export default TaskList;
