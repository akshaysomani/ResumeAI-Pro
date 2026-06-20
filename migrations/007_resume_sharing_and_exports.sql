-- RESUMEAI PRO - 007_RESUME_SHARING_AND_EXPORTS.SQL
-- Migration script to add support for granular sharing settings, download histories, and link tracking analytics.

---------------------------------------------------------
-- 1. EXTEND PUBLIC RESUME LINKS TABLE
---------------------------------------------------------
ALTER TABLE public.public_resume_links
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS download_allowed boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS print_allowed boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS is_indexable boolean DEFAULT true NOT NULL;

---------------------------------------------------------
-- 2. EXTEND RESUME EXPORTS TABLE FOR DOWNLOAD HISTORY
---------------------------------------------------------
ALTER TABLE public.resume_exports
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS file_size integer,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resume_version integer;

---------------------------------------------------------
-- 3. CREATE SHARE ENGAGEMENT ANALYTICS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_share_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id uuid REFERENCES public.public_resume_links(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL, -- 'view', 'download', 'qr_scan'
  device_type text,          -- 'desktop', 'mobile', 'tablet'
  browser text,              -- 'chrome', 'safari', 'firefox', etc.
  country text,              -- privacy-friendly country code (e.g. 'US', 'IN')
  referrer text,             -- e.g. 'linkedin', 'google', 'direct'
  time_viewed_seconds integer, -- duration candidate's public page was opened
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Optimize analytics query lookups
CREATE INDEX IF NOT EXISTS idx_share_analytics_link_id ON public.resume_share_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_share_analytics_action ON public.resume_share_analytics(action_type);
