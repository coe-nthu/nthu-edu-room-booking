-- Remove redundant email column from profiles
ALTER TABLE profiles
DROP COLUMN IF EXISTS email;

-- Ensure updated_at is automatically managed
ALTER TABLE profiles
ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Optional: backfill existing null updated_at values
UPDATE profiles
SET updated_at = timezone('utc'::text, now())
WHERE updated_at IS NULL;


