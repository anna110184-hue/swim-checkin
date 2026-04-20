import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const service = createServiceClient();

  // Create student
  const { data: student, error: sErr } = await service
    .from("students")
    .insert({
      name: body.name,
      parent_name: body.parent_name,
      time_slot: body.time_slot,
      day_of_week: body.day_of_week,
      payment_status: body.payment_status ?? "unpaid",
      course_type: body.course_type ?? "regular",
      parent_email: body.parent_email ?? null,
    })
    .select()
    .single();

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  // Create initial session
  const { error: seErr } = await service.from("sessions").insert({
    student_id: student.id,
    total_classes: 10,
    start_date: body.start_date ?? new Date().toISOString().slice(0, 10),
  });

  if (seErr) return NextResponse.json({ error: seErr.message }, { status: 500 });

  return NextResponse.json(student);
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  const service = createServiceClient();

  const { data, error } = await service
    .from("students")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const service = createServiceClient();

  const { error } = await service.from("students").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
