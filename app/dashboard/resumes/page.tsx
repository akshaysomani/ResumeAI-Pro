"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import {
  queryResumesAction,
  createResumeAction,
  deleteResumeAction,
  archiveResumeAction,
  favoriteResumeAction,
  duplicateResumeAction,
} from "@/app/actions/resumeActions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Search,
  Copy,
  Star,
  Archive,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import type { Resume } from "@/types";

export default function ResumesPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state variables
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"updated_at" | "created_at" | "title">("updated_at");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "completed" | "published" | "archived">("all");
  const [filterType, setFilterType] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("");

  // Deletion Modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create Resume Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTemplate, setNewTemplate] = useState("modern");
  const [newType, setNewType] = useState("custom");
  const [newLang, setNewLang] = useState("en");
  const [newColor, setNewColor] = useState("indigo");
  const [newFont, setNewFont] = useState("sans");
  const [newPaper, setNewPaper] = useState("A4");
  const [newMargin, setNewMargin] = useState("normal");
  const [newLayout, setNewLayout] = useState("single-column");

  const fetchResumes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await queryResumesAction({
        userId: user.id,
        searchTerm,
        sortBy,
        sortOrder: "desc",
        filterStatus,
        filterTemplate,
        filterType,
        limit: 100,
        offset: 0,
      });

      setResumes(data as any);
    } catch (err: any) {
      toastError(err.message || "Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [user, searchTerm, sortBy, filterStatus, filterType, filterTemplate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    setCreating(true);

    try {
      const newId = await createResumeAction(user.id, newTitle, {
        templateId: newTemplate,
        language: newLang,
        colorTheme: newColor,
        fontFamily: newFont,
        paperSize: newPaper,
        pageMargin: newMargin,
        layoutStyle: newLayout,
        resumeType: newType,
      });

      success("Resume created successfully.");
      setIsCreateOpen(false);
      setNewTitle("");
      fetchResumes();
      
      // Redirect to the editor page
      window.location.href = `/dashboard/editor?id=${newId}`;
    } catch (err: any) {
      toastError(err.message || "Failed to create resume.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteResumeAction(deleteId);
      success("Resume deleted permanently.");
      setResumes((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      toastError(err.message || "Failed to delete resume.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleFavorite = async (resume: Resume) => {
    const nextVal = !resume.isFavorite;
    try {
      await favoriteResumeAction(resume.id, nextVal);
      setResumes((prev) =>
        prev.map((r) => (r.id === resume.id ? { ...r, isFavorite: nextVal } : r))
      );
      success(nextVal ? "Added to favorites." : "Removed from favorites.");
    } catch (err: any) {
      toastError("Failed to update favorite status.");
    }
  };

  const toggleArchive = async (resume: Resume) => {
    const nextVal = !resume.isArchived;
    try {
      await archiveResumeAction(resume.id, nextVal);
      setResumes((prev) =>
        prev.map((r) => (r.id === resume.id ? { ...r, isArchived: nextVal } : r))
      );
      success(nextVal ? "Resume archived." : "Resume restored to dashboard.");
      fetchResumes();
    } catch (err: any) {
      toastError("Failed to update archive status.");
    }
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      const clonedId = await duplicateResumeAction(resumeId);
      success("Resume duplicated successfully.");
      fetchResumes();
    } catch (err: any) {
      toastError("Failed to duplicate resume.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">My Resumes</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create, duplicate, search, and manage your ATS-friendly resume versions.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Build New Resume
        </Button>
      </div>

      {/* Search and Filters Panel */}
      <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by resume title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="all">All Resumes</option>
              <option value="draft">Drafts</option>
              <option value="completed">Completed</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            {/* Template Filter */}
            <select
              value={filterTemplate}
              onChange={(e) => setFilterTemplate(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">All Templates</option>
              <option value="modern">Modern Template</option>
              <option value="minimal">Minimal Template</option>
              <option value="executive">Executive Template</option>
              <option value="academic">Academic Template</option>
            </select>

            {/* Resume Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">All Job Profiles</option>
              <option value="software-engineer">Software Engineer</option>
              <option value="student">Student</option>
              <option value="designer">Designer</option>
              <option value="marketing">Marketing</option>
              <option value="business-analyst">Business Analyst</option>
              <option value="product-manager">Product Manager</option>
              <option value="data-scientist">Data Scientist</option>
              <option value="custom">Custom Type</option>
            </select>

            {/* Sorting Select */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="updated_at">Last Updated</option>
              <option value="created_at">Date Created</option>
              <option value="title">Alphabetical (Title)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumes Grid list */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchTerm || filterStatus !== "all" || filterTemplate || filterType ? "No matches found" : "No resumes built yet"}
          description={
            searchTerm || filterStatus !== "all" || filterTemplate || filterType
              ? "Try adjusting your filters or search query terms."
              : "Kickstart your career by building a premium ATS-friendly resume."
          }
          actionText={!(searchTerm || filterStatus !== "all" || filterTemplate || filterType) ? "Create Resume" : undefined}
          onAction={!(searchTerm || filterStatus !== "all" || filterTemplate || filterType) ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className="flex flex-col relative group overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-400/30 transition-all duration-300">
              {/* Star / Favorite indicator */}
              <button
                onClick={() => toggleFavorite(resume)}
                className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-white/80 dark:bg-zinc-950/80 border dark:border-zinc-800 text-zinc-400 hover:text-amber-500 transition-colors"
                title={resume.isFavorite ? "Remove Favorite" : "Add Favorite"}
              >
                <Star className={cn("h-4 w-4", resume.isFavorite ? "fill-amber-500 text-amber-500" : "")} />
              </button>

              <CardHeader className="pb-3 pr-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <span className="capitalize inline-flex items-center text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md">
                    {resume.resumeType}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                    resume.status === "published" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" :
                    resume.status === "completed" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600" :
                    "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                  )}>
                    {resume.status}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold mt-3 leading-tight truncate">
                  {resume.title}
                </CardTitle>
                <CardDescription className="text-xs truncate">
                  Template: {resume.templateId} • {resume.colorTheme} theme
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                <p className="text-[10px] text-zinc-400">
                  Last updated: {new Date(resume.updatedAt).toLocaleString()}
                </p>
              </CardContent>

              <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                    onClick={() => toggleArchive(resume)}
                    title={resume.isArchived ? "Restore Resume" : "Archive Resume"}
                  >
                    {resume.isArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                    onClick={() => handleDuplicate(resume.id)}
                    title="Duplicate Resume"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md text-red-600 hover:text-red-500 dark:hover:bg-red-950/20"
                    onClick={() => setDeleteId(resume.id)}
                    title="Delete Permanently"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/editor?id=${resume.id}`}>
                    <Button size="sm" className="h-8 text-xs font-semibold px-3">
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Deletion Confirm Dialog */}
      <Dialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your resume, all snapshot history versions, and all of its normalized section content records.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
            Delete Resume
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Create Resume Configuration Dialog Modal */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Professional Resume</DialogTitle>
            <DialogDescription>
              Configure templates, styles, and dimensions. You can modify these settings anytime inside the editor.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 text-left">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Document Name</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Software Engineer Resume 2026"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Resume template</label>
                <select
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="modern">Modern Professional</option>
                  <option value="minimal">Sleek Minimal</option>
                  <option value="executive">Executive Corporate</option>
                  <option value="academic">Academic / CV</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Target Job Profile</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="software-engineer">Software Engineer</option>
                  <option value="student">Student / Intern</option>
                  <option value="designer">UX / UI Designer</option>
                  <option value="marketing">Marketing Specialist</option>
                  <option value="business-analyst">Business Analyst</option>
                  <option value="product-manager">Product Manager</option>
                  <option value="data-scientist">Data Scientist</option>
                  <option value="custom">General Custom</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Color theme</label>
                <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="indigo">Indigo Accent</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="blue">Royal Blue</option>
                  <option value="slate">Sleek Slate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Font Stack</label>
                <select
                  value={newFont}
                  onChange={(e) => setNewFont(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="sans">Inter Sans-Serif</option>
                  <option value="serif">Lora Serif</option>
                  <option value="mono">Fira Mono</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Paper Dimensions</label>
                <select
                  value={newPaper}
                  onChange={(e) => setNewPaper(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="A4">A4 Print standard</option>
                  <option value="letter">US Letter standard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Page Margin</label>
                <select
                  value={newMargin}
                  onChange={(e) => setNewMargin(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="normal">Normal (0.75 in)</option>
                  <option value="compact">Compact (0.5 in)</option>
                  <option value="wide">Wide (1.0 in)</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" isLoading={creating}>
              Create & Edit
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
