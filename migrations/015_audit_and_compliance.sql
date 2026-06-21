-- RESUMEAI PRO - 015_AUDIT_AND_COMPLIANCE.SQL

-- 1. AUDIT LOGS TABLE FOR COMPLIANCE AND SECURITY TRACKING
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL, -- e.g., 'auth.login', 'billing.upgrade', 'resume.export', 'user.data_download', 'user.account_deleted'
  entity_type text, -- e.g., 'resume', 'billing', 'profile', 'organization'
  entity_id text,
  ip_address text,
  user_agent text,
  severity text DEFAULT 'info' NOT NULL, -- 'info', 'warning', 'critical'
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for speedy lookups in audit dashboard and compliance reviews
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 2. USER CONSENT & PRIVACY POLICY COMPLIANCE TABLE (GDPR / CCPA)
CREATE TABLE IF NOT EXISTS public.user_consents (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  cookies_essential boolean DEFAULT true NOT NULL,
  cookies_analytical boolean DEFAULT false NOT NULL,
  cookies_marketing boolean DEFAULT false NOT NULL,
  data_retention_days integer DEFAULT 365 NOT NULL,
  marketing_emails boolean DEFAULT false NOT NULL,
  consent_version text DEFAULT 'v1.0' NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
