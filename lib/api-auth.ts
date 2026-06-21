import crypto from "crypto";

export interface ApiKeyValidationResult {
  isValid: boolean;
  keyId?: string;
  userId?: string;
  scopes?: string[];
  error?: string;
}

/**
 * Generates a new API key and its hash.
 * Key format: rai_[8_chars_prefix]_[32_chars_secret]
 */
export function generateKeyAndHash(): {
  plainTextKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const prefix = crypto.randomBytes(4).toString("hex"); // 8 chars
  const secret = crypto.randomBytes(16).toString("hex"); // 32 chars
  const plainTextKey = `rai_${prefix}_${secret}`;
  const keyPrefix = `rai_${prefix}`;
  const keyHash = hashApiKey(plainTextKey);

  return {
    plainTextKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Generates a SHA-256 hash of the API key.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Validates an API key against the database, checking revocation and expiration.
 */
export async function validateApiKey(key: string): Promise<ApiKeyValidationResult> {
  if (!key || !key.startsWith("rai_")) {
    return { isValid: false, error: "Invalid key format" };
  }

  const hash = hashApiKey(key);

  try {
    const { db } = await import("./db");
    const query = `
      SELECT id, user_id, scopes, expires_at, is_revoked 
      FROM public.api_keys 
      WHERE key_hash = $1
      LIMIT 1
    `;
    const res = await db.query(query, [hash]);

    if (res.rows.length === 0) {
      return { isValid: false, error: "API key not found" };
    }

    const keyRow = res.rows[0];

    if (keyRow.is_revoked) {
      return { isValid: false, error: "API key has been revoked" };
    }

    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
      return { isValid: false, error: "API key has expired" };
    }

    // Update last used at and request count asynchronously (don't block the request)
    db.query(
      `UPDATE public.api_keys 
       SET last_used_at = NOW(), request_count = request_count + 1 
       WHERE id = $1`,
      [keyRow.id]
    ).catch((err) => console.error("Error updating key usage stats:", err));

    return {
      isValid: true,
      keyId: keyRow.id,
      userId: keyRow.user_id,
      scopes: keyRow.scopes,
    };
  } catch (error) {
    console.error("Database error validating API key:", error);
    return { isValid: false, error: "Internal server validation error" };
  }
}

/**
 * Checks if the API key has exceeded its rate limits.
 */
export async function checkRateLimit(
  keyId: string,
  limitPerMinute: number,
  limitPerDay: number
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const { db } = await import("./db");
    // 1. Minute Limit
    const minQuery = `
      SELECT COUNT(*) as count 
      FROM public.api_usage_logs 
      WHERE api_key_id = $1 
        AND created_at >= NOW() - INTERVAL '1 minute'
    `;
    const minRes = await db.query(minQuery, [keyId]);
    const minCount = parseInt(minRes.rows[0].count, 10);

    if (minCount >= limitPerMinute) {
      return {
        allowed: false,
        error: `Rate limit exceeded. Maximum ${limitPerMinute} requests per minute.`,
      };
    }

    // 2. Daily Limit
    const dayQuery = `
      SELECT COUNT(*) as count 
      FROM public.api_usage_logs 
      WHERE api_key_id = $1 
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;
    const dayRes = await db.query(dayQuery, [keyId]);
    const dayCount = parseInt(dayRes.rows[0].count, 10);

    if (dayCount >= limitPerDay) {
      return {
        allowed: false,
        error: `Daily quota exceeded. Maximum ${limitPerDay} requests per 24 hours.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking rate limits:", error);
    // Fail open or fail closed? Fail closed is safer for API billing, but fail open might be better for UX.
    // Let's allow for resilience in case of temp db load, but log it.
    return { allowed: true };
  }
}

/**
 * Logs API usage to the api_usage_logs table.
 */
