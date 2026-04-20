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
