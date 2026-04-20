import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: students }, { data: attendance }, { data: sessions }] = await Promise.all([
    supabase.from("students").select("*").order("day_of_week").order("time_slot"),
    supabase.from("attendance").select("*").order("attended_date", { ascending: false }),
    supabase.from("sessions").select("*"),
  ]);

  return (
    <AdminDashboard
      initialStudents={students ?? []}
      initialAttendance={attendance ?? []}
      initialSessions={sessions ?? []}
    />
  );
}
