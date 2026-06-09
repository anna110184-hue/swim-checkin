import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id, total_classes } = await req.json();
  if (!student_id || !total_classes) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service
    .from("sessions")
    .update({ total_classes })
    .eq("student_id", student_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
