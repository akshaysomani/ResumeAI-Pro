"use server";

import { db } from "@/lib/db";
import crypto from "crypto";
import * as dbService from "@/services/dbService";
import type { Resume } from "@/types";
import { getResumeAction } from "./resumeActions";

/**
 * Hash a password using SHA-256 for secure storage and comparison
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Saves or updates sharing configuration for a resume.
 * Auto-generates a unique slug if not present.
 */
export async function saveShareSettingsAction(
  resumeId: string,
  data: {
    visibility: "public" | "private" | "password";
    password?: string;
    expiration?: string | null;
    downloadAllowed: boolean;
    printAllowed: boolean;
    isIndexable: boolean;
    uniqueSlug?: string;
  }
) {
  try {
    // 1. Verify resume exists
    const resume = await dbService.getResume(resumeId);
    if (!resume) throw new Error("Resume not found.");

    // 2. Generate slug if not provided
    let slug = data.uniqueSlug?.trim();
    if (!slug) {
      const personal = await dbService.getPersonalInformation(resumeId);
      const baseName = personal?.fullName || "resume";
      const slugified = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      slug = `${slugified}-${resumeId.substring(0, 8)}`;
    }

    // 3. Format password
    let passwordHash: string | null = null;
    if (data.visibility === "password" && data.password) {
      passwordHash = hashPassword(data.password);
    }

    // 4. Check if settings already exist
    const checkQuery = `SELECT id, password_hash FROM public.public_resume_links WHERE resume_id = $1`;
    const { rows } = await db.query(checkQuery, [resumeId]);

    const expirationVal = data.expiration ? new Date(data.expiration) : null;

    if (rows.length > 0) {
      // If we don't supply a new password in password mode, keep the old hash
      const finalHash =
        data.visibility === "password" && !data.password
          ? rows[0].password_hash
          : passwordHash;

      const updateQuery = `
        UPDATE public.public_resume_links
        SET unique_slug = $1, visibility = $2, password_hash = $3, 
            expiration = $4, download_allowed = $5, print_allowed = $6, is_indexable = $7
        WHERE resume_id = $8
        RETURNING unique_slug
      `;
      const values = [
        slug,
        data.visibility,
        finalHash,
        expirationVal,
        data.downloadAllowed,
        data.printAllowed,
        data.isIndexable,
        resumeId,
      ];
      const { rows: updateRows } = await db.query(updateQuery, values);
      return { success: true, slug: updateRows[0].unique_slug };
    } else {
      const insertQuery = `
        INSERT INTO public.public_resume_links (
          resume_id, unique_slug, visibility, password_hash, expiration, 
          download_allowed, print_allowed, is_indexable, view_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
        RETURNING unique_slug
      `;
      const values = [
        resumeId,
        slug,
        data.visibility,
        passwordHash,
        expirationVal,
        data.downloadAllowed,
        data.printAllowed,
        data.isIndexable,
      ];
      const { rows: insertRows } = await db.query(insertQuery, values);
      return { success: true, slug: insertRows[0].unique_slug };
    }
  } catch (error: any) {
    console.error("Error saving sharing settings:", error);
    return { success: false, error: error.message || "Failed to update sharing preferences" };
  }
}

/**
 * Fetches sharing settings for a resume.
 * Returns default configuration if no database row exists yet.
 */
export async function getShareSettingsAction(resumeId: string) {
  try {
    const query = `SELECT * FROM public.public_resume_links WHERE resume_id = $1`;
    const { rows } = await db.query(query, [resumeId]);

    if (rows.length === 0) {
      // Suggest default slug
      const personal = await dbService.getPersonalInformation(resumeId);
      const baseName = personal?.fullName || "resume";
      const slugified = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const suggestedSlug = `${slugified}-${resumeId.substring(0, 8)}`;

      return {
        exists: false,
        resumeId,
        uniqueSlug: suggestedSlug,
        visibility: "private" as const,
        expiration: null,
        downloadAllowed: true,
        printAllowed: true,
        isIndexable: true,
        viewCount: 0,
      };
    }

    const row = rows[0];
    return {
      exists: true,
      id: row.id,
      resumeId: row.resume_id,
      uniqueSlug: row.unique_slug,
      visibility: row.visibility,
      expiration: row.expiration ? new Date(row.expiration).toISOString() : null,
      downloadAllowed: row.download_allowed,
      printAllowed: row.print_allowed,
      isIndexable: row.is_indexable,
      viewCount: row.view_count,
    };
  } catch (error) {
    console.error("Error fetching sharing settings:", error);
    return null;
  }
}

