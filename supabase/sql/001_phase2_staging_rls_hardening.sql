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

REVOKE ALL ON FUNCTION private.profile_belt_lock_is_safe(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.profile_belt_lock_is_safe(
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
DROP POLICY IF EXISTS "Authenticated users can view profiles by role" ON public.profiles;
DROP POLICY IF EXISTS "Students can update own full_name and email only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own safe profile fields" ON public.profiles;
DROP POLICY IF EXISTS "Students can lock own belt once" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles by role" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles by role"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT private.is_admin((SELECT auth.uid())))
  );

CREATE POLICY "Authenticated users can update profiles by role"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT private.is_admin((SELECT auth.uid())))
    OR id = (SELECT auth.uid())
  )
  WITH CHECK (
    (SELECT private.is_admin((SELECT auth.uid())))
    OR (
      id = (SELECT auth.uid())
      AND (
        private.profile_self_update_is_safe(
          id,
          email,
          role,
          belt,
          degree,
          total_classes,
          cycle_classes,
          belt_locked
        )
        OR private.profile_belt_lock_is_safe(
          id,
          email,
          role,
          belt,
          degree,
          total_classes,
          cycle_classes,
          belt_locked
        )
      )
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))));

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
GRANT UPDATE (
  email,
  full_name,
  belt,
  degree,
  total_classes,
  cycle_classes,
  avatar_url,
  belt_locked,
  updated_at
) ON TABLE public.profiles TO authenticated;
GRANT INSERT, DELETE ON TABLE public.profiles TO authenticated;

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
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

CREATE POLICY "Admins can update contents"
  ON public.contents
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

CREATE POLICY "Admins can delete contents"
  ON public.contents
  FOR DELETE
  TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))));

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
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

CREATE POLICY "Admins can update announcements"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Admins can insert attendances" ON public.attendances;
DROP POLICY IF EXISTS "Admins can view all attendances" ON public.attendances;
DROP POLICY IF EXISTS "Students can view own attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can view attendances by role" ON public.attendances;

CREATE POLICY "Authenticated users can view attendances by role"
  ON public.attendances
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR (SELECT private.is_admin((SELECT auth.uid())))
  );

CREATE POLICY "Admins can insert attendances"
  ON public.attendances
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Admins can update check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Students can create check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Students can view own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Authenticated users can view check-ins by role" ON public.check_ins;

CREATE POLICY "Authenticated users can view check-ins by role"
  ON public.check_ins
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR (SELECT private.is_admin((SELECT auth.uid())))
  );

CREATE POLICY "Students can create check-ins"
  ON public.check_ins
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "Admins can update check-ins"
  ON public.check_ins
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));

COMMIT;
