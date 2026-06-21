"use client";

import React, { useState } from "react";
import {
  Github,
  Slack,
  Globe,
  Calendar,
  Cloud,
  FileText,
  CheckCircle,
  Database,
  Link2,
  Unlink,
  Settings,
  X,
  Loader2,
  FolderOpen,
} from "lucide-react";
import type { IntegrationConfig } from "@/types";
import { connectIntegrationAction, disconnectIntegrationAction } from "@/app/actions/platformActions";

interface IntegrationsClientProps {
  userId: string;
  initialConfigs: IntegrationConfig[];
}

interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  category: "storage" | "dev" | "communication" | "ats" | "productivity";
  icon: React.ComponentType<{ className?: string }>;
  configFields: { key: string; label: string; placeholder: string; type: string }[];
}

const PROVIDERS: IntegrationProvider[] = [
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Export and auto-sync your PDF and Word resumes directly to a shared Google Drive folder.",
    category: "storage",
    icon: Cloud,
    configFields: [
      { key: "folder_name", label: "Destination Folder Name", placeholder: "e.g. My Resumes", type: "text" },
      { key: "auto_sync", label: "Auto-sync edits on save", placeholder: "true", type: "checkbox" },
    ],
  },
  {
    id: "github",
    name: "GitHub Developer Sync",
    description: "Auto-parse your github repositories to build developer profiles and pull contributions directly into your projects section.",
    category: "dev",
    icon: Github,
    configFields: [
      { key: "username", label: "GitHub Username", placeholder: "e.g. torvalds", type: "text" },
      { key: "include_forks", label: "Include Forked Repositories", placeholder: "false", type: "checkbox" },
    ],
  },
  {
    id: "slack",
    name: "Slack Notifications",
    description: "Get real-time workspace activity logs, ATS feedback reviews, and collaboration comments sent directly to a Slack channel.",
    category: "communication",
    icon: Slack,
    configFields: [
      { key: "webhook_url", label: "Slack Webhook URL", placeholder: "https://hooks.slack.com/services/...", type: "text" },
    ],
  },
  {
    id: "greenhouse",
    name: "Greenhouse ATS Connect",
    description: "Submit resumes directly to your corporate Greenhouse job board postings from the workspace editor.",
    category: "ats",
    icon: Database,
    configFields: [
      { key: "api_url", label: "Greenhouse Board API Endpoint", placeholder: "https://boards-api.greenhouse.io/v1/...", type: "text" },
      { key: "job_board_token", label: "Job Board Token", placeholder: "e.g. company_name", type: "text" },
    ],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync your practice mock interviews and coaching appointments directly to your Google Calendar.",
    category: "productivity",
    icon: Calendar,
    configFields: [
      { key: "calendar_name", label: "Calendar Name", placeholder: "e.g. Interviews Prep", type: "text" },
    ],
  },
];

export default function IntegrationsClient({ userId, initialConfigs }: IntegrationsClientProps) {
  const [configs, setConfigs] = useState<IntegrationConfig[]>(initialConfigs);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(null);

  // Form values
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const handleOpenConnect = (provider: IntegrationProvider) => {
    const existing = configs.find((c) => c.provider === provider.id && c.isConnected);
    setSelectedProvider(provider);
    setAccessToken("");
    setRefreshToken("");
    
    // Pre-populate fields if already connected
    if (existing) {
      setFormFields(existing.config || {});
    } else {
      const defaults: Record<string, string> = {};
      provider.configFields.forEach((f) => {
        defaults[f.key] = f.type === "checkbox" ? "false" : "";
      });
      setFormFields(defaults);
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    setLoadingProviderId(selectedProvider.id);
    try {
      const configData = { ...formFields };
      const saved = await connectIntegrationAction(
        userId,
        selectedProvider.id,
        configData,
        accessToken || "mock_access_token_" + Math.random().toString(36).substring(7),
        refreshToken || "mock_refresh_token_" + Math.random().toString(36).substring(7)
      );

      if (saved) {
        setConfigs((prev) => {
          const filtered = prev.filter((c) => c.provider !== selectedProvider.id);
          return [saved, ...filtered];
        });
        setSelectedProvider(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProviderId(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${providerId.replace("_", " ")}?`)) return;
    setLoadingProviderId(providerId);
    try {
      const success = await disconnectIntegrationAction(userId, providerId);
      if (success) {
        setConfigs(
          configs.map((c) => (c.provider === providerId ? { ...c, isConnected: false } : c))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProviderId(null);
    }
  };

  const getStatus = (providerId: string) => {
    const config = configs.find((c) => c.provider === providerId);
    return config && config.isConnected;
  };

  return (
    <div className="space-y-6">
      {/* Category header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROVIDERS.map((provider) => {
          const IconComponent = provider.icon;
          const isConnected = getStatus(provider.id);
          const isLoading = loadingProviderId === provider.id;

          return (
            <div
              key={provider.id}
              className={`bg-zinc-950 border rounded-xl p-6 flex flex-col justify-between transition-all hover:border-zinc-800 ${
                isConnected ? "border-indigo-600 bg-indigo-950/5" : "border-zinc-900"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800/80 text-indigo-400">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  {isConnected ? (
                    <span className="flex items-center space-x-1 text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 font-medium">Inactive</span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-100 text-lg">{provider.name}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{provider.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-zinc-900/60">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => handleOpenConnect(provider)}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Configure</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      disabled={isLoading}
                      className="flex items-center justify-center bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/60 text-red-400 p-2 rounded-lg transition-colors"
                      title="Disconnect integration"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConnect(provider)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5" />
                    )}
                    <span>Connect</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration setup modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setSelectedProvider(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-zinc-900 rounded text-indigo-400 border border-zinc-800">
                {React.createElement(selectedProvider.icon, { className: "h-5 w-5" })}
              </div>
              <h3 className="text-lg font-bold text-zinc-50">Connect to {selectedProvider.name}</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Configure parameters to authenticate and sync. In production, this initiates OAuth authorization.
            </p>

            <form onSubmit={handleConnectSubmit} className="space-y-4 pt-2">
              {/* Config fields dynamically generated */}
              {selectedProvider.configFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  {field.type === "checkbox" ? (
                    <label className="flex items-center space-x-2 text-sm text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFields[field.key] === "true"}
                        onChange={(e) =>
                          setFormFields({ ...formFields, [field.key]: e.target.checked ? "true" : "false" })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-800"
                      />
                      <span>{field.label}</span>
                    </label>
                  ) : (
                    <>
                      <label className="block text-xs font-semibold text-zinc-400">{field.label}</label>
                      <input
                        type={field.type}
                        value={formFields[field.key] || ""}
                        onChange={(e) => setFormFields({ ...formFields, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                        required
                      />
                    </>
                  )}
                </div>
              ))}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-400">API Access Token (Optional)</label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter API token if you have one"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-850 rounded-lg py-2 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingProviderId !== null}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-semibold transition-colors flex items-center justify-center space-x-1"
                >
                  {loadingProviderId !== null && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  <span>Save Integration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
