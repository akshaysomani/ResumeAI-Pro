"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { generateKeyAndHash } from "@/lib/api-auth";
import { sendTestWebhook } from "@/lib/webhook-dispatcher";
import { createResume } from "@/services/dbService";
import { saveResumeFullAction } from "./resumeActions";
import type {
  ApiKey,
  OAuthApp,
  WebhookEndpoint,
  WebhookDelivery,
  AutomationRule,
  AutomationExecution,
  IntegrationConfig,
  ImportRecord,
  ApiUsageStats,
} from "@/types";

// =============================================
// ENCRYPTION HELPERS FOR TOKENS
// =============================================
const ENCRYPTION_KEY = process.env.DATABASE_URL || "default-secret-key-32-chars-long-fallback!!!";
const encryptionKey = crypto.scryptSync(ENCRYPTION_KEY, "rai-salt", 32);

function encryptToken(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptToken(text: string): string {
  if (!text) return "";
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
  const decrypted = decipher.update(encryptedText);
  return Buffer.concat([decrypted, decipher.final()]).toString("utf8");
}

// =============================================
// 1. API KEYS ACTIONS
// =============================================

function mapApiKey(row: any): ApiKey {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes: row.scopes,
    rateLimitPerMinute: row.rate_limit_per_minute,
    rateLimitPerDay: row.rate_limit_per_day,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
    requestCount: parseInt(row.request_count, 10),
    isRevoked: row.is_revoked,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getApiKeysAction(userId: string): Promise<ApiKey[]> {
  try {
    const res = await db.query(
      `SELECT * FROM public.api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows.map(mapApiKey);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return [];
  }
}

export async function createApiKeyAction(
  userId: string,
  name: string,
  scopes: string[],
  expiresAt: string | null = null
): Promise<{ plainTextKey: string; key: ApiKey } | null> {
  try {
    const { plainTextKey, keyPrefix, keyHash } = generateKeyAndHash();

    const query = `
      INSERT INTO public.api_keys (
        user_id, name, key_hash, key_prefix, scopes, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const res = await db.query(query, [
      userId,
      name,
      keyHash,
      keyPrefix,
      scopes,
      expiresAt ? new Date(expiresAt) : null,
    ]);

    return {
      plainTextKey,
      key: mapApiKey(res.rows[0]),
    };
  } catch (error) {
    console.error("Error creating API key:", error);
    return null;
  }
}

export async function revokeApiKeyAction(keyId: string): Promise<boolean> {
  try {
    await db.query(
      `UPDATE public.api_keys SET is_revoked = TRUE, updated_at = NOW() WHERE id = $1`,
      [keyId]
    );
    return true;
  } catch (error) {
    console.error("Error revoking API key:", error);
    return false;
  }
}

// =============================================
// 2. OAUTH APPLICATIONS ACTIONS
// =============================================

function mapOAuthApp(row: any): OAuthApp {
  return {
    id: row.id,
    userId: row.user_id,
    appName: row.app_name,
    description: row.description,
    clientId: row.client_id,
    redirectUris: row.redirect_uris,
    scopes: row.scopes,
    homepageUrl: row.homepage_url,
    logoUrl: row.logo_url,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getOAuthAppsAction(userId: string): Promise<OAuthApp[]> {
  try {
    const res = await db.query(
      `SELECT * FROM public.oauth_apps WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows.map(mapOAuthApp);
  } catch (error) {
    console.error("Error fetching OAuth apps:", error);
    return [];
  }
}

export async function createOAuthAppAction(
  userId: string,
  params: {
    appName: string;
    description?: string;
    redirectUris: string[];
    scopes: string[];
    homepageUrl?: string;
    logoUrl?: string;
  }
): Promise<{ clientSecret: string; app: OAuthApp } | null> {
  try {
    const clientId = crypto.randomBytes(16).toString("hex"); // 32 chars
    const clientSecret = crypto.randomBytes(32).toString("hex"); // 64 chars
    const secretHash = crypto.createHash("sha256").update(clientSecret).digest("hex");

    const query = `
      INSERT INTO public.oauth_apps (
        user_id, app_name, description, client_id, client_secret_hash, 
        redirect_uris, scopes, homepage_url, logo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const res = await db.query(query, [
      userId,
      params.appName,
      params.description || null,
      clientId,
      secretHash,
      params.redirectUris,
      params.scopes,
      params.homepageUrl || null,
      params.logoUrl || null,
    ]);

    return {
      clientSecret,
      app: mapOAuthApp(res.rows[0]),
    };
  } catch (error) {
    console.error("Error creating OAuth app:", error);
    return null;
  }
}

export async function deleteOAuthAppAction(appId: string): Promise<boolean> {
  try {
    await db.query(`DELETE FROM public.oauth_apps WHERE id = $1`, [appId]);
    return true;
  } catch (error) {
    console.error("Error deleting OAuth app:", error);
    return false;
  }
}

// =============================================
// 3. WEBHOOK ENDPOINTS ACTIONS
// =============================================

function mapWebhookEndpoint(row: any): WebhookEndpoint {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    url: row.url,
    description: row.description,
    signingSecret: row.signing_secret,
    events: row.events,
    isActive: row.is_active,
    failureCount: row.failure_count,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapWebhookDelivery(row: any): WebhookDelivery {
  return {
    id: row.id,
    endpointId: row.endpoint_id,
    eventType: row.event_type,
    payload: row.payload,
    status: row.status,
    responseCode: row.response_code,
    responseBody: row.response_body,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    nextRetryAt: row.next_retry_at ? new Date(row.next_retry_at).toISOString() : null,
    deliveredAt: row.delivered_at ? new Date(row.delivered_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getWebhookEndpointsAction(
  userId: string,
  organizationId: string | null = null
): Promise<WebhookEndpoint[]> {
  try {
    const query = organizationId
      ? `SELECT * FROM public.webhook_endpoints WHERE organization_id = $1 ORDER BY created_at DESC`
      : `SELECT * FROM public.webhook_endpoints WHERE user_id = $1 AND organization_id IS NULL ORDER BY created_at DESC`;
    const params = organizationId ? [organizationId] : [userId];
    const res = await db.query(query, params);
    return res.rows.map(mapWebhookEndpoint);
  } catch (error) {
    console.error("Error fetching webhook endpoints:", error);
    return [];
  }
}

export async function createWebhookEndpointAction(
  userId: string,
  organizationId: string | null,
  url: string,
  description: string,
  events: string[]
): Promise<WebhookEndpoint | null> {
  try {
    const signingSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const query = `
      INSERT INTO public.webhook_endpoints (
        user_id, organization_id, url, description, signing_secret, events
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const res = await db.query(query, [userId, organizationId, url, description, signingSecret, events]);
    return mapWebhookEndpoint(res.rows[0]);
  } catch (error) {
    console.error("Error creating webhook endpoint:", error);
    return null;
  }
}

export async function updateWebhookEndpointAction(
  endpointId: string,
  updates: {
    url?: string;
    description?: string;
    events?: string[];
    isActive?: boolean;
  }
): Promise<WebhookEndpoint | null> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.url !== undefined) {
      fields.push(`url = $${paramIndex++}`);
      values.push(updates.url);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.events !== undefined) {
      fields.push(`events = $${paramIndex++}`);
      values.push(updates.events);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) return null;

    values.push(endpointId);
    const query = `
      UPDATE public.webhook_endpoints 
      SET ${fields.join(", ")}, updated_at = NOW() 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const res = await db.query(query, values);
    return mapWebhookEndpoint(res.rows[0]);
  } catch (error) {
    console.error("Error updating webhook endpoint:", error);
    return null;
  }
}

export async function deleteWebhookEndpointAction(endpointId: string): Promise<boolean> {
  try {
    await db.query(`DELETE FROM public.webhook_endpoints WHERE id = $1`, [endpointId]);
    return true;
  } catch (error) {
    console.error("Error deleting webhook endpoint:", error);
    return false;
  }
}

export async function getWebhookDeliveriesAction(endpointId: string): Promise<WebhookDelivery[]> {
  try {
    const res = await db.query(
      `SELECT * FROM public.webhook_deliveries WHERE endpoint_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [endpointId]
    );
    return res.rows.map(mapWebhookDelivery);
  } catch (error) {
    console.error("Error fetching webhook deliveries:", error);
    return [];
  }
}

export async function triggerTestWebhookAction(endpointId: string): Promise<boolean> {
  try {
    const res = await sendTestWebhook(endpointId);
    return res.success;
  } catch (error) {
    console.error("Error triggering test webhook:", error);
    return false;
  }
}

// =============================================
// 4. AUTOMATION RULES ACTIONS
// =============================================

function mapAutomationRule(row: any): AutomationRule {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    triggerEvent: row.trigger_event,
    triggerConditions: row.trigger_conditions,
    actionType: row.action_type,
    actionConfig: row.action_config,
    isActive: row.is_active,
    executionCount: parseInt(row.execution_count, 10),
    lastExecutedAt: row.last_executed_at ? new Date(row.last_executed_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapAutomationExecution(row: any): AutomationExecution {
  return {
    id: row.id,
    ruleId: row.rule_id,
    triggerData: row.trigger_data,
    actionResult: row.action_result,
    status: row.status,
    errorMessage: row.error_message,
    durationMs: row.duration_ms,
    createdAt: new Date(row.created_at).toISOString(),
    ruleName: row.rule_name,
  };
}

export async function getAutomationRulesAction(
  userId: string,
  organizationId: string | null = null
): Promise<AutomationRule[]> {
  try {
    const query = organizationId
      ? `SELECT * FROM public.automation_rules WHERE organization_id = $1 ORDER BY created_at DESC`
      : `SELECT * FROM public.automation_rules WHERE user_id = $1 AND organization_id IS NULL ORDER BY created_at DESC`;
    const params = organizationId ? [organizationId] : [userId];
    const res = await db.query(query, params);
    return res.rows.map(mapAutomationRule);
  } catch (error) {
    console.error("Error fetching automation rules:", error);
    return [];
  }
}

export async function createAutomationRuleAction(
  userId: string,
  organizationId: string | null,
  params: {
    name: string;
    description: string;
    triggerEvent: string;
    triggerConditions: any;
    actionType: string;
    actionConfig: any;
  }
): Promise<AutomationRule | null> {
  try {
    const query = `
      INSERT INTO public.automation_rules (
        user_id, organization_id, name, description, trigger_event, 
        trigger_conditions, action_type, action_config
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const res = await db.query(query, [
      userId,
      organizationId,
      params.name,
      params.description,
      params.triggerEvent,
      JSON.stringify(params.triggerConditions || {}),
      params.actionType,
      JSON.stringify(params.actionConfig || {}),
    ]);
    return mapAutomationRule(res.rows[0]);
  } catch (error) {
    console.error("Error creating automation rule:", error);
    return null;
  }
}

export async function updateAutomationRuleAction(
  ruleId: string,
  updates: {
    name?: string;
    description?: string;
    triggerConditions?: any;
    actionType?: string;
    actionConfig?: any;
    isActive?: boolean;
  }
): Promise<AutomationRule | null> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.triggerConditions !== undefined) {
      fields.push(`trigger_conditions = $${paramIndex++}`);
      values.push(JSON.stringify(updates.triggerConditions));
    }
    if (updates.actionType !== undefined) {
      fields.push(`action_type = $${paramIndex++}`);
      values.push(updates.actionType);
    }
    if (updates.actionConfig !== undefined) {
      fields.push(`action_config = $${paramIndex++}`);
      values.push(JSON.stringify(updates.actionConfig));
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) return null;

    values.push(ruleId);
    const query = `
      UPDATE public.automation_rules 
      SET ${fields.join(", ")}, updated_at = NOW() 
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    const res = await db.query(query, values);
    return mapAutomationRule(res.rows[0]);
  } catch (error) {
    console.error("Error updating automation rule:", error);
    return null;
  }
}

export async function deleteAutomationRuleAction(ruleId: string): Promise<boolean> {
  try {
    await db.query(`DELETE FROM public.automation_rules WHERE id = $1`, [ruleId]);
    return true;
  } catch (error) {
    console.error("Error deleting automation rule:", error);
    return false;
  }
}

export async function getAutomationExecutionsAction(ruleId?: string): Promise<AutomationExecution[]> {
  try {
    const query = ruleId
      ? `SELECT e.*, r.name as rule_name 
         FROM public.automation_executions e 
         JOIN public.automation_rules r ON e.rule_id = r.id
         WHERE e.rule_id = $1 
         ORDER BY e.created_at DESC LIMIT 50`
      : `SELECT e.*, r.name as rule_name 
         FROM public.automation_executions e 
         JOIN public.automation_rules r ON e.rule_id = r.id
         ORDER BY e.created_at DESC LIMIT 50`;
    const params = ruleId ? [ruleId] : [];
    const res = await db.query(query, params);
    return res.rows.map(mapAutomationExecution);
  } catch (error) {
    console.error("Error fetching automation executions:", error);
    return [];
  }
}

// =============================================
// 5. INTEGRATIONS ACTIONS
// =============================================

function mapIntegrationConfig(row: any): IntegrationConfig {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    config: row.config,
    isConnected: row.is_connected,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getIntegrationConfigsAction(userId: string): Promise<IntegrationConfig[]> {
  try {
    const res = await db.query(
      `SELECT id, user_id, provider, config, is_connected, last_synced_at, created_at, updated_at 
       FROM public.integration_configs 
       WHERE user_id = $1`,
      [userId]
    );
    return res.rows.map(mapIntegrationConfig);
  } catch (error) {
    console.error("Error fetching integration configs:", error);
    return [];
  }
}

export async function connectIntegrationAction(
  userId: string,
  provider: string,
  config: any,
  accessToken?: string,
  refreshToken?: string
): Promise<IntegrationConfig | null> {
  try {
    const encryptedAccess = accessToken ? encryptToken(accessToken) : null;
    const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null;

    const query = `
      INSERT INTO public.integration_configs (
        user_id, provider, config, access_token_encrypted, refresh_token_encrypted, is_connected, last_synced_at
      ) VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
      ON CONFLICT (user_id, provider) DO UPDATE SET
        config = EXCLUDED.config,
        access_token_encrypted = EXCLUDED.access_token_encrypted,
        refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
        is_connected = TRUE,
        last_synced_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;
    const res = await db.query(query, [
      userId,
      provider,
      JSON.stringify(config || {}),
      encryptedAccess,
      encryptedRefresh,
    ]);

    return mapIntegrationConfig(res.rows[0]);
  } catch (error) {
    console.error("Error connecting integration:", error);
    return null;
  }
}

export async function disconnectIntegrationAction(userId: string, provider: string): Promise<boolean> {
  try {
    await db.query(
      `UPDATE public.integration_configs 
       SET is_connected = FALSE, 
           access_token_encrypted = NULL, 
           refresh_token_encrypted = NULL, 
           updated_at = NOW() 
       WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );
    return true;
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    return false;
  }
}

// =============================================
// 6. RESUME IMPORT ACTIONS
// =============================================

function mapImportRecord(row: any): ImportRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sourceType: row.source_type,
    sourceName: row.source_name,
    fileSizeBytes: row.file_size_bytes ? parseInt(row.file_size_bytes, 10) : null,
    status: row.status,
    resumeId: row.resume_id,
    parsedData: row.parsed_data,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getImportHistoryAction(userId: string): Promise<ImportRecord[]> {
  try {
    const res = await db.query(
      `SELECT * FROM public.import_history WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows.map(mapImportRecord);
  } catch (error) {
    console.error("Error fetching import history:", error);
    return [];
  }
}

export async function createImportRecordAction(
  userId: string,
  sourceType: string,
  sourceName: string,
  fileSizeBytes: number | null = null
): Promise<ImportRecord | null> {
  try {
    const query = `
      INSERT INTO public.import_history (
        user_id, source_type, source_name, file_size_bytes, status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;
    const res = await db.query(query, [userId, sourceType, sourceName, fileSizeBytes]);
    return mapImportRecord(res.rows[0]);
  } catch (error) {
    console.error("Error creating import record:", error);
    return null;
  }
}

export async function updateImportRecordAction(
  importId: string,
  status: "pending" | "processing" | "completed" | "failed",
  resumeId: string | null = null,
  parsedData: any = null,
  errorMessage: string | null = null
): Promise<ImportRecord | null> {
  try {
    const query = `
      UPDATE public.import_history 
      SET status = $1, resume_id = $2, parsed_data = $3, error_message = $4 
      WHERE id = $5
      RETURNING *
    `;
    const res = await db.query(query, [
      status,
      resumeId,
      parsedData ? JSON.stringify(parsedData) : null,
      errorMessage,
      importId,
    ]);
    return mapImportRecord(res.rows[0]);
  } catch (error) {
    console.error("Error updating import record:", error);
    return null;
  }
}

// =============================================
// 7. API ANALYTICS ACTIONS
// =============================================

export async function getApiAnalyticsAction(userId: string): Promise<ApiUsageStats> {
  try {
    // 1. Total requests across all keys of this user
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM public.api_usage_logs l
      JOIN public.api_keys k ON l.api_key_id = k.id
      WHERE k.user_id = $1
    `;
    const totalRes = await db.query(totalQuery, [userId]);
    const totalRequests = parseInt(totalRes.rows[0].count, 10);

    // 2. Requests in the last 24 hours
    const todayQuery = `
      SELECT COUNT(*) as count 
      FROM public.api_usage_logs l
      JOIN public.api_keys k ON l.api_key_id = k.id
      WHERE k.user_id = $1 AND l.created_at >= NOW() - INTERVAL '24 hours'
    `;
    const todayRes = await db.query(todayQuery, [userId]);
    const totalToday = parseInt(todayRes.rows[0].count, 10);

    // 3. Average latency
    const latencyQuery = `
      SELECT AVG(latency_ms) as avg_latency 
      FROM public.api_usage_logs l
      JOIN public.api_keys k ON l.api_key_id = k.id
      WHERE k.user_id = $1
    `;
    const latencyRes = await db.query(latencyQuery, [userId]);
    const avgLatencyMs = Math.round(parseFloat(latencyRes.rows[0].avg_latency) || 0);

    // 4. Error rate (status >= 400)
    const errorQuery = `
      SELECT 
        COUNT(*) filter (where status_code >= 400) as errors,
        COUNT(*) as total
      FROM public.api_usage_logs l
      JOIN public.api_keys k ON l.api_key_id = k.id
      WHERE k.user_id = $1
    `;
    const errorRes = await db.query(errorQuery, [userId]);
    const errors = parseInt(errorRes.rows[0].errors, 10) || 0;
    const total = parseInt(errorRes.rows[0].total, 10) || 0;
    const errorRate = total > 0 ? parseFloat((errors / total).toFixed(4)) : 0;

    // 5. Top endpoints
    const endpointsQuery = `
      SELECT endpoint, COUNT(*) as count 
      FROM public.api_usage_logs l
      JOIN public.api_keys k ON l.api_key_id = k.id
      WHERE k.user_id = $1
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 5
    `;
    const endpointsRes = await db.query(endpointsQuery, [userId]);
    const topEndpoints = endpointsRes.rows.map((row) => ({
      endpoint: row.endpoint,
      count: parseInt(row.count, 10),
    }));

    // 6. Requests by day (last 7 days)
    const dailyQuery = `
      SELECT DATE(l.created_at) as date, COUNT(*) as count 
      FROM public.api_usage_logs l
      JOIN public.api_keys k ON l.api_key_id = k.id
      WHERE k.user_id = $1 AND l.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(l.created_at)
      ORDER BY DATE(l.created_at) ASC
    `;
    const dailyRes = await db.query(dailyQuery, [userId]);
    const requestsByDay = dailyRes.rows.map((row) => ({
      date: new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: parseInt(row.count, 10),
    }));

    return {
      totalRequests,
      totalToday,
      avgLatencyMs,
      errorRate,
      topEndpoints,
      requestsByDay,
    };
  } catch (error) {
    console.error("Error gathering API analytics:", error);
    return {
      totalRequests: 0,
      totalToday: 0,
      avgLatencyMs: 0,
      errorRate: 0,
      topEndpoints: [],
      requestsByDay: [],
    };
  }
}

// =============================================
// 8. RESUME IMPORT PIPELINES
// =============================================

export async function importGitHubProfileAction(
  userId: string,
  username: string,
  profileData: any,
  repos: any[]
): Promise<{ success: boolean; resumeId?: string; error?: string }> {
  const importRec = await createImportRecordAction(userId, "github", username, null);
  if (!importRec) {
    return { success: false, error: "Failed to create import history log" };
  }

  try {
    // 1. Create default resume
    const resumeId = await createResume(userId, `GitHub Profile - ${username}`, {
      colorTheme: "zinc",
      fontFamily: "sans",
      layoutStyle: "modern",
    });

    // 2. Build personal details
    const personal = {
      fullName: profileData.name || username,
      email: profileData.email || "",
      phone: "",
      location: profileData.location || "",
      website: profileData.blog || "",
      linkedinUrl: "",
      githubUrl: profileData.html_url || `https://github.com/${username}`,
      portfolioUrl: "",
      bio: profileData.bio || `GitHub developer profile sync for ${username}`,
    };

    // 3. Build projects
    const projects = (repos || []).slice(0, 8).map((repo: any) => ({
      title: repo.name,
      role: "Developer / Maintainer",
      url: repo.html_url,
      description: repo.description || `GitHub repository: ${repo.name}`,
      technologies: repo.language || "",
      githubUrl: repo.html_url,
      liveUrl: repo.homepage || "",
      startDate: "",
      endDate: "",
    }));

    // 4. Build skills
    const uniqueLangs = Array.from(
      new Set((repos || []).map((r) => r.language).filter(Boolean))
    ) as string[];
    const skills = uniqueLangs.map((lang) => ({
      name: lang,
      proficiency: "Expert",
      category: "Languages",
    }));

    // 5. Save all section details in a transaction-like wrapper
    await saveResumeFullAction(resumeId, {
      title: `GitHub Profile - ${username}`,
      description: profileData.bio || `GitHub developer profile sync for ${username}`,
      sections: [
        { id: "sec-personal", resumeId, sectionType: "personal", title: "Personal Information", orderIndex: 0, content: personal },
        { id: "sec-projects", resumeId, sectionType: "projects", title: "Projects", orderIndex: 5, content: projects },
        { id: "sec-skills", resumeId, sectionType: "skills", title: "Core Skills", orderIndex: 6, content: skills },
      ],
    });

    // 6. Update import status to completed
    await updateImportRecordAction(importRec.id, "completed", resumeId, { profileData, repoCount: repos.length });

    return { success: true, resumeId };
  } catch (error: any) {
    console.error("Error in importGitHubProfileAction:", error);
    await updateImportRecordAction(importRec.id, "failed", null, null, error?.message || String(error));
    return { success: false, error: error?.message || String(error) };
  }
}

export async function importRawJsonResumeAction(
  userId: string,
  fileName: string,
  jsonString: string
): Promise<{ success: boolean; resumeId?: string; error?: string }> {
  const byteSize = Buffer.byteLength(jsonString);
  const importRec = await createImportRecordAction(userId, "json", fileName, byteSize);
  if (!importRec) {
    return { success: false, error: "Failed to create import history log" };
  }

  try {
    const data = JSON.parse(jsonString);
    const title = data.title || `Imported Resume - ${fileName}`;
    const description = data.description || "Imported via JSON backup.";

    // Create the resume row
    const resumeId = await createResume(userId, title, {
      colorTheme: data.colorTheme || "zinc",
      fontFamily: data.fontFamily || "sans",
      layoutStyle: data.layoutStyle || "modern",
    });

    // Parse sections
    const sectionsToSave: any[] = [];
    if (data.sections && Array.isArray(data.sections)) {
      for (const sec of data.sections) {
        sectionsToSave.push({
          id: sec.id,
          resumeId,
          sectionType: sec.sectionType,
          title: sec.title,
          orderIndex: sec.orderIndex,
          content: sec.content,
        });
      }
    }

    // Save all details
    await saveResumeFullAction(resumeId, {
      title,
      description,
      sections: sectionsToSave,
    });

    await updateImportRecordAction(importRec.id, "completed", resumeId, { title, sectionCount: sectionsToSave.length });

    return { success: true, resumeId };
  } catch (error: any) {
    console.error("Error in importRawJsonResumeAction:", error);
    await updateImportRecordAction(importRec.id, "failed", null, null, error?.message || String(error));
    return { success: false, error: error?.message || String(error) };
  }
}
