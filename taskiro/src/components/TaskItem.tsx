import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMobileGestures } from '../hooks/useMobileGestures';
import UndoToast from './UndoToast';
import type {
  Task,
  Category,
  Priority,
  UpdateTaskRequest,
} from '../types/task';

interface TaskItemProps {
  task: Task;
  categories: Category[];
  onToggleCompletion: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, updates: UpdateTaskRequest) => void;
  onDelete: (taskId: string) => void;
  onError?: (error: string) => void;
  onRestore?: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  categories,
  onToggleCompletion,
  onUpdate,
  onDelete,
  onError,
  onRestore,
}) => {
  // Helper function to format time for input field
  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return '';
    if (timeString.includes('T')) {
      // Extract HH:MM from ISO string like "1970-01-01T11:00:00.000Z"
      const timeMatch = timeString.match(/T(\d{2}:\d{2})/);
      return timeMatch ? timeMatch[1] : '';
    }
    // Already in HH:MM format
    return timeString;
  };

  const [editingField, setEditingField] = useState<string | null>(null);
  // Initialize edit values with stable function to prevent re-render loops
  const [editValues, setEditValues] = useState(() => {
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        // Use UTC to be consistent with how we save dates
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Mobile gesture support
  const { swipeStyle, gestureState, handleUndo, hideUndo, AnimatedDiv } =
    useMobileGestures({
      onSwipeDelete: () => {
        setDeletedTask(task);
        onDelete(task.id);
      },
      // Removed onTap - only checkbox and title should toggle completion
      swipeThreshold: 100,
    });

  // Reset edit values when task changes
  useEffect(() => {
    // Don't reset edit values while actively editing to prevent infinite loops
    if (editingField) return;

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        // Use UTC to be consistent with how we save dates
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
  }, [
    editingField,
    task.categoryId,
    task.description,
    task.dueDate,
    task.dueTime,
    task.id,
    task.priority,
    task.title,
  ]);

  // Handle inline editing
  const handleStartEdit = useCallback((field: string) => {
    setEditingField(field);

    // Focus the input after state update
    setTimeout(() => {
      if (field === 'title' && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      } else if (field === 'description' && descriptionInputRef.current) {
        descriptionInputRef.current.focus();
        descriptionInputRef.current.select();
      } else if (field === 'dueTime' && timeInputRef.current) {
        timeInputRef.current.focus();
        // For time inputs, select the hour portion (first 2 characters)
        // This allows users to immediately start typing to replace the hour
        try {
          // Only try to set selection if the input has a value and is ready
          if (
            timeInputRef.current.value &&
            timeInputRef.current.value.length >= 2
          ) {
            timeInputRef.current.setSelectionRange(0, 2);
          }
        } catch (error) {
          // Silently handle the error - focus is still working
          console.log('Could not set selection range on time input:', error);
        }
      }
    }, 0);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    // Reset to original values with proper date formatting
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        // Use UTC to be consistent with how we save dates
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
      dueTime: task.dueTime || '',
      priority: task.priority,
      categoryId: task.categoryId || '',
    });
  }, [
    task.categoryId,
    task.description,
    task.dueDate,
    task.dueTime,
    task.priority,
    task.title,
  ]); // Only depend on task.id to prevent infinite loops

  // Helper function to normalize incomplete time inputs
  const getActualTimeValue = (reactValue: string): string => {
    // If React state has a valid value, use it
    if (reactValue && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reactValue)) {
      return reactValue;
    }

    // Debug: Check what's actually in the DOM element
    if (timeInputRef.current) {
      console.log('DOM input debug:', {
        value: timeInputRef.current.value,
        valueAsDate: timeInputRef.current.valueAsDate,
        validity: timeInputRef.current.validity,
        validationMessage: timeInputRef.current.validationMessage,
      });
    }

    // Otherwise, try to get the actual value from the specific time input ref
    if (timeInputRef.current && timeInputRef.current.value) {
      const domValue = timeInputRef.current.value;
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(domValue)) {
        console.log('Got actual time from DOM ref:', domValue);
        return domValue;
      }
    }

    return reactValue;
  };

  // Handle removing time specifically
  const handleRemoveTime = useCallback(async () => {
    try {
      const updates: UpdateTaskRequest = {
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
      };

      // Add optional fields
      if (task.categoryId) {
        updates.categoryId = task.categoryId;
      }

      // Preserve existing date
      if (task.dueDate) {
        updates.dueDate = task.dueDate;
      }
      await onUpdate(task.id, updates);
      setEditingField(null);
      setEditValues((prev) => ({ ...prev, dueTime: '' }));
    } catch {
      if (onError) {
        onError('Failed to remove time');
      }
    }
  }, [task, onUpdate, onError]);

  const handleSaveEdit = useCallback(
    async (field: string) => {
      try {
        // Always include required fields for server validation
        const updates: UpdateTaskRequest = {
          title: editValues.title.trim(),
          description: editValues.description.trim() || undefined,
          priority: editValues.priority,
        };

        // Add optional fields
        if (editValues.categoryId) {
          updates.categoryId = editValues.categoryId;
        }

        // Handle dueTime - allow adding, updating, or removing
        if (field === 'dueTime') {
          console.log('Time field debug:', {
            editValues: editValues.dueTime,
            length: editValues.dueTime?.length,
            raw: JSON.stringify(editValues.dueTime),
          });

          // When editing time specifically - handle both valid input and empty input from browser
          const rawTimeValue = editValues.dueTime;
          const actualTimeValue = getActualTimeValue(rawTimeValue);

          console.log('Time value resolution:', {
            raw: rawTimeValue,
            actual: actualTimeValue,
          });

          if (actualTimeValue && actualTimeValue.trim() !== '') {
            // Adding or updating time
            const timeValue = actualTimeValue;

            // Validate that we have a proper HH:MM format
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (timeRegex.test(timeValue)) {
              if (timeValue.includes('T')) {
                const timeMatch = timeValue.match(/T(\d{2}:\d{2})/);
                updates.dueTime = timeMatch ? timeMatch[1] : timeValue;
              } else {
                updates.dueTime = timeValue;
              }
              console.log('Sending valid time value:', updates.dueTime);
            } else {
              console.log(
                'Invalid time format after normalization:',
                timeValue
              );
              if (onError) {
                onError('Please enter a valid time');
              }
              return; // Don't proceed with invalid time
            }
          } else {
            // Only remove time if user explicitly cleared it, not if input is invalid
            console.log(
              'Empty time input - skipping update to prevent accidental removal'
            );
            if (onError) {
              onError(
                'Please enter a valid time or use the × button to remove'
              );
            }
            return; // Don't proceed with empty input when trying to set time
          }
        } else if (task.dueTime) {
          // Preserve existing time when updating other fields
          const timeValue = task.dueTime;
          if (timeValue.includes('T')) {
            const timeMatch = timeValue.match(/T(\d{2}:\d{2})/);
            updates.dueTime = timeMatch ? timeMatch[1] : timeValue;
          } else {
            updates.dueTime = timeValue;
          }
        }

        // Handle dueDate conversion
        if (editValues.dueDate) {
          // Create date in UTC to avoid timezone issues
          const dateStr = editValues.dueDate + 'T00:00:00.000Z';
          const date = new Date(dateStr);
          updates.dueDate = date.toISOString();
        }

        // Validate title if we're editing it
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
              setTimeout(() => handleSaveEdit(field), 0);
            } else {
              // Still invalid, show error
              console.log('Time input still invalid after blur');
              if (onError) {
                onError('Please enter a valid time (e.g., 09:00)');
              }
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

  const handleToggleCompletion = useCallback(
    async (e?: React.MouseEvent<HTMLDivElement> | React.PointerEvent) => {
      // Prevent all possible default behaviors
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent) {
          e.nativeEvent.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
        }
      }

      // Prevent any potential form submission or navigation
      if (e && e.currentTarget.closest('form')) {
        return false;
      }

      if (isToggling) return; // Prevent rapid clicking

      setIsToggling(true);
      try {
        await onToggleCompletion(task.id);
      } finally {
        // Add a small delay to make the transition feel smoother
        setTimeout(() => setIsToggling(false), 200);
      }

      return false; // Extra prevention
    },
    [task.id, onToggleCompletion, isToggling]
  );

  const handleTitleClick = useCallback(
    async (e?: React.MouseEvent | React.PointerEvent) => {
      // Prevent all possible default behaviors
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent) {
          e.nativeEvent.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
        }
      }

      // Prevent any potential form submission or navigation
      if (e && e.currentTarget.closest('form')) {
        return false;
      }

      if (isToggling) return; // Prevent rapid clicking

      setIsToggling(true);
      try {
        await onToggleCompletion(task.id);
      } finally {
        // Add a small delay to make the transition feel smoother
        setTimeout(() => setIsToggling(false), 200);
      }

      return false; // Extra prevention
    },
    [task.id, onToggleCompletion, isToggling]
  );

  // Handle undo delete
  const handleUndoDelete = useCallback(() => {
    if (deletedTask && onRestore) {
      onRestore(deletedTask.id);
      setDeletedTask(null);
    }
    handleUndo();
  }, [deletedTask, onRestore, handleUndo]);

  // Hide undo toast
  const handleHideUndo = useCallback(() => {
    setDeletedTask(null);
    hideUndo();
  }, [hideUndo]);

  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(task.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, task.id, onDelete]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Compare UTC dates to avoid timezone issues
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

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status.toLowerCase() !== 'completed';

  return (
    <>
      <AnimatedDiv
        style={swipeStyle}
        data-status={task.status}
        data-priority={task.priority}
        data-task-id={task.id}
        className={`task-card touch-pan-y select-none relative ${
          task.status.toLowerCase() === 'completed' ? 'task-card-completed' : ''
        } ${isOverdue ? 'task-card-overdue' : ''} ${
          isToggling ? 'task-toggling' : ''
        } ${
          task.priority === 'high'
            ? 'task-card-priority-high'
            : task.priority === 'medium'
              ? 'task-card-priority-medium'
              : 'task-card-priority-low'
        } ${gestureState.isDeleting ? 'pointer-events-none swipe-delete-active' : ''} 
        task-item-mobile sm:task-item-tablet animate-fade-in`}
      >
        {/* Gesture system temporarily disabled to test click responsiveness */}

        {/* Swipe delete indicator */}
        <div className="swipe-delete-indicator">
          <svg
            className="w-5 h-5"
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
        </div>

        <div className="flex items-start space-x-3 sm:space-x-4">
          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Title with Checkbox */}
            <div className="mb-2 flex items-center space-x-2">
              {/* Completion Checkbox */}
              <div
                className="flex-shrink-0 cursor-pointer"
                onClick={handleToggleCompletion}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  // Trigger action immediately without going through the click handler
                  if (!isToggling) {
                    onToggleCompletion(task.id);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={task.status.toLowerCase() === 'completed'}
                  data-checked={task.status.toLowerCase() === 'completed'}
                  disabled={isToggling}
                  readOnly
                  className={`h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 mobile-focus transition-opacity duration-200 pointer-events-none ${
                    isToggling ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Title */}
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
                    className="input text-sm font-medium"
                  />
                ) : (
                  <h4
                    onClick={handleTitleClick}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      // Trigger action immediately without going through the click handler
                      if (!isToggling) {
                        setIsToggling(true);
                        onToggleCompletion(task.id).finally(() =>
                          setIsToggling(false)
                        );
                      }
                    }}
                    className={`text-heading-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700-50 px-2 py-1 rounded-lg transition-all duration-250 ${
                      task.status.toLowerCase() === 'completed'
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white hover-lift'
                    }`}
                  >
                    {task.title}
                  </h4>
                )}
              </div>
            </div>

            {/* Description */}
            {(task.description || editingField === 'description') && (
              <div className="mb-2">
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
                    className="textarea text-xs"
                  />
                ) : (
                  <p
                    onClick={() => handleStartEdit('description')}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      handleStartEdit('description');
                    }}
                    className="text-body cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700-50 px-2 py-1 rounded-lg transition-all duration-250 hover-lift"
                  >
                    {task.description || 'Add description...'}
                  </p>
                )}
              </div>
            )}

            {/* Due Date and Time */}
            <div className="flex items-center space-x-4 mb-2">
              {/* Due Date */}
              <div className="flex items-center space-x-1">
                {editingField === 'dueDate' ? (
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1000,
                      // Completely isolate from gesture system
                      pointerEvents: 'auto',
                      touchAction: 'auto',
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerMove={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <input
                      type="date"
                      value={editValues.dueDate}
                      onChange={(e) => {
                        setEditValues((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }));
                      }}
                      onBlur={() => {
                        // Always save on blur, let the server handle validation
                        handleSaveEdit('dueDate');
                      }}
                      onKeyDown={(e) => handleKeyPress(e, 'dueDate')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      style={{
                        width: '140px',
                        pointerEvents: 'auto',
                        touchAction: 'auto',
                      }}
                      autoFocus
                    />
                  </div>
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
                      onBlur={() => handleSaveEdit('dueTime')}
                      onKeyDown={(e) => handleKeyPress(e, 'dueTime')}
                      className="input text-xs"
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
            <div className="flex items-center space-x-2">
              {/* Priority */}
              {editingField === 'priority' ? (
                <select
                  value={editValues.priority}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      priority: e.target.value as Priority,
                    }))
                  }
                  onBlur={() => handleSaveEdit('priority')}
                  onKeyDown={(e) => handleKeyPress(e, 'priority')}
                  className="select text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <span
                  onClick={() => handleStartEdit('priority')}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    handleStartEdit('priority');
                  }}
                  className={`badge cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale ${
                    task.priority === 'high'
                      ? 'badge-error'
                      : task.priority === 'medium'
                        ? 'badge-warning'
                        : 'badge-success'
                  }`}
                >
                  {task.priority.toUpperCase()}
                </span>
              )}

              {/* Category */}
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
                  className="select text-xs"
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
                  className="badge text-white cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale"
                  style={{ backgroundColor: task.category.color }}
                >
                  {task.category.name}
                </span>
              ) : (
                <span
                  onClick={() => handleStartEdit('categoryId')}
                  className="badge badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale"
                >
                  Add category
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className={`p-2 rounded-lg transition-all duration-250 hover-scale ${
                showDeleteConfirm
                  ? 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900-20 hover:bg-error-100 dark:hover:bg-error-900-30'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title={
                showDeleteConfirm
                  ? 'Click again to confirm deletion'
                  : 'Delete task'
              }
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
      </AnimatedDiv>

      {/* Undo Toast */}
      <UndoToast
        show={gestureState.showUndo && deletedTask !== null}
        message={`Task "${deletedTask?.title || 'Task'}" deleted`}
        onUndo={handleUndoDelete}
        onHide={handleHideUndo}
        duration={4000}
      />
    </>
  );
};

export default React.memo(TaskItem, (prevProps, nextProps) => {
  // Only re-render if the task data has actually changed
  const prevTask = prevProps.task;
  const nextTask = nextProps.task;

  return (
    prevTask.id === nextTask.id &&
    prevTask.status === nextTask.status &&
    prevTask.title === nextTask.title &&
    prevTask.description === nextTask.description &&
    prevTask.dueDate === nextTask.dueDate &&
    prevTask.dueTime === nextTask.dueTime &&
    prevTask.priority === nextTask.priority &&
    prevTask.categoryId === nextTask.categoryId &&
    prevTask.updatedAt === nextTask.updatedAt &&
    prevProps.categories.length === nextProps.categories.length
  );
});
