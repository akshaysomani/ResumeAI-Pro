"use server";

import * as dbService from "@/services/dbService";
import type { Resume, SectionType } from "@/types";

export async function createResumeAction(
  userId: string,
  title: string,
  config: {
    templateId?: string;
    language?: string;
    colorTheme?: string;
    fontFamily?: string;
    paperSize?: string;
    pageMargin?: string;
    layoutStyle?: string;
    resumeType?: string;
  } = {}
): Promise<string> {
  return await dbService.createResume(userId, title, config);
}

export async function getResumeAction(resumeId: string): Promise<Resume | null> {
  const resume = await dbService.getResume(resumeId);
  if (!resume) return null;

  // Aggregate all child details into the sections representation for client convenience
  const personal = await dbService.getPersonalInformation(resumeId);
  const education = await dbService.getEducation(resumeId);
  const experience = await dbService.getExperience(resumeId);
  const internships = await dbService.getInternships(resumeId);
  const projects = await dbService.getProjects(resumeId);
  const skills = await dbService.getSkills(resumeId);
  const certifications = await dbService.getCertifications(resumeId);
  const languages = await dbService.getLanguages(resumeId);
  const achievements = await dbService.getAchievements(resumeId);
  const interests = await dbService.getInterests(resumeId);
  const references = await dbService.getReferences(resumeId);
  const publications = await dbService.getPublications(resumeId);
  const awards = await dbService.getAwards(resumeId);
  const volunteer = await dbService.getVolunteerExperience(resumeId);
  const custom = await dbService.getCustomSections(resumeId);

  // Re-assemble sections array in order
  resume.sections = [
    {
      id: "sec-personal",
      resumeId,
      sectionType: "personal",
      title: "Personal Information",
      orderIndex: 0,
      content: personal || {},
    },
    {
      id: "sec-summary",
      resumeId,
      sectionType: "summary",
      title: "Professional Summary",
      orderIndex: 1,
      content: { text: resume.description || "" },
    },
    {
      id: "sec-education",
      resumeId,
      sectionType: "education",
      title: "Education",
      orderIndex: 2,
      content: education,
    },
    {
      id: "sec-experience",
      resumeId,
      sectionType: "experience",
      title: "Work Experience",
      orderIndex: 3,
      content: experience,
    },
    {
      id: "sec-internships",
      resumeId,
      sectionType: "internships",
      title: "Internships",
      orderIndex: 4,
      content: internships,
    },
    {
      id: "sec-projects",
      resumeId,
      sectionType: "projects",
      title: "Projects",
      orderIndex: 5,
      content: projects,
    },
    {
      id: "sec-skills",
      resumeId,
      sectionType: "skills",
      title: "Core Skills",
      orderIndex: 6,
      content: skills,
    },
    {
      id: "sec-certifications",
      resumeId,
      sectionType: "certifications",
      title: "Certifications",
      orderIndex: 7,
      content: certifications,
    },
    {
      id: "sec-languages",
      resumeId,
      sectionType: "languages",
      title: "Languages",
      orderIndex: 8,
      content: languages,
    },
    {
      id: "sec-achievements",
      resumeId,
      sectionType: "achievements",
      title: "Achievements",
      orderIndex: 9,
      content: achievements,
    },
    {
      id: "sec-interests",
      resumeId,
      sectionType: "interests",
      title: "Interests",
      orderIndex: 10,
      content: interests,
    },
    {
      id: "sec-references",
      resumeId,
      sectionType: "references",
      title: "References",
      orderIndex: 11,
      content: references,
    },
    {
      id: "sec-publications",
      resumeId,
      sectionType: "publications",
      title: "Publications",
      orderIndex: 12,
      content: publications,
    },
    {
      id: "sec-awards",
      resumeId,
      sectionType: "awards",
      title: "Awards",
      orderIndex: 13,
      content: awards,
    },
    {
      id: "sec-volunteer",
      resumeId,
      sectionType: "volunteer_experience",
      title: "Volunteer Experience",
      orderIndex: 14,
      content: volunteer,
    },
    {
      id: "sec-custom",
      resumeId,
      sectionType: "custom_sections",
      title: "Custom Sections",
      orderIndex: 15,
      content: custom,
    },
  ];

  return resume;
}

export async function deleteResumeAction(resumeId: string): Promise<void> {
  await dbService.deleteResume(resumeId);
}

export async function archiveResumeAction(resumeId: string, isArchived: boolean): Promise<void> {
  await dbService.updateResumeMetadata(resumeId, { isArchived });
}

