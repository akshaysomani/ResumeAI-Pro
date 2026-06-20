"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Clock,
  Share2,
  Download,
  Copy,
  Printer,
  ChevronDown,
  Wand2,
  Check,
  X,
  Lock,
  Globe,
  FileText,
  Bookmark,
  Calendar,
  Send,
  Eye
} from "lucide-react";
import {
  getDocumentByIdAction,
  updateDocumentAction,
  getFoldersAction,
  getDocumentVersionsAction,
  createVersionSnapshotAction,
  restoreVersionAction,
  getDocumentShareSettingsAction,
  updateDocumentShareSettingsAction
} from "@/app/actions/documentActions";
import { queryResumesAction } from "@/app/actions/resumeActions";
import { sendResumeEmailAction } from "@/app/actions/shareActions";
import type { CareerDocument, DocumentFolder, Resume, CareerDocumentVersion, CareerDocumentShare } from "@/types";

// Dynamic inputs schema per document type category
const CUSTOM_FIELD_SCHEMAS: Record<string, { key: string; label: string; placeholder: string; isTextarea?: boolean }[]> = {
  cover_letter: [
    { key: "companyName", label: "Company Name", placeholder: "e.g. Google Inc." },
    { key: "jobTitle", label: "Target Job Title", placeholder: "e.g. Senior Frontend Architect" },
    { key: "hiringManager", label: "Hiring Manager Name", placeholder: "e.g. Mr. Jane Schmidt (or leave blank)" },
    { key: "jobDescription", label: "Target Job Description Highlights", placeholder: "e.g. Spearhead React modernization, implement state libraries...", isTextarea: true }
  ],
  cold_email: [
    { key: "recipientName", label: "Recipient Name", placeholder: "e.g. Ms. Sarah Jenkins" },
    { key: "companyName", label: "Target Company", placeholder: "e.g. OpenAI" },
    { key: "jobTitle", label: "Target Role", placeholder: "e.g. Research Software Lead" },
    { key: "context", label: "Mutual Link / Reference Context", placeholder: "e.g. Enjoyed your paper on multi-agent alignment..." },
    { key: "ask", label: "Key Call to Action", placeholder: "e.g. 10-minute zoom call to seek guidance" }
  ],
  referral_email: [
    { key: "referrerName", label: "Referrer Contact Name", placeholder: "e.g. David Somani" },
    { key: "relationship", label: "Relationship Context", placeholder: "e.g. Former Stanford classmate" },
    { key: "companyName", label: "Target Company", placeholder: "e.g. Stripe" },
    { key: "jobTitle", label: "Target Job & ID", placeholder: "e.g. Staff Security Engineer (ID: 104523)" }
  ],
  recruiter_follow_up: [
    { key: "recruiterName", label: "Recruiter Name", placeholder: "e.g. Arthur Miller" },
    { key: "companyName", label: "Company", placeholder: "e.g. Meta Platform" },
    { key: "jobTitle", label: "Job Title", placeholder: "e.g. Senior Full-Stack Engineer" },
    { key: "applicationDate", label: "Application Date Context", placeholder: "e.g. Applied via portal on June 10th" }
  ],
  thank_you_email: [
    { key: "interviewerName", label: "Interviewer Name(s)", placeholder: "e.g. Dr. Arthur & Team" },
    { key: "companyName", label: "Company", placeholder: "e.g. Microsoft Research" },
    { key: "jobTitle", label: "Role Interviewed For", placeholder: "e.g. Senior ML Engineer" },
    { key: "highlights", label: "Topic Discussed / Highlight Point", placeholder: "e.g. Shared background in training model latent layers...", isTextarea: true }
  ],
  sop: [
    { key: "university", label: "Target University", placeholder: "e.g. Massachusetts Institute of Technology" },
    { key: "program", label: "Target Program Name", placeholder: "e.g. MS in Computer Science" },
    { key: "research", label: "Research Focus / Fields of Study", placeholder: "e.g. Distributed networks, AI alignment...", isTextarea: true },
    { key: "achievements", label: "Key Academic Honors", placeholder: "e.g. Winner of Undergraduate Thesis Award, GPA 4.0", isTextarea: true }
  ],
  personal_statement: [
    { key: "university", label: "Target University", placeholder: "e.g. Stanford University" },
    { key: "program", label: "Target Program", placeholder: "e.g. MBA" },
    { key: "background", label: "Core Motivations & Personal Background", placeholder: "e.g. Overcoming educational access issues, startup founder...", isTextarea: true }
  ],
  freelance_proposal: [
    { key: "clientName", label: "Client Name / Company", placeholder: "e.g. Acme Corp CEO" },
    { key: "projectTitle", label: "Project Title", placeholder: "e.g. Custom CRM Redesign & Dashboard" },
    { key: "scope", label: "Proposed Solution & Scope of Work", placeholder: "e.g. React UI components, Node middleware, Postgres schemas...", isTextarea: true },
    { key: "terms", label: "Financial / Timeline Terms", placeholder: "e.g. $8,000 fixed price, completed in 5 weeks" }
  ]
};

