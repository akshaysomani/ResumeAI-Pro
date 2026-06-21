import { db } from "@/lib/db";
import type {
  Resume,
  PersonalInformation,
  Education,
  Experience,
  Internship,
  Project,
  Skill,
  Certification,
  Achievement,
  Language,
  Interest,
  Reference,
  Publication,
  Award,
  VolunteerExperience,
  CustomSection,
} from "@/types";

// ==========================================
// RESUME CRUD & CORE OPERATIONS
// ==========================================

/**
 * Ensures the user has a profile row in the local PostgreSQL database.
 * Supabase Cloud manages auth.users and may have a profiles table there,
 * but the local database (via DATABASE_URL) is separate. Tables like
 * `resumes` have a foreign key `user_id → profiles.id`, so we must
 * guarantee a local profile row exists before inserting dependent records.
 */
export async function ensureLocalProfile(userId: string, email?: string, fullName?: string): Promise<void> {
  await db.query(
    `INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (id) DO NOTHING`,
    [userId, email || "", fullName || "User Account"]
  );
}

export async function createResume(
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
  // Guarantee user profile exists in local DB before FK insert
  await ensureLocalProfile(userId);

  const query = `
    INSERT INTO public.resumes (
      user_id, title, template_id, status, is_favorite, is_archived,
      color_theme, font_family, paper_size, page_margin, layout_style, resume_type, is_public
    )
    VALUES ($1, $2, $3, 'draft', false, false, $4, $5, $6, $7, $8, $9, false)
    RETURNING id
  `;
  const values = [
    userId,
    title,
    config.templateId || "modern",
    config.colorTheme || "indigo",
    config.fontFamily || "sans",
    config.paperSize || "A4",
    config.pageMargin || "normal",
    config.layoutStyle || "single-column",
    config.resumeType || "custom",
  ];
  const { rows } = await db.query(query, values);
  return rows[0].id;
}

export async function getResume(resumeId: string): Promise<Resume | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(resumeId)) {
    return null;
  }

  const query = `SELECT * FROM public.resumes WHERE id = $1`;
  const { rows } = await db.query(query, [resumeId]);
  if (rows.length === 0) return null;
  const row = rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || "",
    templateId: row.template_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPublic: row.is_public,
    sections: [],
    atsScore: row.ats_score,
    status: row.status,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    colorTheme: row.color_theme,
    fontFamily: row.font_family,
    paperSize: row.paper_size,
    pageMargin: row.page_margin,
    layoutStyle: row.layout_style,
    resumeType: row.resume_type,
    themeConfig: row.theme_config,
  };
}

export async function deleteResume(resumeId: string): Promise<void> {
  const query = `DELETE FROM public.resumes WHERE id = $1`;
  await db.query(query, [resumeId]);
}

export async function updateResumeMetadata(
  resumeId: string,
  data: Partial<Omit<Resume, "id" | "userId" | "sections">>
): Promise<void> {
  const keys = Object.keys(data);
  if (keys.length === 0) return;

  const sets: string[] = [];
  const values: any[] = [];

  // Helper mapping JS camelCase to SQL snake_case keys
  const keyMapping: Record<string, string> = {
    title: "title",
    description: "description",
    templateId: "template_id",
    isPublic: "is_public",
    atsScore: "ats_score",
    status: "status",
    isFavorite: "is_favorite",
    isArchived: "is_archived",
    colorTheme: "color_theme",
    fontFamily: "font_family",
    paperSize: "paper_size",
    pageMargin: "page_margin",
    layoutStyle: "layout_style",
    resumeType: "resume_type",
    themeConfig: "theme_config",
  };

  keys.forEach((key) => {
    const dbKey = keyMapping[key];
    if (dbKey) {
      const val = key === "themeConfig" ? JSON.stringify((data as any)[key]) : (data as any)[key];
      values.push(val);
      sets.push(`${dbKey} = $${values.length}`);
    }
  });

  if (sets.length === 0) return;

  values.push(resumeId);
  const query = `
    UPDATE public.resumes 
    SET ${sets.join(", ")}, updated_at = NOW() 
    WHERE id = $${values.length}
  `;

  await db.query(query, values);
}

