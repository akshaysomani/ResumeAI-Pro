-- Migration: Add score_type to public.education
ALTER TABLE public.education ADD COLUMN IF NOT EXISTS score_type text;
