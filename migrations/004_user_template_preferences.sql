-- RESUMEAI PRO - 004_USER_TEMPLATE_PREFERENCES.SQL
-- Migration script to add user templates tracking arrays.

ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS favorite_templates text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS recent_templates text[] DEFAULT '{}'::text[];
