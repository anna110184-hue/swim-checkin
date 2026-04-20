import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Admin check-in: no 7-day limit
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id, date, is_makeup } = await req.json();
  const service = createServiceClient();

  const { data: session, error: sessionError } = await service
    .from("sessions")
    .select("id")
    .eq("student_id", student_id)
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "No session found" }, { status: 404 });
  }

  const { error } = await service.from("attendance").upsert(
    {
      student_id,
      session_id: session.id,
      attended_date: date,
      is_makeup: is_makeup ?? false,
      is_cancelled: false,
    },
    { onConflict: "student_id,attended_date" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
