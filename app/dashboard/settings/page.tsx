"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/theme-provider";
import { getUserSettings, updateUserSettings } from "@/app/actions/profileActions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sliders, Sun, Moon, Bell, Shield, Languages, Eye, User } from "lucide-react";
import { useTranslation } from "@/components/i18n-provider";
import { LANGUAGES } from "@/lib/translations";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { success, error } = useToast();
  const { setLocale } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State parameters
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [notifyAiCredits, setNotifyAiCredits] = useState(true);
  const [resumeVisibility, setResumeVisibility] = useState("public"); // public or private
  const [profileVisibility, setProfileVisibility] = useState("public"); // public or private
  const [preferredLang, setPreferredLang] = useState("en");

  // Load user settings on mount
  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const settings = await getUserSettings(user.id);
        if (settings) {
          // Sync Theme context
          if (settings.theme === "light" || settings.theme === "dark") {
            setTheme(settings.theme);
          }
          const lang = settings.language || "en";
          setPreferredLang(lang);
          setLocale(lang);

          // Notifications mapping
          const notifs = settings.notifications || {};
          setNotifyWeekly(notifs.weeklyReports !== false);
          setNotifyAiCredits(notifs.aiCreditsThreshold !== false);

          // Privacy mapping
          const priv = settings.privacy || {};
          setResumeVisibility(priv.resumeVisibility || "public");
          setProfileVisibility(priv.profileVisibility || "public");
        }
      } catch (err) {
        console.error("Failed to load user settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        theme,
        language: preferredLang,
        timezone: "UTC",
        notifications: {
          weeklyReports: notifyWeekly,
          aiCreditsThreshold: notifyAiCredits,
        },
        privacy: {
          resumeVisibility,
          profileVisibility,
        },
      };

      await updateUserSettings(user.id, payload);
      setLocale(preferredLang);
      success("Workspace preferences updated successfully.");
    } catch (err: any) {
      error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs text-zinc-500">Loading your settings profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Customize your application workspace, notification templates, and safety parameters.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sliders className="h-4.5 w-4.5 text-indigo-600" />
              Theme Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Toggle the dark and light styling formats of the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between border-t pt-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold">Active Theme</span>
              <p className="text-[11px] text-zinc-500">Currently styled in {theme} mode.</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === "light" ? (
                <>
                  <Moon className="mr-1.5 h-4 w-4" /> Dark Mode
                </>
              ) : (
                <>
                  <Sun className="mr-1.5 h-4 w-4" /> Light Mode
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Localizations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Languages className="h-4.5 w-4.5 text-indigo-600" />
              Workspace Language
            </CardTitle>
            <CardDescription className="text-xs">
              Configure the default interface language.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t pt-4">
            <div className="max-w-xs space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Preferred Language</label>
              <select
                value={preferredLang}
                onChange={(e) => {
                  setPreferredLang(e.target.value);
                  setLocale(e.target.value);
                }}
                className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Email Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Bell className="h-4.5 w-4.5 text-indigo-600" />
              Email Alerts
            </CardTitle>
            <CardDescription className="text-xs">
              Toggle email notifications from ResumeAI Pro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">Weekly ATS Reports</span>
                <p className="text-[11px] text-zinc-500">Receive weekly digests on resume link view performance metrics.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyWeekly}
                onChange={() => setNotifyWeekly(!notifyWeekly)}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">AI Usage Threshold Alerts</span>
                <p className="text-[11px] text-zinc-500">Notify me when remaining AI generation credits drop below 20%.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyAiCredits}
                onChange={() => setNotifyAiCredits(!notifyAiCredits)}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Safety & Visibility Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-indigo-600" />
              Safety & Visibility Preferences
            </CardTitle>
            <CardDescription className="text-xs">
              Manage security index configurations and search engine indexing permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Public Resume Link Visibility
                </label>
                <select
                  value={resumeVisibility}
                  onChange={(e) => setResumeVisibility(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="public">Public (Anyone with link can view)</option>
                  <option value="private">Private (Only you can access)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Profile Directory Status
                </label>
                <select
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="public">Indexable (Search engines can list profile)</option>
                  <option value="private">Hidden (Hide profile from search engines)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={saving}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
