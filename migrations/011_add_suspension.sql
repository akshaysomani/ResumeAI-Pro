-- RESUMEAI PRO - 011_ADD_SUSPENSION.SQL
-- Migration script to add suspension state column to user_roles.

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
