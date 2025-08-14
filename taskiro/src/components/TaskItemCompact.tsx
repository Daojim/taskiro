import React, { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Task,
  Category,
  UpdateTaskRequest,
  Priority,
} from '../types/task';
import EnhancedTimeInput from './EnhancedTimeInput';
// parseTime is now handled by EnhancedTimeInput component

interface TaskItemCompactProps {
  task: Task;
  categories: Category[];
  onToggleCompletion: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, updates: UpdateTaskRequest) => void;
  onDelete: (taskId: string) => void;
  onError?: (error: string) => void;
}

const TaskItemCompact: React.FC<TaskItemCompactProps> = ({
  task,
  categories,
  onToggleCompletion,
  onUpdate,
  onDelete,
  onError,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const [completionAnimation, setCompletionAnimation] = useState<
    'completing' | 'uncompleting' | null
  >(null);
  const [showCompletionFeedback, setShowCompletionFeedback] = useState(false);

  // Helper function to format time for input field using enhanced parser
  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return '';
    if (timeString.includes('T')) {
      const timeMatch = timeString.match(/T(\d{2}:\d{2})/);
      return timeMatch ? timeMatch[1] : '';
    }
    return timeString;
  };

  // Initialize edit values
  const [editValues, setEditValues] = useState(() => {
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '';
      }
    };
    return {
      title: task.title,
      description: task.description || '',
      dueDate: formatDate(task.dueDate || ''),
      dueTime: formatTimeForInput(task.dueTime || ''),
      priority: task.priority,
      categoryId: task.categoryId || '',
    };
  });

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleCompletion = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);

    const wasCompleted = task.status.toLowerCase() === 'completed';
    const animationType = wasCompleted ? 'uncompleting' : 'completing';

    // Start visual feedback
    setCompletionAnimation(animationType);
    setShowCompletionFeedback(true);

    try {
      await onToggleCompletion(task.id);

      // Show success feedback briefly
      setTimeout(() => {
        setShowCompletionFeedback(false);
        setCompletionAnimation(null);
      }, 600);
    } catch (error) {
      // Reset animation on error
      setCompletionAnimation(null);
      setShowCompletionFeedback(false);
    } finally {
      setIsToggling(false);
    }
  }, [task.id, task.status, onToggleCompletion, isToggling]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [task.id, onDelete]);

  // Reset edit values when task changes
  useEffect(() => {
    if (editingField) return;

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '';
      }
    };
    setEditValues({
      title: task.title,
      description: task.description || '',
      dueDate: formatDate(task.dueDate || ''),
      dueTime: formatTimeForInput(task.dueTime || ''),
      priority: task.priority,
      categoryId: task.categoryId || '',
    });
  }, [editingField, task]);

  // Handle inline editing
  const handleStartEdit = useCallback((field: string) => {
    setEditingField(field);

    setTimeout(() => {
      if (field === 'title' && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      } else if (field === 'description' && descriptionInputRef.current) {
        descriptionInputRef.current.focus();
        descriptionInputRef.current.select();
        // Time input is now handled by EnhancedTimeInput component
      }
    }, 0);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '';
      }
    };
    setEditValues({
      title: task.title,
      description: task.description || '',
      dueDate: formatDate(task.dueDate || ''),
      dueTime: formatTimeForInput(task.dueTime || ''),
      priority: task.priority,
      categoryId: task.categoryId || '',
    });
  }, [task]);

  const handleSaveEditWithTime = useCallback(
    async (field: string, parsedTime: string) => {
      console.log(
        'handleSaveEditWithTime called with field:',
        field,
        'parsedTime:',
        parsedTime
      );
      try {
        const updates: UpdateTaskRequest = {
          title: editValues.title.trim(),
          description: editValues.description.trim() || undefined,
          priority: editValues.priority,
        };

        if (editValues.categoryId) {
          updates.categoryId = editValues.categoryId;
        }

        // Use the parsed time directly
        if (field === 'dueTime') {
          updates.dueTime = parsedTime;
        } else if (task.dueTime) {
          updates.dueTime = formatTimeForInput(task.dueTime);
        }

        // Handle dueDate
        if (editValues.dueDate) {
          const dateStr = editValues.dueDate + 'T00:00:00.000Z';
          const date = new Date(dateStr);
          updates.dueDate = date.toISOString();
        }

        await onUpdate(task.id, updates);
        setEditingField(null);
      } catch {
        if (onError) {
          onError('Failed to update task');
        }
      }
    },
    [task.id, task.dueTime, editValues, onUpdate, onError]
  );

  const handleSaveEdit = useCallback(
    async (field: string) => {
      console.log(
        'handleSaveEdit called with field:',
        field,
        'editValues.dueTime:',
        editValues.dueTime
      );
      try {
        const updates: UpdateTaskRequest = {
          title: editValues.title.trim(),
          description: editValues.description.trim() || undefined,
          priority: editValues.priority,
        };

        if (editValues.categoryId) {
          updates.categoryId = editValues.categoryId;
        }

        // Handle dueTime - EnhancedTimeInput already provides parsed time
        if (field === 'dueTime') {
          const timeValue = editValues.dueTime;
          console.log('Processing dueTime field, timeValue:', timeValue);
          if (timeValue && timeValue.trim() !== '') {
            // EnhancedTimeInput already provides the time in HH:MM format
            updates.dueTime = timeValue;
          } else {
            // Clear the time if empty
            updates.dueTime = undefined;
          }
        } else if (task.dueTime) {
          updates.dueTime = formatTimeForInput(task.dueTime);
        }

        // Handle dueDate
        if (editValues.dueDate) {
          const dateStr = editValues.dueDate + 'T00:00:00.000Z';
          const date = new Date(dateStr);
          updates.dueDate = date.toISOString();
        }

        // Validate title
        if (field === 'title' && updates.title === '') {
          if (onError) onError('Task title cannot be empty');
          return;
        }

        await onUpdate(task.id, updates);
        setEditingField(null);
      } catch {
        if (onError) {
          onError('Failed to update task');
        }
      }
    },
    [task.id, task.dueTime, editValues, onUpdate, onError]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, field: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit(field);
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleRemoveTime = useCallback(async () => {
    try {
      const updates: UpdateTaskRequest = {
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
      };

      if (task.categoryId) {
        updates.categoryId = task.categoryId;
      }

      if (task.dueDate) {
        updates.dueDate = task.dueDate;
      }

      await onUpdate(task.id, updates);
    } catch {
      if (onError) {
        onError('Failed to remove time');
      }
    }
  }, [task, onUpdate, onError]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateUTC = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    const todayUTC = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const tomorrowUTC = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    );

    if (dateUTC.getTime() === todayUTC.getTime()) {
      return 'Today';
    } else if (dateUTC.getTime() === tomorrowUTC.getTime()) {
      return 'Tomorrow';
    } else {
      return dateUTC.toLocaleDateString();
    }
  };

  const formatTime = (timeString: string) => {
    if (timeString.includes('T')) {
      const time = timeString.split('T')[1].split(':');
      const hours = parseInt(time[0]);
      const minutes = time[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } else {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status.toLowerCase() !== 'completed';

  // Determine if task is urgent (high priority and due today or overdue)
  const isUrgent =
    task.priority.toLowerCase() === 'high' &&
    (isOverdue ||
      (task.dueDate &&
        new Date(task.dueDate).toDateString() === new Date().toDateString()));

  // Generate CSS classes for priority-based visual system
  const getTaskCardClasses = () => {
    const baseClasses =
      'relative p-4 rounded-lg w-full min-h-[180px] flex flex-col justify-between';
    const priorityClass = `task-card--priority-${task.priority}`;
    const completedClass =
      task.status.toLowerCase() === 'completed' ? 'task-card--completed' : '';
    const overdueClass = isOverdue ? `task-card--overdue` : '';
    const urgentClass = isUrgent ? 'task-card--urgent' : '';
    const completingClass = completionAnimation
      ? `task-card--${completionAnimation}`
      : '';
    const feedbackClass = showCompletionFeedback
      ? 'task-card--completion-feedback completing'
      : 'task-card--completion-feedback';

    const finalClasses =
      `${baseClasses} ${priorityClass} ${completedClass} ${overdueClass} ${urgentClass} ${completingClass} ${feedbackClass}`.trim();

    // Debug logging
    console.log(
      'Task:',
      task.title,
      'Priority:',
      task.priority,
      'Status:',
      task.status,
      'Classes:',
      finalClasses
    );

    return finalClasses;
  };

  // Get inline styles for priority (fallback if CSS doesn't load)
  const getInlineStyles = () => {
    const isCompleted = task.status.toLowerCase() === 'completed';

    console.log(
      'DEBUG - Task:',
      task.title,
      'Priority:',
      task.priority,
      'Completed:',
      isCompleted
    );

    if (isCompleted) {
      const completedStyle = {
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        borderLeft: '4px solid #9ca3af',
        opacity: 0.7,
      };
      console.log('DEBUG - Applying completed style:', completedStyle);
      return completedStyle;
    }

    const priorityStyles = {
      high: {
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        borderLeft: '4px solid #ef4444',
        borderColor: '#fecaca',
        boxShadow:
          '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
      },
      medium: {
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        borderLeft: '4px solid #f59e0b',
        borderColor: '#fed7aa',
        boxShadow:
          '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
      },
      low: {
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        borderLeft: '4px solid #10b981',
        borderColor: '#bbf7d0',
        boxShadow:
          '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)',
      },
    };

    // Convert priority to lowercase for lookup since priorities come as UPPERCASE
    const priorityKey =
      task.priority.toLowerCase() as keyof typeof priorityStyles;
    const selectedStyle = priorityStyles[priorityKey] || {};
    console.log(
      'DEBUG - Applying priority style for',
      task.priority,
      'using key',
      priorityKey,
      ':',
      selectedStyle
    );
    return selectedStyle;
  };

  return (
    <div
      className={getTaskCardClasses()}
      style={{
        ...getInlineStyles(),
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: completionAnimation ? 'scale(0.98)' : 'scale(1)',
      }}
    >
      <div className="task-card__content">
        {/* Card Header - Title with Checkbox */}
        <div className="task-card__header">
          <div
            className="task-checkbox-wrapper"
            onClick={handleToggleCompletion}
          >
            <input
              type="checkbox"
              checked={task.status.toLowerCase() === 'completed'}
              disabled={isToggling}
              readOnly
              className={`task-checkbox ${
                isToggling ? 'task-checkbox-loading' : ''
              } ${
                task.status.toLowerCase() === 'completed'
                  ? 'task-checkbox-completed'
                  : ''
              } ${completionAnimation ? 'task-checkbox-completing' : ''}`}
            />
            {showCompletionFeedback && (
              <div
                className={`task-completion-success ${showCompletionFeedback ? 'show' : 'hide'}`}
              >
                ✓
              </div>
            )}
          </div>
          <div className="flex-1">
            {editingField === 'title' ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                onBlur={() => handleSaveEdit('title')}
                onKeyDown={(e) => handleKeyPress(e, 'title')}
                className="w-full task-input-title bg-transparent border-none outline-none"
              />
            ) : (
              <h3
                onClick={() => handleStartEdit('title')}
                className={`editable-field cursor-pointer hover:bg-white/20 rounded transition-colors ${
                  completionAnimation
                    ? 'task__title--completing completing'
                    : ''
                }`}
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  letterSpacing: '-0.025em',
                  marginBottom: '8px',
                  textDecoration:
                    task.status.toLowerCase() === 'completed'
                      ? 'line-through'
                      : 'none',
                  opacity: task.status.toLowerCase() === 'completed' ? 0.7 : 1,
                  color:
                    task.status.toLowerCase() === 'completed'
                      ? '#6b7280'
                      : task.priority === 'high'
                        ? '#7f1d1d'
                        : task.priority === 'medium'
                          ? '#92400e'
                          : '#064e3b',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {task.title}
              </h3>
            )}
          </div>
        </div>

        {/* Card Body - Description */}
        <div className="task-card__body">
          {(task.description || editingField === 'description') && (
            <div>
              {editingField === 'description' ? (
                <textarea
                  ref={descriptionInputRef}
                  value={editValues.description}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  onBlur={() => handleSaveEdit('description')}
                  onKeyDown={(e) => handleKeyPress(e, 'description')}
                  rows={2}
                  className="w-full task-input-description bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                  placeholder="Add description..."
                />
              ) : (
                <p
                  onClick={() => handleStartEdit('description')}
                  className={`editable-field cursor-pointer hover:bg-white/20 rounded transition-colors line-clamp-2 ${
                    task.status.toLowerCase() === 'completed'
                      ? 'task__description--completed'
                      : 'task__description'
                  }`}
                >
                  {task.description || 'Add description...'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card Meta - Date, Time, Priority, Category */}
        <div className="task-card__meta">
          <div className="task__metadata space-y-2">
            {/* Due Date and Time */}
            <div className="task__badge-group">
              {/* Due Date */}
              <div className="flex items-center space-x-1">
                {editingField === 'dueDate' ? (
                  <input
                    type="date"
                    value={editValues.dueDate}
                    onChange={(e) => {
                      setEditValues((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }));
                    }}
                    onBlur={() => handleSaveEdit('dueDate')}
                    onKeyDown={(e) => handleKeyPress(e, 'dueDate')}
                    className="task-input-meta px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => handleStartEdit('dueDate')}
                    className={`badge clickable cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale ${
                      isOverdue ? 'badge-error font-medium' : 'badge-gray'
                    } ${
                      task.status.toLowerCase() === 'completed'
                        ? 'task-badge-completed'
                        : ''
                    }`}
                  >
                    {task.dueDate ? formatDate(task.dueDate) : 'Set due date'}
                  </span>
                )}
              </div>

              {/* Due Time */}
              <div className="flex items-center space-x-1">
                {editingField === 'dueTime' ? (
                  <div className="flex items-center gap-1 min-w-[120px]">
                    <EnhancedTimeInput
                      value={editValues.dueTime}
                      onChange={(value) => {
                        console.log(
                          'EnhancedTimeInput onChange called with:',
                          value
                        );
                        setEditValues((prev) => ({
                          ...prev,
                          dueTime: value,
                        }));
                      }}
                      onSave={async (parsedTime) => {
                        console.log(
                          'EnhancedTimeInput onSave called with parsedTime:',
                          parsedTime
                        );
                        if (parsedTime) {
                          // Update the state with the parsed time and then save
                          setEditValues((prev) => ({
                            ...prev,
                            dueTime: parsedTime,
                          }));
                          // Use the parsed time directly for saving
                          await handleSaveEditWithTime('dueTime', parsedTime);
                        } else {
                          await handleSaveEdit('dueTime');
                        }
                      }}
                      onCancel={handleCancelEdit}
                      onError={onError}
                      autoFocus={true}
                      className="enhanced-time-input-inline"
                      placeholder="e.g., 9:00 AM"
                    />
                    <button
                      onClick={handleRemoveTime}
                      className="icon-button text-gray-400 hover:text-red-500 text-xs opacity-60 hover:opacity-100 transition-all duration-200 ml-1"
                      title="Remove time"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    {task.dueTime ? (
                      <div
                        className={`badge clickable badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale flex items-center gap-1 ${
                          task.status.toLowerCase() === 'completed'
                            ? 'task-badge-completed'
                            : ''
                        }`}
                      >
                        <span onClick={() => handleStartEdit('dueTime')}>
                          {formatTime(task.dueTime)}
                        </span>
                        <button
                          onClick={handleRemoveTime}
                          className="icon-button text-gray-400 hover:text-red-500 text-xs opacity-60 hover:opacity-100 transition-all duration-200 ml-1"
                          title="Remove time"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleStartEdit('dueTime')}
                        className={`badge clickable badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale ${
                          task.status.toLowerCase() === 'completed'
                            ? 'task-badge-completed'
                            : ''
                        }`}
                      >
                        Set time
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Priority and Category */}
            <div className="task__badge-group">
              {/* Priority */}
              <div className="flex items-center space-x-1">
                {editingField === 'priority' ? (
                  <select
                    value={editValues.priority.toLowerCase()}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        priority: e.target.value as Priority,
                      }))
                    }
                    onBlur={() => handleSaveEdit('priority')}
                    onKeyDown={(e) => handleKeyPress(e, 'priority')}
                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                    autoFocus
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <span
                    onClick={() => handleStartEdit('priority')}
                    className={`badge clickable cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale priority-indicator-${task.priority} ${
                      task.status.toLowerCase() === 'completed'
                        ? 'task-badge-completed'
                        : ''
                    }`}
                  >
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </span>
                )}
              </div>

              {/* Category */}
              <div className="flex items-center space-x-1">
                {editingField === 'categoryId' ? (
                  <select
                    value={editValues.categoryId}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                      }))
                    }
                    onBlur={() => handleSaveEdit('categoryId')}
                    onKeyDown={(e) => handleKeyPress(e, 'categoryId')}
                    className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                    autoFocus
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : task.category ? (
                  <span
                    onClick={() => handleStartEdit('categoryId')}
                    className={`badge clickable badge-primary cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale ${
                      task.status.toLowerCase() === 'completed'
                        ? 'task-badge-completed'
                        : ''
                    }`}
                  >
                    {task.category.name}
                  </span>
                ) : (
                  <span
                    onClick={() => handleStartEdit('categoryId')}
                    className={`badge clickable badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale ${
                      task.status.toLowerCase() === 'completed'
                        ? 'task-badge-completed'
                        : ''
                    }`}
                  >
                    Set category
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card Footer - Delete Button */}
          <div className="task-card__footer">
            <button
              onClick={handleDelete}
              className="button--task-delete hover:text-red-600"
              title="Delete task"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItemCompact;
