-- ============================================================
-- Seed Data — Swimming Class Check-in System
-- Start date: 2025-04-18 (first Saturday)
-- ============================================================

-- ============================================================
-- Saturday students
-- ============================================================
with sat_students as (
  insert into students (name, parent_name, time_slot, day_of_week, payment_status, course_type)
  values
    ('Harrison', 'Emilie',  '09:00–09:45', 'sat', 'paid', 'regular'),
    ('Summer',   'Nicole',  '09:45–10:30', 'sat', 'paid', 'regular'),
    ('Amelia',   'Nicole',  '10:30–11:15', 'sat', 'paid', 'regular'),
    ('Katie',    'Lucy',    '11:15–12:00', 'sat', 'paid', 'regular'),
    ('Ivy',      'Ann',     '12:00–12:45', 'sat', 'paid', 'regular'),
    ('Tina',     'Hedy',    '12:45–13:30', 'sat', 'paid', 'regular'),
    ('Joson',    'Ivy',     '13:30–14:15', 'sat', 'paid', 'regular'),
    ('Harry',    'Ada',     '14:15–15:00', 'sat', 'paid', 'regular'),
    ('Eno',      'Ariel',   '15:00–15:45', 'sat', 'paid', 'regular'),
    ('Janko',    'Jennie',  '15:45–16:30', 'sat', 'paid', 'regular')
  returning id
)
insert into sessions (student_id, total_classes, start_date)
select id, 10, '2025-04-19'
from sat_students;

-- ============================================================
-- Sunday students
-- ============================================================
with sun_students as (
  insert into students (name, parent_name, time_slot, day_of_week, payment_status, course_type)
  values
    ('Kevin',    'Lisa',    '10:30–11:15', 'sun', 'paid', 'regular'),
    ('Bertrand', 'Jessica', '11:15–12:00', 'sun', 'paid', 'regular'),
    ('Raylan',   'Leona',   '12:00–12:45', 'sun', 'paid', 'regular'),
    ('Kyle',     'Julia',   '12:45–13:30', 'sun', 'paid', 'regular'),
    ('Kaleb',    '宇婕',    '13:30–14:15', 'sun', 'paid', 'regular'),
    ('Caspa',    'Wendy',   '14:15–15:00', 'sun', 'paid', 'regular'),
    ('樂昕',     'Albee',   '15:00–15:45', 'sun', 'paid', 'regular'),
    ('Ivan',     'Ellie',   '15:45–16:30', 'sun', 'paid', 'regular')
  returning id
)
insert into sessions (student_id, total_classes, start_date)
select id, 10, '2025-04-20'
from sun_students;
