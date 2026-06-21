"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "./i18n-provider";
import { getSyncQueue, dequeueSyncTransaction, removeOfflineDraft } from "@/lib/local-db";
import { saveResumeFullAction, getResumeAction } from "@/app/actions/resumeActions";
import { useToast } from "./ui/toast";
import { AlertTriangle, WifiOff } from "lucide-react";
import { logTelemetryAction } from "@/lib/feature-flags";

interface OfflineSyncContextType {
  isOnline: boolean;
  syncQueueLength: number;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  syncQueueLength: 0,
  isSyncing: false,
  triggerSync: async () => {},
});

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [conflict, setConflict] = useState<{ transaction: any; remote: any } | null>(null);
  const { t } = useTranslation();
  const { success, error, warning } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    setQueueLength(getSyncQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      logTelemetryAction({
        type: "offline",
        level: "info",
        message: "Browser online state restored"
      });
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      logTelemetryAction({
        type: "offline",
        level: "warning",
        message: "Browser offline state detected"
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync check
    if (navigator.onLine) {
      triggerSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    const queue = getSyncQueue();
    setQueueLength(queue.length);
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      await runSyncEngine();
    } catch (err) {
      console.error("Sync Engine error:", err);
    } finally {
      setIsSyncing(false);
      setQueueLength(getSyncQueue().length);
    }
  };

  const runSyncEngine = async () => {
    const queue = getSyncQueue();
    for (const transaction of queue) {
      if (transaction.actionType === "saveResume") {
        const resumeId = transaction.payload.id;
        const localData = transaction.payload;
        
        try {
          // Check for conflicts first: fetch current server version
          const remote = await getResumeAction(resumeId);
          if (remote) {
            const remoteUpdated = new Date(remote.updatedAt).getTime();
            const localUpdated = new Date(localData.updatedAt || transaction.timestamp).getTime();
            
            // Conflict exists if the remote version was updated after our local base state
            if (remoteUpdated > localUpdated) {
              setConflict({ transaction, remote });
              return; // Halt sync queue processing for user action
            }
          }

          // If no conflict or resolved, execute action
          await saveResumeFullAction(resumeId, localData);
          removeOfflineDraft(resumeId);
          dequeueSyncTransaction(transaction.id);
          success(t("synced_msg") || "All changes synced!");
        } catch (err: any) {
          console.error(`Failed to sync transaction ${transaction.id}:`, err);
          logTelemetryAction({
            type: "offline",
            level: "error",
            message: `Resume sync failed for ID: ${resumeId}`,
            details: { error: err.message || err }
          });
          break; // Stop and retry later on network recovery
        }
      } else {
        // Fallback discard for unsupported actions
        dequeueSyncTransaction(transaction.id);
      }
    }
  };

  const resolveConflict = async (resolution: "keep_local" | "keep_remote") => {
    if (!conflict) return;

    const { transaction, remote } = conflict;
    const resumeId = transaction.payload.id;

    try {
      if (resolution === "keep_local") {
        // Force-save local data to the server
        await saveResumeFullAction(resumeId, transaction.payload);
        success("Server version updated with offline local edits.");
      } else {
        // Discard local and keep server version
        warning("Offline local edits discarded. Remote version kept.");
      }
      
      removeOfflineDraft(resumeId);
      dequeueSyncTransaction(transaction.id);
      setConflict(null);
      
      // Resume sync processing
      setTimeout(() => {
        triggerSync();
      }, 300);
    } catch (err: any) {
      error("Failed to resolve sync conflict: " + err.message);
    }
  };

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        syncQueueLength: queueLength,
        isSyncing,
        triggerSync,
      }}
    >
      {children}

      {/* Floating Offline Notification Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-50/95 px-4 py-3.5 text-xs text-amber-900 shadow-xl backdrop-blur-md dark:border-amber-900/30 dark:bg-amber-950/90 dark:text-amber-200">
          <WifiOff className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
          <div className="space-y-0.5">
            <p className="font-bold text-sm leading-tight">{t("offline_badge") || "Working Offline"}</p>
            <p className="opacity-90 text-[11px] leading-tight">
              {t("offline_msg") || "Changes will save locally and auto-sync when online."}
            </p>
          </div>
        </div>
      )}

      {/* Syncing Indicator Spinner */}
      {isOnline && isSyncing && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-zinc-900/90 border border-zinc-800 text-white rounded-lg shadow-xl text-xs backdrop-blur-md dark:bg-zinc-950/90">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="font-semibold">{t("syncing_msg") || "Syncing changes..."}</span>
        </div>
      )}

      {/* Conflict Resolution Modal Dialog */}
      {conflict && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold">Resume Sync Conflict Detected</h3>
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              The resume <strong>"{conflict.transaction.payload.title || "Untitled"}"</strong> was updated on the server while you were offline.
              Please select which changes you want to keep.
            </p>

            <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400 space-y-1.5 border">
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Local changes (offline):</span>{" "}
                {new Date(conflict.transaction.timestamp).toLocaleTimeString()}
              </div>
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Server changes (remote):</span>{" "}
                {new Date(conflict.remote.updatedAt).toLocaleTimeString()}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => resolveConflict("keep_remote")}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Keep Server Version
              </button>
              <button
                onClick={() => resolveConflict("keep_local")}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md transition-colors"
              >
                Keep Offline Local Version
              </button>
            </div>
          </div>
        </div>
      )}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSync() {
  return useContext(OfflineSyncContext);
}
