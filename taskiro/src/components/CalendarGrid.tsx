import React, { useMemo } from 'react';
import CalendarDay from './CalendarDay';
import type { Task, Category } from '../types/task';

interface CalendarGridProps {
  currentDate: Date;
  tasks: Task[];
  categories: Category[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (taskData: Partial<Task>) => void;
  onToggleCompletion: (taskId: string) => void;
  onError?: (error: string) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  tasks,
  categories,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onToggleCompletion,
  onError,
}) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // End at the last Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      const dayTasks = tasks.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        // Use UTC methods to avoid timezone conversion issues
        return (
          taskDate.getUTCFullYear() === currentDay.getFullYear() &&
          taskDate.getUTCMonth() === currentDay.getMonth() &&
          taskDate.getUTCDate() === currentDay.getDate()
        );
      });

      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday:
          currentDay.getFullYear() === new Date().getFullYear() &&
          currentDay.getMonth() === new Date().getMonth() &&
          currentDay.getDate() === new Date().getDate(),
        tasks: dayTasks,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }, [currentDate, tasks]);

  return (
    <div className="calendar-grid">
      {/* Day headers */}
      <div className="calendar-grid__day-headers">
        {dayNames.map((day) => (
          <div key={day} className="calendar-grid__day-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid__container">
        {calendarDays.map((day) => (
          <CalendarDay
            key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
            date={day.date}
            isCurrentMonth={day.isCurrentMonth}
            isToday={day.isToday}
            tasks={day.tasks}
            categories={categories}
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
            onTaskCreate={onTaskCreate}
            onToggleCompletion={onToggleCompletion}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
