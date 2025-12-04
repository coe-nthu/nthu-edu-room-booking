-- Add user_type and supervisor_name columns to profiles table
-- user_type: 身份別 (教師、職員、助理、學生)
-- supervisor_name: 上司老師姓名 (僅學生需要)

-- Create enum type for user_type (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('teacher', 'staff', 'assistant', 'student');
    END IF;
END $$;

-- Add user_type column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE profiles ADD COLUMN user_type user_type_enum;
    END IF;
END $$;

-- Add supervisor_name column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'supervisor_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN supervisor_name TEXT;
    END IF;
END $$;

-- Update handle_new_user function to include new fields
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_val TEXT;
  user_type_enum_val user_type_enum;
BEGIN
  -- Safely extract user_type with NULL handling
  user_type_val := new.raw_user_meta_data->>'user_type';
  
  -- Safely convert to enum, default to NULL if invalid
  BEGIN
    IF user_type_val IS NOT NULL AND user_type_val != '' AND user_type_val IN ('teacher', 'staff', 'assistant', 'student') THEN
      user_type_enum_val := user_type_val::user_type_enum;
    ELSE
      user_type_enum_val := NULL;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If enum conversion fails, set to NULL
      user_type_enum_val := NULL;
  END;
  
  -- Insert profile with all fields
  -- Using SECURITY DEFINER bypasses RLS, but we still need to ensure the insert works
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role,
    user_type,
    supervisor_name,
    phone,
    updated_at
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'user',
    user_type_enum_val,
    NULLIF(new.raw_user_meta_data->>'supervisor_name', ''),
    NULLIF(new.raw_user_meta_data->>'phone', ''),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type,
    supervisor_name = EXCLUDED.supervisor_name,
    phone = EXCLUDED.phone,
    updated_at = EXCLUDED.updated_at;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    -- This allows the user to be created even if profile creation fails
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

