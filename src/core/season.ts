/**
 * Seasonal content windows (local device time).
 * Christmas / New Year: Dec 1 – Jan 6 inclusive (Epiphany closes the season in IT/ES).
 */
export function isHolidaySeason(date = new Date()): boolean {
  const month = date.getMonth()
  return month === 11 || (month === 0 && date.getDate() <= 6)
}

/** Use this to gate seasonal content: always on in dev builds so it can be tested year-round. */
export function showHolidayContent(date = new Date()): boolean {
  return import.meta.env.DEV || isHolidaySeason(date)
}
