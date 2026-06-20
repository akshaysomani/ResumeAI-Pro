"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import {
  assignTicketAction,
  updateTicketStatusAction,
  getTicketRepliesAction,
  postTicketReplyAction
} from "@/app/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  LifeBuoy,
  User,
  Clock,
  Shield,
  Send,
  MessageSquare,
  AlertTriangle,
  Lock,
  Globe
} from "lucide-react";

interface SupportTicket {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "assigned" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
}

interface SupportTicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

interface Agent {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface SupportClientProps {
  initialTickets: SupportTicket[];
  agents: Agent[];
}

export default function SupportClient({ initialTickets, agents }: SupportClientProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Form states
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [postingReply, setPostingReply] = useState(false);

  // Fetch replies when selected ticket changes
  useEffect(() => {
    if (!selectedTicket) return;

    const fetchReplies = async () => {
      setLoadingReplies(true);
      try {
        const data = await getTicketRepliesAction(selectedTicket.id);
        setReplies(data);
      } catch (err: any) {
        toastError(err.message || "Failed to load ticket replies");
      } finally {
        setLoadingReplies(false);
      }
    };

    fetchReplies();
  }, [selectedTicket]);

  // Handle status update
  const handleStatusChange = async (ticketId: string, status: "open" | "assigned" | "resolved" | "closed") => {
    if (!user) return;
    try {
      await updateTicketStatusAction(user.id, ticketId, status);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
      }
      toastSuccess(`Ticket status updated to ${status}`);
    } catch (err: any) {
      toastError(err.message || "Failed to update ticket status");
    }
  };

  // Handle assignee change
  const handleAssigneeChange = async (ticketId: string, agentId: string) => {
    if (!user) return;
    const finalAgentId = agentId === "none" ? null : agentId;
    const targetAgent = agents.find((a) => a.id === agentId);

    try {
      await assignTicketAction(user.id, ticketId, finalAgentId);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                assignedTo: finalAgentId,
                assignedToName: targetAgent ? targetAgent.fullName : null,
                status: finalAgentId ? "assigned" : "open"
              }
            : t
        )
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                assignedTo: finalAgentId,
                assignedToName: targetAgent ? targetAgent.fullName : null,
                status: finalAgentId ? "assigned" : "open"
              }
            : null
        );
      }
      toastSuccess(
        finalAgentId
          ? `Ticket assigned to ${targetAgent?.fullName}`
          : "Ticket unassigned successfully"
      );
    } catch (err: any) {
      toastError(err.message || "Failed to assign ticket");
    }
  };

  // Handle post reply
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    setPostingReply(true);
    try {
      const newReply = await postTicketReplyAction({
        actorId: user.id,
        ticketId: selectedTicket.id,
        content: replyText,
        isInternal
      });

      // Fetch user profile info for current actor
      const replyWithSender: SupportTicketReply = {
        ...newReply,
        senderName: user.email?.split("@")[0] || "Administrator",
        senderRole: "Admin"
      };

      setReplies((prev) => [...prev, replyWithSender]);
      setReplyText("");
      setIsInternal(false);
      toastSuccess(isInternal ? "Internal agent note saved" : "Public reply sent");

      // Update parent ticket last updated time locally
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, updatedAt: new Date().toISOString() } : t
        )
      );
    } catch (err: any) {
      toastError(err.message || "Failed to post reply");
    } finally {
      setPostingReply(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] border border-zinc-800 rounded-2xl bg-zinc-900/10 overflow-hidden">
      {/* Left Pane: Ticket Selector List */}
      <div className="w-1/3 border-r border-zinc-800 bg-zinc-950/20 flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tickets Queue ({tickets.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
          {tickets.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-600 font-mono">No customer support tickets active.</div>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const priorityColor = {
                low: "bg-zinc-800 text-zinc-400",
                medium: "bg-indigo-500/10 text-indigo-400",
                high: "bg-amber-500/10 text-amber-400",
                urgent: "bg-red-500/10 text-red-400"
              }[t.priority];

              return (
                <div
                  key={t.id}
                  className={`p-4 cursor-pointer hover:bg-zinc-900/20 transition-all ${
                    isSelected ? "bg-zinc-900/40 border-l-2 border-indigo-500" : ""
                  }`}
                  onClick={() => setSelectedTicket(t)}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="font-bold text-xs text-zinc-200 line-clamp-1 flex-1">{t.title}</span>
                    <span className={`inline-block px-1 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${priorityColor}`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <span>by: {t.userName || t.userEmail?.split("@")[0]}</span>
                    <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-[9px]">
                    <span className="text-zinc-500 uppercase font-bold">{t.category}</span>
                    <span className="inline-block px-1 bg-zinc-800/80 rounded text-zinc-300 capitalize">{t.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Support Workspace */}
      <div className="flex-1 flex flex-col bg-zinc-950/10">
        {selectedTicket ? (
          <>
            {/* Workspace Header */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{selectedTicket.category} SUPPORT REQUEST</span>
                <h3 className="text-sm font-bold text-zinc-100">{selectedTicket.title}</h3>
                <span className="text-[10px] text-zinc-500 font-mono">From: {selectedTicket.userName} ({selectedTicket.userEmail})</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Status Dropdown */}
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg px-2 h-8 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                {/* Assignee Dropdown */}
                <select
                  value={selectedTicket.assignedTo || "none"}
                  onChange={(e) => handleAssigneeChange(selectedTicket.id, e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg px-2 h-8 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="none">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chat Thread / Messages Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {/* Core Description (Original Ticket request) */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-4.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Customer Issue description
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">{selectedTicket.description}</p>
              </div>

              {/* Loading state replies */}
              {loadingReplies ? (
                <div className="text-center py-6 text-xs text-zinc-500 font-mono">Loading reply thread...</div>
              ) : (
                replies.map((reply) => {
                  const label = reply.isInternal ? "INTERNAL NOTE" : "PUBLIC REPLY";
                  const roleLabel = reply.senderRole ? `(${reply.senderRole})` : "";
                  return (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        reply.isInternal
                          ? "bg-amber-950/15 border-amber-900/40 text-amber-100"
                          : "bg-zinc-900/10 border-zinc-800/60 text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2 mb-2">
                        <span className="text-[10px] font-bold flex items-center gap-1.5">
                          {reply.isInternal ? (
                            <Lock className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Globe className="w-3 h-3 text-zinc-500" />
                          )}
                          <span className={reply.isInternal ? "text-amber-400" : "text-indigo-400"}>
                            {label}
                          </span>
                          <span className="text-zinc-500">
                            by {reply.senderName} {roleLabel}
                          </span>
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed font-sans">{reply.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Composer box footer */}
            <form onSubmit={handlePostReply} className="p-4 border-t border-zinc-800 bg-zinc-950/40 space-y-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type customer reply or internal agent notes..."
                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs rounded-xl h-20 placeholder-zinc-500 focus-visible:ring-indigo-600 focus-visible:ring-1"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300">
                    <Lock className="w-3 h-3 text-amber-500" />
                    Internal agent note (private)
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={postingReply || !replyText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white h-9 px-4.5"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {postingReply ? "Posting..." : isInternal ? "Save Note" : "Send Reply"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-3 p-8">
            <LifeBuoy className="w-12 h-12 text-zinc-700 animate-spin-slow" />
            <h4 className="font-bold text-sm text-zinc-400">Workspace Inactive</h4>
            <p className="text-xs text-zinc-500 max-w-xs text-center font-mono">
              Select an active customer ticket from the left panel queue to inspect history and issue replies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
