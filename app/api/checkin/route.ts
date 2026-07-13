import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTodayString } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { student_id, date, substitute_name } = await req.json();

  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const substituteName: string | null =
    typeof substitute_name === "string" && substitute_name.trim() !== ""
      ? substitute_name.trim().slice(0, 50)
      : null;

  const checkinDate: string = date ?? getTodayString();
  const supabase = createServiceClient();

  // Get active session for student
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, total_classes")
    .eq("student_id", student_id)
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "No session found" }, { status: 404 });
  }

  // Upsert attendance record (idempotent)
  const { error } = await supabase.from("attendance").upsert(
    {
      student_id,
      session_id: session.id,
      attended_date: checkinDate,
      is_makeup: date ? true : false,
      is_cancelled: false,
      substitute_name: substituteName,
    },
    { onConflict: "student_id,attended_date" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
