"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  FolderOpen,
  Plus,
  ArrowRight,
  Activity,
  FileText,
  Briefcase,
  GraduationCap,
  Calendar,
  Building,
  ChevronRight,
  Loader2,
  Clock,
  User
} from "lucide-react";
import {
  createWorkspaceAction,
  getWorkspaceAssetsAction,
  getWorkspaceActivityLogsAction
} from "@/app/actions/orgActions";

interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  type: "personal" | "startup" | "agency" | "university" | "corporate" | "career_center";
  createdAt: string;
  updatedAt: string;
}

interface WorkspacesClientProps {
  orgId: string;
  role: string;
  userId: string;
  initialWorkspaces: Workspace[];
}

export default function WorkspacesClient({
  orgId,
  role,
  userId,
  initialWorkspaces
}: WorkspacesClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  
  // Workspace assets and logs
  const [assets, setAssets] = useState<{ resumes: any[]; coverLetters: any[]; documents: any[] } | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Creation form state
  const [newWsName, setNewWsName] = useState("");
  const [newWsType, setNewWsType] = useState<string>("corporate");
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const canCreate = ["owner", "admin", "manager"].includes(role);

  // Fetch details when selected workspace changes
  useEffect(() => {
    if (!selectedWorkspace) {
      setAssets(null);
      setActivities([]);
      return;
    }

    async function loadWorkspaceDetails() {
      setLoadingDetails(true);
      try {
        const assetsData = await getWorkspaceAssetsAction(selectedWorkspace!.id);
        const logsData = await getWorkspaceActivityLogsAction(selectedWorkspace!.id);
        setAssets(assetsData);
        setActivities(logsData);
      } catch (err: any) {
        toastError(err.message || "Failed to load workspace data");
      } finally {
        setLoadingDetails(false);
      }
    }

    loadWorkspaceDetails();
  }, [selectedWorkspace, toastError]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setCreating(true);
    try {
      const newWs = await createWorkspaceAction(orgId, newWsName.trim(), newWsType);
      setWorkspaces((prev) => [...prev, newWs]);
      setNewWsName("");
      setNewWsType("corporate");
      setModalOpen(false);
      toastSuccess(`Workspace "${newWs.name}" created successfully`);
    } catch (err: any) {
      toastError(err.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  // Helper to render workspace type badge
  const renderTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; bg: string; text: string; icon: any }> = {
      personal: { label: "Personal", bg: "bg-teal-500/10", text: "text-teal-400", icon: FolderOpen },
      startup: { label: "Startup", bg: "bg-amber-500/10", text: "text-amber-400", icon: Building },
      agency: { label: "Agency", bg: "bg-blue-500/10", text: "text-blue-400", icon: Briefcase },
      university: { label: "University", bg: "bg-pink-500/10", text: "text-pink-400", icon: GraduationCap },
      corporate: { label: "Corporate", bg: "bg-indigo-500/10", text: "text-indigo-400", icon: Building },
      career_center: { label: "Career Center", bg: "bg-purple-500/10", text: "text-purple-400", icon: GraduationCap }
    };

    const details = badges[type] || { label: type, bg: "bg-zinc-500/10", text: "text-zinc-400", icon: FolderOpen };
    const Icon = details.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${details.bg} ${details.text}`}>
        <Icon className="w-3 h-3" />
        {details.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">Workspaces Directory</h2>
          <p className="text-xs text-zinc-400">Manage isolated directories, project scopes, team resume logs, and collaboration areas.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Workspace
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workspaces List (Left 2 cols or 1 col based on selection) */}
        <div className={`space-y-4 lg:col-span-2 ${selectedWorkspace ? "lg:col-span-1" : "lg:col-span-3"}`}>
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400">Available Workspaces ({workspaces.length})</h3>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                className={`bg-zinc-900/35 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden ${selectedWorkspace?.id === ws.id ? "ring-2 ring-indigo-500/50 border-indigo-500/50" : ""}`}
                onClick={() => setSelectedWorkspace(ws)}
              >
                <CardContent className="p-5 flex justify-between items-center gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-200 truncate">{ws.name}</h4>
                      {renderTypeBadge(ws.type)}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">Created: {new Date(ws.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Workspace Panel (Right Col) */}
        {selectedWorkspace && (
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-200">{selectedWorkspace.name}</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Workspace UUID: {selectedWorkspace.id}</p>
              </div>
              <Button
                variant="outline"
                className="h-7 text-[10px] font-bold border-zinc-800 text-zinc-400 hover:text-white"
                onClick={() => setSelectedWorkspace(null)}
              >
                Close Details
              </Button>
            </div>

            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs font-mono">Querying assets & activity...</span>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Assets Card */}
                <Card className="bg-zinc-900/25 border-zinc-800">
                  <CardHeader className="p-4 border-b border-zinc-800/80">
                    <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Shared Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Resumes */}
                    <div>
                      <h5 className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider mb-2">Resumes ({assets?.resumes?.length || 0})</h5>
                      {assets?.resumes?.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic">No resumes found</p>
                      ) : (
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {assets?.resumes.map((r: any) => (
                            <li key={r.id} className="flex justify-between items-center bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
                              <span className="font-semibold truncate max-w-[150px]">{r.title}</span>
                              <span className="text-[9px] text-zinc-500 truncate">By {r.userName || "Unknown"}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Cover Letters */}
                    <div>
                      <h5 className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider mb-2">Cover Letters ({assets?.coverLetters?.length || 0})</h5>
                      {assets?.coverLetters?.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic">No cover letters found</p>
                      ) : (
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {assets?.coverLetters.map((c: any) => (
                            <li key={c.id} className="flex justify-between items-center bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
                              <span className="font-semibold truncate max-w-[150px]">{c.title}</span>
                              <span className="text-[9px] text-zinc-500 truncate">By {c.userName || "Unknown"}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Activities Card */}
                <Card className="bg-zinc-900/25 border-zinc-800">
                  <CardHeader className="p-4 border-b border-zinc-800/80">
                    <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Activity Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-zinc-650 italic text-[10px]">
                        No workspace logs found.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {activities.map((act) => (
                          <div key={act.id} className="flex items-start gap-2.5 text-[11px] border-l border-zinc-800 pl-3 relative">
                            <div className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-indigo-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-300">
                                <span className="font-bold text-zinc-100">{act.userName}</span>:{" "}
                                <span className="font-mono text-zinc-400">{act.actionType}</span>
                              </p>
                              {act.details && (
                                <p className="text-[9px] text-zinc-500 truncate font-mono mt-0.5">
                                  {JSON.stringify(act.details)}
                                </p>
                              )}
                              <span className="text-[8px] text-zinc-650 block mt-1 font-mono flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(act.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl z-50 p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-50">Create Team Workspace</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Isolate specific team projects, client scopes, and permissions.</p>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Workspace Name</label>
                <Input
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Career Counseling Queue"
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Workspace Type</label>
                <select
                  value={newWsType}
                  onChange={(e) => setNewWsType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="corporate">Corporate</option>
                  <option value="startup">Startup</option>
                  <option value="university">University</option>
                  <option value="agency">Agency</option>
                  <option value="career_center">Career Center</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 text-zinc-500 hover:text-white"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !newWsName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9"
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