export async function logApiUsage(params: {
  apiKeyId?: string;
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  requestBodySize?: number;
  responseBodySize?: number;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const { db } = await import("./db");
    const query = `
      INSERT INTO public.api_usage_logs (
        api_key_id, user_id, endpoint, method, status_code, 
        latency_ms, request_body_size, response_body_size, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await db.query(query, [
      params.apiKeyId || null,
      params.userId || null,
      params.endpoint,
      params.method,
      params.statusCode,
      params.latencyMs,
      params.requestBodySize || 0,
      params.responseBodySize || 0,
      params.ipAddress || null,
      params.userAgent || null,
    ]);
  } catch (error) {
    console.error("Error logging API usage:", error);
  }
}

/**
 * Signs a webhook payload using HMAC-SHA256.
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Higher-order helper to authenticate API routes, verify scopes, enforce rate limits, and log analytics.
 */
export async function withApiAuth(
  req: any,
  requiredScope: string,
  handler: (userId: string, keyId: string) => Promise<any>
): Promise<any> {
  const startTime = Date.now();
  const authHeader = req.headers.get("authorization");
  const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";
  
  let keyId: string | undefined;
  let userId: string | undefined;

  try {
    const { NextResponse } = await import("next/server");
    const { db } = await import("./db");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const res = NextResponse.json(
        { error: "Unauthorized: Missing or invalid Authorization header" },
        { status: 401 }
      );
      await logApiUsage({
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode: 401,
        latencyMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      });
      return res;
    }

    const token = authHeader.substring(7);
    const authResult = await validateApiKey(token);

    if (!authResult.isValid || !authResult.keyId || !authResult.userId) {
      const res = NextResponse.json(
        { error: `Unauthorized: ${authResult.error || "Invalid API key"}` },
        { status: 401 }
      );
      await logApiUsage({
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode: 401,
        latencyMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      });
      return res;
    }

    keyId = authResult.keyId;
    userId = authResult.userId;

    // Check scopes (must include either requiredScope, "*", or "admin")
    const hasScope =
      authResult.scopes?.includes(requiredScope) ||
      authResult.scopes?.includes("*") ||
      authResult.scopes?.includes("admin");

    if (!hasScope) {
      const res = NextResponse.json(
        { error: `Forbidden: Missing required scope '${requiredScope}'` },
        { status: 403 }
      );
      await logApiUsage({
        apiKeyId: keyId,
        userId,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode: 403,
        latencyMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      });
      return res;
    }

    // Get key settings to check rate limits
    const keyRes = await db.query(
      `SELECT rate_limit_per_minute, rate_limit_per_day FROM public.api_keys WHERE id = $1`,
      [keyId]
    );
    if (keyRes.rows.length === 0) {
      const res = NextResponse.json({ error: "Unauthorized: API key not active" }, { status: 401 });
      return res;
    }
    const { rate_limit_per_minute, rate_limit_per_day } = keyRes.rows[0];

    // Check rate limit
    const limitCheck = await checkRateLimit(keyId, rate_limit_per_minute, rate_limit_per_day);
    if (!limitCheck.allowed) {
      const res = NextResponse.json(
        { error: limitCheck.error || "Too Many Requests: Rate limit exceeded" },
        { status: 429 }
      );
      await logApiUsage({
        apiKeyId: keyId,
        userId,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode: 429,
        latencyMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      });
      return res;
    }

    // Call actual request handler
    const response = await handler(userId, keyId);
    
    // Log API usage analytics
    const latency = Date.now() - startTime;
    await logApiUsage({
      apiKeyId: keyId,
      userId,
      endpoint: req.nextUrl.pathname,
      method: req.method,
      statusCode: response.status,
      latencyMs: latency,
      ipAddress,
      userAgent,
    });

    return response;
  } catch (error: any) {
    console.error("Error in withApiAuth API wrapper:", error);
    const { NextResponse } = await import("next/server");
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    const latency = Date.now() - startTime;
    await logApiUsage({
      apiKeyId: keyId,
      userId,
      endpoint: req.nextUrl.pathname,
      method: req.method,
      statusCode: 500,
      latencyMs: latency,
      ipAddress,
      userAgent,
    });
    return res;
  }
}
