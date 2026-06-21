-- Migration 014: Enterprise Production Readiness (Feature Flags & Telemetry Logs)
-- Module 15 for ResumeAI Pro

BEGIN;

-- =============================================
-- 1. FEATURE FLAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percentage INT NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);

-- Seed default feature flags
INSERT INTO public.feature_flags (key, description, is_enabled, rollout_percentage) VALUES
  ('pwa-install', 'Controls PWA install banner displays and custom browser hooks', TRUE, 100),
  ('offline-editing', 'Enables background sync queues and offline cache loaders in the editor', TRUE, 100),
  ('beta-features', 'Enables access to experimental AI coaching models and workflows', FALSE, 25),
  ('premium-templates', 'Determines if premium resume design templates are locked behind billing plans', TRUE, 100)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 2. TELEMETRY LOGS FOR OBSERVABILITY
-- =============================================
CREATE TABLE IF NOT EXISTS public.app_telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type VARCHAR(32) NOT NULL, -- 'error', 'warning', 'security', 'performance', 'pwa'
  level VARCHAR(16) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_telemetry_logs_type ON public.app_telemetry_logs(type);
CREATE INDEX IF NOT EXISTS idx_app_telemetry_logs_created ON public.app_telemetry_logs(created_at);

-- Attach trigger for updated_at timestamps on feature_flags
DROP TRIGGER IF EXISTS trigger_update_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER trigger_update_feature_flags_updated_at 
  BEFORE UPDATE ON public.feature_flags 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

COMMIT;
