"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Users,
  Plus,
  Mail,
  Trash,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import {
  bulkInviteMembersAction,
  removeMemberAction,
  toggleMemberSuspensionAction,
  changeMemberRoleAction,
  resendInvitationAction
} from "@/app/actions/orgActions";

interface Member {
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "manager" | "recruiter" | "career_coach" | "hr" | "hiring_manager" | "interviewer" | "editor" | "viewer";
  status: "active" | "suspended";
  fullName?: string;
  email?: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
}

interface TeamClientProps {
  orgId: string;
  role: string;
  userId: string;
  initialMembers: Member[];
  initialInvitations: Invitation[];
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "recruiter", label: "Recruiter" },
  { value: "career_coach", label: "Career Coach" },
  { value: "hr", label: "HR Specialist" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "interviewer", label: "Interviewer" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" }
];

export default function TeamClient({
  orgId,
  role,
  userId,
  initialMembers,
  initialInvitations
}: TeamClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);

  // Invite states
  const [emailsInput, setEmailsInput] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  // Permissions check
  const isAdminOrOwner = ["owner", "admin"].includes(role);
  const isManager = role === "manager";
  const canManage = isAdminOrOwner || isManager;

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailsInput.trim()) return;

    setInviting(true);
    // Split by commas, semi-colons or newlines
    const emailList = emailsInput
      .split(/[,;\n]/)
      .map((em) => em.trim())
      .filter((em) => em.length > 0 && em.includes("@"));

    if (emailList.length === 0) {
      toastError("No valid email addresses provided.");
      setInviting(false);
      return;
    }

    try {
      const newInvites = await bulkInviteMembersAction(userId, orgId, emailList, inviteRole);
      setInvitations((prev) => [...newInvites, ...prev]);
      setEmailsInput("");
      toastSuccess(`Sent ${newInvites.length} invitations successfully`);
    } catch (err: any) {
      toastError(err.message || "Failed to dispatch invitations");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: string) => {
    try {
      await changeMemberRoleAction(userId, orgId, memberUserId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.userId === memberUserId ? { ...m, role: newRole as any } : m))
      );
      toastSuccess("Role updated successfully");
    } catch (err: any) {
      toastError(err.message || "Failed to change member role");
    }
  };

  const handleToggleSuspension = async (memberUserId: string, currentStatus: string) => {
    const shouldSuspend = currentStatus === "active";
    try {
      await toggleMemberSuspensionAction(userId, orgId, memberUserId, shouldSuspend);
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === memberUserId
            ? { ...m, status: shouldSuspend ? "suspended" : ("active" as any) }
            : m
        )
      );
      toastSuccess(shouldSuspend ? "Member suspended" : "Member access restored");
    } catch (err: any) {
      toastError(err.message || "Failed to update member status");
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeMemberAction(userId, orgId, memberUserId);
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
      toastSuccess("Member removed successfully");
    } catch (err: any) {
      toastError(err.message || "Failed to remove member");
    }
  };

  const handleResendInvitation = async (invId: string) => {
    try {
      await resendInvitationAction(userId, invId);
      toastSuccess("Invitation links refreshed!");
    } catch (err: any) {
      toastError(err.message || "Failed to resend invitation");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">Team Directory</h2>
          <p className="text-xs text-zinc-400">Manage user access rights, team roles, and send invitations.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Bulk Inviter Panel */}
        {canManage && (
          <Card className="bg-zinc-900/25 border-zinc-800 h-fit">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Mail className="w-4 h-4 text-indigo-400" />
                Invite Members
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-500">
                Send invites to multiple email addresses separated by commas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSendInvites} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Addresses</label>
                  <textarea
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    placeholder="e.g. dev@acme.com, hr@acme.com"
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs placeholder-zinc-700 resize-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Default Organization Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs"
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={inviting || !emailsInput.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs"
                >
                  {inviting ? "Sending..." : "Send Invitations"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Members & Invitations Lists */}
        <div className={`space-y-6 ${canManage ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Active Members Card */}
          <Card className="bg-zinc-900/25 border-zinc-800">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4 text-emerald-400" />
                Active Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/20 text-zinc-500 text-[10px] uppercase font-mono font-bold">
                    <th className="px-5 py-3">Member Details</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    {canManage && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {members.map((member) => {
                    const isSelf = member.userId === userId;
                    const isOwnerType = member.role === "owner";

                    return (
                      <tr key={member.userId} className="hover:bg-zinc-900/10">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-zinc-200">{member.fullName || "User Profiles"}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{member.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {isOwnerType ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500/10 text-amber-400 uppercase tracking-widest">
                              Owner
                            </span>
                          ) : canManage && !isSelf ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 font-semibold"
                            >
                              {AVAILABLE_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-400 uppercase tracking-widest">
                              {member.role.replace("_", " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                              member.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-5 py-3.5 text-right space-x-1.5">
                            {!isSelf && !isOwnerType && (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => handleToggleSuspension(member.userId, member.status)}
                                  className={`h-7 px-2.5 text-[9px] font-bold border-zinc-800 ${
                                    member.status === "active"
                                      ? "text-amber-500 hover:bg-amber-950/20"
                                      : "text-emerald-500 hover:bg-emerald-950/20"
                                  }`}
                                >
                                  {member.status === "active" ? <UserX className="w-3.5 h-3.5 mr-1" /> : <UserCheck className="w-3.5 h-3.5 mr-1" />}
                                  {member.status === "active" ? "Suspend" : "Unsuspend"}
                                </Button>
                                <Button
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="h-7 px-2.5 text-[9px] font-bold bg-red-650 hover:bg-red-550 text-white"
                                >
                                  <Trash className="w-3.5 h-3.5 mr-1" />
                                  Remove
                                </Button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Pending Invitations Card */}
          {invitations.length > 0 && (
            <Card className="bg-zinc-900/25 border-zinc-800">
              <CardHeader className="p-5 border-b border-zinc-800/80">
                <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-amber-400" />
                  Pending Invitations ({invitations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/20 text-zinc-500 text-[10px] uppercase font-mono font-bold">
                      <th className="px-5 py-3">Invitee Email</th>
                      <th className="px-5 py-3">Role Assigned</th>
                      <th className="px-5 py-3">Sent On</th>
                      {canManage && <th className="px-5 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-900/10">
                        <td className="px-5 py-3.5 font-mono text-zinc-300">{inv.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-400 uppercase tracking-widest">
                            {inv.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        {canManage && (
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              variant="outline"
                              onClick={() => handleResendInvitation(inv.id)}
                              className="h-7 px-2.5 text-[9px] font-bold border-zinc-800 text-indigo-400 hover:bg-indigo-950/20"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              Resend
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
