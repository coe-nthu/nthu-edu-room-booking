-- Insert legacy spaces data into Supabase rooms table
INSERT INTO rooms (name, description, capacity, is_lunch_locked, equipment)
VALUES
('國際會議廳', 'B111 - B1F (Meeting)', 150, false, '{"floor": "B1F", "type": "Meeting", "admin_unit": "1", "legacy_id": 2}'),
('舞蹈教室', 'B117 - B1F (Teaching)', 30, false, '{"floor": "B1F", "type": "Teaching", "admin_unit": "14", "legacy_id": 5}'),
('舞蹈教室', 'B116 - B1F (Teaching)', 30, false, '{"floor": "B1F", "type": "Teaching", "admin_unit": "14", "legacy_id": 6}'),
('環境教室', 'B102B - B1F (Teaching)', 120, false, '{"floor": "B1F", "type": "Teaching", "admin_unit": "1", "legacy_id": 7}'),
('普通教室', 'B103 - B1F (Teaching)', 40, false, '{"floor": "B1F", "type": "Teaching", "admin_unit": "13", "legacy_id": 8}'),
('保育教室', 'B108 - B1F (Teaching)', 40, false, '{"floor": "B1F", "type": "Teaching", "admin_unit": "13", "legacy_id": 9}'),
('創客空間', 'B109 - B1F (Teaching)', 40, false, '{"floor": "B1F", "type": "Teaching", "admin_unit": "1", "legacy_id": 10}'),
('微觀教室', '102 - 1F (Teaching)', 40, false, '{"floor": "1F", "type": "Teaching", "admin_unit": "4", "legacy_id": 11}'),
('普通教室', '201 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "7", "legacy_id": 12}'),
('普通教室', '209 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "11", "legacy_id": 13}'),
('普通教室', '225 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "16", "legacy_id": 14}'),
('音樂多功能教室兼團體動力室', '227 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "1", "legacy_id": 15}'),
('普通教室-華德福情境教室', '229 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "4", "legacy_id": 16}'),
('普通教室-特教系資源教室', '230 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "1", "legacy_id": 17}'),
('普通教室-幼教系情境教室', '231 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "1", "legacy_id": 18}'),
('普通教室-教科系情境教室', '234 - 2F (Teaching)', 40, false, '{"floor": "2F", "type": "Teaching", "admin_unit": "1", "legacy_id": 19}'),
('圖書室', '301 - 3F (Other)', 40, false, '{"floor": "3F", "type": "Other", "admin_unit": "1", "legacy_id": 20}'),
('電腦教室', '302 - 3F (Teaching)', 50, false, '{"floor": "3F", "type": "Teaching", "admin_unit": "1", "legacy_id": 21}'),
('碩博士研究生空間', '304 - 3F (Other)', 50, false, '{"floor": "3F", "type": "Other", "admin_unit": "1", "legacy_id": 22}'),
('團體動力、諮商室', '305 - 3F (Teaching)', 50, false, '{"floor": "3F", "type": "Teaching", "admin_unit": "1", "legacy_id": 23}'),
('電腦教室', '306 - 3F (Teaching)', 32, false, '{"floor": "3F", "type": "Teaching", "admin_unit": "1", "legacy_id": 24}'),
('電腦教室', '307 - 3F (Teaching)', 42, false, '{"floor": "3F", "type": "Teaching", "admin_unit": "1", "legacy_id": 25}'),
('研討室', '318 - 3F (Teaching)', 42, false, '{"floor": "3F", "type": "Teaching", "admin_unit": "2", "legacy_id": 26}'),
('實驗教室', '321 - 3F (Teaching)', 42, false, '{"floor": "3F", "type": "Teaching", "admin_unit": "1", "legacy_id": 27}'),
('實驗教室', '322 - 3F (Teaching)', 42, false, '{"floor": "3F", "type": "Teaching", "admin_unit": "1", "legacy_id": 28}');

