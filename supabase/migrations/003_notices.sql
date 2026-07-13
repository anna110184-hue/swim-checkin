-- ============================================================
-- 重要通知公告表
-- 在 Supabase SQL Editor 執行此檔
-- ============================================================

create table if not exists notices (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  content    text not null,
  is_active  boolean not null default true,
  expires_at date,
  created_at timestamptz not null default now()
);

alter table notices enable row level security;

-- Public can read active non-expired notices
create policy "public_read_notices" on notices
  for select using (
    is_active = true
    and (expires_at is null or expires_at >= current_date)
  );
