import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { FixedSizeList as List } from 'react-window';
import { useTasks } from '../hooks/useTasks';
import { useTheme } from '../hooks/useTheme';
import { useMobileGestures } from '../hooks/useMobileGestures';
import TaskItem from './TaskItem';
import TaskFilters from './TaskFilters';
import TaskSearch from './TaskSearch';
import PullToRefresh from './PullToRefresh';
import type { Task, Priority, TaskStatus } from '../types/task';

interface TaskListProps {
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

const ITEM_HEIGHT = 120; // Height of each task item in pixels
const LIST_HEIGHT = 600; // Height of the virtualized list

const TaskList: React.FC<TaskListProps> = ({
  onTaskUpdated,
  onTaskDeleted,
  onError,
  onRefresh,
}) => {
  const {
    tasks,
    categories,
    isLoading,
    error,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    restoreTask,
    refreshTasks,
  } = useTasks();
  const { theme } = useTheme();
  const listRef = useRef<List>(null);
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
    pullRefreshGesture,
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

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
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

  // Handle task restoration
  const handleTaskRestore = useCallback(
    async (taskId: string) => {
      try {
        const restoredTask = await restoreTask(taskId);
        if (restoredTask && onTaskUpdated) {
          onTaskUpdated(restoredTask);
        }
      } catch {
        if (onError) {
          onError('Failed to restore task');
        }
      }
    },
    [restoreTask, onTaskUpdated, onError]
  );

  // Render individual task item for virtualized list
  const renderTaskItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const task = filteredAndSortedTasks[index];

      return (
        <div style={style}>
          <TaskItem
            task={task}
            categories={categories}
            onToggleCompletion={handleToggleCompletion}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
            onRestore={handleTaskRestore}
            onError={onError}
          />
        </div>
      );
    },
    [
      filteredAndSortedTasks,
      categories,
      handleToggleCompletion,
      handleTaskUpdate,
      handleTaskDelete,
      handleTaskRestore,
      onError,
    ]
  );

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
      {...pullRefreshGesture()}
      className="card relative overflow-hidden pull-refresh-container task-list-mobile sm:task-list-tablet animate-fade-in"
      style={{ touchAction: 'pan-x pan-down' }}
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
          <div className="card border-0 shadow-none overflow-hidden animate-fade-in">
            <List
              ref={listRef}
              height={Math.min(
                LIST_HEIGHT,
                filteredAndSortedTasks.length * ITEM_HEIGHT
              )}
              width="100%"
              itemCount={filteredAndSortedTasks.length}
              itemSize={ITEM_HEIGHT}
              className={theme === 'dark' ? 'dark' : ''}
            >
              {renderTaskItem}
            </List>
          </div>
        )}
      </div>
    </AnimatedPullDiv>
  );
};

export default TaskList;
