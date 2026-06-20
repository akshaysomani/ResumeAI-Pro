"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FileText,
  Search,
  ExternalLink,
  Loader2,
  FolderOpen,
  Filter,
  User,
  Calendar,
  Building,
  ArrowRight
} from "lucide-react";
import { getWorkspaceAssetsAction } from "@/app/actions/orgActions";

interface Workspace {
  id: string;
  name: string;
  type: string;
}

interface AssetsClientProps {
  orgId: string;
  role: string;
  userId: string;
  workspaces: Workspace[];
}

export default function AssetsClient({
  orgId,
  role,
  userId,
  workspaces
}: AssetsClientProps) {
  const { error: toastError } = useToast();

  const [selectedWsId, setSelectedWsId] = useState<string>(workspaces[0]?.id || "");
  const [loading, setLoading] = useState(false);
  
  // Workspace assets
  const [resumes, setResumes] = useState<any[]>([]);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<"all" | "resume" | "cover_letter" | "document">("all");

  useEffect(() => {
    if (!selectedWsId) return;

    async function loadAssets() {
      setLoading(true);
      try {
        const assets = await getWorkspaceAssetsAction(selectedWsId);
        setResumes(assets.resumes || []);
        setCoverLetters(assets.coverLetters || []);
        setDocuments(assets.documents || []);
      } catch (err: any) {
        toastError(err.message || "Failed to load workspace assets");
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [selectedWsId, toastError]);

  // Combine and filter assets
  const allAssets = [
    ...resumes.map((r) => ({ ...r, assetType: "resume" as const })),
    ...coverLetters.map((c) => ({ ...c, assetType: "cover_letter" as const })),
    ...documents.map((d) => ({ ...d, assetType: "document" as const }))
  ];

  const filteredAssets = allAssets.filter((asset) => {
    const matchesSearch =
      (asset.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = assetTypeFilter === "all" || asset.assetType === assetTypeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">Shared Asset Library</h2>
          <p className="text-xs text-zinc-400">Search and view shared resumes, cover letters, and custom templates across your team workspaces.</p>
        </div>
      </div>

      {/* Select Workspace and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Workspace Dropdown */}
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Workspace:</span>
          <select
            value={selectedWsId}
            onChange={(e) => setSelectedWsId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs font-semibold"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-2 items-center flex-1 md:justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resumes, candidates..."
              className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 pl-9 pr-4 rounded-xl placeholder-zinc-700 text-xs w-full"
            />
          </div>

          <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-xl p-0.5">
            {(["all", "resume", "cover_letter", "document"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setAssetTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  assetTypeFilter === type
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-zinc-250"
                }`}
              >
                {type.replace("_", " ")}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Assets */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-mono">Querying shared workspace library...</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="border border-zinc-800 bg-zinc-900/10 rounded-2xl p-16 text-center text-zinc-500 space-y-4">
          <FileText className="w-12 h-12 text-zinc-850 mx-auto animate-pulse" />
          <h4 className="font-bold text-sm text-zinc-400">No Shared Assets Found</h4>
          <p className="text-xs text-zinc-500 font-mono max-w-sm mx-auto">
            Try switching workspaces or adjustments to your search queries.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => {
            const isResume = asset.assetType === "resume";
            const isCoverLetter = asset.assetType === "cover_letter";
            
            return (
              <Card
                key={asset.id}
                className="bg-zinc-900/35 border-zinc-800 hover:border-zinc-700 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <CardHeader className="bg-zinc-950/25 border-b border-zinc-800/80 p-5 flex flex-row justify-between items-start gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      isResume
                        ? "bg-teal-500/10 text-teal-400"
                        : isCoverLetter
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {asset.assetType}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-200 truncate" title={asset.title}>
                      {asset.title || "Untitled Asset"}
                    </h4>
                  </div>
                </CardHeader>
                
                <CardContent className="p-5 flex-1 flex flex-col justify-between gap-5 text-xs text-zinc-400">
                  <div className="space-y-2">
                    {isCoverLetter && (
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Building className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-semibold">{asset.companyName}</span>
                        <span className="text-zinc-500">•</span>
                        <span>{asset.jobTitle}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <User className="w-3.5 h-3.5 text-zinc-650" />
                      <span>Owner: <span className="font-semibold text-zinc-400">{asset.userName || "Unknown"}</span></span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-650" />
                      {new Date(asset.updatedAt || asset.createdAt).toLocaleDateString()}
                    </span>

                    {isResume && (
                      <Link href={`/dashboard/editor?id=${asset.id}`} className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold">
                        Edit Resume
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
