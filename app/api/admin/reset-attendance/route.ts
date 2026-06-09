import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id } = await req.json();
  if (!student_id) return NextResponse.json({ error: "student_id required" }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service
    .from("attendance")
    .delete()
    .eq("student_id", student_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
