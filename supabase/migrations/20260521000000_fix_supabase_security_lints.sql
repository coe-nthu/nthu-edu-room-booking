-- Resolve Supabase security linter warnings for exposed functions and public buckets.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (private.is_admin());

DROP POLICY IF EXISTS "Admins can manage document download settings" ON public.document_download_settings;
CREATE POLICY "Admins can manage document download settings"
ON public.document_download_settings
FOR ALL
USING (private.is_admin())
WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "Visible document download files are viewable by everyone" ON public.document_download_files;
CREATE POLICY "Visible document download files are viewable by everyone"
ON public.document_download_files
FOR SELECT
USING (is_visible = TRUE OR private.is_admin());

DROP POLICY IF EXISTS "Admins can manage document download files" ON public.document_download_files;
CREATE POLICY "Admins can manage document download files"
ON public.document_download_files
FOR ALL
USING (private.is_admin())
WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "Give public access to document downloads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view maintenance files" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to room images" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload document downloads" ON storage.objects;
CREATE POLICY "Admins can upload document downloads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'document-downloads' AND private.is_admin());

DROP POLICY IF EXISTS "Admins can update document downloads" ON storage.objects;
CREATE POLICY "Admins can update document downloads"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'document-downloads' AND private.is_admin())
WITH CHECK (bucket_id = 'document-downloads' AND private.is_admin());

DROP POLICY IF EXISTS "Admins can delete document downloads" ON storage.objects;
CREATE POLICY "Admins can delete document downloads"
ON storage.objects
FOR DELETE
USING (bucket_id = 'document-downloads' AND private.is_admin());

DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.update_document_downloads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_user_type TEXT;
  v_supervisor_name TEXT;
  v_department_id INT;
  v_user_type_enum public.user_type_enum;
BEGIN
  v_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  v_phone := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '');
  v_user_type := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'user_type', '')), '');
  v_supervisor_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'supervisor_name', '')), '');
  v_department_id := NULL;

  IF COALESCE(TRIM(NEW.raw_user_meta_data->>'department_id'), '') <> '' THEN
    BEGIN
      v_department_id := (NEW.raw_user_meta_data->>'department_id')::INT;
    EXCEPTION
      WHEN OTHERS THEN
        v_department_id := NULL;
        RAISE WARNING 'Failed to convert department_id % to int: %',
          NEW.raw_user_meta_data->>'department_id', SQLERRM;
    END;
  END IF;

  v_user_type_enum := NULL;
  IF v_user_type IS NOT NULL THEN
    BEGIN
      IF v_user_type = 'teacher' THEN
        v_user_type_enum := 'teacher'::public.user_type_enum;
      ELSIF v_user_type = 'staff' THEN
        v_user_type_enum := 'staff'::public.user_type_enum;
      ELSIF v_user_type = 'assistant' THEN
        v_user_type_enum := 'assistant'::public.user_type_enum;
      ELSIF v_user_type = 'student' THEN
        v_user_type_enum := 'student'::public.user_type_enum;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_user_type_enum := NULL;
        RAISE WARNING 'Failed to convert user_type % to enum: %', v_user_type, SQLERRM;
    END;
  END IF;

  BEGIN
    INSERT INTO public.profiles (
      id,
      full_name,
      role,
      user_type,
      supervisor_name,
      phone,
      department_id,
      updated_at
    )
    VALUES (
      NEW.id,
      v_full_name,
      'user',
      v_user_type_enum,
      v_supervisor_name,
      v_phone,
      v_department_id,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
      supervisor_name = COALESCE(EXCLUDED.supervisor_name, profiles.supervisor_name),
      phone = COALESCE(EXCLUDED.phone, profiles.phone),
      department_id = COALESCE(EXCLUDED.department_id, profiles.department_id),
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create/update profile for user %: % (SQLSTATE: %)',
        NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.handle_new_user();
