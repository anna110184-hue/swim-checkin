import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getTodayString } from "@/lib/utils";

// 開立收據，回傳專屬連結
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { student_id } = body;
  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: student, error: stuErr } = await service
    .from("students")
    .select("*")
    .eq("id", student_id)
    .single();

  if (stuErr || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const lessons: number = Number(body.lessons) > 0 ? Number(body.lessons) : 10;
  const pricePerLesson: number = Number(body.price_per_lesson) > 0 ? Number(body.price_per_lesson) : 45;
  const amount = lessons * pricePerLesson;

  // 收據編號：R-年份-流水號
  const year = new Date().getFullYear();
  const { count } = await service
    .from("receipts")
    .select("*", { count: "exact", head: true });
  const receiptNo = `R-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: receipt, error } = await service
    .from("receipts")
    .insert({
      student_id,
      receipt_no: receiptNo,
      student_name: student.name,
      parent_name: student.parent_name,
      time_slot: `${student.day_of_week === "sat" ? "週六" : "週日"} ${student.time_slot}`,
      lessons,
      price_per_lesson: pricePerLesson,
      amount,
      paid_date: body.paid_date ?? getTodayString(),
      note: body.note ?? null,
    })
    .select()
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ id: receipt.id, receipt_no: receiptNo, path: `/receipt/${receipt.id}` });
}
