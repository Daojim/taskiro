/**
 * Immutable date utility functions
 */
export class DateUtils {
  /**
   * Add days to a date without mutating the original
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Get the last day of the month for a given date
   */
  static getLastDayOfMonth(date: Date): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0);
  }

  /**
   * Get the first day of next week (Monday) from a given date
   */
  static getNextWeekStart(date: Date): Date {
    const daysUntilNextMonday = (8 - date.getDay()) % 7 || 7;
    return this.addDays(date, daysUntilNextMonday);
  }

  /**
   * Check if a date is in the same month as another date
   */
  static isSameMonth(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
  }
}
