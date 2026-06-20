"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  FolderPlus,
  Folder,
  Search,
  Filter,
  Star,
  Pin,
  Archive,
  ChevronDown,
  Copy,
  Clock,
  LayoutGrid,
  List,
  FolderOpen,
  Tag,
  Calendar,
  Share2
} from "lucide-react";
import {
  getFoldersAction,
  createFolderAction,
  deleteFolderAction,
  getDocumentsAction,
  createDocumentAction,
  deleteDocumentAction,
  duplicateDocumentAction,
  updateDocumentAction
} from "@/app/actions/documentActions";
import { queryResumesAction } from "@/app/actions/resumeActions";
import type { CareerDocument, DocumentFolder, Resume } from "@/types";

// Supported document types list
const DOCUMENT_TYPES = [
  { id: "cover_letter", label: "Cover Letter", category: "Job App" },
  { id: "cold_email", label: "Cold Outreach Email", category: "Email" },
  { id: "referral_email", label: "Referral Request Email", category: "Email" },
  { id: "recruiter_follow_up", label: "Recruiter Follow-up Email", category: "Email" },
  { id: "thank_you_email", label: "Thank You Email", category: "Email" },
  { id: "interview_follow_up", label: "Interview Follow-up Email", category: "Email" },
  { id: "resignation_letter", label: "Resignation Letter", category: "Formal" },
  { id: "linkedin_about", label: "LinkedIn About Section", category: "Social" },
  { id: "professional_bio", label: "Professional Biography", category: "Social" },
  { id: "sop", label: "Statement of Purpose (SOP)", category: "Academic" },
  { id: "personal_statement", label: "Personal Statement", category: "Academic" },
  { id: "recommendation_draft", label: "Letter of Recommendation Draft", category: "Academic" },
  { id: "scholarship_letter", label: "Scholarship Letter", category: "Academic" },
  { id: "internship_letter", label: "Internship Application Letter", category: "Job App" },
  { id: "grad_school_letter", label: "Graduate School Letter", category: "Academic" },
  { id: "freelance_proposal", label: "Freelance Proposal", category: "Proposal" },
  { id: "consulting_proposal", label: "Consulting Proposal", category: "Proposal" },
  { id: "client_intro", label: "Client Introduction Letter", category: "Proposal" }
];

// Document Tones
const DOCUMENT_TONES = [
  "Professional", "Corporate", "Friendly", "Executive", "Technical", "Creative", "Academic", "Minimal", "Formal", "Startup"
];

// Colors available for folders
const FOLDER_COLORS = [
  { value: "indigo", bg: "bg-indigo-500", text: "text-indigo-500", label: "Indigo" },
  { value: "violet", bg: "bg-violet-500", text: "text-violet-500", label: "Violet" },
  { value: "emerald", bg: "bg-emerald-500", text: "text-emerald-500", label: "Emerald" },
  { value: "amber", bg: "bg-amber-500", text: "text-amber-500", label: "Amber" },
  { value: "rose", bg: "bg-rose-500", text: "text-rose-500", label: "Rose" },
  { value: "sky", bg: "bg-sky-500", text: "text-sky-500", label: "Sky" },
  { value: "fuchsia", bg: "bg-fuchsia-500", text: "text-fuchsia-500", label: "Fuchsia" }
];

