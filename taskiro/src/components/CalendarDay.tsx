import React, { useState, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import CalendarTask from './CalendarTask';
import TaskCreateModal from './TaskCreateModal';
import type { Task, Category } from '../types/task';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  categories: Category[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (taskData: Partial<Task>) => void;
  onToggleCompletion: (taskId: string) => void;
  onError?: (error: string) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  tasks,
  categories,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onToggleCompletion,
  onError,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const dayNumber = date.getDate();
  const hasOverflow = tasks.length > 3;
  const visibleTasks = showAllTasks ? tasks : tasks.slice(0, 3);
  const hiddenTaskCount = tasks.length - 3;

  const handleDayClick = useCallback(() => {
    if (isCurrentMonth) {
      setShowCreateModal(true);
    }
  }, [isCurrentMonth]);

  const handleCreateTask = useCallback(
    (taskData: Partial<Task>) => {
      const dateString = date.toISOString().split('T')[0];
      onTaskCreate({
        ...taskData,
        dueDate: dateString,
      });
      setShowCreateModal(false);
    },
    [date, onTaskCreate]
  );

  const handleShowMore = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowAllTasks(!showAllTasks);
    },
    [showAllTasks]
  );

  // Show warning for days with 10+ tasks
  const hasTaskLimitWarning = tasks.length >= 10;

  return (
    <>
      <div
        style={{
          minHeight: '120px',
          backgroundColor: '#ffffff',
          padding: '8px',
          cursor: 'pointer',
          position: 'relative',
          border: isToday ? '2px solid #3b82f6' : 'none',
          opacity: !isCurrentMonth ? 0.5 : 1,
        }}
        onClick={handleDayClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
      >
        {/* Day number */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: isToday ? '#3b82f6' : 'transparent',
              color: isToday
                ? '#ffffff'
                : !isCurrentMonth
                  ? '#9ca3af'
                  : '#111827',
              borderRadius: isToday ? '50%' : '0',
              width: isToday ? '24px' : 'auto',
              height: isToday ? '24px' : 'auto',
              display: isToday ? 'flex' : 'inline',
              alignItems: isToday ? 'center' : 'normal',
              justifyContent: isToday ? 'center' : 'normal',
            }}
          >
            {dayNumber}
          </span>

          {/* Task limit warning */}
          {hasTaskLimitWarning && (
            <div
              className="text-xs text-red-500 font-medium"
              title="High task load"
            >
              !
            </div>
          )}

          {/* Add task button (visible on hover) */}
          {isCurrentMonth && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
              className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-opacity"
              title="Add task"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Tasks */}
        <div className="space-y-1">
          {visibleTasks.map((task) => (
            <CalendarTask
              key={task.id}
              task={task}
              categories={categories}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
              onToggleCompletion={onToggleCompletion}
              onError={onError}
            />
          ))}

          {/* Show more button */}
          {hasOverflow && !showAllTasks && (
            <button
              onClick={handleShowMore}
              className="w-full text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-1 text-left font-medium"
            >
              +{hiddenTaskCount} more
            </button>
          )}

          {/* Show less button */}
          {showAllTasks && hasOverflow && (
            <button
              onClick={handleShowMore}
              className="w-full text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-1 text-left font-medium"
            >
              Show less
            </button>
          )}
        </div>
      </div>

      {/* Task creation modal */}
      {showCreateModal && (
        <TaskCreateModal
          date={date}
          categories={categories}
          onCreateTask={handleCreateTask}
          onClose={() => setShowCreateModal(false)}
          onError={onError}
        />
      )}
    </>
  );
};

export default CalendarDay;
