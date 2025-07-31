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
  onToggleCompletion: (taskId: string) => void;
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate || '',
    dueTime: task.dueTime || '',
    priority: task.priority,
    categoryId: task.categoryId || '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Mobile gesture support
  const {
    swipeGesture,
    tapGesture,
    swipeStyle,
    gestureState,
    handleUndo,
    hideUndo,
    AnimatedDiv,
  } = useMobileGestures({
    onSwipeDelete: () => {
      setDeletedTask(task);
      onDelete(task.id);
    },
    onTap: () => {
      // Only toggle completion on tap if not editing
      if (!editingField) {
        handleToggleCompletion();
      }
    },
    swipeThreshold: 100,
  });

  // Reset edit values when task changes
  useEffect(() => {
    setEditValues({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '',
      priority: task.priority,
      categoryId: task.categoryId || '',
    });
  }, [task]);

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
      }
    }, 0);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    // Reset to original values
    setEditValues({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '',
      priority: task.priority,
      categoryId: task.categoryId || '',
    });
  }, [task]);

  const handleSaveEdit = useCallback(
    async (field: string) => {
      try {
        const updates: UpdateTaskRequest = {};

        switch (field) {
          case 'title':
            if (editValues.title.trim() === '') {
              if (onError) onError('Task title cannot be empty');
              return;
            }
            updates.title = editValues.title.trim();
            break;
          case 'description':
            updates.description = editValues.description.trim() || undefined;
            break;
          case 'dueDate':
            updates.dueDate = editValues.dueDate || undefined;
            break;
          case 'dueTime':
            updates.dueTime = editValues.dueTime || undefined;
            break;
          case 'priority':
            updates.priority = editValues.priority;
            break;
          case 'categoryId':
            updates.categoryId = editValues.categoryId || undefined;
            break;
        }

        await onUpdate(task.id, updates);
        setEditingField(null);
      } catch {
        if (onError) {
          onError('Failed to update task');
        }
      }
    },
    [editValues, task.id, onUpdate, onError]
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

  const handleToggleCompletion = useCallback(() => {
    onToggleCompletion(task.id);
  }, [task.id, onToggleCompletion]);

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

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
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
    task.status !== 'completed';

  return (
    <>
      <AnimatedDiv
        {...swipeGesture()}
        {...tapGesture()}
        style={swipeStyle}
        data-status={task.status}
        data-priority={task.priority}
        data-task-id={task.id}
        className={`task-card touch-pan-y select-none relative gesture-active ${
          task.status === 'completed' ? 'task-card-completed' : ''
        } ${isOverdue ? 'task-card-overdue' : ''} ${
          task.priority === 'high'
            ? 'task-card-priority-high'
            : task.priority === 'medium'
              ? 'task-card-priority-medium'
              : 'task-card-priority-low'
        } ${gestureState.isDeleting ? 'pointer-events-none swipe-delete-active' : ''} 
        task-item-mobile sm:task-item-tablet animate-fade-in`}
      >
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
          {/* Completion Checkbox */}
          <div className="flex-shrink-0 pt-1 mobile-tap-target haptic-feedback">
            <input
              type="checkbox"
              checked={task.status === 'completed'}
              data-checked={task.status === 'completed'}
              onChange={handleToggleCompletion}
              className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 mobile-focus"
            />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="mb-2">
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
                  onClick={() => handleStartEdit('title')}
                  className={`text-heading-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700-50 px-2 py-1 rounded-lg transition-all duration-250 ${
                    task.status === 'completed'
                      ? 'line-through text-gray-500 dark:text-gray-400'
                      : 'text-gray-900 dark:text-white hover-lift'
                  }`}
                >
                  {task.title}
                </h4>
              )}
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
                  <input
                    type="date"
                    value={editValues.dueDate}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    onBlur={() => handleSaveEdit('dueDate')}
                    onKeyDown={(e) => handleKeyPress(e, 'dueDate')}
                    className="input text-xs"
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
              {(task.dueTime || editingField === 'dueTime') && (
                <div className="flex items-center space-x-1">
                  {editingField === 'dueTime' ? (
                    <input
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
                  ) : (
                    <span
                      onClick={() => handleStartEdit('dueTime')}
                      className="badge badge-gray cursor-pointer hover:opacity-80 transition-all duration-250 hover-scale"
                    >
                      {task.dueTime ? formatTime(task.dueTime) : 'Set time'}
                    </span>
                  )}
                </div>
              )}
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

export default TaskItem;
