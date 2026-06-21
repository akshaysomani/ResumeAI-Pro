-- Migration 013: Enterprise API Platform, Integrations & Automation
-- Module 14 for ResumeAI Pro

BEGIN;

-- =============================================
-- 1. API KEYS
-- =============================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL DEFAULT 'Untitled Key',
  key_hash VARCHAR(128) NOT NULL UNIQUE,
  key_prefix VARCHAR(12) NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:resumes','read:templates','read:documents'],
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  rate_limit_per_day INT NOT NULL DEFAULT 1000,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  request_count BIGINT NOT NULL DEFAULT 0,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- =============================================
-- 2. OAUTH APPLICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.oauth_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_name VARCHAR(128) NOT NULL,
  description TEXT,
  client_id VARCHAR(64) NOT NULL UNIQUE,
  client_secret_hash VARCHAR(128) NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:resumes'],
  homepage_url VARCHAR(512),
  logo_url VARCHAR(512),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_apps_user ON public.oauth_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_apps_client ON public.oauth_apps(client_id);

-- =============================================
-- 3. OAUTH TOKENS
-- =============================================
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.oauth_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token_hash VARCHAR(128) NOT NULL,
  refresh_token_hash VARCHAR(128),
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_app ON public.oauth_tokens(app_id);

-- =============================================
-- 4. WEBHOOK ENDPOINTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID,
  url VARCHAR(2048) NOT NULL,
  description VARCHAR(256),
  signing_secret VARCHAR(128) NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['resume.created','resume.updated'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failure_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user ON public.webhook_endpoints(user_id);

-- =============================================
-- 5. WEBHOOK DELIVERIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  response_code INT,
  response_body TEXT,
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);

-- =============================================
-- 6. AUTOMATION RULES
-- =============================================
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(64) NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::JSONB,
  action_type VARCHAR(64) NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  execution_count BIGINT NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_user ON public.automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON public.automation_rules(trigger_event);

-- =============================================
-- 7. AUTOMATION EXECUTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  action_result JSONB NOT NULL DEFAULT '{}'::JSONB,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_rule ON public.automation_executions(rule_id);

-- =============================================
-- 8. INTEGRATION CONFIGURATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_user ON public.integration_configs(user_id);

-- =============================================
-- 9. IMPORT HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type VARCHAR(32) NOT NULL,
  source_name VARCHAR(256),
  file_size_bytes BIGINT,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  resume_id UUID,
  parsed_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_history_user ON public.import_history(user_id);

-- =============================================
-- 10. API USAGE LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id UUID,
  endpoint VARCHAR(256) NOT NULL,
  method VARCHAR(8) NOT NULL,
  status_code INT NOT NULL,
  latency_ms INT,
  request_body_size INT,
  response_body_size INT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key ON public.api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON public.api_usage_logs(created_at);

COMMIT;
