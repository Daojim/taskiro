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

  // Get priority-based CSS classes
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'calendar-task--priority-high';
      case 'medium':
        return 'calendar-task--priority-medium';
      case 'low':
        return 'calendar-task--priority-low';
      default:
        return 'calendar-task--priority-normal';
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
  const priorityClass = getPriorityClass(task.priority);

  return (
    <>
      <div
        className={`calendar-task ${priorityClass} ${
          isCompleted ? 'calendar-task--completed' : ''
        } group`}
        onClick={handleTaskClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        title={`${task.title}${task.description ? ` - ${task.description}` : ''}`}
      >
        <div className="calendar-task__content">
          <div className="calendar-task__main">
            <div className="calendar-task__title">{task.title}</div>
            <div className="calendar-task__time">
              {task.dueTime ? formatTime(task.dueTime) : 'No time set'}
            </div>
          </div>

          {/* Action buttons (visible on hover) */}
          {isHovered && (
            <div className="calendar-task__actions">
              <button
                onClick={handleToggleCompletion}
                className={`calendar-task__action-button calendar-task__action-button--complete ${
                  isCompleted ? 'calendar-task__action-button--completed' : ''
                }`}
                title={
                  isCompleted ? '✓ Mark as incomplete' : '✓ Mark as complete'
                }
              >
                <CheckIcon className="calendar-task__action-icon" />
              </button>

              <button
                onClick={handleTaskClick}
                className="calendar-task__action-button calendar-task__action-button--edit"
                title="✏️ Edit task"
              >
                <PencilIcon className="calendar-task__action-icon" />
              </button>

              <button
                onClick={handleDelete}
                className="calendar-task__action-button calendar-task__action-button--delete"
                title="🗑️ Delete task"
              >
                <TrashIcon className="calendar-task__action-icon" />
              </button>
            </div>
          )}
        </div>

        {/* Category indicator */}
        {task.category && (
          <div className="calendar-task__category">
            <span
              className="calendar-task__category-dot"
              style={{ backgroundColor: task.category.color }}
              title={task.category.name}
            />
            <span className="calendar-task__category-name">
              {task.category.name}
            </span>
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