/**
 * Fetches public resume by slug, verifying all locks (expiration, password verification, private visibility)
 */
export async function getPublicResumeBySlugAction(slug: string, passwordInput?: string) {
  try {
    // 1. Fetch link settings
    const linkQuery = `SELECT * FROM public.public_resume_links WHERE unique_slug = $1`;
    const { rows: linkRows } = await db.query(linkQuery, [slug]);
    if (linkRows.length === 0) {
      return { error: "not_found" };
    }

    const linkSettings = linkRows[0];

    // 2. Enforce Visibility Private
    if (linkSettings.visibility === "private") {
      return { error: "private" };
    }

    // 3. Enforce Expiration date
    if (linkSettings.expiration && new Date(linkSettings.expiration) < new Date()) {
      return { error: "expired" };
    }

    // 4. Enforce Password Access
    if (linkSettings.visibility === "password") {
      if (!passwordInput) {
        return { error: "password_required" };
      }
      const hashedInput = hashPassword(passwordInput);
      if (hashedInput !== linkSettings.password_hash) {
        return { error: "password_invalid" };
      }
    }

    // 5. Fetch full resume details
    const resumeId = linkSettings.resume_id;
    const resume = await getResumeAction(resumeId);
    if (!resume) {
      return { error: "not_found" };
    }

    return {
      success: true,
      resume,
      settings: {
        downloadAllowed: linkSettings.download_allowed,
        printAllowed: linkSettings.print_allowed,
        isIndexable: linkSettings.is_indexable,
        uniqueSlug: linkSettings.unique_slug,
      },
    };
  } catch (error: any) {
    console.error("Error loading shared resume:", error);
    return { error: "server_error" };
  }
}

/**
 * Log viewing, scanning, and downloading actions into public analytics.
 * Automatically handles parsing locations/browsers from user-agent inputs.
 */
