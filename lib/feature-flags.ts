"use server";

import crypto from "crypto";
import { db } from "./db";

/**
 * Evaluates whether a feature flag is enabled for a given user.
 * Supports Boolean toggles and percentage-based rollout hashes.
 */
export async function getFeatureFlag(key: string, userId?: string | null): Promise<boolean> {
  try {
    const query = `SELECT is_enabled, rollout_percentage FROM public.feature_flags WHERE key = $1 LIMIT 1`;
    const res = await db.query(query, [key]);

    if (res.rows.length === 0) {
      return false; // Default off if flag not found
    }

    const { is_enabled, rollout_percentage } = res.rows[0];

    // If flag is completely disabled
    if (!is_enabled) {
      return false;
    }

    // If flag is 100% enabled
    if (rollout_percentage === 100) {
      return true;
    }

    // If gradual rollout is configured and a userId is provided
    if (userId) {
      const hash = crypto.createHash("md5").update(userId + key).digest("hex");
      const score = parseInt(hash.substring(0, 8), 16) % 100;
      return score < rollout_percentage;
    }

    // If rollout is partial but no user context, fail closed (default off)
    return false;
  } catch (error) {
    console.error(`Error evaluating feature flag '${key}':`, error);
    return false;
  }
}

/**
 * Centralized logging action that persists errors, warnings, performance metrics, and PWA events.
 */
export async function logTelemetryAction(params: {
  userId?: string | null;
  type: "error" | "warning" | "security" | "performance" | "pwa" | "offline";
  level?: "info" | "warning" | "error" | "critical";
  message: string;
  details?: any;
}): Promise<void> {
  const { userId = null, type, level = "info", message, details = {} } = params;

  try {
    const query = `
      INSERT INTO public.app_telemetry_logs (user_id, type, level, message, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [
      userId,
      type,
      level,
      message,
      JSON.stringify(details),
    ]);
  } catch (error) {
    // Fail silent locally to avoid recursive loops during DB crashes, but log to stderr
    console.error("Telemetry Logging failed:", error);
  }
}
