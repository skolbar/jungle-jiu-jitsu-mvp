-- Applied and validated in production on 2026-08-20.
-- Do not run against a database that has already received this change.
-- This is a source-of-truth record for the production security hardening.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.profile_self_update_is_safe(
  target_id uuid,
  next_email text,
  next_role text,
  next_belt text,
  next_degree integer,
  next_total_classes integer,
  next_cycle_classes integer,
  next_belt_locked boolean
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = target_id
      AND email IS NOT DISTINCT FROM next_email
      AND role IS NOT DISTINCT FROM next_role
      AND belt IS NOT DISTINCT FROM next_belt
      AND degree IS NOT DISTINCT FROM next_degree
      AND total_classes IS NOT DISTINCT FROM next_total_classes
      AND cycle_classes IS NOT DISTINCT FROM next_cycle_classes
      AND belt_locked IS NOT DISTINCT FROM next_belt_locked
  );
$$;

REVOKE ALL ON FUNCTION private.profile_self_update_is_safe(uuid, text, text, text, integer, integer, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.profile_self_update_is_safe(uuid, text, text, text, integer, integer, integer, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION private.profile_belt_lock_is_safe(
  target_id uuid,
  next_email text,
  next_role text,
  next_belt text,
  next_degree integer,
  next_total_classes integer,
  next_cycle_classes integer,
  next_belt_locked boolean
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = target_id
      AND role = 'student'
      AND COALESCE(belt_locked, false) = false
      AND email IS NOT DISTINCT FROM next_email
      AND role IS NOT DISTINCT FROM next_role
      AND total_classes IS NOT DISTINCT FROM next_total_classes
      AND cycle_classes IS NOT DISTINCT FROM next_cycle_classes
      AND next_belt IN ('white', 'blue', 'purple', 'brown', 'black')
      AND next_degree BETWEEN 0 AND 4
      AND next_belt_locked = true
  );
$$;

REVOKE ALL ON FUNCTION private.profile_belt_lock_is_safe(uuid, text, text, text, integer, integer, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.profile_belt_lock_is_safe(uuid, text, text, text, integer, integer, integer, boolean) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_total_classes_nonnegative CHECK (total_classes >= 0);
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_cycle_classes_nonnegative CHECK (cycle_classes >= 0);
ALTER TABLE public.profiles DROP COLUMN password;

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role and users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view permitted profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update permitted profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view permitted profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT private.is_admin((SELECT auth.uid()))));

CREATE POLICY "Authenticated users can update permitted profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT private.is_admin((SELECT auth.uid()))))
  WITH CHECK (
    (SELECT private.is_admin((SELECT auth.uid())))
    OR (
      id = (SELECT auth.uid())
      AND (
        private.profile_self_update_is_safe(id, email, role, belt, degree, total_classes, cycle_classes, belt_locked)
        OR private.profile_belt_lock_is_safe(id, email, role, belt, degree, total_classes, cycle_classes, belt_locked)
      )
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, belt, degree, total_classes, cycle_classes)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Novo Usuário'),
    NEW.email,
    'student',
    'white',
    0,
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.increment_profile_classes(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_profile_classes(uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.increment_total_classes(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_total_classes(uuid) TO service_role;

COMMIT;