// Query Resumes with Search, Sort, Filtering and Pagination
export async function queryResumes(options: {
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
  const {
    userId,
    searchTerm = "",
    sortBy = "updated_at",
    sortOrder = "desc",
    filterStatus = "all",
    filterTemplate = "",
    filterType = "",
    limit = 10,
    offset = 0,
  } = options;

  let query = `
    SELECT * FROM public.resumes
    WHERE user_id = $1
  `;
  const values: any[] = [userId];

  // Apply search string
  if (searchTerm) {
    values.push(`%${searchTerm}%`);
    query += ` AND title ILIKE $${values.length}`;
  }

  // Apply status filter
  if (filterStatus !== "all") {
    if (filterStatus === "archived") {
      query += ` AND is_archived = true`;
    } else {
      values.push(filterStatus);
      query += ` AND status = $${values.length} AND is_archived = false`;
    }
  } else {
    query += ` AND is_archived = false`; // Default hide archived ones on basic load
  }

  // Apply template filter
  if (filterTemplate) {
    values.push(filterTemplate);
    query += ` AND template_id = $${values.length}`;
  }

  // Apply type filter
  if (filterType) {
    values.push(filterType);
    query += ` AND resume_type = $${values.length}`;
  }

  // Sanitize sort columns dynamically
  const safeSortBy = ["updated_at", "created_at", "title"].includes(sortBy) ? sortBy : "updated_at";
  const safeOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  query += ` ORDER BY ${safeSortBy} ${safeOrder}`;

  values.push(limit);
  query += ` LIMIT $${values.length}`;

  values.push(offset);
  query += ` OFFSET $${values.length}`;

  const { rows } = await db.query(query, values);
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || "",
    templateId: row.template_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPublic: row.is_public,
    atsScore: row.ats_score,
    status: row.status,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    colorTheme: row.color_theme,
    fontFamily: row.font_family,
    paperSize: row.paper_size,
    pageMargin: row.page_margin,
    layoutStyle: row.layout_style,
    resumeType: row.resume_type,
  }));
}

// ==========================================
// RESUME SUB-SECTIONS DATABASE SYNC
// ==========================================

// Personal Information
export async function getPersonalInformation(resumeId: string): Promise<PersonalInformation | null> {
  const query = `SELECT * FROM public.personal_information WHERE resume_id = $1`;
  const { rows } = await db.query(query, [resumeId]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    resumeId: row.resume_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    website: row.website,
    linkedinUrl: row.linkedin_url,
    githubUrl: row.github_url,
    portfolioUrl: row.portfolio_url,
  };
}

export async function savePersonalInformation(resumeId: string, info: Omit<PersonalInformation, "id" | "resumeId">): Promise<void> {
  const query = `
    INSERT INTO public.personal_information (resume_id, full_name, email, phone, location, website, linkedin_url, github_url, portfolio_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (resume_id) 
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      location = EXCLUDED.location,
      website = EXCLUDED.website,
      linkedin_url = EXCLUDED.linkedin_url,
      github_url = EXCLUDED.github_url,
      portfolio_url = EXCLUDED.portfolio_url
  `;
  const values = [
    resumeId,
    info.fullName || null,
    info.email || null,
    info.phone || null,
    info.location || null,
    info.website || null,
    info.linkedinUrl || null,
    info.githubUrl || null,
    info.portfolioUrl || null,
  ];
  await db.query(query, values);
}

// Education History
export async function getEducation(resumeId: string): Promise<Education[]> {
  const query = `SELECT * FROM public.education WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    school: row.school,
    degree: row.degree || "",
    major: row.major || "",
    gpa: row.gpa || "",
    duration: row.duration || "",
    orderIndex: row.order_index,
    location: row.location || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    currentlyStudying: row.currently_studying || false,
    description: row.description || "",
  }));
}

export async function saveEducation(resumeId: string, items: Omit<Education, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.education WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.education (
          resume_id, school, degree, major, gpa, duration, order_index,
          location, start_date, end_date, currently_studying, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      const values = [
        resumeId,
        item.school,
        item.degree || null,
        item.major || null,
        item.gpa || null,
        item.duration || null,
        i,
        item.location || null,
        item.startDate || null,
        item.endDate || null,
        item.currentlyStudying || false,
        item.description || null,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Experience History
export async function getExperience(resumeId: string): Promise<Experience[]> {
  const query = `SELECT * FROM public.experience WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    company: row.company,
    role: row.role,
    duration: row.duration || "",
    description: row.description || "",
    orderIndex: row.order_index,
    employmentType: row.employment_type || "",
    location: row.location || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    currentlyWorking: row.currently_working || false,
    achievements: row.achievements || "",
  }));
}

