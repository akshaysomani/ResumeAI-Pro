"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getDocumentCommentsAction,
  createCommentAction,
  resolveCommentAction,
  acquireDocumentLockAction,
  releaseDocumentLockAction,
  getDocumentLockAction,
  heartbeatPresenceAction,
  getWorkspacePresenceAction
} from "@/app/actions/orgActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Lock,
  Unlock,
  MessageSquare,
  CheckCircle2,
  User,
  Send,
  Users,
  AlertTriangle,
  Bookmark,
  Highlighter
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface CollaborationPanelProps {
  resumeId: string;
  workspaceId: string;
  userId: string;
  userName: string;
  onLockChange?: (locked: boolean) => void;
}

export default function CollaborationEditorPanel({
  resumeId,
  workspaceId,
  userId,
  userName,
  onLockChange
}: CollaborationPanelProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [comments, setComments] = useState<any[]>([]);
  const [activeLock, setActiveLock] = useState<any | null>(null);
  const [presenceList, setPresenceList] = useState<any[]>([]);
  
  // Composers
  const [newComment, setNewComment] = useState("");
  const [highlightText, setHighlightText] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Lock and Presence Synchronization loop
  const syncLockAndPresence = useCallback(async () => {
    try {
      // Send heartbeat
      await heartbeatPresenceAction(workspaceId, userId);

      // Get lock details
      const lock = await getDocumentLockAction("resume", resumeId);
      setActiveLock(lock);
      
      if (lock && lock.userId !== userId) {
        onLockChange?.(true);
      } else {
        // Try to acquire lock if free or already ours
        const acquired = await acquireDocumentLockAction("resume", resumeId, userId);
        onLockChange?.(!acquired);
      }

      // Fetch active workspace members presence
      const presence = await getWorkspacePresenceAction(workspaceId);
      setPresenceList(presence.filter((p) => p.userId !== userId));
    } catch (err) {
      console.warn("Presence sync timed out:", err);
    }
  }, [resumeId, workspaceId, userId, onLockChange]);

  // 2. Fetch comments list
  const fetchComments = useCallback(async () => {
    try {
      const data = await getDocumentCommentsAction("resume", resumeId);
      setComments(data);
    } catch (err) {
      console.warn("Failed to load reviews thread:", err);
    }
  }, [resumeId]);

  // Concurrency Intervals
  useEffect(() => {
    // Initial sync
    syncLockAndPresence();
    fetchComments();

    // Lock and presence check every 8 seconds
    const syncInterval = setInterval(syncLockAndPresence, 8000);
    // Comments load every 12 seconds
    const commentsInterval = setInterval(fetchComments, 12000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(commentsInterval);
      // Release lock when closing editor
      releaseDocumentLockAction("resume", resumeId, userId);
    };
  }, [resumeId, syncLockAndPresence, fetchComments, userId]);

  // Post Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Check if another user holds the lock
    if (activeLock && activeLock.userId !== userId) {
      toastError("This document is currently locked by another editor.");
      return;
    }

    setLoading(true);
    try {
      const data = await createCommentAction({
        documentType: "resume",
        documentId: resumeId,
        userId,
        content: newComment,
        highlightText: highlightText || null
      });

      setComments((prev) => [...prev, data]);
      setNewComment("");
      setHighlightText("");
      toastSuccess("Review comment added successfully");
    } catch (err: any) {
      toastError(err.message || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  // Resolve Thread
  const handleResolveComment = async (commentId: string) => {
    try {
      await resolveCommentAction(commentId, userId);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c))
      );
      toastSuccess("Comment thread marked resolved");
    } catch (err: any) {
      toastError(err.message || "Failed to resolve thread");
    }
  };

  const isLockedByOthers = activeLock && activeLock.userId !== userId;

  return (
    <div className="space-y-6 text-left">
      {/* Active Presence Banner */}
      <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl space-y-2">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          Active Collaborators ({presenceList.length + 1})
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {/* Current User */}
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-ping" />
            {userName} (You)
          </span>
          {/* Others present */}
          {presenceList.map((p) => (
            <span
              key={p.userId}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-350 border border-zinc-700 font-mono"
            >
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {p.userName}
            </span>
          ))}
        </div>
      </div>

      {/* Locking Banner Alerts */}
      {isLockedByOthers ? (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-xs text-red-300 flex items-start gap-3">
          <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-red-200">Editor Locked</h5>
            <p className="mt-1 text-[11px] leading-relaxed">
              This document is currently being edited by <strong>{activeLock.userName}</strong>. Your edits are locked to prevent overwrite conflicts. Please wait until they close the file.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-900/30 text-xs text-emerald-350 flex items-start gap-3">
          <Unlock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-emerald-300">Workspace Safe</h5>
            <p className="mt-1 text-[11px] leading-relaxed">
              You hold the active concurrency lock. Any modifications you make will sync and save automatically.
            </p>
          </div>
        </div>
      )}

      {/* Review Comments Thread */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reviews & Tasks Board</h4>
        
        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono italic py-4">No reviews or tasks comments added yet.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                  comment.resolved
                    ? "bg-zinc-950/25 border-zinc-900 text-zinc-500"
                    : "bg-zinc-900/20 border-zinc-800 text-zinc-200"
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-zinc-600" />
                    <strong>{comment.userName}</strong>
                  </span>
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>

                {comment.highlightText && (
                  <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/80 italic text-[11px] text-indigo-300 flex items-start gap-1.5">
                    <Highlighter className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>"{comment.highlightText}"</span>
                  </div>
                )}

                <p className="leading-relaxed font-sans">{comment.content}</p>

                <div className="flex justify-between items-center pt-1">
                  {comment.resolved ? (
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      RESOLVED
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[9px] font-bold h-6 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-1"
                      onClick={() => handleResolveComment(comment.id)}
                    >
                      Resolve Thread
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comment Form Composer */}
      <form onSubmit={handlePostComment} className="pt-4 border-t border-zinc-800 space-y-3.5">
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Add Feedback
        </h4>

        {/* Text highlight reference (Optional) */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Highlight Text context (Optional)</label>
          <Input
            value={highlightText}
            onChange={(e) => setHighlightText(e.target.value)}
            placeholder="Selected phrase context..."
            className="bg-zinc-950 border-zinc-800 h-8 text-[11px] rounded-lg"
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Review Message</label>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type comment description, task or reviews note..."
            className="bg-zinc-950 border-zinc-800 text-xs rounded-xl h-20 placeholder-zinc-700"
            disabled={isLockedByOthers}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !newComment.trim() || isLockedByOthers}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white h-9"
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {loading ? "Posting..." : "Post Review Note"}
        </Button>
      </form>
    </div>
  );
}
