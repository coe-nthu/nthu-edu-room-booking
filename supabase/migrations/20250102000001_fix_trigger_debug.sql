-- Diagnostic and fix script for handle_new_user trigger
-- Run this in Supabase Dashboard SQL Editor

-- 1. Check if trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if function exists and its definition
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 3. Check if enum type exists
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'user_type_enum';

-- 4. Check profiles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

