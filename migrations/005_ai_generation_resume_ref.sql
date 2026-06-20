-- RESUMEAI PRO - 005_AI_GENERATION_RESUME_REF.SQL
-- Migration script to add a foreign key resume reference to the ai_generations table.

ALTER TABLE public.ai_generations 
  ADD COLUMN IF NOT EXISTS resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE;