export async function logShareAnalyticsAction(
  slug: string,
  actionType: "view" | "download" | "qr_scan",
  details: {
    deviceType?: string;
    browser?: string;
    country?: string;
    referrer?: string;
  } = {}
) {
  try {
    // 1. Retrieve link id
    const linkQuery = `SELECT id, view_count FROM public.public_resume_links WHERE unique_slug = $1`;
    const { rows } = await db.query(linkQuery, [slug]);
    if (rows.length === 0) return { success: false };

    const link = rows[0];

    // 2. Insert analytics row
    const insertQuery = `
      INSERT INTO public.resume_share_analytics (
        link_id, action_type, device_type, browser, country, referrer, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    await db.query(insertQuery, [
      link.id,
      actionType,
      details.deviceType || "desktop",
      details.browser || "chrome",
      details.country || "Unknown",
      details.referrer || "direct",
    ]);

    // 3. Increment primary views count if a standard page load
    if (actionType === "view") {
      const updateCountQuery = `
        UPDATE public.public_resume_links
        SET view_count = view_count + 1
        WHERE id = $1
      `;
      await db.query(updateCountQuery, [link.id]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error logging share analytics:", error);
    return { success: false };
  }
}

/**
 * Aggregates statistics for the user analytics panel
 */
export async function getShareAnalyticsDataAction(resumeId: string) {
  try {
    // 1. Fetch link info
    const linkQuery = `SELECT id, view_count FROM public.public_resume_links WHERE resume_id = $1`;
    const { rows: linkRows } = await db.query(linkQuery, [resumeId]);
    if (linkRows.length === 0) {
      return { totalViews: 0, totalDownloads: 0, totalScans: 0, devices: [], browsers: [], countries: [], referrers: [] };
    }
    const linkId = linkRows[0].id;
    const viewCount = linkRows[0].view_count;

    // 2. Total actions query
    const actionsQuery = `
      SELECT action_type, COUNT(*) as count
      FROM public.resume_share_analytics
      WHERE link_id = $1
      GROUP BY action_type
    `;
    const { rows: actionsRows } = await db.query(actionsQuery, [linkId]);
    
    let totalDownloads = 0;
    let totalScans = 0;
    
    actionsRows.forEach((r: any) => {
      if (r.action_type === "download") totalDownloads = parseInt(r.count, 10);
      if (r.action_type === "qr_scan") totalScans = parseInt(r.count, 10);
    });

    // 3. Device breakdown
    const deviceQuery = `
      SELECT device_type as name, COUNT(*) as value
      FROM public.resume_share_analytics
      WHERE link_id = $1 AND action_type = 'view'
      GROUP BY device_type
    `;
    const { rows: devices } = await db.query(deviceQuery, [linkId]);

    // 4. Browser breakdown
    const browserQuery = `
      SELECT browser as name, COUNT(*) as value
      FROM public.resume_share_analytics
      WHERE link_id = $1 AND action_type = 'view'
      GROUP BY browser
    `;
    const { rows: browsers } = await db.query(browserQuery, [linkId]);

    // 5. Country breakdown
    const countryQuery = `
      SELECT country as name, COUNT(*) as value
      FROM public.resume_share_analytics
      WHERE link_id = $1 AND action_type = 'view'
      GROUP BY country
    `;
    const { rows: countries } = await db.query(countryQuery, [linkId]);

    // 6. Referrer breakdown
    const referrerQuery = `
      SELECT referrer as name, COUNT(*) as value
      FROM public.resume_share_analytics
      WHERE link_id = $1 AND action_type = 'view'
      GROUP BY referrer
    `;
    const { rows: referrers } = await db.query(referrerQuery, [linkId]);

    return {
      totalViews: viewCount,
      totalDownloads,
      totalScans,
      devices: devices.map((d: any) => ({ name: d.name, value: parseInt(d.value, 10) })),
      browsers: browsers.map((b: any) => ({ name: b.name, value: parseInt(b.value, 10) })),
      countries: countries.map((c: any) => ({ name: c.name, value: parseInt(c.value, 10) })),
      referrers: referrers.map((r: any) => ({ name: r.name, value: parseInt(r.value, 10) })),
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return null;
  }
}

/**
 * Log download/export history events inside public.resume_exports
 */
export async function logResumeExportAction(
  resumeId: string,
  fileType: string,
  templateId: string,
  fileSize: number,
  versionNum: number
) {
  try {
    const resume = await dbService.getResume(resumeId);
    if (!resume) return false;

    const query = `
      INSERT INTO public.resume_exports (
        resume_id, file_url, file_type, template_id, file_size, user_id, resume_version, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;
    // Storing download reference (mock file url as internal trigger)
    const mockUrl = `/api/resumes/export-download?id=${resumeId}&type=${fileType}&ver=${versionNum}`;
    await db.query(query, [
      resumeId,
      mockUrl,
      fileType,
      templateId,
      fileSize,
      resume.userId,
      versionNum,
    ]);

    return true;
  } catch (error) {
    console.error("Error logging export download history:", error);
    return false;
  }
}

/**
 * Fetch download history logs for a resume
 */
export async function getResumeExportHistoryAction(resumeId: string) {
  try {
    const query = `
      SELECT id, file_type as "fileType", template_id as "templateId", 
             file_size as "fileSize", resume_version as "resumeVersion", created_at as "createdAt"
      FROM public.resume_exports
      WHERE resume_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const { rows } = await db.query(query, [resumeId]);
    return rows;
  } catch (error) {
    console.error("Error fetching export history:", error);
    return [];
  }
}

/**
 * Fetches previous snapshots list for version export selection
 */
export async function getResumeVersionsAction(resumeId: string) {
  try {
    const query = `
      SELECT id, version_number as "versionNumber", created_at as "createdAt", resume_data as "resumeData"
      FROM public.resume_versions
      WHERE resume_id = $1
      ORDER BY version_number DESC
    `;
    const { rows } = await db.query(query, [resumeId]);
    return rows;
  } catch (error) {
    console.error("Error fetching versions list:", error);
    return [];
  }
}

/**
 * Send resume sharing link directly to recipient email (Simulated Delivery)
 */
export async function sendResumeEmailAction(data: {
  recipientEmail: string;
  subject: string;
  message: string;
  resumeLink: string;
}) {
  try {
    // Input validation
    if (!data.recipientEmail || !data.subject || !data.message) {
      throw new Error("Recipient email, subject, and message are required.");
    }

    console.log(`[SIMULATED EMAIL DISPATCH]`);
    console.log(`To: ${data.recipientEmail}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Body:\n${data.message}\nLink: ${data.resumeLink}`);

    // Log the transaction in the console/db if necessary
    // Return success response to the client
    return { success: true };
  } catch (error: any) {
    console.error("Error sending share email:", error);
    return { success: false, error: error.message || "Failed to deliver email recruiter notice." };
  }
}
