-- JUNGLE JIU-JITSU - Full Database Setup
-- DANGER: destructive legacy setup script.
-- Do not run this against production. It drops application tables.
-- Keep only for disposable local/staging rebuilds.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.contents CASCADE;
DROP TABLE IF EXISTS public.attendances CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.belt_rank(text) CASCADE;
DROP FUNCTION IF EXISTS public.approve_check_in(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reject_check_in(uuid, uuid) CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'student')),
  full_name text,
  email text UNIQUE,
  belt text NOT NULL DEFAULT 'WHITE' CHECK (belt IN ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK')),
  grade int NOT NULL DEFAULT 0 CHECK (grade BETWEEN 0 AND 4),
  total_classes int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create check_ins table
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  validated_by uuid REFERENCES public.profiles(id),
  validated_at timestamptz
);

-- Create attendances table
CREATE TABLE public.attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  source text NOT NULL DEFAULT 'student_checkin' CHECK (source IN ('student_checkin', 'admin_manual'))
);

-- Create contents table
CREATE TABLE public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_url text NOT NULL,
  min_belt text NOT NULL DEFAULT 'WHITE' CHECK (min_belt IN ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_check_ins_student_status ON public.check_ins(student_id, status, created_at DESC);
CREATE INDEX idx_attendances_student ON public.attendances(student_id, created_at DESC);
CREATE INDEX idx_contents_min_belt ON public.contents(min_belt);
CREATE INDEX idx_announcements_created ON public.announcements(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create belt_rank function
CREATE OR REPLACE FUNCTION public.belt_rank(belt_name text)
RETURNS int
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE belt_name
    WHEN 'WHITE' THEN 1
    WHEN 'BLUE' THEN 2
    WHEN 'PURPLE' THEN 3
    WHEN 'BROWN' THEN 4
    WHEN 'BLACK' THEN 5
    ELSE 0
  END;
END;
$$;

-- Create approve_check_in function
CREATE OR REPLACE FUNCTION public.approve_check_in(checkin_id uuid, admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_status text;
  v_attendance_id uuid;
BEGIN
  -- Get check-in details
  SELECT student_id, status INTO v_student_id, v_status
  FROM public.check_ins
  WHERE id = checkin_id;

  -- Validate status is pending
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Check-in not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Check-in is already %', v_status;
  END IF;

  -- Update check-in to approved
  UPDATE public.check_ins
  SET status = 'approved',
      validated_by = admin_id,
      validated_at = now()
  WHERE id = checkin_id;

  -- Create attendance record
  INSERT INTO public.attendances (student_id, recorded_by, source)
  VALUES (v_student_id, admin_id, 'student_checkin')
  RETURNING id INTO v_attendance_id;

  -- Increment total_classes
  UPDATE public.profiles
  SET total_classes = total_classes + 1
  WHERE id = v_student_id;

  RETURN json_build_object(
    'success', true,
    'attendance_id', v_attendance_id
  );
END;
$$;

-- Create reject_check_in function
CREATE OR REPLACE FUNCTION public.reject_check_in(checkin_id uuid, admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
BEGIN
  -- Get check-in status
  SELECT status INTO v_status
  FROM public.check_ins
  WHERE id = checkin_id;

  -- Validate status is pending
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Check-in not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Check-in is already %', v_status;
  END IF;

  -- Update check-in to rejected
  UPDATE public.check_ins
  SET status = 'rejected',
      validated_by = admin_id,
      validated_at = now()
  WHERE id = checkin_id;

  RETURN json_build_object('success', true);
END;
$$;

-- RLS POLICIES

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- PROFILES POLICIES
CREATE POLICY "Students can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Students can update own full_name and email only"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    belt = (SELECT belt FROM public.profiles WHERE id = auth.uid()) AND
    grade = (SELECT grade FROM public.profiles WHERE id = auth.uid()) AND
    total_classes = (SELECT total_classes FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- CHECK_INS POLICIES
CREATE POLICY "Students can insert own check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own check-ins"
  ON public.check_ins FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all check-ins"
  ON public.check_ins FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all check-ins"
  ON public.check_ins FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ATTENDANCES POLICIES
CREATE POLICY "Students can view own attendances"
  ON public.attendances FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all attendances"
  ON public.attendances FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert attendances"
  ON public.attendances FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- CONTENTS POLICIES
CREATE POLICY "Students can view contents based on belt rank"
  ON public.contents FOR SELECT
  USING (
    public.belt_rank(min_belt) <= (
      SELECT public.belt_rank(belt)
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all contents"
  ON public.contents FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert contents"
  ON public.contents FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update contents"
  ON public.contents FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete contents"
  ON public.contents FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Everyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
