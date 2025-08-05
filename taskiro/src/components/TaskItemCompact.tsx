import React, { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Task,
  Category,
  UpdateTaskRequest,
  Priority,
} from '../types/task';

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
  const [isProcessingTimeEnter, setIsProcessingTimeEnter] = useState(false);

  // Helper function to format time for input field
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
  const timeInputRef = useRef<HTMLInputElement>(null);

  const handleToggleCompletion = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggleCompletion(task.id);
    } finally {
      setIsToggling(false);
    }
  }, [task.id, onToggleCompletion, isToggling]);

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
      } else if (field === 'dueTime' && timeInputRef.current) {
        timeInputRef.current.focus();
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

        // Handle dueTime
        if (field === 'dueTime') {
          // Get the actual value from the DOM input if available
          const actualTimeValue =
            timeInputRef.current?.value || editValues.dueTime;
          console.log('Time save debug:', {
            actualTimeValue,
            editValues: editValues.dueTime,
          });

          if (actualTimeValue && actualTimeValue.trim() !== '') {
            updates.dueTime = actualTimeValue;
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

        // For time fields, force browser to complete formatting by triggering blur
        if (field === 'dueTime') {
          const timeInput = e.target as HTMLInputElement;
          setIsProcessingTimeEnter(true);

          console.log(
            'Enter pressed on time field, forcing blur to complete formatting'
          );

          // Force the browser to complete formatting by blurring and refocusing
          timeInput.blur();

          // Small delay to let the blur event complete, then check the value
          setTimeout(() => {
            console.log('After blur, checking time input:', {
              domValue: timeInput.value,
              validity: timeInput.validity.valid,
              validationMessage: timeInput.validationMessage,
            });

            if (timeInput.validity.valid && timeInput.value) {
              // Input is now valid, update state and save
              console.log(
                'Valid time found after blur, saving:',
                timeInput.value
              );
              setEditValues((prev) => ({ ...prev, dueTime: timeInput.value }));
              setTimeout(() => {
                handleSaveEdit(field);
                setIsProcessingTimeEnter(false);
              }, 0);
            } else {
              // Still invalid, show error
              console.log('Time input still invalid after blur');
              if (onError) {
                onError('Please enter a valid time (e.g., 09:00)');
              }
              setIsProcessingTimeEnter(false);
            }
          }, 10); // Very short delay just to let blur complete
        } else {
          handleSaveEdit(field);
        }
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit, onError]
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

  return (
    <div
      className={`relative p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 w-full max-w-[250px] min-h-[180px] flex flex-col justify-between ${
        task.status.toLowerCase() === 'completed'
          ? 'bg-gray-200 dark:bg-gray-600 opacity-75'
          : task.priority === 'high'
            ? 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500'
            : task.priority === 'medium'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500'
              : 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
      } ${isOverdue ? 'border-2 border-red-500 animate-pulse' : ''}`}
      style={{
        boxShadow: '0 4px 8px rgba(0,0,0,0.1), 0 6px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Card Header - Title with Checkbox */}
      <div className="flex items-center space-x-2 mb-3">
        <input
          type="checkbox"
          checked={task.status.toLowerCase() === 'completed'}
          disabled={isToggling}
          onChange={handleToggleCompletion}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 flex-shrink-0"
        />
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
              className="w-full text-sm font-medium bg-transparent border-none outline-none"
            />
          ) : (
            <h3
              onClick={() => handleStartEdit('title')}
              className={`text-sm font-medium cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors ${
                task.status.toLowerCase() === 'completed'
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>
          )}
        </div>
      </div>

      {/* Card Body - Description */}
      <div className="flex-1 mb-3">
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
                className="w-full text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 resize-none"
                placeholder="Add description..."
              />
            ) : (
              <p
                onClick={() => handleStartEdit('description')}
                className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors line-clamp-2"
              >
                {task.description || 'Add description...'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Card Meta - Date, Time, Priority, Category */}
      <div className="space-y-2 mb-3">
        {/* Due Date and Time */}
        <div className="flex flex-wrap items-center gap-1">
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
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleStartEdit('dueDate')}
                className={`badge cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale ${
                  isOverdue ? 'badge-error font-medium' : 'badge-gray'
                }`}
              >
                {task.dueDate ? formatDate(task.dueDate) : 'Set due date'}
              </span>
            )}
          </div>

          {/* Due Time */}
          <div className="flex items-center space-x-1">
            {editingField === 'dueTime' ? (
              <div className="flex items-center gap-1">
                <input
                  ref={timeInputRef}
                  type="time"
                  value={editValues.dueTime}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      dueTime: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (!isProcessingTimeEnter) {
                      handleSaveEdit('dueTime');
                    }
                  }}
                  onKeyDown={(e) => handleKeyPress(e, 'dueTime')}
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleRemoveTime}
                  className="text-gray-400 hover:text-red-500 text-xs opacity-60 hover:opacity-100 transition-all duration-200"
                  title="Remove time"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="relative inline-block">
                {task.dueTime ? (
                  <div className="badge badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale flex items-center gap-1">
                    <span onClick={() => handleStartEdit('dueTime')}>
                      {formatTime(task.dueTime)}
                    </span>
                    <button
                      onClick={handleRemoveTime}
                      className="text-gray-400 hover:text-red-500 text-xs opacity-60 hover:opacity-100 transition-all duration-200 ml-1"
                      title="Remove time"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={() => handleStartEdit('dueTime')}
                    className="badge badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale"
                  >
                    Set time
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Priority and Category */}
        <div className="flex flex-wrap items-center gap-1">
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
                className={`badge cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale ${
                  task.priority === 'high'
                    ? 'badge-error'
                    : task.priority === 'medium'
                      ? 'badge-warning'
                      : 'badge-success'
                }`}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
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
                className="badge badge-primary cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale"
              >
                {task.category.name}
              </span>
            ) : (
              <span
                onClick={() => handleStartEdit('categoryId')}
                className="badge badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale"
              >
                Set category
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer - Delete Button */}
      <div className="flex justify-end">
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white/50 rounded-full transition-all duration-200 hover:scale-110"
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
  );
};

export default TaskItemCompact;
