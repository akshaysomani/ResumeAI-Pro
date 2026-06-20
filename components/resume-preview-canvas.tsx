"use client";

import React from "react";
import type { Resume, ResumeSection } from "@/types";
import { getTemplateConfig, templatesRegistry } from "@/lib/templates-registry";
import { cn } from "@/lib/utils";
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  MapPin,
  Heart,
  Globe,
  FileBadge,
  Bookmark,
  Calendar,
  Star,
  Layers,
  Link as LinkIcon,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";

interface ResumePreviewCanvasProps {
  resume: Resume;
  zoom: number; // e.g. 0.75, 1, 1.25
  previewTemplateId?: string | null;
}

export function ResumePreviewCanvas({ resume, zoom, previewTemplateId = null }: ResumePreviewCanvasProps) {
  // 1. Fetch active template config and merge with user overrides
  const activeTemplateId = previewTemplateId || resume.templateId || "modern";
  const templateConfig = getTemplateConfig(activeTemplateId);

  const {
    colorTheme = "indigo",
    fontFamily = "sans",
    paperSize = "A4",
    pageMargin = "normal",
    layoutStyle = "single-column",
    themeConfig = {},
  } = resume;

  const mergedConfig = {
    layoutStyle: resume.layoutStyle || templateConfig.layoutStyle,
    fontFamily: resume.fontFamily || templateConfig.fontFamily,
    primaryColor: themeConfig.primaryColor || templateConfig.primaryColor,
    secondaryColor: themeConfig.secondaryColor || templateConfig.secondaryColor,
    accentColor: themeConfig.accentColor || templateConfig.accentColor,
    backgroundColor: themeConfig.backgroundColor || templateConfig.backgroundColor,
    borderRadius: themeConfig.borderRadius || templateConfig.borderRadius,
    sectionSpacing: themeConfig.sectionSpacing || templateConfig.sectionSpacing,
    dividerStyle: themeConfig.dividerStyle || templateConfig.dividerStyle,
    iconStyle: themeConfig.iconStyle || templateConfig.iconStyle,
    headerStyle: themeConfig.headerStyle || templateConfig.headerStyle,
    skillStyle: themeConfig.skillStyle || templateConfig.skillStyle,
    photoStyle: themeConfig.photoStyle || templateConfig.photoStyle,
    photoPosition: themeConfig.photoPosition || templateConfig.photoPosition,
    timelineStyle: themeConfig.timelineStyle || templateConfig.timelineStyle,
    pageMargin: resume.pageMargin || templateConfig.pageMargin,
    fontSize: themeConfig.fontSize || templateConfig.fontSize,
    lineHeight: themeConfig.lineHeight || templateConfig.lineHeight,
  };

  // Extract config specs
  const primaryColor = mergedConfig.primaryColor;
  const accentColor = mergedConfig.accentColor;
  const backgroundColor = mergedConfig.backgroundColor;
  const borderRadius = mergedConfig.borderRadius === "none" ? "0px" : 
                       mergedConfig.borderRadius === "sm" ? "4px" : 
                       mergedConfig.borderRadius === "lg" ? "12px" : "8px"; // md

  const sectionSpacingClass = mergedConfig.sectionSpacing === "compact" ? "space-y-3" : 
                              mergedConfig.sectionSpacing === "spacious" ? "space-y-7" : "space-y-5"; // normal

  // Padding margin
  const paddingStyle = mergedConfig.pageMargin === "compact" ? "1.0cm" : 
                        mergedConfig.pageMargin === "wide" ? "1.8cm" : "1.4cm"; // normal

  // Font typography classes mapping
  const fontClass = mergedConfig.fontFamily === "serif" ? "font-serif" : 
                    mergedConfig.fontFamily === "mono" ? "font-mono" : 
                    mergedConfig.fontFamily === "montserrat" ? "font-sans font-medium" : 
                    mergedConfig.fontFamily === "playfair" ? "font-serif font-light" :
                    mergedConfig.fontFamily === "outfit" ? "font-sans font-normal" : "font-sans";

  const fontSizeClass = mergedConfig.fontSize === "sm" ? "text-[11px]" :
                        mergedConfig.fontSize === "lg" ? "text-[14px]" : "text-[13px]"; // base/normal

  const headingSizeClass = mergedConfig.fontSize === "sm" ? "text-xs" :
                           mergedConfig.fontSize === "lg" ? "text-base" : "text-sm"; 

  // Helpers to fetch section data
  const getSection = (type: string) => resume.sections.find((s) => s.sectionType === type);
  
  const personal = getSection("personal")?.content || {};
  const isPersonalVisible = getSection("personal")?.content?.isVisible !== false;

  const summary = getSection("summary")?.content || {};
  const isSummaryVisible = getSection("summary")?.content?.isVisible !== false && summary.text;

  const education = getSection("education")?.content || [];
  const isEducationVisible = getSection("education")?.content?.isVisible !== false && education.length > 0;

  const experience = getSection("experience")?.content || [];
  const isExperienceVisible = getSection("experience")?.content?.isVisible !== false && experience.length > 0;

  const internships = getSection("internships")?.content || [];
  const isInternshipsVisible = getSection("internships")?.content?.isVisible !== false && internships.length > 0;

  const projects = getSection("projects")?.content || [];
  const isProjectsVisible = getSection("projects")?.content?.isVisible !== false && projects.length > 0;

  const skills = getSection("skills")?.content || [];
  const isSkillsVisible = getSection("skills")?.content?.isVisible !== false && skills.length > 0;

  const certifications = getSection("certifications")?.content || [];
  const isCertificationsVisible = getSection("certifications")?.content?.isVisible !== false && certifications.length > 0;

  const languages = getSection("languages")?.content || [];
  const isLanguagesVisible = getSection("languages")?.content?.isVisible !== false && languages.length > 0;

  const achievements = getSection("achievements")?.content || [];
  const isAchievementsVisible = getSection("achievements")?.content?.isVisible !== false && achievements.length > 0;

  const interests = getSection("interests")?.content || [];
  const isInterestsVisible = getSection("interests")?.content?.isVisible !== false && interests.length > 0;

  const references = getSection("references")?.content || [];
  const isReferencesVisible = getSection("references")?.content?.isVisible !== false && references.length > 0;

  const custom = getSection("custom_sections")?.content || [];
  const isCustomVisible = getSection("custom_sections")?.content?.isVisible !== false && custom.length > 0;

  // Render headers with custom borders/dividers
  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => {
    const isSolid = mergedConfig.dividerStyle !== "none";
    let borderStyleClass = "border-solid";
    if (mergedConfig.dividerStyle === "dashed") borderStyleClass = "border-dashed";
    if (mergedConfig.dividerStyle === "double") borderStyleClass = "border-double";
    
    const iconWrapper = mergedConfig.iconStyle === "none" ? null : (
      <span className={cn(
        "shrink-0 flex items-center justify-center p-1",
        mergedConfig.iconStyle === "circle" ? "rounded-full bg-zinc-100 dark:bg-zinc-800 text-indigo-500" :
        mergedConfig.iconStyle === "square" ? "rounded bg-zinc-150 dark:bg-zinc-800 text-indigo-500" : ""
      )} style={{ color: primaryColor }}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-3.5 w-3.5" })}
      </span>
    );

    return (
      <div className="space-y-1 mb-2 mt-4 break-inside-avoid text-left">
        <h3 className={cn("font-bold tracking-wide uppercase flex items-center gap-2", headingSizeClass)} style={{ color: primaryColor }}>
          {iconWrapper}
          <span>{title}</span>
        </h3>
        {isSolid && (
          <div 
            className={cn("border-t", borderStyleClass)} 
            style={{ 
              borderColor: `${primaryColor}40`, 
              borderWidth: mergedConfig.dividerStyle === "bold" ? "2.5px" : "1px" 
            }} 
          />
        )}
      </div>
    );
  };

  // Render personal avatar
  const renderAvatar = () => {
    if (!personal.avatarUrl || mergedConfig.photoStyle === "none") return null;

    const imgRotation = personal.avatarRotation || 0;
    const borderClass = mergedConfig.photoStyle === "circle" ? "rounded-full" :
                        mergedConfig.photoStyle === "rounded-square" ? "rounded-xl" : "rounded-none";

    return (
      <div className="shrink-0 flex justify-center items-center">
        <div 
          className={cn(
            "h-16 w-16 overflow-hidden border-2 shadow-sm bg-zinc-50 dark:bg-zinc-800 flex justify-center items-center",
            borderClass
          )}
          style={{ borderColor: primaryColor }}
        >
          <img
            src={personal.avatarUrl}
            alt="Profile Avatar"
            className="h-full w-full object-cover"
            style={{ transform: `rotate(${imgRotation}deg)` }}
          />
        </div>
      </div>
    );
  };

  // Render Header Styles
  const renderPersonalHeader = () => {
    if (!isPersonalVisible || !personal.fullName) return null;

    const avatar = renderAvatar();
    const style = mergedConfig.headerStyle;

    // Contact metadata nodes
    const contactNodes = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        {personal.email && (
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3 shrink-0" /> {personal.email}
          </span>
        )}
        {personal.phone && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" /> {personal.phone}
          </span>
        )}
        {personal.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" /> {personal.location}
          </span>
        )}
        {personal.website && (
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3 shrink-0" />
            <a href={personal.website} className="hover:underline">{personal.website}</a>
          </span>
        )}
        {personal.linkedinUrl && (
          <span className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3 shrink-0" /> LinkedIn
          </span>
        )}
        {personal.githubUrl && (
          <span className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3 shrink-0" /> GitHub
          </span>
        )}
      </div>
    );

    // Left Border Header style
    if (style === "left-border") {
      return (
        <div className="flex items-start gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-800/80 mb-4 text-left">
          {avatar}
          <div className="border-l-4 pl-4 flex-1 space-y-1.5" style={{ borderColor: primaryColor }}>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
              {personal.fullName}
            </h1>
            {personal.headline && (
              <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                {personal.headline}
              </p>
            )}
            {contactNodes}
          </div>
        </div>
      );
    }

    // Centered Minimal header
    if (style === "minimal" || mergedConfig.photoPosition === "center") {
      return (
        <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-150 dark:border-zinc-800/80 mb-4 space-y-2">
          {avatar}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
              {personal.fullName}
            </h1>
            {personal.headline && (
              <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase mt-1">
                {personal.headline}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
            {contactNodes}
          </div>
        </div>
      );
    }

    // Split Header: profile picture / text on left, contact nodes on right
    if (style === "split") {
      return (
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-800/80 mb-4 text-left">
          <div className="flex items-center gap-4">
            {mergedConfig.photoPosition === "left" && avatar}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
                {personal.fullName}
              </h1>
              {personal.headline && (
                <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase mt-0.5">
                  {personal.headline}
                </p>
              )}
            </div>
            {mergedConfig.photoPosition === "right" && avatar}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 text-right sm:max-w-[40%]">
            {personal.email && <span className="text-[11px] text-zinc-500">{personal.email}</span>}
            {personal.phone && <span className="text-[11px] text-zinc-500">{personal.phone}</span>}
            {personal.location && <span className="text-[11px] text-zinc-500">{personal.location}</span>}
            {personal.website && (
              <a href={personal.website} className="text-[11px] text-indigo-500 hover:underline">{personal.website}</a>
            )}
          </div>
        </div>
      );
    }

    // Colored Top Banner Header Style
    if (style === "banner") {
      return (
        <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden">
          <div 
            className="p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-4 text-left"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-4">
              {avatar}
              <div>
                <h1 className="text-2xl font-black tracking-tight">{personal.fullName}</h1>
                {personal.headline && (
                  <p className="text-xs font-medium tracking-widest uppercase opacity-85 mt-1">
                    {personal.headline}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end text-[11px] opacity-90 space-y-0.5 text-right shrink-0">
              {personal.email && <span>{personal.email}</span>}
              {personal.phone && <span>{personal.phone}</span>}
              {personal.location && <span>{personal.location}</span>}
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-2 flex justify-center text-[10px] text-zinc-400">
            {personal.website && <span className="mx-2">Website: {personal.website}</span>}
            {personal.linkedinUrl && <span className="mx-2">LinkedIn: {personal.linkedinUrl}</span>}
            {personal.githubUrl && <span className="mx-2">GitHub: {personal.githubUrl}</span>}
          </div>
        </div>
      );
    }

    // Default Compact format
    return (
      <div className="pb-3 border-b border-zinc-150 dark:border-zinc-800/80 mb-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>
              {personal.fullName}
            </h1>
            {personal.headline && (
              <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                {personal.headline}
              </p>
            )}
          </div>
          {avatar}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 mt-1">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>• {personal.phone}</span>}
          {personal.location && <span>• {personal.location}</span>}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!isSummaryVisible) return null;
    return (
      <div className="break-inside-avoid text-xs text-left leading-relaxed text-zinc-700 dark:text-zinc-300">
        <SectionHeader title="Professional Summary" icon={<Sparkles className="h-4 w-4" />} />
        <p className="opacity-95 leading-relaxed">{summary.text}</p>
      </div>
    );
  };

  // Unified lists layout renderer supporting vertical timelines
  const renderListEntries = (title: string, icon: React.ReactNode, items: any[], renderItem: (item: any, idx: number) => React.ReactNode) => {
    if (items.length === 0) return null;
    const drawTimeline = mergedConfig.timelineStyle !== "none";

    return (
      <div className="space-y-2 text-left">
        <SectionHeader title={title} icon={icon} />
        
        {drawTimeline ? (
          <div 
            className="pl-4 ml-2 border-l relative space-y-4"
            style={{ 
              borderColor: `${primaryColor}30`,
              borderStyle: mergedConfig.timelineStyle === "dashed" ? "dashed" : "solid",
              borderWidth: "1.5px"
            }}
          >
            {items.map((item, idx) => (
              <div key={item.id || idx} className="relative">
                {/* Visual Timeline Dot Node */}
                <div 
                  className="absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full border bg-white dark:bg-zinc-950 flex items-center justify-center shrink-0"
                  style={{ borderColor: primaryColor }}
                >
                  <div className="h-1 w-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                </div>
                {renderItem(item, idx)}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((item, idx) => renderItem(item, idx))}
          </div>
        )}
      </div>
    );
  };

  const renderExperience = () => {
    return renderListEntries(
      "Work Experience",
      <Briefcase className="h-4 w-4" />,
      experience,
      (item, idx) => (
        <div className="text-xs space-y-1 text-left break-inside-avoid">
          <div className="flex justify-between items-start font-semibold">
            <div>
              <span className="font-bold text-zinc-800 dark:text-zinc-100">{item.role || "Job Role"}</span>
              {item.company && <span className="text-zinc-400 font-medium"> at {item.company}</span>}
            </div>
            <span className="text-zinc-400 shrink-0 text-[11px] font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {item.duration}
            </span>
          </div>
          {item.location && <p className="text-[10px] text-zinc-400">{item.location}</p>}
          {item.description && (
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-line text-[11px] mt-1 opacity-90">
              {item.description}
            </p>
          )}
        </div>
      )
    );
  };

  const renderEducation = () => {
    return renderListEntries(
      "Education",
      <GraduationCap className="h-4 w-4" />,
      education,
      (item, idx) => (
        <div className="text-xs space-y-0.5 text-left break-inside-avoid">
          <div className="flex justify-between items-start font-semibold">
            <div>
              <span className="font-bold text-zinc-800 dark:text-zinc-100">{item.degree || "Degree"}</span>
              {item.major && <span className="text-zinc-400 font-medium"> in {item.major}</span>}
              {item.school && <span className="text-zinc-400 font-medium"> • {item.school}</span>}
            </div>
            <span className="text-zinc-400 shrink-0 text-[11px] font-medium">{item.duration}</span>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-450">
            {item.location && <span>{item.location}</span>}
            {item.gpa && <span className="font-semibold text-zinc-500">GPA: {item.gpa}</span>}
          </div>
        </div>
      )
    );
  };

  const renderInternships = () => {
    return renderListEntries(
      "Internships",
      <UserCheck className="h-4 w-4" />,
      internships,
      (item, idx) => (
        <div className="text-xs space-y-1 text-left break-inside-avoid">
          <div className="flex justify-between items-start font-semibold">
            <div>
              <span className="font-bold text-zinc-800 dark:text-zinc-100">{item.role || "Internship Role"}</span>
              {item.company && <span className="text-zinc-400 font-medium"> at {item.company}</span>}
            </div>
            <span className="text-zinc-400 shrink-0 text-[11px] font-medium">{item.duration}</span>
          </div>
          {item.description && (
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
              {item.description}
            </p>
          )}
        </div>
      )
    );
  };

  const renderProjects = () => {
    return renderListEntries(
      "Projects",
      <BookOpen className="h-4 w-4" />,
      projects,
      (item, idx) => (
        <div className="text-xs space-y-1 text-left break-inside-avoid">
          <div className="flex justify-between items-start font-semibold">
            <div className="font-bold text-zinc-800 dark:text-zinc-100">
              {item.title}
              {item.role && <span className="text-zinc-400 font-medium"> ({item.role})</span>}
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] hover:underline" style={{ color: primaryColor }}>
                Project URL
              </a>
            )}
          </div>
          {item.technologies && <p className="text-[10px] text-zinc-400 font-mono opacity-85">Stack: {item.technologies}</p>}
          {item.description && (
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
              {item.description}
            </p>
          )}
        </div>
      )
    );
  };

  // Render customizable skill components
  const renderSkills = () => {
    if (!isSkillsVisible) return null;

    const style = mergedConfig.skillStyle;

    // A. Standard text representation
    if (style === "text") {
      return (
        <div className="break-inside-avoid text-left">
          <SectionHeader title="Skills" icon={<Layers className="h-4 w-4" />} />
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            {skills.map((item: any, idx: number) => (
              <span key={idx}>
                {item.name} {item.proficiency ? `(${item.proficiency})` : ""}
                {idx < skills.length - 1 && <span className="text-zinc-300 mx-1">•</span>}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // B. Grouped Categories visual representation
    if (style === "categories") {
      // Group skills by category field
      const groups: Record<string, string[]> = {};
      skills.forEach((item: any) => {
        const cat = item.category || "General Core";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item.name + (item.proficiency ? ` (${item.proficiency})` : ""));
      });

      return (
        <div className="break-inside-avoid text-left space-y-2">
          <SectionHeader title="Skills Categories" icon={<Layers className="h-4 w-4" />} />
          <div className="space-y-2">
            {Object.entries(groups).map(([cat, list]) => (
              <div key={cat} className="text-xs">
                <span className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider block">{cat}</span>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5 leading-relaxed">
                  {list.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // C. Badges blocks
    if (style === "badges") {
      return (
        <div className="break-inside-avoid text-left">
          <SectionHeader title="Skills & Competencies" icon={<Layers className="h-4 w-4" />} />
          <div className="flex flex-wrap gap-1.5">
            {skills.map((item: any, idx: number) => (
              <span
                key={idx}
                className="text-[11px] border px-2 py-0.5 font-medium select-none text-zinc-800 dark:text-zinc-200"
                style={{ 
                  borderRadius,
                  backgroundColor: `${primaryColor}10`,
                  borderColor: `${primaryColor}25`
                }}
              >
                {item.name} {item.proficiency ? `(${item.proficiency})` : ""}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // Helper to extract a 1-5 scalar rating from text
    const getRating = (prof: string) => {
      const match = prof ? prof.match(/([1-5])/) : null;
      if (match) return parseInt(match[1]);
      
      const clean = (prof || "").toLowerCase();
      if (clean.includes("expert") || clean.includes("lead") || clean.includes("high")) return 5;
      if (clean.includes("advanced") || clean.includes("proficient")) return 4;
      if (clean.includes("intermediate") || clean.includes("mid")) return 3;
      if (clean.includes("beginner") || clean.includes("novice") || clean.includes("low")) return 2;
      return 4; // default
    };

    // D. Progress Track Bars
    if (style === "progress") {
      return (
        <div className="break-inside-avoid text-left space-y-2">
          <SectionHeader title="Skills Index" icon={<Layers className="h-4 w-4" />} />
          <div className="grid gap-2 sm:grid-cols-2">
            {skills.map((item: any, idx: number) => {
              const rating = getRating(item.proficiency);
              const pct = rating * 20;
              return (
                <div key={idx} className="space-y-0.5 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.name}</span>
                    <span className="text-zinc-400 font-medium">{item.proficiency || `${pct}%`}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                    <div 
                      className="h-full rounded" 
                      style={{ backgroundColor: primaryColor, width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // E. Stars or Dots Ratings
    const drawStars = style === "stars";
    return (
      <div className="break-inside-avoid text-left space-y-2.5">
        <SectionHeader title="Skills Strengths" icon={<Layers className="h-4 w-4" />} />
        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map((item: any, idx: number) => {
            const rating = getRating(item.proficiency);
            return (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate pr-2">{item.name}</span>
                <div className="flex gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const active = i < rating;
                    if (drawStars) {
                      return (
                        <Star 
                          key={i} 
                          className={cn("h-3 w-3", active ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-800")} 
                        />
                      );
                    } else {
                      return (
                        <div 
                          key={i} 
                          className="h-2 w-2 rounded-full" 
                          style={{ 
                            backgroundColor: active ? primaryColor : `${primaryColor}20` 
                          }} 
                        />
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCertifications = () => {
    if (!isCertificationsVisible) return null;
    return (
      <div className="space-y-2 text-left break-inside-avoid">
        <SectionHeader title="Certifications" icon={<FileBadge className="h-4 w-4" />} />
        <div className="space-y-2">
          {certifications.map((item: any, idx: number) => (
            <div key={item.id || idx} className="flex justify-between text-xs">
              <div>
                <span className="font-bold text-zinc-800 dark:text-zinc-100">{item.name}</span>
                {item.issuer && <span className="text-zinc-400"> by {item.issuer}</span>}
              </div>
              <span className="text-zinc-400 text-[10px] shrink-0 font-mono">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLanguages = () => {
    if (!isLanguagesVisible) return null;
    return (
      <div className="text-left break-inside-avoid">
        <SectionHeader title="Languages" icon={<Globe className="h-4 w-4" />} />
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {languages.map((item: any, idx: number) => (
            <span key={idx} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {item.name} {item.proficiency ? `(${item.proficiency})` : ""}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    if (!isAchievementsVisible) return null;
    return (
      <div className="space-y-2 text-left break-inside-avoid">
        <SectionHeader title="Achievements & Awards" icon={<Award className="h-4 w-4" />} />
        <div className="space-y-2 text-xs">
          {achievements.map((item: any, idx: number) => (
            <div key={item.id || idx} className="space-y-0.5">
              <p className="font-bold text-zinc-800 dark:text-zinc-100">{item.title}</p>
              {item.description && <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustom = () => {
    if (!isCustomVisible) return null;
    return (
      <div className="space-y-3">
        {custom.map((item: any, idx: number) => (
          <div key={item.id || idx} className="text-left break-inside-avoid text-xs">
            <SectionHeader title={item.sectionTitle || "Custom Section"} icon={<Bookmark className="h-4 w-4" />} />
            <p className="leading-relaxed opacity-95 text-[11px] whitespace-pre-line text-zinc-600 dark:text-zinc-400">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Rendering the panels dynamically based on styling layoutStyle
  const renderLayout = () => {
    const isSidebarLayout = mergedConfig.layoutStyle === "two-column" || 
                            mergedConfig.layoutStyle === "left-sidebar" || 
                            mergedConfig.layoutStyle === "right-sidebar";

    if (isSidebarLayout) {
      const isRightSidebar = mergedConfig.layoutStyle === "right-sidebar";
      
      const mainColumn = (
        <div className={cn("flex-1", sectionSpacingClass)}>
          {renderSummary()}
          {renderExperience()}
          {renderProjects()}
          {renderEducation()}
          {renderInternships()}
          {renderCustom()}
        </div>
      );

      const sidebarColumn = (
        <div 
          className={cn(
            "w-[6.8cm] shrink-0 p-4 border text-left", 
            sectionSpacingClass
          )} 
          style={{ 
            borderRadius,
            backgroundColor: `${primaryColor}05`, // Subtle color tint matching the primary color
            borderColor: `${primaryColor}15`
          }}
        >
          {renderSkills()}
          {renderCertifications()}
          {renderLanguages()}
          {renderAchievements()}
        </div>
      );

      return (
        <div className="flex flex-col md:flex-row gap-6 mt-4">
          {isRightSidebar ? (
            <>
              {mainColumn}
              {sidebarColumn}
            </>
          ) : (
            <>
              {sidebarColumn}
              {mainColumn}
            </>
          )}
        </div>
      );
    }

    // Default: Single Column Layout
    return (
      <div className={sectionSpacingClass}>
        {renderSummary()}
        {renderExperience()}
        {renderProjects()}
        {renderEducation()}
        {renderInternships()}
        {renderSkills()}
        {renderCertifications()}
        {renderLanguages()}
        {renderAchievements()}
        {renderCustom()}
      </div>
    );
  };

  // Dimension scaling calculation
  const widthDimension = paperSize === "letter" ? "21.59cm" : "21.0cm";
  const heightDimension = paperSize === "letter" ? "27.94cm" : "29.7cm";

  return (
    <div
      className={cn(
        "relative shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-all origin-top select-none print:shadow-none print:border-none",
        fontClass,
        fontSizeClass
      )}
      style={{
        width: widthDimension,
        minHeight: heightDimension,
        padding: paddingStyle,
        transform: `scale(${zoom})`,
        backgroundColor,
      }}
    >
      {renderPersonalHeader()}
      {renderLayout()}

      {/* Dotted Page break helpers (only visible inside digital web canvas layout preview, hidden in print mode) */}
      <div className="absolute inset-x-0 pointer-events-none print:hidden flex flex-col items-center justify-between" style={{ height: "100%", top: 0 }}>
        {/* A4 is roughly 1120px tall on typical 96DPI screens */}
        <div className="w-full border-b border-dashed border-indigo-500/20 absolute" style={{ top: "29.7cm" }}>
          <span className="absolute right-2 -top-4 text-[9px] font-bold uppercase tracking-wider text-indigo-500/40 bg-white px-2 rounded dark:bg-zinc-950">Page 1 Break</span>
        </div>
        <div className="w-full border-b border-dashed border-indigo-500/20 absolute" style={{ top: "59.4cm" }}>
          <span className="absolute right-2 -top-4 text-[9px] font-bold uppercase tracking-wider text-indigo-500/40 bg-white px-2 rounded dark:bg-zinc-950">Page 2 Break</span>
        </div>
      </div>
    </div>
  );
}
