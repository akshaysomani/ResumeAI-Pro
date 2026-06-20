"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import {
  updateUserRoleAction,
  toggleUserSuspensionAction,
  deleteUserRecordAction
} from "@/app/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  UserCheck,
  UserMinus,
  Trash2,
  X,
  Shield,
  Clock,
  Briefcase,
  FileText,
  DollarSign
} from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  role: string;
  isSuspended: boolean;
  resumeCount: number;
  totalPaid: number;
}

interface UsersClientProps {
  initialUsers: UserRow[];
}

const ALL_ROLES = [
  "super_admin",
  "platform_admin",
  "support_manager",
  "support_agent",
  "finance_manager",
  "content_manager",
  "analytics_manager",
  "developer",
  "qa_engineer",
  "auditor",
  "user"
];

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const { user: currentActor } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Deletion confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtering users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle Role Change
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentActor) return;
    try {
      await updateUserRoleAction(currentActor.id, userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }
      toastSuccess(`Updated user role to ${newRole.replace("_", " ")}`);
    } catch (err: any) {
      toastError(err.message || "Failed to update user role");
    }
  };

  // Handle Suspension Toggle
  const handleSuspensionToggle = async (userId: string, currentStatus: boolean) => {
    if (!currentActor) return;
    const newStatus = !currentStatus;
    try {
      await toggleUserSuspensionAction(currentActor.id, userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isSuspended: newStatus } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, isSuspended: newStatus } : null));
      }
      toastSuccess(
        newStatus
          ? "User account suspended successfully"
          : "User account unsuspended successfully"
      );
    } catch (err: any) {
      toastError(err.message || "Failed to toggle suspension status");
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!currentActor) return;
    if (deleteConfirmText !== "DELETE") {
      toastError("Please type DELETE to confirm removal.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUserRecordAction(currentActor.id, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUser(null);
      setDeleteConfirmText("");
      toastSuccess("User deleted permanently");
    } catch (err: any) {
      toastError(err.message || "Failed to delete user profile");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Search & Filter Top Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by full name or email address..."
            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 rounded-xl"
          />
        </div>
        <select
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-3 h-10 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace("_", " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Main Table view */}
      <Card className="bg-zinc-900/30 border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/20 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Profile</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Resumes</th>
                <th className="p-4 text-right">Payments</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 font-mono">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-900/10 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedUser(u);
                      setDeleteConfirmText("");
                    }}
                  >
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-zinc-200">{u.fullName || "No Name"}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {u.isSuspended ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 uppercase tracking-wider">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono text-zinc-300">
                      {u.resumeCount}
                    </td>
                    <td className="p-4 text-right font-mono font-semibold text-zinc-300">
                      ${parseFloat(String(u.totalPaid || 0)).toFixed(2)}
                    </td>
                    <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800"
                        onClick={() => {
                          setSelectedUser(u);
                          setDeleteConfirmText("");
                        }}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Actions Drawer Overlay */}
      {selectedUser && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedUser(null)}
          />

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-50">User Operations</h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">ID: {selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
              {/* Profile Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Account Info</h4>
                  <p className="text-md font-bold text-zinc-100">{selectedUser.fullName}</p>
                  <p className="text-xs text-zinc-500 font-mono">{selectedUser.email}</p>
                </div>
                <div className="grid grid-cols-3 gap-3.5 text-center">
                  <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
                    <Clock className="w-4 h-4 mx-auto mb-1.5 text-zinc-500" />
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Joined</span>
                    <span className="text-[10px] font-semibold text-zinc-300 font-mono">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
                    <FileText className="w-4 h-4 mx-auto mb-1.5 text-indigo-400" />
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Resumes</span>
                    <span className="text-[10px] font-bold text-indigo-300 font-mono">{selectedUser.resumeCount}</span>
                  </div>
                  <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
                    <DollarSign className="w-4 h-4 mx-auto mb-1.5 text-emerald-400" />
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Paid</span>
                    <span className="text-[10px] font-bold text-emerald-300 font-mono">
                      ${parseFloat(String(selectedUser.totalPaid)).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action: Role management */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Assign Authorization Level
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                  disabled={selectedUser.id === currentActor?.id}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-xl px-3.5 h-10 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
                {selectedUser.id === currentActor?.id && (
                  <p className="text-[9px] text-zinc-500">You cannot self-downgrade or self-modify your own role.</p>
                )}
              </div>

              {/* Action: Toggle suspension */}
              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Suspension Status</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Suspend this user from entering ResumeAI Pro.</p>
                  </div>
                  <Button
                    variant={selectedUser.isSuspended ? "default" : "danger"}
                    size="sm"
                    disabled={selectedUser.id === currentActor?.id}
                    className="text-xs font-bold px-3 h-8 text-white bg-indigo-600 hover:bg-indigo-500 hover:text-white"
                    onClick={() => handleSuspensionToggle(selectedUser.id, selectedUser.isSuspended)}
                  >
                    {selectedUser.isSuspended ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                        Unsuspend
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-3.5 h-3.5 mr-1" />
                        Suspend User
                      </>
                    )}
                  </Button>
                </div>
                {selectedUser.id === currentActor?.id && (
                  <p className="text-[9px] text-zinc-500">You cannot self-suspend your active admin session.</p>
                )}
              </div>

              {/* Action: Delete cascading profile */}
              <div className="pt-6 border-t border-zinc-800 space-y-4 bg-red-950/10 p-5 rounded-2xl border border-red-950">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    Danger: Terminate Profile
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    This permanently deletes the profile, all their resumes, transactions, documents, and interview histories from PostgreSQL. This is non-reversible.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-zinc-500">
                    To proceed, type <strong className="text-red-400">DELETE</strong> in the box below:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE..."
                    disabled={selectedUser.id === currentActor?.id}
                    className="bg-zinc-950 border-red-900/50 text-red-200 placeholder-zinc-700 h-9 text-xs rounded-xl"
                  />
                  <Button
                    variant="danger"
                    className="w-full text-xs font-bold h-9 text-white bg-red-600 hover:bg-red-500"
                    disabled={deleteConfirmText !== "DELETE" || isDeleting || selectedUser.id === currentActor?.id}
                    onClick={() => handleDeleteUser(selectedUser.id)}
                  >
                    {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