export async function saveExperience(resumeId: string, items: Omit<Experience, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.experience WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.experience (
          resume_id, company, role, duration, description, order_index,
          employment_type, location, start_date, end_date, currently_working, achievements
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      const values = [
        resumeId,
        item.company,
        item.role,
        item.duration || null,
        item.description || null,
        i,
        item.employmentType || null,
        item.location || null,
        item.startDate || null,
        item.endDate || null,
        item.currentlyWorking || false,
        item.achievements || null,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Internships History
export async function getInternships(resumeId: string): Promise<Internship[]> {
  const query = `SELECT * FROM public.internships WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    company: row.company,
    role: row.role,
    duration: row.duration || "",
    description: row.description || "",
    orderIndex: row.order_index,
    employmentType: row.employment_type || "",
    location: row.location || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    currentlyWorking: row.currently_working || false,
    achievements: row.achievements || "",
  }));
}

export async function saveInternships(resumeId: string, items: Omit<Internship, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.internships WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.internships (
          resume_id, company, role, duration, description, order_index,
          employment_type, location, start_date, end_date, currently_working, achievements
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      const values = [
        resumeId,
        item.company,
        item.role,
        item.duration || null,
        item.description || null,
        i,
        item.employmentType || null,
        item.location || null,
        item.startDate || null,
        item.endDate || null,
        item.currentlyWorking || false,
        item.achievements || null,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Projects History
export async function getProjects(resumeId: string): Promise<Project[]> {
  const query = `SELECT * FROM public.projects WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    title: row.title,
    role: row.role || "",
    url: row.url || "",
    description: row.description || "",
    orderIndex: row.order_index,
    technologies: row.technologies || "",
    githubUrl: row.github_url || "",
    liveUrl: row.live_url || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
  }));
}

export async function saveProjects(resumeId: string, items: Omit<Project, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.projects WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.projects (
          resume_id, title, role, url, description, order_index,
          technologies, github_url, live_url, start_date, end_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      const values = [
        resumeId,
        item.title,
        item.role || null,
        item.url || null,
        item.description || null,
        i,
        item.technologies || null,
        item.githubUrl || null,
        item.liveUrl || null,
        item.startDate || null,
        item.endDate || null,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Skills History
export async function getSkills(resumeId: string): Promise<Skill[]> {
  const query = `SELECT * FROM public.skills WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    name: row.name,
    proficiency: row.proficiency || "",
    category: row.category || "",
    orderIndex: row.order_index,
    yearsOfExperience: row.years_of_experience || 0,
    isPrimary: row.is_primary || false,
    isSecondary: row.is_secondary || false,
  }));
}

export async function saveSkills(resumeId: string, items: Omit<Skill, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.skills WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.skills (
          resume_id, name, proficiency, category, order_index,
          years_of_experience, is_primary, is_secondary
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      const values = [
        resumeId,
        item.name,
        item.proficiency || null,
        item.category || null,
        i,
        item.yearsOfExperience || null,
        item.isPrimary || false,
        item.isSecondary || false,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Certifications History
export async function getCertifications(resumeId: string): Promise<Certification[]> {
  const query = `SELECT * FROM public.certifications WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    name: row.name,
    issuer: row.issuer || "",
    date: row.date || "",
    url: row.url || "",
    orderIndex: row.order_index,
    issueDate: row.issue_date || "",
    expiryDate: row.expiry_date || "",
    credentialId: row.credential_id || "",
    credentialUrl: row.credential_url || "",
  }));
}

export async function saveCertifications(resumeId: string, items: Omit<Certification, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.certifications WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.certifications (
          resume_id, name, issuer, date, url, order_index,
          issue_date, expiry_date, credential_id, credential_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      const values = [
        resumeId,
        item.name,
        item.issuer || null,
        item.date || null,
        item.url || null,
        i,
        item.issueDate || null,
        item.expiryDate || null,
        item.credentialId || null,
        item.credentialUrl || null,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Achievements History
export async function getAchievements(resumeId: string): Promise<Achievement[]> {
  const query = `SELECT * FROM public.achievements WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    title: row.title,
    description: row.description || "",
    orderIndex: row.order_index,
  }));
}

export async function saveAchievements(resumeId: string, items: Omit<Achievement, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.achievements WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.achievements (resume_id, title, description, order_index)
        VALUES ($1, $2, $3, $4)
      `;
      const values = [resumeId, item.title, item.description || null, i];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Languages History
export async function getLanguages(resumeId: string): Promise<Language[]> {
  const query = `SELECT * FROM public.languages WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    name: row.name,
    proficiency: row.proficiency || "",
    orderIndex: row.order_index,
    reading: row.reading || "",
    writing: row.writing || "",
    speaking: row.speaking || "",
  }));
}

export async function saveLanguages(resumeId: string, items: Omit<Language, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.languages WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.languages (resume_id, name, proficiency, order_index, reading, writing, speaking)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      const values = [
        resumeId,
        item.name,
        item.proficiency || null,
        i,
        item.reading || null,
        item.writing || null,
        item.speaking || null,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Interests History
export async function getInterests(resumeId: string): Promise<Interest[]> {
  const query = `SELECT * FROM public.interests WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    name: row.name,
    orderIndex: row.order_index,
  }));
}

export async function saveInterests(resumeId: string, items: Omit<Interest, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.interests WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.interests (resume_id, name, order_index)
        VALUES ($1, $2, $3)
      `;
      const values = [resumeId, item.name, i];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// References History
export async function getReferences(resumeId: string): Promise<Reference[]> {
  const query = `SELECT * FROM public.references WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    name: row.name,
    title: row.title || "",
    company: row.company || "",
    contact: row.contact || "",
    orderIndex: row.order_index,
  }));
}

