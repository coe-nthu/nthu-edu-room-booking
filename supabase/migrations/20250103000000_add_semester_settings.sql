-- Create semester_settings table for managing academic semesters and booking restrictions
-- This table stores semester dates and controls whether next semester booking is open

CREATE TABLE IF NOT EXISTS semester_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  semester_name TEXT NOT NULL UNIQUE,  -- e.g., "113-1", "113-2" or "上學期", "下學期"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_next_semester_open BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure end_date is after start_date
  CONSTRAINT valid_semester_dates CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE semester_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read semester settings
CREATE POLICY "Semester settings are viewable by everyone" ON semester_settings
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage semester settings" ON semester_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert default semester data
-- Using current year for demonstration; adjust years as needed
INSERT INTO semester_settings (semester_name, start_date, end_date, is_next_semester_open)
VALUES 
  ('上學期', '2024-09-01', '2024-12-31', false),
  ('下學期', '2025-02-01', '2025-06-30', false)
ON CONFLICT (semester_name) DO NOTHING;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_semester_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS semester_settings_updated_at ON semester_settings;
CREATE TRIGGER semester_settings_updated_at
  BEFORE UPDATE ON semester_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_semester_settings_updated_at();

