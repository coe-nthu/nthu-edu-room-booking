-- 1. Create departments table
create table departments (
  id serial primary key,
  name text not null,
  legacy_id text -- To map old admin_unit IDs
);

-- Insert departments from old system admin_units table
insert into departments (name, legacy_id) values 
('院本部', '1'),
('課務組', '2'),
('心智中心', '3'),
('師培中心', '4'),
('華德福中心', '6'),
('特教中心', '7'),
('心理諮商系', '11'),
('特教系', '12'),
('幼教系', '13'),
('運科系', '14'),
('環文系', '15'),
('教科系', '16'),
('數理系', '17'),
('英教系', '18'),
('數理所', '19'),
('台語所', '20');

-- 2. Update profiles table
alter table profiles 
  add column phone text,
  add column department_id int references departments(id);

-- 3. Update rooms table schema
-- Remove is_lunch_locked and add unavailable_periods
-- Add specific columns instead of stuffing into equipment
alter table rooms 
  drop column is_lunch_locked,
  add column unavailable_periods jsonb default '[]'::jsonb, -- e.g. [{"day": 1, "start": "12:00", "end": "13:00"}]
  add column floor text,
  add column room_type text,
  add column admin_dept_id int references departments(id),
  add column legacy_id int;

-- 4. Update booking_status enum
alter type booking_status add value 'cancelled_by_user';

-- 5. Create audit_logs table
create table audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  action text not null, -- e.g., 'APPROVE_BOOKING', 'REJECT_BOOKING', 'CANCEL_BOOKING'
  target_table text not null, -- 'bookings', 'rooms'
  target_id uuid not null,
  details jsonb, -- Store changes or metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table audit_logs enable row level security;

create policy "Admins can view audit logs." on audit_logs
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 6. Re-import rooms data with new structure
-- Clear existing rooms first to avoid duplicates if re-running (optional, use with caution)
-- truncate table rooms cascade; 

-- Note: admin_dept_id mapping logic updated to match legacy_id from departments table
-- legacy_id '1' -> 院本部
-- legacy_id '2' -> 課務組
-- legacy_id '4' -> 師培中心
-- legacy_id '7' -> 特教中心 (Note: Old spaces.sql used '7' for some rooms, mapping to 特教中心 based on admin_units.sql)
-- legacy_id '11' -> 心理諮商系
-- legacy_id '13' -> 幼教系
-- legacy_id '14' -> 運科系
-- legacy_id '16' -> 教科系

INSERT INTO rooms (name, description, capacity, unavailable_periods, floor, room_type, admin_dept_id, legacy_id)
VALUES
('國際會議廳', 'B111 (Meeting)', 150, '[]', 'B1F', 'Meeting', (select id from departments where legacy_id='1'), 2),
('舞蹈教室', 'B117 (Teaching)', 30, '[]', 'B1F', 'Teaching', (select id from departments where legacy_id='14'), 5),
('舞蹈教室', 'B116 (Teaching)', 30, '[]', 'B1F', 'Teaching', (select id from departments where legacy_id='14'), 6),
('環境教室', 'B102B (Teaching)', 120, '[]', 'B1F', 'Teaching', (select id from departments where legacy_id='1'), 7),
('普通教室', 'B103 (Teaching)', 40, '[]', 'B1F', 'Teaching', (select id from departments where legacy_id='13'), 8),
('保育教室', 'B108 (Teaching)', 40, '[]', 'B1F', 'Teaching', (select id from departments where legacy_id='13'), 9),
('創客空間', 'B109 (Teaching)', 40, '[]', 'B1F', 'Teaching', (select id from departments where legacy_id='1'), 10),
('微觀教室', '102 (Teaching)', 40, '[]', '1F', 'Teaching', (select id from departments where legacy_id='4'), 11),
('普通教室', '201 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='7'), 12),
('普通教室', '209 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='11'), 13),
('普通教室', '225 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='16'), 14),
('音樂多功能教室兼團體動力室', '227 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='1'), 15),
('普通教室-華德福情境教室', '229 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='4'), 16),
('普通教室-特教系資源教室', '230 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='1'), 17),
('普通教室-幼教系情境教室', '231 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='1'), 18),
('普通教室-教科系情境教室', '234 (Teaching)', 40, '[]', '2F', 'Teaching', (select id from departments where legacy_id='1'), 19),
('圖書室', '301 (Other)', 40, '[]', '3F', 'Other', (select id from departments where legacy_id='1'), 20),
('電腦教室', '302 (Teaching)', 50, '[]', '3F', 'Teaching', (select id from departments where legacy_id='1'), 21),
('碩博士研究生空間', '304 (Other)', 50, '[]', '3F', 'Other', (select id from departments where legacy_id='1'), 22),
('團體動力、諮商室', '305 (Teaching)', 50, '[]', '3F', 'Teaching', (select id from departments where legacy_id='1'), 23),
('電腦教室', '306 (Teaching)', 32, '[]', '3F', 'Teaching', (select id from departments where legacy_id='1'), 24),
('電腦教室', '307 (Teaching)', 42, '[]', '3F', 'Teaching', (select id from departments where legacy_id='1'), 25),
('研討室', '318 (Teaching)', 42, '[]', '3F', 'Teaching', (select id from departments where legacy_id='2'), 26),
('實驗教室', '321 (Teaching)', 42, '[]', '3F', 'Teaching', (select id from departments where legacy_id='1'), 27),
('實驗教室', '322 (Teaching)', 42, '[]', '3F', 'Teaching', (select id from departments where legacy_id='1'), 28);
