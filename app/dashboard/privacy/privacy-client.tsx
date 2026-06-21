"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Cookie } from "lucide-react";
import { getUserConsentAction, updateUserConsentAction, downloadUserDataAction, deleteAccountAction } from "@/app/actions/privacyActions";

export default function PrivacyClient() {
  const { user, signOut } = useAuth();
  const { success, error, warning } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Consent preferences
  const [cookiesEssential] = useState(true); // Always true
  const [cookiesAnalytical, setCookiesAnalytical] = useState(false);
  const [cookiesMarketing, setCookiesMarketing] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);

  useEffect(() => {
    async function loadPreferences() {
      if (!user) return;
      try {
        const consent = await getUserConsentAction(user.id);
        if (consent) {
          setCookiesAnalytical(consent.cookiesAnalytical);
          setCookiesMarketing(consent.cookiesMarketing);
          setMarketingEmails(consent.marketingEmails);
          setDataRetentionDays(consent.dataRetentionDays || 365);
        }
      } catch (err) {
        console.error("Failed to load user privacy settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, [user]);

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserConsentAction(user.id, {
        cookiesEssential,
        cookiesAnalytical,
        cookiesMarketing,
        marketingEmails,
        dataRetentionDays,
      });
      success("Privacy settings and consent updated successfully.");
    } catch (err: any) {
      error(err.message || "Failed to update privacy preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const data = await downloadUserDataAction(user.id);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `resumeai_user_data_${user.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      success("Your account information download has completed.");
    } catch (err: any) {
      error(err.message || "Failed to compile your data archive.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteAccountAction(user.id);
      success("Your account has been deleted. Purging session...");
      setTimeout(async () => {
        await signOut();
        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }
      }, 1500);
    } catch (err: any) {
      error(err.message || "Failed to purge account data. Contact support.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs text-zinc-500">Loading privacy parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Privacy Center & Compliance</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your GDPR, CCPA rights, data retention constraints, and cookie consent tokens.
        </p>
      </div>

      <div className="space-y-6">
        {/* GDPR/CCPA Consent Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Cookie className="h-4.5 w-4.5 text-indigo-600" />
              Cookie & Data Consent Preferences
            </CardTitle>
            <CardDescription className="text-xs">
              Toggle data collection consents according to global privacy standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">Essential Cookies</span>
                <p className="text-[11px] text-zinc-500">Required for system authentication, security, and offline cache storage. (Cannot be disabled)</p>
              </div>
              <input
                type="checkbox"
                checked={cookiesEssential}
                disabled
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 opacity-50 cursor-not-allowed"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">Analytical & Telemetry Cookies</span>
                <p className="text-[11px] text-zinc-500">Used for diagnostics, performance measurement, and feature flag metric audits.</p>
              </div>
              <input
                type="checkbox"
                checked={cookiesAnalytical}
                onChange={() => setCookiesAnalytical(!cookiesAnalytical)}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold">Marketing & Communication Consent</span>
                <p className="text-[11px] text-zinc-500">Allow us to send product updates, feature announcements, and career advice emails.</p>
              </div>
              <input
                type="checkbox"
                checked={marketingEmails}
                onChange={() => setMarketingEmails(!marketingEmails)}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="border-t pt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Data Retention Period (GDPR)</label>
                <select
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>365 Days (1 Year)</option>
                  <option value={730}>730 Days (2 Years)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <Button onClick={handleSavePreferences} isLoading={saving}>
                Update Privacy Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Portability (GDPR Article 20) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Download className="h-4.5 w-4.5 text-indigo-600" />
              Data Portability & Export
            </CardTitle>
            <CardDescription className="text-xs">
              Request a copy of all user data stored in the database in a standard machine-readable format (JSON).
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t pt-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold">Download Account Archive</span>
              <p className="text-[11px] text-zinc-500">Compiles your profile details, platform preferences, and resume database rows.</p>
            </div>
            <Button onClick={handleDownloadData} isLoading={downloading} variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" /> Download JSON
            </Button>
          </CardContent>
        </Card>

        {/* Account Erasure (GDPR Article 17) */}
        <Card className="border-red-500/20 bg-red-500/[0.02]">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <Trash2 className="h-4.5 w-4.5" />
              Danger Zone - Account Erasure (Right to be Forgotten)
            </CardTitle>
            <CardDescription className="text-xs">
              Permanently purge all account data and settings. This action is irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-red-500/10 pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">Purge Personal Identity</span>
                <p className="text-[11px] text-zinc-500">Deletes all resumes, credentials, job matches, and telemetry metrics from database caches.</p>
              </div>
              {!confirmDelete ? (
                <Button onClick={() => setConfirmDelete(true)} variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400">
                  Delete My Account
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setConfirmDelete(false)} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button onClick={handleDeleteAccount} isLoading={deleting} size="sm" className="bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20">
                    Confirm Erasure
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
