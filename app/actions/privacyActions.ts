"use server";

import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit-logger";

export async function getUserConsentAction(userId: string) {
  try {
    const query = `SELECT * FROM public.user_consents WHERE user_id = $1`;
    const { rows } = await db.query(query, [userId]);
    if (rows.length > 0) {
      return {
        userId: rows[0].user_id,
        cookiesEssential: rows[0].cookies_essential,
        cookiesAnalytical: rows[0].cookies_analytical,
        cookiesMarketing: rows[0].cookies_marketing,
        dataRetentionDays: rows[0].data_retention_days,
        marketingEmails: rows[0].marketing_emails,
        consentVersion: rows[0].consent_version,
      };
    }
    
    // Seed defaults
    const insertQuery = `
      INSERT INTO public.user_consents (user_id, cookies_essential, cookies_analytical, cookies_marketing, marketing_emails, data_retention_days)
      VALUES ($1, true, false, false, false, 365)
      RETURNING *
    `;
    const { rows: inserted } = await db.query(insertQuery, [userId]);
    return {
      userId: inserted[0].user_id,
      cookiesEssential: inserted[0].cookies_essential,
      cookiesAnalytical: inserted[0].cookies_analytical,
      cookiesMarketing: inserted[0].cookies_marketing,
      dataRetentionDays: inserted[0].data_retention_days,
      marketingEmails: inserted[0].marketing_emails,
      consentVersion: inserted[0].consent_version,
    };
  } catch (err) {
    console.error("Failed to load user consent:", err);
    return {
      cookiesEssential: true,
      cookiesAnalytical: false,
      cookiesMarketing: false,
      marketingEmails: false,
      dataRetentionDays: 365,
    };
  }
}

export async function updateUserConsentAction(
  userId: string,
  data: {
    cookiesEssential: boolean;
    cookiesAnalytical: boolean;
    cookiesMarketing: boolean;
    marketingEmails: boolean;
    dataRetentionDays: number;
  }
) {
  try {
    const query = `
      INSERT INTO public.user_consents (
        user_id, cookies_essential, cookies_analytical, cookies_marketing, marketing_emails, data_retention_days, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        cookies_essential = EXCLUDED.cookies_essential,
        cookies_analytical = EXCLUDED.cookies_analytical,
        cookies_marketing = EXCLUDED.cookies_marketing,
        marketing_emails = EXCLUDED.marketing_emails,
        data_retention_days = EXCLUDED.data_retention_days,
        updated_at = NOW()
    `;
    await db.query(query, [
      userId,
      data.cookiesEssential,
      data.cookiesAnalytical,
      data.cookiesMarketing,
      data.marketingEmails,
      data.dataRetentionDays,
    ]);

    await logAuditEvent({
      userId,
      action: "user.privacy_settings_updated",
      entityType: "profile",
      entityId: userId,
      severity: "info",
      details: data,
    });
  } catch (err: any) {
    console.error("Failed to update user consent:", err);
    throw new Error(err.message || "Failed to save privacy settings.");
  }
}

export async function downloadUserDataAction(userId: string) {
  try {
    // 1. Fetch profile info
    const profileRes = await db.query(`SELECT * FROM public.profiles WHERE id = $1`, [userId]);
    if (profileRes.rows.length === 0) {
      throw new Error("Profile not found");
    }
    const profile = profileRes.rows[0];

    // 2. Fetch settings info
    const settingsRes = await db.query(`SELECT * FROM public.settings WHERE user_id = $1`, [userId]);
    const settings = settingsRes.rows[0] || null;

    // 3. Fetch consents info
    const consentsRes = await db.query(`SELECT * FROM public.user_consents WHERE user_id = $1`, [userId]);
    const consents = consentsRes.rows[0] || null;

    // 4. Fetch resumes info
    const resumesRes = await db.query(`SELECT * FROM public.resumes WHERE user_id = $1`, [userId]);
    const resumes = resumesRes.rows;

    // Log the data export event for audit trails
    await logAuditEvent({
      userId,
      action: "user.data_download",
      entityType: "profile",
      entityId: userId,
      severity: "info",
      details: { exportCount: resumes.length }
    });

    return {
      profile,
      settings,
      consents,
      resumes,
      exportedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("Failed to export user data:", err);
    throw new Error(err.message || "Failed to export user data");
  }
}

export async function deleteAccountAction(userId: string) {
  try {
    // 1. Audit log before delete (logged under action and user info details)
    await logAuditEvent({
      userId,
      action: "user.account_deleted",
      entityType: "profile",
      entityId: userId,
      severity: "critical",
      details: { message: `GDPR Purge requested for User ID: ${userId}` }
    });

    // 2. Delete user profile (triggers cascade deletes for resumes, settings, consents, etc.)
    await db.query(`DELETE FROM public.profiles WHERE id = $1`, [userId]);
    
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete user account:", err);
    throw new Error(err.message || "Failed to purge user account data");
  }
}
