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
        className={`calendar-day ${
          isCurrentMonth
            ? 'calendar-day--current-month'
            : 'calendar-day--other-month'
        } ${isToday ? 'calendar-day--today' : ''} group`}
        onClick={handleDayClick}
      >
        {/* Day number */}
        <div className="calendar-day__header">
          <span
            className={`calendar-day__number ${
              isToday
                ? 'calendar-day__number--today'
                : isCurrentMonth
                  ? 'calendar-day__number--current-month'
                  : 'calendar-day__number--other-month'
            }`}
          >
            {dayNumber}
          </span>

          {/* Task limit warning */}
          {hasTaskLimitWarning && (
            <div
              className={`calendar-day__warning ${
                taskOverloadLevel === 'critical'
                  ? 'calendar-day__warning--critical'
                  : 'calendar-day__warning--high'
              }`}
              title={`${tasks.length} tasks - ${taskOverloadLevel === 'critical' ? 'Critical task overload' : 'High task load'}`}
            >
              <ExclamationTriangleIcon
                className={`calendar-day__warning-icon ${
                  taskOverloadLevel === 'critical'
                    ? 'calendar-day__warning-icon--critical'
                    : ''
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
              className="calendar-day__add-button"
              title="Add task"
            >
              <PlusIcon className="calendar-day__add-icon" />
            </button>
          )}
        </div>

        {/* Tasks */}
        <div className="calendar-day__tasks">
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
              className={`calendar-day__expandable-tasks ${
                showAllTasks
                  ? 'calendar-day__expandable-tasks--expanded'
                  : 'calendar-day__expandable-tasks--collapsed'
              }`}
            >
              <div className="calendar-day__expandable-content">
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
              className={`calendar-day__toggle-button ${
                showAllTasks
                  ? 'calendar-day__toggle-button--show-less'
                  : 'calendar-day__toggle-button--show-more'
              }`}
            >
              {showAllTasks ? (
                <span className="calendar-day__toggle-content">
                  <span>Show less</span>
                  <svg
                    className="calendar-day__toggle-icon calendar-day__toggle-icon--expanded"
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
                <span className="calendar-day__toggle-content">
                  <span>+{hiddenTaskCount} more</span>
                  <svg
                    className="calendar-day__toggle-icon calendar-day__toggle-icon--collapsed"
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
