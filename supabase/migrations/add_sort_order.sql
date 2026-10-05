-- Add sort_order column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS sort_order integer;

-- Initialize sort_order based on created_at order within each day_of_week group
UPDATE students SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY day_of_week ORDER BY created_at) as rn
  FROM students
) sub
WHERE students.id = sub.id;
