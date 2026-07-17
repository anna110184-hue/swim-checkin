-- ============================================================
-- 收據：專屬連結收據
-- 在 Supabase SQL Editor 執行此檔
-- ============================================================

create table if not exists receipts (
  id               uuid primary key default uuid_generate_v4(),  -- 亂碼 ID = 專屬連結
  student_id       uuid not null references students(id) on delete cascade,
  receipt_no       text not null,
  -- 快照欄位：開立當下的資料，之後改學生資料不影響已開收據
  student_name     text not null,
  parent_name      text not null,
  time_slot        text not null,
  lessons          int  not null default 10,
  price_per_lesson numeric(10,2) not null default 45,
  amount           numeric(10,2) not null,
  payment_method   text not null default 'PayID 轉帳（0423 780 409）',
  paid_date        date not null,
  note             text,
  created_at       timestamptz not null default now()
);

alter table receipts enable row level security;

-- 知道連結（uuid）的人可以讀取
create policy "public_read_receipts"
  on receipts for select using (true);

-- 只有管理員能開立/刪除（API 走 service role，這裡擋直接存取）
create policy "admin_all_receipts"
  on receipts for all using (auth.role() = 'authenticated');