export async function favoriteResumeAction(resumeId: string, isFavorite: boolean): Promise<void> {
  await dbService.updateResumeMetadata(resumeId, { isFavorite });
}

export async function duplicateResumeAction(resumeId: string): Promise<string> {
  return await dbService.duplicateResume(resumeId);
}

export async function saveResumeFullAction(resumeId: string, resumeData: Partial<Resume>): Promise<void> {
  // 1. Save top-level resume metadata (excluding sections)
  const metadataToSave: any = {};
  if (resumeData.title !== undefined) metadataToSave.title = resumeData.title;
  if (resumeData.description !== undefined) metadataToSave.description = resumeData.description;
  if (resumeData.templateId !== undefined) metadataToSave.templateId = resumeData.templateId;
  if (resumeData.isPublic !== undefined) metadataToSave.isPublic = resumeData.isPublic;
  if (resumeData.atsScore !== undefined) metadataToSave.atsScore = resumeData.atsScore;
  if (resumeData.status !== undefined) metadataToSave.status = resumeData.status;
  if (resumeData.isFavorite !== undefined) metadataToSave.isFavorite = resumeData.isFavorite;
  if (resumeData.isArchived !== undefined) metadataToSave.isArchived = resumeData.isArchived;
  if (resumeData.colorTheme !== undefined) metadataToSave.colorTheme = resumeData.colorTheme;
  if (resumeData.fontFamily !== undefined) metadataToSave.fontFamily = resumeData.fontFamily;
  if (resumeData.paperSize !== undefined) metadataToSave.paperSize = resumeData.paperSize;
  if (resumeData.pageMargin !== undefined) metadataToSave.pageMargin = resumeData.pageMargin;
  if (resumeData.layoutStyle !== undefined) metadataToSave.layoutStyle = resumeData.layoutStyle;
  if (resumeData.resumeType !== undefined) metadataToSave.resumeType = resumeData.resumeType;
  if (resumeData.themeConfig !== undefined) metadataToSave.themeConfig = resumeData.themeConfig;

  await dbService.updateResumeMetadata(resumeId, metadataToSave);

  // 2. Iterate sections and save content to individual tables
  if (resumeData.sections) {
    for (const sec of resumeData.sections) {
      const type = sec.sectionType;
      const content = sec.content;

      switch (type) {
        case "personal":
          await dbService.savePersonalInformation(resumeId, content);
          break;
        case "summary":
          // The professional summary is stored inside resumes.description
          await dbService.updateResumeMetadata(resumeId, { description: content.text || "" });
          break;
        case "education":
          await dbService.saveEducation(resumeId, content);
          break;
        case "experience":
          await dbService.saveExperience(resumeId, content);
          break;
        case "internships":
          await dbService.saveInternships(resumeId, content);
          break;
        case "projects":
          await dbService.saveProjects(resumeId, content);
          break;
        case "skills":
          await dbService.saveSkills(resumeId, content);
          break;
        case "certifications":
          await dbService.saveCertifications(resumeId, content);
          break;
        case "languages":
          await dbService.saveLanguages(resumeId, content);
          break;
        case "achievements":
          await dbService.saveAchievements(resumeId, content);
          break;
        case "interests":
          await dbService.saveInterests(resumeId, content);
          break;
        case "references":
          await dbService.saveReferences(resumeId, content);
          break;
        case "publications":
          await dbService.savePublications(resumeId, content);
          break;
        case "awards":
          await dbService.saveAwards(resumeId, content);
          break;
        case "volunteer_experience":
          await dbService.saveVolunteerExperience(resumeId, content);
          break;
        case "custom_sections":
          await dbService.saveCustomSections(resumeId, content);
          break;
        default:
          break;
      }
    }
  }

  // 3. Create a snapshot history snapshot record via trigger trigger procedure
  try {
    await dbService.createVersionSnapshot(resumeId);
  } catch (err) {
    console.warn("Failed to create resume version snapshot:", err);
  }
}

export async function queryResumesAction(options: {
  userId: string;
  searchTerm?: string;
  sortBy?: "updated_at" | "created_at" | "title";
  sortOrder?: "asc" | "desc";
  filterStatus?: "draft" | "completed" | "archived" | "published" | "all";
  filterTemplate?: string;
  filterType?: string;
  limit?: number;
  offset?: number;
}) {
  return await dbService.queryResumes(options);
}