export default function CareerDocumentsDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Core Data States
  const [documents, setDocuments] = useState<(CareerDocument & { folderName?: string; folderColor?: string })[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtering / Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | "all" | "none">("all");
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "pinned" | "favorites" | "drafts" | "archived">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");

  // Dialog Modals States
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // Form Field States
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("cover_letter");
  const [docTone, setDocTone] = useState("Professional");
  const [docLength, setDocLength] = useState<"short" | "medium" | "long">("medium");
  const [linkedResumeId, setLinkedResumeId] = useState("");
  const [assignedFolderId, setAssignedFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("indigo");
  const [creating, setCreating] = useState(false);

  // Initial Data Fetch
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [docsData, foldersData, resumesResult] = await Promise.all([
        getDocumentsAction(user.id),
        getFoldersAction(user.id),
        queryResumesAction({ userId: user.id })
      ]);
      setDocuments(docsData);
      setFolders(foldersData);
      if (resumesResult && Array.isArray(resumesResult)) {
        setResumes(resumesResult);
      }
    } catch (err: any) {
      toastError("Failed to fetch dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Create Document Handler
  const handleCreateDocument = async () => {
    if (!user) return;
    if (!docTitle.trim()) {
      toastError("Please enter a document title.");
      return;
    }
    setCreating(true);

    try {
      const defaultContent = `Dear [Hiring Manager],

I am writing to express my interest in the position. Based on my background and experience, I believe I can make a strong contribution to your team.

Best regards,
[Your Name]`;

      const newDoc = await createDocumentAction(user.id, {
        title: docTitle.trim(),
        documentType: docType,
        resumeId: linkedResumeId || null,
        folderId: assignedFolderId || null,
        content: defaultContent,
        metaConfig: {
          tone: docTone,
          length: docLength,
          customFields: {}
        }
      });

      if (newDoc) {
        success("Document created successfully! Opening editor...");
        setCreateDocOpen(false);
        // Reset fields
        setDocTitle("");
        setLinkedResumeId("");
        setAssignedFolderId("");
        // Redirect to editor
        router.push(`/dashboard/documents/${newDoc.id}`);
      } else {
        toastError("Failed to create document.");
      }
    } catch (err: any) {
      toastError(err.message || "Failed to create document.");
    } finally {
      setCreating(false);
    }
  };

  // Create Folder Handler
  const handleCreateFolder = async () => {
    if (!user) return;
    if (!newFolderName.trim()) {
      toastError("Please enter a folder name.");
      return;
    }
    setCreating(true);

    try {
      const newFolder = await createFolderAction(user.id, newFolderName.trim(), newFolderColor);
      if (newFolder) {
        success(`Folder "${newFolder.name}" created.`);
        setFolders((prev) => [...prev, newFolder]);
        setCreateFolderOpen(false);
        setNewFolderName("");
      }
    } catch (err: any) {
      toastError("Failed to create folder. Names must be unique.");
    } finally {
      setCreating(false);
    }
  };

  // Delete Folder Handler
  const handleDeleteFolder = async (folderId: string, name: string) => {
    if (!user || !window.confirm(`Are you sure you want to delete the folder "${name}"? Documents in this folder will remain but become unorganized.`)) return;

    try {
      const deleted = await deleteFolderAction(user.id, folderId);
      if (deleted) {
        success(`Folder "${name}" deleted.`);
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        // Reset selection filter if active
        if (selectedFolderId === folderId) {
          setSelectedFolderId("all");
        }
        // Update documents cache folder references
        setDocuments((prev) =>
          prev.map((d) => (d.folderId === folderId ? { ...d, folderId: undefined, folderName: undefined, folderColor: undefined } : d))
        );
      }
    } catch (err) {
      toastError("Failed to delete folder.");
    }
  };

  // Document Inline Updators (Favorite, Pin, Archive)
  const handleToggleMetadata = async (docId: string, field: "isFavorite" | "isPinned" | "isArchived", currentVal: boolean) => {
    if (!user) return;
    try {
      const updated = await updateDocumentAction(user.id, docId, { [field]: !currentVal });
      if (updated) {
        setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, [field]: updated[field] } : d)));
        success(`Document status updated.`);
      }
    } catch (err) {
      toastError("Failed to update status.");
    }
  };

  // Duplicate Document Handler
  const handleDuplicateDocument = async (docId: string) => {
    if (!user) return;
    try {
      const duplicate = await duplicateDocumentAction(user.id, docId);
      if (duplicate) {
        // Resolve folder details to append locally
        let folderName: string | undefined;
        let folderColor: string | undefined;
        if (duplicate.folderId) {
          const f = folders.find((fol) => fol.id === duplicate.folderId);
          folderName = f?.name;
          folderColor = f?.color;
        }

        setDocuments((prev) => [{ ...duplicate, folderName, folderColor }, ...prev]);
        success("Document duplicated successfully.");
      }
    } catch (err) {
      toastError("Failed to duplicate document.");
    }
  };

  // Delete Document Handler
  const handleDeleteDocument = async (docId: string, title: string) => {
    if (!user || !window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      const deleted = await deleteDocumentAction(user.id, docId);
      if (deleted) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        success("Document deleted.");
      }
    } catch (err) {
      toastError("Failed to delete document.");
    }
  };

  // Filtering & Sorting Processors
  const filteredDocuments = documents.filter((doc) => {
    // 1. Search term match
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      doc.title.toLowerCase().includes(searchLower) ||
      doc.content.toLowerCase().includes(searchLower) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchLower)) ||
      (doc.folderName || "").toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // 2. Folder filter
    if (selectedFolderId !== "all") {
      if (selectedFolderId === "none" && doc.folderId) return false;
      if (selectedFolderId !== "none" && doc.folderId !== selectedFolderId) return false;
    }

    // 3. Document type filter
    if (selectedDocType !== "all" && doc.documentType !== selectedDocType) return false;

    // 4. Tab filter
    if (activeTab === "pinned" && !doc.isPinned) return false;
    if (activeTab === "favorites" && !doc.isFavorite) return false;
    if (activeTab === "drafts" && !doc.isDraft) return false;
    if (activeTab === "archived" && !doc.isArchived) return false;
    if (activeTab !== "archived" && doc.isArchived) return false; // Hide archived by default in other tabs

    return true;
  }).sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "created") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Career Documents</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate and organize cover letters, email outreach copies, LinkedIn summaries, SOPs, and bios with AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="mr-1.5 h-4 w-4 text-zinc-500" />
            New Folder
          </Button>
          <Button onClick={() => setCreateDocOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="mr-1.5 h-4 w-4" />
            Generate Document
          </Button>
        </div>
      </div>

      {/* 2. Folders Row */}
      {folders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b dark:border-zinc-800">
          <Button
            variant={selectedFolderId === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedFolderId("all")}
            className="rounded-full shrink-0 text-xs"
          >
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            All Folders
          </Button>
          {folders.map((f) => {
            const isSelected = selectedFolderId === f.id;
            const colorObj = FOLDER_COLORS.find((c) => c.value === f.color) || FOLDER_COLORS[0];
            return (
              <div key={f.id} className="relative group shrink-0 flex items-center">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`rounded-full text-xs transition-all ${
                    isSelected ? "" : `border-${f.color}-200/50 hover:bg-${f.color}-50/30 text-zinc-700 dark:text-zinc-300`
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full mr-2 ${colorObj.bg}`} />
                  {f.name}
                </Button>
                <button
                  onClick={() => handleDeleteFolder(f.id, f.name)}
                  className="absolute -top-1.5 -right-1 hidden group-hover:flex bg-red-100 dark:bg-red-950 text-red-600 rounded-full p-0.5 border border-red-200"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
          <Button
            variant={selectedFolderId === "none" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedFolderId("none")}
            className="rounded-full shrink-0 text-xs text-zinc-500"
          >
            Unorganized
          </Button>
        </div>
      )}

      {/* 3. Search and Filtering Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/40 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by title, tags, or content keywords..."
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Document Type Dropdown */}
          <div className="relative">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="appearance-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Document Types</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="updated">Sort by Updated</option>
              <option value="created">Sort by Created</option>
              <option value="title">Sort by Title</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-950">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-md p-1"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-md p-1"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Tabs Row */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(["all", "pinned", "favorites", "drafts", "archived"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 5. Documents Content Grid/List */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={searchTerm ? "No Match Found" : `No ${activeTab !== "all" ? activeTab : ""} Documents`}
          description={
            searchTerm
              ? "We couldn't find any documents matching your filters or search phrases."
              : "Generate cover letters, outreach emails, or application materials with AI."
          }
          actionText={searchTerm ? undefined : "Create Document"}
          onAction={searchTerm ? undefined : () => setCreateDocOpen(true)}
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const formattedDate = new Date(doc.updatedAt).toLocaleDateString();
            const docTypeObj = DOCUMENT_TYPES.find((t) => t.id === doc.documentType);
            return (
              <Card key={doc.id} className="group relative flex flex-col hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
                {/* Pins and Favorites indicators */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    onClick={() => handleToggleMetadata(doc.id, "isPinned", doc.isPinned)}
                    className={`p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                      doc.isPinned ? "text-amber-500" : "text-zinc-300 group-hover:text-zinc-400"
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleToggleMetadata(doc.id, "isFavorite", doc.isFavorite)}
                    className={`p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                      doc.isFavorite ? "text-rose-500" : "text-zinc-300 group-hover:text-zinc-400"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {/* Badge */}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {docTypeObj?.category || "Career"}
                    </span>
                    {doc.folderName && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-${doc.folderColor}-500/10 text-${doc.folderColor}-500`}>
                        {doc.folderName}
                      </span>
                    )}
                  </div>
                  <CardTitle
                    className="text-sm font-bold mt-2 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 pr-12"
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                  >
                    {doc.title}
                  </CardTitle>
                  <CardDescription className="text-xs truncate">
                    Type: {docTypeObj?.label || doc.documentType}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pb-2">
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans">
                    {doc.content.replace(/Dear .+,?\n\n/g, "")}
                  </p>
                </CardContent>

                <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Updated {formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-indigo-600"
                      onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
                      onClick={() => handleDuplicateDocument(doc.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-amber-600"
                      onClick={() => handleToggleMetadata(doc.id, "isArchived", doc.isArchived)}
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-red-600"
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredDocuments.map((doc) => {
            const formattedDate = new Date(doc.updatedAt).toLocaleDateString();
            const docTypeObj = DOCUMENT_TYPES.find((t) => t.id === doc.documentType);
            return (
              <div key={doc.id} className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-xs font-bold truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                        onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                      >
                        {doc.title}
                      </p>
                      {doc.folderName && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-${doc.folderColor}-500/10 text-${doc.folderColor}-500`}>
                          {doc.folderName}
                        </span>
                      )}
                      {doc.isPinned && <Pin className="h-3 w-3 text-amber-500 fill-current shrink-0" />}
                      {doc.isFavorite && <Star className="h-3 w-3 text-rose-500 fill-current shrink-0" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {docTypeObj?.label || doc.documentType} • Updated {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-4 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] px-2"
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                  >
                    Edit Workspace
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-red-500"
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          CREATE DOCUMENT DIALOG MODAL
          ======================================================== */}
      <Dialog isOpen={createDocOpen} onClose={() => setCreateDocOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            AI Career Documents Generator
          </DialogTitle>
          <DialogDescription>
            Choose a document type, configure parameters, and provide resume context for generative AI drafts.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-500 uppercase">Document Name / Job Role Title</label>
            <Input
              placeholder="e.g. Senior Frontend Engineer Cover Letter"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
            />
          </div>

          {/* Doc Type selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-500 uppercase">Select Document Type</label>
            <div className="relative">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Context Options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tone Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Writing Tone</label>
              <div className="relative">
                <select
                  value={docTone}
                  onChange={(e) => setDocTone(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DOCUMENT_TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Target Length */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Length Scale</label>
              <div className="relative">
                <select
                  value={docLength}
                  onChange={(e) => setDocLength(e.target.value as any)}
                  className="w-full appearance-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="short">Short (Concise)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="long">Long (Elaborate)</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Resume linking */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Link Resume (Smart Context)</label>
              <div className="relative">
                <select
                  value={linkedResumeId}
                  onChange={(e) => setLinkedResumeId(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Resume Link</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.resumeType})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Folder Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Assign Folder</label>
              <div className="relative">
                <select
                  value={assignedFolderId}
                  onChange={(e) => setAssignedFolderId(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None / Unorganized</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDocOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreateDocument} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium" isLoading={creating}>
            Create Workspace Draft
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ========================================================
          CREATE FOLDER DIALOG MODAL
          ======================================================== */}
      <Dialog isOpen={createFolderOpen} onClose={() => setCreateFolderOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <FolderPlus className="h-5 w-5 text-indigo-500" />
            Create Organizer Folder
          </DialogTitle>
          <DialogDescription>
            Group related job applications or document drafts in color-coded folders.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-500 uppercase">Folder Name</label>
            <Input
              placeholder="e.g. Google Applications"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-500 uppercase">Select Color Tag</label>
            <div className="flex items-center gap-2.5 pt-1">
              {FOLDER_COLORS.map((c) => {
                const isSelected = newFolderColor === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setNewFolderColor(c.value)}
                    type="button"
                    className={`h-7 w-7 rounded-full ${c.bg} transition-all relative ${
                      isSelected ? "ring-2 ring-indigo-600 ring-offset-2 scale-110" : "hover:scale-105"
                    }`}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateFolderOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreateFolder} className="bg-indigo-600 hover:bg-indigo-700 text-white" isLoading={creating}>
            Add Folder
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
