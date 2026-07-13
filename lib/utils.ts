import { format, subDays, parseISO } from "date-fns";

export function getTodayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getTodayDayOfWeek(): "sat" | "sun" | null {
  const day = new Date().getDay();
  if (day === 6) return "sat";
  if (day === 0) return "sun";
  return null;
}

export function getLast7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(today, i + 1), "yyyy-MM-dd")
  );
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), "MM/dd");
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getThisWeekRange(): { start: string; end: string; days: string[] } {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });
  return { start: days[0], end: days[6], days };
}
