import React, { useState, useCallback } from 'react';
import { CheckIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import TaskEditModal from './TaskEditModal';
import type { Task, Category } from '../types/task';

interface CalendarTaskProps {
  task: Task;
  categories: Category[];
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onError?: (error: string) => void;
}

const CalendarTask: React.FC<CalendarTaskProps> = ({
  task,
  categories,
  onUpdate,
  onDelete,
  onToggleCompletion,
  onError,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Format time for display (same as TaskItem)
  const formatTime = (timeString: string) => {
    if (timeString.includes('T')) {
      // Extract time from datetime string
      const time = timeString.split('T')[1].split(':');
      const hours = parseInt(time[0]);
      const minutes = time[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } else {
      // Handle HH:MM format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
  };

  // Get priority-based styling
  const getPriorityStyles = (priority: string, isCompleted: boolean) => {
    const baseStyles = 'border-l-2 pl-2 pr-1 py-1 text-xs rounded-r';

    if (isCompleted) {
      return `${baseStyles} bg-gray-100 border-gray-300 text-gray-500 line-through dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400`;
    }

    switch (priority) {
      case 'high':
        return `${baseStyles} bg-red-50 border-red-400 text-red-800 dark:bg-red-900/20 dark:border-red-500 dark:text-red-200`;
      case 'medium':
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-500 dark:text-yellow-200`;
      case 'low':
        return `${baseStyles} bg-green-50 border-green-400 text-green-800 dark:bg-green-900/20 dark:border-green-500 dark:text-green-200`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200`;
    }
  };

  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  }, []);

  const handleToggleCompletion = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleCompletion(task.id);
    },
    [task.id, onToggleCompletion]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this task?')) {
        onDelete(task.id);
      }
    },
    [task.id, onDelete]
  );

  const handleUpdate = useCallback(
    (updates: Partial<Task>) => {
      onUpdate(task.id, updates);
      setShowEditModal(false);
    },
    [task.id, onUpdate]
  );

  const isCompleted = task.status.toLowerCase() === 'completed';
  const taskStyles = getPriorityStyles(task.priority, isCompleted);

  return (
    <>
      <div
        className={`${taskStyles} cursor-pointer hover:shadow-sm transition-shadow relative group`}
        onClick={handleTaskClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={`${task.title}${task.description ? ` - ${task.description}` : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{task.title}</div>
            {task.dueTime && (
              <div className="text-xs opacity-75 mt-0.5">
                {formatTime(task.dueTime)}
              </div>
            )}
          </div>

          {/* Action buttons (visible on hover) */}
          {isHovered && (
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={handleToggleCompletion}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: isCompleted ? '#10b981' : '#6b7280',
                  cursor: 'pointer',
                }}
                title={
                  isCompleted ? '✓ Mark as incomplete' : '✓ Mark as complete'
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.1)';
                }}
              >
                <CheckIcon style={{ width: '12px', height: '12px' }} />
              </button>

              <button
                onClick={handleTaskClick}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
                title="✏️ Edit task"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.1)';
                }}
              >
                <PencilIcon style={{ width: '12px', height: '12px' }} />
              </button>

              <button
                onClick={handleDelete}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ef4444',
                  cursor: 'pointer',
                }}
                title="🗑️ Delete task"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.1)';
                }}
              >
                <TrashIcon style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
          )}
        </div>

        {/* Category indicator */}
        {task.category && (
          <div className="mt-1">
            <span
              className="inline-block w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: task.category.color }}
              title={task.category.name}
            />
            <span className="text-xs opacity-75">{task.category.name}</span>
          </div>
        )}
      </div>

      {/* Task edit modal */}
      {showEditModal && (
        <TaskEditModal
          task={task}
          categories={categories}
          onUpdateTask={handleUpdate}
          onClose={() => setShowEditModal(false)}
          onError={onError}
        />
      )}
    </>
  );
};

export default CalendarTask;
