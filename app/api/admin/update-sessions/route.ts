import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id, total_classes, paid_lessons } = await req.json();
  if (!student_id) return NextResponse.json({ error: "Missing student_id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (total_classes !== undefined) updates.total_classes = total_classes;
  if (paid_lessons !== undefined) updates.paid_lessons = paid_lessons === null ? null : Number(paid_lessons);

  const service = createServiceClient();
  const { error } = await service
    .from("sessions")
    .update(updates)
    .eq("student_id", student_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
