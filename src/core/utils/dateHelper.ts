/**
 * Date helper utilities for employee assignment scheduling
 */

/**
 * Get the next Saturday from a given date
 * @param startDate - The starting date
 * @returns Date object set to the next Saturday at 23:59:59
 */
export function getNextSaturday(startDate: Date): Date {
  const date = new Date(startDate);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days until Saturday
  const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
  
  date.setDate(date.getDate() + daysUntilSaturday);
  date.setHours(23, 59, 59, 999);
  
  return date;
}

/**
 * Get the last Saturday of the month for a given date
 * If start date is in current month, generate from start date to last Saturday
 * @param startDate - The starting date
 * @returns Date object set to the last Saturday of the month at 23:59:59
 */
export function getLastSaturdayOfMonth(startDate: Date): Date {
  const date = new Date(startDate);
  
  // Get the last day of the current month
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  // Find the last Saturday of this month
  const lastDayWeekday = lastDayOfMonth.getDay();
  let daysToSubtract = 0;
  
  if (lastDayWeekday === 6) {
    // Last day is Saturday
    daysToSubtract = 0;
  } else if (lastDayWeekday === 0) {
    // Last day is Sunday, go back 1 day
    daysToSubtract = 1;
  } else {
    // Last day is weekday (1-5), calculate days back to Saturday
    daysToSubtract = lastDayWeekday + 1;
  }
  
  const lastSaturday = new Date(lastDayOfMonth);
  lastSaturday.setDate(lastDayOfMonth.getDate() - daysToSubtract);
  lastSaturday.setHours(23, 59, 59, 999);
  
  return lastSaturday;
}

/**
 * Generate array of dates from start to end date
 * @param startDate - Starting date
 * @param endDate - Ending date
 * @returns Array of Date objects
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Normalize date to start of day (00:00:00.000)
 * @param date - Date to normalize
 * @returns Date object at start of day
 */
export function normalizeToStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Normalize date to end of day (23:59:59.999)
 * @param date - Date to normalize
 * @returns Date object at end of day
 */
export function normalizeToEndOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}
