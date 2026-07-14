import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const weekStart = formData.get("week_start") as string;
  const weekEnd = formData.get("week_end") as string;
  const totalAmount = parseFloat(formData.get("total_amount") as string ?? "0");

  if (!file || !weekStart || !weekEnd) {
    return NextResponse.json({ error: "file, week_start and week_end required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${weekStart}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payout-screenshots")
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("payout-screenshots")
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from("weekly_payouts")
    .upsert({ week_start: weekStart, week_end: weekEnd, total_amount: totalAmount, screenshot_url: publicUrl }, { onConflict: "week_start" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const { week_start } = await req.json();
  if (!week_start) return NextResponse.json({ error: "week_start required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: payout } = await supabase
    .from("weekly_payouts")
    .select("screenshot_url")
    .eq("week_start", week_start)
    .single();

  if (payout?.screenshot_url) {
    const fileName = payout.screenshot_url.split("/").pop();
    if (fileName) {
      await supabase.storage.from("payout-screenshots").remove([fileName]);
    }
  }

  await supabase.from("weekly_payouts").delete().eq("week_start", week_start);
  return NextResponse.json({ success: true });
}
