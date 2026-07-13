-- ============================================================
-- Phase 1: 代課打卡
-- 在 Supabase SQL Editor 執行此檔
-- ============================================================

-- attendance 加代課者欄位
-- substitute_name 不為 null = 本堂由代課者出席，課照扣、錢照繳
alter table attendance add column if not exists substitute_name text;
