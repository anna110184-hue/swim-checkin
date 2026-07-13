-- ============================================================
-- Phase 1.5: 轉帳確認欄位
-- 在 Supabase SQL Editor 執行此檔
-- ============================================================

alter table attendance add column if not exists payment_claimed boolean not null default false;
alter table attendance add column if not exists payment_claimed_at timestamptz;
