import { createClient, createServiceClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createClient();
  const service = createServiceClient();

  const [{ data: students }, { data: attendance }, { data: sessions }, { data: notices }, { data: receipts }] = await Promise.all([
    supabase.from("students").select("*").order("day_of_week").order("time_slot"),
    supabase.from("attendance").select("*").order("attended_date", { ascending: false }),
    supabase.from("sessions").select("*"),
    supabase.from("notices").select("*").order("created_at", { ascending: false }),
    service.from("receipts").select("*").order("created_at", { ascending: false }),
  ]);

  let showSat = true;
  let showSun = true;
  try {
    const { data: settings } = await service.from("settings").select("*");
    if (settings) {
      const find = (key: string) => (settings as any[]).find((s) => s.key === key)?.value;
      if (find("show_saturday") !== undefined) showSat = find("show_saturday") === "true";
      if (find("show_sunday") !== undefined) showSun = find("show_sunday") === "true";
    }
  } catch {
    // settings table not yet created — use defaults
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://swim-checkin.vercel.app";

  return (
    <AdminDashboard
      initialStudents={students ?? []}
      initialAttendance={attendance ?? []}
      initialSessions={sessions ?? []}
      initialNotices={notices ?? []}
      initialReceipts={receipts ?? []}
      initialShowSat={showSat}
      initialShowSun={showSun}
      siteUrl={siteUrl}
    />
  );
}
