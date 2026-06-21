"use client";

export interface SyncTransaction {
  id: string;
  actionType: "saveResume" | "updateSettings" | "createResume" | "deleteResume";
  payload: any;
  timestamp: number;
  version: number;
}

const SYNC_QUEUE_KEY = "rai_sync_queue";
const OFFLINE_DRAFTS_PREFIX = "rai_draft_";
const TEMPLATE_CACHE_KEY = "rai_template_cache";
const AI_COACH_CACHE_KEY = "rai_ai_coach_cache";

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// 1. Sync Queue Management
export function getSyncQueue(): SyncTransaction[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read sync queue from localStorage:", e);
    return [];
  }
}

export function saveSyncQueue(queue: SyncTransaction[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save sync queue to localStorage:", e);
  }
}

export function enqueueSyncTransaction(
  actionType: SyncTransaction["actionType"],
  payload: any,
  version: number = 1
): void {
  if (!isBrowser()) return;
  const queue = getSyncQueue();
  
  // To avoid duplicate transactions for the same resume save, we can merge or replace
  let updatedQueue = [...queue];
  if (actionType === "saveResume") {
    // If there is already a saveResume transaction for the same resume id, update its payload
    const existingIndex = queue.findIndex(
      (t) => t.actionType === "saveResume" && t.payload.id === payload.id
    );
    if (existingIndex > -1) {
      updatedQueue[existingIndex] = {
        ...updatedQueue[existingIndex],
        payload,
        timestamp: Date.now(),
        version: Math.max(updatedQueue[existingIndex].version, version)
      };
      saveSyncQueue(updatedQueue);
      return;
    }
  }

  const transaction: SyncTransaction = {
    id: `${actionType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    actionType,
    payload,
    timestamp: Date.now(),
    version,
  };
  updatedQueue.push(transaction);
  saveSyncQueue(updatedQueue);
}

export function dequeueSyncTransaction(id: string): void {
  if (!isBrowser()) return;
  const queue = getSyncQueue();
  const filtered = queue.filter((t) => t.id !== id);
  saveSyncQueue(filtered);
}

export function clearSyncQueue(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (e) {
    console.error("Failed to clear sync queue:", e);
  }
}

// 2. Offline Drafts Management
export function saveOfflineDraft(resumeId: string, resumeData: any): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      `${OFFLINE_DRAFTS_PREFIX}${resumeId}`,
      JSON.stringify({
        data: resumeData,
        updatedAt: Date.now(),
        version: resumeData.version || 1
      })
    );
  } catch (e) {
    console.error("Failed to save offline draft:", e);
  }
}

export function getOfflineDraft(resumeId: string): any | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(`${OFFLINE_DRAFTS_PREFIX}${resumeId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data;
  } catch (e) {
    console.error("Failed to get offline draft:", e);
    return null;
  }
}

export function removeOfflineDraft(resumeId: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(`${OFFLINE_DRAFTS_PREFIX}${resumeId}`);
  } catch (e) {
    console.error("Failed to remove offline draft:", e);
  }
}

export function getAllOfflineDrafts(): Record<string, any> {
  if (!isBrowser()) return {};
  const drafts: Record<string, any> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(OFFLINE_DRAFTS_PREFIX)) {
        const id = key.substring(OFFLINE_DRAFTS_PREFIX.length);
        const draft = getOfflineDraft(id);
        if (draft) {
          drafts[id] = draft;
        }
      }
    }
  } catch (e) {
    console.error("Failed to list all offline drafts:", e);
  }
  return drafts;
}

// 3. Cache Management (Templates & AI Coach logs)
export function cacheTemplates(templates: any[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      TEMPLATE_CACHE_KEY,
      JSON.stringify({
        templates,
        cachedAt: Date.now()
      })
    );
  } catch (e) {
    console.error("Failed to cache templates:", e);
  }
}

export function getCachedTemplates(): any[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(TEMPLATE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.templates;
  } catch (e) {
    console.error("Failed to get cached templates:", e);
    return null;
  }
}

export function cacheAiCoachHistory(history: any[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      AI_COACH_CACHE_KEY,
      JSON.stringify({
        history,
        cachedAt: Date.now()
      })
    );
  } catch (e) {
    console.error("Failed to cache AI Coach history:", e);
  }
}

export function getCachedAiCoachHistory(): any[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(AI_COACH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.history;
  } catch (e) {
    console.error("Failed to get cached AI Coach history:", e);
    return null;
  }
}
