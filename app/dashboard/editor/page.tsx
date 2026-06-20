"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useResume } from "@/components/resume-provider";
import { useToast } from "@/components/ui/toast";
import { ResumePreviewCanvas } from "@/components/resume-preview-canvas";
import { analyzeAtsHints, type AtsHint } from "@/lib/atsAnalyzer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { templatesRegistry, type ResumeTemplateItem, getTemplateConfig } from "@/lib/templates-registry";
import {
  getUserPlanAction,
  getTemplatePreferences,
  toggleFavoriteTemplateAction,
  addRecentTemplateAction,
} from "@/app/actions/templateActions";
import {
  Undo2,
  Redo2,
  Save,
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  Sliders,
  Type,
  Maximize,
  Eye,
  EyeOff,
  Move,
  BookOpen,
  Award,
  Globe,
  FileBadge,
  Bookmark,
  Sparkle,
  Zap,
  RotateCw,
  Search,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Star,
  Layout,
  UserCheck,
  Calendar,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeSection, SectionType } from "@/types";

export default function ResumeEditorPage() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("id") || "editor-workspace";

  const {
    currentResume,
    saving,
    canUndo,
    canRedo,
    isDirty,
    previewTemplateId,
    setPreviewTemplateId,
    loadResume,
    updateResumeDetails,
    updateResumeMetadata,
    updateSection,
    reorderSections,
    undo,
    redo,
    saveChanges,
  } = useResume();

  const { success, error } = useToast();

  // Three Panel resizable width state parameters (persisted locally)
  const [leftWidth, setLeftWidth] = useState(250); // px
  const [rightWidth, setRightWidth] = useState(600); // px

  // Zoom and layout settings
  const [zoom, setZoom] = useState(0.8);
  const [activeSection, setActiveSection] = useState<SectionType | "design" | "templates">("personal");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // ATS Optimization Drawer states
  const [isAtsOpen, setIsAtsOpen] = useState(false);
  const [atsHints, setAtsHints] = useState<AtsHint[]>([]);

  // Validation States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Rotation settings
  const [avatarRotation, setAvatarRotation] = useState(0);

  // Template Search and Filters states
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<string[]>([]);
  const [userPlan, setUserPlan] = useState<"free" | "pro">("free");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [layoutFilter, setLayoutFilter] = useState("All");
  const [pricingFilter, setPricingFilter] = useState("All");
  const [colorFilter, setColorFilter] = useState("All");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<ResumeTemplateItem | null>(null);

  // AI Career Assistant State
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiSectionType, setAiSectionType] = useState<string>("summary");
  const [aiContext, setAiContext] = useState<{
    index?: number;
    key?: string;
    label?: string;
    originalText?: string;
  }>({});
  const [aiInputParams, setAiInputParams] = useState<any>({
    tone: "Professional",
    length: "medium",
    customInstructions: "",
    role: "",
    company: "",
    achievements: "",
    title: "",
    techStack: "",
    industry: "Technology",
    careerGoals: "",
    action: "rewrite",
  });
  const [aiOutputText, setAiOutputText] = useState("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [dailyAiUsage, setDailyAiUsage] = useState({ count: 0, limit: 5, plan: "free" as "free" | "pro" });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  // AI ATS Analyzer State
  const [aiAtsLoading, setAiAtsLoading] = useState(false);
  const [aiAtsReport, setAiAtsReport] = useState<any>(null);

  // Load custom width sizes from localStorage
  useEffect(() => {
    const savedLeft = localStorage.getItem("editorPanelLeftWidth");
    const savedRight = localStorage.getItem("editorPanelRightWidth");
    if (savedLeft) setLeftWidth(parseInt(savedLeft));
    if (savedRight) setRightWidth(parseInt(savedRight));
  }, []);

  useEffect(() => {
    loadResume(resumeId);
  }, [resumeId]);

  // Recalculate ATS warnings on resume updates
  useEffect(() => {
    if (currentResume) {
      setAtsHints(analyzeAtsHints(currentResume));
    }
  }, [currentResume]);

  // Load template preferences from database
  useEffect(() => {
    if (currentResume?.userId && currentResume.userId !== "placeholder-user") {
      getUserPlanAction(currentResume.userId).then((plan) => setUserPlan(plan));
      getTemplatePreferences(currentResume.userId).then((prefs) => {
        setFavoriteTemplates(prefs.favoriteTemplates || []);
        setRecentTemplates(prefs.recentTemplates || []);
      });
    }
  }, [currentResume?.userId]);

  // AI assistant handlers
  const fetchAiUsage = async () => {
    try {
      const res = await fetch("/api/ai/usage");
      if (res.ok) {
        const data = await res.json();
        setDailyAiUsage(data);
      }
    } catch (err) {
      console.error("Failed to load AI usage details:", err);
    }
  };

  useEffect(() => {
    if (currentResume?.userId && currentResume.userId !== "placeholder-user") {
      fetchAiUsage();
    }
  }, [currentResume?.userId]);

  const handleTriggerAiPanel = (
    section: string,
    index?: number,
    key?: string,
    label?: string,
    originalText?: string
  ) => {
    if (!currentResume) return;

    setAiSectionType(section);
    setAiContext({ index, key, label, originalText });
    setAiOutputText("");
    setSelectedSkills([]);
    
    const updatedParams: any = {
      tone: "Professional",
      length: "medium",
      customInstructions: "",
      role: "",
      company: "",
      achievements: originalText || "",
      title: "",
      techStack: "",
      industry: "Technology",
      careerGoals: "",
      originalText: originalText || "",
      action: "rewrite",
    };

    // Experience contextual fill
    if (section === "experience" && typeof index === "number" && Array.isArray(activeContent)) {
      const currentItem = activeContent[index] || {};
      updatedParams.role = currentItem.role || "";
      updatedParams.company = currentItem.company || "";
      updatedParams.achievements = currentItem.description || "";
    }

    // Project contextual fill
    if (section === "project" && typeof index === "number" && Array.isArray(activeContent)) {
      const currentItem = activeContent[index] || {};
      updatedParams.title = currentItem.title || "";
      updatedParams.techStack = currentItem.technologies || "";
      updatedParams.achievements = currentItem.description || "";
    }

    // Skills contextual fill
    if (section === "skills") {
      const workSec = currentResume.sections.find((s) => s.sectionType === "experience");
      const workList = workSec?.content;
      if (Array.isArray(workList) && workList.length > 0) {
        updatedParams.role = workList[0].role || "";
        updatedParams.company = workList[0].company || "";
      }
    }

    // Summary contextual fill
    if (section === "summary") {
      const workSec = currentResume.sections.find((s) => s.sectionType === "experience");
      const workList = workSec?.content;
      if (Array.isArray(workList) && workList.length > 0) {
        updatedParams.experience = workList
          .map((w) => `${w.role || "Developer"} at ${w.company || "Company"}: ${w.description || ""}`)
          .join("\n");
        updatedParams.careerGoals = `Progress career as a ${workList[0].role || "professional"}`;
      }

      const eduSec = currentResume.sections.find((s) => s.sectionType === "education");
      const eduList = eduSec?.content;
      if (Array.isArray(eduList) && eduList.length > 0) {
        updatedParams.education = eduList
          .map((e) => `${e.degree || ""} in ${e.field || ""} from ${e.school || ""}`)
          .join(", ");
      }

      const skillsSec = currentResume.sections.find((s) => s.sectionType === "skills");
      const skillsList = skillsSec?.content;
      if (Array.isArray(skillsList) && skillsList.length > 0) {
        updatedParams.skills = skillsList.map((s) => s.name).join(", ");
      }
    }

    setAiInputParams(updatedParams);
    setAiDialogOpen(true);
  };

  const handleStartAiGeneration = async () => {
    setAiOutputText("");
    setIsAiStreaming(true);

    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    try {
      let payload: any = {};
      if (aiSectionType === "summary") {
        payload = {
          experience: aiInputParams.experience,
          education: aiInputParams.education,
          skills: aiInputParams.skills,
          industry: aiInputParams.industry,
          careerGoals: aiInputParams.careerGoals,
          tone: aiInputParams.tone,
          length: aiInputParams.length,
        };
      } else if (aiSectionType === "experience") {
        payload = {
          role: aiInputParams.role,
          company: aiInputParams.company,
          achievements: aiInputParams.achievements,
          tone: aiInputParams.tone,
        };
      } else if (aiSectionType === "project") {
        payload = {
          title: aiInputParams.title,
          role: aiInputParams.role,
          techStack: aiInputParams.techStack,
          achievements: aiInputParams.achievements,
          tone: aiInputParams.tone,
        };
      } else if (aiSectionType === "skills") {
        payload = {
          role: aiInputParams.role,
          industry: aiInputParams.industry,
        };
      } else if (aiSectionType === "rewrite") {
        payload = {
          text: aiInputParams.originalText || "",
          tone: aiInputParams.tone,
          action: aiInputParams.action || "rewrite",
        };
      } else {
        payload = {
          sectionType: aiSectionType,
          instructions: aiInputParams.customInstructions,
          tone: aiInputParams.tone,
        };
      }

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionType: aiSectionType,
          payload,
          resumeId: currentResume?.id || null,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Request failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader on response body");

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setAiOutputText((prev) => prev + text);
      }

      fetchAiUsage();
    } catch (err: any) {
      if (err.name === "AbortError") {
        success("AI Generation cancelled successfully.");
      } else {
        console.error("AI Assist failed:", err);
        error(err.message || "Failed to generate AI contents.");
      }
    } finally {
      setIsAiStreaming(false);
      aiAbortControllerRef.current = null;
    }
  };

  const handleCancelAiGeneration = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
  };

  const handleApplyAiText = (mode: "replace" | "insert") => {
    if (!aiOutputText.trim()) return;

    const key = aiContext.key || "description";
    const idx = aiContext.index ?? 0;

    if (aiSectionType === "summary") {
      const currentVal = activeContent.text || "";
      const newVal = mode === "replace" ? aiOutputText : currentVal + (currentVal ? "\n" : "") + aiOutputText;
      handleItemChange(0, "text", newVal);
    } else {
      if (Array.isArray(activeContent)) {
        const currentItem = activeContent[idx] || {};
        const currentVal = currentItem[key] || "";
        const newVal = mode === "replace" ? aiOutputText : currentVal + (currentVal ? "\n" : "") + aiOutputText;
        handleItemChange(idx, key, newVal);
      } else {
        const currentVal = activeContent[key] || "";
        const newVal = mode === "replace" ? aiOutputText : currentVal + (currentVal ? "\n" : "") + aiOutputText;
        handleItemChange(0, key, newVal);
      }
    }

    setAiDialogOpen(false);
    success("AI suggestion applied to editor!");
  };

  const getParsedSkills = () => {
    try {
      let cleaned = aiOutputText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      return JSON.parse(cleaned.trim());
    } catch {
      return null;
    }
  };

  const handleAddSelectedSkills = () => {
    const parsed = getParsedSkills();
    selectedSkills.forEach((skillName) => {
      let category = "General";
      if (parsed) {
        if (parsed.technical?.includes(skillName)) category = "Technical";
        else if (parsed.soft?.includes(skillName)) category = "Professional";
        else if (parsed.trending?.includes(skillName)) category = "Specialized";
      }

      addListItem({
        name: skillName,
        category: category,
        proficiency: "Intermediate",
      });
    });
    setAiDialogOpen(false);
    success(`Added ${selectedSkills.length} skills to your resume!`);
  };

  const handleRunAiAtsScan = async () => {
    if (!currentResume) return;
    setAiAtsLoading(true);
    setAiAtsReport(null);
    try {
      const res = await fetch("/api/ai/ats-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: currentResume.id }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Scan failed with status ${res.status}`);
      }

      const data = await res.json();
      setAiAtsReport(data);
      success("Full AI ATS validation completed successfully!");
    } catch (err: any) {
      console.error(err);
      error(err.message || "Failed to scan ATS validation scores.");
    } finally {
      setAiAtsLoading(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveChanges();
        success("Changes saved manually.");
      }
      if (cmdCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (cmdCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveChanges, undo, redo]);

  if (!currentResume) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-sm text-zinc-500">Preparing editor layout canvas...</p>
        </div>
      </div>
    );
  }

  // Panel resizing listeners
  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(380, moveEvent.clientX));
      setLeftWidth(newWidth);
      localStorage.setItem("editorPanelLeftWidth", String(newWidth));
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(450, Math.min(950, window.innerWidth - moveEvent.clientX));
      setRightWidth(newWidth);
      localStorage.setItem("editorPanelRightWidth", String(newWidth));
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  // Drag Reordering Handlers
  const handleDragStart = (idx: number) => {
    setDraggingIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;

    const list = [...currentResume.sections];
    const draggedItem = list[draggingIdx];
    list.splice(draggingIdx, 1);
    list.splice(idx, 0, draggedItem);
    reorderSections(list);
    setDraggingIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
    saveChanges();
  };

  // Section toggle visibility
  const toggleVisibility = (sectionId: string, currentVal: boolean) => {
    const sec = currentResume.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    updateSection(sectionId, {
      ...sec.content,
      isVisible: !currentVal,
    });
  };

  // Get active section content
  const activeSec = currentResume.sections.find((s) => s.sectionType === activeSection);
  const activeContent = activeSec?.content || {};

  // Update item field inside lists
  const handleItemChange = (index: number, key: string, value: any) => {
    if (!activeSec) return;
    if (Array.isArray(activeContent)) {
      const list = [...activeContent];
      list[index] = { ...list[index], [key]: value };
      updateSection(activeSec.id, list);
    } else {
      const obj = { ...activeContent, [key]: value };
      updateSection(activeSec.id, obj);
    }
  };

  const addListItem = (defaultObj: any) => {
    if (!activeSec) return;
    const list = Array.isArray(activeContent) ? [...activeContent] : [];
    list.push({ id: `item-${Date.now()}`, ...defaultObj });
    updateSection(activeSec.id, list);
  };

  const removeListItem = (index: number) => {
    if (!activeSec || !Array.isArray(activeContent)) return;
    const list = activeContent.filter((_, i) => i !== index);
    updateSection(activeSec.id, list);
  };

  // Rotate photo helper
  const handleRotateAvatar = () => {
    const nextRotation = (avatarRotation + 90) % 360;
    setAvatarRotation(nextRotation);
    handleItemChange(0, "avatarRotation", nextRotation);
  };

  // Inputs Validation handlers
  const checkUrl = (key: string, value: string) => {
    if (!value) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }
    const match = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i.test(value);
    setValidationErrors((prev) => {
      if (!match) return { ...prev, [key]: "Invalid link URL." };
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const checkPhone = (key: string, value: string) => {
    if (!value) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }
    const match = /^\+?[0-9\s-()]{7,15}$/.test(value);
    setValidationErrors((prev) => {
      if (!match) return { ...prev, [key]: "Invalid phone coordinates." };
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const personal = currentResume.sections.find((s) => s.sectionType === "personal")?.content || {};

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-0 relative select-none" style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem", marginTop: "-1.5rem" }}>
      
      {/* LEFT PANEL: OUTLINE NAVIGATION & DRAG REORDER */}
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950/60 border-r border-zinc-200 dark:border-zinc-800 h-full overflow-y-auto shrink-0 select-none" style={{ width: `${leftWidth}px` }}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Outline Nav</span>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
            {currentResume.sections.length} Sects
          </span>
        </div>

        {/* Outline anchors with drag-reorder handles */}
        <div className="flex-1 p-3 space-y-1.5">
          {currentResume.sections.map((sec, idx) => {
            const isVisible = sec.content?.isVisible !== false;
            const isFocused = activeSection === sec.sectionType;
            return (
              <div
                key={sec.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => setActiveSection(sec.sectionType)}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all select-none",
                  isFocused
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="opacity-0 group-hover:opacity-60 cursor-grab shrink-0">
                    <Move className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{sec.title}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(sec.id, isVisible);
                  }}
                  className={cn(
                    "p-0.5 rounded transition-colors shrink-0",
                    isFocused ? "text-white/80 hover:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  )}
                >
                  {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-red-500" />}
                </button>
              </div>
            );
          })}

          <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />

          {/* Templates Switcher custom tab */}
          <div
            onClick={() => setActiveSection("templates")}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all select-none",
              activeSection === "templates"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Switch Templates</span>
          </div>

          {/* Design custom tab anchor */}
          <div
            onClick={() => setActiveSection("design")}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all mt-1 select-none",
              activeSection === "design"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Theme Configuration</span>
          </div>
        </div>

        {/* ATS Realtime Trigger Button */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs font-bold py-2 bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20"
            onClick={() => setIsAtsOpen(true)}
          >
            <Zap className="mr-1 h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            ATS Insights ({atsHints.length})
          </Button>
        </div>
      </div>

      {/* DRAGDIVIDER LEFT */}
      <div
        className="w-1 cursor-col-resize hover:bg-indigo-500 bg-transparent transition-colors h-full select-none"
        onMouseDown={startResizeLeft}
      />

      {/* CENTER PANEL: EDITING FORMS WORKSPACE */}
      <div className="flex-1 bg-white dark:bg-zinc-950 p-6 overflow-y-auto h-full text-left">
        
        {/* Dynamic Forms header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
          <div>
            <h3 className="text-md font-extrabold capitalize text-zinc-950 dark:text-white">
              {activeSection === "templates" ? "Premium Templates Switcher" : 
               activeSection === "design" ? "Style & Layout Config" : `Editing: ${activeSection}`}
            </h3>
            <p className="text-xs text-zinc-400">
              {activeSection === "templates" ? "Switch designs dynamically without data loss." : "Updates are saved automatically as you edit."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-zinc-500">
                <Sparkles className="h-3 w-3 text-indigo-500 fill-indigo-500 animate-pulse" />
                <span>AI ASSIST CREDITS</span>
              </div>
              <span className="text-[9px] text-zinc-400 font-medium">
                {dailyAiUsage.plan === "pro" ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Pro (Unlimited)</span>
                ) : (
                  <span>{Math.max(0, 5 - dailyAiUsage.count)} / 5 left today</span>
                )}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0">
              {isDirty ? "Saving..." : "Ready"}
            </span>
          </div>
        </div>

        {/* 1. PERSONAL FORM */}
        {activeSection === "personal" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Full Name *</label>
                <Input
                  value={activeContent.fullName || ""}
                  onChange={(e) => handleItemChange(0, "fullName", e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Professional Title</label>
                <Input
                  value={activeContent.headline || ""}
                  onChange={(e) => handleItemChange(0, "headline", e.target.value)}
                  placeholder="Lead Backend Engineer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Email Address</label>
                <Input
                  value={activeContent.email || ""}
                  onChange={(e) => handleItemChange(0, "email", e.target.value)}
                  placeholder="johndoe@email.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Phone Number</label>
                <Input
                  value={activeContent.phone || ""}
                  onChange={(e) => {
                    handleItemChange(0, "phone", e.target.value);
                    checkPhone("phone", e.target.value);
                  }}
                  placeholder="+1 (555) 019-2222"
                  className={cn(validationErrors.phone ? "border-red-500" : "")}
                />
                {validationErrors.phone && <p className="text-[10px] text-red-500 font-semibold">{validationErrors.phone}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Location</label>
                <Input
                  value={activeContent.location || ""}
                  onChange={(e) => handleItemChange(0, "location", e.target.value)}
                  placeholder="Chicago, IL"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Personal Website</label>
                <Input
                  value={activeContent.website || ""}
                  onChange={(e) => {
                    handleItemChange(0, "website", e.target.value);
                    checkUrl("web", e.target.value);
                  }}
                  placeholder="https://johndoe.me"
                  className={cn(validationErrors.web ? "border-red-500" : "")}
                />
                {validationErrors.web && <p className="text-[10px] text-red-500 font-semibold">{validationErrors.web}</p>}
              </div>
            </div>

            {/* Profile Picture Rotation option */}
            {activeContent.avatarUrl && (
              <Card className="p-4 flex items-center justify-between border dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border overflow-hidden">
                    <img
                      src={activeContent.avatarUrl}
                      alt="Crop Preview"
                      className="h-full w-full object-cover"
                      style={{ transform: `rotate(${avatarRotation}deg)` }}
                    />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold">Image Orientation</span>
                    <p className="text-[10px] text-zinc-400">Rotate image inside preview layout</p>
                  </div>
                </div>
                <Button type="button" size="icon" variant="outline" onClick={handleRotateAvatar} title="Rotate Image">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* 2. SUMMARY FORM */}
        {activeSection === "summary" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Professional Summary</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200/50 font-bold"
                  onClick={() => handleTriggerAiPanel("summary")}
                >
                  <Sparkles className="h-3 w-3 fill-indigo-600" />
                  AI Assist Writer
                </Button>
              </div>
              <Textarea
                value={activeContent.text || ""}
                onChange={(e) => handleItemChange(0, "text", e.target.value)}
                placeholder="Describe your major highlights, career objectives and proficiencies..."
                rows={8}
              />
            </div>
          </div>
        )}

        {/* 3. EDUCATION FORM */}
        {activeSection === "education" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl space-y-4 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">School Name</label>
                    <Input
                      value={item.school || ""}
                      onChange={(e) => handleItemChange(idx, "school", e.target.value)}
                      placeholder="Boston University"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Degree</label>
                    <Input
                      value={item.degree || ""}
                      onChange={(e) => handleItemChange(idx, "degree", e.target.value)}
                      placeholder="Master of Science"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Major</label>
                    <Input
                      value={item.major || ""}
                      onChange={(e) => handleItemChange(idx, "major", e.target.value)}
                      placeholder="Information Systems"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">GPA</label>
                    <Input
                      value={item.gpa || ""}
                      onChange={(e) => handleItemChange(idx, "gpa", e.target.value)}
                      placeholder="3.85 / 4.0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Location</label>
                    <Input
                      value={item.location || ""}
                      onChange={(e) => handleItemChange(idx, "location", e.target.value)}
                      placeholder="Boston, MA"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Duration (text)</label>
                    <Input
                      value={item.duration || ""}
                      onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                      placeholder="2021 - 2023"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ school: "", degree: "", major: "", gpa: "", location: "", duration: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Education Row
            </Button>
          </div>
        )}

        {/* 4. WORK EXPERIENCE FORM */}
        {activeSection === "experience" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl space-y-4 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Company Name</label>
                    <Input
                      value={item.company || ""}
                      onChange={(e) => handleItemChange(idx, "company", e.target.value)}
                      placeholder="Stripe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Job Title</label>
                    <Input
                      value={item.role || ""}
                      onChange={(e) => handleItemChange(idx, "role", e.target.value)}
                      placeholder="Senior Full Stack Engineer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Employment Duration</label>
                    <Input
                      value={item.duration || ""}
                      onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                      placeholder="Jan 2022 - Present"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Location</label>
                    <Input
                      value={item.location || ""}
                      onChange={(e) => handleItemChange(idx, "location", e.target.value)}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Job Description / Achievements</label>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200/50 font-bold"
                          onClick={() => handleTriggerAiPanel("experience", idx, "description", "Experience Achievements", item.description)}
                        >
                          <Sparkles className="h-3 w-3 fill-indigo-600" />
                          AI STAR Bullets
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] flex items-center gap-1 text-zinc-600 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border-zinc-200 font-semibold"
                          onClick={() => handleTriggerAiPanel("rewrite", idx, "description", "Experience Achievements", item.description)}
                        >
                          <Type className="h-3 w-3" />
                          AI Rewrite
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={item.description || ""}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      placeholder="Use bullet highlights, e.g.:&#10;• Orchestrated API scaling decreasing timeouts by 60%&#10;• Mentored junior devs..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ company: "", role: "", duration: "", location: "", description: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Experience Row
            </Button>
          </div>
        )}

        {/* 5. INTERNSHIPS FORM */}
        {activeSection === "internships" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl space-y-4 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Company Name</label>
                    <Input
                      value={item.company || ""}
                      onChange={(e) => handleItemChange(idx, "company", e.target.value)}
                      placeholder="Amazon"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Role / Job Title</label>
                    <Input
                      value={item.role || ""}
                      onChange={(e) => handleItemChange(idx, "role", e.target.value)}
                      placeholder="SDE Intern"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Duration</label>
                    <Input
                      value={item.duration || ""}
                      onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                      placeholder="Summer 2023"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Description</label>
                    <Textarea
                      value={item.description || ""}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      placeholder="Describe work tasks..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ company: "", role: "", duration: "", description: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Internship Row
            </Button>
          </div>
        )}

        {/* 6. PROJECTS FORM */}
        {activeSection === "projects" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl space-y-4 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Project Name</label>
                    <Input
                      value={item.title || ""}
                      onChange={(e) => handleItemChange(idx, "title", e.target.value)}
                      placeholder="Chat App"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Project Link URL</label>
                    <Input
                      value={item.url || ""}
                      onChange={(e) => {
                        handleItemChange(idx, "url", e.target.value);
                        checkUrl(`proj_${idx}`, e.target.value);
                      }}
                      placeholder="https://github.com/user/chatapp"
                      className={cn(validationErrors[`proj_${idx}`] ? "border-red-500" : "")}
                    />
                    {validationErrors[`proj_${idx}`] && <p className="text-[10px] text-red-500 font-semibold">{validationErrors[`proj_${idx}`]}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Technologies</label>
                    <Input
                      value={item.technologies || ""}
                      onChange={(e) => handleItemChange(idx, "technologies", e.target.value)}
                      placeholder="WebSocket, React, Redis"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Overview Description</label>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200/50 font-bold"
                          onClick={() => handleTriggerAiPanel("project", idx, "description", "Project Overview", item.description)}
                        >
                          <Sparkles className="h-3 w-3 fill-indigo-600" />
                          AI Bullet Highlights
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] flex items-center gap-1 text-zinc-600 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border-zinc-200 font-semibold"
                          onClick={() => handleTriggerAiPanel("rewrite", idx, "description", "Project Overview", item.description)}
                        >
                          <Type className="h-3 w-3" />
                          AI Rewrite
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={item.description || ""}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      placeholder="Describe accomplishments..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ title: "", url: "", technologies: "", description: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Project Row
            </Button>
          </div>
        )}

        {/* 7. SKILLS FORM */}
        {activeSection === "skills" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-3 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl flex items-center gap-3 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <div className="grid gap-2 sm:grid-cols-3 pr-6 w-full text-left">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Skill Name</label>
                    <Input
                      value={item.name || ""}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      placeholder="PostgreSQL"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Category Group</label>
                    <Input
                      value={item.category || ""}
                      onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                      placeholder="Databases"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Proficiency Level</label>
                    <Input
                      value={item.proficiency || ""}
                      onChange={(e) => handleItemChange(idx, "proficiency", e.target.value)}
                      placeholder="Expert / 5 / 3 years"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs py-2.5 font-bold"
                onClick={() => addListItem({ name: "", category: "", proficiency: "" })}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Skill Row
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs py-2.5 font-bold border-indigo-200/50 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 hover:text-indigo-700"
                onClick={() => handleTriggerAiPanel("skills")}
              >
                <Sparkles className="mr-1.5 h-4 w-4 fill-indigo-600" /> AI Recommendations
              </Button>
            </div>
          </div>
        )}

        {/* 8. CERTIFICATIONS FORM */}
        {activeSection === "certifications" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl space-y-4 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Certification Name</label>
                    <Input
                      value={item.name || ""}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      placeholder="Oracle Java Architect"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Issuer</label>
                    <Input
                      value={item.issuer || ""}
                      onChange={(e) => handleItemChange(idx, "issuer", e.target.value)}
                      placeholder="Oracle Corp"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Issue Date</label>
                    <Input
                      value={item.date || ""}
                      onChange={(e) => handleItemChange(idx, "date", e.target.value)}
                      placeholder="Dec 2025"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Link</label>
                    <Input
                      value={item.url || ""}
                      onChange={(e) => handleItemChange(idx, "url", e.target.value)}
                      placeholder="https://oracle.com/cert"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ name: "", issuer: "", date: "", url: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Certification Row
            </Button>
          </div>
        )}

        {/* 9. LANGUAGES FORM */}
        {activeSection === "languages" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-3 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl flex items-center gap-3 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <div className="grid gap-2 sm:grid-cols-2 pr-6 w-full text-left">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Language</label>
                    <Input
                      value={item.name || ""}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      placeholder="German"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Proficiency Level</label>
                    <Input
                      value={item.proficiency || ""}
                      onChange={(e) => handleItemChange(idx, "proficiency", e.target.value)}
                      placeholder="Native / Conversational"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ name: "", proficiency: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Language Row
            </Button>
          </div>
        )}

        {/* 10. ACHIEVEMENTS FORM */}
        {activeSection === "achievements" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="space-y-2">
                  <Input
                    value={item.title || ""}
                    onChange={(e) => handleItemChange(idx, "title", e.target.value)}
                    placeholder="First Place Winner - CyberSecurity Capture the Flag"
                  />
                  <Textarea
                    value={item.description || ""}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    placeholder="Brief details of the prize or recognition..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ title: "", description: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Achievement Row
            </Button>
          </div>
        )}

        {/* 11. CUSTOM SECTIONS FORM */}
        {activeSection === "custom_sections" && (
          <div className="space-y-6">
            {Array.isArray(activeContent) && activeContent.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/20 border dark:border-zinc-800 rounded-xl space-y-3 relative">
                <button
                  type="button"
                  onClick={() => removeListItem(idx)}
                  className="absolute right-2 top-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="space-y-2">
                  <Input
                    value={item.sectionTitle || ""}
                    onChange={(e) => handleItemChange(idx, "sectionTitle", e.target.value)}
                    placeholder="Patents & Publications"
                  />
                  <Textarea
                    value={item.content || ""}
                    onChange={(e) => handleItemChange(idx, "content", e.target.value)}
                    placeholder="Write anything you want here, list links or descriptions..."
                    rows={4}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs py-2.5 font-bold"
              onClick={() => addListItem({ sectionTitle: "", content: "" })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Custom Block
            </Button>
          </div>
        )}

        {/* 12. STYLE & THEME CUSTOMIZATION FORM */}
        {activeSection === "design" && (
          <div className="space-y-6">
            
            {/* Color Palette selectors */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block border-b pb-1 dark:border-zinc-800">Color Customization</span>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={currentResume.themeConfig?.primaryColor || "#4f46e5"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            primaryColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 w-12 p-0 border-0 cursor-pointer rounded"
                    />
                    <Input
                      type="text"
                      value={currentResume.themeConfig?.primaryColor || "#4f46e5"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            primaryColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Secondary Details Color</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={currentResume.themeConfig?.secondaryColor || "#4b5563"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            secondaryColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 w-12 p-0 border-0 cursor-pointer rounded"
                    />
                    <Input
                      type="text"
                      value={currentResume.themeConfig?.secondaryColor || "#4b5563"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            secondaryColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Accent Borders Color</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={currentResume.themeConfig?.accentColor || "#818cf8"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            accentColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 w-12 p-0 border-0 cursor-pointer rounded"
                    />
                    <Input
                      type="text"
                      value={currentResume.themeConfig?.accentColor || "#818cf8"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            accentColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Background Canvas Color</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={currentResume.themeConfig?.backgroundColor || "#ffffff"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            backgroundColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 w-12 p-0 border-0 cursor-pointer rounded"
                    />
                    <Input
                      type="text"
                      value={currentResume.themeConfig?.backgroundColor || "#ffffff"}
                      onChange={(e) => {
                        updateResumeMetadata({
                          themeConfig: {
                            ...currentResume.themeConfig,
                            backgroundColor: e.target.value,
                          },
                        });
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preset Swatches */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Preset Color Theme Palette</span>
                <div className="flex gap-3 pt-1">
                  {[
                    { name: "indigo", hex: "#4f46e5" },
                    { name: "emerald", hex: "#059669" },
                    { name: "blue", hex: "#2563eb" },
                    { name: "slate", hex: "#334155" },
                    { name: "purple", hex: "#7c3aed" },
                    { name: "red", hex: "#b91c1c" },
                  ].map((color) => {
                    const isSelected = currentResume.themeConfig?.primaryColor === color.hex;
                    return (
                      <button
                        key={color.name}
                        onClick={() => {
                          updateResumeMetadata({
                            colorTheme: color.name,
                            themeConfig: {
                              ...currentResume.themeConfig,
                              primaryColor: color.hex,
                            },
                          });
                        }}
                        className={cn(
                          "h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition-transform",
                          isSelected ? "ring-2 ring-indigo-500 scale-110 border-white" : "border-zinc-200"
                        )}
                        title={color.name}
                        type="button"
                      >
                        <span className="h-6 w-6 rounded-full block" style={{ backgroundColor: color.hex }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Typography system */}
            <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block border-b pb-1 dark:border-zinc-800">Typography Settings</span>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Font Family</span>
                  <select
                    value={currentResume.fontFamily}
                    onChange={(e) => updateResumeMetadata({ fontFamily: e.target.value })}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="sans">Sans-serif (Inter/Roboto)</option>
                    <option value="serif">Serif (Georgia/Times)</option>
                    <option value="mono">Monospace (JetBrains Mono)</option>
                    <option value="montserrat">Montserrat (Technical Bold)</option>
                    <option value="playfair">Playfair Display (Elegant Serif)</option>
                    <option value="outfit">Outfit (Modern Rounded)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Base Font Size</span>
                  <select
                    value={currentResume.themeConfig?.fontSize || "base"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          fontSize: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="sm">Small (11px)</option>
                    <option value="base">Normal (13px)</option>
                    <option value="lg">Large (14px)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Line Height</span>
                  <select
                    value={currentResume.themeConfig?.lineHeight || "normal"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          lineHeight: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="tight">Tight</option>
                    <option value="normal">Normal</option>
                    <option value="loose">Loose</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Header text alignment</span>
                  <select
                    value={currentResume.themeConfig?.alignment || "left"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          alignment: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Centered</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block border-b pb-1 dark:border-zinc-800">Layout Structure</span>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Layout Column Style</span>
                  <select
                    value={currentResume.layoutStyle}
                    onChange={(e) => updateResumeMetadata({ layoutStyle: e.target.value })}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="single-column">Single Column (Stacked)</option>
                    <option value="two-column">Two Column Sidebar Layout</option>
                    <option value="left-sidebar">Left Sidebar Splitting</option>
                    <option value="right-sidebar">Right Sidebar Splitting</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Section Spacing</span>
                  <select
                    value={currentResume.themeConfig?.sectionSpacing || "normal"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          sectionSpacing: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="compact">Compact Spacing</option>
                    <option value="normal">Normal Spacing</option>
                    <option value="spacious">Spacious Padding</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Paper Margin Size</span>
                  <select
                    value={currentResume.pageMargin || "normal"}
                    onChange={(e) => updateResumeMetadata({ pageMargin: e.target.value })}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="compact">Narrow Margins (1.0cm)</option>
                    <option value="normal">Normal Margins (1.4cm)</option>
                    <option value="wide">Wide Margins (1.8cm)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Border Corner Radius</span>
                  <select
                    value={currentResume.themeConfig?.borderRadius || "md"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          borderRadius: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="none">Square (0px)</option>
                    <option value="sm">Small (4px)</option>
                    <option value="md">Medium (8px)</option>
                    <option value="lg">Rounded (12px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Design & Section Details */}
            <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block border-b pb-1 dark:border-zinc-800">Section Separators & Timelines</span>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Divider Style</span>
                  <select
                    value={currentResume.themeConfig?.dividerStyle || "solid"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          dividerStyle: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="none">No Divider Lines</option>
                    <option value="solid">Thin Solid Line</option>
                    <option value="dashed">Dashed Line</option>
                    <option value="bold">Thick Solid Line</option>
                    <option value="double">Double Line</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Timeline Connectors</span>
                  <select
                    value={currentResume.themeConfig?.timelineStyle || "none"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          timelineStyle: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="none">No Vertical Timeline Paths</option>
                    <option value="solid">Solid Timeline Chain</option>
                    <option value="dashed">Dashed Timeline Chain</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Icon Pack Style</span>
                  <select
                    value={currentResume.themeConfig?.iconStyle || "circle"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          iconStyle: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="none">No Icons</option>
                    <option value="simple">Simple Icon Outline</option>
                    <option value="circle">Circle Colored Background</option>
                    <option value="square">Square Colored Background</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Skill Representation</span>
                  <select
                    value={currentResume.themeConfig?.skillStyle || "badges"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          skillStyle: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="text">Plain Text List (Comma separated)</option>
                    <option value="badges">Colored Pills/Badges</option>
                    <option value="progress">Custom Progress Bars</option>
                    <option value="dots">5-Dot Strengths Ratings</option>
                    <option value="stars">5-Star Strengths Ratings</option>
                    <option value="categories">Grouped by Categories</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Photo Customization details */}
            <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block border-b pb-1 dark:border-zinc-800">Profile Photo Layout</span>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Photo Shape & Style</span>
                  <select
                    value={currentResume.themeConfig?.photoStyle || "circle"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          photoStyle: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="none">No Photo</option>
                    <option value="circle">Circular Portrait</option>
                    <option value="rounded-square">Rounded Corners Square</option>
                    <option value="square">Standard Square</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Photo Alignment / Position</span>
                  <select
                    value={currentResume.themeConfig?.photoPosition || "left"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          photoPosition: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="right">Right Aligned</option>
                    <option value="center">Centered (Header layout)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Header Style Preset</span>
                  <select
                    value={currentResume.themeConfig?.headerStyle || "split"}
                    onChange={(e) => {
                      updateResumeMetadata({
                        themeConfig: {
                          ...currentResume.themeConfig,
                          headerStyle: e.target.value,
                        },
                      });
                    }}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="compact">Compact Standard</option>
                    <option value="minimal">Centered Minimalist</option>
                    <option value="split">Separated Details Columns</option>
                    <option value="banner">Primary Color Background Banner</option>
                    <option value="left-border">Vertical Accent Highlight Bar</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 13. TEMPLATE SELECTION GALLERY */}
        {activeSection === "templates" && (
          <div className="space-y-6">
            <div className="space-y-4">
              
              {/* Search and Filters inputs */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Search templates (e.g. software, minimalist)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 text-xs"
                  />
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 sm:w-44"
                >
                  <option value="All">All Categories</option>
                  <option value="ATS Friendly">ATS Friendly</option>
                  <option value="Modern">Modern</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Professional">Professional</option>
                  <option value="Executive">Executive</option>
                  <option value="Creative">Creative</option>
                  <option value="Academic">Academic</option>
                </select>
              </div>

              {/* Advanced filter triggers */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                <select
                  value={layoutFilter}
                  onChange={(e) => setLayoutFilter(e.target.value)}
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="All">All Layouts</option>
                  <option value="single-column">Single Column</option>
                  <option value="two-column">Two Column Sidebar</option>
                  <option value="left-sidebar">Left Sidebar</option>
                  <option value="right-sidebar">Right Sidebar</option>
                </select>
                
                <select
                  value={pricingFilter}
                  onChange={(e) => setPricingFilter(e.target.value)}
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="All">All Pricing</option>
                  <option value="Free">Free Only</option>
                  <option value="Premium">Premium Only</option>
                </select>

                <select
                  value={colorFilter}
                  onChange={(e) => setColorFilter(e.target.value)}
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="All">All Colors</option>
                  <option value="indigo">Indigo/Blue</option>
                  <option value="emerald">Emerald/Teal</option>
                  <option value="slate">Slate/Dark</option>
                  <option value="purple">Purple/Pink</option>
                  <option value="red">Red/Crimson</option>
                </select>

                <div className="flex items-center justify-between border dark:border-zinc-850 px-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-950">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Pro Access</span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    userPlan === "pro" 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "bg-amber-500/10 text-amber-500"
                  )}>
                    {userPlan.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Recents list if available */}
            {recentTemplates.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Recently Used Templates</span>
                <div className="flex flex-wrap gap-2">
                  {recentTemplates.map((rId) => {
                    const match = templatesRegistry.find((t) => t.id === rId);
                    if (!match) return null;
                    return (
                      <button
                        key={rId}
                        type="button"
                        onClick={() => {
                          if (match.isPremium && userPlan !== "pro") {
                            setPendingTemplate(match);
                            setPreviewTemplateId(match.id);
                            setUpgradeDialogOpen(true);
                          } else {
                            updateResumeMetadata({ templateId: match.id });
                            setPreviewTemplateId(null);
                            if (currentResume.userId && currentResume.userId !== "placeholder-user") {
                              addRecentTemplateAction(currentResume.userId, match.id).then((list) => setRecentTemplates(list));
                            }
                            success(`Switched layout to "${match.name}"`);
                          }
                        }}
                        className="text-[10px] px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border dark:border-zinc-800 font-semibold"
                      >
                        {match.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid display of templates items */}
            <div className="grid gap-4 sm:grid-cols-2">
              {templatesRegistry
                .filter((temp) => {
                  // Search query text match
                  const query = searchQuery.toLowerCase();
                  const nameMatch = temp.name.toLowerCase().includes(query);
                  const descMatch = temp.description.toLowerCase().includes(query);
                  const roleMatch = temp.recommendedFor.some((r) => r.toLowerCase().includes(query));
                  const searchOk = nameMatch || descMatch || roleMatch;

                  // Category filter
                  const catOk = categoryFilter === "All" || temp.category === categoryFilter;

                  // Layout filter
                  const layoutOk = layoutFilter === "All" || temp.defaultConfig.layoutStyle === layoutFilter;

                  // Pricing filter
                  const priceOk = pricingFilter === "All" || 
                                  (pricingFilter === "Free" && !temp.isPremium) || 
                                  (pricingFilter === "Premium" && temp.isPremium);

                  // Color theme filter
                  const colorOk = colorFilter === "All" || 
                                  (colorFilter === "indigo" && (temp.defaultConfig.primaryColor === "#4f46e5" || temp.defaultConfig.primaryColor === "#2563eb" || temp.defaultConfig.primaryColor === "#003399")) ||
                                  (colorFilter === "emerald" && (temp.defaultConfig.primaryColor === "#059669" || temp.defaultConfig.primaryColor === "#0d9488" || temp.defaultConfig.primaryColor === "#0f766e" || temp.defaultConfig.primaryColor === "#14b8a6" || temp.defaultConfig.primaryColor === "#10b981")) ||
                                  (colorFilter === "slate" && (temp.defaultConfig.primaryColor === "#18181b" || temp.defaultConfig.primaryColor === "#111827" || temp.defaultConfig.primaryColor === "#334155" || temp.defaultConfig.primaryColor === "#0f172a" || temp.defaultConfig.primaryColor === "#1e293b" || temp.defaultConfig.primaryColor === "#475569" || temp.defaultConfig.primaryColor === "#000000")) ||
                                  (colorFilter === "purple" && (temp.defaultConfig.primaryColor === "#7c3aed" || temp.defaultConfig.primaryColor === "#db2777" || temp.defaultConfig.primaryColor === "#6d28d9" || temp.defaultConfig.primaryColor === "#8b5cf6")) ||
                                  (colorFilter === "red" && (temp.defaultConfig.primaryColor === "#b91c1c" || temp.defaultConfig.primaryColor === "#ef4444" || temp.defaultConfig.primaryColor === "#4c0519"));

                  return searchOk && catOk && layoutOk && priceOk && colorOk;
                })
                .map((temp) => {
                  const isFavorited = favoriteTemplates.includes(temp.id);
                  const isCurrentlyApplied = (previewTemplateId === null && currentResume.templateId === temp.id) || (previewTemplateId === temp.id);
                  const isActuallySaved = currentResume.templateId === temp.id;

                  // Recommendations trigger (check if PM, Designer or Software Engineer match user headline)
                  const userHeadline = (personal.headline || "").toLowerCase();
                  const isRecommended = temp.recommendedFor.some((role) => userHeadline.includes(role.toLowerCase()));

                  return (
                    <Card 
                      key={temp.id} 
                      className={cn(
                        "p-4 flex flex-col justify-between border-2 transition-all relative overflow-hidden text-left",
                        isCurrentlyApplied ? "border-indigo-600 bg-indigo-50/5 dark:bg-indigo-950/5 shadow-md" : "border-zinc-200 dark:border-zinc-800"
                      )}
                    >
                      {/* Recommendations banner ribbon */}
                      {isRecommended && (
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white font-extrabold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-bl">
                          Ideal Match
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">{temp.category}</span>
                            <h4 className="text-xs font-bold text-zinc-950 dark:text-white mt-0.5">{temp.name}</h4>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Favorite action button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (currentResume.userId && currentResume.userId !== "placeholder-user") {
                                  toggleFavoriteTemplateAction(currentResume.userId, temp.id).then((list) => setFavoriteTemplates(list));
                                  success(isFavorited ? `Removed "${temp.name}" from favorites` : `Added "${temp.name}" to favorites`);
                                }
                              }}
                              className={cn(
                                "p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors",
                                isFavorited ? "text-amber-500" : "text-zinc-300 dark:text-zinc-650"
                              )}
                              title="Pin favorite template"
                            >
                              <Star className={cn("h-3.5 w-3.5", isFavorited ? "fill-amber-500" : "")} />
                            </button>

                            {/* Free / Premium banner indicator */}
                            {temp.isPremium ? (
                              <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5 uppercase tracking-widest">
                                Pro
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest">
                                Free
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-zinc-500 leading-relaxed text-left">
                          {temp.description}
                        </p>

                        <div className="flex flex-wrap gap-1 text-[9px] text-zinc-400">
                          <span>ATS Compatibility: <strong className="text-zinc-600 dark:text-zinc-200">{temp.atsScore}%</strong></span>
                          <span>•</span>
                          <span>Popularity: <strong className="text-zinc-600 dark:text-zinc-200">{temp.popularity}/5.0</strong></span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900/60 shrink-0">
                        {/* 1. Preview button (non-blocking) */}
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "flex-1 text-[10px] h-8 font-bold",
                            previewTemplateId === temp.id ? "bg-zinc-100 dark:bg-zinc-900" : ""
                          )}
                          onClick={() => {
                            setPreviewTemplateId(temp.id);
                            success(`Previewing style layout for "${temp.name}"`);
                          }}
                        >
                          {previewTemplateId === temp.id ? "Previewing" : "Preview"}
                        </Button>

                        {/* 2. Apply template button (tier restricted) */}
                        <Button
                          type="button"
                          className="flex-1 text-[10px] h-8 font-bold"
                          variant={isActuallySaved ? "default" : "outline"}
                          disabled={isActuallySaved}
                          onClick={() => {
                            if (temp.isPremium && userPlan !== "pro") {
                              setPendingTemplate(temp);
                              setUpgradeDialogOpen(true);
                            } else {
                              updateResumeMetadata({ templateId: temp.id });
                              setPreviewTemplateId(null);
                              if (currentResume.userId && currentResume.userId !== "placeholder-user") {
                                addRecentTemplateAction(currentResume.userId, temp.id).then((list) => setRecentTemplates(list));
                              }
                              success(`Layout template changed to "${temp.name}"`);
                            }
                          }}
                        >
                          {isActuallySaved ? "Applied" : "Apply"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* DRAGDIVIDER RIGHT */}
      <div
        className="w-1 cursor-col-resize hover:bg-indigo-500 bg-transparent transition-colors h-full select-none"
        onMouseDown={startResizeRight}
      />

      {/* RIGHT PANEL: LIVE PREVIEW CANVAS */}
      <div
        className="bg-zinc-100 dark:bg-zinc-900/30 overflow-auto h-full shrink-0 flex flex-col relative"
        style={{ width: `${rightWidth}px` }}
      >
        {/* Preview Zoom Controls header */}
        <div className="sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-between z-10 select-none">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Maximize className="h-3 w-3" /> Live Render Preview
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-[10px]"
              onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
              title="Zoom Out"
            >
              -
            </Button>
            <span className="text-[10px] font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-[10px]"
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              title="Zoom In"
            >
              +
            </Button>
            <Button
              variant="outline"
              className="h-7 text-[10px] px-2"
              onClick={() => setZoom(rightWidth / 850)}
              title="Fit to panel width"
            >
              Fit Width
            </Button>
          </div>
        </div>

        {/* Preview canvas viewport */}
        <div className="flex-1 flex justify-center p-6 overflow-y-auto min-h-0 bg-zinc-100 dark:bg-zinc-900/10">
          <ResumePreviewCanvas resume={currentResume} zoom={zoom} previewTemplateId={previewTemplateId} />
        </div>
      </div>

      {/* ATS insights dialog check sheet */}
      <Dialog isOpen={isAtsOpen} onClose={() => setIsAtsOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-950 dark:text-white">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
            ATS Optimization Hub
          </DialogTitle>
          <DialogDescription>
            Audit parsing compliance, grammar accuracy, keyword densities, and achievement quality.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {aiAtsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <div className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Running AI Validation Check...</p>
            </div>
          ) : aiAtsReport ? (
            <div className="space-y-5 text-left text-xs">
              {/* Score Badges */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border dark:border-zinc-850">
                <div className="flex items-center gap-2.5">
                  <div className="h-12 w-12 rounded-full border-2 border-indigo-600 flex items-center justify-center font-extrabold text-indigo-600 text-sm shrink-0 bg-white dark:bg-zinc-950">
                    {aiAtsReport.overallScore}%
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-900 dark:text-zinc-200">Overall ATS Score</h5>
                    <p className="text-[9px] text-zinc-400">Aim for 75%+ to clear filters.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex justify-between border-b pb-0.5 border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400">Keywords</span>
                    <span className="font-bold">{aiAtsReport.keywordScore}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-0.5 border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400">Formatting</span>
                    <span className="font-bold">{aiAtsReport.formatScore}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-0.5 border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400">Grammar</span>
                    <span className="font-bold">{aiAtsReport.grammarScore}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-0.5 border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400">Completeness</span>
                    <span className="font-bold">{aiAtsReport.designScore}%</span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 border dark:border-zinc-800 bg-zinc-50/20 rounded">
                  <span className="text-zinc-400 block mb-0.5">Readability Index</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-250">{aiAtsReport.metrics?.readability || 0}/100</span>
                </div>
                <div className="p-2 border dark:border-zinc-800 bg-zinc-50/20 rounded">
                  <span className="text-zinc-400 block mb-0.5">Action Verbs Used</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-250">{aiAtsReport.metrics?.actionVerbsCount || 0}</span>
                </div>
                <div className="p-2 border dark:border-zinc-800 bg-zinc-50/20 rounded">
                  <span className="text-zinc-400 block mb-0.5">Metrics Count</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-250">{aiAtsReport.metrics?.quantifiableAchievementsPercent || 0}%</span>
                </div>
              </div>

              {/* Missing keywords checklist */}
              {aiAtsReport.missingKeywords?.length > 0 && (
                <div className="space-y-1.5">
                  <h6 className="font-bold uppercase tracking-wider text-[9px] text-zinc-400">Missing Critical Keywords</h6>
                  <div className="flex flex-wrap gap-1">
                    {aiAtsReport.missingKeywords.map((kw: string) => (
                      <span key={kw} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-semibold text-[10px]">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Sentence Rewrite recommendations */}
              {aiAtsReport.weakSentences?.length > 0 && (
                <div className="space-y-1.5">
                  <h6 className="font-bold uppercase tracking-wider text-[9px] text-zinc-400">Passive / Weak Phrasings Fixes</h6>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {aiAtsReport.weakSentences.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-zinc-50/50 dark:bg-zinc-900/10 border dark:border-zinc-850 rounded-lg space-y-1.5">
                        <p className="text-[10px] text-zinc-400 italic">❌ "{item.original}"</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          ✅ "{item.suggestion}"
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-5 text-[8px] px-1.5 font-extrabold"
                          onClick={() => {
                            navigator.clipboard.writeText(item.suggestion);
                            success("Copied improvement to clipboard! Paste it inside editor.");
                          }}
                        >
                          Copy Fix
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatting checks */}
              {aiAtsReport.formattingFlags?.length > 0 && (
                <div className="space-y-1.5">
                  <h6 className="font-bold uppercase tracking-wider text-[9px] text-zinc-400">Formatting Flags</h6>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-555">
                    {aiAtsReport.formattingFlags.map((flag: string, idx: number) => (
                      <li key={idx} className="text-[10px] leading-relaxed">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* General recommendations */}
              {aiAtsReport.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <h6 className="font-bold uppercase tracking-wider text-[9px] text-zinc-400">Detailed Action Items</h6>
                  <div className="divide-y border dark:border-zinc-800 dark:divide-zinc-800 rounded overflow-hidden">
                    {aiAtsReport.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-2 flex items-start gap-2 bg-zinc-50/20">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 mt-0.5 ${
                          rec.priority === "high" ? "bg-red-100 text-red-700" :
                          rec.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {rec.priority}
                        </span>
                        <div className="text-[10px] leading-relaxed">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300 capitalize">{rec.section}: </span>
                          <span className="text-zinc-650 dark:text-zinc-400">{rec.tip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold text-zinc-500"
                onClick={() => setAiAtsReport(null)}
              >
                Clear Deep Scan Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Call AI-powered scan button */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50/50 to-indigo-100/10 dark:from-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 fill-indigo-600 animate-pulse" /> AI-Powered Deep Check
                  </span>
                  <p className="text-[10px] text-zinc-505 dark:text-zinc-405 leading-relaxed mt-0.5">
                    Evaluate achievements metrics, check spelling and grammar, and scan keywords using language model auditing.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRunAiAtsScan}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs shadow-sm"
                >
                  Run Deep Scan
                </Button>
              </div>

              {/* Local hints checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block text-left">Local Structure Hints ({atsHints.length})</span>
                {atsHints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">All checks passed!</h4>
                    <p className="text-xs text-zinc-400 text-center">Your resume structure satisfies standard parsing templates.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {atsHints.map((hint) => (
                      <div
                        key={hint.id}
                        className={cn(
                          "p-3 rounded-lg border text-left flex gap-3 text-xs",
                          hint.type === "error"
                            ? "bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-400"
                            : hint.type === "warning"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-400"
                        )}
                      >
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold uppercase tracking-wider text-[10px]">
                            {hint.section} • {hint.message}
                          </h5>
                          <p className="opacity-90 mt-1 leading-relaxed text-[11px]">{hint.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => setIsAtsOpen(false)}>Close Optimization Hub</Button>
        </DialogFooter>
      </Dialog>

      {/* Upgrade to Pro dialog modal */}
      <Dialog isOpen={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-950 dark:text-white">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
            Unlock Premium Resume Designs
          </DialogTitle>
          <DialogDescription className="text-left text-zinc-500">
            Applying the <strong>{pendingTemplate?.name || "Premium"}</strong> template permanently is restricted for free accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4 text-xs text-left">
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-lg space-y-1.5">
            <span className="font-bold text-indigo-700 dark:text-indigo-400">Pro Feature Lock Info:</span>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
              You can keep previewing this template inside the canvas viewport, but exporting to PDF/DOCX or sharing a public link requires a Pro tier.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-zinc-700 dark:text-zinc-200">What is included in ResumeAI Pro:</h5>
            <ul className="space-y-1.5 pl-4 list-disc text-zinc-500">
              <li>Access to all 26 Premium resume templates.</li>
              <li>AI resume writer and bullet highlights generator.</li>
              <li>Detailed ATS Keyword scanning report cards.</li>
              <li>AI cover letter generator (Module 7 ready).</li>
              <li>Unlimited high-resolution PDF and Word exports.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>Keep Previewing</Button>
          <Button 
            onClick={() => {
              // Simulate billing checkout success
              setUserPlan("pro");
              setUpgradeDialogOpen(false);
              if (pendingTemplate) {
                updateResumeMetadata({ templateId: pendingTemplate.id });
                setPreviewTemplateId(null);
                if (currentResume.userId && currentResume.userId !== "placeholder-user") {
                  addRecentTemplateAction(currentResume.userId, pendingTemplate.id).then((list) => setRecentTemplates(list));
                }
              }
              success("Subscription activated! You are now a Pro member.");
            }}
            className="bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold"
          >
            Upgrade to Pro ($9.99/mo)
          </Button>
        </DialogFooter>
      </Dialog>

      {/* AI Career Assistant Dialog */}
      <Dialog isOpen={aiDialogOpen} onClose={() => {
        if (isAiStreaming) handleCancelAiGeneration();
        setAiDialogOpen(false);
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5 fill-indigo-600 animate-pulse" />
            AI Career Assistant
          </DialogTitle>
          <DialogDescription className="text-left text-zinc-500">
            {aiSectionType === "summary" && "Generate an ATS-optimized professional summary using your resume context."}
            {aiSectionType === "experience" && "Generate STAR bullet points (Situation, Task, Action, Result) with active verbs."}
            {aiSectionType === "project" && "Generate technical overview highlights for your project."}
            {aiSectionType === "skills" && "Get keyword-optimized skill suggestions tailored to your target job."}
            {aiSectionType === "rewrite" && "Rewrite, shorten, expand, or grammar-check your text."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs text-left max-h-[60vh] overflow-y-auto">
          {/* Credit limit warning for free users */}
          {dailyAiUsage.plan === "free" && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-indigo-700 dark:text-indigo-400">Daily Credits Status:</span>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-relaxed mt-0.5">
                  You have {Math.max(0, 5 - dailyAiUsage.count)} of 5 daily generations left. Upgrade to Pro for unlimited.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[9px] font-extrabold text-amber-600 hover:text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                onClick={() => {
                  setAiDialogOpen(false);
                  setUpgradeDialogOpen(true);
                }}
              >
                Go Pro
              </Button>
            </div>
          )}

          {/* AI Generator Input controls */}
          <div className="space-y-3">
            {/* Tone Selector */}
            {aiSectionType !== "skills" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Tone Style</label>
                <select
                  value={aiInputParams.tone}
                  onChange={(e) => setAiInputParams({ ...aiInputParams, tone: e.target.value })}
                  className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
                >
                  <option value="Professional">Professional & Balanced</option>
                  <option value="Executive">Executive & Leadership-focused</option>
                  <option value="Technical">Technical & Developer-focused</option>
                  <option value="Friendly">Friendly & Enthusiastic</option>
                  <option value="Creative">Creative & Dynamic</option>
                </select>
              </div>
            )}

            {/* SUMMARY PARAMS */}
            {aiSectionType === "summary" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Industry / Area</label>
                  <Input
                    value={aiInputParams.industry}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, industry: e.target.value })}
                    placeholder="e.g. Fintech, E-commerce, Artificial Intelligence"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Target Career Goals</label>
                  <Input
                    value={aiInputParams.careerGoals}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, careerGoals: e.target.value })}
                    placeholder="e.g. Lead SDE, transition into management"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Length</label>
                  <select
                    value={aiInputParams.length}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, length: e.target.value })}
                    className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-850 dark:text-zinc-250"
                  >
                    <option value="short">Short (1-2 sentences)</option>
                    <option value="medium">Medium (2-3 sentences)</option>
                    <option value="long">Long (4-5 sentences)</option>
                  </select>
                </div>
              </>
            )}

            {/* EXPERIENCE PARAMS */}
            {aiSectionType === "experience" && (
              <>
                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Job Title</label>
                    <Input
                      value={aiInputParams.role}
                      onChange={(e) => setAiInputParams({ ...aiInputParams, role: e.target.value })}
                      placeholder="Senior Dev"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Company Name</label>
                    <Input
                      value={aiInputParams.company}
                      onChange={(e) => setAiInputParams({ ...aiInputParams, company: e.target.value })}
                      placeholder="Stripe"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Key accomplishments or details to build from</label>
                  <Textarea
                    value={aiInputParams.achievements}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, achievements: e.target.value })}
                    placeholder="e.g. migration to typescript, reduced API times, led 3 devs..."
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </>
            )}

            {/* PROJECT PARAMS */}
            {aiSectionType === "project" && (
              <>
                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Project Title</label>
                    <Input
                      value={aiInputParams.title}
                      onChange={(e) => setAiInputParams({ ...aiInputParams, title: e.target.value })}
                      placeholder="E-commerce App"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Role / Technologies</label>
                    <Input
                      value={aiInputParams.techStack}
                      onChange={(e) => setAiInputParams({ ...aiInputParams, techStack: e.target.value })}
                      placeholder="React, Node.js, Postgres"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Key details and outcomes</label>
                  <Textarea
                    value={aiInputParams.achievements}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, achievements: e.target.value })}
                    placeholder="e.g. built websocket messaging room, deployed on AWS ECS..."
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </>
            )}

            {/* SKILLS PARAMS */}
            {aiSectionType === "skills" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Target Job Title</label>
                  <Input
                    value={aiInputParams.role}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, role: e.target.value })}
                    placeholder="e.g. Frontend React Engineer"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Industry</label>
                  <Input
                    value={aiInputParams.industry}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, industry: e.target.value })}
                    placeholder="e.g. Fintech, Biotech, AI Startup"
                    className="h-8 text-xs"
                  />
                </div>
              </>
            )}

            {/* REWRITE PARAMS */}
            {aiSectionType === "rewrite" && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Action</label>
                  <select
                    value={aiInputParams.action}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, action: e.target.value })}
                    className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="rewrite">Professional Rewrite</option>
                    <option value="expand">Expand & Elaborate</option>
                    <option value="shorten">Shorten & Condense</option>
                    <option value="grammar">Grammar & Spell Check</option>
                    <option value="ats-optimize">Optimize for ATS Parsers</option>
                    <option value="simplify">Simplify Phrasing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Original Text</label>
                  <Textarea
                    value={aiInputParams.originalText}
                    onChange={(e) => setAiInputParams({ ...aiInputParams, originalText: e.target.value })}
                    placeholder="Enter text to rewrite..."
                    rows={4}
                    className="text-xs"
                  />
                </div>
              </>
            )}
          </div>

          {/* AI output generation viewport */}
          <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                {isAiStreaming && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />}
                AI Generated Output
              </span>
              {isAiStreaming && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAiGeneration}
                  className="h-6 text-[10px] font-semibold text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel stream
                </Button>
              )}
            </div>

            {aiSectionType === "skills" && getParsedSkills() ? (
              // Skills parser layout selection
              <div className="p-3 bg-zinc-50/80 dark:bg-zinc-900/30 border dark:border-zinc-800 rounded-lg space-y-3">
                <p className="text-[10px] text-zinc-400 font-bold">Select skills to add directly into resume:</p>
                {Object.entries(getParsedSkills() || {}).map(([category, skills]) => (
                  <div key={category} className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-zinc-500">{category}</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {Array.isArray(skills) && skills.map((sk: string) => {
                        const isChecked = selectedSkills.includes(sk);
                        return (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => {
                              setSelectedSkills(
                                isChecked
                                  ? selectedSkills.filter((s) => s !== sk)
                                  : [...selectedSkills, sk]
                              );
                            }}
                            className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer",
                              isChecked
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-350 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50"
                            )}
                          >
                            {sk}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Normal text viewer
              <div className="relative">
                <Textarea
                  readOnly={isAiStreaming}
                  value={aiOutputText}
                  onChange={(e) => setAiOutputText(e.target.value)}
                  placeholder="AI generated content will stream here..."
                  rows={6}
                  className={cn(
                    "text-xs bg-zinc-50/50 dark:bg-zinc-900/10 focus:ring-1 focus:ring-indigo-500",
                    isAiStreaming ? "animate-pulse" : ""
                  )}
                />
                {isAiStreaming && (
                  <div className="absolute bottom-2 right-2 text-[10px] font-extrabold text-indigo-500 flex items-center gap-1">
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    Generating...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {isAiStreaming ? (
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Close Window</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Dismiss</Button>
              {aiSectionType === "skills" && getParsedSkills() ? (
                <Button
                  onClick={handleAddSelectedSkills}
                  disabled={selectedSkills.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Add Selected Skills ({selectedSkills.length})
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(aiOutputText);
                      success("Copied to clipboard!");
                    }}
                    disabled={!aiOutputText.trim()}
                    className="border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleApplyAiText("insert")}
                    disabled={!aiOutputText.trim()}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50/20 font-semibold"
                  >
                    Insert Below
                  </Button>
                  <Button
                    onClick={() => handleApplyAiText("replace")}
                    disabled={!aiOutputText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Accept & Replace
                  </Button>
                </>
              )}
            </>
          )}
          {!isAiStreaming && (
            <Button
              onClick={handleStartAiGeneration}
              disabled={dailyAiUsage.plan === "free" && dailyAiUsage.count >= 5}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-sm"
            >
              {aiOutputText ? "Regenerate" : "Generate with AI"}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
