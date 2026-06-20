"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { createOrganizationAction } from "@/app/actions/orgActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Building, Plus, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  branding: any;
  ownerId: string;
  createdAt: string;
}

interface OrganizationsClientProps {
  initialOrgs: Organization[];
}

export default function OrganizationsClient({ initialOrgs }: OrganizationsClientProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [orgs, setOrgs] = useState<Organization[]>(initialOrgs);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDesc, setNewOrgDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newOrgName.trim()) return;

    setCreating(true);
    try {
      const org = await createOrganizationAction(user.id, newOrgName, newOrgDesc);
      setOrgs((prev) => [org, ...prev]);
      setNewOrgName("");
      setNewOrgDesc("");
      setModalOpen(false);
      toastSuccess(`Organization "${org.name}" registered successfully`);
      
      // Redirect to the organization's workspaces page
      window.location.href = `/dashboard/organizations/${org.id}/workspaces`;
    } catch (err: any) {
      toastError(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-950/20 via-zinc-900/10 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">Enterprise Organization Center</h2>
          <p className="text-xs text-zinc-400">Select an active organization, manage memberships, shared assets, and seat billing.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          New Organization
        </Button>
      </div>

      {/* Grid listing */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.length === 0 ? (
          <div className="col-span-full border border-zinc-800 bg-zinc-900/10 rounded-2xl p-12 text-center text-zinc-500 space-y-4">
            <Building className="w-12 h-12 text-zinc-800 mx-auto animate-pulse" />
            <h4 className="font-bold text-sm text-zinc-400">No Organizations Joined</h4>
            <p className="text-xs text-zinc-500 font-mono max-w-sm mx-auto">
              Create an organization to invite teammates, share assets, compile candidate lists, and collaborate.
            </p>
            <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs">
              Create Organization
            </Button>
          </div>
        ) : (
          orgs.map((org) => (
            <Card
              key={org.id}
              className="bg-zinc-900/35 border-zinc-800 hover:border-zinc-700 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group"
              onClick={() => {
                window.location.href = `/dashboard/organizations/${org.id}/workspaces`;
              }}
            >
              <CardHeader className="bg-zinc-950/25 border-b border-zinc-800/80 p-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-zinc-200">{org.name}</CardTitle>
                      <CardDescription className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {org.id.split("-")[0]}...</CardDescription>
                    </div>
                  </div>
                  {org.ownerId === user?.id && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">
                      OWNER
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6 text-xs text-zinc-400">
                <p className="italic min-h-8">"{org.description || "No description logged for this organization."}"</p>
                <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3 text-[10px] font-mono">
                  <span>Joined: {new Date(org.createdAt).toLocaleDateString()}</span>
                  <span className="text-indigo-400 font-bold group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-0.5">
                    Enter
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Org Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all" onClick={() => setModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl z-50 p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-50">Create Organization</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Setup an isolated enterprise team workspaces workspace and seats billing plan.</p>
            </div>
            
            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organization Name</label>
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <Input
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="e.g. Recruiting, Resume Reviews & Placement"
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                />
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
                  disabled={creating || !newOrgName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9"
                >
                  {creating ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
