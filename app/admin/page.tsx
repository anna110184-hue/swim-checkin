import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createClient();
  const service = createServiceClient();

  const [{ data: students }, { data: attendance }, { data: sessions }, { data: notices }, { data: settings }] = await Promise.all([
    supabase.from("students").select("*").order("day_of_week").order("time_slot"),
    supabase.from("attendance").select("*").order("attended_date", { ascending: false }),
    supabase.from("sessions").select("*"),
    supabase.from("notices").select("*").order("created_at", { ascending: false }),
    service.from("settings").select("*"),
  ]);

  function getSetting(key: string, fallback = "true") {
    return (settings ?? []).find((s: any) => s.key === key)?.value ?? fallback;
  }

  return (
    <AdminDashboard
      initialStudents={students ?? []}
      initialAttendance={attendance ?? []}
      initialSessions={sessions ?? []}
      initialNotices={notices ?? []}
      initialShowSat={getSetting("show_saturday") === "true"}
      initialShowSun={getSetting("show_sunday") === "true"}
    />
  );
}
