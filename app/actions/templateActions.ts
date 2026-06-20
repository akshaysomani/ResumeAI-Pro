"use server";

import { db } from "@/lib/db";

/**
 * Checks if the user has an active Pro subscription.
 */
export async function getUserPlanAction(userId: string): Promise<"free" | "pro"> {
  try {
    const query = `
      SELECT status 
      FROM public.subscriptions 
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;
    const { rows } = await db.query(query, [userId]);
    return rows.length > 0 ? "pro" : "free";
  } catch (error) {
    console.error("Error checking subscription plan status:", error);
    return "free"; // Default to free on error
  }
}

/**
 * Retrieves the favorite and recently used templates lists for a user.
 */
export async function getTemplatePreferences(userId: string): Promise<{
  favoriteTemplates: string[];
  recentTemplates: string[];
}> {
  try {
    const query = `
      SELECT favorite_templates, recent_templates 
      FROM public.settings 
      WHERE user_id = $1
    `;
    const { rows } = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      // Auto-bootstrap settings table row for user
      const bootstrapQuery = `
        INSERT INTO public.settings (user_id, theme, language, timezone, notifications, privacy, email_preferences, favorite_templates, recent_templates)
        VALUES ($1, 'dark', 'en', 'UTC', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::text[], '{}'::text[])
        RETURNING favorite_templates, recent_templates
      `;
      const { rows: bootstrapRows } = await db.query(bootstrapQuery, [userId]);
      return {
        favoriteTemplates: bootstrapRows[0].favorite_templates || [],
        recentTemplates: bootstrapRows[0].recent_templates || [],
      };
    }

    return {
      favoriteTemplates: rows[0].favorite_templates || [],
      recentTemplates: rows[0].recent_templates || [],
    };
  } catch (error) {
    console.error("Error fetching template preferences:", error);
    return { favoriteTemplates: [], recentTemplates: [] };
  }
}

/**
 * Toggles a template's favorite status.
 */
export async function toggleFavoriteTemplateAction(
  userId: string,
  templateId: string
): Promise<string[]> {
  try {
    const prefs = await getTemplatePreferences(userId);
    const favorites = prefs.favoriteTemplates;
    
    let updated: string[];
    if (favorites.includes(templateId)) {
      updated = favorites.filter((id) => id !== templateId);
    } else {
      updated = [...favorites, templateId];
    }

    const query = `
      UPDATE public.settings 
      SET favorite_templates = $1 
      WHERE user_id = $2
    `;
    await db.query(query, [updated, userId]);
    return updated;
  } catch (error) {
    console.error("Error toggling favorite template status:", error);
    return [];
  }
}

/**
 * Adds a template slug to the user's recently used list.
 * Limits the stored list to the last 5 templates.
 */
export async function addRecentTemplateAction(
  userId: string,
  templateId: string
): Promise<string[]> {
  try {
    const prefs = await getTemplatePreferences(userId);
    const recents = prefs.recentTemplates;
    
    // Remove if already present, and prepend to index 0
    const filtered = recents.filter((id) => id !== templateId);
    const updated = [templateId, ...filtered].slice(0, 5);

    const query = `
      UPDATE public.settings 
      SET recent_templates = $1 
      WHERE user_id = $2
    `;
    await db.query(query, [updated, userId]);
    return updated;
  } catch (error) {
    console.error("Error adding template to recently used list:", error);
    return [];
  }
}
