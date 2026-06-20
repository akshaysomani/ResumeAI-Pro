-- RESUMEAI PRO - 006_ATS_MATCHER_ENHANCEMENTS.SQL
-- Migration script to add enhancements to job_matches tables.

ALTER TABLE public.job_matches 
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS match_breakdown jsonb;
