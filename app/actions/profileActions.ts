"use server";

import { db } from "@/lib/db";
import type { UserProfile, UserSettings } from "@/types";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const query = `SELECT * FROM public.profiles WHERE id = $1`;
  const { rows } = await db.query(query, [userId]);
  if (rows.length === 0) return null;
  const data = rows[0];

  return {
    id: data.id,
    email: data.email || "",
    fullName: data.full_name || "",
    avatarUrl: data.avatar_url || "",
    headline: data.headline || "",
    summary: data.summary || "",
    website: data.website || "",
    github: data.github_url || "",
    linkedin: data.linkedin_url || "",
    portfolio: data.portfolio_url || "",
    phoneNumber: data.phone_number || "",
    location: data.location || "",
    dob: data.dob || "",
    gender: data.gender || "",
    country: data.country || "",
    twitterUrl: data.twitter_url || "",
    personalWebsite: data.personal_website || "",
    preferredLanguage: data.preferred_language || "",
    timezone: data.timezone || "",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  const query = `
    INSERT INTO public.profiles (
      id, full_name, headline, summary, phone_number, location,
      linkedin_url, github_url, portfolio_url, website, dob, gender,
      country, twitter_url, personal_website, preferred_language, timezone, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      headline = EXCLUDED.headline,
      summary = EXCLUDED.summary,
      phone_number = EXCLUDED.phone_number,
      location = EXCLUDED.location,
      linkedin_url = EXCLUDED.linkedin_url,
      github_url = EXCLUDED.github_url,
      portfolio_url = EXCLUDED.portfolio_url,
      website = EXCLUDED.website,
      dob = EXCLUDED.dob,
      gender = EXCLUDED.gender,
      country = EXCLUDED.country,
      twitter_url = EXCLUDED.twitter_url,
      personal_website = EXCLUDED.personal_website,
      preferred_language = EXCLUDED.preferred_language,
      timezone = EXCLUDED.timezone,
      updated_at = NOW()
  `;
  const values = [
    userId,
    data.fullName || null,
    data.headline || null,
    data.summary || null,
    data.phoneNumber || null,
    data.location || null,
    data.linkedin || null,
    data.github || null,
    data.portfolio || null,
    data.website || null,
    data.dob || null,
    data.gender || null,
    data.country || null,
    data.twitterUrl || null,
    data.personalWebsite || null,
    data.preferredLanguage || null,
    data.timezone || null,
  ];

  await db.query(query, values);
}

export async function getUserSettings(userId: string): Promise<any> {
  const selectQuery = `SELECT * FROM public.settings WHERE user_id = $1`;
  const { rows } = await db.query(selectQuery, [userId]);
  if (rows.length > 0) {
    return rows[0];
  }

  // Auto-bootstrap settings if missing
  const insertQuery = `
    INSERT INTO public.settings (user_id, theme, language, timezone, notifications, privacy, email_preferences)
    VALUES ($1, 'dark', 'en', 'UTC', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
    RETURNING *
  `;
  const { rows: inserted } = await db.query(insertQuery, [userId]);
  return inserted[0];
}

export async function updateUserSettings(
  userId: string,
  data: {
    theme?: string;
    language?: string;
    timezone?: string;
    notifications?: any;
    privacy?: any;
    emailPreferences?: any;
  }
): Promise<void> {
  const query = `
    INSERT INTO public.settings (
      user_id, theme, language, timezone, notifications, privacy, email_preferences
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id) DO UPDATE SET
      theme = COALESCE(EXCLUDED.theme, settings.theme),
      language = COALESCE(EXCLUDED.language, settings.language),
      timezone = COALESCE(EXCLUDED.timezone, settings.timezone),
      notifications = COALESCE(EXCLUDED.notifications, settings.notifications),
      privacy = COALESCE(EXCLUDED.privacy, settings.privacy),
      email_preferences = COALESCE(EXCLUDED.email_preferences, settings.email_preferences)
  `;
  const values = [
    userId,
    data.theme || null,
    data.language || null,
    data.timezone || null,
    data.notifications ? JSON.stringify(data.notifications) : null,
    data.privacy ? JSON.stringify(data.privacy) : null,
    data.emailPreferences ? JSON.stringify(data.emailPreferences) : null,
  ];

  await db.query(query, values);
}
