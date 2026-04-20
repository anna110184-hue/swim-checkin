-- ============================================================
-- Swimming Class Check-in System — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- students
-- ============================================================
create table if not exists students (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  parent_name   text not null,
  time_slot     text not null,       -- e.g. "09:00–09:45"
  day_of_week   text not null check (day_of_week in ('sat', 'sun')),
  payment_status text not null default 'unpaid' check (payment_status in ('paid', 'unpaid')),
  course_type   text not null default 'regular' check (course_type in ('regular', 'trial')),
  parent_email  text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- sessions  (每位學生的10堂課週期)
-- ============================================================
create table if not exists sessions (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  total_classes int  not null default 10,
  start_date    date not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- attendance
-- ============================================================
create table if not exists attendance (
  id             uuid primary key default uuid_generate_v4(),
  student_id     uuid not null references students(id) on delete cascade,
  session_id     uuid not null references sessions(id) on delete cascade,
  attended_date  date not null,
  is_makeup      boolean not null default false,
  is_cancelled   boolean not null default false,
  created_at     timestamptz not null default now(),
  -- one record per student per date
  unique (student_id, attended_date)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table students   enable row level security;
alter table sessions   enable row level security;
alter table attendance enable row level security;

-- Public read (parent page is unauthenticated)
create policy "public_read_students"
  on students for select using (true);

create policy "public_read_sessions"
  on sessions for select using (true);

create policy "public_read_attendance"
  on attendance for select using (true);

-- Public insert/update attendance (check-in, cancel, makeup)
create policy "public_insert_attendance"
  on attendance for insert with check (true);

create policy "public_update_attendance"
  on attendance for update using (true);

-- Only authenticated (admin) can insert/update/delete students and sessions
create policy "admin_all_students"
  on students for all using (auth.role() = 'authenticated');

create policy "admin_all_sessions"
  on sessions for all using (auth.role() = 'authenticated');

create policy "admin_delete_attendance"
  on attendance for delete using (auth.role() = 'authenticated');

-- ============================================================
-- Helpful view: attendance count per student per session
-- ============================================================
create or replace view session_progress as
select
  s.id           as student_id,
  s.name         as student_name,
  se.id          as session_id,
  se.total_classes,
  se.start_date,
  count(a.id) filter (where a.is_cancelled = false) as attended_count
from students s
join sessions se on se.student_id = s.id
left join attendance a on a.session_id = se.id
group by s.id, s.name, se.id, se.total_classes, se.start_date;
