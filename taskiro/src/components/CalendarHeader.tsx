import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}) => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="calendar-header">
      <div className="calendar-header__container">
        <div className="calendar-header__title-section">
          <h2 className="calendar-header__title">
            {currentMonth} {currentYear}
          </h2>

          {!isCurrentMonth && (
            <button onClick={onToday} className="calendar-header__today-button">
              Today
            </button>
          )}
        </div>

        <div className="calendar-header__nav-controls">
          <button
            onClick={onPreviousMonth}
            className="calendar-header__nav-button"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="calendar-header__nav-icon" />
          </button>

          <button
            onClick={onNextMonth}
            className="calendar-header__nav-button"
            aria-label="Next month"
          >
            <ChevronRightIcon className="calendar-header__nav-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
