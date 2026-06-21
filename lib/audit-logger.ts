"use server";

import { db } from "./db";
import { headers } from "next/headers";

export async function logAuditEvent(params: {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  severity?: "info" | "warning" | "critical";
  details?: any;
}) {
  const { userId = null, action, entityType = null, entityId = null, severity = "info", details = {} } = params;

  let ipAddress = "127.0.0.1";
  let userAgent = "";

  try {
    const headersList = await headers();
    ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    userAgent = headersList.get("user-agent") || "";
  } catch (e) {
    // Fail silently when headers list is unavailable, e.g., in test contexts or build-time rendering
  }

  try {
    const query = `
      INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, severity, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await db.query(query, [
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      severity,
      JSON.stringify(details),
    ]);
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}
