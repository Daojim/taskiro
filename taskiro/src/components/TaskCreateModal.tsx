import React, { useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Task, Category, Priority } from '../types/task';
import EnhancedTimeInput from './EnhancedTimeInput';
import { parseTime } from '../utils/timeParser';

interface TaskCreateModalProps {
  date: Date;
  categories: Category[];
  onCreateTask: (taskData: Partial<Task>) => void;
  onClose: () => void;
  onError?: (error: string) => void;
}

const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  date,
  categories,
  onCreateTask,
  onClose,
  onError,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueTime: '',
    priority: 'medium' as Priority,
    categoryId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleInputChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.title.trim()) {
        if (onError) {
          onError('Task title is required');
        }
        return;
      }

      setIsSubmitting(true);

      try {
        // Validate time if provided
        let validatedTime = formData.dueTime;
        if (formData.dueTime) {
          const parseResult = parseTime(formData.dueTime);
          if (parseResult.success && parseResult.time) {
            validatedTime = parseResult.time;
          } else {
            if (onError) {
              onError(parseResult.error || 'Invalid time format');
            }
            return;
          }
        }

        const taskData: Partial<Task> = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          dueTime: validatedTime || undefined,
          priority: formData.priority,
          categoryId: formData.categoryId || undefined,
        };

        onCreateTask(taskData);
      } catch {
        if (onError) {
          onError('Failed to create task');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onCreateTask, onError]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
    >
      <div
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 id="create-task-title" className="modal-title">
              Create Task
            </h3>
            <p className="text-sm text-secondary mt-1">{formatDate(date)}</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form
          id="create-task-form"
          onSubmit={handleSubmit}
          className="modal-body space-y-4"
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="form-input"
              placeholder="Enter task title..."
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="form-textarea"
              placeholder="Enter task description..."
            />
          </div>

          {/* Time */}
          <div>
            <label htmlFor="dueTime" className="form-label">
              Time
            </label>
            <EnhancedTimeInput
              value={formData.dueTime}
              onChange={(value) => handleInputChange('dueTime', value)}
              onError={onError}
              placeholder="Enter time (e.g., 9:00 AM, 14:30, noon)"
              className="form-input"
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="form-label">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                handleInputChange('priority', e.target.value as Priority)
              }
              className="form-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className="form-select"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Actions */}
        <div className="modal-footer">
          <button
            type="submit"
            form="create-task-form"
            className="button button--primary"
            disabled={isSubmitting || !formData.title.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="button button--secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCreateModal;
