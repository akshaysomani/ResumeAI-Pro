"use client";

import React, { useState } from "react";
import {
  Key,
  Plus,
  Trash,
  Globe,
  RefreshCw,
  Check,
  Copy,
  Lock,
  AlertCircle,
  Terminal,
  ArrowRight,
  Clock,
  Settings,
  Play,
  Eye,
  EyeOff,
  Code,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ApiKey, OAuthApp, WebhookEndpoint, WebhookDelivery } from "@/types";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  createOAuthAppAction,
  deleteOAuthAppAction,
  createWebhookEndpointAction,
  deleteWebhookEndpointAction,
  getWebhookDeliveriesAction,
  triggerTestWebhookAction,
} from "@/app/actions/platformActions";

interface DeveloperClientProps {
  userId: string;
  initialApiKeys: ApiKey[];
  initialOAuthApps: OAuthApp[];
  initialWebhooks: WebhookEndpoint[];
}

export default function DeveloperClient({
  userId,
  initialApiKeys,
  initialOAuthApps,
  initialWebhooks,
}: DeveloperClientProps) {
  const [activeTab, setActiveTab] = useState<"keys" | "oauth" | "webhooks" | "docs">("keys");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [oauthApps, setOauthApps] = useState<OAuthApp[]>(initialOAuthApps);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(initialWebhooks);

  // Loading states
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [loadingDeliveriesFor, setLoadingDeliveriesFor] = useState<string | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  // Modal content / created credentials display
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);
  const [newAppCreds, setNewAppCreds] = useState<{ clientId: string; clientSecret: string } | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);

  // Form states
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["read:resumes", "read:templates"]);
  
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appRedirectUris, setAppRedirectUris] = useState("");
  const [appScopes, setAppScopes] = useState<string[]>(["read:resumes"]);
  
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookDescription, setWebhookDescription] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["resume.created", "resume.updated"]);

  // Copy helper
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // API Key operations
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const result = await createApiKeyAction(userId, keyName, keyScopes, null);
      if (result) {
        setApiKeys([result.key, ...apiKeys]);
        setNewKeyPlain(result.plainTextKey);
        setKeyName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This cannot be undone and will break any applications using it.")) return;
    try {
      const success = await revokeApiKeyAction(keyId);
      if (success) {
        setApiKeys(apiKeys.map((k) => (k.id === keyId ? { ...k, isRevoked: true } : k)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // OAuth App operations
  const handleCreateOAuthApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    setIsCreatingApp(true);
    try {
      const uris = appRedirectUris.split(",").map((u) => u.trim()).filter(Boolean);
      const result = await createOAuthAppAction(userId, {
        appName,
        description: appDescription,
        redirectUris: uris,
        scopes: appScopes,
      });
      if (result) {
        setOauthApps([result.app, ...oauthApps]);
        setNewAppCreds({
          clientId: result.app.clientId,
          clientSecret: result.clientSecret,
        });
        setAppName("");
        setAppDescription("");
        setAppRedirectUris("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingApp(false);
    }
  };

  const handleDeleteOAuthApp = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this OAuth Application?")) return;
    try {
      const success = await deleteOAuthAppAction(appId);
      if (success) {
        setOauthApps(oauthApps.filter((app) => app.id !== appId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Webhook operations
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setIsCreatingWebhook(true);
    try {
      const result = await createWebhookEndpointAction(userId, null, webhookUrl, webhookDescription, webhookEvents);
      if (result) {
        setWebhooks([result, ...webhooks]);
        setWebhookUrl("");
        setWebhookDescription("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;
    try {
      const success = await deleteWebhookEndpointAction(id);
      if (success) {
        setWebhooks(webhooks.filter((w) => w.id !== id));
        if (selectedWebhook?.id === id) {
          setSelectedWebhook(null);
          setWebhookDeliveries([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectWebhook = async (webhook: WebhookEndpoint) => {
    setSelectedWebhook(webhook);
    setLoadingDeliveriesFor(webhook.id);
    try {
      const list = await getWebhookDeliveriesAction(webhook.id);
      setWebhookDeliveries(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeliveriesFor(null);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhookId(webhookId);
    try {
      const success = await triggerTestWebhookAction(webhookId);
      if (success) {
        alert("Ping event dispatched successfully! Refreshing log feed...");
        // Refresh deliveries list if currently viewing it
        if (selectedWebhook?.id === webhookId) {
          const list = await getWebhookDeliveriesAction(webhookId);
          setWebhookDeliveries(list);
        }
      } else {
        alert("Failed to send ping event. Check endpoint URL.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingWebhookId(null);
    }
  };

  const toggleScope = (scopeList: string[], setScopeList: React.Dispatch<React.SetStateAction<string[]>>, scope: string) => {
    if (scopeList.includes(scope)) {
      setScopeList(scopeList.filter((s) => s !== scope));
    } else {
      setScopeList([...scopeList, scope]);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Navigation tabs */}
      <div className="flex flex-row space-x-1 overflow-x-auto lg:flex-col lg:space-x-0 lg:space-y-1 lg:overflow-visible">
        <button
          onClick={() => setActiveTab("keys")}
          className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "keys"
              ? "bg-zinc-800 text-indigo-400 font-semibold"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <Key className="h-4 w-4" />
          <span>API Keys</span>
        </button>
        <button
          onClick={() => setActiveTab("oauth")}
          className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "oauth"
              ? "bg-zinc-800 text-indigo-400 font-semibold"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>OAuth Applications</span>
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "webhooks"
              ? "bg-zinc-800 text-indigo-400 font-semibold"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Webhooks</span>
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "docs"
              ? "bg-zinc-800 text-indigo-400 font-semibold"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>API Explorer</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* ==================== API KEYS TAB ==================== */}
        {activeTab === "keys" && (
          <div className="space-y-6">
            {/* Display newly created key credentials (once) */}
            {newKeyPlain && (
              <div className="border border-indigo-500/50 bg-indigo-950/20 rounded-xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-zinc-100">Copy your API Key</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      For security, we only display this token once. If you lose it, you will need to revoke it and generate a new key.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3 font-mono text-sm text-indigo-300">
                  <span className="break-all">{newKeyPlain}</span>
                  <button
                    onClick={() => copyToClipboard(newKeyPlain)}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 ml-4 shrink-0 transition-colors"
                  >
                    {copiedText === newKeyPlain ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setNewKeyPlain(null)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  I have copied this key, close banner
                </button>
              </div>
            )}

            {/* Create API Key Form */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <h3 className="text-lg font-bold text-zinc-50 mb-4">Generate API Key</h3>
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Key Name</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. CI/CD Deployment Pipeline"
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Scopes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["read:resumes", "write:resumes", "read:templates", "read:documents", "write:documents", "read:interviews"].map((scope) => (
                      <label key={scope} className="flex items-center space-x-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 p-2.5 rounded-lg text-xs text-zinc-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={keyScopes.includes(scope)}
                          onChange={() => toggleScope(keyScopes, setKeyScopes, scope)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700"
                        />
                        <span>{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingKey || !keyName.trim()}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  {isCreatingKey ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Generate Key</span>
                </button>
              </form>
            </div>

            {/* List API Keys */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-zinc-50">Active API Keys</h3>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-900 rounded-xl">
                  <Key className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">No API keys generated yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="py-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-zinc-100">{key.name}</span>
                          <span className="font-mono text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-indigo-400">
                            {key.keyPrefix}...
                          </span>
                          {key.isRevoked ? (
                            <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900 px-1.5 py-0.5 rounded">
                              Revoked
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-zinc-500">
                          <span>Requests: {key.requestCount}</span>
                          {key.lastUsedAt && (
                            <span>Last Used: {new Date(key.lastUsedAt).toLocaleString()}</span>
                          )}
                          <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {key.scopes.map((s) => (
                            <span key={s} className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      {!key.isRevoked && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-950/10 rounded-lg transition-all"
                          title="Revoke Key"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== OAUTH APPLICATIONS TAB ==================== */}
        {activeTab === "oauth" && (
          <div className="space-y-6">
            {/* Display newly created app credentials */}
            {newAppCreds && (
              <div className="border border-indigo-500/50 bg-indigo-950/20 rounded-xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-zinc-100">OAuth Credentials Generated</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Store these client credentials securely. We do not store the plaintext client secret after creation.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                    <span className="text-zinc-400 text-xs mr-2">Client ID:</span>
                    <span className="text-zinc-200 select-all break-all">{newAppCreds.clientId}</span>
                    <button
                      onClick={() => copyToClipboard(newAppCreds.clientId)}
                      className="p-1 hover:bg-zinc-850 rounded text-zinc-400 ml-3"
                    >
                      {copiedText === newAppCreds.clientId ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                    <span className="text-zinc-400 text-xs mr-2">Client Secret:</span>
                    <span className="text-indigo-300 select-all break-all">{newAppCreds.clientSecret}</span>
                    <button
                      onClick={() => copyToClipboard(newAppCreds.clientSecret)}
                      className="p-1 hover:bg-zinc-850 rounded text-zinc-400 ml-3"
                    >
                      {copiedText === newAppCreds.clientSecret ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setNewAppCreds(null)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Close credentials window
                </button>
              </div>
            )}

            {/* Create OAuth App Form */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <h3 className="text-lg font-bold text-zinc-50 mb-4">Register OAuth Application</h3>
              <form onSubmit={handleCreateOAuthApp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Application Name</label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="e.g. My Resume Sync App"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={appDescription}
                      onChange={(e) => setAppDescription(e.target.value)}
                      placeholder="Brief summary of your app"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Redirect URIs (comma-separated)</label>
                  <input
                    type="text"
                    value={appRedirectUris}
                    onChange={(e) => setAppRedirectUris(e.target.value)}
                    placeholder="https://myapp.com/oauth/callback"
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingApp || !appName.trim()}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  {isCreatingApp ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>Register App</span>
                </button>
              </form>
            </div>

            {/* List OAuth Apps */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <h3 className="text-lg font-bold text-zinc-50 mb-4">Your Registered Applications</h3>
              {oauthApps.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-900 rounded-xl">
                  <Lock className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">No applications registered yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {oauthApps.map((app) => (
                    <div key={app.id} className="border border-zinc-900 rounded-xl p-5 hover:border-zinc-800 transition-colors relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-bold text-zinc-100 text-base">{app.appName}</h4>
                          {app.description && <p className="text-xs text-zinc-400">{app.description}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteOAuthApp(app.id)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-red-950/15 rounded transition-all"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-xs font-mono text-zinc-400 bg-zinc-900/30 p-3 rounded-lg border border-zinc-900/60">
                        <div>
                          <span className="text-zinc-500 font-sans font-semibold mr-1">Client ID:</span>
                          <span className="select-all text-indigo-400">{app.clientId}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 font-sans font-semibold mr-1">Callbacks:</span>
                          <span className="text-zinc-300">{app.redirectUris.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== WEBHOOKS TAB ==================== */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Endpoint Creation Form & List (Left side) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Create Webhook Form */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-zinc-50 mb-4">Add Webhook Endpoint</h3>
                  <form onSubmit={handleCreateWebhook} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Payload URL</label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://my-backend.com/webhooks"
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={webhookDescription}
                        onChange={(e) => setWebhookDescription(e.target.value)}
                        placeholder="e.g. Local sync server"
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-2">Events to send</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["resume.created", "resume.updated", "document.created", "interview.started", "ping"].map((event) => (
                          <label key={event} className="flex items-center space-x-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 p-2 rounded-lg text-xs text-zinc-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={webhookEvents.includes(event)}
                              onChange={() => toggleScope(webhookEvents, setWebhookEvents, event)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700"
                            />
                            <span>{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isCreatingWebhook || !webhookUrl.trim()}
                      className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      {isCreatingWebhook ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>Add Endpoint</span>
                    </button>
                  </form>
                </div>

                {/* List Webhooks */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-zinc-50 mb-4">Configured Endpoints</h3>
                  {webhooks.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-zinc-900 rounded-xl">
                      <Globe className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-sm text-zinc-400">No webhooks configured yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {webhooks.map((w) => (
                        <div
                          key={w.id}
                          onClick={() => handleSelectWebhook(w)}
                          className={`border rounded-xl p-5 cursor-pointer transition-all hover:border-indigo-500/50 ${
                            selectedWebhook?.id === w.id
                              ? "border-indigo-600 bg-zinc-900/20"
                              : "border-zinc-900 bg-zinc-950/20"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-bold text-zinc-100 text-sm break-all font-mono">{w.url}</h4>
                              {w.description && <p className="text-xs text-zinc-400">{w.description}</p>}
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTestWebhook(w.id);
                                }}
                                disabled={testingWebhookId === w.id}
                                className="text-xs flex items-center space-x-1 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-900 px-2 py-1 rounded bg-zinc-900 text-zinc-400 transition-colors"
                              >
                                {testingWebhookId === w.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                                <span>Test Ping</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWebhook(w.id);
                                }}
                                className="text-zinc-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded transition-all"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {w.events.map((e) => (
                              <span key={e} className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                {e}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500">
                            <div>
                              <span>Signing Secret: </span>
                              <span className="font-mono text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded select-all">{w.signingSecret}</span>
                            </div>
                            {w.failureCount > 0 && (
                              <span className="text-red-400 font-semibold">{w.failureCount} Failures</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery History Log Feed (Right side) */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-zinc-50 flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-indigo-400" />
                  <span>Delivery History</span>
                </h3>
                {selectedWebhook ? (
                  <div className="space-y-4">
                    <p className="text-xs text-indigo-400 font-semibold break-all">Viewing logs for: {selectedWebhook.url}</p>
                    {loadingDeliveriesFor === selectedWebhook.id ? (
                      <div className="text-center py-6">
                        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
                      </div>
                    ) : webhookDeliveries.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-500">No logs found. Trigger a test ping event.</div>
                    ) : (
                      <div className="space-y-3 overflow-y-auto max-h-[400px]">
                        {webhookDeliveries.map((d) => (
                          <div key={d.id} className="border border-zinc-900 bg-zinc-950 p-3 rounded-lg text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-zinc-400">{d.eventType}</span>
                              <div className="flex items-center space-x-1.5">
                                {d.status === "delivered" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                )}
                                <span className={`font-mono font-bold ${d.status === "delivered" ? "text-emerald-400" : "text-red-400"}`}>
                                  {d.responseCode || "ERR"}
                                </span>
                              </div>
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {new Date(d.createdAt).toLocaleString()} (Attempts: {d.attemptCount})
                            </div>
                            {d.responseBody && (
                              <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-[10px] font-mono break-all max-h-[80px] overflow-y-auto text-zinc-400">
                                {d.responseBody}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-zinc-900 rounded-xl text-zinc-500 text-xs">
                    Select a webhook endpoint to inspect delivery logs and response codes.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== API EXPLORER & DOCS ==================== */}
        {activeTab === "docs" && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-50 flex items-center space-x-2">
              <Code className="h-5 w-5 text-indigo-400" />
              <span>ResumeAI Pro REST API v1 Docs</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Integrate resume building and career document creation directly into external HR software, bots, or CI/CD pipelines. All requests require a `Bearer` authorization token.
            </p>

            <div className="space-y-4">
              {/* Endpoint 1 */}
              <div className="border border-zinc-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold px-2 py-0.5 rounded text-[10px] font-mono">GET</span>
                  <span className="font-mono text-zinc-200 text-sm">/api/v1/resumes</span>
                  <span className="text-xs text-zinc-500 font-medium">List all resumes</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                  {`curl -X GET "https://resumeai-pro.com/api/v1/resumes" \\
  -H "Authorization: Bearer rai_xxxxxxx_xxxxxxxxxxxxxxxx"`}
                </div>
              </div>

              {/* Endpoint 2 */}
              <div className="border border-zinc-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 font-bold px-2 py-0.5 rounded text-[10px] font-mono">POST</span>
                  <span className="font-mono text-zinc-200 text-sm">/api/v1/resumes</span>
                  <span className="text-xs text-zinc-500 font-medium">Create a new resume</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                  {`curl -X POST "https://resumeai-pro.com/api/v1/resumes" \\
  -H "Authorization: Bearer rai_xxxxxxx_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Software Engineer II", "description": "Focused on backend"}'`}
                </div>
              </div>

              {/* Endpoint 3 */}
              <div className="border border-zinc-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold px-2 py-0.5 rounded text-[10px] font-mono">GET</span>
                  <span className="font-mono text-zinc-200 text-sm">/api/v1/templates</span>
                  <span className="text-xs text-zinc-500 font-medium">Fetch active resume designs</span>
                </div>
              </div>

              {/* Endpoint 4 */}
              <div className="border border-zinc-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 font-bold px-2 py-0.5 rounded text-[10px] font-mono">POST</span>
                  <span className="font-mono text-zinc-200 text-sm">/api/v1/interviews</span>
                  <span className="text-xs text-zinc-500 font-medium">Start practice session</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
