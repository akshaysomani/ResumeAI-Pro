"use client";

import React, { useState } from "react";
import {
  Github,
  FileJson,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileUp,
} from "lucide-react";
import type { ImportRecord } from "@/types";
import { importGitHubProfileAction, importRawJsonResumeAction, getImportHistoryAction } from "@/app/actions/platformActions";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ResumeImportClientProps {
  userId: string;
  initialImports: ImportRecord[];
}

export default function ResumeImportClient({ userId, initialImports }: ResumeImportClientProps) {
  const [imports, setImports] = useState<ImportRecord[]>(initialImports);
  const [activeTab, setActiveTab] = useState<"github" | "json">("github");
  
  const [githubUsername, setGithubUsername] = useState("");
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [isImportingJson, setIsImportingJson] = useState(false);

  const router = useRouter();

  // GitHub Sync execution
  const handleGithubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;

    setIsSyncingGithub(true);
    try {
      // 1. Fetch from GitHub API on client side
      const userResponse = await fetch(`https://api.github.com/users/${githubUsername}`);
      if (!userResponse.ok) {
        throw new Error("GitHub profile not found. Verify the username.");
      }
      const profileData = await userResponse.json();

      const reposResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=15`);
      let repos: any[] = [];
      if (reposResponse.ok) {
        repos = await reposResponse.json();
      }

      // 2. Send details to server action
      const result = await importGitHubProfileAction(userId, githubUsername, profileData, repos);

      if (result.success && result.resumeId) {
        // Refresh import list
        const latestImportRes = await fetchImportHistory();
        if (latestImportRes) setImports(latestImportRes);

        alert("GitHub profile synced successfully! Redirecting to your new resume...");
        router.push(`/dashboard/resumes/${result.resumeId}`);
      } else {
        alert("Sync error: " + (result.error || "Unknown error occurred"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // JSON Import execution
  const handleJsonUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonFile) return;

    setIsImportingJson(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const contents = event.target?.result as string;
          // Validate JSON schema
          JSON.parse(contents); 

          const result = await importRawJsonResumeAction(userId, jsonFile.name, contents);

          if (result.success && result.resumeId) {
            const latestImportRes = await fetchImportHistory();
            if (latestImportRes) setImports(latestImportRes);

            alert("JSON backup imported successfully! Redirecting...");
            router.push(`/dashboard/resumes/${result.resumeId}`);
          } else {
            alert("Import error: " + (result.error || "Failed to process JSON"));
          }
        } catch (jsonErr) {
          alert("Invalid JSON format. Check file structure.");
        } finally {
          setIsImportingJson(false);
        }
      };
      reader.readAsText(jsonFile);
    } catch (err: any) {
      alert("Error: " + err.message);
      setIsImportingJson(false);
    }
  };

  const fetchImportHistory = async () => {
    // We can fetch via server action or dynamic page refresh. Let's make a quick helper
    try {
      const res = await getImportHistoryAction(userId);
      return res;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Wizard configuration (Left side) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Source tab choices */}
        <div className="flex border-b border-zinc-900 bg-zinc-950 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("github")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "github"
                ? "bg-zinc-900 text-indigo-400 border border-zinc-800"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Github className="h-4 w-4" />
            <span>GitHub Profile Sync</span>
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "json"
                ? "bg-zinc-900 text-indigo-400 border border-zinc-800"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileJson className="h-4 w-4" />
            <span>JSON Backup Import</span>
          </button>
        </div>

        {/* GitHub import configuration */}
        {activeTab === "github" && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-zinc-900 rounded-lg text-indigo-400 border border-zinc-800/80">
                <Github className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-50">GitHub Profile Synchronization</h3>
                <p className="text-xs text-zinc-400">Import repositories as projects, profile bio as personal details, and stack languages as skills.</p>
              </div>
            </div>

            <form onSubmit={handleGithubSync} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">GitHub Username</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="e.g. torvalds"
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSyncingGithub || !githubUsername.trim()}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 rounded-lg text-sm transition-colors"
                  >
                    {isSyncingGithub ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span>Sync Profile</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* JSON Backup import configuration */}
        {activeTab === "json" && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-zinc-900 rounded-lg text-indigo-400 border border-zinc-800/80">
                <FileJson className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-50">Import JSON Backup</h3>
                <p className="text-xs text-zinc-400">Restore or import a resume document using the standard ResumeAI JSON export schema.</p>
              </div>
            </div>

            <form onSubmit={handleJsonUploadSubmit} className="space-y-4 pt-2">
              <div className="border border-dashed border-zinc-900 rounded-xl p-8 flex flex-col items-center justify-center hover:border-zinc-800 transition-colors bg-zinc-900/10">
                <FileUp className="h-8 w-8 text-zinc-500 mb-3" />
                {jsonFile ? (
                  <p className="text-sm font-semibold text-zinc-200">{jsonFile.name} ({(jsonFile.size / 1024).toFixed(1)} KB)</p>
                ) : (
                  <p className="text-xs text-zinc-500 text-center">Drag and drop or browse to choose a .json backup file</p>
                )}
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="json-file-input"
                />
                <label
                  htmlFor="json-file-input"
                  className="mt-4 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>

              <button
                type="submit"
                disabled={isImportingJson || !jsonFile}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {isImportingJson ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>Import Resume</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Import history (Right side) */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-zinc-50 flex items-center space-x-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          <span>Import History</span>
        </h3>
        <div className="space-y-3 overflow-y-auto max-h-[550px]">
          {imports.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">No import events logged.</div>
          ) : (
            imports.map((imp) => (
              <div key={imp.id} className="border border-zinc-900 bg-zinc-950 p-3 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 capitalize flex items-center space-x-1.5">
                    {imp.sourceType === "github" ? (
                      <Github className="h-3.5 w-3.5 text-indigo-400" />
                    ) : (
                      <FileJson className="h-3.5 w-3.5 text-indigo-400" />
                    )}
                    <span>{imp.sourceName}</span>
                  </span>
                  <div>
                    {imp.status === "completed" ? (
                      <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed</span>
                      </span>
                    ) : imp.status === "failed" ? (
                      <span className="flex items-center space-x-1 text-red-400 bg-red-950/40 border border-red-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        <XCircle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-yellow-400 bg-yellow-950/40 border border-yellow-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Processing</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 flex justify-between">
                  <span>{new Date(imp.createdAt).toLocaleDateString()}</span>
                  {imp.fileSizeBytes && (
                    <span>{(imp.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  )}
                </div>

                {imp.status === "completed" && imp.resumeId && (
                  <Link
                    href={`/dashboard/resumes/${imp.resumeId}`}
                    className="flex items-center justify-center space-x-1 w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-1.5 rounded text-xs transition-colors border border-zinc-800"
                  >
                    <span>Edit Resume</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}

                {imp.status === "failed" && imp.errorMessage && (
                  <div className="text-red-400 text-[10px] bg-red-950/10 border border-red-900/30 p-2 rounded break-words">
                    {imp.errorMessage}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