const DEFAULT_SCHEMAS = [
  { key: "companyName", label: "Company / Institution", placeholder: "e.g. Google" },
  { key: "jobTitle", label: "Role / Program", placeholder: "e.g. Solutions Lead" },
  { key: "instructions", label: "Custom Details / Focus Keywords", placeholder: "e.g. Focus on cloud migrations, highlight GCP certifications...", isTextarea: true }
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentEditorWorkspace({ params }: PageProps) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const { user } = useAuth();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Data States
  const [doc, setDoc] = useState<CareerDocument | null>(null);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [versions, setVersions] = useState<CareerDocumentVersion[]>([]);
  const [shareSettings, setShareSettings] = useState<CareerDocumentShare | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor States
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [linkedResumeId, setLinkedResumeId] = useState("");
  const [assignedFolderId, setAssignedFolderId] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  
  // Autosave Status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Right Side Panel Tabs
  const [rightTab, setRightTab] = useState<"exports" | "versions" | "sharing">("exports");

  // AI Streaming States
  const [generating, setGenerating] = useState(false);

  // Inline AI Assistant States
  const [selectedText, setSelectedText] = useState("");
  const [inlineSuggestion, setInlineSuggestion] = useState("");
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineOpen, setInlineOpen] = useState(false);

  // Email Sharing Simulation State
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Sharing Passcode State
  const [shareVisibility, setShareVisibility] = useState<"public" | "private" | "password">("private");
  const [sharePassword, setSharePassword] = useState("");
  const [shareDownload, setShareDownload] = useState(true);
  const [sharePrint, setSharePrint] = useState(true);
  const [shareSlug, setShareSlug] = useState("");
  const [savingShare, setSavingShare] = useState(false);

  // Resolve Custom Schema based on Doc Type
  const docTypeSchema = doc ? CUSTOM_FIELD_SCHEMAS[doc.documentType] || DEFAULT_SCHEMAS : DEFAULT_SCHEMAS;

  // Initialize
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!user) return;
      try {
        const [docData, foldersData, resumesResult] = await Promise.all([
          getDocumentByIdAction(user.id, docId),
          getFoldersAction(user.id),
          queryResumesAction({ userId: user.id })
        ]);

        if (!docData) {
          toastError("Document not found.");
          router.push("/dashboard/documents");
          return;
        }

        setDoc(docData);
        setTitle(docData.title);
        setContent(docData.content);
        setFolders(foldersData);
        if (resumesResult && Array.isArray(resumesResult)) {
          setResumes(resumesResult);
        }

        // Parse configurations
        const config = docData.metaConfig || {};
        setTone(config.tone || "Professional");
        setLength(config.length || "medium");
        setLinkedResumeId(docData.resumeId || "");
        setAssignedFolderId(docData.folderId || "");
        setCustomFields(config.customFields || {});

        // Fetch Versions and Shares
        const [verData, shareData] = await Promise.all([
          getDocumentVersionsAction(user.id, docId),
          getDocumentShareSettingsAction(user.id, docId)
        ]);
        setVersions(verData);
        if (shareData) {
          setShareSettings(shareData);
          setShareVisibility(shareData.visibility);
          setShareDownload(shareData.downloadAllowed);
          setSharePrint(shareData.printAllowed);
          setShareSlug(shareData.uniqueSlug);
        }

        setLoading(false);
      } catch (err) {
        toastError("Failed to initialize workspace.");
        router.push("/dashboard/documents");
      }
    };

    loadWorkspace();
  }, [user, docId]);

  // Debounced Autosave (2 seconds)
  useEffect(() => {
    if (loading || !doc || !user) return;

    setSaveStatus("unsaved");
    const timeout = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateDocumentAction(user.id, docId, {
          title: title.trim(),
          content: content,
          folderId: assignedFolderId || null,
          metaConfig: {
            tone,
            length,
            customFields
          }
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus("unsaved");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [content, title, tone, length, assignedFolderId, customFields]);

  // Handle Field Inputs
  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [key]: value }));
  };

  // Generate Document Action (AI Stream)
  const triggerAIGeneration = async () => {
    if (!doc || !user) return;
    setGenerating(true);
    setContent(""); // Clear previous text

    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: doc.documentType,
          title: title.trim(),
          tone,
          length,
          resumeId: linkedResumeId || undefined,
          customFields
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Generation endpoint error");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value);
        setContent((prev) => prev + chunkText);
      }

      success("AI Draft generated successfully.");
      // Create version snapshot automatically on full rewrite
      await handleSaveSnapshot(true);
    } catch (err: any) {
      toastError(err.message || "Failed to generate text. Check credit limits.");
    } finally {
      setGenerating(false);
    }
  };

  // Version Snapshots CRUD
  const handleSaveSnapshot = async (silent = false) => {
    if (!user || !doc) return;
    try {
      const newSnap = await createVersionSnapshotAction(user.id, docId, content, {
        tone,
        length,
        customFields
      });
      if (newSnap) {
        setVersions((prev) => [newSnap, ...prev]);
        if (!silent) success("Version snapshot saved successfully.");
      }
    } catch (err) {
      toastError("Failed to save snapshot.");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!user || !doc || !window.confirm("Restore this snapshot? Current unsaved editor edits will be overridden.")) return;
    try {
      const restored = await restoreVersionAction(user.id, docId, versionId);
      if (restored) {
        setContent(restored.content);
        const config = restored.metaConfig || {};
        setTone(config.tone || "Professional");
        setLength(config.length || "medium");
        setCustomFields(config.customFields || {});
        success("Version restored in editor.");
      }
    } catch (err) {
      toastError("Failed to restore snapshot.");
    }
  };

  // Inline AI Assistant Helpers (Rewrite, Polish, etc.)
  const checkTextSelection = () => {
    const txtArea = textareaRef.current;
    if (!txtArea) return;

    const start = txtArea.selectionStart;
    const end = txtArea.selectionEnd;
    if (start === end) {
      toastError("Please highlight a sentence or paragraph in the editor to apply inline AI polish.");
      return;
    }

    const selected = txtArea.value.substring(start, end);
    setSelectedText(selected);
    setInlineSuggestion("");
    setInlineOpen(true);
  };

  const runInlineAction = async (actionType: "rewrite" | "expand" | "shorten" | "grammar" | "ats-optimize") => {
    setInlineLoading(true);
    setInlineSuggestion("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: "rewrite",
          payload: {
            text: selectedText,
            tone: tone,
            action: actionType
          }
        })
      });

      if (!response.ok) throw new Error("Inline service failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setInlineSuggestion((prev) => prev + text);
      }
    } catch (err) {
      toastError("AI refinement failed.");
    } finally {
      setInlineLoading(false);
    }
  };

  const applyInlineSuggestion = () => {
    const txtArea = textareaRef.current;
    if (!txtArea || !inlineSuggestion) return;

    const start = txtArea.selectionStart;
    const end = txtArea.selectionEnd;
    const originalText = txtArea.value;

    const newText = originalText.substring(0, start) + inlineSuggestion + originalText.substring(end);
    setContent(newText);
    setInlineOpen(false);
    success("AI edit applied to document.");
  };

  // Share settings saving
  const handleSaveShareSettings = async () => {
    if (!user) return;
    setSavingShare(true);
    try {
      const updated = await updateDocumentShareSettingsAction(user.id, docId, {
        visibility: shareVisibility,
        password: sharePassword || undefined,
        downloadAllowed: shareDownload,
        printAllowed: sharePrint,
        uniqueSlug: shareSlug
      });

      if (updated) {
        setShareSettings(updated);
        success("Sharing settings updated successfully.");
      }
    } catch (err) {
      toastError("Failed to save sharing configurations.");
    } finally {
      setSavingShare(false);
    }
  };

  // Simulated recruiter dispatch form
  const handleSendSimulationEmail = async () => {
    if (!recruiterEmail || !emailSubject || !emailMessage) {
      toastError("Please fill in recipient email, subject, and body.");
      return;
    }
    setSendingEmail(true);

    try {
      const publicLink = `${window.location.origin}/documents/share/${shareSlug}`;
      const result = await sendResumeEmailAction({
        recipientEmail: recruiterEmail,
        subject: emailSubject,
        message: `${emailMessage}\n\nAccess Shared Document: ${publicLink}`,
        resumeLink: publicLink
      });

      if (result.success) {
        success(`Simulated document dispatch sent to ${recruiterEmail}. Logged in transactions console.`);
        setRecruiterEmail("");
        setEmailSubject("");
        setEmailMessage("");
      } else {
        toastError("Email delivery skipped.");
      }
    } catch (err) {
      toastError("Failed to deliver email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Export File Formats (Plaintext & HTML download helpers)
  const triggerPlaintextDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    link.click();
    success("Plaintext download triggered.");
  };

  const triggerHtmlDownload = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #1f2937; }
    h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; color: #111827; }
    p { white-space: pre-wrap; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${content}</p>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    link.click();
    success("HTML copy triggered.");
  };

  // Word Doc export handler
  const triggerDocxDownload = async () => {
    try {
      const response = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      if (!response.ok) throw new Error("Word generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.docx`;
      link.click();
      success("Word file downloaded.");
    } catch (err) {
      toastError("Failed to compile DOCX document.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-[90%] max-w-4xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* 1. Header controls */}
      <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/documents")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 font-bold text-sm bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-indigo-500 max-w-xs md:max-w-md px-1.5 focus:bg-white dark:focus:bg-zinc-950"
              />
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                saveStatus === "saved" ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" :
                saveStatus === "saving" ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400" :
                "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
              }`}>
                {saveStatus === "saved" && "Saved"}
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "unsaved" && "Unsaved"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-1.5">
              Workspace Type: {doc?.documentType.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleSaveSnapshot(false)}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Snapshot
          </Button>
          <Button
            size="sm"
            onClick={triggerAIGeneration}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-1.5"
            isLoading={generating}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Write AI Draft
          </Button>
        </div>
      </div>

      {/* 2. Unified Workspace Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* LEFT COLUMN: Input form parameter controller */}
        <div className="lg:col-span-1 border dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 flex flex-col overflow-y-auto p-4 space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider border-b dark:border-zinc-800 pb-2">
            AI Document Tuner
          </h3>

          {/* Tone Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              {["Professional", "Corporate", "Friendly", "Executive", "Technical", "Creative", "Academic", "Minimal", "Formal", "Startup"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Target Length */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Length Scale</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as any)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
            >
              <option value="short">Short (Concise)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="long">Long (Elaborate)</option>
            </select>
          </div>

          {/* Smart Resume Linking */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Link Resume context</label>
            <select
              value={linkedResumeId}
              onChange={(e) => setLinkedResumeId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
            >
              <option value="">No Resume context linked</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>

          {/* Folder Assignments */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Assign Folder</label>
            <select
              value={assignedFolderId}
              onChange={(e) => setAssignedFolderId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
            >
              <option value="">None / Unorganized</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Category fields */}
          <div className="pt-2 border-t dark:border-zinc-800 space-y-3">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Context parameters</h4>
            {docTypeSchema.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">{field.label}</label>
                {field.isTextarea ? (
                  <Textarea
                    placeholder={field.placeholder}
                    value={customFields[field.key] || ""}
                    onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                    className="text-xs h-24 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                ) : (
                  <Input
                    placeholder={field.placeholder}
                    value={customFields[field.key] || ""}
                    onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                    className="text-xs h-8.5 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: Document editing workspace */}
        <div className="lg:col-span-2 flex flex-col border dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden relative">
          {/* Workspace Toolbar */}
          <div className="bg-zinc-50/50 dark:bg-zinc-900/20 px-4 py-2 border-b dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase">Workspace Editor</span>
            <Button
              size="sm"
              variant="outline"
              onClick={checkTextSelection}
              className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40"
            >
              <Wand2 className="mr-1 h-3 w-3" />
              Inline AI Refiner
            </Button>
          </div>

          {/* Text Editor Area */}
          <div className="flex-1 p-4 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your generated document draft will stream here, or start typing to edit..."
              className="w-full h-full bg-transparent border-0 outline-0 resize-none font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 focus:ring-0 whitespace-pre-wrap focus:outline-none"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Tab controls for sharing, versioning, exports */}
        <div className="lg:col-span-1 border dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
          {/* Tab Navigation header */}
          <div className="grid grid-cols-3 border-b dark:border-zinc-800">
            {(["exports", "versions", "sharing"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`py-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  rightTab === tab
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* EXPORTS TAB */}
            {rightTab === "exports" && (
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase">Download Formats</h4>
                  <p className="text-[10px] text-zinc-400">Save your document in standard file formats.</p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* WORD */}
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs text-zinc-700 dark:text-zinc-300" onClick={triggerDocxDownload}>
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    Microsoft Word (.docx)
                  </Button>

                  {/* HTML */}
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs text-zinc-700 dark:text-zinc-300" onClick={triggerHtmlDownload}>
                    <Globe className="mr-2 h-4 w-4 text-emerald-500" />
                    HTML Document (.html)
                  </Button>

                  {/* PLAINTEXT */}
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs text-zinc-700 dark:text-zinc-300" onClick={triggerPlaintextDownload}>
                    <FileText className="mr-2 h-4 w-4 text-zinc-500" />
                    ASCII Plain Text (.txt)
                  </Button>

                  {/* PDF Print */}
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs text-zinc-700 dark:text-zinc-300" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4 text-red-500" />
                    Standard PDF (via Print)
                  </Button>
                </div>

                <div className="pt-3 border-t dark:border-zinc-800">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">Tip for PDF:</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                    Select "Save as PDF" in your print layout, enable "Background graphics" and configure custom margins to clean formatting.
                  </p>
                </div>
              </div>
            )}

            {/* VERSIONS TAB */}
            {rightTab === "versions" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-2">
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-500 uppercase">Snapshot Logs</h4>
                    <p className="text-[10px] text-zinc-400">Restore or review previous snapshots.</p>
                  </div>
                </div>

                {versions.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-xs">
                    <Clock className="h-7 w-7 mx-auto mb-1.5 text-zinc-300" />
                    No snapshots logged yet. Click "Snapshot" on top header.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {versions.map((ver) => (
                      <div
                        key={ver.id}
                        className="p-2 border dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/30 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold">Version {ver.versionNumber}</p>
                          <p className="text-[9px] text-zinc-400">
                            {new Date(ver.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] text-indigo-600"
                          onClick={() => handleRestoreVersion(ver.id)}
                        >
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SHARING TAB */}
            {rightTab === "sharing" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase">Public Document URL Settings</h4>
                  <p className="text-[10px] text-zinc-400">Configure recruiters access properties.</p>
                </div>

                {/* Visibility Toggle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Visibility</label>
                  <select
                    value={shareVisibility}
                    onChange={(e) => setShareVisibility(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                  >
                    <option value="private">Private (Only You)</option>
                    <option value="public">Public Link (Anyone)</option>
                    <option value="password">Password Locked</option>
                  </select>
                </div>

                {/* Password field if locked */}
                {shareVisibility === "password" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Set Passcode</label>
                    <Input
                      type="password"
                      placeholder="Enter passkey passcode..."
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      className="text-xs h-8.5 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                )}

                {/* Share Link Custom Slug */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Share Slug URL suffix</label>
                  <Input
                    placeholder="custom-link-suffix"
                    value={shareSlug}
                    onChange={(e) => setShareSlug(e.target.value)}
                    className="text-xs h-8.5 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                {/* Print/Download Checks */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shareDownload"
                      checked={shareDownload}
                      onChange={(e) => setShareDownload(e.target.checked)}
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="shareDownload" className="text-[10px] font-bold text-zinc-500 uppercase cursor-pointer">
                      Allow Download
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sharePrint"
                      checked={sharePrint}
                      onChange={(e) => setSharePrint(e.target.checked)}
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="sharePrint" className="text-[10px] font-bold text-zinc-500 uppercase cursor-pointer">
                      Allow Print
                    </label>
                  </div>
                </div>

                <Button size="sm" onClick={handleSaveShareSettings} className="w-full bg-indigo-600 text-white text-xs" isLoading={savingShare}>
                  Save Sharing Configuration
                </Button>

                {/* Copy URL block if saved */}
                {shareSettings && shareSettings.visibility !== "private" && (
                  <div className="pt-3 border-t dark:border-zinc-800 space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Active Public Link</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        value={`${window.location.origin}/documents/share/${shareSlug}`}
                        className="text-[10px] h-8 bg-zinc-100 dark:bg-zinc-900 font-mono"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/documents/share/${shareSlug}`);
                          success("Shared URL copied to clipboard.");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Simulated recruiter dispatch form */}
                {shareSettings && shareSettings.visibility !== "private" && (
                  <div className="pt-3 border-t dark:border-zinc-800 space-y-3">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase">Dispatch directly to Recruiter</h5>
                    <div className="space-y-2">
                      <Input
                        placeholder="Recruiter Email..."
                        value={recruiterEmail}
                        onChange={(e) => setRecruiterEmail(e.target.value)}
                        className="text-xs h-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                      <Input
                        placeholder="Email Subject..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="text-xs h-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                      <Textarea
                        placeholder="Say something to the recruiter..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        className="text-xs h-18 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                      <Button
                        size="sm"
                        onClick={handleSendSimulationEmail}
                        className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        isLoading={sendingEmail}
                      >
                        <Send className="mr-1.5 h-3 w-3" />
                        Send Document Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          INLINE AI ASSISTANT MODAL OVERLAY
          ======================================================== */}
      <Dialog isOpen={inlineOpen} onClose={() => setInlineOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Wand2 className="h-5 w-5 animate-pulse" />
            AI Selection Refiner
          </DialogTitle>
          <DialogDescription>
            Selected Text: <span className="italic font-mono font-bold">"{selectedText.length > 60 ? selectedText.substring(0, 60) + "..." : selectedText}"</span>
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {/* Quick Transform Options */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => runInlineAction("rewrite")} disabled={inlineLoading}>
              Professional Rewrite
            </Button>
            <Button size="sm" variant="outline" onClick={() => runInlineAction("expand")} disabled={inlineLoading}>
              Expand Depth
            </Button>
            <Button size="sm" variant="outline" onClick={() => runInlineAction("shorten")} disabled={inlineLoading}>
              Shorten & Simplify
            </Button>
            <Button size="sm" variant="outline" onClick={() => runInlineAction("grammar")} disabled={inlineLoading}>
              Fix Grammar & Polish
            </Button>
            <Button size="sm" variant="outline" onClick={() => runInlineAction("ats-optimize")} disabled={inlineLoading}>
              ATS Keyword Density
            </Button>
          </div>

          {/* Suggested content block */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">AI Proposal Output</label>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg min-h-[100px] max-h-[220px] overflow-y-auto text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {inlineLoading && !inlineSuggestion ? (
                <div className="flex items-center justify-center h-16">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
              ) : inlineSuggestion ? (
                inlineSuggestion
              ) : (
                <span className="text-zinc-400">Choose a transformation to run the prompt model...</span>
              )}
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button variant="outline" onClick={() => setInlineOpen(false)}>
            Dismiss
          </Button>
          <Button onClick={applyInlineSuggestion} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium" disabled={!inlineSuggestion || inlineLoading}>
            Accept & Replace Highlight
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
