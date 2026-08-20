-- Applied and validated in production on 2026-08-20.
-- This records the initial data model and storage rules for Parceiros Jungle.

BEGIN;

CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  logo_url text,
  cover_url text,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  benefit_title text NOT NULL DEFAULT '' CHECK (char_length(benefit_title) <= 160),
  benefit_description text NOT NULL DEFAULT '' CHECK (char_length(benefit_description) <= 1000),
  coupon_code text,
  whatsapp_url text,
  instagram_url text,
  website_url text,
  address text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  valid_until date,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX partners_active_display_order_idx
  ON public.partners (is_active, is_featured DESC, display_order, created_at DESC);
CREATE INDEX partners_slug_idx ON public.partners (slug);

CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.partners TO authenticated;

CREATE POLICY "Authenticated users can view active partners"
  ON public.partners FOR SELECT TO authenticated
  USING (
    (is_active = true AND (valid_until IS NULL OR valid_until >= CURRENT_DATE))
    OR (SELECT private.is_admin((SELECT auth.uid())))
  );
CREATE POLICY "Admins can insert partners"
  ON public.partners FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));
CREATE POLICY "Admins can update partners"
  ON public.partners FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT private.is_admin((SELECT auth.uid()))));
CREATE POLICY "Admins can delete partners"
  ON public.partners FOR DELETE TO authenticated
  USING ((SELECT private.is_admin((SELECT auth.uid()))));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('partner-media', 'partner-media', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Admins can upload partner media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-media' AND (SELECT private.is_admin((SELECT auth.uid()))));
CREATE POLICY "Admins can update partner media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'partner-media' AND (SELECT private.is_admin((SELECT auth.uid()))))
  WITH CHECK (bucket_id = 'partner-media' AND (SELECT private.is_admin((SELECT auth.uid()))));
CREATE POLICY "Admins can delete partner media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'partner-media' AND (SELECT private.is_admin((SELECT auth.uid()))));

COMMIT;
