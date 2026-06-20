"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { Resume, ResumeSection, SectionType } from "@/types";
import { getResumeAction, saveResumeFullAction } from "@/app/actions/resumeActions";

interface ResumeContextType {
  currentResume: Resume | null;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  previewTemplateId: string | null;
  setPreviewTemplateId: (id: string | null) => void;
  loadResume: (id: string) => Promise<void>;
  updateResumeDetails: (title: string, description?: string) => void;
  updateResumeMetadata: (data: Partial<Omit<Resume, "id" | "userId" | "sections">>) => void;
  updateSection: (sectionId: string, content: any) => void;
  addSection: (sectionType: SectionType, title: string) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (sections: ResumeSection[]) => void;
  undo: () => void;
  redo: () => void;
  saveChanges: () => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

const MAX_HISTORY_LIMIT = 50;

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [past, setPast] = useState<Resume[]>([]);
  const [future, setFuture] = useState<Resume[]>([]);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pushStateToHistory = useCallback((state: Resume) => {
    setPast((prev) => {
      const updated = [...prev, JSON.parse(JSON.stringify(state))];
      if (updated.length > MAX_HISTORY_LIMIT) {
        updated.shift();
      }
      return updated;
    });
    setFuture([]); // Clear redo stack
    setIsDirty(true);
  }, []);

  const loadResume = async (id: string) => {
    try {
      const data = await getResumeAction(id);
      if (data) {
        setCurrentResume(data);
        setPast([]);
        setFuture([]);
        setIsDirty(false);
        setPreviewTemplateId(null);
      } else {
        throw new Error("No resume data returned");
      }
    } catch (err) {
      console.warn("Using default resume workspace state fallback:", err);
      // Setup default fallback structure
      const defaultState: Resume = {
        id,
        userId: "placeholder-user",
        title: "Untitled Resume",
        templateId: "modern",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
        status: "draft",
        isFavorite: false,
        isArchived: false,
        colorTheme: "indigo",
        fontFamily: "sans",
        paperSize: "A4",
        pageMargin: "normal",
        layoutStyle: "single-column",
        resumeType: "custom",
        sections: [
          {
            id: "sec-personal",
            resumeId: id,
            sectionType: "personal",
            title: "Personal Information",
            orderIndex: 0,
            content: {
              fullName: "",
              email: "",
              phone: "",
              location: "",
              website: "",
              linkedinUrl: "",
              githubUrl: "",
              portfolioUrl: "",
            },
          },
          {
            id: "sec-summary",
            resumeId: id,
            sectionType: "summary",
            title: "Professional Summary",
            orderIndex: 1,
            content: { text: "" },
          },
          {
            id: "sec-education",
            resumeId: id,
            sectionType: "education",
            title: "Education",
            orderIndex: 2,
            content: [],
          },
          {
            id: "sec-experience",
            resumeId: id,
            sectionType: "experience",
            title: "Work Experience",
            orderIndex: 3,
            content: [],
          },
          {
            id: "sec-internships",
            resumeId: id,
            sectionType: "internships",
            title: "Internships",
            orderIndex: 4,
            content: [],
          },
          {
            id: "sec-projects",
            resumeId: id,
            sectionType: "projects",
            title: "Projects",
            orderIndex: 5,
            content: [],
          },
          {
            id: "sec-skills",
            resumeId: id,
            sectionType: "skills",
            title: "Core Skills",
            orderIndex: 6,
            content: [],
          },
          {
            id: "sec-certifications",
            resumeId: id,
            sectionType: "certifications",
            title: "Certifications",
            orderIndex: 7,
            content: [],
          },
          {
            id: "sec-languages",
            resumeId: id,
            sectionType: "languages",
            title: "Languages",
            orderIndex: 8,
            content: [],
          },
          {
            id: "sec-achievements",
            resumeId: id,
            sectionType: "achievements",
            title: "Achievements",
            orderIndex: 9,
            content: [],
          },
          {
            id: "sec-interests",
            resumeId: id,
            sectionType: "interests",
            title: "Interests",
            orderIndex: 10,
            content: [],
          },
          {
            id: "sec-references",
            resumeId: id,
            sectionType: "references",
            title: "References",
            orderIndex: 11,
            content: [],
          },
          {
            id: "sec-publications",
            resumeId: id,
            sectionType: "publications",
            title: "Publications",
            orderIndex: 12,
            content: [],
          },
          {
            id: "sec-awards",
            resumeId: id,
            sectionType: "awards",
            title: "Awards",
            orderIndex: 13,
            content: [],
          },
          {
            id: "sec-volunteer",
            resumeId: id,
            sectionType: "volunteer_experience",
            title: "Volunteer Experience",
            orderIndex: 14,
            content: [],
          },
          {
            id: "sec-custom",
            resumeId: id,
            sectionType: "custom_sections",
            title: "Custom Sections",
            orderIndex: 15,
            content: [],
          },
        ],
      };
      setCurrentResume(defaultState);
      setPast([]);
      setFuture([]);
      setIsDirty(false);
    }
  };

