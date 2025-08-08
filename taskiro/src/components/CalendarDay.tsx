import React, { useState, useCallback } from 'react';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

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
  const taskOverloadLevel =
    tasks.length >= 15 ? 'critical' : tasks.length >= 10 ? 'warning' : 'normal';

  return (
    <>
      <div
        style={{
          minHeight: '120px',
          padding: '8px',
          cursor: 'pointer',
          position: 'relative',
          border: isToday ? '2px solid #3b82f6' : 'none',
          opacity: !isCurrentMonth ? 0.5 : 1,
        }}
        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
        onClick={handleDayClick}
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
              borderRadius: isToday ? '50%' : '0',
              width: isToday ? '24px' : 'auto',
              height: isToday ? '24px' : 'auto',
              display: isToday ? 'flex' : 'inline',
              alignItems: isToday ? 'center' : 'normal',
              justifyContent: isToday ? 'center' : 'normal',
            }}
            className={
              isToday
                ? 'text-white'
                : !isCurrentMonth
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-gray-100'
            }
          >
            {dayNumber}
          </span>

          {/* Task limit warning */}
          {hasTaskLimitWarning && (
            <div
              className={`flex items-center text-xs font-medium ${
                taskOverloadLevel === 'critical'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
              title={`${tasks.length} tasks - ${taskOverloadLevel === 'critical' ? 'Critical task overload' : 'High task load'}`}
            >
              <ExclamationTriangleIcon
                className={`h-3 w-3 mr-1 ${
                  taskOverloadLevel === 'critical' ? 'animate-pulse' : ''
                }`}
              />
              {tasks.length}
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
          {/* Always visible tasks */}
          {visibleTasks.slice(0, 3).map((task) => (
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

          {/* Expandable tasks with smooth animation */}
          {hasOverflow && (
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showAllTasks ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1 pt-1">
                {visibleTasks.slice(3).map((task) => (
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
              </div>
            </div>
          )}

          {/* Show more/less button */}
          {hasOverflow && (
            <button
              onClick={handleShowMore}
              className={`w-full text-xs py-1 text-left font-medium transition-colors duration-200 ${
                showAllTasks
                  ? 'text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              }`}
            >
              {showAllTasks ? (
                <span className="flex items-center">
                  <span>Show less</span>
                  <svg
                    className="ml-1 h-3 w-3 transform rotate-180 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              ) : (
                <span className="flex items-center">
                  <span>+{hiddenTaskCount} more</span>
                  <svg
                    className="ml-1 h-3 w-3 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              )}
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
