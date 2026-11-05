export const HISTORY_PAGE_SIZE = 50;

export function historyMonthBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Select a valid month (YYYY-MM).");
  const [year, number] = month.split("-").map(Number);
  if (year < 1970 || year > 9998) throw new Error("Select a month between 1970 and 9998.");
  // Stored timestamps are UTC. Calendar days and months use Asia/Dhaka (UTC+6).
  return {
    gte: new Date(Date.UTC(year, number - 1, 1) - 6 * 60 * 60 * 1000),
    lt: new Date(Date.UTC(year, number, 1) - 6 * 60 * 60 * 1000),
  };
}