  const updateResumeDetails = useCallback((title: string, description?: string) => {
    if (!currentResume) return;
    pushStateToHistory(currentResume);

    setCurrentResume((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        title,
        description: description ?? prev.description,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [currentResume, pushStateToHistory]);

  const updateResumeMetadata = useCallback((data: Partial<Omit<Resume, "id" | "userId" | "sections">>) => {
    if (!currentResume) return;
    pushStateToHistory(currentResume);

    setCurrentResume((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...data,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [currentResume, pushStateToHistory]);

  const updateSection = useCallback((sectionId: string, content: any) => {
    if (!currentResume) return;
    pushStateToHistory(currentResume);

    setCurrentResume((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        sections: prev.sections.map((sec) =>
          sec.id === sectionId ? { ...sec, content } : sec
        ),
      };
    });
  }, [currentResume, pushStateToHistory]);

  const addSection = useCallback((sectionType: SectionType, title: string) => {
    if (!currentResume) return;
    pushStateToHistory(currentResume);

    const newSection: ResumeSection = {
      id: `sec-${Date.now()}`,
      resumeId: currentResume.id,
      sectionType,
      title,
      orderIndex: currentResume.sections.length,
      content: sectionType === "personal" ? {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        linkedinUrl: "",
        githubUrl: "",
        portfolioUrl: "",
      } : [],
    };

    setCurrentResume((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        sections: [...prev.sections, newSection],
      };
    });
  }, [currentResume, pushStateToHistory]);

  const removeSection = useCallback((sectionId: string) => {
    if (!currentResume) return;
    pushStateToHistory(currentResume);

    setCurrentResume((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        sections: prev.sections.filter((sec) => sec.id !== sectionId),
      };
    });
  }, [currentResume, pushStateToHistory]);

  const reorderSections = useCallback((sections: ResumeSection[]) => {
    if (!currentResume) return;
    pushStateToHistory(currentResume);

    setCurrentResume((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        sections: sections.map((sec, idx) => ({ ...sec, orderIndex: idx })),
      };
    });
  }, [currentResume, pushStateToHistory]);

  const undo = useCallback(() => {
    if (past.length === 0 || !currentResume) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prev) => [JSON.parse(JSON.stringify(currentResume)), ...prev]);
    setCurrentResume(previous);
    setIsDirty(true);
  }, [past, currentResume]);

  const redo = useCallback(() => {
    if (future.length === 0 || !currentResume) return;

    const nextState = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, JSON.parse(JSON.stringify(currentResume))]);
    setFuture(newFuture);
    setCurrentResume(nextState);
    setIsDirty(true);
  }, [future, currentResume]);

  const saveChanges = async () => {
    if (!currentResume) return;
    setSaving(true);
    try {
      await saveResumeFullAction(currentResume.id, currentResume);
      setIsDirty(false);
    } catch (err) {
      console.error("Auto-saving failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Debounced Auto Save logic
  useEffect(() => {
    if (!isDirty || !currentResume) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveChanges();
    }, 1500); // Debounce save for 1.5 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [currentResume, isDirty]);

  // Alert user before closing window with unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <ResumeContext.Provider
      value={{
        currentResume,
        saving,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        isDirty,
        previewTemplateId,
        setPreviewTemplateId,
        loadResume,
        updateResumeDetails,
        updateResumeMetadata,
        updateSection,
        addSection,
        removeSection,
        reorderSections,
        undo,
        redo,
        saveChanges,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}
