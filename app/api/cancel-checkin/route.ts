import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTodayString } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { student_id, date } = await req.json();

  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const targetDate: string = date ?? getTodayString();
  const today = getTodayString();

  // Non-admin cancel: only allow same-day cancellation
  if (!date && targetDate !== today) {
    return NextResponse.json({ error: "Can only cancel today's check-in" }, { status: 403 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("attendance")
    .update({ is_cancelled: true })
    .eq("student_id", student_id)
    .eq("attended_date", targetDate);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
