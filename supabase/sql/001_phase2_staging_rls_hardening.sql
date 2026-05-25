-- Jungle Jiu-Jitsu - Phase 2 RLS hardening
-- Safe-use note:
--   Run this first on a duplicated/staging Supabase environment.
--   Do not run directly in production before validating login, admin pages,
--   student pages, check-ins, attendances, graduation, contents and profile flows.

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
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = 'admin'
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

REVOKE ALL ON FUNCTION private.profile_self_update_is_safe(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.profile_self_update_is_safe(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  boolean
) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Students can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Students can update own full_name and email only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own safe profile fields" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Students can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

CREATE POLICY "Users can update own safe profile fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND private.profile_self_update_is_safe(
      id,
      email,
      role,
      belt,
      degree,
      total_classes,
      cycle_classes,
      belt_locked
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.profiles FROM authenticated;

GRANT SELECT (
  id,
  email,
  full_name,
  role,
  belt,
  degree,
  total_classes,
  cycle_classes,
  avatar_url,
  belt_locked,
  created_at,
  updated_at
) ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Anyone can view contents" ON public.contents;
DROP POLICY IF EXISTS "Everyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;

DROP POLICY IF EXISTS "Students can view contents based on belt rank" ON public.contents;
DROP POLICY IF EXISTS "Admins can view all contents" ON public.contents;
DROP POLICY IF EXISTS "Admins can insert contents" ON public.contents;
DROP POLICY IF EXISTS "Admins can update contents" ON public.contents;
DROP POLICY IF EXISTS "Admins can delete contents" ON public.contents;

CREATE POLICY "Authenticated users can view contents"
  ON public.contents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert contents"
  ON public.contents
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update contents"
  ON public.contents
  FOR UPDATE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete contents"
  ON public.contents
  FOR DELETE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

CREATE POLICY "Authenticated users can view announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert announcements"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update announcements"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (private.is_admin((SELECT auth.uid())));

COMMIT;
