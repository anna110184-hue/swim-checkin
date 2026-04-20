import { createClient } from "@/lib/supabase/server";
import MonthlyStats from "../MonthlyStats";

export const revalidate = 0;

export default async function StatsPage() {
  const supabase = createClient();
  const [{ data: students }, { data: attendance }] = await Promise.all([
    supabase.from("students").select("*").order("day_of_week").order("time_slot"),
    supabase.from("attendance").select("*"),
  ]);

  return <MonthlyStats students={students ?? []} attendance={attendance ?? []} />;
}