export async function saveReferences(resumeId: string, items: Omit<Reference, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.references WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.references (resume_id, name, title, company, contact, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      const values = [
        resumeId,
        item.name,
        item.title || null,
        item.company || null,
        item.contact || null,
        i,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Publications History
export async function getPublications(resumeId: string): Promise<Publication[]> {
  const query = `SELECT * FROM public.publications WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    title: row.title,
    publisher: row.publisher || "",
    date: row.date || "",
    url: row.url || "",
    description: row.description || "",
    orderIndex: row.order_index,
  }));
}

export async function savePublications(resumeId: string, items: Omit<Publication, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.publications WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.publications (resume_id, title, publisher, date, url, description, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      const values = [
        resumeId,
        item.title,
        item.publisher || null,
        item.date || null,
        item.url || null,
        item.description || null,
        i,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Awards History
export async function getAwards(resumeId: string): Promise<Award[]> {
  const query = `SELECT * FROM public.awards WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    title: row.title,
    issuer: row.issuer || "",
    date: row.date || "",
    description: row.description || "",
    orderIndex: row.order_index,
  }));
}

export async function saveAwards(resumeId: string, items: Omit<Award, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.awards WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.awards (resume_id, title, issuer, date, description, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      const values = [
        resumeId,
        item.title,
        item.issuer || null,
        item.date || null,
        item.description || null,
        i,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Volunteer Experience History
export async function getVolunteerExperience(resumeId: string): Promise<VolunteerExperience[]> {
  const query = `SELECT * FROM public.volunteer_experience WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    organization: row.organization,
    role: row.role,
    duration: row.duration || "",
    description: row.description || "",
    orderIndex: row.order_index,
  }));
}

export async function saveVolunteerExperience(resumeId: string, items: Omit<VolunteerExperience, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.volunteer_experience WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.volunteer_experience (resume_id, organization, role, duration, description, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      const values = [
        resumeId,
        item.organization,
        item.role,
        item.duration || null,
        item.description || null,
        i,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Custom Sections History
export async function getCustomSections(resumeId: string): Promise<CustomSection[]> {
  const query = `SELECT * FROM public.custom_sections WHERE resume_id = $1 ORDER BY order_index ASC`;
  const { rows } = await db.query(query, [resumeId]);
  return rows.map((row) => ({
    id: row.id,
    resumeId: row.resume_id,
    sectionTitle: row.section_title,
    content: row.content,
    orderIndex: row.order_index,
  }));
}

export async function saveCustomSections(resumeId: string, items: Omit<CustomSection, "id" | "resumeId">[]): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM public.custom_sections WHERE resume_id = $1", [resumeId]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const query = `
        INSERT INTO public.custom_sections (resume_id, section_title, content, order_index)
        VALUES ($1, $2, $3, $4)
      `;
      const values = [resumeId, item.sectionTitle, item.content, i];
      await client.query(query, values);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// ==========================================
// STORED PROCEDURE TRIGGERS WRAPPERS
// ==========================================

export async function duplicateResume(resumeId: string): Promise<string> {
  const query = `SELECT public.duplicate_resume($1) as new_id`;
  const { rows } = await db.query(query, [resumeId]);
  return rows[0].new_id;
}

export async function createVersionSnapshot(resumeId: string): Promise<string> {
  const query = `SELECT public.create_resume_version_snapshot($1) as version_id`;
  const { rows } = await db.query(query, [resumeId]);
  return rows[0].version_id;
}
