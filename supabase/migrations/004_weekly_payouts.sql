-- ============================================================
-- 每週匯款紀錄（存截圖 URL）
-- 在 Supabase SQL Editor 執行此檔
-- ============================================================

create table if not exists weekly_payouts (
  id            uuid primary key default uuid_generate_v4(),
  week_start    date not null unique,
  week_end      date not null,
  total_amount  numeric(10,2),
  screenshot_url text,
  note          text,
  created_at    timestamptz not null default now()
);

alter table weekly_payouts enable row level security;
-- Only service role can read/write (admin only via API)
